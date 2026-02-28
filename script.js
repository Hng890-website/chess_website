/**
 * GM CHESS OS - ENGINE: STOCKFISH 16.1 (WEB WORKER)
 * Hệ thống phát hiện lỗi CMOS & Điều hướng mượt
 */

let board = null;
let game = new Chess();
// Load Stockfish THẬT từ thư viện chuẩn trên GitHub
const stockfish = new Worker('https://nmrugg.github.io/stockfish.js/stockfish.js');

// --- 1. ENGINE LOGIC ---
stockfish.onmessage = (e) => {
    if (e.data.includes('bestmove')) {
        const moveStr = e.data.split(' ')[1];
        game.move({ from: moveStr.substring(0, 2), to: moveStr.substring(2, 4), promotion: 'q' });
        board.position(game.fen());
        updateMoveHistory();
    }
};

const askAI = () => {
    stockfish.postMessage(`position fen ${game.fen()}`);
    stockfish.postMessage('go movetime 1000'); // Suy nghĩ trong 1 giây
};

// --- 2. CMOS & CLOCK SYSTEM ---
function syncSystem() {
    const now = new Date();
    const lastTime = localStorage.getItem('os_v_time');
    let isDead = now.getFullYear() === 2000 || (lastTime && now.getTime() < parseInt(lastTime));

    if (isDead) localStorage.setItem('cmos_fault', 'true');
    const systemFault = localStorage.getItem('cmos_fault') === 'true';

    // Cập nhật UI
    document.getElementById('os-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    document.getElementById('os-date').textContent = now.toLocaleDateString('vi-VN').replace(/\//g, '.');

    const status = document.getElementById('cmos-status');
    if (systemFault) {
        status.textContent = "Dead";
        status.className = "status-tag dead";
        if (!sessionStorage.getItem('notified')) {
            $('#cmos-modal').fadeIn(400).css('display', 'flex');
            sessionStorage.setItem('notified', 'true');
        }
    } else {
        status.textContent = "Healthy";
        status.className = "status-tag fine";
    }
    localStorage.setItem('os_v_time', now.getTime());
}

// --- 3. NAVIGATION ---
window.enterGame = () => {
    $('.os-shell').addClass('scale-down');
    setTimeout(() => {
        $('.os-shell').hide();
        $('#game-screen').fadeIn(500, initBoard);
    }, 300);
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
                updateMoveHistory();
                setTimeout(askAI, 300);
            }
        });
    }
    board.resize();
}

function updateMoveHistory() {
    $('#history-box').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
}

$(document).ready(() => {
    setInterval(syncSystem, 1000);
    stockfish.postMessage('uci');
});
