var board = null;
var game = new Chess();
var engine;

// Khởi tạo Stockfish
const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
engine = new Worker(URL.createObjectURL(blob));

engine.onmessage = function(e) {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        game.move(move, { sloppy: true });
        board.position(game.fen());
        $('#engine-status').text('Máy vừa đi xong. Tới bạn!');
        $('#user-status').text('Tới lượt bạn đi');
    }
};

engine.postMessage('uci');
engine.postMessage('isready');

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    $('#user-status').text('Chờ máy tính...');
    $('#engine-status').text('Máy đang suy nghĩ...');
    
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 12');
}

board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop,
    onSnapEnd: () => board.position(game.fen())
});

$('#resetBtn').on('click', () => {
    game.reset();
    board.start();
    engine.postMessage('ucinewgame');
    $('#engine-status').text('Máy đã sẵn sàng!');
    $('#user-status').text('Tới lượt bạn đi');
});
