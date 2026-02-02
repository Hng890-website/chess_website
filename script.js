// Khởi tạo máy chơi từ tệp cục bộ trên GitHub
var engine = new Worker('stockfish.js'); 

// Gửi lệnh chuẩn bị
engine.postMessage('uci');
engine.postMessage('isready');

// Khi máy tính toán xong
engine.onmessage = function(event) {
    if (event.data.includes('bestmove')) {
        var move = event.data.split(' ')[1];
        game.move(move, { sloppy: true });
        board.position(game.fen());
        $('#engine-status').text('Máy đã đi xong');
    }
};

// Hàm này gọi khi bạn thả quân cờ
function onDrop(source, target) {
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    
    // Gửi FEN hiện tại cho Stockfish tính toán
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 10'); 
    $('#engine-status').text('Máy đang suy nghĩ...');
}
