const hoverTip = document.getElementsByTagName('hover-tip')[0];
const notationDiv = document.getElementsByClassName("notation")[0];
const legalMovesDiv = document.getElementsByClassName("legal-moves")[0];
const animalChessTitle = document.getElementById('title');
const movesPara = document.getElementById('moves');
const numMoves = document.getElementById('num-moves');
const subTitle = document.getElementById('subtitle');

// links
const githubLink = document.getElementById('github');
const goBackQuasar = document.getElementById('go-back');

// main menu
const joinGame = document.getElementById('join-game');
const roomName = document.getElementById('room-name');
const warningPara = document.getElementById('warning');
const closeGameButton = document.getElementById('close-game');
const themeIcon = document.getElementById('theme-icon');
const themes = {
    dark: {
        "--bg": "#202225",
        "--main": "#FFFFFF"
    },
    light: {
        "--bg": "#FFFFFF",
        "--main": "#000000"
    }
}
let isDarkMode = !JSON.parse(localStorage.getItem("darkMode")) ?? false;
toggleTheme();
setScreen("menu");

function vh(percent) {
    var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    return (percent * h) / 100;
}

function toggleTheme() {
    isDarkMode = !isDarkMode;
    let currentTheme = themes[isDarkMode ? "dark" : "light"];
    document.documentElement.style.setProperty('--bg', currentTheme["--bg"]);
    document.documentElement.style.setProperty('--main', currentTheme["--main"]);
    themeIcon.classList.remove(themeIcon.classList[1])
    themeIcon.classList.add(isDarkMode ? "fa-moon-o" : "fa-sun-o");
    localStorage.setItem("darkMode", isDarkMode);
}

// MENU STUFF
var socket = io();
let createdGameNames = [];
let gameIsOver = false;

// socket on
socket.emit("get-game-names-list");
socket.on("error", (errmsg) => {
    warningPara.innerText = errmsg;
    closeGameButton.style.display = "none";
});
socket.on("begin", ({state, enemy}) => {
    setScreen("game");
    setTimeout(setNotation, 5);
    soundStart();
    myRole = enemy;
    onlineState = state;
    goBackQuasar.firstChild.classList.add("playing");
    githubLink.firstChild.classList.add("playing");
    subtitle.innerText = myRole == onlineState.whoseTurn ? "Your turn" : "Opponent's turn";
});
if (sessionStorage.getItem("disconnected") != undefined) {
    warningPara.innerText = sessionStorage.getItem("disconnected");
    sessionStorage.removeItem("disconnected");
}
socket.on("refresh", (msg) => {
    sessionStorage.setItem("disconnected", msg);
    location.reload();
})
socket.on("game-names-list", (names) => {
    createdGameNames = names;
});
socket.on("update-board-state", ({pieces, state, moveMessage, moveType}) => {
    onlineState = state;
    board.fromArrayState(pieces);
    if (!gameIsOver) {
        subtitle.innerText = myRole == onlineState.whoseTurn ? "Your turn" : "Opponent's turn"
    }
    if (moveMessage != null) {
        switch (moveType) {
            case 0:
                soundMove();
                break;
            case 1:
                soundTake();
                break;
            case 2:
                soundGameOver();
                break;
        }
        movesPara.innerHTML = "<br>" + movesPara.innerHTML;
        movesPara.innerText = moveMessage + movesPara.innerText;
    }
    numMoves.innerHTML = "# Moves: " + onlineState.moves;
    lastSelectedPiece = undefined;
})

// menu event listeners
roomName.addEventListener("input", (e) => {
    if (createdGameNames.includes(roomName.value)) {
        joinGame.innerText = "Join Room";
    } else {
        joinGame.innerText = "Create Room"
    }
});
joinGame.addEventListener("click", (e) => {
    socket.emit("join-game", roomName.value);
    warningPara.innerText = "waiting for opponent...";
    closeGameButton.style.display = "inline";
    roomName.setAttribute("disabled", "true");
    joinGame.style.display = "none";
});
closeGameButton.addEventListener("click", (e) => {
    socket.emit("close-game");
    warningPara.innerText = "";
    closeGameButton.style.display = "none";
    roomName.removeAttribute("disabled");
    joinGame.style.display = "inline";
})

// GAME STUFF
let audioStart = new Audio("start.mp3");
let audioMoves = [new Audio("move.mp3"), new Audio("move.mp3"), new Audio("move.mp3"), new Audio("move.mp3")];
let audioTakes = [new Audio("take.mp3"), new Audio("take.mp3"), new Audio("take.mp3"), new Audio("take.mp3")];
let audioGameOver = new Audio("gameover.mp3");

