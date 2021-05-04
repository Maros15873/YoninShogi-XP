var canvas = document.getElementById("hracia_plocha");
var ctx = canvas.getContext("2d");
ctx.fillStyle = "#FFFFFF";

canvas.width = 900;
canvas.height = 900;

selected_piece = null;

starting_positions = new Map();
starting_positions.set(0, {king: [[4,8]], pawn: [[3,7],[5,7],[4,6]], silver: [[2,8],[6,8]], gold: [[3,8],[5,8]], rook: [[4,7]]});
starting_positions.set(1, {king: [[0,4]], pawn: [[2,4],[1,3],[1,5]], silver: [[0,2],[0,6]], gold: [[0,3],[0,5]], rook: [[1,4]]});
starting_positions.set(2, {king: [[4,0]], pawn: [[4,2],[5,1],[3,1]], silver: [[2,0],[6,0]], gold: [[3,0],[5,0]], rook: [[4,1]]});
starting_positions.set(3, {king: [[8,4]], pawn: [[7,3],[7,5],[6,4]], silver: [[8,2],[8,6]], gold: [[8,3],[8,5]], rook: [[7,4]]});

class Plate{

    constructor(x,y,width,height,player_id,deg){
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.deg = deg;
        this.player_id = player_id;
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.deg * Math.PI / 180);
        ctx.translate(-this.x, -this.y);
        this.obj = ctx.strokeRect(this.x - (this.width/2), this.y - (this.height/2), this.width, this.height);
        this.prisoners = this.fillPrisoners();
        ctx.restore();
    }

    fillPrisoners(){
        var matrix = Array(4).fill();
        var names = ["pawn","silver","gold","rook"];
        for (var i = 0; i < 4; i++){
            matrix[i] = new Prisoner(this.x - (this.width/2)+90+i*80, this.y - (this.height/2)+90, names[i],this.player_id,this.deg);
        }
        return matrix;
    }

    updatePrisoner(index){
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.deg * Math.PI / 180);
        ctx.translate(-this.x, -this.y);
        this.prisoners[index].addPrisoner();
        ctx.restore();
    }

}

class Prisoner{

    constructor(x,y,name,player_id,deg){
        this.x = x;
        this.y = y;
        this.number = 0;
        this.name = name;
        this.width = 60;
        this.height = 60;
        this.deg = deg;
        this.player_id = player_id;

        //this.obj = ctx.strokeRect(this.x, this.y, this.width, this.height);
        this.obj = new Square(this.x, this.y, null,null);
        this.obj_name = ctx.fillText(this.name, this.x, this.y-10);
        this.obj_number =  ctx.fillText(this.number, this.x, this.y+70);
        //this.piece = null;

    }

    updateNumber(){
        
        ctx.fillStyle = "white";
        ctx.fillRect(this.x-10, this.y-20, this.width+20, this.height+40);//premazanie
        ctx.fillStyle = "black";

        this.obj = ctx.strokeRect(this.x, this.y, this.width, this.height);
        this.obj_name = ctx.fillText(this.name, this.x, this.y-10);
        this.obj_number =  ctx.fillText(this.number, this.x, this.y+70);
    }

    addPrisoner(){
        this.number = this.number + 1;
        this.updateNumber();
    }

    removePrisoner(){
        this.number = this.number - 1;
        this.updateNumber();
    }

    addPiece(type){
        var dir = "img/shogi-set-01/";
        var deg = [0,90,180,-90];
        
        if (type == "pawn"){
            this.piece = new Pawn(100, 100,null,null,dir + "pawn.gif", type,this.player_id, deg[this.player_id], false);
        } else if (type == "silver"){
            this.piece = new Silver(this.x, this.y,null,null,dir + "silver.gif", type,this.player_id, deg[this.player_id], false); 
        } else if (type == "gold"){
            this.piece = new Gold(this.x, this.y,null,null,dir + "gold.gif", type,this.player_id, deg[this.player_id]);
        } else if (type == "rook"){
            this.piece = new Rook(this.x, this.y,null,null,dir + "rook.gif" ,type,this.player_id, deg[this.player_id], false);
        }
    }

}

class Board{

    constructor(){
        this.x = 180;
        this.y = 180;
        this.width = 540;
        this.height = 540;
        ctx.lineWidth = 2;
        this.obj = ctx.strokeRect(this.x, this.y, this.width, this.height);
        this.squares = this.fillBoard();
    }

