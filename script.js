var board = null;
var game = new Chess();
var engine;
var selectedSquare = null;
var currentHistoryIndex = -1; // Để điều hướng nước đi

// Khởi tạo Stockfish
const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
engine = new Worker(URL.createObjectURL(blob));

engine.onmessage = function(e) {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        // Nếu là máy đi (lượt đen)
        if (game.turn() === 'b') {
            makeMove(move);
        } else {
            // Nếu là gợi ý (hint)
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

function makeMove(move) {
    const result = game.move(move, { sloppy: true });
    if (result === null) return false;

    board.position(game.fen());
    updateHistoryUI();
    removeHighlights();
    
    if (game.turn() === 'b') {
        engine.postMessage('position fen ' + game.fen());
        engine.postMessage('go depth 12');
    }
    return true;
}

function updateHistoryUI() {
    const history = game.history();
    const list = $('#move-history');
    list.empty();
    for (let i = 0; i < history.length; i += 2) {
        list.append(`<div class="move-num">${Math.floor(i/2) + 1}.</div>`);
        list.append(`<div class="move-item ${i === history.length-1 || i === history.length-2 ? 'active' : ''}">${history[i]}</div>`);
        if (history[i+1]) list.append(`<div class="move-item ${i+1 === history.length-1 ? 'active' : ''}">${history[i+1]}</div>`);
    }
    list.scrollTop(list[0].scrollHeight);
    $('#nextBtn').prop('disabled', true); // Trong ván đấu thật, nút Next bị block
}

// Click to Move
function onSquareClick(square) {
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null;
            return;
        }
    }
    removeHighlights();
    const piece = game.get(square);
    if (piece && piece.color === 'w') {
        selectedSquare = square;
        $(`.square-${square}`).addClass('highlight-selected');
        const moves = game.moves({ square: square, verbose: true });
        moves.forEach(m => $(`.square-${m.to}`).append('<div class="suggest-dot"></div>'));
    }
}

board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: (s, t) => {
        const move = makeMove({ from: s, to: t, promotion: 'q' });
        if (move === null) return 'snapback';
    },
    onSnapEnd: () => board.position(game.fen())
});

$('#myBoard').on('click', '.square-55d63', function() {
    onSquareClick($(this).data('square'));
});

// Nút Gợi ý (Hint)
$('#hintBtn').on('click', () => {
    removeHighlights();
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 15');
});

// Nút Đăng nhập (Demo)
$('.login').on('click', () => alert('Chức năng đăng nhập đang được phát triển!'));

// Ván mới
$('#resetBtn').on('click', () => {
    game.reset();
    board.start();
    $('#move-history').empty();
    removeHighlights();
    engine.postMessage('ucinewgame');
});
