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
                    pieces: [
                        {type: "buffalo", enemy: true, x: 1, y: 2}
                    ],
                    turn: false,
                    moves: 0
                },
                hostSocket: undefined,
                enemySocket: undefined
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
            game.hostSocket.emit("begin", game.state);
            game.enemySocket.emit("begin", game.state);
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
        if (games[socket.game].enemySocket == socket) {
            delete games[socket.game].enemySocket;
        }
    });
    socket.on("get-game-names-list", () => {
        socket.emit("game-names-list", Object.keys(games));
    });
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
