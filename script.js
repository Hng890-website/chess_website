var board = null;
var game = new Chess();
var engine;

// Sửa lỗi Security bằng cách fetch script về trước
fetch('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js')
    .then(res => res.text())
    .then(code => {
        const blob = new Blob([code], { type: 'application/javascript' });
        engine = new Worker(URL.createObjectURL(blob));
        
        engine.onmessage = function(event) {
            if (event.data.includes('bestmove')) {
                var move = event.data.split(' ')[1];
                game.move(move, { sloppy: true });
                board.position(game.fen());
                $('#engine-status').text('Máy đã đi xong');
                $('#user-status').text('Đến lượt bạn đi');
            }
        };

        engine.postMessage('uci');
        engine.postMessage('isready');
    });

function onDrop(source, target) {
    var move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    $('#user-status').text('Đã đi xong');
    $('#engine-status').text('Máy đang suy nghĩ...');
    
    if (engine) {
        engine.postMessage('position fen ' + game.fen());
        engine.postMessage('go depth 12');
    }
}

var config = {
    draggable: true,
    position: 'start',
    onDrop: onDrop,
    onSnapEnd: function() { board.position(game.fen()); }
};
board = Chessboard('myBoard', config);

$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    if (engine) {
        engine.postMessage('ucinewgame');
        engine.postMessage('isready');
    }
    $('#user-status').text('Ván mới! Đến lượt bạn.');
});
