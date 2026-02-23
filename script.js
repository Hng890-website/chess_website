var board = null;
var game = new Chess();
var engine;
var currentLang = 'vi';

const i18n = {
    vi: {
        bot_name: "Stockfish AI", user_name: "Người chơi",
        engine_ready: "Máy đã sẵn sàng!", engine_thinking: "Máy đang nghĩ...",
        engine_done: "Máy đã đi xong!", user_turn: "Đến lượt bạn đi",
        user_waiting: "Chờ máy tính...", new_game: "Ván mới",
        move_history: "Lịch sử nước đi", footer: "© 2026 Được vận hành bởi Stockfish | Phát triển bởi HNG890"
    },
    en: {
        bot_name: "Stockfish AI", user_name: "Player",
        engine_ready: "Engine is ready!", engine_thinking: "Thinking...",
        engine_done: "Engine moved!", user_turn: "Your turn to move",
        user_waiting: "Waiting for engine...", new_game: "New Game",
        move_history: "Move History", footer: "© 2026 Powered by Stockfish | Developed by HNG890"
    }
};

// Hàm đồng bộ và cập nhật ngôn ngữ
function updateLanguage(lang) {
    currentLang = lang;
    
    // Đồng bộ giá trị của cả 2 thanh chọn
    $('#lang-select-header, #lang-select-footer').val(lang);

    // Cập nhật các thành phần có thuộc tính data-i18n
    $('[data-i18n]').each(function() {
        const key = $(this).data('i18n');
        $(this).html(i18n[lang][key]);
    });

    // Cập nhật trạng thái động (Status)
    if (game.turn() === 'w') {
        $('#user-status').text(i18n[lang].user_turn);
    } else {
        $('#engine-status').text(i18n[lang].engine_thinking);
    }
}

// Gán sự kiện cho cả 2 thanh chọn
$('#lang-select-header, #lang-select-footer').on('change', function() {
    updateLanguage($(this).val());
});

// --- ENGINE & GAME LOGIC ---
const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
engine = new Worker(URL.createObjectURL(blob));

engine.onmessage = function(e) {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        game.move(move, { sloppy: true });
        board.position(game.fen());
        updateHistory();
        $('#engine-status').text(i18n[currentLang].engine_done);
        $('#user-status').text(i18n[currentLang].user_turn);
    }
};

function updateHistory() {
    const history = game.history();
    const list = $('#move-history');
    list.empty();
    for (let i = 0; i < history.length; i += 2) {
        list.append(`<div class="move-num">${Math.floor(i/2) + 1}.</div>`);
        list.append(`<div class="move-item">${history[i]}</div>`);
        if (history[i+1]) list.append(`<div class="move-item">${history[i+1]}</div>`);
    }
    list.scrollTop(list[0].scrollHeight);
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';
    updateHistory();
    $('#user-status').text(i18n[currentLang].user_waiting);
    $('#engine-status').text(i18n[currentLang].engine_thinking);
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 12');
}

board = Chessboard('myBoard', {
    draggable: true, position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop, onSnapEnd: () => board.position(game.fen())
});

$('#resetBtn').on('click', () => {
    game.reset(); board.start(); $('#move-history').empty();
    engine.postMessage('ucinewgame');
    updateLanguage(currentLang);
});

// Khởi tạo ngôn ngữ mặc định
updateLanguage('vi');
