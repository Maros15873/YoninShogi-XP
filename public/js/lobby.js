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

function checkLogin () {
    var params = jQuery.deparam(window.location.search);
    if (params.btn != "create") {
        params.room = params.btn;
    }

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

socket.on('updateRoomList', function (rooms) {
    var ol = jQuery('<div></div>');

    if (rooms.length==0) {
        ol.append(jQuery('<i>No active rooms</i>'));
    } 
    
    rooms.forEach(function (room) {
        ol.append(jQuery('<button name="btn" value="'+room.name+'"></button>').text(room.name+" ("+room.users.length+"/4)"));         
    });

    jQuery('#rooms').html(ol);
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

    socket.emit('playerIdEvent');//NAKRESLENIE FIGUROK TMP!
});

socket.on('newMessage', function (message) {
    var formattedTime = moment(message.createdAt).format('h:mm a');
    var template = jQuery('#message-template').html();
    var html = Mustache.render(template, {
        text: message.text, 
        from: message.from,
        createdAt: formattedTime
    });

    jQuery('#messages').append(html);
    scrollToBottom();
});

jQuery('#message-form').on('submit', function (e) {
    e.preventDefault();

    var messageTextbox = jQuery('[name=message]');

    socket.emit('createMessage', {
        text: messageTextbox.val()
    }, function () {
        messageTextbox.val('');
    });
});

//--------------------------------------------------------------------------------------------//

var canvas = document.getElementById("hracia_plocha");
var ctx = canvas.getContext("2d");
ctx.fillStyle = "#FFFFFF";

canvas.width = 900;
canvas.height = 900;

const WIDTH = 900;
const HEIGHT = 900;

var selectedPiece = null;
const MATRIX = generatePositions();

function generatePositions(){
    var matrix = Array(9).fill().map(()=>Array(9).fill());
    for (var i = 0; i < 9; i++){
        for (var j = 0; j < 9; j++){
            matrix[i][j] = [i,j];
        }
    }
    return matrix;
}


function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log("Coordinate x: " + x, 
                "Coordinate y: " + y);
    var position = board.getSquareByCoord(x,y);

    if (position != null && position[0] != null && position[1] != null) {
        if (board.squares[position[0]][position[1]].piece != null && board.squares[position[0]][position[1]].piece.playerId == PLAYER_ID){ 
            if (board.squares[position[0]][position[1]].piece.isValidMove(position[2],position[3])){   
                socket.emit('clickEvent', position, PLAYER_ID); // POSIELAM NA SERVER ZE SOM VYKONAL TAH (TENTO TAH JE UZ PO VSETKYCH KONTROLACH)!
            }
        }
    }

}
  
canvas.addEventListener("mousedown", function(e)
{
    getMousePosition(canvas, e);
});

socket.on('click', function (position,id) { //INFORMACIA PRE VSETKYCH O USPESNE VYKONANOM TAHU!
    var new_position = getRealPosition(position, id);
    board.squares[new_position[0]][new_position[1]].piece.makeMove(new_position[2],new_position[3]);
});

function getRealPosition(position, id) {
    var matrix = MATRIX;
    for (var i = 0; i < (Math.abs(4 - (id - PLAYER_ID))); i++){
        matrix = transpose(matrix);
    }

    console.log(position);
    console.log(id,PLAYER_ID);
    console.log(matrix);

    var from = matrix[position[0]][position[1]];
    var to = matrix[position[2]][position[3]];

    console.log(from[0],from[1],to[0],to[1]);

    return [from[0],from[1],to[0],to[1]];

}

function transpose(matrix) {
    let arr=[];
        for(let i=0;i<matrix.length;i++){
            arr.push([]);
            for(let j=0;j<matrix.length;j++){
                arr[i].push(matrix[matrix.length-1-j][i]);
            }
        }
    return arr
}


class Board{

    constructor(x,y,size){
        this.x = x;
        this.y = y;
        this.size = size;
        this.sqareSize = size / 9;
        ctx.lineWidth = 2;
        this.obj = ctx.strokeRect(this.x, this.y, this.size, this.size);
        this.squares = this.fillBoard();
    }

