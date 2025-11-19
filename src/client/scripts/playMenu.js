import { getTank, getTurret } from './assets';
import { playSound, SOUNDS } from './audio';

const Constants = require('../../shared/constants');
const { TANK, PLAYER_RADIUS, TANK_NAMES } = Constants;

const Theme = require('../../shared/theme');
const { setTheme } = Theme;

var tankStyle = 0;
var styles = Object.values(TANK);

// Theme selection state
var themeIndex = 0;
const availableThemes = [
    { id: 'desert', name: 'Desert Warfare', description: 'Sandy battlefield with rocky terrain' },
    { id: 'neon', name: 'Neon Cyberpunk', description: 'Futuristic grid world with glowing elements' }
];

const chooseTankCanvas = document.getElementById("choose-tank-canvas");
const context = chooseTankCanvas.getContext('2d');
const tankNameDisplay = document.getElementById("tank-name-display");

const prevButton = document.getElementById("prev-tank-button");
const nextButton = document.getElementById("next-tank-button");

const themeNameDisplay = document.getElementById("theme-name-display");
const themeDescriptionDisplay = document.getElementById("theme-description-display");
const prevThemeButton = document.getElementById("prev-theme-button");
const nextThemeButton = document.getElementById("next-theme-button");

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
    playSound(SOUNDS.BUTTON_CLICK, 0.15);
    tankStyle = (tankStyle > 0) ? tankStyle - 1 : styles.length - 1;
    updateChooseTankDisplay();
}

function handleNextTankButton() {
    playSound(SOUNDS.BUTTON_CLICK, 0.15);
    tankStyle = (tankStyle < styles.length - 1) ? tankStyle + 1 : 0;
    updateChooseTankDisplay();
}

function updateThemeDisplay() {
    const currentTheme = availableThemes[themeIndex];
    themeNameDisplay.textContent = currentTheme.name;
    themeDescriptionDisplay.textContent = currentTheme.description;

    // Update the menu background preview in real-time
    setTheme(currentTheme.id);
}

function handlePrevThemeButton() {
    playSound(SOUNDS.BUTTON_CLICK, 0.15);
    themeIndex = (themeIndex > 0) ? themeIndex - 1 : availableThemes.length - 1;
    updateThemeDisplay();
}

function handleNextThemeButton() {
    playSound(SOUNDS.BUTTON_CLICK, 0.15);
    themeIndex = (themeIndex < availableThemes.length - 1) ? themeIndex + 1 : 0;
    updateThemeDisplay();
}

export function initChooseTankController() {
    chooseTankCanvas.width = 250;
    chooseTankCanvas.height = 250;
    prevButton.onclick = handlePrevTankButton;
    nextButton.onclick = handleNextTankButton;
    updateChooseTankDisplay();

    // Initialize theme selection
    prevThemeButton.onclick = handlePrevThemeButton;
    nextThemeButton.onclick = handleNextThemeButton;
    updateThemeDisplay();
}

export function getTankStyle() {
    return styles[tankStyle];
}

export function getThemeChoice() {
    return availableThemes[themeIndex].id;
}