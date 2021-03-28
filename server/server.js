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
// rooms.rooms = [new Room('A#123','A',[new User('1','Palo','A#123')]),
// new Room('A#123','A',[new User('1','Palo','A#123')]),
// new Room('A#123','A',[new User('1','Palo','A#123')]),
// new Room('A#123','A',[new User('1','Palo','A#123')])];

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
        users.addUser(user.id, user.name, user.room);

        var room = rooms.getRoom(user.room);
        if (room) {
            room.addUser(user.id, user.name, user.room);
        } else {
            var room = rooms.addRoom(user.room, user.room); //!!!! user room id sa zatial neriesi
            room.addUser(user.id, user.name, user.room);
        }

        io.to(params.room).emit('updateUserList', users.getUserList(params.room));
        io.emit('updateRoomList', rooms.getRoomList());

        console.log(`${params.name} connected to [Room ${params.room}].`);

        callback();
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
            io.to(user.room).emit('updateUserList', users.getUserList(user.room));
            io.emit('updateRoomList', rooms.getRoomList(user.room));

            console.log(`${user.name} disconnected from [Room ${user.room}].`);
        }
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});













