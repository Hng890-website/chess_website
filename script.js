var board = null;
var game = new Chess();
var engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

// 1. Cấu hình Stockfish
engine.postMessage('uci');
engine.postMessage('isready');

engine.onmessage = function(event) {
    if (event.data.indexOf('bestmove') !== -1) {
        var move = event.data.split(' ')[1];
        game.move(move, { sloppy: true });
        board.position(game.fen());
        $('#engine-status').text('Máy đã đi xong');
        $('#user-status').text('Đến lượt bạn đi');
    }
};

// 2. Hàm khi người chơi kéo thả quân cờ
function onDrop(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    $('#user-status').text('Đã đi xong');
    $('#engine-status').text('Máy đang suy nghĩ...');
    
    // Yêu cầu Stockfish tính toán
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 12');
}

// 3. Khởi tạo Bàn cờ (Sửa lỗi 1003 bằng cách dùng đúng ID 'myBoard')
var config = {
    draggable: true,
    position: 'start',
    onDrop: onDrop,
    onSnapEnd: function() { board.position(game.fen()); }
};
board = Chessboard('myBoard', config);

// 4. LOGIC NÚT VÁN MỚI (Reset toàn bộ)
$('#resetBtn').on('click', function() {
    game.reset(); // Reset logic chess.js
    board.start(); // Reset hình ảnh bàn cờ
    engine.postMessage('ucinewgame'); // Báo cho Stockfish ván mới
    engine.postMessage('isready');
    
    $('#user-status').text('Ván mới! Đến lượt bạn.');
    $('#engine-status').text('Máy đang chờ...');
    console.log("Đã làm mới ván đấu.");
});
