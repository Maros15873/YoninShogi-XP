const expect = require('expect');
const {Users, User} = require('./users');

class Room{
    constructor (id, name){
        this.id = id;
        this.name = name;
        this.users = [];
    }

    checkMate(playerNumber){
        for (var i = 0; i < this.users.length; i++){
            if (this.users[i].playerNumber == playerNumber) {
                this.users[i].killPlayer();
            }
        }
    }

    isEmpty () {
        return this.users.length == 0;
    }

    whoseTurn () {
        for (var i = 0; i < this.users.length; i++){
            if (this.users[i].myMove){
                return i;
            }
        }
        return -99;
    }

    gameEnd() {
        var count = 0;
        for (var i = 0; i < this.users.length; i++){
            if (this.users[i].isDead() == true) {
                count += 1;
            } else {
                var winner = this.users[i];
            }
        }

        if (count == 3) {
            return winner;
        }

        return null;
    }

    changeTurn (id) {
        var index = this.whoseTurn();
        this.users[index].myMove = false;
        if (id == null){
            var newIndex = index + 1;
            if (newIndex >= this.users.length) {
                newIndex = 0;
            }
            this.users[newIndex].myMove = true;
            if (this.users[newIndex].isDead() == true) {
                this.changeTurn(null);
            } 
        } else {
            if (this.users[id].isDead() == false) {
                this.users[id].myMove = true;
            }
        }
        
    }

    addUser (user) {
        if (this.users.length == 0) {
            user.setMyMove(true);
        }
        user.setPlayerNumber(this.users.length);
        this.users.push(user);
    }

    reassignAllPlayerNumbers () {
        for (var i = 0; i < this.users.length; i++){
            this.users[i].setPlayerNumber(i);
        }
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




