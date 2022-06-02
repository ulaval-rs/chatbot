const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/LocationPage.html');
});

io.on('connection', (socket) => {
    console.log('User has connected');
    socket.on('disconnect', () => {
        console.log('User has disconnected');
    });
    socket.on('location', (msg) => {
        console.log('message: ' + msg);
    });
});


server.listen(3000, () => {
    console.log('listening on *:3000');
});