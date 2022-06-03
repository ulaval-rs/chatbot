const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const axios = require("axios");
const io = new Server(server);
let intermediate_api_url = "http://127.0.0.1:3000"

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/LocationPage.html');
});

io.on('connection', (socket) => {
    console.log('User has connected');
    socket.on('disconnect', () => {
        console.log('User has disconnected');
    });
    socket.on('location', (msg) => {
        axios.post(intermediate_api_url + "/location", {
            location: msg
        })
            .then(function (response) {
                console.log(response);
            })
            .catch(function (error) {
                console.log(error);
            });
    });
});


server.listen(3001, () => {
    console.log('listening on *:3001');
});