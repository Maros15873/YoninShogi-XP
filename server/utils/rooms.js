const expect = require('expect');
const {Users, User} = require('./users');

class Room{
    constructor (id, name){
        this.id = id;
        this.name = name;
        this.users = [];
    }

    isEmpty () {
        return this.users.length == 0;
    }

    addUser (id, name, room) {
        var user = new User(id, name, room);
        this.users.push(user);
        return user;
    }

    removeUser (id) {
        var user = this.users.filter((user) => user.id === id)[0];

        if (user) {
            this.users = this.users.filter((user) => user.id !== id);    
        }

        return user;
    }

    getUser (id) {
        return this.users.filter((user) => user.id === id)[0];
    }

    getUserList () {
        return this.users;
    }
}

class Rooms{
    constructor () {
        this.rooms = [];
    }

    addRoom (id, name) {
        var room = new Room(id, name);
        this.rooms.push(room);
        return room;
    }

    removeRoom (id) {
        var room = this.rooms.filter((room) => room.id === id)[0];

        if (room) {
            this.rooms = this.rooms.filter((room) => room.id !== id);
        }

        return room;
    }

    getRoom (id) {
        return this.rooms.filter((room) => room.id === id)[0];
    }

    getRoomList () {
        return this.rooms;
    }

    removeUser (id) {
        for (var i = 0; i < this.rooms.length; i++){
            var user = this.rooms[i].getUser(id);
            if (user) {
                this.rooms[i].removeUser(id);
                if (this.rooms[i].isEmpty()) {
                    this.removeRoom(this.rooms[i].id);
                }
                break;
            }
        }
    }

}

module.exports = {Rooms, Room};




