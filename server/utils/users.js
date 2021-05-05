class User{
    constructor (id, name, room) {
        this.id = id;
        this.name = name;
        this.room = room;
        this.myMove = false;
        this.playerNumber = null;
    }

    setMyMove (bool) {
        this.myMove = bool;
    }

    setPlayerNumber (n) {
        this.playerNumber = n;
    }
}

class Users {
    constructor () {
        this.users = [];
    }

    isEmpty () {
        return this.users.length == 0;
    }

    addUser (user) {
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

    getUserList (room){
        var users = this.users.filter((user) =>  user.room === room);

        return users;
    }
}

module.exports = {Users, User};