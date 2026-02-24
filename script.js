var board = null;
var game = new Chess();

function onSnapEnd() {
    board.position(game.fen());
}

function makeMove(m) {
    var move = game.move(m);
    if (!move) return false;

    // Phát âm thanh
    var snd = move.flags.includes('c') ? 'snd-capture' : 'snd-move';
    document.getElementById(snd).play().catch(() => {});

    board.position(game.fen());
    updateHistory();
    
    // Lượt máy đơn giản
    if (game.turn() === 'b') {
        setTimeout(makeRandomMove, 250);
    }
    return true;
}

function makeRandomMove() {
    var moves = game.moves();
    if (moves.length === 0) return;
    var randomMove = moves[Math.floor(Math.random() * moves.length)];
    makeMove(randomMove);
}

function updateHistory() {
    $('#move-history').text(game.pgn());
}

// KHỞI TẠO BÀN CỜ
var config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);

// FIX LỖI HIỂN THỊ KHI LOAD
$(window).on('load', function() {
    board.resize();
});

// XỬ LÝ CLICK-TO-MOVE (Sửa lỗi "phải kéo")
var selectedSquare = null;
$('#myBoard').on('mousedown', '.square-55d63', function() {
    var square = $(this).attr('data-square');

    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null;
            $('.square-55d63').css('background', '');
            return;
        }
    }

    $('.square-55d63').css('background', '');
    var piece = game.get(square);
    if (piece && piece.color === 'w') {
        selectedSquare = square;
        $(this).css('background', 'rgba(255, 255, 0, 0.4)');
    } else {
        selectedSquare = null;
    }
});

$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    $('#move-history').empty();
});
