var board = null;
var game = new Chess();

function enterGame() {
    $('#home-screen').fadeOut(500, function() {
        $('.app-wrapper').fadeIn(500);
        board.resize(); // Đảm bảo bàn cờ to ra đúng kích thước
    });
}

function exitGame() {
    $('.app-wrapper').fadeOut(500, function() {
        $('#home-screen').fadeIn(500);
    });
}

// Logic máy và bàn cờ (Tương tự bản trước nhưng tối ưu hơn)
function makeMove(moveObj) {
    var move = game.move(moveObj);
    if (move === null) return false;

    board.position(game.fen());
    updateHistory();
    
    if (game.turn() === 'b' && !game.game_over()) {
        setTimeout(makeRandomMove, 500); // Bạn có thể thay bằng Stockfish nếu muốn
    }
    return true;
}

function updateHistory() {
    let history = game.history();
    let html = '';
    for (let i = 0; i < history.length; i += 2) {
        html += `<div style="color:#777">${Math.floor(i/2)+1}.</div>` +
                `<div>${history[i]}</div>` +
                `<div>${history[i+1] || ''}</div>`;
    }
    $('#move-history').html(html);
}

var config = {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: function(source, target) {
        var move = makeMove({ from: source, to: target, promotion: 'q' });
        if (move === false) return 'snapback';
    }
};

board = Chessboard('myBoard', config);

$(window).resize(board.resize);
