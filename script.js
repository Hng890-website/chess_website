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
    const year = now.getFullYear();

    // Read last saved timestamp from localStorage (if any)
    const lastRaw = localStorage.getItem('v_time');
    const last = lastRaw ? Number(lastRaw) : null;

    // Heuristics for detecting a reseted/invalid system clock (common CMOS reset values)
    // - Year far in the past (e.g. <= 2005) is treated as a possible reset
    // - A large backward jump (now < last by > 5 seconds) indicates the clock went backwards
    // - A huge forward jump (more than 1 year) is also suspicious
    const invalidYear = year <= 2005;
    const backwardJump = last && (now.getTime() + 5000 < last); // more than ~5s backwards
    const hugeForwardJump = last && (now.getTime() - last > 365 * 24 * 60 * 60 * 1000); // >1 year forward

    const isDead = invalidYear || backwardJump || hugeForwardJump;

    // Update DOM elements safely (check existence)
    const timeEl = document.getElementById('os-time');
    const dateEl = document.getElementById('os-date');
    const status = document.getElementById('cmos-status');
    const dot = document.getElementById('cmos-dot');

    // Show hours, minutes, and seconds for a proper clock display
    if (timeEl) timeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    if (dateEl) dateEl.textContent = now.toLocaleDateString('vi-VN').replace(//g, '.');

    if (status && dot) {
        if (isDead) {
            status.textContent = 'Dead'; status.style.color = '#ff4d4f'; dot.style.background = '#ff4d4f';
        } else {
            status.textContent = 'Working'; status.style.color = '#81b64c'; dot.style.background = '#81b64c';
        }
    }

    // Persist the current timestamp for future checks
    try {
        localStorage.setItem('v_time', String(now.getTime()));
    } catch (e) {
        // If storage is unavailable (e.g. private mode), fail silently
        console.warn('Unable to persist v_time to localStorage', e);
    }
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
// Run immediately once to avoid 1s delay on load
updateClock();
stockfish.postMessage('uci');