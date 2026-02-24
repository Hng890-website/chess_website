var board = null;
var game = new Chess();
var selectedSquare = null;

// --- KHỞI TẠO ENGINE THEO CÁCH MỚI ---
var engine = typeof Stockfish === "function" ? Stockfish() : null;

if (engine) {
    engine.onmessage = function(line) {
        // Stockfish trực tiếp trả về chuỗi, không cần .data
        if (line.indexOf('bestmove') > -1) {
            var match = line.match(/bestmove\s([a-h][1-8])([a-h][1-8])(q|r|b|n)?/);
            if (match) {
                makeMove({
                    from: match[1],
                    to: match[2],
                    promotion: match[3] || 'q'
                });
            }
        }
    };
    // Khởi động Engine
    engine.postMessage('uci');
    engine.postMessage('isready');
} else {
    console.error("Không thể khởi tạo Stockfish. Kiểm tra lại link script trong HTML.");
}

// Hàm yêu cầu máy đi
function askStockfish() {
    if (game.game_over() || !engine) return;
    
    console.log("Đang hỏi Stockfish...");
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go movetime 1000'); 
}

// --- HÀM MAKEMOVE (GIỮ NGUYÊN NHƯNG THÊM LOG ĐỂ KIỂM TRA) ---
function makeMove(moveObj) {
    var result = game.move(moveObj);
    if (result === null) return false;

    // Âm thanh
    if (game.in_check()) playSnd('check');
    else if (result.flags.includes('c') || result.flags.includes('e')) playSnd('capture');
    else playSnd('move');

    board.position(game.fen());
    updateHistory();
    removeHighlights();

    // Kiểm tra lượt máy
    if (game.turn() === 'b' && !game.game_over()) {
        console.log("Đến lượt máy (Đen)");
        askStockfish();
    }
    
    return true;
}

// Các hàm âm thanh, init board, click-to-move... (Giữ nguyên từ bản trước)
