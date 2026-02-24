var board = null;
var game = new Chess();
var selectedSquare = null; // Biến theo dõi ô được chọn

// Khởi tạo âm thanh từ DOM để tránh NotSupportedError
const sounds = {
    move: document.getElementById('snd-move'),
    capture: document.getElementById('snd-capture'),
    check: document.getElementById('snd-check'),
    start: document.getElementById('snd-start')
};

// Hàm phát âm thanh an toàn
function playSnd(id) {
    if (sounds[id]) {
        sounds[id].currentTime = 0;
        sounds[id].play().catch(() => {});
    }
}

// Logic cho màn hình Home
function startGame() {
    $('#home-screen').fadeOut(600); // Ẩn màn hình home
    playSnd('start'); // Phát âm thanh khởi động
    // Sau khi game bắt đầu, kích hoạt board.resize()
    setTimeout(() => {
        if (board) board.resize();
    }, 700);
}

function handleLogin() {
    let name = $('#username').val().trim();
    if (!name) name = "Kỳ thủ Elite"; // Tên mặc định nếu không nhập
    
    $('#display-name').text(name); // Cập nhật tên người chơi
    $('#nav-auth-zone').html(`<div class="logged-user"><i class="fas fa-user-circle"></i> ${name}</div>`);
    $('#loginModal').fadeOut(300); // Ẩn modal đăng nhập
    startGame(); // Bắt đầu game
}

function openLogin() { $('#loginModal').fadeIn(300); }
function closeLogin() { $('#loginModal').fadeOut(300); }

// Hàm chính xử lý nước đi
function makeMove(moveObj) {
    let result = game.move(moveObj);
    if (result === null) return false; // Nước đi không hợp lệ

    // Phát âm thanh tương ứng
    if (game.in_check()) playSnd('check');
    else if (result.flags.includes('c') || result.flags.includes('e')) playSnd('capture');
    else playSnd('move');

    board.position(game.fen()); // Cập nhật trạng thái bàn cờ
    updateHistory(); // Cập nhật lịch sử nước đi
    removeHighlights(); // Xóa các highlight và chấm tròn

    // Lượt máy (Đen) - Random Move đơn giản
    if (game.turn() === 'b' && !game.game_over()) {
        setTimeout(() => {
            let moves = game.moves();
            if (moves.length > 0) {
                let randomMove = moves[Math.floor(Math.random() * moves.length)];
                makeMove({ from: randomMove.substring(0, 2), to: randomMove.substring(2, 4), promotion: 'q' });
            }
        }, 800); // Thời gian máy "suy nghĩ"
    }
    return true;
}

// Cập nhật lịch sử nước đi
function updateHistory() {
    let h = game.history({ verbose: true });
    let html = '';
    for (let i = 0; i < h.length; i += 2) {
        html += `<div>${Math.floor(i/2)+1}.</div>`;
        html += `<div class="m-item">${h[i].san}</div>`;
        html += `<div class="m-item">${h[i+1] ? h[i+1].san : ''}</div>`;
    }
    $('#move-history').html(html).scrollTop($('#move-history')[0].scrollHeight);
}

// Xóa highlight và chấm tròn
function removeHighlights() {
    $('.square-55d63').removeClass('highlight-selected');
    $('.suggest-dot').remove();
}

// KHỞI TẠO BÀN CỜ
var config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    // onDrop: makeMove, // Bật lại nếu muốn kéo
    onSnapEnd: function() { board.position(game.fen()); } // Đảm bảo quân cờ nhảy đúng ô
};
board = Chessboard('myBoard', config);

// CLICK-TO-MOVE HIJACKING: Xử lý click để đi quân (FIX LỖI "KHÔNG ĐI ĐƯỢC")
$('#myBoard').on('mousedown', '.square-55d63', function(e) {
    // Ngăn chặn hành vi mặc định của trình duyệt để tránh xung đột kéo
    e.preventDefault(); 
    e.stopPropagation();

    let square = $(this).data('square');
    
    // Nếu đã có ô được chọn trước đó
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null; // Reset ô đã chọn sau khi đi thành công
            return;
        }
    }

    // Nếu chưa có ô nào được chọn hoặc nước đi trước đó không hợp lệ
    removeHighlights(); // Xóa hết highlight cũ
    let piece = game.get(square);
    if (piece && piece.color === 'w') { // Chỉ cho phép chọn quân Trắng
        selectedSquare = square; // Gán ô hiện tại là ô được chọn
        $(this).addClass('highlight-selected'); // Highlight ô này
        
        // Hiển thị các chấm tròn gợi ý nước đi
        game.moves({ square: square, verbose: true }).forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot"></div>');
        });
    } else {
        selectedSquare = null; // Không phải quân của mình hoặc không có quân
    }
});

// Nút reset ván đấu
$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    $('#move-history').empty();
    removeHighlights();
    selectedSquare = null; // Reset ô chọn khi bắt đầu ván mới
    playSnd('start'); // Phát âm thanh khởi động
});

// Nút gợi ý (Chưa có logic Stockfish, chỉ là placeholder)
$('#hintBtn').on('click', function() {
    // Logic gợi ý từ Stockfish sẽ được thêm ở đây
    alert('Tính năng gợi ý đang phát triển!');
});

// Khi trang load xong, đảm bảo bàn cờ được vẽ đúng kích thước
$(window).on('load', function() {
    if (board) board.resize();
    // Vô hiệu hóa kéo thả nếu bạn muốn chỉ dùng click-to-move
    // board.destroy(); board = Chessboard('myBoard', { /* config không draggable */ });
});

// Khi cửa sổ thay đổi kích thước, điều chỉnh bàn cờ
$(window).resize(function() {
    if (board) board.resize();
});
