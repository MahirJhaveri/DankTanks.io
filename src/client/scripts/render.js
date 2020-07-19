import { getAsset, getTank, getTurret } from './assets';
import { getCurrentState } from './state';

const Constants = require('../../shared/constants');
const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE, SPRITES, EXPLOSION_RADIUS, CROWN_RADIUS } = Constants;

const canvas = document.getElementById('game-canvas');
const context = canvas.getContext('2d');

// Make the canvas fullscreen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// add setCanvasDimensions for supporting smaller screens

function render() {
    const { me, others, bullets, explosions, crowns } = getCurrentState();
    if (!me) {
        return;
    }

    // Draw background
    renderBackground(me.x, me.y);

    // Draw the grid
    context.strokeStyle = 'white';
    context.lineWidth = 0.1;
    let X = 0;
    while (X < MAP_SIZE) {
        let Y = 0;
        while (Y < MAP_SIZE) {
            context.strokeRect(canvas.width / 2 - me.x + X, canvas.height / 2 - me.y + Y, 100, 100);
            Y += 100;
        }
        X += 100;
    }

    /*// Draw boundaries
    context.save();
    context.strokeStyle = '#FF3300';
    context.lineWidth = 5;
    //context.shadowBlur = 4;
    //context.shadowColor = '#CC00FF';
    context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, MAP_SIZE, MAP_SIZE);
    context.restore();*/
    context.save();
    context.strokeStyle = 'black';
    context.lineWidth = 2;
    context.strokeRect(canvas.width / 2 - me.x, canvas.height / 2 - me.y, MAP_SIZE, MAP_SIZE);
    context.restore();

    // Draw all bullets
    bullets.forEach(renderBullet.bind(null, me));

    // Draw all players
    renderPlayer(me, me);
    others.forEach(renderPlayer.bind(null, me));

    explosions.forEach(renderExplosion.bind(null, me));

    crowns.forEach(renderCrowns.bind(null, me));
}

// ... Helper functions here excluded

function renderBullet(me, bullet) {
    const { x, y } = bullet;
    context.drawImage(
        getAsset('bullet.svg'),
        canvas.width / 2 + x - me.x - BULLET_RADIUS,
        canvas.height / 2 + y - me.y - BULLET_RADIUS,
        BULLET_RADIUS * 2,
        BULLET_RADIUS * 2,
    );
}

// renders a player at the given coordinates
// enemy: Boolean -> if the player is the user or an enemy
function renderPlayer(me, player) {
    const { x, y, direction, turretDirection, username, tankStyle } = player;
    const canvasX = canvas.width / 2 + x - me.x;
    const canvasY = canvas.height / 2 + y - me.y;

    // Draw tank
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(direction);

    // If self, then blue, else red
    context.drawImage(
        getTank(tankStyle),
        -PLAYER_RADIUS,
        -PLAYER_RADIUS,
        PLAYER_RADIUS * 2,
        PLAYER_RADIUS * 2,
    );
    context.restore();

    // Draw the turret
    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(turretDirection);

    context.drawImage(
        getTurret(tankStyle),
        -15,
        -40,
        30,
        60,
    );
    context.restore();

    // Draw health bar
    context.fillStyle = 'white';
    context.fillRect(
        canvasX - PLAYER_RADIUS,
        canvasY + PLAYER_RADIUS + 8,
        PLAYER_RADIUS * 2,
        4,
    );
    context.fillStyle = 'red';
    context.fillRect(
        canvasX - PLAYER_RADIUS + PLAYER_RADIUS * 2 * player.hp / PLAYER_MAX_HP,
        canvasY + PLAYER_RADIUS + 8,
        PLAYER_RADIUS * 2 * (1 - player.hp / PLAYER_MAX_HP),
        4,
    );


    // Draw player name
    context.fillStyle = 'white';
    context.font = "10px Comic Sans MS";
    context.textAlign = "center";
    // substring because username is being appended with NaN for some weird reason
    context.fillText(username.substring(0, username.length),
        canvasX - (username.length) / 2, canvasY + PLAYER_RADIUS + 25);
}

// render the background
// play around with this
function renderBackground(x, y) {
    const backgroundX = MAP_SIZE / 2 - x + canvas.width / 2;
    const backgroundY = MAP_SIZE / 2 - y + canvas.height / 2;
    const backgroundGradient = context.createRadialGradient(
        backgroundX,
        backgroundY,
        MAP_SIZE / 5,
        backgroundX,
        backgroundY,
        MAP_SIZE / 2,
    );
    backgroundGradient.addColorStop(0, 'black');
    backgroundGradient.addColorStop(1, 'gray');
    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function renderExplosion(me, explosion) {
    const { x, y, state } = explosion;
    context.drawImage(
        getAsset(state),
        canvas.width / 2 + x - me.x - EXPLOSION_RADIUS,
        canvas.height / 2 + y - me.y - EXPLOSION_RADIUS,
        EXPLOSION_RADIUS * 2,
        EXPLOSION_RADIUS * 2,
    );
}

function renderCrowns(me, crown) {
    const { x, y } = crown;
    context.drawImage(
        getAsset(SPRITES.CROWN),
        canvas.width / 2 + x - me.x - CROWN_RADIUS,
        canvas.height / 2 + y - me.y - CROWN_RADIUS,
        CROWN_RADIUS * 2,
        CROWN_RADIUS * 2,
    );
}

// Display the main menu
function renderMainMenu() {
    const t = Date.now() / 7500;
    const x = MAP_SIZE / 2 + 800 * Math.cos(t);
    const y = MAP_SIZE / 2 + 800 * Math.sin(t);
    renderBackground(x, y);
}

// set rendering rate of 60 FPS
// Basically redraw the whole thing every 1000/60 ms
let renderInterval = setInterval(renderMainMenu, 1000 / 60);
export function startRendering() {
    clearInterval(renderInterval);
    renderInterval = setInterval(() => {
        const start = Date.now();
        render();
        console.log(`Time to render = ${(Date.now() - start) / 1000}s`);
    }, 1000 / 60);
}
export function stopRendering() {
    clearInterval(renderInterval);
}