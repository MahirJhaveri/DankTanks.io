import { getTank, getTurret } from './assets';

const Constants = require('../../shared/constants');
const { TANK, PLAYER_RADIUS, TANK_NAMES } = Constants;

var tankStyle = 0;
var styles = Object.values(TANK);

const chooseTankCanvas = document.getElementById("choose-tank-canvas");
const context = chooseTankCanvas.getContext('2d');
const tankNameDisplay = document.getElementById("tank-name-display");

const prevButton = document.getElementById("prev-tank-button");
const nextButton = document.getElementById("next-tank-button");

function updateChooseTankDisplay() {
    context.clearRect(0, 0, chooseTankCanvas.width, chooseTankCanvas.height);
    context.save()
    context.translate(125, 125);
    context.drawImage(
        getTank(styles[tankStyle]),
        -PLAYER_RADIUS * 2,
        -PLAYER_RADIUS * 2,
        PLAYER_RADIUS * 4,
        PLAYER_RADIUS * 4,
    );
    context.drawImage(
        getTurret(styles[tankStyle]),
        -25,
        -70,
        50,
        100,
    );
    context.restore();

    // Update tank name display
    tankNameDisplay.textContent = TANK_NAMES[styles[tankStyle]];
}

function handlePrevTankButton() {
    tankStyle = (tankStyle > 0) ? tankStyle - 1 : styles.length - 1;
    updateChooseTankDisplay();
}

function handleNextTankButton() {
    tankStyle = (tankStyle < styles.length - 1) ? tankStyle + 1 : 0;
    updateChooseTankDisplay();
}

export function initChooseTankController() {
    chooseTankCanvas.width = 250;
    chooseTankCanvas.height = 250;
    prevButton.onclick = handlePrevTankButton;
    nextButton.onclick = handleNextTankButton;
    updateChooseTankDisplay();
}

export function getTankStyle() {
    return styles[tankStyle];
}