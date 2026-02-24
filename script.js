var board = null;
var game = new Chess();
var selectedSquare = null;

// Khởi tạo âm thanh từ DOM để tránh NotSupportedError
const sounds = {
    move: document.getElementById('snd-move'),
    capture: document.getElementById('snd-capture'),
    check: document.getElementById('snd-check'),
    start: document.getElementById('snd-start')
};

function playSound(name) {
    if (sounds[name]) {
        sounds[name].currentTime = 0;
        sounds[name].play().catch(() => {}); // Bỏ qua lỗi nếu trình duyệt chặn
    }
}

function startGame() {
    $('#home-screen').fadeOut();
    playSound('start');
}

function handleLogin() {
    let name = $('#username').val() || "Kỳ thủ";
    $('#display-name').text(name);
    $('#nav-auth-zone').html(`<span style="color:var(--green)">● ${name}</span>`);
    $('#loginModal').hide();
    startGame();
}

function openLogin() { $('#loginModal').show(); }

// Xử lý nước đi
function makeMove(moveStr) {
    let move = game.move(moveStr, { sloppy: true });
    if (!move) return false;

    // Phát âm thanh
    if (game.in_check()) playSound('check');
    else if (move.flags.includes('c')) playSound('capture');
    else playSound('move');

    board.position(game.fen());
    updateHistory();
    $('.square-55d63').removeClass('highlight-selected');
    $('.suggest-dot').remove();

    // Lượt máy (Đen)
    if (game.turn() === 'b' && !game.game_over()) {
        setTimeout(() => {
            let moves = game.moves();
            let randomMove = moves[Math.floor(Math.random() * moves.length)];
            makeMove(randomMove);
        }, 500);
    }
    return true;
}

function updateHistory() {
    let history = game.history();
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
        html += `<div class="move-num">${Math.floor(i/2)+1}.</div>`;
        html += `<div class="move-item">${history[i]}</div>`;
        html += `<div class="move-item">${history[i+1] || ''}</div>`;
    }
    $('#move-history').html(html).scrollTop(9999);
}

// FIX CLICK-TO-MOVE: Bắt mousedown để cướp quyền kéo của thư viện
$('#myBoard').on('mousedown', '.square-55d63', function() {
    let square = $(this).data('square');
    
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null;
            return;
        }
    }

    $('.square-55d63').removeClass('highlight-selected');
    $('.suggest-dot').remove();
    
    let piece = game.get(square);
    if (piece && piece.color === 'w') {
        selectedSquare = square;
        $(this).addClass('highlight-selected');
        game.moves({ square: square, verbose: true }).forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot"></div>');
        });
    } else {
        selectedSquare = null;
    }
});

board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png'
});
