const gameDiv = document.getElementById('game');
const menuDiv = document.getElementById('menu');
function setScreen(scr) {
    menuDiv.style.display = "none";
    gameDiv.style.display = "none";
    switch (scr) {
        case "menu":
            menuDiv.style.display = "flex";
            break;
        case "game":
            gameDIv.style.display = "block";
            break;
        default:
            break;
    }
}
function clamp(num, a, b) {
    if (num > b) {
        return b;
    }
    if (a > num) {
        return a;
    }
    return num;
}

function floorest(number, toFloorest) {
    return parseInt(number-number%toFloorest);
}
