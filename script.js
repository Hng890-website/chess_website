var board = null;
var game = new Chess();
var engine;

// Kỹ thuật Blob để giải quyết lỗi SecurityError (Cross-Origin)
fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
    .then(response => response.text())
    .then(code => {
        const blob = new Blob([code], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        engine = new Worker(workerUrl);

        // Khởi tạo các giao thức Stockfish sau khi Worker nạp xong
        engine.onmessage = function(event) {
            if (event.data.includes('bestmove')) {
                const move = event.data.split(' ')[1];
                game.move(move, { sloppy: true }); // Máy thực hiện nước đi
                board.position(game.fen());        // Cập nhật bàn cờ
                $('#engine-status').text('Máy đã đi xong');
                $('#user-status').text('Đến lượt bạn đi');
            }
        };

        engine.postMessage('uci');
        engine.postMessage('isready');
    })
    .catch(err => console.error("Không thể tải Stockfish:", err));

// Hàm xử lý khi người chơi kéo quân
function onDrop(source, target) {
    const move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Mặc định phong Hậu
    });

    // Nếu nước đi không hợp lệ
    if (move === null) return 'snapback';

    $('#user-status').text('Đã đi xong');
    $('#engine-status').text('Máy đang suy nghĩ...');
    
    // Gửi FEN hiện tại cho Stockfish
    if (engine) {
        engine.postMessage('position fen ' + game.fen());
        engine.postMessage('go depth 12'); // Độ sâu tính toán
    }
}

// Khởi tạo giao diện bàn cờ
var config = {
    draggable: true,
    position: 'start',
    onDrop: onDrop,
    onSnapEnd: function() { board.position(game.fen()); }
};
board = Chessboard('myBoard', config);

// Xử lý nút Ván mới
$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    if (engine) {
        engine.postMessage('ucinewgame');
        engine.postMessage('isready');
    }
    $('#user-status').text('Ván mới! Đến lượt bạn.');
    $('#engine-status').text('Máy đang chờ...');
});