    fillBoard (){
        var matrix = Array(9).fill().map(()=>Array(9).fill());
        var x = this.x;
        var y = this.y;
        for (var i = 0; i < 9; i++){
            for (var j = 0; j < 9; j++){
                matrix[i][j] = new Square(x,y,i,j);
                y = y + 60;
            }
            y = this.y;
            x = x + 60;
        }
        return matrix;
    }

}

class Square{

    constructor(x,y,col,row){
        this.x = x;
        this.y = y;
        this.column = col;
        this.row = row;
        this.width = 60;
        this.height = 60;
        this.obj = ctx.strokeRect(this.x, this.y, this.width, this.height);
        this.piece = null;
    }

    highlight(){
        ctx.strokeStyle = "#32CD32";
        this.obj = ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    addPiece(type,player_id){
        var dir = "img/shogi-set-01/";
        var deg = [0,90,180,-90];
        if (type == "king"){
            this.piece = new King(this.x+5, this.y+5,this.column,this.row, dir + "king.gif", type,player_id, deg[player_id]);
        } else if (type == "pawn"){
            this.piece = new Pawn(this.x+5, this.y+5,this.column,this.row,dir + "pawn.gif", type,player_id, deg[player_id], false);
        } else if (type == "silver"){
            this.piece = new Silver(this.x+5, this.y+5,this.column,this.row,dir + "silver.gif", type,player_id, deg[player_id], false);
        } else if (type == "gold"){
            this.piece = new Gold(this.x+5, this.y+5,this.column,this.row,dir + "gold.gif", type,player_id, deg[player_id]);
        } else if (type == "rook"){
            this.piece = new Rook(this.x+5, this.y+5,this.column,this.row,dir + "rook.gif" ,type,player_id, deg[player_id], false);
        }
    }

    update(){
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.strokeStyle = "#000000";
        this.obj = ctx.strokeRect(this.x, this.y, this.width, this.height);
        if (this.piece != null) {
            //console.log(this.piece);
            this.piece.update();
        }
    }

}

class Piece{

    constructor(x,y,column, row, src, type, player_id, deg){
        this.x = x;
        this.y = y;
        this.column = column;
        this.row = row;
        this.img = new Image();
        this.img.src = src;
        this.type = type;
        this.img.onload = () => {
            ctx.save();
            ctx.translate(this.x+25, this.y+25);
            ctx.rotate(deg * Math.PI / 180);
            ctx.translate(-(this.x+25), -(this.y+25));
            ctx.drawImage(this.img,this.x,this.y, 50, 50);
            ctx.restore();
        }
        this.player_id = player_id;
        this.update = function() {
            ctx.save();
            ctx.translate(this.x+25, this.y+25);
            ctx.rotate(deg * Math.PI / 180);
            ctx.translate(-(this.x+25), -(this.y+25));
            ctx.drawImage(this.img,this.x,this.y, 50, 50);
            ctx.restore();
        }
        this.moves = [];
        this.promoted_moves = [];
        this.promoted = false;
    }

    makeMove(col,row){

        if (board.squares[col][row].piece != null) {
            console.log(board.squares[col][row].piece.type);
            if (board.squares[col][row].piece.type == "pawn"){
                players[this.player_id].updatePrisoner(0);
            } else if (board.squares[col][row].piece.type == "silver"){
                players[this.player_id].updatePrisoner(1);
            } else if (board.squares[col][row].piece.type == "gold"){
                players[this.player_id].updatePrisoner(2);
            } else if (board.squares[col][row].piece.type == "rook"){
                players[this.player_id].updatePrisoner(3);
            }
            board.squares[col][row].addPiece(board.squares[this.column][this.row].piece.type, board.squares[this.column][this.row].piece.player_id);
            board.squares[col][row].update();
        } else {
            board.squares[col][row].addPiece(board.squares[this.column][this.row].piece.type, board.squares[this.column][this.row].piece.player_id);   
        }

        board.squares[this.column][this.row].piece = null;
        board.squares[this.column][this.row].update();
        
    }

    isValidMove(column, row){

        if (board.squares[column][row].piece != null && board.squares[column][row].piece.player_id == this.player_id) {
            return false;
        }

        if (!(column >= 0 && column <= 8 && row >= 0 && row <= 8)){
            return false;
        }
        var move = [column-this.column,row - this.row];
        if (this.promoted){
            for (var i = 0; i < this.promoted_moves.length; i++){
                if (this.compare(this.promoted_moves[i], move)) {                   
                    return true;
                }
            }
            return false;
        } else {
            for (var i = 0; i < this.moves.length; i++){
                if (this.compare(this.moves[i], move)) {
                    return true;
                }
            }
            return false;
        }
    }

    compare(a,b){
        return a.toString() == b.toString();
    }

