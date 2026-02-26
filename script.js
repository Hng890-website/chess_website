var board = null;
var game = new Chess();
var currentLang = 'en';

const translations = {
    vi: {
        "nav-play": "Chơi Game", "nav-puzzle": "Câu đố", "nav-analysis": "Phân tích",
        "settings": "Ngôn ngữ", "play-opponent": "Đấu trực tuyến",
        "play-stockfish": "Đấu với Stockfish", "history-title": "LỊCH SỬ", "btn-quit": "THOÁT"
    },
    en: {
        "nav-play": "Play", "nav-puzzle": "Puzzle", "nav-analysis": "Analysis",
        "settings": "Language", "play-opponent": "Play with opponent",
        "play-stockfish": "Play with Stockfish", "history-title": "HISTORY", "btn-quit": "QUIT"
    }
};

window.closeCmosModal = function() {
    $('#cmos-modal').fadeOut(200);
};

function updateClock() {
    const now = new Date();
    // Để TEST pin Dead, bạn hãy đổi dòng dưới thành: const d = 1, m = 1, y = 2000;
    const d = now.getDate(), m = now.getMonth() + 1, y = now.getFullYear();
    
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    $('#os-time').text(timeStr);
    $('#os-date').text(`${d < 10 ? '0'+d : d}.${m < 10 ? '0'+m : m}.${y}`);

    const statusElem = $('#cmos-status');
    const dotElem = $('#cmos-dot');
    
    // LOGIC PIN CMOS
    if (true) {
        statusElem.text("Dead").addClass('status-dead').removeClass('status-working');
        dotElem.css('background', '#e74c3c');
        
        // Hiển thị thông báo ẩn
        if (!$('#cmos-modal').data('shown')) {
            $('#cmos-modal').css('display', 'flex').hide().fadeIn(500);
            $('#cmos-modal').data('shown', true);
        }
    } else {
        statusElem.text("Working").addClass('status-working').removeClass('status-dead');
        dotElem.css('background', '#2ecc71');
    }
}

window.toggleLang = function() {
    currentLang = currentLang === 'en' ? 'vi' : 'en';
    $('[data-lang]').each(function() {
        const key = $(this).data('lang');
        $(this).text(translations[currentLang][key]);
    });
};

window.enterGame = function(mode) {
    if(mode === 'online') return alert("Online mode is under development.");
    $('#main-menu').fadeOut(400, function() {
        $('#game-area').fadeIn(400);
        if(!board) initBoard();
        else { game.reset(); board.start(); }
        board.resize();
    });
};

window.backToMenu = function() {
    $('#game-area').hide();
    $('#main-menu').fadeIn(400);
};

function initBoard() {
    board = Chessboard('myBoard', {
        draggable: true, position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDrop: (s, t) => {
            let move = game.move({ from: s, to: t, promotion: 'q' });
            if (!move) return 'snapback';
            $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
            window.setTimeout(makeMachineMove, 500);
        }
    });
}

function makeMachineMove() {
    let moves = game.moves();
    if(moves.length === 0) return;
    game.move(moves[Math.floor(Math.random() * moves.length)]);
    board.position(game.fen());
    $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
}

$(document).ready(() => {
    setInterval(updateClock, 1000);
    updateClock();
});
$(window).resize(() => board && board.resize());
