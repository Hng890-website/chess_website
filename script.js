body {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    background-color: #262421; /* Màu nền tối như Lichess/Chess.com */
    color: white;
    margin: 0;
    font-family: sans-serif;
}

.game-container {
    width: 450px;
}

.player-info {
    display: flex;
    align-items: center;
    padding: 10px 0;
}

.avatar {
    width: 40px;
    height: 40px;
    margin-right: 10px;
    background: #333;
    border-radius: 4px;
}

.details {
    display: flex;
    flex-direction: column;
}

#myBoard {
    border: 2px solid #555;
    border-radius: 4px;
    overflow: hidden;
}

.controls {
    margin-top: 15px;
    text-align: center;
}

#resetBtn {
    padding: 10px 20px;
    cursor: pointer;
    background: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
}