let myRole = undefined;
let onlineState = {whoseTurn: undefined, moves: -1};
let lastMoveMessage = "NO MESSAGE";
let lastMoveType = -1;

// sounds
function soundStart() {
    audioStart.play();
}
function soundMove() {
    for (var i = 0; i < audioMoves.length; i++) {
        if (audioMoves[i].paused) {
            audioMoves[i].play();
            return true;
        }
    }
    return false;
}
function soundTake() {
    for (var i = 0; i < audioTakes.length; i++) {
        if (audioTakes[i].paused) {
            audioTakes[i].play();
            return true;
        }
    }
    return false;
}
function soundGameOver() {
    audioGameOver.play();
    gameIsOver = true;
    setTimeout(() => {
        subTitle.innerText = (myRole == onlineState.whoseTurn ? "You lose" : "You win")
    }, 20);
}

// piece info
const pieceOffset = {
    true: {  // is enemy
        "goose": [[0, 1], [0, 2]],
        "monkey": [[0, 2], [1, 1], [2, 0], [1, -1], [0, -2], [-1, -1], [-2, 0], [-1, 1]],
        "buffalo": [[1, 1], [1, 2], [2, 1], [2, 2], [-1, 1], [-2, 1], [-1, 2], [-2, 2], [0, -1]],
        "knight": [[2, 1], [-2, 1], [-2, -1], [2, -1], [1, 2], [-1, 2], [-1, -2], [1, -2]],
        "pedestrian": [[0, 1], [1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [-1, 1]],
        "cobra": [[-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -2], [-2, -2], [-2, -1], [-2, 0], [-2, 1]]
    },
    false: {  // not enemy
        "goose": [[0, -1], [0, -2]],
        "monkey": [[0, 2], [1, 1], [2, 0], [1, -1], [0, -2], [-1, -1], [-2, 0], [-1, 1]],
        "buffalo": [[1, -1], [1, -2], [2, -1], [2, -2], [-1, -1], [-2, -1], [-1, -2], [-2, -2], [0, 1]],
        "knight": [[2, 1], [-2, 1], [-2, -1], [2, -1], [1, 2], [-1, 2], [-1, -2], [1, -2]],
        "pedestrian": [[0, 1], [1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1], [1, 0], [-1, 1]],
        "cobra": [[-2, 2], [-1, 2], [0, 2], [1, 2], [2, 2], [2, 1], [2, 0], [2, -1], [2, -2], [1, -2], [0, -2], [-1, -2], [-2, -2], [-2, -1], [-2, 0], [-2, 1]]
    }
}

let lastSelectedPiece = undefined;

class Board {
    constructor() {
        this.element = document.getElementById('board');
        document.addEventListener("mousemove", this.moveGrabbed);
        this.addPiece("buffalo", 0, 6);
        this.addPiece("knight", 1, 6);
        this.addPiece("cobra", 2, 6);
        this.addPiece("pedestrian", 3, 6);
        this.addPiece("cobra", 4, 6);
        this.addPiece("knight", 5, 6);
        this.addPiece("buffalo", 6, 6);
        this.addPiece("goose", 0, 5);
        this.addPiece("goose", 1, 5);
        this.addPiece("monkey", 2, 5);
        this.addPiece("buffalo", 3, 5);
        this.addPiece("monkey", 4, 5);
        this.addPiece("goose", 5, 5);
        this.addPiece("goose", 6, 5);

        // enemy
        this.addPiece("buffalo", 0, 0, true);
        this.addPiece("knight", 1, 0, true);
        this.addPiece("cobra", 2, 0, true);
        this.addPiece("pedestrian", 3, 0, true);
        this.addPiece("cobra", 4, 0, true);
        this.addPiece("knight", 5, 0, true);
        this.addPiece("buffalo", 6, 0, true);
        this.addPiece("goose", 0, 1, true);
        this.addPiece("goose", 1, 1, true);
        this.addPiece("monkey", 2, 1, true);
        this.addPiece("buffalo", 3, 1, true);
        this.addPiece("monkey", 4, 1, true);
        this.addPiece("goose", 5, 1, true);
        this.addPiece("goose", 6, 1, true);

        document.addEventListener("mouseup", (event) => {
            board.forEach((index, piece) => {
                if (!piece.grabbed) return;
                piece.grabbed = false;
                piece.style.top = "";
                piece.style.left = "";
                if (isHoveringOnSquare(event.clientX, event.clientY)) {
                    let {x, y} = hoverSquare(event.clientX, event.clientY);
                    x = Math.round(x);
                    y = Math.round(y);
                    if (!(piece.getAttribute("x") == x && piece.getAttribute("y") == y)) {
                        let overWritePiece = this.getPieceAtPos(x, y);
                        if (getTooltipAt(x, y) == undefined) {
                            board.update();
                            return;
                        }
                        if (overWritePiece != undefined) {
                            if (overWritePiece.enemy == piece.enemy) {
                                board.update();
                                return;
                            }
                            if (overWritePiece.classList.contains("pedestrian")) {
                                // take (pedestrian)
                                soundGameOver();
                                lastMoveType = 2;
                            } else {
                                // take (not pedestrian)
                                soundTake();
                                lastMoveType = 1;
                            }
                            board.element.removeChild(overWritePiece);
                        } else {
                            // just a move not a take
                            soundMove();
                            lastMoveType = 0;
                        }
                        // makes a move at all
                        lastSelectedPiece = undefined;
                        updateLegalMoves();

                        // addMoves
                        addMove(piece, x, y, overWritePiece);

                        // upgrade goose
                        if (["goose"].includes(piece.classList[0]) && y == (6-!piece.enemy*6)) {
                            piece.classList.replace(piece.classList[0], "monkey");
                        }
                        piece.setAttribute("x", x);
                        piece.setAttribute("y", y);
                        sendBoardState();
                    }
                }
                board.update();
            });
        });
    }
    get pieces() {
        return this.element.children;
    }
    addPiece(name, x, y, enemy=false) {
        let piece = document.createElement("chess-piece");
        piece.classList.add(name);
        piece.setAttribute("x", x);
        piece.setAttribute("y", y);
        piece.style.transform = "translate(" + x*vh(10) +  "px, " + y*vh(10) + "px)";
        piece.enemy = enemy;
        if (piece.enemy) {
            piece.classList.add("enemy");
        }
        piece.addEventListener("mousedown", (event) => {
            if (gameIsOver) {
                return;
            }
            if (piece.enemy == myRole && myRole == onlineState.whoseTurn) {
                piece.grabbed = true;
            }
            lastSelectedPiece = piece;
            updateLegalMoves();
            setTimeout(() => {
                lastSelectedPiece = piece;
            }, 1);
        });
        this.element.appendChild(piece);
    }
    forEach(callable) {
        for (var i = 0; i < this.pieces.length; i++) {
            callable(i, this.pieces[i]);
        }
    }
    update() {
        this.forEach((index, piece) => {
            piece.style.transform = "translate(" + piece.getAttribute("x")*vh(10) + "px, " + piece.getAttribute("y")*vh(10) + "px)";
            piece.style.zIndex = "20";
        })
    }
    get rect() {
        return this.element.getBoundingClientRect();
    }
    moveGrabbed(event) {
        let {clientX, clientY} = event;
        clientX = clamp(clientX, board.rect.left, board.rect.right);
        clientY = clamp(clientY, board.rect.top, board.rect.bottom);
        board.forEach((index, piece) => {
            if (piece.grabbed) {
                piece.style.transform = "";
                piece.style.left = clientX-50 + "px";
                piece.style.top = clientY-50 + "px";
                piece.style.zIndex = "22";
            }
        });
    }
    getPieceAtPos(x, y) {
        let foundPiece = undefined;
        this.forEach((index, piece) => {
            if ((piece.getAttribute("x")*1 == x) && (piece.getAttribute("y")*1 == y)) {
                foundPiece = piece;
            }
        });
        return foundPiece;
    }
    getGrabbedPiece() {
        let grabbedPiece = undefined;
        this.forEach((index, piece) => {
            if (piece.grabbed) {
                grabbedPiece = piece;
            }
        });
        return grabbedPiece;
    }
    getGrabbedPos() {
        let piece = this.getGrabbedPiece();
        if (piece == undefined) return undefined;
        return {x: piece.getAttribute("x")*1, y: piece.getAttribute("y")*1}
    }
    fromArrayState(piecesArray) {
        removeAllChildNodes(this.element);
        piecesArray.forEach(({type, x, y, enemy}, index) => {
            this.addPiece(type, x, y, enemy);
        });
    }
}

let board = new Board();

board.update();

function sendBoardState() {
    socket.emit("update-board-state", {pieces: boardToArray(), moveType: lastMoveType, moveMessage: lastMoveMessage});
}

function getTooltipAt(cx, cy) {
    for (var i = 0; i < legalMovesDiv.children.length; i++) {
        let x = legalMovesDiv.children[i].getAttribute("x");
        let y = legalMovesDiv.children[i].getAttribute("y");
        if (cx == x && cy == y) return legalMovesDiv.children[i];
    }
    return undefined;
}

function addMove(piece, x, y, overWritePiece) {
    movesPara.innerHTML = "<br>" + movesPara.innerHTML;
    lastMoveMessage = (onlineState.moves+1) + ": " + (piece.enemy ? "red " : "blue ") +
        piece.classList[0] + " [" + "ABCDEFG"[piece.getAttribute("x")*1]+(piece.getAttribute("y")*1+1)+" > " +
        ("ABCDEFG"[x])+(y+1) + "] " + ((overWritePiece == undefined) ? "" : "<!>");
    movesPara.innerText = lastMoveMessage + movesPara.innerText
    numMoves.innerText = "# Moves: " + onlineState.moves;
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function setNotation() {
    removeAllChildNodes(notationDiv);
    for (var i = 0; i < 7; i++) {
        let noteNumber = document.createElement("h4");
        noteNumber.innerText = i+1;
        noteNumber.style.left = board.rect.left-20 + "px";
        noteNumber.style.top = board.rect.top+20+i*vh(10) + "px";
        notationDiv.appendChild(noteNumber);
    }
    for (var i = 0; i < 7; i++) {
        let noteNumber = document.createElement("h4");
        noteNumber.innerText = "abcdefg"[i];
        noteNumber.style.left = board.rect.left+50+i*vh(10) + "px";
        noteNumber.style.top = board.rect.bottom-20 + "px";
        notationDiv.appendChild(noteNumber);
    }
}

function updateLegalMoves() {
    removeAllChildNodes(legalMovesDiv);
    function addDotIndicator(x, y) {
        let dotImg = document.createElement("img");
        dotImg.classList.add("legal");
        dotImg.src = "tooltip.png"
        dotImg.style.left = board.rect.left+x*vh(10) + "px";
        dotImg.style.top = board.rect.top+y*vh(10) + 'px';
        dotImg.setAttribute("x", x);
        dotImg.setAttribute("y", y);
        if (x != clamp(x, 0, 6)) return;
        if (y != clamp(y, 0, 6)) return;
        let onTopOf = board.getPieceAtPos(x, y);
        if (onTopOf != undefined) {
            if (onTopOf.enemy == lastSelectedPiece.enemy) return;
            dotImg.style.zIndex = 21;
        }
        legalMovesDiv.appendChild(dotImg);
    }

    if (lastSelectedPiece == undefined) return;
    let offsets = pieceOffset[lastSelectedPiece.enemy][lastSelectedPiece.classList[0]];
    for (let offsetIndex in offsets) {
        addDotIndicator(
            lastSelectedPiece.getAttribute("x")*1+offsets[offsetIndex][0],
            lastSelectedPiece.getAttribute("y")*1+offsets[offsetIndex][1]
        )
    }
    for (let elmIndex in board.pieces) {
        if (board.pieces[elmIndex].style != undefined) {
            board.pieces[elmIndex].style.width = vh(10) + "px";
            board.pieces[elmIndex].style.height = vh(10) + "px";
        }
    }
}

function isHoveringOnSquare(clientX, clientY) {
    return vh(70)>clientX-board.rect.left&&clientX-board.rect.left>0&&vh(70)>clientY-board.rect.top&&clientY-board.rect.top>0
}

function hoverSquare(clientX, clientY) {
    return {x: clamp(floorest(clientX-board.rect.left, vh(10))/vh(10), 0, 6), y: clamp(floorest(clientY-board.rect.top-3, vh(10))/vh(10), 0, 6)};
}
function boardToArray() {
    let boardList = [];
    board.forEach((index, piece) => {
        boardList.push({type: piece.classList[0], x: piece.getAttribute("x"), y: piece.getAttribute("y"), enemy: piece.enemy});
    });
    return boardList;
}

setNotation();

// run stuff;
window.addEventListener("resize", setNotation);

document.addEventListener("mousedown", (event) => {
    lastSelectedPiece = undefined;
})

document.addEventListener("mousemove", (event) => {
    let {clientX, clientY} = event;
    if (!isHoveringOnSquare(clientX, clientY)) {
        hoverTip.style.display = "none";
    } else {
        hoverTip.style.display = "inline-block";
    }
    hoverTip.style.top = clamp(Math.round((clientY-board.rect.top%vh(10)-53)/vh(10))*vh(10)+(board.rect.top%vh(10))+3, board.rect.top+3, board.rect.bottom-103)+ "px";
    hoverTip.style.left = clamp(Math.round((clientX-board.rect.left%vh(10)-53)/vh(10))*vh(10)+(board.rect.left%vh(10))+3, board.rect.left+3, board.rect.right-103) + "px";
})
setInterval(updateLegalMoves, 100);
