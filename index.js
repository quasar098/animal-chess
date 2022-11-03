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

io.eio.pingTimeout = 20000;

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
            socket.enemy  = false;
            return;
        }
        if (game.enemySocket == undefined) {
            game.enemySocket = socket;
            socket.game = gameName;
            socket.enemy = true;
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
                games[socket.game].enemySocket.emit("refresh", "The host disconnected");
            }
            delete games[socket.game];
        }
        if (games[socket.game] == null) {
            return;
        }
        // if opponent leaves, close game
        if (games[socket.game].enemySocket == socket) {
            if (games[socket.game].hostSocket != null) {
                games[socket.game].hostSocket.emit("refresh", "Your opponent disconnected");
            }
            delete games[socket.game];
        }
    });
    socket.on("get-game-names-list", () => {
        socket.emit("game-names-list", Object.keys(games));
    });
    socket.on("update-board-state", ({pieces, moveType, moveMessage}) => {
        let game = games[socket.game];
        if (game.state.whoseTurn != socket.enemy) {
            socket.other.emit("refresh", "Your opponent was caught cheating");
            socket.emit("refresh", "You've been caught cheating");
            delete games[socket.game];
            return;
        }
        games[socket.game].state.whoseTurn = !game.state.whoseTurn;
        games[socket.game].state.moves++;
        socket.other.emit("update-board-state", {pieces: pieces, moveType: moveType, moveMessage: moveMessage, state: games[socket.game].state});
        socket.emit("update-board-state", {pieces: pieces, moveType: null, moveMessage: null, state: games[socket.game].state});
    })
    socket.on("close-game", () => {
        delete games[socket.game];
        socket.game = undefined;
    })
})

// 404 uh oh
app.get('*', (req, res) => {
  res.status(404).send('<style>h1 { font-family: Helvetica }</style><h1>THERE IS NO FILE HERE</h1>');
});

// open to port 5000
let port = 5000;
server.listen(process.env.PORT || port, "0.0.0.0", () => {
    console.log("Listening on port " + port);
})
