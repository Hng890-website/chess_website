var board = null;
var game = new Chess();
var engine = null;

// --- 1. HÀM GIAO DIỆN (Sửa lỗi "not defined") ---
window.startGame = function() {
    $('#home-screen').fadeOut(500, function() {
        $('.app-wrapper').fadeIn(500);
        board.resize();
        playSnd('start');
    });
};

window.exitGame = function() {
    $('.app-wrapper').fadeOut(500, function() {
        $('#home-screen').fadeIn(500);
    });
};

window.openOnlineModal = function() {
    alert("Tính năng Đấu Online đang được bảo trì. Hãy chơi với Máy trước nhé!");
};

// --- 2. HỆ THỐNG ÂM THANH ---
function playSnd(type) {
    let url = "";
    if (type === 'move') url = "https://lichess1.org/assets/sound/standard/Move.ogg";
    if (type === 'capture') url = "https://lichess1.org/assets/sound/standard/Capture.ogg";
    if (type === 'start') url = "https://lichess1.org/assets/sound/standard/GenericNotify.ogg";
    if (type === 'check') url = "https://lichess1.org/assets/sound/standard/Check.ogg";
    
    new Audio(url).play().catch(() => {});
}

// --- 3. KHỞI TẠO ENGINE AI ---
function initEngine() {
    try {
        engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        engine.onmessage = function(event) {
            if (event.data.indexOf('bestmove') > -1) {
                var match = event.data.match(/bestmove\s([a-h][1-8])([a-h][1-8])(q|r|b|n)?/);
                if (match) makeMove({ from: match[1], to: match[2], promotion: match[3] || 'q' });
            }
        };
        engine.postMessage('uci');
    } catch (e) {
        console.warn("Stockfish bị chặn. Máy dùng AI dự phòng.");
    }
}

// --- 4. LOGIC TRẬN ĐẤU ---
function makeMove(moveObj) {
    var move = game.move(moveObj);
    if (move === null) return false;

    // Âm thanh khi đi quân
    if (game.in_check()) playSnd('check');
    else if (move.flags.includes('c')) playSnd('capture');
    else playSnd('move');

    board.position(game.fen());
    updateHistory();
    
    // Lượt của máy
    if (game.turn() === 'b' && !game.game_over()) {
        if (engine) {
            engine.postMessage('position fen ' + game.fen());
            engine.postMessage('go movetime 1000');
        } else {
            // AI dự phòng: Tìm nước ăn quân hoặc đi ngẫu nhiên
            setTimeout(() => {
                let moves = game.moves();
                let captureMoves = moves.filter(m => m.includes('x'));
                let finalMove = captureMoves.length > 0 ? captureMoves[0] : moves[Math.floor(Math.random() * moves.length)];
                makeMove(finalMove);
            }, 600);
        }
    }
    return true;
}

function updateHistory() {
    let history = game.history();
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
        html += `<div style="color:#777">${Math.floor(i/2)+1}.</div>` +
                `<div><b>${history[i]}</b></div>` +
                `<div><b>${history[i+1] || ''}</b></div>`;
    }
    $('#move-history').html(html).scrollTop($('#move-history')[0].scrollHeight);
}

// --- 5. CẤU HÌNH BÀN CỜ ---
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
