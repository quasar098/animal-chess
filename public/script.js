const hoverTip = document.getElementsByTagName('hover-tip')[0];
const notationDiv = document.getElementsByClassName("notation")[0];
const legalMovesDiv = document.getElementsByClassName("legal-moves")[0];
const animalChessTitle = document.getElementById('title');
const movesPara = document.getElementById('moves');
const numMoves = document.getElementById('num-moves');
const joinGame = document.getElementById('join-game');
const roomName = document.getElementById('room-name');
const warningPara = document.getElementById('warning');
setScreen("menu");

// MENU STUFF
var socket = io();
let createdGameNames = [];

// socket on
socket.emit("get-game-names-list");
socket.on("error", (errmsg) => {
    warningPara.innerText = errmsg;
});
socket.on("begin", (state) => {
    setScreen("game");
});
socket.on("refresh", () => {
    location.reload();
})
socket.on("game-names-list", (names) => {
    createdGameNames = names;
});

// menu event listeners
roomName.addEventListener("input", (e) => {
    if (createdGameNames.includes(roomName.value)) {
        joinGame.innerText = "Join";
    } else {
        joinGame.innerText = "Create"
    }
});
joinGame.addEventListener("click", (e) => {
    socket.emit("join-game", roomName.value);
    warningPara.innerText = joinGame.innerText == "Join" ? "joining game..." : "waiting for opponent to join...";
});

// GAME STUFF
let audioStart = new Audio("start.mp3");
let audioMoves = [new Audio("move.mp3"), new Audio("move.mp3"), new Audio("move.mp3"), new Audio("move.mp3")];
let audioTakes = [new Audio("take.mp3"), new Audio("take.mp3"), new Audio("take.mp3"), new Audio("take.mp3")];
let audioGameOver = new Audio("gameover.mp3");

let totalMoves = 0;
let whoseTurn = undefined;

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
                    let letEq = "ABCDEFG"
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
                                soundGameOver();
                                board.element.removeChild(overWritePiece);
                                lastSelectedPiece = undefined;
                                piece.setAttribute("x", x);
                                piece.setAttribute("y", y);
                                board.update();
                                animalChessTitle.innerText = overWritePiece.enemy ? "Blue wins" : "Red wins";
                                totalMoves += 1;
                                numMoves.innerText = "# Moves: " + totalMoves;
                                return;
                            }
                            // take
                            soundTake();
                            board.element.removeChild(overWritePiece);
                        } else {
                            // just a move
                            soundMove();
                        }
                        lastSelectedPiece = undefined;
                        updateLegalMoves();
                        // makes a move in general
                        totalMoves += 1;
                        numMoves.innerText = "# Moves: " + totalMoves;
                        whoseTurn = !whoseTurn;
                        movesPara.innerHTML = "<br>" + movesPara.innerHTML;
                        movesPara.innerText = totalMoves + ": " + (piece.enemy ? "red " : "blue ")
                        + piece.classList[0] + " [" + letEq[piece.getAttribute("x")*1]+(piece.getAttribute("y")*1+1)+" > "
                        + (letEq[x])+(y+1) + "] " + ((overWritePiece == undefined) ? "" : "<!>") + movesPara.innerText;
                        for (var i = 0; i < 310; i+=10) {
                            setTimeout(addNotation, i);
                        }
                        if (["goose"].includes(piece.classList[0]) && y == (6-!piece.enemy*6)) {
                            piece.classList.replace(piece.classList[0], "monkey");
                        }
                    }
                    piece.setAttribute("x", x);
                    piece.setAttribute("y", y);
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
        piece.style.transform = "translate(" + x*100 +  "px, " + y*100 + "px)";
        piece.enemy = enemy;
        if (piece.enemy) {
            piece.classList.add("enemy");
        }
        piece.addEventListener("mousedown", (event) => {
            if (piece.enemy == whoseTurn || whoseTurn == undefined) {
                piece.grabbed = true;
            }
            if (whoseTurn == undefined) {
                whoseTurn = piece.enemy;
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
            piece.style.transform = "translate(" + piece.getAttribute("x")*100 + "px, " + piece.getAttribute("y")*100 + "px)";
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
}

let board = new Board();

board.update();

function getTooltipAt(cx, cy) {
    for (var i = 0; i < legalMovesDiv.children.length; i++) {
        let x = legalMovesDiv.children[i].getAttribute("x");
        let y = legalMovesDiv.children[i].getAttribute("y");
        if (cx == x && cy == y) return legalMovesDiv.children[i];
    }
    return undefined;
}

function removeAllChildNodes(parent) {
    while (parent.firstChild) {
        parent.removeChild(parent.firstChild);
    }
}

function addNotation() {
    removeAllChildNodes(notationDiv);
    for (var i = 0; i < 7; i++) {
        let noteNumber = document.createElement("h4");
        noteNumber.innerText = i+1;
        noteNumber.style.left = board.rect.left-20 + "px";
        noteNumber.style.top = board.rect.top+20+i*100 + "px";
        notationDiv.appendChild(noteNumber);
    }
    for (var i = 0; i < 7; i++) {
        let noteNumber = document.createElement("h4");
        noteNumber.innerText = "abcdefg"[i];
        noteNumber.style.left = board.rect.left+50+i*100 + "px";
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
        dotImg.style.left = board.rect.left+x*100 + "px";
        dotImg.style.top = board.rect.top+y*100 + 'px';
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
}

function isHoveringOnSquare(clientX, clientY) {
    return 700>clientX-board.rect.left&&clientX-board.rect.left>0&&700>clientY-board.rect.top&&clientY-board.rect.top>0
}

function hoverSquare(clientX, clientY) {
    return {x: clamp(floorest(clientX-board.rect.left-3, 100)/100, 0, 6), y: clamp(floorest(clientY-board.rect.top-3, 100)/100, 0, 6)};
}
function boardToString() {
    // first convert the board into a good format;
    let boardList = []
    console.log(JSON.stringify(boardList));
}
function stringToBoard(str) {
    // TODO: DO THIS
}

addNotation();

// run stuff;
window.addEventListener("resize", addNotation);

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
    hoverTip.style.top = clamp(Math.round((clientY-board.rect.top%100-53)/100)*100+(board.rect.top%100)+3, board.rect.top+3, board.rect.bottom-103)+ "px";
    hoverTip.style.left = clamp(Math.round((clientX-board.rect.left%100-53)/100)*100+(board.rect.left%100)+3, board.rect.left+3, board.rect.right-103) + "px";
})
setInterval(updateLegalMoves, 100);
