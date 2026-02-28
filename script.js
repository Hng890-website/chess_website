/**
 * GM CHESS OS - ENGINE STOCKFISH 16.1
 */

let board = null;
let game = new Chess();
// Tải Stockfish từ GitHub (nmrugg là bản phân phối web chuẩn nhất)
const stockfish = new Worker('https://nmrugg.github.io/stockfish.js/stockfish.js');

// --- 1. ENGINE STOCKFISH ---
stockfish.onmessage = function(event) {
    if (event.data.includes('bestmove')) {
        const moveStr = event.data.split(' ')[1];
        game.move({
            from: moveStr.substring(0, 2),
            to: moveStr.substring(2, 4),
            promotion: 'q'
        });
        board.position(game.fen());
        renderUI();
    }
};

function askAI() {
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go movetime 1000'); // AI suy nghĩ 1 giây
}

// --- 2. HỆ THỐNG CMOS & ĐỒNG HỒ ---
function updateSystem() {
    const now = new Date();
    const lastTime = localStorage.getItem('os_time_stamp');
    
    // Phát hiện pin CMOS chết (Năm 2000 hoặc thời gian nhảy lùi)
    let isDead = now.getFullYear() === 2000 || (lastTime && now.getTime() < parseInt(lastTime));
    if (isDead) localStorage.setItem('cmos_faulty', 'true');
    
    const hasFault = localStorage.getItem('cmos_faulty') === 'true';

    // Hiển thị thời gian
    document.getElementById('os-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    document.getElementById('os-date').textContent = now.toLocaleDateString('vi-VN').replace(/\//g, '.');

    const statusText = document.getElementById('cmos-status');
    const dot = document.getElementById('cmos-dot');
    
    if (hasFault) {
        statusText.textContent = "Dead";
        statusText.className = "status-tag dead";
        dot.style.background = "#ff4d4f";
        if (!sessionStorage.getItem('notified')) {
            document.getElementById('cmos-modal').style.display = 'flex';
            sessionStorage.setItem('notified', 'true');
        }
    } else {
        statusText.textContent = "Working";
        statusText.className = "status-tag healthy";
        dot.style.background = "#81b64c";
    }
    localStorage.setItem('os_time_stamp', now.getTime());
}

// --- 3. ĐIỀU HƯỚNG VÀ BÀN CỜ ---
window.enterGame = function() {
    document.querySelector('.os-container').style.opacity = '0';
    setTimeout(() => {
        document.querySelector('.os-container').style.display = 'none';
        document.getElementById('game-screen').style.display = 'flex';
        initBoard();
    }, 400);
};

function initBoard() {
    if (!board) {
        board = Chessboard('myBoard', {
            draggable: true,
            position: 'start',
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            onDrop: (s, t) => {
                let m = game.move({ from: s, to: t, promotion: 'q' });
                if (!m) return 'snapback';
                renderUI();
                setTimeout(askAI, 400);
            }
        });
    }
    board.resize();
}

function renderUI() {
    const history = document.getElementById('history-log');
    history.innerHTML = game.pgn({ max_width: 5, newline_char: '<br>' });
    history.scrollTop = history.scrollHeight;
}

window.backToMenu = () => location.reload();
window.closeModal = () => document.getElementById('cmos-modal').style.display = 'none';

// Khởi động
setInterval(updateSystem, 1000);
stockfish.postMessage('uci');
