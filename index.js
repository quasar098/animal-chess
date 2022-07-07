const express = require('express');
const app = express();
const path = require('path');
const { Server } = require("socket.io");
const http = require('http');
const server = http.createServer(app);
const io = new Server(server);

// json responses?
app.use(express.json());

// public routes
app.use(express.static("public"));

// api and games
let games = {}

// socket io
io.on("connection", (socket) => {
    // socket on
    socket.on("join-game", (gameName) => {
        if (!Object.keys(games).includes(gameName)) {
            // set game to starting position/state
            games[gameName] = {
                state: {
                    whoseTurn: false,
                    moves: 0
                },
                hostSocket: null,
                enemySocket: null
            };
        }
        let game = games[gameName];
        if (game.hostSocket == undefined) {
            game.hostSocket = socket;
            socket.game = gameName;
            return;
        }
        if (game.enemySocket == undefined) {
            game.enemySocket = socket;
            socket.game = gameName;
            game.hostSocket.other = game.enemySocket;
            game.enemySocket.other = game.hostSocket;
            game.hostSocket.emit("begin", {state: game.state, enemy: false});
            game.enemySocket.emit("begin", {state: game.state, enemy: true});
            return;
        }
        socket.emit("error", "game already full");
    });
    socket.on('disconnect', () => {
        if (games[socket.game] == null) {
            return;
        }
        // if host leaves, close game
        if (games[socket.game].hostSocket == socket) {
            if (games[socket.game].enemySocket != null) {
                games[socket.game].enemySocket.emit("refresh");
            }
            delete games[socket.game];
        }
        // if opponent leaves, keep game open for others to join
        if (games[socket.game] != null) {
            if (games[socket.game].enemySocket == socket) {
                games[socket.game].enemySocket = null;
            }
        }
    });
    socket.on("get-game-names-list", () => {
        socket.emit("game-names-list", Object.keys(games));
    });
    socket.on("update-board-state", ({pieces, moveType, moveMessage}) => {
        let game = games[socket.game];
        games[socket.game].state.whoseTurn = !game.state.whoseTurn;
        games[socket.game].state.moves++;
        socket.other.emit("update-board-state", {pieces: pieces, moveType: moveType, moveMessage: moveMessage, state: games[socket.game].state});
        socket.emit("update-board-state", {pieces: pieces, moveType: null, moveMessage: null, state: games[socket.game].state});
    })
})

// 404 uh oh
app.get('*', (req, res) => {
  res.status(404).send('<style>h1 { font-family: Helvetica }</style><h1>THERE IS NO FILE HERE</h1>');
});

// open to port 5000
let port = 5000;
server.listen(port, () => {
    console.log("Listening on port " + port);
})
