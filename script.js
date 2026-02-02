var board = null;
var game = new Chess();
var engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

function onDragStart(source, piece, position, orientation) {
    if (game.game_over()) return false;
    if (piece.search(/^b/) !== -1) return false; // Người chơi chỉ cầm quân Trắng
}

function makeEngineMove() {
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 12'); // Độ sâu tính toán của máy
    $('#engine-status').text('Máy đang tính...');
}

engine.onmessage = function(event) {
    if (event.data.indexOf('bestmove') !== -1) {
        var move = event.data.split(' ')[1];
        game.move(move, { sloppy: true });
        board.position(game.fen());
        $('#engine-status').text('Đã đi xong');
        $('#user-status').text('Đến lượt bạn');
    }
};

function onDrop(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    $('#user-status').text('Đã đi xong');
    window.setTimeout(makeEngineMove, 250);
}

function onSnapEnd() {
    board.position(game.fen());
}

var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

// SỬA LỖI 1003: ID phải khớp hoàn toàn với HTML
board = Chessboard('myBoard', config);

$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
});
