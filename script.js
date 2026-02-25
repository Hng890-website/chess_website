/ --- KHAI BÁO TOÀN CỤC ---
var board = null;
var game = new Chess();
var engine = null;

// --- HÀM ĐIỀU KHIỂN MÀN HÌNH (GIẢI QUYẾT LỖI LIỆT NÚT) ---
window.enterGame = function() {
    console.log("Đang vào game...");
    $('#home-screen').fadeOut(300, function() {
        $('.app-wrapper').show(); // Hiện giao diện game
        if (board) {
            board.resize(); // Ép bàn cờ to ra
            board.start();  // Reset vị trí
        }
        playSnd('https://lichess1.org/assets/sound/standard/GenericNotify.ogg');
    });
};

window.exitGame = function() {
    $('.app-wrapper').hide();
    $('#home-screen').fadeIn(300);
};

// --- HÀM ÂM THANH ---
function playSnd(url) {
    new Audio(url).play().catch(() => {});
}

// --- LOGIC CỜ VUA ---
function makeMove(moveObj) {
    var move = game.move(moveObj);
    if (move === null) return false;

    // Âm thanh
    let snd = move.flags.includes('c') ? 
        'https://lichess1.org/assets/sound/standard/Capture.ogg' : 
        'https://lichess1.org/assets/sound/standard/Move.ogg';
    playSnd(snd);

    board.position(game.fen());
    updateHistory();

    // Lượt của máy (AI đơn giản để tránh lỗi Worker)
    if (game.turn() === 'b' && !game.game_over()) {
        setTimeout(function() {
            var moves = game.moves();
            var randomMove = moves[Math.floor(Math.random() * moves.length)];
            game.move(randomMove);
            board.position(game.fen());
            updateHistory();
            playSnd('https://lichess1.org/assets/sound/standard/Move.ogg');
        }, 600);
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
    $('#move-history').html(html).scrollTop(9999);
}

// --- KHỞI TẠO BÀN CỜ ---
$(document).ready(function() {
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
    
    // Nút reset
    $('#resetBtn').on('click', function() {
        game.reset();
        board.start();
        $('#move-history').empty();
    });

    $(window).resize(function() {
        if (board) board.resize();
    });
});
