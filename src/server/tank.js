const DynamicEntity = require('./dynamicEntity');
const Bullet = require('./bullet');
const Constants = require('../shared/constants');
const Crown = require('./crown');
const TimedEffect = require('./timedEffect');

/**
 * Tank - Base class for all tank entities (players and bots)
 * Contains shared logic for movement, combat, health, and powerups
 */
class Tank extends DynamicEntity {
  constructor(id, username, x, y, tankStyle) {
    super(id, x, y, Math.PI / 2, Constants.PLAYER_SPEED);

    // Identity
    this.username = username;
    this.tankStyle = tankStyle; // 'Blue', 'Red', 'Green', 'Gray', 'USA' (as numbers)

    // Combat stats
    this.hp = Constants.PLAYER_MAX_HP;
    this.fireCooldown = 0;
    this.score = 0;
    this.kills = 0;

    // Physics
    this.radius = Constants.PLAYER_RADIUS;
    this.speed = Constants.PLAYER_SPEED;

    // Turret/aiming
    this.turretDirection = Math.random() * 2 * Math.PI; // Turret direction (independent from tank body)

    // Firing configuration
    this.crownPowerup = null; // Powerups from crowns, at most one at a time
    this.fireCooldownSpeed = Constants.PLAYER_FIRE_COOLDOWN;
    this.bulletSpeed = Constants.BULLET_SPEED;
    this.lastHitByPlayer = null; // To restore player health on kill

    // Active effects (shield, speed boost, etc.)
    this.activeEffects = []; // Array of active timed effects
  }

