/**
 * GM CHESS OS - CORE SYSTEM (STOCKFISH 18 EDITION)
 * Tính năng: Kiểm tra CMOS thông minh + Điều hướng giao diện mượt
 */

// --- 1. BIẾN TOÀN CỤC ---
let board = null;
const game = new Chess();

// --- 2. HỆ THỐNG KIỂM TRA CMOS "THÁM TỬ" ---
function checkCmosIntegrity() {
    const now = new Date();
    const currentTime = now.getTime();
    
    // Lấy "dấu vết" thời gian cuối cùng máy còn sống từ bộ nhớ trình duyệt
    const lastSeen = localStorage.getItem('os_last_shutdown');
    let isCmosDead = false;

    // A. Kiểm tra năm reset mặc định (Y2K/BIOS Default)
    if (now.getFullYear() === 2000) {
        isCmosDead = true;
    }

    // B. Kiểm tra "Nghịch lý thời gian": 
    // Nếu giờ hiện tại lại CŨ hơn giờ đã lưu trước đó -> Chắc chắn CMOS bị reset
    if (lastSeen && currentTime < parseInt(lastSeen)) {
        isCmosDead = true;
        // Ghi nhớ vĩnh viễn trạng thái lỗi này
        localStorage.setItem('cmos_permanent_error', 'true');
    }

    // C. Kiểm tra trạng thái lỗi đã lưu
    if (localStorage.getItem('cmos_permanent_error') === 'true') {
        isCmosDead = true;
    }

    // Cập nhật giao diện
    renderSystemStatus(now, isCmosDead);

    // Luôn lưu lại thời gian hiện tại làm mốc so sánh cho lần sau
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
        if (dot) dot.style.background = "#ff4d4f"; // Màu đỏ cảnh báo
        
        // Hiện thông báo Modal (chỉ hiện 1 lần mỗi phiên làm việc)
        if (modal && !sessionStorage.getItem('modal_shown')) {
            $(modal).fadeIn(500).css('display', 'flex');
            sessionStorage.setItem('modal_shown', 'true');
        }
    } else {
        if (statusText) statusText.textContent = "Working";
        if (dot) dot.style.background = "#81b64c"; // Màu xanh hoạt động
    }
}

// --- 3. ĐIỀU HƯỚNG GIAO DIỆN (UI NAVIGATION) ---
window.closeCmosModal = function() {
    $('#cmos-modal').fadeOut(300);
};

window.enterGame = function(mode) {
    // Hiệu ứng Fade out màn hình chính và Fade in bàn cờ
    $('.os-wrapper').addClass('fade-out');
    setTimeout(() => {
        $('.os-wrapper').hide();
        $('#game-area').fadeIn(600).css('display', 'flex');
        initChessBoard();
    }, 400);
};

window.backToMenu = function() {
    $('#game-area').fadeOut(400, () => {
        $('.os-wrapper').show().removeClass('fade-out');
        if (board) board.destroy();
        board = null;
    });
};

// --- 4. LOGIC CỜ VUA (CHESS ENGINE SIMULATION) ---
function initChessBoard() {
    if (board) return;
    
    const config = {
        draggable: true,
        position: 'start',
        pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
        onDrop: (source, target) => {
            const move = game.move({ from: source, to: target, promotion: 'q' });
            if (move === null) return 'snapback';
            
            // Giả lập Stockfish 18 phản hồi sau 600ms
            window.setTimeout(makeAIMove, 600);
        }
    };
    board = Chessboard('myBoard', config);
    $(window).resize(board.resize);
}

function makeAIMove() {
    const moves = game.moves();
    if (moves.length === 0) return;
    
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    game.move(randomMove);
    board.position(game.fen());
}

// --- 5. KHỞI CHẠY HỆ THỐNG ---
$(document).ready(() => {
    // Chạy kiểm tra CMOS ngay lập tức và lặp lại mỗi giây
    checkCmosIntegrity();
    setInterval(checkCmosIntegrity, 1000);

    // Thêm hiệu ứng âm thanh nhẹ khi click vào các Tile (tùy chọn)
    $('.interact').on('click', function() {
        console.log("System: Navigating to " + $(this).find('h3').text());
    });
});
