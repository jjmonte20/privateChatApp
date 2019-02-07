// Boilerplate text for socket.io to work with mongoose
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var mongoose = require('mongoose');
// a list of users
var users = {};

var PORT = process.env.PORT || 3000;

server.listen(PORT);

var databaseUri = 'mongodb://localhost/chat';

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
} else {
    mongoose.connect(databaseUri);
}

// chat schema
var chatSchema = mongoose.Schema({
    nick: String,
    msg: String,
    created: {type: Date, default: Date.now}
});

var Chat = mongoose.model('Message', chatSchema);

// get route for the homepage
app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

// whenever socket connects, send this function
io.sockets.on('connection', function(socket){
    // shorthand for Chat.find
    var query = Chat.find({});
    // in this case, we're sending a Chat.find for all messages, limiting to the 8 most recent, and sorting in reverse
    query.sort('-created').limit(8).exec(function(err, docs) {
        if (err) throw err;
        // emitting to the front end old messages, passing in the data from the database
        socket.emit('load old msgs', docs);
    });
    // whenever we make a new user, make a new function that has the data send, and a callback of true or falses
    socket.on('new user', function(data, callback){
        if (data in users){
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            users[socket.nickname] = socket;
            updateNicknames();
        }
    });

    // on send message run this function with data and a callback function
    socket.on('send message', function(data, callback){
        var msg = data.trim();
        // check if this is intended to be public or private
        if (msg.substr(0,3) === "/w ") {
            msg = msg.substr(3);
            var ind = msg.indexOf(' ');
            // checking that there is a message to whisper
            if(ind !== -1) {
                var name = msg.substring(0, ind);
                var msg = msg.substring(ind + 1);
                // checking that the user is whispering to another user
                if (name in users) {
                    users[name].emit('whisper', { msg: msg, nick: socket.nickname })
                    // console.log('whisper');
                } else {
                    callback('error: enter a valid user');
                }
            } else {
                callback('Err: Please enter a message for you whisper');
            }
        } else {
            // if not a whisper, send to everyone
            var newMsg = new Chat({msg: msg, nick: socket.nickname});
            newMsg.save(function(err){
                if (err) throw err;
                io.sockets.emit('new message', { msg: msg, nick: socket.nickname });
            });
        }
    });


    function updateNicknames(){
        io.sockets.emit('usernames', Object.keys(users));
    }

    // on disconnect, check if the user input a username or not
    socket.on('disconnect', function(data){
        // if they did not, don't worry about it, there isn't much needed to fix
        if (!socket.nickname) {
            return;
        } else {
            // if they did, delete the specific user this person was, they're not needed, then update the username
            delete users[socket.nickname];
            updateNicknames();
        }
    });
});