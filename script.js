var board = null;
var game = new Chess();
var engine = null;

// Khởi tạo Engine - Dùng phiên bản mượt hơn cho trình duyệt
function initEngine() {
    try {
        // Dùng URL trực tiếp có hỗ trợ CORS tốt hơn
        engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        engine.onmessage = function(event) {
            if (event.data.indexOf('bestmove') > -1) {
                var match = event.data.match(/bestmove\s([a-h][1-8])([a-h][1-8])(q|r|b|n)?/);
                if (match) makeMove({ from: match[1], to: match[2], promotion: match[3] || 'q' });
            }
        };
        engine.postMessage('uci');
    } catch (e) {
        console.warn("Máy sẽ đánh ở chế độ dự phòng.");
    }
}

function makeMove(moveObj) {
    var move = game.move(moveObj);
    if (move === null) return false;

    board.position(game.fen());
    updateHistory();
    
    if (game.turn() === 'b' && !game.game_over()) {
        if (engine) {
            engine.postMessage('position fen ' + game.fen());
            engine.postMessage('go movetime 800'); // Máy nghĩ 0.8s
        } else {
            // AI dự phòng thông minh hơn random: Ưu tiên ăn quân
            setTimeout(makeSimpleAIMove, 500);
        }
    }
    return true;
}

function makeSimpleAIMove() {
    var moves = game.moves();
    // Tìm nước ăn quân
    var captures = moves.filter(m => m.includes('x'));
    var bestMove = captures.length > 0 ? captures[0] : moves[Math.floor(Math.random() * moves.length)];
    game.move(bestMove);
    board.position(game.fen());
    updateHistory();
}

function updateHistory() {
    $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
    var d = $('#move-history');
    d.scrollTop(d.prop("scrollHeight"));
}

// KHỞI TẠO
var config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: function(source, target) {
        var move = makeMove({ from: source, to: target, promotion: 'q' });
        if (move === false) return 'snapback';
    }
};

board = Chessboard('myBoard', config);
$(window).on('load', () => {
    initEngine();
    board.resize();
});
$(window).on('resize', () => board.resize());

$('#resetBtn').on('click', () => {
    game.reset();
    board.start();
    $('#move-history').empty();
});
