var board = null;
var game = new Chess();
var engine;
var selectedSquare = null;

// HỆ THỐNG ÂM THANH - Dùng link cực kỳ phổ biến và thêm xử lý lỗi
const soundSources = {
    move: 'https://actions.google.com/sounds/v1/cartoon/clink_clank.ogg', // Tiếng cộp
    capture: 'https://actions.google.com/sounds/v1/foley/wood_plank_flick.ogg', // Tiếng ăn quân
    check: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg', // Tiếng chiếu
    gameStart: 'https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg', // Khởi đầu
    gameEnd: 'https://actions.google.com/sounds/v1/human/applause.ogg' // Kết thúc
};

const sounds = {};

// Khởi tạo âm thanh an toàn
Object.keys(soundSources).forEach(key => {
    sounds[key] = new Audio(soundSources[key]);
    // Fix lỗi "No supported sources" bằng cách bắt lỗi load
    sounds[key].addEventListener('error', function(e) {
        console.warn(`Không tải được âm thanh ${key}, kiểm tra kết nối mạng hoặc link.`);
    });
});

// Hàm mồi âm thanh (BẮT BUỘC)
function unlockAudio() {
    console.log("Đang mở khóa âm thanh...");
    Object.values(sounds).forEach(sound => {
        const playPromise = sound.play();
        if (playPromise !== undefined) {
            playPromise.then(() => {
                sound.pause();
                sound.currentTime = 0;
            }).catch(error => {
                // Trình duyệt chặn là bình thường, sẽ hết sau click đầu tiên
            });
        }
    });
}

// Hàm phát âm thanh (Đã bọc trong Try-Catch)
function playSound(type) {
    try {
        const s = sounds[type];
        if (s && s.readyState >= 2) { // Chỉ phát nếu đã load xong dữ liệu tối thiểu
            s.currentTime = 0;
            s.play().catch(e => console.error("Trình duyệt chặn phát:", e));
        }
    } catch (e) {
        console.error("Lỗi phát âm thanh:", e);
    }
}

// Cập nhật hàm makeMove
function makeMove(moveStr) {
    const move = game.move(moveStr, { sloppy: true });
    if (!move) return false;

    // Logic chọn loại âm thanh
    if (game.in_checkmate()) playSound('gameEnd');
    else if (game.in_check()) playSound('check');
    else if (move.flags.includes('c')) playSound('capture');
    else playSound('move');

    board.position(game.fen());
    updateHistoryUI();
    removeHighlights();

    if (game.turn() === 'b' && !game.game_over()) {
        engine.postMessage(`position fen ${game.fen()}`);
        engine.postMessage('go depth 12');
    }
    return true;
}

// Gắn unlockAudio vào các nút tương tác
function startGame() {
    unlockAudio();
    $('#home-screen').fadeOut(500);
    setTimeout(() => playSound('gameStart'), 300);
}

function handleLogin() {
    const user = $('#username').val();
    if (user) {
        unlockAudio();
        $('#nav-auth-zone').html(`<span class="user-logged-in">♟ ${user}</span>`);
        closeLogin();
        if($('#home-screen').is(':visible')) startGame();
    }
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
