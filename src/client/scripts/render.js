import { getAsset, getTank, getTurret } from './assets';
import { getCurrentState } from './state';
import { updateParticles, renderParticles, createTankSmoke } from './particles';

const Constants = require('../../shared/constants');
const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE, SPRITES,
    EXPLOSION_RADIUS, CROWN_RADIUS, HEALTH_PACK_RADIUS, OBSTACLES,
    SMOKE_SPAWN_DISTANCE } = Constants;

const canvas = document.getElementById('game-canvas');
const canvas2 = document.getElementById('game-canvas-2');

// Make both the canvases fullscreen
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
canvas2.width = window.innerWidth;
canvas2.height = window.innerHeight;

// set canvas2 to be hidden
canvas2.classList.add('hidden')

// Position tracking for smoke effect
const lastPlayerPositions = new Map();

// add setCanvasDimensions for supporting smaller screens

function render(canvas) {
    const context = canvas.getContext('2d');
    const { me, others, bullets, explosions, crowns, healthPacks } = getCurrentState();
    if (!me) {
        return;
    }

    // Update particles
    updateParticles(1 / 60); // dt for 60 FPS

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

    // Check and emit smoke for all moving players
    checkAndEmitSmoke(canvas, me, me);
    others.forEach(other => checkAndEmitSmoke(canvas, me, other));

    // Cleanup position tracking for disconnected players
    cleanupPositionTracking([me, ...others]);

    // Draw all players
    renderPlayer(canvas, me, me);
    others.forEach(renderPlayer.bind(null, canvas, me));

    explosions.forEach(renderExplosion.bind(null, canvas, me));

    crowns.forEach(renderCrowns.bind(null, canvas, me));

    if (healthPacks) {
        healthPacks.forEach(renderHealthPack.bind(null, canvas, me));
    }

    // Render particles (after all game objects)
    renderParticles(canvas, me.x, me.y);
}

// Helper function to check if a player is visible on screen
function isPlayerVisible(canvas, me, player) {
    const canvasX = canvas.width / 2 + player.x - me.x;
    const canvasY = canvas.height / 2 + player.y - me.y;

    // Add a margin to start rendering smoke slightly before tank enters screen
    const margin = 200;
    return canvasX > -margin && canvasX < canvas.width + margin &&
           canvasY > -margin && canvasY < canvas.height + margin;
}

// Check player movement and emit smoke if needed
function checkAndEmitSmoke(canvas, me, player) {
    // Only emit smoke for visible tanks (performance optimization)
    if (!isPlayerVisible(canvas, me, player)) {
        return;
    }

    const playerId = player.id || 'me';
    const lastPos = lastPlayerPositions.get(playerId);

    if (!lastPos) {
        // First time seeing this player, just store position
        lastPlayerPositions.set(playerId, { x: player.x, y: player.y });
        return;
    }

    // Calculate distance moved
    const dx = player.x - lastPos.x;
    const dy = player.y - lastPos.y;
    const distMoved = Math.sqrt(dx * dx + dy * dy);

    // Emit smoke if moved enough
    if (distMoved > SMOKE_SPAWN_DISTANCE) {
        // Calculate smoke emission point at the back of the tank
        const smokeX = player.x - Math.sin(player.direction) * PLAYER_RADIUS;
        const smokeY = player.y + Math.cos(player.direction) * PLAYER_RADIUS;

        createTankSmoke(smokeX, smokeY, player.direction, player.hp, Constants);
        lastPlayerPositions.set(playerId, { x: player.x, y: player.y });
    }
}

// Cleanup disconnected players from position tracking
function cleanupPositionTracking(currentPlayers) {
    const currentPlayerIds = new Set(currentPlayers.map(p => p.id || 'me'));
    for (const playerId of lastPlayerPositions.keys()) {
        if (!currentPlayerIds.has(playerId)) {
            lastPlayerPositions.delete(playerId);
        }
    }
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

    // Pulsing animation (15% variation, slightly faster than health pack)
    const pulseScale = 1 + 0.15 * Math.sin(Date.now() / 180);
    const size = CROWN_RADIUS * 2 * pulseScale;

    context.drawImage(
        getAsset(SPRITES.CROWN),
        canvas.width / 2 + x - me.x - size / 2,
        canvas.height / 2 + y - me.y - size / 2,
        size,
        size,
    );
}

function renderHealthPack(canvas, me, healthPack) {
    const context = canvas.getContext('2d');
    const { x, y } = healthPack;
    const canvasX = canvas.width / 2 + x - me.x;
    const canvasY = canvas.height / 2 + y - me.y;

    // Pulse animation
    const pulseScale = 1 + 0.1 * Math.sin(Date.now() / 200);
    const size = HEALTH_PACK_RADIUS * 2 * pulseScale;

    context.save();
    context.translate(canvasX, canvasY);
    context.scale(pulseScale, pulseScale);

    const sprite = getAsset(SPRITES.HEALTH_PACK);
    context.drawImage(
        sprite,
        -size / 2 / pulseScale,
        -size / 2 / pulseScale,
        size / pulseScale,
        size / pulseScale
    );

    context.restore();
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