var board = null;
var game = new Chess();
var engine;
var selectedSquare = null;

// HỆ THỐNG ÂM THANH - Sử dụng link trực tiếp ổn định hơn
const sounds = {
    move: new Audio('https://www.chess.com/chess-themes/sounds/_standard/default/move-self.mp3'),
    capture: new Audio('https://www.chess.com/chess-themes/sounds/_standard/default/capture.mp3'),
    check: new Audio('https://www.chess.com/chess-themes/sounds/_standard/default/move-check.mp3'),
    gameStart: new Audio('https://www.chess.com/chess-themes/sounds/_standard/default/game-start.mp3'),
    gameEnd: new Audio('https://www.chess.com/chess-themes/sounds/_standard/default/game-end.mp3')
};

// HÀM QUAN TRỌNG: Mồi âm thanh để trình duyệt cho phép phát
function unlockAudio() {
    Object.values(sounds).forEach(sound => {
        sound.play().then(() => {
            sound.pause();
            sound.currentTime = 0;
        }).catch(e => console.log("Chờ tương tác để mở âm thanh..."));
    });
}

// Cập nhật hàm xử lý đăng nhập và bắt đầu để kích hoạt âm thanh
function handleLogin() {
    const user = $('#username').val();
    if (user) {
        unlockAudio(); // Mở khóa âm thanh khi user click
        $('#nav-auth-zone').html(`<span class="user-logged-in">♟ ${user}</span>`);
        closeLogin();
        if($('#home-screen').is(':visible')) startGame();
    }
}

function startGame() {
    unlockAudio(); // Mở khóa âm thanh ngay khi nhấn nút Chơi
    $('#home-screen').fadeOut(500);
    setTimeout(() => sounds.gameStart.play(), 300);
}

// Hàm phát âm thanh thông minh dựa trên nước đi
function playMoveSound(moveResult) {
    try {
        if (game.in_checkmate() || game.in_draw()) {
            sounds.gameEnd.play();
        } else if (game.in_check()) {
            sounds.check.play();
        } else if (moveResult.flags.includes('c') || moveResult.flags.includes('e')) {
            sounds.capture.play();
        } else {
            // Đặt lại thời gian về 0 để có thể phát liên tục khi đi nhanh
            sounds.move.currentTime = 0;
            sounds.move.play();
        }
    } catch (e) {
        console.warn("Không thể phát âm thanh:", e);
    }
}

// Cập nhật hàm makeMove để gọi playMoveSound
function makeMove(moveStr) {
    const move = game.move(moveStr, { sloppy: true });
    if (!move) return false;

    playMoveSound(move); // Gọi hàm phát âm thanh ở đây
    board.position(game.fen());
    updateHistoryUI();
    removeHighlights();

    if (game.turn() === 'b' && !game.game_over()) {
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage('go depth 12');
    }
    return true;
}

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
            removeHighlights();
            const from = move.substring(0, 2);
            const to = move.substring(2, 4);
            $(`.square-${from}`).addClass('highlight-hint');
            $(`.square-${to}`).append('<div class="suggest-dot"></div>');
        }
    }
};

function playMoveSound(moveResult) {
    if (game.in_checkmate() || game.in_draw()) {
        sounds.gameEnd.play();
    } else if (game.in_check()) {
        sounds.check.play();
    } else if (moveResult.flags.includes('c') || moveResult.flags.includes('e')) {
        sounds.capture.play();
    } else {
        sounds.move.play();
    }
}

function makeMove(moveStr) {
    const move = game.move(moveStr, { sloppy: true });
    if (!move) return false;

    playMoveSound(move);
    board.position(game.fen());
    updateHistoryUI();
    removeHighlights();

    if (game.turn() === 'b' && !game.game_over()) {
        $('#engine-status').text('Máy đang tính...');
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage('go depth 12');
    } else {
        $('#engine-status').text('Sẵn sàng');
    }
    return true;
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

function handleSquareClick(square) {
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
        game.moves({ square: square, verbose: true }).forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot"></div>');
        });
    } else {
        selectedSquare = null;
    }
}

function removeHighlights() {
    $('#myBoard .square-55d63').removeClass('highlight-selected highlight-hint');
    $('.suggest-dot').remove();
}

board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: (s, t) => {
        const move = makeMove({ from: s, to: t, promotion: 'q' });
        if (!move) return 'snapback';
    },
    onSnapEnd: () => board.position(game.fen())
});

// CLICK-TO-MOVE HIJACKING
$('#myBoard').on('mousedown', '.square-55d63', function() {
    handleSquareClick($(this).attr('data-square'));
});

$('#hintBtn').on('click', () => {
    engine.postMessage(`position fen ${game.fen()}`);
    engine.postMessage('go depth 15');
});

$('#resetBtn').on('click', () => {
    game.reset(); 
    board.start(); 
    $('#move-history').empty(); 
    removeHighlights();
    sounds.gameStart.play();
    engine.postMessage('ucinewgame');
});

// Phát âm thanh bắt đầu khi load trang
window.addEventListener('click', () => {
    // Trình duyệt chặn tự động phát, cần 1 click đầu tiên của user
    if(game.history().length === 0) sounds.gameStart.play();
}, { once: true });
