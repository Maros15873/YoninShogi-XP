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
                if (myIncludes(board.squares[position[0]][position[1]].piece.listOfMoves(), [position[2],position[3]])) {
                    socket.emit('clickEvent', position, PLAYER_ID); // POSIELAM NA SERVER ZE SOM VYKONAL TAH (TENTO TAH JE UZ PO VSETKYCH KONTROLACH)!
                }              
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
    for (var i = 0; i < (Math.abs(id - PLAYER_ID)); i++){
        if (id < PLAYER_ID){
            matrix = transpose(matrix,true);
        } else {
            matrix = transpose(matrix,false);
        }
        
    }

    var from = matrix[position[0]][position[1]];
    var to = matrix[position[2]][position[3]];

    return [from[0],from[1],to[0],to[1]];

}

function transpose(matrix,forth=true) {
    let arr=[];
        for(let i=0;i<matrix.length;i++){
            arr.push([]);
            for(let j=0;j<matrix.length;j++){
                if (forth == true){
                    arr[i].push(matrix[j][matrix.length-1-i]);
                } else {
                    arr[i].push(matrix[matrix.length-1-j][i]);
                }
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
            if (selectedPiece.piece != null){
                selectedPiece.piece.hideMyMoves();
            }
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
                selectedPiece.piece.showMyMoves();
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
        var file = ".gif"
        this.piece = new Piece(player_id,this.x+5, this.y+5,this.column, this.row, dir + type + file,deg,type);
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

    constructor(playerId,x,y,col,row,src,deg,type){
        this.playerId = playerId;
        this.x = x;
        this.y = y;
        this.type = type;
        this.img = new Image();
        this.img.src = src;
        this.deg = deg;
        this.column = col;
        this.row = row;
        this.img.onload = () => {
            this.showImage();
        }
        this.promoted = false;
        this.moves = this.assignMoves();
    }

    assignMoves(){
        if (this.type == "king") {
            return [[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[1,1],[1,-1],[-1,1]];
        } else if (this.type == "rook") {

            if (this.promoted == true){
                return [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
                        [0,-1],[0,-2],[0,-3],[0,-4],[0,-5],[0,-6],[0,-7],[0,-8],
                        [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],
                        [-1,0],[-2,0],[-3,0],[-4,0],[-5,0],[-6,0],[-7,0],[-8,0]].concat([[0,1],[0,-1],[1,0],[-1,0],[-1,-1],[1,1],[1,-1],[-1,1]]);
            } else {
                return [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
                        [0,-1],[0,-2],[0,-3],[0,-4],[0,-5],[0,-6],[0,-7],[0,-8],
                        [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0],
                        [-1,0],[-2,0],[-3,0],[-4,0],[-5,0],[-6,0],[-7,0],[-8,0]];
            }

        } else if (this.type == "pawn") {

            if (this.promoted == true){
                if (this.deg == 0){
                    return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1]];
                } else if (this.deg == 90) {
                    return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1]];
                } else if (this.deg == 180){
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[-1,1]];
                } else if (this.deg == -90){
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[1,-1]];
                }         
            } else {
                if (this.deg == 0){
                    return [[0,-1]];
                } else if (this.deg == 90) {
                    return [[-1,0]];
                } else if (this.deg == 180){
                    return [[0,1]];
                } else if (this.deg == -90){
                    return [[1,0]];
                }              
            }

        } else if (this.type == "silver") {

            if (this.promoted == true){
                if (this.deg == 0){
                    return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1]];
                } else if (this.deg == 90) {
                    return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1]];
                } else if (this.deg == 180){
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[-1,1]];
                } else if (this.deg == -90){
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[1,-1]];
                }          
            } else {
                if (this.deg == 0){
                    return [[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]];
                } else if (this.deg == 90) {
                    return [[-1,0],[1,1],[-1,-1],[-1,1],[1,-1]];
                } else if (this.deg == 180){
                    return [[0,1],[1,1],[-1,-1],[-1,1],[1,-1]];
                } else if (this.deg == -90){
                    return [[1,0],[1,1],[-1,-1],[-1,1],[1,-1]];
                }      
            }

        } else if (this.type == "gold") {
            if (this.deg == 0){
                return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1]];
            } else if (this.deg == 90) {
                return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1]];
            } else if (this.deg == 180){
                return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[-1,1]];
            } else if (this.deg == -90){
                return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[1,-1]];
            }      
        }
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

    showMyMoves() {
        var list = this.listOfMoves();
        for (var i = 0; i < list.length; i++){
            board.squares[list[i][0]][list[i][1]].highlight();
        }
    }

    hideMyMoves() {
        var list = this.listOfMoves();
        for (var i = 0; i < list.length; i++){
            board.squares[list[i][0]][list[i][1]].update();
        }
    }

    listOfMoves() {
        var list = [];
        for (var i = 0; i < this.moves.length; i++){
            var moveCol = this.column + this.moves[i][0];
            var moveRow = this.row + this.moves[i][1];
            if (this.isValidMove(moveCol, moveRow)) {
                if (this.type == "rook" && ((this.moves[i][0] == 0 && (Math.abs(this.moves[i][1]) != 1)) || (this.moves[i][1] == 0 && Math.abs(this.moves[i][0]) != 1))) {
                    if ((myIncludes(list, [moveCol + 1, moveRow]) && (board.squares[moveCol + 1][moveRow].piece == null)) || 
                        (myIncludes(list, [moveCol - 1, moveRow]) && (board.squares[moveCol - 1][moveRow].piece == null)) || 
                        (myIncludes(list, [moveCol, moveRow + 1]) && (board.squares[moveCol][moveRow + 1].piece == null)) || 
                        (myIncludes(list, [moveCol, moveRow - 1]) && (board.squares[moveCol][moveRow - 1].piece == null))
                        ) {
                        list.push([moveCol, moveRow]);
                    }
                } else {
                    list.push([moveCol, moveRow]);
                }            
            }
        }
        return list;
    }

    isValidMove(column, row){

        if (!(column >= 0 && column <= 8 && row >= 0 && row <= 8)){
            return false;
        }

        if (board.squares[column][row].piece != null && board.squares[column][row].piece.playerId == this.playerId) {
            return false;
        }

        var move = [column-this.column,row - this.row];

        for (var i = 0; i < this.moves.length; i++){
            if (compare(this.moves[i], move)) {
                return true;
            }
        }
        return false;
        
    }

}

