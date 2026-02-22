var board = null;
var game = new Chess();
var engine;

// 1. Giải quyết lỗi Security bằng Blob + importScripts
const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
engine = new Worker(URL.createObjectURL(blob));

engine.onmessage = function(e) {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        game.move(move, { sloppy: true });
        board.position(game.fen());
        $('#engine-status').text('Máy đã đi xong');
        $('#user-status').text('Đến lượt bạn');
    }
};

engine.postMessage('uci');
engine.postMessage('isready');

// 2. Hàm xử lý kéo thả
function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    $('#user-status').text('Đã đi xong');
    $('#engine-status').text('Máy đang nghĩ...');
    
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 10');
}

// 3. Khởi tạo bàn cờ với HÌNH ẢNH QUÂN CỜ
var config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop,
    onSnapEnd: () => board.position(game.fen())
};
board = Chessboard('myBoard', config);

// 4. Nút ván mới
$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    engine.postMessage('ucinewgame');
    engine.postMessage('isready');
    $('#user-status').text('Ván mới bắt đầu!');
});
