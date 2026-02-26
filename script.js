/**
 * GM CHESS OS - SCRIPT HỆ THỐNG
 * Đã khử lỗi jQuery $ undefined
 */

// Biến toàn cục
var board = null;
var game = new Chess();
var currentLang = 'en';

// --- 1. XỬ LÝ HỘP THOẠI (MODAL) ---
window.closeCmosModal = function() {
    const modal = document.getElementById('cmos-modal');
    if (modal) {
        modal.style.opacity = '0';
        setTimeout(() => { modal.style.display = 'none'; }, 300);
    }
};

// --- 2. HỆ THỐNG THỜI GIAN & CMOS ---
function updateSystem() {
    const now = new Date();
    
    /** * MẸO TEST: Để xem thông báo CMOS Dead, hãy bỏ dấu gạch chéo ở 3 dòng dưới:
     */
    // now.setFullYear(2000); 
    // now.setMonth(0); 
    // now.setDate(1);

    const d = now.getDate();
    const m = now.getMonth() + 1;
    const y = now.getFullYear();

    // Cập nhật văn bản thời gian
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = (d < 10 ? '0' + d : d) + '.' + (m < 10 ? '0' + m : m) + '.' + y;

    if (document.getElementById('os-time')) document.getElementById('os-time').textContent = timeStr;
    if (document.getElementById('os-date')) document.getElementById('os-date').textContent = dateStr;

    // Kiểm tra tình trạng pin CMOS
    const statusText = document.getElementById('cmos-status');
    const statusDot = document.getElementById('cmos-dot');
    const modal = document.getElementById('cmos-modal');

    if (d === 1 && m === 1 && y === 2000) {
        if (statusText) {
            statusText.textContent = "Dead";
            statusText.className = "status-dead";
        }
        if (statusDot) statusDot.style.background = "#ff4d4f";
        
        // Hiện thông báo ẩn nếu chưa hiện lần nào
        if (modal && modal.getAttribute('data-shown') !== 'true') {
            modal.style.display = 'flex';
            setTimeout(() => { modal.style.opacity = '1'; }, 10);
            modal.setAttribute('data-shown', 'true');
        }
    } else {
        if (statusText) {
            statusText.textContent = "Working";
            statusText.className = "status-working";
        }
        if (statusDot) statusDot.style.background = "#52c41a";
    }
}

// --- 3. ĐIỀU HƯỚNG MÀN HÌNH ---
window.enterGame = function(mode) {
    // Ẩn Menu, hiện vùng Game
    document.getElementById('main-menu').style.display = 'none';
    const gameArea = document.getElementById('game-area');
    gameArea.style.display = 'block';

    // Khởi tạo bàn cờ nếu chưa có
    if (!board) {
        board = Chessboard('myBoard', {
            draggable: true,
            position: 'start',
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            onDrop: handleMove
        });
    }
    setTimeout(() => { board.resize(); }, 100);
};

window.backToMenu = function() {
    // Reload là cách nhanh nhất để reset trạng thái sạch sẽ
    window.location.reload();
};

// --- 4. LOGIC CỜ VUA ---
function handleMove(source, target) {
    let move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    updateHistory();
    window.setTimeout(makeRandomMove, 250);
}

function makeRandomMove() {
    let possibleMoves = game.moves();
    if (possibleMoves.length === 0) return;

    let randomIdx = Math.floor(Math.random() * possibleMoves.length);
    game.move(possibleMoves[randomIdx]);
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

// Khởi chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
    setInterval(updateSystem, 1000);
    updateSystem();
});

// Resize bàn cờ khi co dãn cửa sổ
window.onresize = function() {
    if (board) board.resize();
};
