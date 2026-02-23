var board = null;
var game = new Chess();
var engine;
var selectedSquare = null;

// Khởi tạo Stockfish
const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
engine = new Worker(URL.createObjectURL(blob));

engine.onmessage = function(e) {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        if (game.turn() === 'b') {
            makeMove(move);
        } else {
            // Hiển thị gợi ý từ nút Hint
            const from = move.substring(0, 2);
            const to = move.substring(2, 4);
            $(`.square-${from}`).addClass('highlight-hint');
            showDot(to);
        }
    }
};

function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight-selected highlight-hint');
    $('.suggest-dot').remove();
}

function showDot(square) {
    $(`.square-${square}`).append('<div class="suggest-dot"></div>');
}

function updateHistoryUI() {
    const history = game.history();
    const list = $('#move-history');
    list.empty();
    for (let i = 0; i < history.length; i += 2) {
        list.append(`<div class="move-num">${Math.floor(i/2) + 1}</div>`);
        list.append(`<div class="move-item">${history[i]}</div>`);
        if (history[i+1]) list.append(`<div class="move-item">${history[i+1]}</div>`);
    }
    list.scrollTop(list[0].scrollHeight); // Vô hạn nước đi, luôn cuộn xuống
}

function makeMove(moveStr) {
    const move = game.move(moveStr, { sloppy: true });
    if (!move) return false;

    board.position(game.fen());
    updateHistoryUI();
    removeHighlights();

    if (game.turn() === 'b' && !game.game_over()) {
        $('#engine-status').text('Máy đang nghĩ...');
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage('go depth 12');
    }
    return true;
}

// XỬ LÝ CLICK CHỌN QUÂN VÀ CHỌN ĐÍCH
function onSquareClick(square) {
    const piece = game.get(square);

    // 1. Nếu đã chọn 1 quân trước đó, thử di chuyển tới ô vừa click
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null;
            return;
        }
    }

    // 2. Nếu click vào quân của mình (Trắng)
    removeHighlights();
    if (piece && piece.color === 'w') {
        selectedSquare = square;
        $(`.square-${square}`).addClass('highlight-selected');
        
        // Hiện chấm tròn mờ cho các nước hợp lệ
        const moves = game.moves({ square: square, verbose: true });
        moves.forEach(m => showDot(m.to));
    } else {
        selectedSquare = null;
    }
}

// Khởi tạo Board
board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: (source, target) => {
        const move = makeMove({ from: source, to: target, promotion: 'q' });
        if (!move) return 'snapback';
    },
    onSnapEnd: () => board.position(game.fen())
});

// GẮN SỰ KIỆN CLICK VÀO Ô VUÔNG
$('#myBoard').on('click', '.square-55d63', function() {
    const square = $(this).attr('data-square');
    onSquareClick(square);
});

$('#hintBtn').on('click', () => {
    removeHighlights();
    engine.postMessage(`position fen ${game.fen()}`);
    engine.postMessage('go depth 15');
});

$('#resetBtn').on('click', () => {
    game.reset(); board.start(); $('#move-history').empty(); removeHighlights();
    engine.postMessage('ucinewgame');
});
