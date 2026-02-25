// GM CHESS - CHỐNG LIỆT TUYỆT ĐỐI
var board = null;
var game = new Chess();

// Đăng ký hàm vào window ngay lập tức để HTML luôn tìm thấy
window.enterGame = function() {
    console.log("Đang mở bàn cờ...");
    var home = document.getElementById('home-screen');
    var gameArea = document.querySelector('.app-wrapper');
    
    if (home) home.style.display = 'none';
    if (gameArea) {
        gameArea.style.display = 'block';
        // Khởi tạo bàn cờ nếu chưa có
        if (!board) {
            initBoard();
        }
        board.resize();
    }
};

window.exitGame = function() {
    location.reload(); // Cách nhanh nhất để reset và quay về màn hình chính
};

function initBoard() {
    var config = {
        draggable: true,
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDrop: handleMove
    };
    board = Chessboard('myBoard', config);
}

function handleMove(source, target) {
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q'
    });

    if (move === null) return 'snapback';

    // Máy tự động đi sau 500ms
    window.setTimeout(makeMachineMove, 500);
}

function makeMachineMove() {
    var moves = game.moves();
    if (moves.length === 0) return;

    var randomMove = moves[Math.floor(Math.random() * moves.length)];
    game.move(randomMove);
    board.position(game.fen());
}

// Khi trang load xong chỉ resize nếu bàn cờ đã tồn tại
window.onload = function() {
    console.log("Hệ thống GM Chess đã sẵn sàng.");
};
