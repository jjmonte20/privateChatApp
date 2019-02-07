var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);

var PORT = process.env.PORT || 3000;

server.listen(PORT);

app.get("/", function(req, res) {
    res.sendFile(__dirname + "/index.html");
});

io.sockets.on('connection', function(socket){
    socket.on('send message', function(data){
        io.sockets.emit('new message', data);
    });
});