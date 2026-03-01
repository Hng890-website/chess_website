let board = null;
let game = new Chess();
// Load Stockfish THẬT từ GitHub
const stockfish = new Worker('https://nmrugg.github.io/stockfish.js/stockfish.js');

// 1. CHẠY GIỜ (Khắc phục lỗi đứng im)
function startClock() {
    const clock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
        const dateStr = now.toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
        
        if(document.getElementById('os-time')) document.getElementById('os-time').textContent = timeStr;
        if(document.getElementById('os-date')) document.getElementById('os-date').textContent = dateStr;
        
        // CMOS Logic
        const dot = document.getElementById('cmos-dot');
        const status = document.getElementById('cmos-status');
        if (now.getFullYear() === 2000) {
            dot.style.background = "red"; status.textContent = "Dead";
        } else {
            dot.style.background = "#c9ff85"; status.textContent = "Working";
        }
    };
    clock(); // Chạy ngay lập tức lần đầu
    setInterval(clock, 1000); // Lặp lại mỗi giây
}

// 2. CHẾ ĐỘ SÁNG TỐI
function toggleTheme() {
    document.body.classList.toggle('light-mode');
}

// 3. HIỆN BÀN CỜ
window.enterGame = function() {
    $('.os-wrapper').fadeOut(300, () => {
        $('#game-screen').css('display', 'flex').hide().fadeIn(300, () => {
            if (!board) {
                board = Chessboard('myBoard', {
                    draggable: true,
                    position: 'start',
                    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
                    onDrop: (s, t) => {
                        let move = game.move({ from: s, to: t, promotion: 'q' });
                        if (!move) return 'snapback';
                        
                        // Gọi AI suy nghĩ
                        stockfish.postMessage(`position fen ${game.fen()}`);
                        stockfish.postMessage('go movetime 1000');
                    }
                });
            }
            // QUAN TRỌNG: Resize để bàn cờ hiện ra
            board.resize();
        });
    });
};

// Phản hồi từ Stockfish
stockfish.onmessage = (e) => {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        game.move({ from: move.substring(0, 2), to: move.substring(2, 4), promotion: 'q' });
        board.position(game.fen());
        $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
    }
};

// Khởi chạy khi trang web sẵn sàng
$(document).ready(() => {
    startClock();
    stockfish.postMessage('uci');
});
