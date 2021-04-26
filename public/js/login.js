var socket = io();

// handle creating room
document.querySelector('#create-room-btn').onclick = (e) => {
  const playerName = document.querySelector('#player_name').value;
  const roomName = document.querySelector('#room_name').value;

  if (!playerName || !roomName) {
    document.querySelector('#no-name-error1').style.display = 'block';
    return;
  }
  window.location.href = `lobby.html?name=${playerName}&room=${roomName}&btn=create&uuid=${uuidv4()}`;
};

// handle joining room by CODE
document.querySelector('#enter-room-btn').onclick = (e) => {
  const playerName = document.querySelector('#player_name2').value;
  const roomCode = document.querySelector('#room_code').value;

  if (!playerName || !roomCode) {
    document.querySelector('#no-name-error2').style.display = 'block';
    return;
  }
  window.location.href = `lobby.html?name=${playerName}&btn=${roomCode}&uuid=${uuidv4()}`;
};

// handle joinint active room
const handleJoiningActiveRoom = (room) => {
  const playerName = document.querySelector('#player_name3').value;
  var nameRoom = room.name;

  if (!playerName) {
    document.querySelector('#no-name-error3').style.display = 'block';
    return;
  }
  if (room.users.length == 4) {
    document.querySelector('#room-is-full').style.display = 'block';
    return;
  }
  window.location.href = `lobby.html?name=${playerName}&btn=${nameRoom}&uuid=${uuidv4()}`;
};



// notify server about my presence
socket.on('connect', function () {
  socket.emit('join');
  socket.emit('get_available_rooms');
});

// show active rooms
socket.on('updateRoomList', function (rooms) {
  var ol = jQuery('<div></div>');
  console.log('rooms', rooms);
  if (rooms.length == 0) {
    ol.append(jQuery('<i>No active rooms</i>'));
  }

  rooms.forEach(function (room) {
    const button = document.createElement('button');
    button.innerHTML = `Room ${room.name}`;
    button.className = 'btn btn-primary';
    button.onclick = () => handleJoiningActiveRoom(room);
    ol.append(button);
  });
  jQuery('#rooms').html(ol);
});


const uuidv4 = () => {
  const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });

  localStorage.setItem('UUID', uuid); // side effect but f*ck it
  return uuid;
}
