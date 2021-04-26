var socket = io();
var board = [];

//list of figures on the board
var kings = [];
var goldenGenerals = [];
var silverGenerals = [];
var promotedSilverGenerals = [];
var rooks = [];
var promotedRooks = [];
var pawns = [];
var promotedPawns = [];

var canvas = document.getElementById('chess-board');
var con = canvas.getContext("2d");

var selectedFigure = null;

kings.push(king1);kings.push(king2);kings.push(king3);kings.push(king4);
rooks.push(rook1);rooks.push(rook2);rooks.push(rook3);rooks.push(rook4);

goldenGenerals.push(goldenGeneral1);goldenGenerals.push(goldenGeneral2);goldenGenerals.push(goldenGeneral3);
goldenGenerals.push(goldenGeneral5);goldenGenerals.push(goldenGeneral5);goldenGenerals.push(goldenGeneral6);

silverGenerals.push(silverGeneral1);silverGenerals.push(silverGeneral2);silverGenerals.push(silverGeneral3);
silverGenerals.push(silverGeneral4);silverGenerals.push(silverGeneral5);silverGenerals.push(silverGeneral6);

pawns.push(pawn1);pawns.push(pawn2);pawns.push(pawn3);pawns.push(pawn4);pawns.push(pawn5);pawns.push(pawn6);
pawns.push(pawn7);pawns.push(pawn8);pawns.push(pawn9);pawns.push(pawn10);pawns.push(pawn11);pawns.push(pawn12);

//var a = [King, GoldenGenera, SilverGeneral, PromotedSilverGeneral, Rook, PromotedRook, Pawn, PromotedPawn];

// notify server about my presence
socket.on('connect', function () {
    socket.emit('join');
});

//Tomas, tuto funkciu si pomenuj ako chces, zmen ju alebo zmaz
function start () {
    var params = jQuery.deparam(window.location.search);
    console.log(params);
    console.log('-------------')
    console.log(JSON.parse(localStorage.getItem('CURRENT_GAME')));
    /*
    //hrac1
    console.log(params.id1);
    console.log(params.name1);
    console.log(params.room1);

    //hrac2
    console.log(params.id2);
    console.log(params.name2);
    console.log(params.room2);

    //hrac3
    console.log(params.id3);
    console.log(params.name3);
    console.log(params.room3);

    //hrac4
    console.log(params.id4);
    console.log(params.name4);
    console.log(params.room4);*/

    window.history.replaceState(null, null, window.location.pathname); // REMOVING PARAMS FROM URL
    //Tu vykreslim prvy krat boardu
}

class Figure {
    constructor(ownerID, x, y, typ, object){
        this.ownerID = ownerID;
        this.x = x;
        this.y = y;
        this.typ = typ;
        this.object = object;
    }

    moves() {
        switch(this.typ){
            case 'x':
                this.typ = '950';
                break;
            default:
                this.typ = '900';
        }
    }
}

    //var a = [King, GoldenGenera, SilverGeneral, PromotedSilverGeneral, Rook, PromotedRook, Pawn, PromotedPawn];



class Board {
    constructor(config, board, setNo) {
        this.options = {
        selector: document.querySelector("#board"),
        width: 540,
        size: 9,
        light: '#E3C795',
        dark: '#E3C795'
        };
        this.board = board;
        if(config) Object.assign(this.options, this.options, config);
        this.path = "img/shogi-set-0" + setNo;
        this.drawBoard();
    }

    drawBoard() {
        let el = this.options.selector;
        let ctx = el.getContext("2d");
        ctx.clearRect(0, 0, ctx.width, ctx.height);
        let squareWidth = this.options.width / this.options.size;
        let totalSquares = Math.pow(this.options.size, 2);
        let i, x, y = -1;
        
        el.width = this.options.width;
        el.height = this.options.width;
        
        for (i = 0; i < totalSquares; i++) {
            x++;
            if (i % this.options.size == 0) {
                y++; 
                x = 0;
            }     
            ctx.beginPath();
            ctx.rect(x * squareWidth, y * squareWidth, squareWidth, squareWidth);
            ctx.fillStyle = (x + y) % 2 ? this.options.dark : this.options.light;
            ctx.fill();
            
        }
        x = [0,60,120,180,240,300,360,420,480,540];
        for (i = 0; i < totalSquares; i++) {
            ctx.moveTo(0,x[i]);
            ctx.lineTo(540,x[i]);                            
            ctx.stroke();
            ctx.moveTo(x[i],0);
            ctx.lineTo(x[i],540);                            
            ctx.stroke();
        }
    }

    drawFigures(){
        this.drawBoard();
        for (let i=0; i<9; i++){
            for (let j=0; j<9; j++){
                if (this.board[i][j] != null){
                    let fig = this.board[i][j];
                    con.drawImage(fig.object,fig.y*60+7,fig.x*60+7);
                }
            }
        }
    }
}

var chessBoard = new Board({selector: document.querySelector("#chess-board")}, board, 2);

var board = [
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null, null],
    [null, null, null, null, new Figure("ano", 6, 4, "pawn", pawns[2]), null, null, null, null],
    [null, null, null, new Figure("ano", 7, 3, "pawn", pawns[0]), new Figure("ano", 7, 4, "rook", rooks[0]), new Figure("ano", 7, 5, "pawn", pawns[1]), null, null, null],
    [null, null, new Figure("ano", 8, 2, "silverGeneral", silverGenerals[0]), new Figure("ano", 8, 3, "goldenGeneral", goldenGenerals[0]), new Figure("ano", 8, 4, "king", kings[0]), new Figure("ano", 8, 5,"goldenGeneral", goldenGenerals[1]), new Figure("ano", 8, 6, "silverGeneral", silverGenerals[1]), null, null],
];

$(window).on("load", function() {
    chessBoard.board = board;
    chessBoard.drawBoard();
    chessBoard.drawFigures();
});

//setTimeout(chessBoard.drawBoard(), 3000);

//setTimeout(chessBoard.drawFigures(), 3000);



function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return {
        x: evt.clientX - rect.left,
        y: evt.clientY - rect.top
    };
}

canvas.addEventListener("click", function (evt) {
    var mousePos = getMousePos(canvas, evt);
    row = Math.floor(mousePos.y/60);
    col = Math.floor(mousePos.x/60);
    let tile = board[row][col];

    if (selectedFigure == null){
        if (tile != null) {
            selectedFigure = tile;
            board[row][col] = null;
        }
    }
    else {
        chessBoard.drawBoard();
        selectedFigure.x = row;
        selectedFigure.y = col;
        board[row][col] = selectedFigure;
        selectedFigure = null;
        chessBoard.drawFigures();
    }

    console.log(board);
    console.log(row + ',' + col);
    console.log(board[row][col]);
    
}, false);

canvas.addEventListener("mousemove", function(evt){
    var rect = canvas.getBoundingClientRect();
    x = evt.clientX - rect.left;
    y = evt.clientY - rect.top ;
    if (selectedFigure != null) {
        chessBoard.drawFigures();
        con.drawImage(selectedFigure.object,x-28,y-20);
    }
    
},false);
/*

*/