    changeImg(src){
        this.img.src = src;
    }
}

class King extends Piece{

    constructor(x,y,column, row, src, type, player_id, deg){
        super(x,y,column, row, src, type, player_id, deg);
        this.moves = [[0,1],[0,-1],[-1,0],[1,0],[-1,1],[-1,-1],[1,1],[1,-1]];
    }

}

class Pawn extends Piece{

    constructor(x,y,column, row, src, type, player_id, deg, promoted){
        super(x,y,column, row, src, type, player_id, deg);
        this.promoted = promoted;
        this.moves = [[0,-1]];
        this.promoted_moves = [[0,-1],[0,1],[1,0],[-1,0],[1,-1],[-1,-1]];
    }

}

class Silver extends Piece{

    constructor(x,y,column, row, src, type, player_id, deg, promoted){
        super(x,y,column, row, src, type, player_id, deg);
        this.promoted = promoted;
        this.moves = [[0,-1],[1,-1],[1,1],[-1,-1],[-1,1]];
        this.promoted_moves = [[0,-1],[0,1],[1,0],[-1,0],[1,-1],[-1,-1]];
    }

}

class Gold extends Piece{

    constructor(x,y,column, row, src, type, player_id, deg){
        super(x,y,column, row, src, type, player_id, deg);
        this.moves = [[0,-1],[0,1],[1,0],[-1,0],[1,-1],[-1,-1]];
    }

}

class Rook extends Piece{

    constructor(x,y,column, row, src, type, player_id, deg, promoted){
        super(x,y,column, row, src, type, player_id, deg);
        this.promoted = promoted;
        this.moves = [[0,1],[0,2],[0,3],[0,4],[0,5],[0,6],[0,7],[0,8],
                      [0,-1],[0,-2],[0,-3],[0,-4],[0,-5],[0,-6],[0,-7],[0,-8],
                      [-1,0],[-2,0],[-3,0],[-4,0],[-5,0],[-6,0],[-7,0],[-8,0],
                      [1,0],[2,0],[3,0],[4,0],[5,0],[6,0],[7,0],[8,0]];
        this.promoted_moves = [[-1,1],[-1,-1],[1,1],[1,-1]].concat(this.moves);
    }

}

function getMousePosition(canvas, event) {
    let rect = canvas.getBoundingClientRect();
    let x = event.clientX - rect.left;
    let y = event.clientY - rect.top;
    console.log("Coordinate x: " + x, 
                "Coordinate y: " + y);
    console.log(getSquareByCoord(x,y));
}
  
canvas.addEventListener("mousedown", function(e)
{
    getMousePosition(canvas, e);
});

function getSquareByCoord(x,y) {
    var start_point = [180,180];
    var tile_size = 60;

    x = Math.floor((x - start_point[0])/tile_size);
    y = Math.floor((y - start_point[1])/tile_size);

    if (!(x >= 0 && x <= 8 && y <= 8 && y >=0)) {
        if (selected_piece != null) {
            selected_piece.update();
        }
        selected_piece = null;
        return null;
    }

    if (selected_piece != null) {
        selected_piece.update();
    }

    if (selected_piece != null && selected_piece.piece.isValidMove(x,y)){
        selected_piece.piece.makeMove(x,y);
        console.log("VALID MOVE");
    } 

    if (board.squares[x][y].piece != null) {
        selected_piece = board.squares[x][y];
    } else {
        selected_piece = null;
    }

    if (selected_piece != null) {
        selected_piece.highlight();
    }

    return [x,y]
}


board = new Board();
players = [new Plate(450,810,540,180,0,0),new Plate(90,450,540,180,1,90),new Plate(450,90,540,180,2,180),new Plate(810,450,540,180,3,-90)];

deg = [0,90,180,-90];
for (var i = 0; i < 4; i ++){
    var obj = starting_positions.get(i);
    board.squares[obj.king[0][0]][obj.king[0][1]].addPiece("king",i);
    for (var j = 0; j < obj.pawn.length; j++){
        board.squares[obj.pawn[j][0]][obj.pawn[j][1]].addPiece("pawn",i);
    }
    for (var j = 0; j < obj.silver.length; j++){
        board.squares[obj.silver[j][0]][obj.silver[j][1]].addPiece("silver",i);
    }
    for (var j = 0; j < obj.gold.length; j++){
        board.squares[obj.gold[j][0]][obj.gold[j][1]].addPiece("gold",i);
    }
    for (var j = 0; j < obj.rook.length; j++){
        board.squares[obj.rook[j][0]][obj.rook[j][1]].addPiece("rook",i);
    }
}





























