var board = null;
var game = new Chess();

function onSnapEnd() {
    board.position(game.fen());
}

// Cấu hình quan trọng nhất: PIECE THEME
var config = {
    draggable: true,
    position: 'start',
    // Link ảnh Wikipedia - Sẽ sửa lỗi 404 của bạn
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: handleMove,
    onSnapEnd: onSnapEnd
};

board = Chessboard('myBoard', config);

function handleMove(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';
    updateHistory();
}

function updateHistory() {
    $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
}

$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    $('#move-history').empty();
});

// Fix lỗi bàn cờ nhỏ khi load
$(window).on('load', function() {
    board.resize();
});
