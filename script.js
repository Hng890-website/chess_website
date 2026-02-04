var board = null;
var game = new Chess();
var engine;

// Hàm tạo Worker cho Stockfish với fallback an toàn
function createStockfishWorker() {
    const url = 'https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js';

    // Thử tạo Worker trực tiếp từ URL (yêu cầu CDN cho phép CORS)
    try {
        return new Worker(url);
    } catch (e) {
        // Nếu bị SecurityError, tạo một Blob cùng gốc chứa importScripts để tải script từ CDN
        try {
            const blob = new Blob([`importScripts('${url}');`], { type: 'application/javascript' });
            const workerUrl = URL.createObjectURL(blob);
            return new Worker(workerUrl);
        } catch (err) {
            console.error('Không thể tạo Stockfish worker:', err);
            return null;
        }
    }
}

// Khởi tạo engine (Worker)
engine = createStockfishWorker();

if (engine) {
    // Khởi tạo các giao thức Stockfish sau khi Worker nạp xong
    engine.onmessage = function(event) {
        if (typeof event.data === 'string' && event.data.includes('bestmove')) {
            const move = event.data.split(' ')[1];
            game.move(move, { sloppy: true }); // Máy thực hiện nước đi
            board.position(game.fen());        // Cập nhật bàn cờ
            $('#engine-status').text('Máy đã đi xong');
            $('#user-status').text('Đến lượt bạn đi');
        } else if (typeof event.data === 'string' && event.data.includes('readyok')) {
            // optional: handle readyok
            // console.log('Stockfish ready');
        }
    };

    engine.postMessage('uci');
    engine.postMessage('isready');
} else {
    console.error('Engine không khả dụng. Kiểm tra CORS / CSP hoặc thử chạy trên một server (không phải file://).');
    $('#engine-status').text('Engine không khả dụng');
}

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
