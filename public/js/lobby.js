var socket = io();

function scrollToBottom () {
    //Selector
    var messages = jQuery('#messages');
    var newMessage = messages.children('li:last-child');

    //Heights
    var clientHeight = messages.prop('clientHeight');
    var scrollTop = messages.prop('scrollTop');
    var scrollHeight = messages.prop('scrollHeight');
    var newMessageHeight = newMessage.innerHeight();
    var lastMessageHeight = newMessage.prev().innerHeight();

    if (clientHeight + scrollTop + newMessageHeight + lastMessageHeight >= scrollHeight){
        messages.scrollTop(scrollHeight);
    }
}


// after log in, user is redirected to url > /lobby.html?name=eeee&room=aaa&btn=create
function checkLogin () {
    // params == { btn: "create", name: "player1", room: "room1" }
    var params = jQuery.deparam(window.location.search);
    if (params.btn != "create") {
        params.room = params.btn;
    }


    window.history.replaceState(null, null, window.location.pathname); // REMOVING PARAMS FROM URL
    socket.emit('joinRoom', params, function (err) {
        if (err) {
            alert(err);
            window.location.href = '/';
            return
        } 
        var template = jQuery('#room-template').html();
        var html = Mustache.render(template, {
            room: params.room
        });

        jQuery('#room-name').html(html);
    });
}

socket.on('connect', function () {
    socket.emit('join');
});

socket.on('connectToRoom', function () {
    var params = jQuery.deparam(window.location.search);

    socket.emit('joinRoom', params, function (err) {
        if (err) {
            alert(err);
            window.location.href = '/';
        } else{
            var template = jQuery('#room-template').html();
            var html = Mustache.render(template, {
                room: params.room
            });

            jQuery('#room-name').html(html);
        }
    });
});

socket.on('disconnect', function () {
    console.log("Disconnected from server");
});


socket.on('updateUserList', function (users) {
    var ol = jQuery('<ol></ol>');

    users.forEach(function (user) {
        if (user.id == this.socket.id) {
            //console.log(user);
            ol.append(jQuery('<li style="background-color:#78AB46;color:white;font-weight: bold;"></li>').text(user.name));
        } else {
            ol.append(jQuery('<li></li>').text(user.name));
        }
        
    });

    jQuery('#users').html(ol);
});

// Receive message though chat
socket.on('newMessage', (message) => {
    const formattedTime = moment(message.createdAt).format('h:mm a');
    const template = jQuery('#message-template').html();

    const html = Mustache.render(template, {
        text: atob(message.text), //decode text
        from: message.from,
        createdAt: formattedTime
    });

    jQuery('#messages').append(html);
    scrollToBottom();
});

// Send message though chat
document.querySelector('#message_send_button').onclick = (e) => {
    const input = document.querySelector('input[name=message]');
    socket.emit('createMessage', btoa(input.value)); // send base 64 encoded text
    input.value = ''; // clear intput
};

// Ready to play the game
document.querySelector('#create-game-btn').onclick = (e) => {
    const form = document.querySelector('#game_options_form');

    const gameTime = form.elements['game_time_select'].value;
    const byoyomi = form.elements['byoyomi_select'].value;
    const isTeamPlay = form.elements['team_play_true'].checked;
    //console.log(gameTime, byoyomi, isTeamPlay)

    socket.emit('listOfUsers');
}

socket.on('getUsers', function (data) {
    console.log(data);
    r = `game.html?id1=${data[0].id}&name1=${data[0].name}&room1=${data[0].room}`;
    r += `&id2=${data[1].id}&name2=${data[1].name}&room2=${data[1].room}`;
    r += `&id3=${data[2].id}&name3=${data[2].name}&room3=${data[2].room}`;
    r += `&id4=${data[3].id}&name4=${data[3].name}&room4=${data[3].room}`;
    window.location.href = r;
    console.log("Marož to zle spravil");
});






