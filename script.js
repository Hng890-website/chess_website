var board = null;
var game = new Chess();
var engine;
var currentLang = 'vi';

// --- HỆ THỐNG ĐA NGÔN NGỮ ---
const i18n = {
    vi: {
        bot_name: "Stockfish AI <small>Cấp độ 10</small>",
        user_name: "Người chơi (Trắng)",
        engine_ready: "Máy đã sẵn sàng!",
        engine_thinking: "Máy đang suy nghĩ...",
        engine_done: "Máy đã đi xong. Tới bạn!",
        user_turn: "Tới lượt bạn đi",
        user_waiting: "Chờ máy tính...",
        new_game: "Ván mới",
        footer: "&copy; 2026 Được vận hành bởi Stockfish Engine | Phát triển bởi HNG890"
    },
    en: {
        bot_name: "Stockfish AI <small>Level 10</small>",
        user_name: "Player (White)",
        engine_ready: "Engine is ready!",
        engine_thinking: "Engine is thinking...",
        engine_done: "Engine moved. Your turn!",
        user_turn: "Your turn to move",
        user_waiting: "Waiting for engine...",
        new_game: "New Game",
        footer: "&copy; 2026 Powered by Stockfish Engine | Developed by HNG890"
    },
    fr: {
        bot_name: "Stockfish IA <small>Niveau 10</small>",
        user_name: "Joueur (Blancs)",
        engine_ready: "L'IA est prête!",
        engine_thinking: "L'IA réfléchit...",
        engine_done: "L'IA a joué. À vous!",
        user_turn: "C'est votre tour",
        user_waiting: "En attente de l'IA...",
        new_game: "Nouvelle Partie",
        footer: "&copy; 2026 Propulsé par Stockfish | Développé par HNG890"
    },
    jp: {
        bot_name: "ストックフィッシュ AI <small>レベル 10</small>",
        user_name: "プレイヤー (白)",
        engine_ready: "エンジンの準備完了！",
        engine_thinking: "考え中...",
        engine_done: "AIが指しました。あなたの番です！",
        user_turn: "あなたの手番です",
        user_waiting: "待機中...",
        new_game: "新しいゲーム",
        footer: "&copy; 2026 Stockfish Engine 搭載 | HNG890 による開発"
    }
};

function changeLanguage(lang) {
    currentLang = lang;
    $('[data-i18n]').each(function() {
        const key = $(this).data('i18n');
        if (i18n[lang][key]) {
            $(this).html(i18n[lang][key]);
        }
    });
    $('#lang-select-header, #lang-select-footer').val(lang);
}

// --- KHỞI TẠO ENGINE ---
const workerCode = `importScripts('https://cdnjs.cloudflare.com/ajax/libs/stockfish.js/10.0.2/stockfish.js');`;
const blob = new Blob([workerCode], { type: 'application/javascript' });
engine = new Worker(URL.createObjectURL(blob));

engine.onmessage = function(e) {
    if (e.data.includes('bestmove')) {
        const move = e.data.split(' ')[1];
        game.move(move, { sloppy: true });
        board.position(game.fen());
        $('#engine-status').text(i18n[currentLang].engine_done);
        $('#user-status').text(i18n[currentLang].user_turn);
    }
};

engine.postMessage('uci');
engine.postMessage('isready');

// --- LOGIC TRÒ CHƠI ---
function onDrop(source, target) {
    const move = game.move({ from: source, to: target, promotion: 'q' });
    if (move === null) return 'snapback';

    $('#user-status').text(i18n[currentLang].user_waiting);
    $('#engine-status').text(i18n[currentLang].engine_thinking);
    
    engine.postMessage('position fen ' + game.fen());
    engine.postMessage('go depth 12');
}

board = Chessboard('myBoard', {
    draggable: true,
    position: 'start',
    pieceTheme: 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png',
    onDrop: onDrop,
    onSnapEnd: () => board.position(game.fen())
});

// --- SỰ KIỆN ---
$('#lang-select-header, #lang-select-footer').on('change', function() {
    changeLanguage($(this).val());
});

$('#resetBtn').on('click', () => {
    game.reset();
    board.start();
    engine.postMessage('ucinewgame');
    $('#engine-status').text(i18n[currentLang].engine_ready);
    $('#user-status').text(i18n[currentLang].user_turn);
});