  /**
   * Update tank state (movement, cooldowns, effects)
   */
  update(dt) {
    const oldX = this.x;
    const oldY = this.y;

    // Apply speed multiplier if speed boost is active
    const originalSpeed = this.speed;
    if (this.hasActiveEffect('speed')) {
      const speedConfig = Constants.POWERUP_CONFIGS.speed;
      this.speed *= speedConfig.speedMultiplier;
    }

    super.update(dt);

    // Restore original speed
    this.speed = originalSpeed;

    this.score += Constants.SCORE_PER_SECOND;

    // Make sure the tank stays in bounds
    this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
    this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));

    // Decrement fire cooldown
    if (this.fireCooldown > -0.015) {
      this.fireCooldown -= dt;
    }

    return { oldX, oldY }; // Return old position for bullet velocity calculation
  }

  /**
   * Compute bullet direction and speed based on tank movement
   */
  computeDirAndSpeed(dir1, speed1, tankSpeedX, tankSpeedY) {
    const x1 = speed1 * Math.sin(dir1);
    const y1 = speed1 * Math.cos(dir1);
    const newSpeed = Math.sqrt((x1 + tankSpeedX) * (x1 + tankSpeedX) + (y1 + tankSpeedY) * (y1 + tankSpeedY));
    var newDir = Math.acos((y1 + tankSpeedY) / newSpeed);
    if ((x1 + tankSpeedX) < 0) {
      newDir = 2 * Math.PI - newDir;
    }
    return [newDir, newSpeed];
  }

  /**
   * Attempt to fire bullets (respects cooldown)
   * Returns bullet(s) or null
   */
  fire(oldX, oldY, fireToogle = false, successiveToogle = true) {
    if (this.fireCooldown > 0) {
      return null;
    }

    if (fireToogle && !successiveToogle) {
      return null;
    }

    this.fireCooldown += this.fireCooldownSpeed;

    const tankSpeedX = (this.x - oldX !== 0) ? this.speed * Math.sin(this.direction) : 0;
    const tankSpeedY = (this.y - oldY !== 0) ? this.speed * Math.cos(this.direction) : 0;
    var [newTurretDirection, newBulletSpeed] = this.computeDirAndSpeed(
      this.turretDirection,
      Constants.BULLET_SPEED,
      tankSpeedX,
      tankSpeedY
    );

    // Crown powerup: Fire two bullets at once with spread
    if (this.crownPowerup) {
      const spread = Constants.CROWN_DOUBLE_SHOT_SPREAD / 2;

      // Left bullet (slightly counter-clockwise)
      const bullet1 = new Bullet(
        this.id,
        this.x,
        this.y,
        newTurretDirection - spread,
        newBulletSpeed,
        this.turretDirection - spread
      );

      // Right bullet (slightly clockwise)
      const bullet2 = new Bullet(
        this.id,
        this.x,
        this.y,
        newTurretDirection + spread,
        newBulletSpeed,
        this.turretDirection + spread
      );

      return [bullet1, bullet2];
    }

    // Normal: Fire one bullet
    return new Bullet(
      this.id,
      this.x,
      this.y,
      newTurretDirection,
      newBulletSpeed,
      this.turretDirection
    );
  }

  /**
   * Take damage from a bullet
   */
  takeBulletDamage(bullet) {
    // Shield absorbs all damage
    if (this.hasActiveEffect('shield')) {
      return; // No damage taken
    }

    // Normal damage
    this.hp -= Constants.BULLET_DAMAGE;
    this.lastHitByPlayer = bullet.parentID;
  }

  /**
   * Called when this tank deals damage to another tank
   */
  onDealtDamage() {
    this.score += Constants.SCORE_BULLET_HIT;
  }

  /**
   * Check if tank is dead
   */
  isDead() {
    return this.hp <= 0;
  }

  /**
   * Kill the tank instantly
   */
  kill() {
    this.hp = 0;
  }

  /**
   * Set turret direction (where tank is aiming)
   */
  setTurretDirection(dir) {
    this.turretDirection = dir;
  }

  /**
   * Update tank body direction
   */
  updateTankDirection(directionKeyCode) {
    this.direction = directionKeyCode * Math.PI;
  }

  /**
   * Add crown powerup (rapid fire)
   */
  addCrownPowerup(crown) {
    this.crownPowerup = crown.id;
    this.fireCooldownSpeed = Constants.RAPID_FIRE_COOLDOWN;
    this.bulletSpeed = Constants.RAPID_FIRE_BULLET_SPEED;
  }

  /**
   * Drop crown powerup on death
   */
  dropCrownPowerup() {
    if (this.crownPowerup) {
      return new Crown(this.crownPowerup, this.x, this.y);
    }
    return null;
  }

  /**
   * Heal the tank
   */
  heal(amount) {
    const previousHp = this.hp;
    this.hp = Math.min(this.hp + amount, Constants.PLAYER_MAX_HP);
    const actualHealed = this.hp - previousHp;
    return actualHealed; // Return actual amount healed for feedback
  }

  /**
   * Check if tank can collect health pack
   */
  canCollectHealthPack() {
    return this.hp < Constants.PLAYER_MAX_HP;
  }

  /**
   * Add a timed effect (shield, speed boost, etc.)
   */
  addTimedEffect(type, duration) {
    const effect = new TimedEffect(type, duration, Date.now());
    this.activeEffects.push(effect);
    return effect;
  }

  /**
   * Update timed effects (remove expired ones)
   */
  updateTimedEffects(currentTime) {
    // Remove expired effects
    this.activeEffects = this.activeEffects.filter(
      effect => effect.isActive(currentTime)
    );
  }

  /**
   * Check if tank has an active effect
   */
  hasActiveEffect(type) {
    const now = Date.now();
    return this.activeEffects.some(
      effect => effect.type === type && effect.isActive(now)
    );
  }

  /**
   * Get an active effect by type
   */
  getActiveEffect(type) {
    const now = Date.now();
    return this.activeEffects.find(
      effect => effect.type === type && effect.isActive(now)
    );
  }

  /**
   * Serialize tank state for network updates
   */
  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      turretDirection: this.turretDirection,
      username: this.username,
      hp: this.hp,
      tankStyle: this.tankStyle,
      activeEffects: this.activeEffects.map(e => e.serialize()),
      crownPowerup: this.crownPowerup,
      kills: this.kills,
    };
  }

  /**
   * Serialize for map updates
   */
  serializeForMapUpdate() {
    return {
      x: this.x,
      y: this.y,
    };
  }
}

module.exports = Tank;
