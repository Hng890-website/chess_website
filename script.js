var board = null
var game = new Chess()
var stockfish = null
var currentFen = ''

function onDragStart (source, piece, position, orientation) {
  // do not pick up pieces if the game is over
  if (game.game_over()) return false

  // only allow white to move for now
  if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
      (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
    return false
  }
}

function makeRandomMove () {
  var possibleMoves = game.moves()

  // game over
  if (possibleMoves.length === 0) return

  var randomIdx = Math.floor(Math.random() * possibleMoves.length)
  game.move(possibleMoves[randomIdx])
  board.position(game.fen())
}

function onDrop (source, target) {
  // see if the move is legal
  var move = game.move({
    from: source,
    to: target,
    promotion: 'q' // NOTE: always promote to a queen for simplicity
  })

  // illegal move
  if (move === null) return 'snapback'

  updateStatus()
  window.setTimeout(makeEngineMove, 250) // Make engine move after a short delay
}

// update the board position after the piece snap
// for castling, en passant, pawn promotion
function onSnapEnd () {
  board.position(game.fen())
}

function updateStatus () {
  var status = ''

  var moveColor = 'White'
  if (game.turn() === 'b') {
    moveColor = 'Black'
  }

  // checkmate?
  if (game.in_checkmate()) {
    status = 'Game over, ' + moveColor + ' is in checkmate.'
  }

  // draw?
  else if (game.in_draw()) {
    status = 'Game over, drawn position'
  }

  // game still on
  else {
    status = moveColor + ' to move'

    // check?
    if (game.in_check()) {
      status += ', ' + moveColor + ' is in check'
    }
  }

  $('#status').html(status)
  $('#fen').html(game.fen())
  currentFen = game.fen()
}

function makeEngineMove() {
    if (stockfish) {
        $('#engineThinking').html('Engine is thinking...');
        stockfish.postMessage('position fen ' + currentFen);
        stockfish.postMessage('go depth 15'); // Adjust depth for stronger play
    } else {
        console.error("Stockfish not initialized.");
    }
}

$(document).ready(function() {
    var config = {
        draggable: true,
        position: 'start',
        onDragStart: onDragStart,
        onDrop: onDrop,
        onSnapEnd: onSnapEnd
    }
    board = Chessboard('board', config)

    $('#startButton').on('click', function() {
        game.reset();
        board.position('start');
        updateStatus();
    });

    $('#resetButton').on('click', function() {
        game.reset();
        board.position('start');
        updateStatus();
    });

    updateStatus()

    // Initialize Stockfish
    stockfish = new Worker('stockfish.js'); // Make sure this path is correct

    stockfish.onmessage = function(event) {
        var line = event.data;
        if (line.indexOf('bestmove') !== -1) {
            var match = line.match(/bestmove\s(\S+)/);
            if (match) {
                var bestMove = match[1];
                console.log('Engine best move:', bestMove);
                $('#engineThinking').html('');

                // Apply the engine's move to the board
                game.move(bestMove, { sloppy: true });
                board.position(game.fen());
                updateStatus();
            }
        }
    };

    stockfish.postMessage('uci'); // Initialize UCI protocol
    stockfish.postMessage('isready');
});
