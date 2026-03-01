let board = null;
let game = new Chess();
// Load Stockfish THẬT từ GitHub
const stockfish = new Worker('https://nmrugg.github.io/stockfish.js/stockfish.js');

// 1. CHẠY GIỜ VÀ CMOS
function initClock() {
    const update = () => {
        const now = new Date();
        document.getElementById('os-time').textContent = now.toLocaleTimeString('vi-VN');
        document.getElementById('os-date').textContent = now.toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
        
        const status = document.getElementById('cmos-status');
        const dot = document.getElementById('cmos-dot');
        // Giả lập lỗi CMOS nếu năm là 2000
        if (now.getFullYear() === 2000) {
            status.textContent = "Dead"; dot.style.background = "red";
        } else {
            status.textContent = "Healthy"; dot.style.background = "#c9ff85";
        }
    };
    update();
    setInterval(update, 1000);
}

// 2. DARK/LIGHT MODE
function toggleTheme() {
    const body = document.body;
    const text = document.getElementById('theme-text');
    body.classList.toggle('light-mode');
    text.textContent = body.classList.contains('light-mode') ? "Light Mode" : "Dark Mode";
}

// 3. XỬ LÝ GAME & BÀN CỜ
window.enterGame = function() {
    $('.os-container').fadeOut(300, () => {
        $('#game-screen').fadeIn(300, () => {
            if (!board) {
                board = Chessboard('myBoard', {
                    draggable: true,
                    position: 'start',
                    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
                    onDrop: (s, t) => {
                        let move = game.move({ from: s, to: t, promotion: 'q' });
                        if (!move) return 'snapback';
                        // Gọi AI suy nghĩ
                        stockfish.postMessage('position fen ' + game.fen());
                        stockfish.postMessage('go movetime 1000');
                    }
                });
            }
            // ÉP BÀN CỜ HIỆN HÌNH
            board.resize();
        });
    });
};

// Khởi chạy
$(document).ready(() => {
    initClock();
    stockfish.postMessage('uci');
});
