// --- KHAI BÁO BIẾN TOÀN CỤC ---
var board = null;
var game = new Chess();
var selectedSquare = null;
var engine = null;

// --- KHỞI TẠO ENGINE (FIX LỖI DÒNG 26) ---
try {
    // Sử dụng link worker trực tiếp để tránh lỗi Reference
    engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
    
    engine.onmessage = function(event) {
        var line = event.data;
        if (line.indexOf('bestmove') > -1) {
            var match = line.match(/bestmove\s([a-h][1-8])([a-h][1-8])(q|r|b|n)?/);
            if (match) {
                makeMove({ from: match[1], to: match[2], promotion: match[3] || 'q' });
            }
        }
    };
    engine.postMessage('uci');
} catch (e) {
    console.error("Worker lỗi, chuyển sang chế độ đánh ngẫu nhiên:", e);
}

// --- CÁC HÀM GIAO DIỆN (Đưa lên đầu để tránh lỗi "not defined") ---
function openLogin() { $('#loginModal').fadeIn(300); }
function closeLogin() { $('#loginModal').fadeOut(300); }

function handleLogin() {
    let name = $('#username').val() || "Kỳ thủ GM";
    $('#display-name').text(name);
    $('#nav-auth-zone').html(`<div class="logged-user">● ${name}</div>`);
    closeLogin();
    startGame();
}

function startGame() {
    $('#home-screen').fadeOut(600);
    playSnd('start');
    setTimeout(() => { if(board) board.resize(); }, 700);
}

// --- LOGIC TRẬN ĐẤU ---
function askStockfish() {
    if (game.game_over() || !engine) return;
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go movetime 1000');
}

function makeMove(moveObj) {
    var result = game.move(moveObj);
    if (result === null) return false;

    // Âm thanh
    if (game.in_check()) playSnd('check');
    else if (result.flags.includes('c')) playSnd('capture');
    else playSnd('move');

    board.position(game.fen());
    updateHistory();
    removeHighlights();

    if (game.turn() === 'b' && !game.game_over()) {
        askStockfish();
    }
    return true;
}

// --- KHỞI TẠO BÀN CỜ VÀ SỰ KIỆN ---
function playSnd(id) {
    let s = document.getElementById('snd-' + id.replace('snd-',''));
    if (s) { s.currentTime = 0; s.play().catch(()=>{}); }
}

function removeHighlights() {
    $('.square-55d63').removeClass('highlight-selected');
    $('.suggest-dot').remove();
}

function updateHistory() {
    let h = game.history({verbose: true});
    let html = '';
    for (let i=0; i<h.length; i+=2) {
        html += `<div>${Math.floor(i/2)+1}.</div><div>${h[i].san}</div><div>${h[i+1]?h[i+1].san:''}</div>`;
    }
    $('#move-history').html(html).scrollTop(999);
}

// Cấu hình bàn cờ
board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onSnapEnd: () => board.position(game.fen())
});

// Sự kiện click
$('#myBoard').on('mousedown', '.square-55d63', function(e) {
    e.preventDefault();
    let square = $(this).data('square');
    if (selectedSquare) {
        if (makeMove({from: selectedSquare, to: square, promotion: 'q'})) {
            selectedSquare = null; return;
        }
    }
    removeHighlights();
    let p = game.get(square);
    if (p && p.color === 'w') {
        selectedSquare = square;
        $(this).addClass('highlight-selected');
        game.moves({square: square, verbose: true}).forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot"></div>');
        });
    } else { selectedSquare = null; }
});

$('#resetBtn').on('click', () => { game.reset(); board.start(); $('#move-history').empty(); });
$(window).on('load', () => board.resize());
