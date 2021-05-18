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

socket.on('updateUserList', function (users, playerOnTurn, drawPieces=true) {
    var ol = jQuery('<ol></ol>');

    users.forEach(function (user) {
        if (user.playerNumber == playerOnTurn) {
            //console.log(user);
            ol.append(jQuery('<li style="background-color:#78AB46;color:white;font-weight: bold;"></li>').text(user.name));
        } else {
            ol.append(jQuery('<li></li>').text(user.name));
        }
        
    });

    jQuery('#users').html(ol);

    if (drawPieces == true){
        socket.emit('playerIdEvent');//NAKRESLENIE FIGUROK TMP!
    }
    
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
if (canvas != null){
    var ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";

    canvas.width = 900;
    canvas.height = 900;
}


const WIDTH = 900;
const HEIGHT = 900;

var selectedPiece = null;
var selectedPrisoner = null;
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

    var position_prisoner = plates[0].clickPrisoner(x,y);

    if (position_prisoner != null){
        if (position_prisoner.number > 0){
            selectedPrisoner = position_prisoner;
            position_prisoner.obj.highlight();
            position_prisoner.showMyMoves();
        }  
  
    } else {

        var position = board.getSquareByCoord(x,y);

        if (selectedPrisoner != null && position != null && position[0] == null) {
            if (myIncludes(selectedPrisoner.listOfValidMoves(), [position[2],position[3]])) {
                socket.emit('clickEvent', position, PLAYER_ID); // POSIELAM NA SERVER ZE SOM VYKONAL TAH (TENTO TAH JE UZ PO VSETKYCH KONTROLACH)! [DOKLADANIM]
            }
        }

        if (position != null && position[0] != null && position[1] != null) {
            if (board.squares[position[0]][position[1]].piece != null && board.squares[position[0]][position[1]].piece.playerId == PLAYER_ID){ 
                if (board.squares[position[0]][position[1]].piece.isValidMove(position[2],position[3])){   
                    if (myIncludes(board.squares[position[0]][position[1]].piece.listOfValidMoves(), [position[2],position[3]])) {
                        socket.emit('clickEvent', position, PLAYER_ID); // POSIELAM NA SERVER ZE SOM VYKONAL TAH (TENTO TAH JE UZ PO VSETKYCH KONTROLACH)!
                    }              
                }
            }
        }

    }

}
  
if (canvas != null){
    canvas.addEventListener("mousedown", function(e)
    {
        getMousePosition(canvas, e);
    });
}




socket.on('click', function (position,id, turn) { //INFORMACIA PRE VSETKYCH O USPESNE VYKONANOM TAHU!

    var new_position = getRealPosition(position, id);
    if (new_position[0] == null){ //DOKLADANIE 
        board.squares[new_position[2]][new_position[3]].addPiece(new_position[1], id, getDegById(id));  
        board.squares[new_position[2]][new_position[3]].update();
        
        if (PLAYER_ID == id) {
            selectedPrisoner.removePrisoner();
            selectedPrisoner = null;
        } else {
            var prisoner = getPrisonerById(id,new_position[1]);
            prisoner.removePrisoner();
        }
        
    } else { //KLASICKY TAH
        var answer = false;

        if (PLAYER_ID == id && board.squares[new_position[0]][new_position[1]].piece.promoted == false && 
            (board.squares[new_position[0]][new_position[1]].piece.type != "king" && board.squares[new_position[0]][new_position[1]].piece.type != "gold") &&
            (board.squares[position[0]][position[1]].isInPromotionZone() || board.squares[position[2]][position[3]].isInPromotionZone())){
            answer = confirm("Promote?"); //HRACOVI VYSKOCI OKNO KDE SA ROZHODNE CI CHCE POVYSOVAT
        }

        if (PLAYER_ID == id && board.squares[new_position[2]][new_position[3]].piece != null){ //AK HRAC ZAJME SUPEROVU FIGURKU
            plates[0].addPrisoner(board.squares[new_position[2]][new_position[3]].piece.type);
        } else if (board.squares[new_position[2]][new_position[3]].piece != null) {
            getPlateById(id).addPrisoner(board.squares[new_position[2]][new_position[3]].piece.type);
        }

        if (answer){ //AK HRAC POVYSOVAL FIGURKU
            socket.emit('promoteEvent', position, id);
        } else { //BEZ POVYSENIA
            board.squares[new_position[0]][new_position[1]].piece.makeMove(new_position[2],new_position[3]);
        }

    }

    var check = nearestKingInCheck(turn);
    for (var i = 0; i < check.length; i++){
        if (numberOfValidMoves(check[i]) == 0) {
            socket.emit('checkMate', check[i]);
        }
    }
    check = nearestKingInCheck(turn);

    console.log("king in check: "+check);
    if (check.length != 0) {
        socket.emit('changeTurnByCheck',check[0]);
    }

    console.log("na tahu: " + turn);

});

socket.on('checkMateUpdate', function (id) {
    checkMate(id);
});

socket.on('endOfGame', function (winner) {
    canvas.cloneNode(true);
    alert("WINNER: "+winner);
});

socket.on('promote', function (position, id){
    var new_position = getRealPosition(position, id);
    if (PLAYER_ID == id) {
        board.squares[new_position[0]][new_position[1]].piece.makeMove(new_position[2],new_position[3]);
        board.squares[new_position[2]][new_position[3]].piece.makePromotion();
    } else {
        board.squares[new_position[2]][new_position[3]].piece.makePromotion();
    }
    
});

function getRealCoords(coords, id) { // AK NECHCEM TAHY ZADAVAT EXPLICITNE ALE ICH POCITAT [Piece(), assignMoves()]

    var matrix = [[[-1,-1],[-1,0],[-1,1]],
                  [[0,-1],[0,0],[0,1]],
                  [[1,-1],[1,0],[1,1]]];

    var new_coords = [];

    for (var i = 0; i < 3; i++){
        for (var j = 0; j < 3; j++){
            if (myIncludes([matrix[i][j]], coords)){
                new_coords = [i,j];             
            } 
        }
    }

    for (var i = 0; i < (Math.abs(id - PLAYER_ID)); i++){
        if (id < PLAYER_ID){
            matrix = transpose(matrix,false);
        } else {
            matrix = transpose(matrix,true);
        } 
    }
    
    return matrix[new_coords[0]][new_coords[1]];
}

function getRealPosition(position, id) {

    var matrix = MATRIX;
    for (var i = 0; i < (Math.abs(id - PLAYER_ID)); i++){
        if (id < PLAYER_ID){
            matrix = transpose(matrix,true);
        } else {
            matrix = transpose(matrix,false);
        }
        
    }

    if (position[0] == null){
        var from = [null,position[1]];
    } else {
        var from = matrix[position[0]][position[1]];
    }
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

class Plate{

    constructor(x,y,width,height,playerId,name,horizontal) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.playerId = playerId;
        this.sqareSize = 60;
        this.name = name;
        this.horizontal = horizontal;

        ctx.font = "30px Arial";
        this.objName = ctx.fillText(this.name, this.x + 10, this.y+40);
        ctx.font = "12px Arial";

        ctx.lineWidth = 2;
        this.obj = ctx.strokeRect(this.x, this.y, this.width, this.height);
        this.prisoners = this.fillPrisoners(this.x + 130, this.y + 80, this.sqareSize);
    }

    clickPrisoner(x,y) {
        for (var i = 0; i < 4; i++) {
            if ((x >= this.prisoners[i].x) && (x <= (this.prisoners[i].x + this.sqareSize)) && (y >= this.prisoners[i].y) && (y <= (this.prisoners[i].y + this.sqareSize))){
                return this.prisoners[i];
            }
        }
        return null;
    }

    fillPrisoners(x,y,squareSize) {
        var names = ["pawn","silver","gold","rook"];
        var matrix = Array(4).fill();
        for (var i = 0; i < 4; i++) {
            if (this.horizontal == true){
                matrix[i] = new Prisoner(x,y,squareSize,names[i],this.playerId);
                x = x + 70;
            } else {
                matrix[i] = new Prisoner(x-75,y+10,squareSize,names[i],this.playerId);
                y = y + 110;
            }
        }
        return matrix;
    }

    addPrisoner(type){
        if (type == "pawn") {
            this.prisoners[0].addPrisoner();
        } else if (type == "silver") {
            this.prisoners[1].addPrisoner();
        } else if (type == "gold") {
            this.prisoners[2].addPrisoner();
        } else if (type == "rook") {
            this.prisoners[3].addPrisoner();
        }   
    }
    
    removePrisoner(type){
        if (type == "pawn") {
            this.prisoners[0].removePrisoner();
        } else if (type == "silver") {
            this.prisoners[1].removePrisoner();
        } else if (type == "gold") {
            this.prisoners[2].removePrisoner();
        } else if (type == "rook") {
            this.prisoners[3].removePrisoner();
        }   
    }

}

class Prisoner{

    constructor(x,y, squareSize, name,playerId){
        this.x = x;
        this.y = y;
        this.sqareSize = squareSize;
        this.type = name;
        this.number = 0;
        this.playerId = playerId;
        this.obj = new Square(this.x, this.y, null, null, this.sqareSize);
        this.objName = ctx.fillText(this.type, this.x, this.y-10);
        this.objNumber = ctx.fillText(this.number, this.x, this.y+75);
        this.deg = getDegById(this.playerId);
    }

    showMyMoves() {
        var list = this.listOfValidMoves();
        for (var i = 0; i < list.length; i++){
            board.squares[list[i][0]][list[i][1]].highlight();
        }
    }

    hideMyMoves() {
        var list = this.listOfValidMoves();
        for (var i = 0; i < list.length; i++){
            board.squares[list[i][0]][list[i][1]].update();
        }
    }

    listOfMoves() {
        var list = [];
        for (var i = 0; i < 9; i++){
            for (var j = 0; j < 9; j++){
                if(board.squares[i][j].piece == null){
                    if (this.obj.piece != null && this.obj.piece.type == "pawn"){
                        if (j > 0 && !this.checkPawnInSameColumn(i)) {
                            list.push([i,j]);
                        }
                    } else {
                        list.push([i,j]);
                    }                   
                }
            }
        }
        return list;
    }

    listOfValidMoves() {
        if (this.number == 0) {
            return [];
        }
        var moves = this.listOfMoves();
        var list = [];
        for (var i = 0; i < moves.length; i++){
            if (board.makeFakeMove(this, board.squares[moves[i][0]][moves[i][1]], this.playerId, true) == true){
                list.push(moves[i]);
            }
        }
        return list;
    }

    checkPawnInSameColumn(col){
        for (var i = 0; i < 9; i++){
            var piece = board.squares[col][i].piece;
            if (piece != null){
                if (piece.type == "pawn" && piece.promoted == false && piece.playerId == this.playerId) {
                    return true;
                }
            }
        }
        return false;
    }

    update(){
        
        ctx.fillStyle = "white";
        ctx.fillRect(this.x-5, this.y-20, this.sqareSize+10, this.sqareSize+40);//premazanie
        ctx.fillStyle = "black";

        this.obj = new Square(this.x, this.y, null, null, this.sqareSize);
        this.objName = ctx.fillText(this.type, this.x, this.y-10);
        this.objNumber =  ctx.fillText(this.number, this.x, this.y+75);

        if (this.number > 0) {
            this.obj.addPiece(this.type,this.playerId,0);
        }
    }

    addPrisoner(){
        this.number += 1;
        this.update();
    }

    removePrisoner(){
        this.number -= 1;
        this.update();
    }


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

        if (selectedPrisoner != null) {
            selectedPiece.update();
            selectedPrisoner.obj.update();
            selectedPrisoner.hideMyMoves();
            if (myIncludes(selectedPrisoner.listOfValidMoves(),[x,y])){
                return [null,selectedPrisoner.type,x,y];
            } else {
                selectedPrisoner = null;
            }
        }

        if (this.squares[x][y].piece != null) {
            
            if (PLAYER_ID == this.squares[x][y].piece.playerId && selectedPiece != null){
                selectedPiece.highlight();
                selectedPiece.piece.showMyMoves();
            }
        }

        console.log("from: "+col+","+row+ " to: "+x+","+y);
        return [col,row,x,y]
    }

    findPlayersKing(id) {
        for (var i = 0; i < 9; i++){
            for (var j = 0; j < 9; j++){
                if (board.squares[i][j].piece != null) {
                    if (board.squares[i][j].piece.playerId == id && board.squares[i][j].piece.type == "king"){
                        return board.squares[i][j].piece;
                    }
                }
            }
        }
        return null;
    }

    makeFakeMove(squareFrom, squareTo, playerId, prisoner=false){

        if (prisoner == true) {

            squareTo.piece = new FakePiece(squareFrom.playerId, squareTo.col, squareTo.row, squareFrom.deg, squareFrom.type);
            board.squares[squareTo.column][squareTo.row] = squareTo;

            var goodMove = !isKingInCheck(playerId);

            if (squareFrom.type == "pawn"){
                goodMove = goodMove && !pawnMate(squareTo.column, squareTo.row);
            }

            squareTo.piece = null;
            board.squares[squareTo.column][squareTo.row] = squareTo;

            return goodMove;

        } else {
            var piece1 = squareFrom.piece;
            var piece2 = squareTo.piece;
            
            squareFrom.piece = (piece2 == null) ? null : new FakePiece(piece2.playerId, piece2.col, piece2.row, piece2.deg, piece2.type);
            squareTo.piece = (piece1 == null) ? null : new FakePiece(piece1.playerId, piece1.col, piece1.row, piece1.deg, piece1.type);

            board.squares[squareFrom.column][squareFrom.row] = squareFrom;
            board.squares[squareTo.column][squareTo.row] = squareTo;

            var goodMove = !isKingInCheck(playerId);

            squareFrom.piece = piece1;
            squareTo.piece = piece2;

            board.squares[squareFrom.column][squareFrom.row] = squareFrom;
            board.squares[squareTo.column][squareTo.row] = squareTo;

            return goodMove;
        }
        
        
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

    isSquareInCheck(playerId){
        if (board.squares[this.column][this.row].piece != null && board.squares[this.column][this.row].piece.alive == false){
            return false;
        }
        for (var i = 0; i < 9; i++){
            for (var j = 0; j < 9; j++){
                if (board.squares[i][j].piece != null && board.squares[i][j].piece.alive == true) {
                    if (board.squares[i][j].piece.playerId != playerId) {
                        var moves = board.squares[i][j].piece.listOfMoves();
                        for (var k = 0; k < moves.length; k++){
                            if (compare(moves[k], [this.column, this.row]) == true){
                                return true;
                            }
                        }
                    }
                }
            }
        }
        return false;
    }

    addPiece(type,player_id,deg,promoted=false){
        var dir = "img/shogi-set-01/";
        var file = ".gif";
        if (promoted){
            this.piece = new Piece(player_id,this.x+5, this.y+5,this.column, this.row, dir + type+"P" + file,deg,type, true);
        } else {
            this.piece = new Piece(player_id,this.x+5, this.y+5,this.column, this.row, dir + type + file,deg,type);
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

    isInPromotionZone(){
        if (this.row < 3){
            return true;
        }
        return false;
    }

}

class Piece{

    constructor(playerId,x,y,col,row,src,deg,type,promoted=false){
        this.playerId = playerId;
        this.x = x;
        this.y = y;
        this.type = type;

        this.alive = true;
        
        this.img = (src == null) ? null : new Image();
        if (this.img != null){
            this.img.src = src;
            this.img.onload = () => {
                this.showImage();
            }
        }
        
        this.deg = deg;
        this.column = col;
        this.row = row;
        this.promoted = promoted;
        this.moves = this.assignMoves();
    }

    makePromotion(){
        if (this.type != "king" && this.type != "gold"){
            this.promoted = true;
            var dir = "img/shogi-set-01/";
            var file = ".gif"
            this.img.src = dir + this.type + "P" + file;
            this.update();
        }
        
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
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[1,-1]];
                } else if (this.deg == 180){
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[-1,1]];
                } else if (this.deg == -90){
                    return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1]];
                }         
            } else {
                if (this.deg == 0){
                    return [[0,-1]];
                } else if (this.deg == 90) {
                    return [[1,0]];
                } else if (this.deg == 180){
                    return [[0,1]];
                } else if (this.deg == -90){
                    return [[-1,0]];
                }              
            }

        } else if (this.type == "silver") {

            if (this.promoted == true){
                if (this.deg == 0){
                    return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1]];
                } else if (this.deg == 90) {
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[1,-1]];
                } else if (this.deg == 180){
                    return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[-1,1]];
                } else if (this.deg == -90){
                    return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1]];
                }          
            } else {
                if (this.deg == 0){
                    return [[0,-1],[1,1],[-1,-1],[-1,1],[1,-1]];
                } else if (this.deg == 90) {
                    return [[1,0],[1,1],[-1,-1],[-1,1],[1,-1]];
                } else if (this.deg == 180){
                    return [[0,1],[1,1],[-1,-1],[-1,1],[1,-1]];
                } else if (this.deg == -90){
                    return [[-1,0],[1,1],[-1,-1],[-1,1],[1,-1]];
                }      
            }

        } else if (this.type == "gold") {
            if (this.deg == 0){
                return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[1,-1]];
            } else if (this.deg == 90) {
                return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[1,-1]];
            } else if (this.deg == 180){
                return [[0,-1],[0,1],[-1,0],[1,0],[1,1],[-1,1]];
            } else if (this.deg == -90){
                return [[0,-1],[0,1],[-1,0],[1,0],[-1,-1],[-1,1]];
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
        
        square.addPiece(fromsquare.piece.type, fromsquare.piece.playerId, fromsquare.piece.deg, fromsquare.piece.promoted);  
        square.update();

        fromsquare.piece = null;
        fromsquare.update();
        
    }

    showMyMoves() {
        var list = this.listOfValidMoves();
        for (var i = 0; i < list.length; i++){
            board.squares[list[i][0]][list[i][1]].highlight();
        }
    }

    hideMyMoves() {
        var list = this.listOfValidMoves();
        for (var i = 0; i < list.length; i++){
            board.squares[list[i][0]][list[i][1]].update();
        }
    }

    listOfMoves() {
        this.moves = this.assignMoves();
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

    listOfValidMoves() {
        var moves = this.listOfMoves();
        var list = [];
        for (var i = 0; i < moves.length; i++){
            if (board.makeFakeMove(board.squares[this.column][this.row], board.squares[moves[i][0]][moves[i][1]], this.playerId) == true){
                list.push(moves[i]);
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

        if (board.squares[column][row].piece != null && board.squares[column][row].piece.type == "king" && board.squares[column][row].piece.promoted == true) {
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

class FakePiece extends Piece{
    constructor(playerId, col, row, deg, type){
        super(playerId,null,null,col,row,null,deg,type);
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


if (canvas != null){
    var board = new Board(180,180,540);
    var PLAYER_ID = null;
    var plates = [];
    
    var starting_positions = new Map();
    starting_positions.set(0, {king: [[4,8]], pawn: [[3,7],[5,7],[4,6]], silver: [[2,8],[6,8]], gold: [[3,8],[5,8]], rook: [[4,7]]});
    starting_positions.set(1, {king: [[0,4]], pawn: [[2,4],[1,3],[1,5]], silver: [[0,2],[0,6]], gold: [[0,3],[0,5]], rook: [[1,4]]});
    starting_positions.set(2, {king: [[4,0]], pawn: [[4,2],[5,1],[3,1]], silver: [[2,0],[6,0]], gold: [[3,0],[5,0]], rook: [[4,1]]});
    starting_positions.set(3, {king: [[8,4]], pawn: [[7,3],[7,5],[6,4]], silver: [[8,2],[8,6]], gold: [[8,3],[8,5]], rook: [[7,4]]});
}


socket.on('playerId', function (id, name, players) {

    if (players.length == 4){

        console.log(players);

        PLAYER_ID = id;
        PLAYER_NAME = name;

        plates.push(new Plate(180,180+540,540,180,id,name,true));
        var horizontal = true
        var akt = PLAYER_ID + 1;
        var positions = [[0,180,180,540],[180,0,540,180],[180+540,180,180,540]];
        for (var i = 0; i < 3; i++){
            
            if (akt > 3) {
                akt = 0;
            }

            horizontal = (horizontal) ? false: true;

            if (players[akt].playerNumber != PLAYER_ID){
                plates.push(new Plate(
                    positions[i][0],
                    positions[i][1],
                    positions[i][2],
                    positions[i][3],
                    players[akt].playerNumber,players[akt].name,horizontal));
            }
            akt += 1;
        }

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
    }
    
});

function getDegById(id) {
    var deg = [0,90,180,-90];
    var tmpId = PLAYER_ID;

    for (var i = 0; i < 4; i++){
        if (tmpId == id) {
            return deg[i];
        }
        tmpId += 1;
        if (tmpId > 3) {
            tmpId = 0;
        }
    }

    return null;
    
}

function getPlateById(id) {
    for (var i = 0; i < plates.length; i++){
        if (plates[i].playerId == id) {
            return plates[i];
        }
    }
    return null;
}

function getPrisonerById(id, type) {
    var plate = getPlateById(id);
    if (plate == null){
        return null;
    }

    for (var i = 0; i < plate.prisoners.length; i++){
        if (plate.prisoners[i].type == type){
            return plate.prisoners[i];
        }
    }
    return null;
}

function nearestKingInCheck(id){
    var result = [];
    var akt = id + 1;
    for (var i = 0; i < 4; i++){
        if (akt > 3) {
            akt = 0;
        }

        if (isKingInCheck(akt) == true) {
            result.push(akt);
        }

        akt += 1;
    }
    return result;
}

function isKingInCheck(playerId) {
    for (var i = 0; i < 9; i++){
        for (var j = 0; j < 9; j++){
            if (board.squares[i][j].piece != null){
                if (board.squares[i][j].piece.playerId == playerId && board.squares[i][j].piece.type == "king"){
                    return board.squares[i][j].isSquareInCheck()   
                }
            }
        }
    }
    throw "King is not on board! [" + playerId + "]";
}

function numberOfValidMoves(playerId) {
    var count = 0;
    for (var i = 0; i < 9; i++){
        for (var j = 0; j < 9; j++){
            if (board.squares[i][j].piece != null){
                if (board.squares[i][j].piece.playerId == playerId){
                    count += board.squares[i][j].piece.listOfValidMoves().length;
                }
            }
        }
    }
    var plate = getPlateById(playerId);
    for (var i = 0; i < plate.prisoners.length; i++){
        count += plate.prisoners[i].listOfValidMoves().length;
    }
    return count;
}

function checkMate(playerId){
    for (var i = 0; i < 9; i++){
        for (var j = 0; j < 9; j++){
            if (board.squares[i][j].piece != null){
                if (board.squares[i][j].piece.playerId == playerId){
                    if (board.squares[i][j].piece.type == "king"){
                        board.squares[i][j].addPiece("king",playerId,getDegById(playerId),true);
                    }
                    board.squares[i][j].piece.alive = false;
                }
            }
        }
    }
}

function pawnMate(col,row) {
    row2 = row - 1;
    if (row2 >= 0 && board.squares[col][row2].piece != null && board.squares[col][row2].piece.type == "king"){
        var validMoves = numberOfValidMoves(board.squares[col][row2].piece.playerId);
        return (validMoves == 0);
    } else {
        return false;
    }
}








































