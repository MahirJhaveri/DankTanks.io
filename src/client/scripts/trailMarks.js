// Trail mark system for tank tread marks on the ground

class TrailMark {
    constructor(x, y, direction, width, length, color) {
        this.x = x;
        this.y = y;
        this.direction = direction; // Tank direction when mark was created
        this.width = width;
        this.length = length;
        this.life = 0; // Will be set from constants
        this.maxLife = 0; // Will be set from constants
        this.color = color;
    }

    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }

    render(canvas, cameraX, cameraY) {
        const context = canvas.getContext('2d');
        const canvasX = canvas.width / 2 + this.x - cameraX;
        const canvasY = canvas.height / 2 + this.y - cameraY;

        // Calculate alpha based on remaining life (fade out)
        const alpha = this.life / this.maxLife;

        context.save();
        context.translate(canvasX, canvasY);
        context.rotate(this.direction);
        context.fillStyle = `rgba(${this.color}, ${alpha * 0.6})`; // Max 60% opacity
        context.fillRect(-this.length / 2, -this.width / 2, this.length, this.width);
        context.restore();
    }
}

const trailMarks = [];
const lastTreadPositions = new Map();

// Create trail marks for tank treads
export function createTrailMark(x, y, direction, constants) {
    const { TRAIL_MARK_LIFESPAN, TRAIL_MARK_WIDTH,
            TRAIL_MARK_LENGTH, TRAIL_MARK_COLOR, TRAIL_MARK_MAX_COUNT } = constants;

    // Enforce max count limit for performance
    if (trailMarks.length >= TRAIL_MARK_MAX_COUNT) {
        // Remove oldest marks
        trailMarks.shift();
    }

    const mark = new TrailMark(x, y, direction, TRAIL_MARK_WIDTH, TRAIL_MARK_LENGTH, TRAIL_MARK_COLOR);
    mark.life = TRAIL_MARK_LIFESPAN;
    mark.maxLife = TRAIL_MARK_LIFESPAN;
    trailMarks.push(mark);
}

// Helper function to check if a player is visible on screen
function isPlayerVisible(canvas, me, player) {
    const canvasX = canvas.width / 2 + player.x - me.x;
    const canvasY = canvas.height / 2 + player.y - me.y;

    // Add a margin to start rendering trail marks slightly before tank enters screen
    const margin = 200;
    return canvasX > -margin && canvasX < canvas.width + margin &&
           canvasY > -margin && canvasY < canvas.height + margin;
}

// Check player movement and emit trail marks if needed
export function checkAndEmitTrailMarks(canvas, me, player, constants) {
    const { TRAIL_MARK_SPAWN_DISTANCE, TRAIL_MARK_TREAD_OFFSET, PLAYER_RADIUS } = constants;

    // Only emit trail marks for visible tanks (performance optimization)
    if (!isPlayerVisible(canvas, me, player)) {
        return;
    }

    const playerId = player.id || 'me';

    // Get or initialize tread tracking for this player
    if (!lastTreadPositions.has(playerId)) {
        lastTreadPositions.set(playerId, {
            left: { x: player.x, y: player.y },
            right: { x: player.x, y: player.y }
        });
        return;
    }

    const lastTreads = lastTreadPositions.get(playerId);

    // Calculate left and right tread positions

    const baseX = player.x - Math.sin(player.direction) * PLAYER_RADIUS;
    const baseY = player.y + Math.cos(player.direction) * PLAYER_RADIUS;

    const leftTreadX = baseX + Math.cos(player.direction) * TRAIL_MARK_TREAD_OFFSET;
    const leftTreadY = baseY + Math.sin(player.direction) * TRAIL_MARK_TREAD_OFFSET;

    const rightTreadX = baseX - Math.cos(player.direction) * TRAIL_MARK_TREAD_OFFSET;
    const rightTreadY = baseY - Math.sin(player.direction) * TRAIL_MARK_TREAD_OFFSET;

    // Check left tread distance moved
    const leftDx = leftTreadX - lastTreads.left.x;
    const leftDy = leftTreadY - lastTreads.left.y;
    const leftDistMoved = Math.sqrt(leftDx * leftDx + leftDy * leftDy);

    if (leftDistMoved > TRAIL_MARK_SPAWN_DISTANCE) {
        createTrailMark(leftTreadX, leftTreadY, player.direction, constants);
        lastTreads.left = { x: leftTreadX, y: leftTreadY };
    }

    // Check right tread distance moved
    const rightDx = rightTreadX - lastTreads.right.x;
    const rightDy = rightTreadY - lastTreads.right.y;
    const rightDistMoved = Math.sqrt(rightDx * rightDx + rightDy * rightDy);

    if (rightDistMoved > TRAIL_MARK_SPAWN_DISTANCE) {
        createTrailMark(rightTreadX, rightTreadY, player.direction, constants);
        lastTreads.right = { x: rightTreadX, y: rightTreadY };
    }

    lastTreadPositions.set(playerId, lastTreads);
}

// Cleanup disconnected players from tread position tracking
export function cleanupTreadTracking(currentPlayers) {
    const currentPlayerIds = new Set(currentPlayers.map(p => p.id || 'me'));
    for (const playerId of lastTreadPositions.keys()) {
        if (!currentPlayerIds.has(playerId)) {
            lastTreadPositions.delete(playerId);
        }
    }
}

// Update all trail marks
export function updateTrailMarks(dt) {
    for (let i = trailMarks.length - 1; i >= 0; i--) {
        if (!trailMarks[i].update(dt)) {
            trailMarks.splice(i, 1);
        }
    }
}

// Render all trail marks
export function renderTrailMarks(canvas, cameraX, cameraY) {
    // Only render marks that are visible on screen for performance
    const margin = 100;
    trailMarks.forEach(mark => {
        const canvasX = canvas.width / 2 + mark.x - cameraX;
        const canvasY = canvas.height / 2 + mark.y - cameraY;

        if (canvasX > -margin && canvasX < canvas.width + margin &&
            canvasY > -margin && canvasY < canvas.height + margin) {
            mark.render(canvas, cameraX, cameraY);
        }
    });
}

// Clear all trail marks (for cleanup/reset)
export function clearTrailMarks() {
    trailMarks.length = 0;
    lastTreadPositions.clear();
}
