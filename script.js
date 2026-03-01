let board = null;
let game = new Chess();
// Load Stockfish 16.1 THẬT qua Web Worker
const stockfish = new Worker('https://nmrugg.github.io/stockfish.js/stockfish.js');

// 1. ENGINE AI
stockfish.onmessage = (e) => {
    if (e.data.includes('bestmove')) {
        const moveStr = e.data.split(' ')[1];
        game.move({ from: moveStr.substring(0, 2), to: moveStr.substring(2, 4), promotion: 'q' });
        board.position(game.fen());
        renderHistory();
    }
};

function askAI() {
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go movetime 1000');
}

// 2. CMOS & TIME
function updateClock() {
    const now = new Date();
    // Bắt lỗi pin chết (Năm 2000 hoặc thời gian lùi ngược)
    const last = localStorage.getItem('v_time');
    const isDead = now.getFullYear() === 2000 || (last && now.getTime() < parseInt(last));
    
    document.getElementById('os-time').textContent = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit' });
    document.getElementById('os-date').textContent = now.toLocaleDateString('vi-VN').replace(/\//g, '.');

    const status = document.getElementById('cmos-status');
    const dot = document.getElementById('cmos-dot');
    
    if (isDead) {
        status.textContent = "Dead"; status.style.color = "#ff4d4f"; dot.style.background = "#ff4d4f";
    } else {
        status.textContent = "Working"; status.style.color = "#81b64c"; dot.style.background = "#81b64c";
    }
    localStorage.setItem('v_time', now.getTime());
}

// 3. UI
window.enterGame = () => {
    $('.os-shell').fadeOut(300, () => {
        $('#game-screen').fadeIn(300, initBoard);
    });
};

function initBoard() {
    if (!board) {
        board = Chessboard('myBoard', {
            draggable: true, position: 'start',
            pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
            onDrop: (s, t) => {
                let m = game.move({ from: s, to: t, promotion: 'q' });
                if (!m) return 'snapback';
                setTimeout(askAI, 300);
            }
        });
    }
    board.resize();
}

function renderHistory() {
    $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
}

setInterval(updateClock, 1000);
stockfish.postMessage('uci');
