/**
 * GM CHESS OS - CORE SYSTEM (STOCKFISH 18)
 * Đã sửa lỗi không hiển thị bàn cờ và tích hợp cảm biến CMOS
 */

let board = null;
const game = new Chess();

// --- 1. HỆ THỐNG CMOS (THÁM TỬ THỜI GIAN) ---
function checkCmosIntegrity() {
    const now = new Date();
    const currentTime = now.getTime();
    const lastSeen = localStorage.getItem('os_last_shutdown');
    let isCmosDead = false;

    // Kiểm tra nếu năm bị reset về 2000 hoặc thời gian chạy ngược
    if (now.getFullYear() === 2000 || (lastSeen && currentTime < parseInt(lastSeen))) {
        isCmosDead = true;
        localStorage.setItem('cmos_permanent_error', 'true');
    }

    if (localStorage.getItem('cmos_permanent_error') === 'true') isCmosDead = true;

    renderSystemStatus(now, isCmosDead);
    localStorage.setItem('os_last_shutdown', currentTime);
}

function renderSystemStatus(now, isDead) {
    const timeElem = document.getElementById('os-time');
    const dateElem = document.getElementById('os-date');
    const statusText = document.getElementById('cmos-status');
    const dot = document.getElementById('cmos-dot');
    const modal = document.getElementById('cmos-modal');

    if (timeElem) timeElem.textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    if (dateElem) dateElem.textContent = `${now.getDate()}.${now.getMonth() + 1}.${now.getFullYear()}`;

    if (isDead) {
        if (statusText) statusText.textContent = "Dead";
        if (dot) dot.style.background = "#ff4d4f";
        if (modal && !sessionStorage.getItem('modal_shown')) {
            $(modal).fadeIn(500).css('display', 'flex');
            sessionStorage.setItem('modal_shown', 'true');
        }
    } else {
        if (statusText) statusText.textContent = "Working";
        if (dot) dot.style.background = "#81b64c";
    }
}

// --- 2. ĐIỀU HƯỚNG & KHỞI TẠO BÀN CỜ ---
window.closeCmosModal = function() {
    $('#cmos-modal').fadeOut(300);
};

window.enterGame = function(mode) {
    // 1. Hiệu ứng chuyển cảnh
    $('.os-wrapper').fadeOut(400, function() {
        $('#game-area').fadeIn(400, function() {
            // 2. CHỈ KHỞI TẠO SAU KHI VÙNG GAME ĐÃ HIỆN (Để tránh lỗi width = 0)
            initChessBoard();
        });
    });
};

function initChessBoard() {
    // Nếu bàn cờ đã tồn tại thì chỉ reset vị trí
    if (board) {
        board.start();
        game.reset();
        return;
    }

    const config = {
        draggable: true,
        position: 'start',
        // Đảm bảo đường dẫn ảnh quân cờ chính xác
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDrop: handleMove
    };

    // Khởi tạo vào thẻ <div id="myBoard">
    board = Chessboard('myBoard', config);
    
    // Ép bàn cờ tính toán lại kích thước khung hình
    setTimeout(() => { board.resize(); }, 100);
}

// --- 3. LOGIC TRẬN ĐẤU ---
function handleMove(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    
    if (move === null) return 'snapback';

    updateHistory();
    // Giả lập Stockfish 18 phản hồi
    window.setTimeout(makeAIMove, 500);
}

function makeAIMove() {
    const moves = game.moves();
    if (moves.length === 0) return;
    
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    game.move(randomMove);
    board.position(game.fen());
    updateHistory();
}

function updateHistory() {
    const historyElem = document.getElementById('move-history');
    if (historyElem) {
        historyElem.innerHTML = game.pgn({ max_width: 5, newline_char: '<br>' });
        historyElem.scrollTop = historyElem.scrollHeight;
    }
}

window.backToMenu = function() {
    $('#game-area').fadeOut(400, () => {
        $('.os-wrapper').fadeIn(400);
    });
};

// --- 4. KHỞI CHẠY ---
$(document).ready(() => {
    checkCmosIntegrity();
    setInterval(checkCmosIntegrity, 1000);
});

// Sửa lỗi bàn cờ bị lệch khi co giãn trình duyệt
$(window).resize(() => {
    if (board) board.resize();
});
