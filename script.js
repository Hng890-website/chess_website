/**
 * GM CHESS OS - ENGINE: STOCKFISH 16.1 (Real AI)
 * Giao diện: Fluent Design & Glassmorphism
 */

let board = null;
let game = new Chess();
// Khởi tạo Stockfish từ URL chính thức (Web Worker)
const stockfish = new Worker('https://nmrugg.github.io/stockfish.js/stockfish.js');

// --- 1. ENGINE STOCKFISH LOGIC ---
stockfish.onmessage = function(event) {
    const line = event.data;
    // Khi Stockfish tìm ra nước đi tốt nhất
    if (line.indexOf('bestmove') > -1) {
        const moveStr = line.split(' ')[1];
        const move = game.move({
            from: moveStr.substring(0, 2),
            to: moveStr.substring(2, 4),
            promotion: 'q'
        });
        
        board.position(game.fen());
        updateUI();
    }
};

function askStockfish() {
    // Gửi vị trí hiện tại và yêu cầu AI tính toán trong 1 giây
    stockfish.postMessage('position fen ' + game.fen());
    stockfish.postMessage('go movetime 1000'); 
}

// --- 2. HỆ THỐNG CMOS (ANTI-CHEAT TIME) ---
function checkCmosSystem() {
    const now = new Date();
    const lastTime = localStorage.getItem('os_last_time');
    let isDead = false;

    // Phát hiện pin chết: Năm 2000 hoặc thời gian bị lùi ngược
    if (now.getFullYear() === 2000 || (lastTime && now.getTime() < parseInt(lastTime))) {
        isDead = true;
        localStorage.setItem('cmos_permanent_dead', 'true');
    }

    if (localStorage.getItem('cmos_permanent_dead') === 'true') isDead = true;

    // Cập nhật giao diện Widget
    document.getElementById('os-time').textContent = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    document.getElementById('os-date').textContent = `${now.getDate()}.${now.getMonth()+1}.${now.getFullYear()}`;
    
    const status = document.getElementById('cmos-status');
    const dot = document.getElementById('cmos-dot');
    
    if (isDead) {
        status.textContent = "Dead";
        status.style.color = "#ff4d4f";
        dot.style.background = "#ff4d4f";
        if (!sessionStorage.getItem('modal_shown')) {
            $('#cmos-modal').css('display', 'flex').hide().fadeIn(400);
            sessionStorage.setItem('modal_shown', 'true');
        }
    } else {
        status.textContent = "Working";
        status.style.color = "#81b64c";
        dot.style.background = "#81b64c";
    }
    localStorage.setItem('os_last_time', now.getTime());
}

// --- 3. QUẢN LÝ BÀN CỜ ---
window.enterGame = function() {
    $('.os-wrapper').fadeOut(300, () => {
        $('#game-area').fadeIn(300, () => {
            if (!board) {
                board = Chessboard('myBoard', {
                    draggable: true,
                    position: 'start',
                    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
                    onDrop: (source, target) => {
                        let move = game.move({ from: source, to: target, promotion: 'q' });
                        if (!move) return 'snapback';
                        updateUI();
                        window.setTimeout(askStockfish, 250);
                    }
                });
            }
            board.resize();
        });
    });
};

function updateUI() {
    $('#move-history').html(game.pgn({ max_width: 5, newline_char: '<br>' }));
    const history = document.getElementById('move-history');
    history.scrollTop = history.scrollHeight;
}

window.closeCmosModal = () => $('#cmos-modal').fadeOut(300);
window.backToMenu = () => location.reload();

$(document).ready(() => {
    setInterval(checkCmosSystem, 1000);
    checkCmosSystem();
    stockfish.postMessage('uci'); // Kích hoạt Stockfish
});
