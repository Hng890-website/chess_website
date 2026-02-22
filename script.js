var board = null;
var game = new Chess();
var engine;
var currentLang = 'vi';

const i18n = {
    vi: { bot_name: "Stockfish AI", user_name: "Người chơi", engine_ready: "Sẵn sàng!", engine_thinking: "Đang nghĩ...", engine_done: "Xong!", user_turn: "Đến lượt bạn", user_waiting: "Đang chờ...", new_game: "Ván mới", move_history: "Lịch sử nước đi", footer: "© 2026 Powered by Stockfish" },
    en: { bot_name: "Stockfish AI", user_name: "Player", engine_ready: "Ready!", engine_thinking: "Thinking...", engine_done: "Done!", user_turn: "Your turn", user_waiting: "Waiting...", new_game: "New Game", move_history: "Move History", footer: "© 2026 Powered by Stockfish" }
};

// Khởi tạo Stockfish
const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
engine = new Worker(URL.createObjectURL(blob));

engine.onmessage = function(e) {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        makeMove(move);
        $('#engine-status').text(i18n[currentLang].engine_done);
        $('#user-status').text(i18n[currentLang].user_turn);
    }
};

function makeMove(move) {
    game.move(move, { sloppy: true });
    board.position(game.fen());
    updateMoveHistory();
}

function updateMoveHistory() {
    const history = game.history();
    const historyElement = $('#move-history');
    historyElement.empty();
    
    for (let i = 0; i < history.length; i += 2) {
        historyElement.append(`<div class="move-num">${Math.floor(i/2) + 1}.</div>`);
        historyElement.append(`<div class="move-item">${history[i]}</div>`);
        if (history[i+1]) {
            historyElement.append(`<div class="move-item">${history[i+1]}</div>`);
        }
    }
    historyElement.scrollTop(historyElement[0].scrollHeight);
}

function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    updateMoveHistory();
    $('#user-status').text(i18n[currentLang].user_waiting);
    $('#engine-status').text(i18n[currentLang].engine_thinking);
    
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 12');
}

board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop,
    onSnapEnd: () => board.position(game.fen())
});

$('#resetBtn').on('click', () => {
    game.reset();
    board.start();
    $('#move-history').empty();
    engine.postMessage('ucinewgame');
});

$('#lang-select-header, #lang-select-footer').on('change', function() {
    currentLang = $(this).val();
    $('[data-i18n]').each(function() {
        const key = $(this).data('i18n');
        $(this).html(i18n[currentLang][key]);
    });
});
