// --- 1. KHAI BÁO BIẾN TOÀN CỤC ---
var board = null;
var game = new Chess();
var selectedSquare = null;
var engine = null;
var peer = null;
var conn = null;
var isOnline = false;
var myColor = 'w';
var currentLang = 'vi';

// --- 2. TỪ ĐIỂN ĐA NGÔN NGỮ ---
const i18n = {
    vi: {
        status_offline: "● Chế độ: Ngoại tuyến",
        status_online: "● Đang đấu Online: ",
        history_title: "LỊCH SỬ NƯỚC ĐI",
        new_game: "VÁN MỚI",
        placeholder_id: "Dán ID đối thủ...",
        msg_copy: "Đã sao chép ID!"
    },
    en: {
        status_offline: "● Mode: Offline",
        status_online: "● Online Playing: ",
        history_title: "MOVE HISTORY",
        new_game: "NEW GAME",
        placeholder_id: "Paste opponent ID...",
        msg_copy: "ID Copied!"
    }
};

// --- 3. KHỞI TẠO ENGINE AI (STOCKFISH) ---
function initStockfish() {
    try {
        engine = new Worker('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');
        engine.onmessage = function(event) {
            var line = event.data;
            if (line.indexOf('bestmove') > -1) {
                var match = line.match(/bestmove\s([a-h][1-8])([a-h][1-8])(q|r|b|n)?/);
                if (match) {
                    makeMove({ from: match[1], to: match[2], promotion: match[3] || 'q' });
                }
            }
        };
        engine.postMessage('uci');
    } catch (e) {
        console.warn("CORS chặn Stockfish, máy sẽ đánh ngẫu nhiên.");
        engine = null;
    }
}

// --- 4. LOGIC DI CHUYỂN QUÂN CỜ ---
function makeMove(moveObj) {
    var move = game.move(moveObj);
    if (move === null) return false;

    // Phát âm thanh chuẩn Lichess
    let snd = new Audio(move.flags.includes('c') ? 
        'https://lichess1.org/assets/sound/standard/Capture.ogg' : 
        'https://lichess1.org/assets/sound/standard/Move.ogg');
    snd.play().catch(()=>{});

    board.position(game.fen());
    updateHistory();
    removeHighlights();

    // Gửi nước đi nếu đang đấu Online
    if (isOnline && conn) {
        conn.send({ type: 'move', move: moveObj });
    } 
    // Nếu đấu với máy
    else if (game.turn() === 'b' && !game.game_over()) {
        if (engine) {
            engine.postMessage('position fen ' + game.fen());
            engine.postMessage('go movetime 1000');
        } else {
            setTimeout(() => {
                let moves = game.moves();
                makeMove(moves[Math.floor(Math.random() * moves.length)]);
            }, 500);
        }
    }
    return true;
}

// --- 5. QUẢN LÝ GIAO DIỆN & SỰ KIỆN ---
function updateHistory() {
    let history = game.history();
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
        html += `<div style="color:#aaa">${Math.floor(i/2)+1}.</div>` +
                `<div><b>${history[i]}</b></div>` +
                `<div><b>${history[i+1] || ''}</b></div>`;
    }
    $('#move-history').html(html).scrollTop(9999);
}

function removeHighlights() {
    $('.square-55d63').css('background', '');
    $('.suggest-dot').remove();
}

function changeLang(lang) {
    currentLang = lang;
    $('[data-i18n]').each(function() {
        const key = $(this).data('i18n');
        $(this).text(i18n[lang][key]);
    });
}

// --- 6. CẤU HÌNH BÀN CỜ (QUAN TRỌNG NHẤT) ---
var config = {
    draggable: true,
    position: 'start',
    // ĐƯỜNG DẪN ẢNH FIX LỖI 404
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onSnapEnd: function() { board.position(game.fen()); }
};

board = Chessboard('myBoard', config);

// Xử lý Click-to-move (Chạm để đi)
$('#myBoard').on('mousedown', '.square-55d63', function() {
    let square = $(this).data('square');
    
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: square, promotion: 'q' })) {
            selectedSquare = null;
            return;
        }
    }

    removeHighlights();
    let piece = game.get(square);
    if (piece && piece.color === (isOnline ? myColor : game.turn())) {
        selectedSquare = square;
        $(this).css('background', 'rgba(255, 255, 0, 0.4)');
        game.moves({ square: square, verbose: true }).forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot" style="width:20%;height:20%;background:rgba(0,0,0,0.2);border-radius:50%;position:absolute;top:40%;left:40%"></div>');
        });
    } else {
        selectedSquare = null;
    }
});

// --- 7. KHỞI CHẠY KHI TRANG SẴN SÀNG ---
$(window).on('load', function() {
    initStockfish();
    board.resize(); // Ép bàn cờ to ra đúng khung CSS
});

$(window).on('resize', function() {
    board.resize();
});

$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    $('#move-history').empty();
    removeHighlights();
});

// Chức năng mở Modal Online (PeerJS)
window.openOnlineModal = function() {
    $('#onlineModal').fadeIn();
    if (!peer) {
        peer = new Peer();
        peer.on('open', id => $('#myId').val(id));
        peer.on('connection', c => {
            conn = c;
            myColor = 'b';
            handleConnection();
        });
    }
};

function handleConnection() {
    conn.on('open', () => {
        isOnline = true;
        $('#onlineModal').fadeOut();
        $('#status').text(i18n[currentLang].status_online + (myColor === 'w' ? 'White' : 'Black'));
        board.orientation(myColor === 'w' ? 'white' : 'black');
        game.reset();
        board.start();
    });
    conn.on('data', data => {
        if (data.type === 'move') {
            game.move(data.move);
            board.position(game.fen());
            updateHistory();
        }
    });
}
