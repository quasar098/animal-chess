const hoverTip = document.getElementsByTagName('hover-tip')[0];

class Board {
    constructor(defendingPlayer=false) {
        this.defending = defendingPlayer;
        this.element = document.getElementById('board');
        document.addEventListener("mousemove", this.moveGrabbed);
        this.addPiece("knight", 1, 2)
    }
    get pieces() {
        return this.element.children;
    }
    addPiece(name, x, y) {
        let piece = document.createElement("chess-piece");
        piece.classList.add(name);
        piece.setAttribute("x", x);
        piece.setAttribute("y", y);
        piece.style.transform = "translate(" + x*100 +  "px, " + y*100 + "px)";
        piece.addEventListener("mousedown", (event) => {
            piece.grabbed = true;
        });
        piece.addEventListener("mouseup", (event) => {
            piece.grabbed = false;
            piece.style.top = "";
            piece.style.left = "";
            if (isHoveringOnSquare(event.clientX, event.clientY)) {
                let {x, y} = hoverSquare(event.clientX, event.clientY);
                piece.setAttribute("x", x);
                piece.setAttribute("y", y);
            }
            board.update();
        })
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
}

let board = new Board();

board.update();

function clamp(num, a, b) {
    if (num > b) {
        return b;
    }
    if (a > num) {
        return a;
    }
    return num;
}

function fakeEvent(element, event) {
    let clickEvent = new MouseEvent(event.type, {button: event.button, clientX: event.clientX, clientY: event.clientY})
    element.dispatchEvent(clickEvent);
}

function floorest(number, toFloorest) {
    return parseInt(number-number%toFloorest);
}

function isHoveringOnSquare(clientX, clientY) {
    return 700>clientX-board.rect.left&&clientX-board.rect.left>0&&700>clientY-board.rect.top&&clientY-board.rect.top>0
}

function hoverSquare(clientX, clientY) {
    return {x: clamp(floorest(clientX-board.rect.left-3, 100)/100, 0, 6), y: clamp(floorest(clientY-board.rect.top-3, 100)/100, 0, 6)};
}

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
hoverTip.addEventListener("mousedown", (event) => {
    let {x, y} = hoverSquare(event.clientX, event.clientY);
    let piece = board.getPieceAtPos(x, y);
    if (piece != undefined) {
        fakeEvent(piece, event);
    }
})
document.addEventListener("mouseup", (event) => {
    let {x, y} = hoverSquare(event.clientX, event.clientY);
    let piece = board.getGrabbedPiece(x, y);
    if (piece != undefined) {
        fakeEvent(piece, event);
    }
})
