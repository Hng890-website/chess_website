var board = null;
var game = new Chess();
var selectedSquare = null;

// --- KHỞI TẠO STOCKFISH ---
// Sử dụng Stockfish qua CDN để đảm bảo không lỗi file cục bộ
var engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');

// Lắng nghe phản hồi từ Stockfish
engine.onmessage = function(event) {
    var line = event.data;
    if (line.indexOf('bestmove') > -1) {
        var match = line.match(/bestmove\s([a-h][1-8])([a-h][1-8])(q|r|b|n)?/);
        if (match) {
            // Máy thực hiện nước đi
            makeMove({
                from: match[1],
                to: match[2],
                promotion: match[3] || 'q'
            });
        }
    }
};

// Hàm yêu cầu máy tính toán
function askStockfish() {
    if (game.game_over()) return;
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go movetime 1000'); // Máy suy nghĩ trong 1 giây
}

// --- HỆ THỐNG ÂM THANH ---
const sounds = {
    move: document.getElementById('snd-move'),
    capture: document.getElementById('snd-capture'),
    check: document.getElementById('snd-check'),
    start: document.getElementById('snd-start')
};

function playSnd(id) {
    if (sounds[id]) {
        sounds[id].currentTime = 0;
        sounds[id].play().catch(() => {});
    }
}

// --- LOGIC GAME ---
function makeMove(moveObj) {
    var result = game.move(moveObj);
    if (result === null) return false;

    // Phát âm thanh
    if (game.in_check()) playSnd('check');
    else if (result.flags.includes('c') || result.flags.includes('e')) playSnd('capture');
    else playSnd('move');

    board.position(game.fen());
    updateHistory();
    removeHighlights();

    // Nếu vừa đi xong là lượt của Đen (Máy), gọi Stockfish
    if (game.turn() === 'b' && !game.game_over()) {
        askStockfish();
    }
    
    if (game.game_over()) {
        setTimeout(() => alert("Trận đấu kết thúc!"), 500);
    }
    return true;
}

function updateHistory() {
    let h = game.history({ verbose: true });
    let html = '';
    for (let i = 0; i < h.length; i += 2) {
        html += `<div>${Math.floor(i/2)+1}.</div>`;
        html += `<div class="m-item">${h[i].san}</div>`;
        html += `<div class="m-item">${h[i+1] ? h[i+1].san : ''}</div>`;
    }
    $('#move-history').html(html).scrollTop($('#move-history')[0].scrollHeight);
}

function removeHighlights() {
    $('.square-55d63').removeClass('highlight-selected');
    $('.suggest-dot').remove();
}

// --- KHỞI TẠO BÀN CỜ ---
var config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onSnapEnd: function() { board.position(game.fen()); }
};
board = Chessboard('myBoard', config);

// Bắt sự kiện Click-to-Move
$('#myBoard').on('mousedown', '.square-55d63', function(e) {
    e.preventDefault();
    let square = $(this).data('square');
    
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null;
            return;
        }
    }

    removeHighlights();
    let piece = game.get(square);
    if (piece && piece.color === 'w') {
        selectedSquare = square;
        $(this).addClass('highlight-selected');
        game.moves({ square: square, verbose: true }).forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot"></div>');
        });
    } else {
        selectedSquare = null;
    }
});

// Nút bấm
$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    $('#move-history').empty();
    removeHighlights();
    selectedSquare = null;
    playSnd('start');
});

function startGame() {
    $('#home-screen').fadeOut(600);
    playSnd('start');
    setTimeout(() => board.resize(), 700);
}

$(window).on('load', () => board.resize());
$(window).resize(() => board.resize());
