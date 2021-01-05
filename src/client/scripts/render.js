import { getAsset, getTank, getTurret } from './assets';
import { getCurrentState } from './state';

const Constants = require('../../shared/constants');
const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE, SPRITES, 
    EXPLOSION_RADIUS, CROWN_RADIUS, OBSTACLES } = Constants;

const canvas = document.getElementById('game-canvas');
const canvas2 = document.getElementById('game-canvas-2');

// Make both the canvases fullscreen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas2.width = window.innerWidth;
canvas2.height = window.innerHeight;

// set canvas2 to be hidden
canvas2.classList.add('hidden')

// add setCanvasDimensions for supporting smaller screens

function render(canvas) {
    const context = canvas.getContext('2d');
    const { me, others, bullets, explosions, crowns } = getCurrentState();
    if (!me) {
        return;
    }

    // Draw background
    renderBackground(canvas, me.x, me.y);

    /* Draw obstacles */
    renderObstacles(canvas, me);

    /* Draw the grid */
    renderGrid(context, me);

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
    bullets.forEach(renderBullet.bind(null, canvas, me));

    // Draw all players
    renderPlayer(canvas, me, me);
    others.forEach(renderPlayer.bind(null, canvas, me));

    explosions.forEach(renderExplosion.bind(null, canvas, me));

    crowns.forEach(renderCrowns.bind(null, canvas, me));
}

// ... Helper functions here excluded

function renderBullet(canvas, me, bullet) {
    const context = canvas.getContext('2d');
    const { x, y, drawAngle } = bullet;
    const canvasX = canvas.width / 2 + x - me.x;
    const canvasY = canvas.height / 2 + y - me.y;

    context.save();
    context.translate(canvasX, canvasY);
    context.rotate(drawAngle);
    context.drawImage(
        getAsset(SPRITES.LASERBEAM),
        -BULLET_RADIUS * 4,
        -BULLET_RADIUS * 4,
        BULLET_RADIUS * 8,
        BULLET_RADIUS * 8,
    );
    context.restore();
}

// renders a player at the given coordinates
// enemy: Boolean -> if the player is the user or an enemy
function renderPlayer(canvas, me, player) {
    const context = canvas.getContext('2d');
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
    context.fillText(username.substring(0, username.length),
        canvasX - (username.length) / 2, canvasY + PLAYER_RADIUS + 25);
}

// render the background
// play around with this
function renderBackground(canvas, x, y) {
    const context = canvas.getContext('2d');
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

function renderGrid(context, me) {
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
}

/* Renders a polygon with given vertices */
function renderPolygon(context, me, vertices) {
    context.beginPath();
    const offsetX = canvas.width / 2 - me.x;
    const offsetY = canvas.height / 2 - me.y;
    context.moveTo(offsetX + vertices[0][0], offsetY + vertices[0][1]);
    var i = 1;
    while (i < vertices.length) {
        context.lineTo(offsetX + vertices[i][0], offsetY + vertices[i][1]);
        i++;
    }
    context.stroke();
    context.fill();
}

/* Renders all the obstacles as required */
function renderObstacles(canvas, me) {
    const context = canvas.getContext('2d');
    context.save();
    context.fillStyle = "#B24BCB";
    //context.strokeStyle = "#652DC1";
    context.shadowBlur = 35;
    context.shadowColor = "#652DC1";
    //context.lineWidth = 15;
    OBSTACLES.forEach(renderPolygon.bind(null, context, me));
    context.restore();
}

function renderExplosion(canvas, me, explosion) {
    const context = canvas.getContext('2d');
    const { x, y, state } = explosion;
    context.drawImage(
        getAsset(state),
        canvas.width / 2 + x - me.x - EXPLOSION_RADIUS,
        canvas.height / 2 + y - me.y - EXPLOSION_RADIUS,
        EXPLOSION_RADIUS * 2,
        EXPLOSION_RADIUS * 2,
    );
}

function renderCrowns(canvas, me, crown) {
    const context = canvas.getContext('2d');
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
function renderMainMenu(canvas) {
    const t = Date.now() / 7500;
    const x = MAP_SIZE / 2 + 800 * Math.cos(t);
    const y = MAP_SIZE / 2 + 800 * Math.sin(t);
    renderBackground(canvas, x, y);
}

let renderInterval = setInterval(renderMainMenu.bind(null, canvas), 1000 / 60);

// set rendering rate of 60 FPS
// Basically redraw the whole thing every 1000/60 ms
export function startRendering() {
    clearInterval(renderInterval);
    renderInterval = setInterval(render.bind(null, canvas), 1000 / 60);
}

// Use double buffering while rendering
var currCanvas = canvas2;
export function startRenderingWithDoubleBuffering() {
    clearInterval(renderInterval);
    renderInterval = setInterval(() => {
      if (currCanvas == canvas) {
        render(canvas);
        canvas.classList.remove('hidden');
        canvas2.classList.add('hidden');
        currCanvas = canvas2;
      } else {
        render(canvas2);
        canvas2.classList.remove('hidden');
        canvas.classList.add('hidden');
        currCanvas = canvas;
      }
    }, 1000 / 60);
}

export function stopRendering() {
    clearInterval(renderInterval);
}