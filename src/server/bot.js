const Tank = require('./tank');
const Constants = require('../shared/constants');
const isSeparable = require('./utils/sat');

/**
 * Static state for tracking used bot names
 */
const usedNames = new Set();

/**
 * Cache for SAT collision detection (avoids recomputing normals)
 */
const collisionCache = {};

/**
 * Bot - AI-controlled tank
 * Extends Tank with autonomous behavior
 */
class Bot extends Tank {
  constructor(id, x, y) {
    const username = Bot.selectRandomName();
    const tankStyle = Bot.selectRandomTankStyle();
    super(id, username, x, y, tankStyle);

    // AI state
    this.currentDirection = Math.random() * 2 * Math.PI; // Random initial direction
    this.directionChangeCounter = 0;
    this.lastX = x;
    this.lastY = y;
  }

  /**
   * Main AI update - called every frame
   * Controls movement and attack behavior
   */
  updateAI(allTanks, obstacles, mapSize) {
    // === MOVEMENT AI ===
    this.updateMovement(obstacles, mapSize);

    // === ATTACK AI ===
    this.updateAttack(allTanks);
  }

  /**
   * Movement AI - navigate around obstacles and boundaries
   */
  updateMovement(obstacles, mapSize) {
    const { DIRECTION_CHANGE_CHANCE, OBSTACLE_LOOKAHEAD, BOUNDARY_MARGIN } = Constants.BOT_CONFIG;

    // Increment counter for periodic direction changes
    this.directionChangeCounter++;

    // Random direction change (2% per frame = ~once per second at 60fps)
    if (Math.random() < DIRECTION_CHANGE_CHANCE) {
      this.currentDirection += Math.PI / 2 * (Math.random() < 0.5 ? -1 : 1); // Turn left or right 90 degrees
    }

    // Check for obstacles ahead
    const obstacleAhead = this.checkObstacleAhead(obstacles, OBSTACLE_LOOKAHEAD);
    if (obstacleAhead) {
      // Turn away from obstacle (add 90-180 degrees)
      this.currentDirection += Math.PI / 2 + (Math.random() < 0.5 ? 0 : 1) * Math.PI / 2;
    }

    // Check map boundaries
    const nearBoundary = this.checkMapBoundary(mapSize, BOUNDARY_MARGIN);
    if (nearBoundary) {
      // Turn toward center
      const centerX = mapSize / 2;
      const centerY = mapSize / 2;
      this.currentDirection = Math.atan2(centerY - this.y, centerX - this.x);
    }

    // Update tank direction based on current AI direction
    // Convert radians to direction key code (0, 0.5, 1, 1.5)
    const directionKeyCode = this.radiansToKeyCode(this.currentDirection);
    this.updateTankDirection(directionKeyCode);

    // Set turret to face movement direction
    this.setTurretDirection(this.currentDirection);
  }

  /**
   * Attack AI - find and shoot at nearest tank
   */
  updateAttack(allTanks) {
    const { ATTACK_RADIUS, AIM_INACCURACY } = Constants.BOT_CONFIG;

    // Find nearest living tank (exclude self)
    const target = this.findNearestTank(allTanks);

    if (!target) return;

    // Calculate distance
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // If within attack radius, aim and shoot
    if (distance <= ATTACK_RADIUS) {
      // Calculate angle to target
      let angleToTarget = Math.atan2(dy, dx) + Math.PI / 2;

      // Add inaccuracy for human-like aim
      const inaccuracy = (Math.random() - 0.5) * 2 * AIM_INACCURACY;
      angleToTarget += inaccuracy;

      // Aim at target
      this.setTurretDirection(angleToTarget);
    }
  }

  /**
   * Bot update - combines Tank update with AI updates
   */
  update(dt) {
    // Store old position
    this.lastX = this.x;
    this.lastY = this.y;

    // Update tank physics
    const { oldX, oldY } = super.update(dt);

    // Bot always tries to fire (respects cooldown in Tank.fire())
    return this.fire(oldX, oldY);
  }

  /**
   * Find nearest living tank
   */
  findNearestTank(allTanks) {
    let nearest = null;
    let minDistance = Infinity;

    Object.values(allTanks).forEach(tank => {
      // Skip self and dead tanks
      if (tank.id === this.id || tank.isDead()) return;

      const dx = tank.x - this.x;
      const dy = tank.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < minDistance) {
        minDistance = distance;
        nearest = tank;
      }
    });

    return nearest;
  }

  /**
   * Check if there's an obstacle ahead
   */
  checkObstacleAhead(obstacles, lookAheadDistance) {
    // Project position forward
    const futureX = this.x + Math.cos(this.currentDirection) * lookAheadDistance;
    const futureY = this.y + Math.sin(this.currentDirection) * lookAheadDistance;

    // Check if future position collides with any obstacle
    // isSeparable returns true if NOT colliding, false if colliding
    for (const obstacle of obstacles) {
      const notColliding = isSeparable(
        obstacle.id,
        obstacle.vertices,
        [futureX, futureY],
        this.radius,
        collisionCache
      );

      if (!notColliding) return true; // Found a collision
    }

    return false;
  }

  /**
   * Check if near map boundary
   */
  checkMapBoundary(mapSize, margin) {
    // Check if near any edge
    return (
      this.x < margin ||
      this.x > mapSize - margin ||
      this.y < margin ||
      this.y > mapSize - margin
    );
  }

  /**
   * Convert radians to direction key code (0, 0.5, 1, 1.5)
   * Used for the discrete direction system
   */
  radiansToKeyCode(radians) {
    // Normalize to 0-2π
    const normalized = ((radians % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

    // Convert to key code (UP=0, RIGHT=0.5, DOWN=1, LEFT=1.5)
    // UP: -π/4 to π/4
    // RIGHT: π/4 to 3π/4
    // DOWN: 3π/4 to 5π/4
    // LEFT: 5π/4 to 7π/4

    if (normalized >= 7 * Math.PI / 4 || normalized < Math.PI / 4) {
      return Constants.KEY.UP; // 0
    } else if (normalized >= Math.PI / 4 && normalized < 3 * Math.PI / 4) {
      return Constants.KEY.RIGHT; // 0.5
    } else if (normalized >= 3 * Math.PI / 4 && normalized < 5 * Math.PI / 4) {
      return Constants.KEY.DOWN; // 1
    } else {
      return Constants.KEY.LEFT; // 1.5
    }
  }

  // ===== STATIC METHODS FOR NAME MANAGEMENT =====

  /**
   * Select a random unused name from the bot names list
   */
  static selectRandomName() {
    const { NAMES } = Constants.BOT_CONFIG;
    const availableNames = NAMES.filter(name => !usedNames.has(name));

    // If all names used, clear set (allows reuse)
    if (availableNames.length === 0) {
      usedNames.clear();
      return NAMES[Math.floor(Math.random() * NAMES.length)];
    }

    const name = availableNames[Math.floor(Math.random() * availableNames.length)];
    usedNames.add(name);
    return name;
  }

  /**
   * Select a random tank style
   */
  static selectRandomTankStyle() {
    const styles = [
      Constants.TANK.BLUE,
      Constants.TANK.RED,
      Constants.TANK.GREEN,
      Constants.TANK.GRAY,
      Constants.TANK.USA
    ];
    return styles[Math.floor(Math.random() * styles.length)];
  }

  /**
   * Release a username when bot dies (allows reuse)
   */
  static releaseUsername(username) {
    usedNames.delete(username);
  }
}

module.exports = Bot;
