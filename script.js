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
            // Gợi ý
            removeHighlights();
            const from = move.substring(0, 2);
            const to = move.substring(2, 4);
            $(`.square-${from}`).addClass('highlight-hint');
            $(`.square-${to}`).append('<div class="suggest-dot"></div>');
        }
    }
};

function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight-selected highlight-hint');
    $('.suggest-dot').remove();
}

function updateHistoryUI() {
    const history = game.history();
    const list = $('#move-history');
    list.empty();
    for (let i = 0; i < history.length; i += 2) {
        list.append(`<div class="move-num">${Math.floor(i/2) + 1}</div>`);
        list.append(`<div class="move-item ${i === history.length-1 ? 'active' : ''}">${history[i]}</div>`);
        if (history[i+1]) {
            list.append(`<div class="move-item ${i+1 === history.length-1 ? 'active' : ''}">${history[i+1]}</div>`);
        }
    }
    list.scrollTop(list[0].scrollHeight);
}

function makeMove(moveStr) {
    const move = game.move(moveStr, { sloppy: true });
    if (!move) return false;

    board.position(game.fen());
    updateHistoryUI();
    removeHighlights();

    if (game.turn() === 'b') {
        $('#engine-status').text('Máy đang tính...');
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage('go depth 12');
    } else {
        $('#engine-status').text('Sẵn sàng');
    }
    return true;
}

// XỬ LÝ CLICK-TO-MOVE (KHÔNG CẦN KÉO)
function handleSquareClick(square) {
    // 1. Thử đi quân nếu đã chọn 1 quân trước đó
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null;
            return;
        }
    }

    // 2. Chọn quân mới (phải là quân Trắng)
    removeHighlights();
    const piece = game.get(square);
    if (piece && piece.color === 'w') {
        selectedSquare = square;
        $(`.square-${square}`).addClass('highlight-selected');
        
        // Hiện chấm tròn gợi ý các nước hợp lệ
        const moves = game.moves({ square: square, verbose: true });
        moves.forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot"></div>');
        });
    } else {
        selectedSquare = null;
    }
}

// KHỞI TẠO BOARD
board = Chessboard('myBoard', {
    draggable: true, // Vẫn cho kéo nếu muốn
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: (s, t) => {
        const move = makeMove({ from: s, to: t, promotion: 'q' });
        if (!move) return 'snapback';
    },
    onSnapEnd: () => board.position(game.fen())
});

// EVENT HIJACKING: Bắt sự kiện mousedown để xử lý CLICK trước KÉO
$('#myBoard').on('mousedown', '.square-55d63', function(e) {
    const square = $(this).attr('data-square');
    handleSquareClick(square);
});

$('#hintBtn').on('click', () => {
    engine.postMessage(`position fen ${game.fen()}`);
    engine.postMessage('go depth 15');
});

$('#resetBtn').on('click', () => {
    game.reset(); board.start(); $('#move-history').empty(); removeHighlights();
    engine.postMessage('ucinewgame');
});
