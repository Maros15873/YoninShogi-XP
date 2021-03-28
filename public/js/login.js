



// handle creating room
document.querySelector('#create-room-btn').onclick = (e) => {
    const playerName = document.querySelector('#player_name').value;
    const roomName = document.querySelector('#room_name').value;

    if(!playerName || !roomName){
        document.querySelector('#no-name-error1').style.display = 'block';
        return;
    }
    console.log('handle creating room on the server')
    window.location.href = `lobby.html?name=${playerName}&room=${roomName}&btn=create`;
}


// handle joining room
document.querySelector('#enter-room-btn').onclick = (e) => {
    const playerName = document.querySelector('#player_name2').value;
    const roomCode = document.querySelector('#room_code').value;

    if(!playerName || !roomCode){
        document.querySelector('#no-name-error2').style.display = 'block';
        return;
    }
    console.log('handle joining room on the server')
    window.location.href = `lobby.html?name=${playerName}&btn=${roomCode}`;
}