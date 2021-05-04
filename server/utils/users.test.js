const expect = require('expect');

const {Users,User} = require('./users');

describe('Users', () => {

    beforeEach(() => {
        users = new Users();
        users.users = [{
            id: '1',
            name: 'Mike',
            room: 'Node Course'
        }, {
            id: '2',
            name: 'Jen',
            room: 'React Course'
        }, {
            id: '3',
            name: 'Julie',
            room: 'Node Course'
        }];
    });

    it('should add new user', () => {
        var users = new Users();
        var user = new User('123','Andrew','The Office fans');
        users.addUser(user.id, user.name, user.room);

        expect(users.users).toEqual([user]);
    });

    it('should remove a user', () => {
        var userId = '1';
        var user = users.removeUser(userId);

        expect(user.id).toBe(userId);
        expect(users.users.length).toBe(2);
    });

    it('should not remove user', () => {
        var userId = '99';
        var user = users.removeUser(userId);

        expect(user).toBe(undefined);
        expect(users.users.length).toBe(3);
    });

    it('should find user', () => {
        var userId = '2';
        var user = users.getUser(userId);

        expect(user.id).toBe(userId);
    });

    it('should not find user', () => {
        var userId = '99';
        var user = users.getUser(userId);

        expect(user).toEqual(undefined);
    });

    it('should return names for node course', () => {
        var userList = users.getUserList('Node Course');
        var names = userList.map((user) => user.name);

        expect(names).toEqual(['Mike','Julie']);
    });

    it('should return names for react course', () => {
        var userList = users.getUserList('React Course');
        var names = userList.map((user) => user.name);

        expect(names).toEqual(['Jen']);
    });

});