    fillBoard (){
        var matrix = Array(9).fill().map(()=>Array(9).fill());
        var x = this.x;
        var y = this.y;
        for (var i = 0; i < 9; i++){
            for (var j = 0; j < 9; j++){
                matrix[i][j] = new Square(x,y,i,j,this.sqareSize);
                y = y + this.sqareSize;
            }
            y = this.y;
            x = x + this.sqareSize;
        }
        return matrix;
    }

    getSquareByCoord(x,y) {
        var start_point = [this.x,this.y];
        var tile_size = this.sqareSize;
    
        x = Math.floor((x - start_point[0])/tile_size);
        y = Math.floor((y - start_point[1])/tile_size);

        var col = null;
        var row = null;

        if (selectedPiece != null) {
            selectedPiece.update();
            col = selectedPiece.column;
            row = selectedPiece.row;
        }
    
        if (!(x >= 0 && x <= 8 && y <= 8 && y >=0)) {
            selectedPiece = null;
            return null;
        } else {
            selectedPiece = this.squares[x][y];
        }

        if (this.squares[x][y].piece != null) {
            
            if (PLAYER_ID == this.squares[x][y].piece.playerId){
                selectedPiece.highlight();
            }
        }

        console.log("from: "+col+","+row+ " to: "+x+","+y);
        return [col,row,x,y]
    }

    

}

class Square{

    constructor(x,y,col,row,size){
        this.x = x;
        this.y = y;
        this.column = col;
        this.row = row;
        this.size = size;
        this.obj = ctx.strokeRect(this.x, this.y, this.size, this.size);
        this.piece = null;
    }

    addPiece(type,player_id,deg){
        var dir = "img/shogi-set-01/";
        if (type == "king"){
            this.piece = new Piece(player_id,this.x+5, this.y+5,this.column, this.row, dir + "king.gif",deg);
        } 
    }

    highlight(){
        ctx.strokeStyle = "#32CD32";
        this.obj = ctx.strokeRect(this.x, this.y, this.size, this.size);
    }

    update(){
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.size, this.size);
        ctx.strokeStyle = "#000000";
        this.obj = ctx.strokeRect(this.x, this.y, this.size, this.size);
        if (this.piece != null) {
            this.piece.update();
        }
    }

}

class Piece{

    constructor(playerId,x,y,col,row,src,deg){
        this.playerId = playerId;
        this.x = x;
        this.y = y;
        this.img = new Image();
        this.img.src = src;
        this.deg = deg;
        this.column = col;
        this.row = row;
        this.img.onload = () => {
            this.showImage();
        }
        this.moves = [[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[1,1],[1,-1],[-1,1]];
        this.type = "king";
    }

    update(){
        this.showImage();
    }

    showImage() {    
        ctx.save();
        ctx.translate(this.x+25, this.y+25);
        ctx.rotate(this.deg * Math.PI / 180);
        ctx.translate(-(this.x+25), -(this.y+25));
        ctx.drawImage(this.img,this.x,this.y, 50, 50);
        ctx.restore();
    }

    makeMove(col,row){

        var square = board.squares[col][row];
        var fromsquare = board.squares[this.column][this.row];
        
        square.addPiece(fromsquare.piece.type, fromsquare.piece.playerId, fromsquare.piece.deg);  
        square.update();

        fromsquare.piece = null;
        fromsquare.update();
        
    }

    isValidMove(column, row){

        if (board.squares[column][row].piece != null && board.squares[column][row].piece.playerId == this.playerId) {
            return false;
        }

        if (!(column >= 0 && column <= 8 && row >= 0 && row <= 8)){
            return false;
        }
        var move = [column-this.column,row - this.row];

        for (var i = 0; i < this.moves.length; i++){
            if (this.compare(this.moves[i], move)) {
                return true;
            }
        }
        return false;
        
    }

    compare(a,b){
        return a.toString() == b.toString();
    }

}



var board = new Board(180,180,540);
var PLAYER_ID = null;

socket.on('playerId', function (id) {
    PLAYER_ID = id;
    var pole = [[4,8],[0,4],[4,0],[8,4]];
    var deg = [0,90,180,-90];
    console.log(id);
    var tmpId = id;
    for (var i = 0; i < 4; i++){
        board.squares[pole[i][0]][pole[i][1]].addPiece("king",tmpId,deg[i]);
        tmpId += 1;
        if (tmpId > 3) {
            tmpId = 0;
        }
    }
    
});









































