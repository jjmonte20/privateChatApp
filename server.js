var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var nicknames = [];

var PORT = process.env.PORT || 3000;

server.listen(PORT);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

io.sockets.on('connection', function(socket){

    socket.on('new user', function(data, callback){
        if (nicknames.indexOf(data) != -1){
            callback(false);
        } else {
            callback(true);
            socket.nickname = data;
            nicknames.push(socket.nickname);
            io.sockets.emit('usernames', nicknames);
        }
    });

    socket.on('send message', function(data){
        io.sockets.emit('new message', data);
    });
});