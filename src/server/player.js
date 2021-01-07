const DynamicEntity = require("./dynamicEntity");
const Bullet = require("./bullet");
const Constants = require("../shared/constants");
const Crown = require("./crown");

class Player extends DynamicEntity {
  constructor(id, username, x, y, tankStyle, fireToogle) {
    super(id, x, y, Math.PI / 2, Constants.PLAYER_SPEED);
    this.username = username;
    this.hp = Constants.PLAYER_MAX_HP;
    this.fireCooldown = 0;
    this.score = 0;
    this.turretDirection = Math.random() * 2 * Math.PI; // Set Initial turret direction randomnly
    this.tankStyle = tankStyle;
    this.crownPowerup = null; // powerups from crowns, at most one at a time
    this.fireCooldownSpeed = Constants.PLAYER_FIRE_COOLDOWN;
    this.bulletSpeed = Constants.BULLET_SPEED;
    this.fireToogle = fireToogle;
    this.successiveToogle = !fireToogle;
    this.lastHitByPlayer = null; /*to restore player health on kill*/
  }

  computeDirAndSpeed(dir1, speed1, tankSpeedX, tankSpeedY) {
    const x1 = speed1 * Math.sin(dir1);
    const y1 = speed1 * Math.cos(dir1);
    const newSpeed = Math.sqrt((x1+tankSpeedX)*(x1+tankSpeedX) + (y1+tankSpeedY)*(y1+tankSpeedY));
    var newDir = Math.acos((y1+tankSpeedY)/newSpeed);
    if ((x1+tankSpeedX) < 0) {
      newDir = 2*Math.PI - newDir;
    }
    return [newDir, newSpeed];
  }

  update(dt) {
    const oldX = this.x;
    const oldY = this.y;

    super.update(dt);

    this.score += Constants.SCORE_PER_SECOND;

    // Make sure the player stays in bounds
    this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
    this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));

    if (this.fireCooldown > -0.015) {
      this.fireCooldown -= dt;
    }

    if (
      this.fireCooldown <= 0 &&
      (!this.fireToogle || (this.fireToogle && this.successiveToogle))
    ) {
      this.fireCooldown += this.fireCooldownSpeed;
      const tankSpeedX = (this.x - oldX != 0) ? this.speed * Math.sin(this.direction) : 0;
      const tankSpeedY = (this.y - oldY != 0) ? this.speed * Math.cos(this.direction) : 0;
      var [newTurretDirection, newBulletSpeed] = this.computeDirAndSpeed(this.turretDirection, Constants.BULLET_SPEED, tankSpeedX, tankSpeedY);
      return new Bullet(
        this.id,
        this.x,
        this.y,
        newTurretDirection,
        newBulletSpeed,
        this.turretDirection
      );
    }
    return null;
  }

  takeBulletDamage(bullet) {
    this.hp -= Constants.BULLET_DAMAGE;
    this.lastHitByPlayer = bullet.parentID;
  }

  onDealtDamage() {
    this.score += Constants.SCORE_BULLET_HIT;
  }

  serializeForUpdate() {
    return {
      ...super.serializeForUpdate(),
      direction: this.direction,
      turretDirection: this.turretDirection,
      username: this.username,
      hp: this.hp,
      tankStyle: this.tankStyle,
    };
  }

  // return object to send out for nav map updates
  serializeForMapUpdate() {
    return {
      x: this.x,
      y: this.y,
    };
  }

  // use this to set the turret direction on the game object
  setTurretDirection(dir) {
    this.turretDirection = dir;
  }

  // Change direction, only if new direction is adjacent to the current direction
  // directionKeyCode * MATH.PI == new direction
  updateTankDirection(directionKeyCode) {
    this.direction = directionKeyCode * Math.PI;
  }

  updateFireToggle(toggle) {
    if (this.fireToogle) {
      this.successiveToogle = toggle;
    }
  }
  // Methods deal with adding and dropping crowned powerups
  addCrownPowerup(crown) {
    if (this.crownPowerup != null) {
      // implement this when you add more than one powerup
    }
    this.crownPowerup = crown.id;
    this.fireCooldownSpeed = Constants.RAPID_FIRE_COOLDOWN;
    this.bulletSpeed = Constants.RAPID_FIRE_BULLET_SPEED;
  }

  dropCrownPowerup() {
    if (this.crownPowerup) {
      return new Crown(this.crownPowerup, this.x, this.y);
    }
    return null;
  }

  kill() {
    this.hp = 0;
  }
}

module.exports = Player;
