const path = require('path');
const http = require('http');
const express = require('express');
const socketIO = require('socket.io');

const {generateMessage} = require('./utils/message');
const {isRealString} = require('./utils/validation');
const {Users,User} = require('./utils/users'); 
const {Rooms,Room} = require('./utils/rooms');

const publicPath = path.join(__dirname, '../public');
const port = process.env.PORT || 3000
var app = express();
var server = http.createServer(app);
var io = socketIO(server);
var users = new Users();
var rooms = new Rooms();

app.use(express.static(publicPath));

io.on('connection',(socket) => {

    socket.on('join', () => {
        console.log(`User ${socket.id} is connected to server.`);
        io.to(socket.id).emit('updateRoomList', rooms.getRoomList());
    });

    socket.on('joinRoom', (params, callback) => {
        if (params.btn == "create"){
            if (!isRealString(params.name) || !isRealString(params.room)){
                return callback('Name and room are required.');
            }
        } else {
            if (!isRealString(params.name)){
                return callback('Name is required.');
            }
            params.room = params.btn;
        }
        

        socket.join(params.room);
        users.removeUser(socket.id);

        var user = new User(socket.id, params.name, params.room);
        users.addUser(user);

        var room = rooms.getRoom(user.room);
        if (room) {
            room.addUser(user);
        } else {
            var room = rooms.addRoom(user.room, user.room); //!!!! user room id sa zatial neriesi
            room.addUser(user);
        }

        io.to(params.room).emit('updateUserList', users.getUserList(params.room), room.whoseTurn());
        io.emit('updateRoomList', rooms.getRoomList());

        console.log(`${params.name} connected to [Room ${params.room}].`);

        callback();
    });

    socket.on('changeTurnByCheck', (id) => {
        var user = users.getUser(socket.id);
        var room = rooms.getRoom(user.room);
        room.changeTurn(id);
        io.to(user.room).emit('updateUserList', users.getUserList(user.room), room.whoseTurn(), false);
    });

    socket.on('playerIdEvent', () => {
        var user = users.getUser(socket.id);
        var room = rooms.getRoom(user.room);

        if (user) {
            io.to(socket.id).emit('playerId',user.playerNumber, user.name, room.users);
        }
    });

    socket.on('clickEvent', (position,playerN) => {
        var user = users.getUser(socket.id);

        if (user && user.myMove) {
            var room = rooms.getRoom(user.room);
            room.changeTurn(null);
            io.to(user.room).emit('click',position,playerN,room.whoseTurn());
            io.to(user.room).emit('updateUserList', users.getUserList(user.room), room.whoseTurn(), false);
        }
    });

    socket.on('promoteEvent', (position,id) => {
        var user = users.getUser(socket.id);

        if (user) {
            io.to(user.room).emit('promote',position,id);
        }
    });

    socket.on('createMessage', (message, callback) => {
        var user = users.getUser(socket.id);

        if (user && isRealString(message.text)) {
            io.to(user.room).emit('newMessage',generateMessage(user.name, message.text));
        }

        callback();
    });

    socket.on('disconnect', () => {
        var user = users.removeUser(socket.id);

        if (user) {
            rooms.removeUser(socket.id);
            io.to(user.room).emit('updateUserList', users.getUserList(user.room), null); //TUTO BY NEMALO AKTUALIZOVAT LEN ZOZNAM HRACOV ALE AJ NEJAK KOMPLEXNEJSIE ZAREAGOVAT NA ODCHOD HRACA
            io.emit('updateRoomList', rooms.getRoomList(user.room));

            console.log(`${user.name} disconnected from [Room ${user.room}].`);
        }
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});













