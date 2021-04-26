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
        console.log(`SocketID: ${socket.id} is connected to server.`);
    });

    socket.on('get_available_rooms', () => {
        io.to(socket.id).emit('updateRoomList', rooms.getRoomList());
    })

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
        users.removeUser(params.uuid);

        var user = new User(params.uuid, params.name, params.room);
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

        console.log(`${params.name}: [${params.uuid}] connected to [Room ${params.room}].`);

        callback();
    });

    // dispatch starting game
    socket.on('listOfUsers', (uuid, callback) => {
        var user = users.getUser(uuid);
        if (user) {
            var room = rooms.getRoom(user.room);
            var userList = users.getUserList(room.id);
            io.to(user.room).emit('getUsers', userList);
        }

    });

    socket.on('createMessage', (message, uuid, callback) => {
        const user = users.getUser(uuid);
        if(!message || !user){
            console.log(`Sending message failed, user not found or message is empty`)
            return;
        }
        io.to(user.room).emit('newMessage',generateMessage(user.name, message));
    });

    socket.on('disconnect', () => {
        console.log(`Lost connection for: ${socket.id}`)
        // toto sa nikdy neudeje, lebo id-cko usera uz je UUID a nie socker.id
        /*var user = users.removeUser(socket.id);

        if (user) {
            rooms.removeUser(socket.id);
            io.to(user.room).emit('updateUserList', users.getUserList(user.room));
            io.emit('updateRoomList', rooms.getRoomList(user.room));

            console.log(`${user.name} disconnected from [Room ${user.room}].`);
        }*/
    });
});

server.listen(port, () => {
    console.log(`Server is up on port ${port}`);
});













