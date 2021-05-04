const expect = require('expect');

const {Rooms, Room} = require('./rooms');
const {Users, User} = require('./users');

describe('Rooms', () => {

    beforeEach(() => {
        users1 = new Users();
        users1.users = [new User('10','Palo','A#123')];

        users2 = new Users();
        users2.users = [new User('11','Palo','B#123'),
        new User('33','Petrik','B#123')];

        users3 = new Users();
        users3.users = [new User('12','Palo','B#724'),
        new User('23','Anicka','B#724'),
        new User('345','Petrik','B#724')];

        rooms = new Rooms();
        rooms.rooms = [new Room ('A#123','A'),
        new Room ('B#123','B'),
        new Room ('B#724','B')];
    });

    it('should add new room', () => {
        var rooms = new Rooms();
        var room = new Room('C#123','C');
        rooms.addRoom('C#123', 'C');

        expect(rooms.rooms).toEqual([room]);
    });

    it('should remove a room', () => {
        var roomId = 'B#123';
        var room = rooms.removeRoom(roomId);

        expect(room.id).toBe(roomId);
        expect(rooms.rooms.length).toBe(2);
    });

    it('should not remove room', () => {
        var roomId = 'D#99';
        var room = rooms.removeRoom(roomId);

        expect(room).toBe(undefined);
        expect(rooms.rooms.length).toBe(3);
    });

    it('should find room', () => {
        var roomId = 'B#123';
        var room = rooms.getRoom(roomId);

        expect(room.id).toBe(roomId);
    });

    it('should not find room', () => {
        var roomId = 'E#999';
        var room = rooms.getRoom(roomId);

        expect(room).toEqual(undefined);
    });

});


describe('Changing turn', () => {

    it('first player is on turn', () => {
        var room = new Room('C#123','C');
        var user = new User('id1','Jozko','C#123');
        room.addUser(user);

        expect(user.myMove).toEqual(true);
    });

    it('only first player is on turn', () => {
        var room = new Room('C#123','C');
        var user1 = new User('id1','Jozko','C#123');
        var user2 = new User('id2','Dezko','C#123');
        room.addUser(user1);
        room.addUser(user2);

        expect([user1.myMove,user2.myMove]).toEqual([true,false]);
    });

    it('change of turn', () => {
        var room = new Room('C#123','C');
        var user1 = new User('id1','Jozko','C#123');
        var user2 = new User('id2','Dezko','C#123');
        room.addUser(user1);
        room.addUser(user2);

        room.changeTurn();

        expect([user1.myMove,user2.myMove]).toEqual([false,true]);
    });

    it('changing turn back to first player', () => {
        var room = new Room('C#123','C');
        var user1 = new User('id1','Jozko','C#123');
        var user2 = new User('id2','Dezko','C#123');
        room.addUser(user1);
        room.addUser(user2);

        room.changeTurn();
        room.changeTurn();

        expect([user1.myMove,user2.myMove]).toEqual([true,false]);
    });

});