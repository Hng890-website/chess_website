var board = null;
var game = new Chess();
var selectedSquare = null;
var peer = null;
var conn = null;
var isOnline = false;
var myColor = 'w';

// --- PHẦN 1: KẾT NỐI P2P ---
function initPeer() {
    peer = new Peer(); // Tạo ID ngẫu nhiên
    peer.on('open', (id) => { $('#myId').val(id); });
    
    // Khi có người khác kết nối tới mình
    peer.on('connection', (c) => {
        conn = c;
        myColor = 'b'; // Người nhận lời mời sẽ cầm quân Đen
        setupChat();
        startGameOnline();
    });
}

function connectToPeer() {
    var remoteId = $('#peerId').val();
    if (!remoteId) return alert("Hãy nhập ID đối thủ!");
    conn = peer.connect(remoteId);
    myColor = 'w'; // Người chủ động mời cầm quân Trắng
    setupChat();
    startGameOnline();
}

function setupChat() {
    conn.on('data', (data) => {
        if (data.type === 'move') {
            game.move(data.move);
            board.position(game.fen());
            updateHistory();
            playSnd('move');
        }
    });
    conn.on('open', () => { isOnline = true; $('#onlineModal').fadeOut(); });
}

// --- PHẦN 2: LOGIC GAME ---
function makeMove(moveObj) {
    var move = game.move(moveObj);
    if (!move) return false;

    playSnd(move.flags.includes('c') ? 'capture' : 'move');
    board.position(game.fen());
    updateHistory();
    $('.square-55d63').removeClass('highlight-selected');
    $('.suggest-dot').remove();

    if (isOnline && conn) {
        conn.send({ type: 'move', move: moveObj });
    } else if (game.turn() === 'b' && !game.game_over()) {
        // Đấu máy đơn giản nếu offline
        setTimeout(() => {
            var moves = game.moves();
            makeMove(moves[Math.floor(Math.random() * moves.length)]);
        }, 600);
    }
    return true;
}

// Click-to-move
$('#myBoard').on('mousedown', '.square-55d63', function() {
    if (isOnline && game.turn() !== myColor) return; // Không phải lượt mình online

    let sq = $(this).data('square');
    if (selectedSquare) {
        if (makeMove({ from: selectedSquare, to: sq, promotion: 'q' })) {
            selectedSquare = null; return;
        }
    }
    $('.square-55d63').removeClass('highlight-selected');
    $('.suggest-dot').remove();
    let p = game.get(sq);
    if (p && p.color === (isOnline ? myColor : game.turn())) {
        selectedSquare = sq;
        $(this).addClass('highlight-selected');
        game.moves({square: sq, verbose: true}).forEach(m => {
            $(`.square-${m.to}`).append('<div class="suggest-dot"></div>');
        });
    } else { selectedSquare = null; }
});

// Giao diện
function startGame() { $('#home-screen').fadeOut(); board.resize(); playSnd('start'); }
function openOnlineModal() { $('#onlineModal').fadeIn(); initPeer(); }
function startGameOnline() {
    $('#home-screen').fadeOut();
    $('#connection-status').text(`● Đang đấu: ${myColor === 'w' ? 'Trắng' : 'Đen'}`);
    board.orientation(myColor === 'w' ? 'white' : 'black');
    board.start();
    game.reset();
    board.resize();
}

function updateHistory() {
    let h = game.history();
    let html = '';
    for (let i=0; i<h.length; i+=2) {
        html += `<div>${Math.floor(i/2)+1}</div><div>${h[i]}</div><div>${h[i+1]||''}</div>`;
    }
    $('#move-history').html(html).scrollTop(999);
}

function playSnd(id) { document.getElementById('snd-'+id).play().catch(()=>{}); }

board = Chessboard('myBoard', { position: 'start', draggable: false });
$(window).resize(() => board.resize());
