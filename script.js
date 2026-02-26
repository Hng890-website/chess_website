// GM CHESS - SCRIPT PHIÊN BẢN CHỐNG LIỆT
var board = null;
var game = new Chess();

// 1. CHUYỂN CẢNH
window.showMenu = function() {
    $('#home-screen').fadeOut(300, function() {
        $('#main-menu').fadeIn(300);
    });
};

window.backToHome = function() {
    $('#main-menu').fadeOut(300, function() {
        $('#home-screen').fadeIn(300);
    });
};

window.enterGame = function(mode) {
    if (mode === 'online') {
        alert("Chế độ Online đang phát triển!");
        return;
    }
    $('#main-menu').fadeOut(300, function() {
        $('#game-area').show();
        if (!board) {
            initChess();
        } else {
            game.reset();
            board.start();
        }
        board.resize(); // Cực kỳ quan trọng để bàn cờ to ra
    });
};

window.backToMenu = function() {
    $('#game-area').hide();
    $('#main-menu').fadeIn(300);
};

// 2. KHỞI TẠO BÀN CỜ
function initChess() {
    var config = {
        draggable: true,
        position: 'start',
        // Fix lỗi ảnh 404 bằng link Wikipedia trực tiếp
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDrop: function(source, target) {
            var move = game.move({
                from: source,
                to: target,
                promotion: 'q'
            });

            if (move === null) return 'snapback';

            updateHistory();
            window.setTimeout(makeMachineMove, 500);
        }
    };
    board = Chessboard('myBoard', config);
}

// 3. LOGIC MÁY
function makeMachineMove() {
    var moves = game.moves();
    if (moves.length === 0) return;

    var randomMove = moves[Math.floor(Math.random() * moves.length)];
    game.move(randomMove);
    board.position(game.fen());
    updateHistory();
}

function updateHistory() {
    $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
    var d = $('#move-history');
    d.scrollTop(d.prop("scrollHeight"));
}

// Tự động resize khi co giãn màn hình
$(window).resize(function() {
    if (board) board.resize();
});
