var board = null;
var game = new Chess();
var engine;
var currentLang = 'vi';
var selectedSquare = null;

// --- ĐA NGÔN NGỮ (Giữ nguyên từ bản trước) ---
const i18n = {
    vi: { bot_name: "Stockfish AI", user_name: "Người chơi", engine_ready: "Sẵn sàng!", engine_thinking: "Đang nghĩ...", engine_done: "Xong!", user_turn: "Đến lượt bạn", user_waiting: "Đang chờ...", new_game: "Ván mới", move_history: "Lịch sử nước đi", footer: "© 2026 Powered by Stockfish" },
    en: { bot_name: "Stockfish AI", user_name: "Player", engine_ready: "Ready!", engine_thinking: "Thinking...", engine_done: "Done!", user_turn: "Your turn", user_waiting: "Waiting...", new_game: "New Game", move_history: "Move History", footer: "© 2026 Powered by Stockfish" }
};

// --- KHỞI TẠO ENGINE (Bản Blob bảo mật) ---
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

// --- LOGIC DI CHUYỂN QUÂN ---

function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight-selected');
    $('#myBoard .square-55d63').empty(); // Xóa các chấm gợi ý
}

function highlightSquare(square, moves) {
    $(`#myBoard .square-${square}`).addClass('highlight-selected');
    
    moves.forEach(move => {
        const $square = $(`#myBoard .square-${move.to}`);
        const isCapture = game.get(move.to);
        const dotClass = isCapture ? 'suggest-ring' : 'suggest-dot';
        $square.append(`<div class="${dotClass}"></div>`);
    });
}

function makeMove(move) {
    const result = game.move(move, { sloppy: true });
    if (result === null) return false;
    
    board.position(game.fen());
    updateHistory();
    removeHighlights();
    selectedSquare = null;
    return true;
}

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

// Xử lý Click chuột
function onSquareClick(square) {
    // 1. Nếu đã chọn 1 ô trước đó, thử thực hiện nước đi
    if (selectedSquare) {
        const move = makeMove({ from: selectedSquare, to: square, promotion: 'q' });
        
        if (move) {
            // Sau khi người chơi đi, gọi máy tính
            $('#user-status').text(i18n[currentLang].user_waiting);
            $('#engine-status').text(i18n[currentLang].engine_thinking);
            engine.postMessage('position fen ' + game.fen());
            engine.postMessage('go depth 12');
            return;
        }
    }

    // 2. Nếu không phải nước đi, chọn ô mới
    removeHighlights();
    const piece = game.get(square);
    
    // Chỉ cho phép chọn quân của mình (Trắng)
    if (piece && piece.color === 'w') {
        selectedSquare = square;
        const moves = game.moves({ square: square, verbose: true });
        if (moves.length > 0) highlightSquare(square, moves);
    } else {
        selectedSquare = null;
    }
}

// Giữ lại Kéo thả
function onDrop(source, target) {
    const move = makeMove({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    $('#user-status').text(i18n[currentLang].user_waiting);
    $('#engine-status').text(i18n[currentLang].engine_thinking);
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 12');
}

// --- KHỞI TẠO BÀN CỜ ---
board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop,
    onSnapEnd: () => board.position(game.fen())
});

// Gán sự kiện Click cho các ô vuông (Dùng jQuery)
$('#myBoard').on('click', '.square-55d63', function() {
    const square = $(this).data('square');
    onSquareClick(square);
});

// --- ĐỒNG BỘ NGÔN NGỮ ---
function updateLanguage(lang) {
    currentLang = lang;
    $('#lang-select-header, #lang-select-footer').val(lang);
    $('[data-i18n]').each(function() {
        const key = $(this).data('i18n');
        $(this).html(i18n[lang][key]);
    });
}

$('#lang-select-header, #lang-select-footer').on('change', function() {
    updateLanguage($(this).val());
});

$('#resetBtn').on('click', () => {
    game.reset(); board.start(); $('#move-history').empty();
    removeHighlights();
    engine.postMessage('ucinewgame');
});

updateLanguage('vi');