function compare(a,b){
    return a.toString() == b.toString();
}

function myIncludes(array, element) {
    for (var i = 0; i < array.length; i++){
        if (compare(array[i],element)){
            return true;
        }
    }
    return false;
}

var board = new Board(180,180,540);
var PLAYER_ID = null;

var starting_positions = new Map();
starting_positions.set(0, {king: [[4,8]], pawn: [[3,7],[5,7],[4,6]], silver: [[2,8],[6,8]], gold: [[3,8],[5,8]], rook: [[4,7]]});
starting_positions.set(1, {king: [[0,4]], pawn: [[2,4],[1,3],[1,5]], silver: [[0,2],[0,6]], gold: [[0,3],[0,5]], rook: [[1,4]]});
starting_positions.set(2, {king: [[4,0]], pawn: [[4,2],[5,1],[3,1]], silver: [[2,0],[6,0]], gold: [[3,0],[5,0]], rook: [[4,1]]});
starting_positions.set(3, {king: [[8,4]], pawn: [[7,3],[7,5],[6,4]], silver: [[8,2],[8,6]], gold: [[8,3],[8,5]], rook: [[7,4]]});

socket.on('playerId', function (id) {
    PLAYER_ID = id;
    var deg = [0,90,180,-90];
    console.log(id);
    var tmpId = id;

    for (var i = 0; i < 4; i ++){
        var obj = starting_positions.get(i);
        board.squares[obj.king[0][0]][obj.king[0][1]].addPiece("king",tmpId,deg[i]);
        for (var j = 0; j < obj.pawn.length; j++){
            board.squares[obj.pawn[j][0]][obj.pawn[j][1]].addPiece("pawn",tmpId,deg[i]);
        }
        for (var j = 0; j < obj.silver.length; j++){
            board.squares[obj.silver[j][0]][obj.silver[j][1]].addPiece("silver",tmpId,deg[i]);
        }
        for (var j = 0; j < obj.gold.length; j++){
            board.squares[obj.gold[j][0]][obj.gold[j][1]].addPiece("gold",tmpId,deg[i]);
        }
        for (var j = 0; j < obj.rook.length; j++){
            board.squares[obj.rook[j][0]][obj.rook[j][1]].addPiece("rook",tmpId,deg[i]);
        }

        tmpId += 1;
        if (tmpId > 3) {
            tmpId = 0;
        }
    }
    
});









































