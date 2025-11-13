import { getAsset, getTank, getTurret } from './assets';
import { getCurrentState } from './state';
import { updateParticles, renderParticles, createTankSmoke } from './particles';

const Constants = require('../../shared/constants');
const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE, SPRITES,
    EXPLOSION_RADIUS, CROWN_RADIUS, HEALTH_PACK_RADIUS, OBSTACLES,
    SMOKE_SPAWN_DISTANCE, POWERUP_CONFIGS } = Constants;

const Theme = require('../../shared/theme');
const { getCurrentTheme } = Theme;

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
    const { me, others, bullets, explosions, crowns, powerups } = getCurrentState();
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

    // Draw boundaries
    const theme = getCurrentTheme();
    context.save();
    context.strokeStyle = theme.boundary.color;
    context.lineWidth = theme.boundary.lineWidth;
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

    if (powerups) {
        powerups.forEach(renderPowerup.bind(null, canvas, me));
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

    // Draw shield effect if player has active shield
    const shieldEffect = Array.isArray(player.activeEffects)
        ? player.activeEffects.find(e => e.type === 'shield')
        : null;
    if (shieldEffect) {
        const currentTime = Date.now();
        const remainingTime = shieldEffect.duration -
            (currentTime - shieldEffect.activatedAt) / 1000;

        // Pulse faster when shield is expiring
        const pulseFreq = remainingTime < 3 ? 100 : 200;
        const glowAlpha = 0.4 + 0.2 * Math.sin(currentTime / pulseFreq);

        // Outer glow ring
        context.save();
        context.globalAlpha = glowAlpha;
        context.strokeStyle = '#00D9FF'; // Cyan
        context.lineWidth = 4;
        context.shadowColor = '#00D9FF';
        context.shadowBlur = 15;

        context.beginPath();
        context.arc(canvasX, canvasY, PLAYER_RADIUS + 8, 0, Math.PI * 2);
        context.stroke();
        context.restore();

        // Rotating dashed ring
        const rotation = (currentTime / 1000) % (Math.PI * 2);
        context.save();
        context.translate(canvasX, canvasY);
        context.rotate(rotation);
        context.globalAlpha = 0.5;
        context.strokeStyle = '#00D9FF';
        context.lineWidth = 2;
        context.setLineDash([10, 5]);
        context.beginPath();
        context.arc(0, 0, PLAYER_RADIUS + 5, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }

    // Draw speed effect if player has active speed boost
    const speedEffect = Array.isArray(player.activeEffects)
        ? player.activeEffects.find(e => e.type === 'speed')
        : null;
    if (speedEffect) {
        const currentTime = Date.now();
        const remainingTime = speedEffect.duration -
            (currentTime - speedEffect.activatedAt) / 1000;

        // Pulse faster when speed is expiring
        const pulseFreq = remainingTime < 3 ? 80 : 150;
        const glowAlpha = 0.3 + 0.2 * Math.sin(currentTime / pulseFreq);

        // Orange/yellow speed aura
        context.save();
        const gradient = context.createRadialGradient(
            canvasX, canvasY, PLAYER_RADIUS,
            canvasX, canvasY, PLAYER_RADIUS + 15
        );
        gradient.addColorStop(0, `rgba(255, 165, 0, ${glowAlpha})`);
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0)');

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(canvasX, canvasY, PLAYER_RADIUS + 15, 0, Math.PI * 2);
        context.fill();
        context.restore();

        // Speed trail lines (animated)
        context.save();
        context.strokeStyle = `rgba(255, 200, 0, ${glowAlpha})`;
        context.lineWidth = 2;
        const trailOffset = (currentTime / 50) % 20;
        for (let i = 0; i < 3; i++) {
            const offset = PLAYER_RADIUS + 10 + (i * 5) - trailOffset;
            context.beginPath();
            context.arc(canvasX, canvasY, offset, 0, Math.PI * 2);
            context.setLineDash([8, 12]);
            context.stroke();
        }
        context.restore();
    }

    // Draw crown effect if player has crown powerup
    if (player.crownPowerup) {
        const currentTime = Date.now();
        const pulseFreq = 200;
        const glowAlpha = 0.4 + 0.2 * Math.sin(currentTime / pulseFreq);

        // Outer golden glow ring
        context.save();
        context.globalAlpha = glowAlpha;
        context.strokeStyle = '#FFD700'; // Gold
        context.lineWidth = 4;
        context.shadowColor = '#FFD700';
        context.shadowBlur = 15;

        context.beginPath();
        context.arc(canvasX, canvasY, PLAYER_RADIUS + 14, 0, Math.PI * 2);
        context.stroke();
        context.restore();

        // Rotating dashed ring
        const rotation = (currentTime / 1000) % (Math.PI * 2);
        context.save();
        context.translate(canvasX, canvasY);
        context.rotate(rotation);
        context.globalAlpha = 0.5;
        context.strokeStyle = '#FFD700';
        context.lineWidth = 2;
        context.setLineDash([10, 5]);
        context.beginPath();
        context.arc(0, 0, PLAYER_RADIUS + 12, 0, Math.PI * 2);
        context.stroke();
        context.restore();
    }

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
    const theme = getCurrentTheme();
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
    backgroundGradient.addColorStop(0, theme.background.colors[0]);
    backgroundGradient.addColorStop(1, theme.background.colors[1]);
    context.fillStyle = backgroundGradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
}

function renderGrid(context, me) {
    const theme = getCurrentTheme();
    if (!theme.grid.enabled) {
        return;
    }
    context.strokeStyle = theme.grid.color;
    context.lineWidth = theme.grid.lineWidth;
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
    const theme = getCurrentTheme();
    context.save();
    context.fillStyle = theme.obstacles.fillColor;
    context.shadowBlur = theme.obstacles.shadowBlur;
    context.shadowColor = theme.obstacles.shadowColor;
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

function renderPowerup(canvas, me, powerup) {
    const config = POWERUP_CONFIGS[powerup.type];
    const context = canvas.getContext('2d');
    const { x, y } = powerup;
    const canvasX = canvas.width / 2 + x - me.x;
    const canvasY = canvas.height / 2 + y - me.y;

    // Type-specific pulse animation
    let pulseFreq, pulseAmount;
    if (powerup.type === 'shield') {
        pulseFreq = 250;
        pulseAmount = 0.15;
    } else if (powerup.type === 'speed') {
        pulseFreq = 150; // Faster pulse for speed theme
        pulseAmount = 0.2;
    } else {
        pulseFreq = 200;
        pulseAmount = 0.1;
    }
    const pulseScale = 1 + pulseAmount * Math.sin(Date.now() / pulseFreq);
    const size = config.radius * 2 * pulseScale;

    context.save();
    context.translate(canvasX, canvasY);
    context.scale(pulseScale, pulseScale);

    const sprite = getAsset(POWERUP_CONFIGS[powerup.type].sprite);
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