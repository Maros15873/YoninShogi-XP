class User{
    constructor (id, name, room) {
        this.id = id;
        this.name = name;
        this.room = room;
    }
}

class Users {
    constructor () {
        this.users = [];
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

    getUserList (room){
        var users = this.users.filter((user) =>  user.room === room);
        //var namesArray = users.map((user) => user.name);

        return users;
    }
}

module.exports = {Users, User};