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