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
  }

  computeDirAndSpeed(dir1, speed1, dir2, speed2) {
    const x1 = speed1 * Math.sin(dir1);
    const y1 = speed1 * Math.cos(dir1);
    const x2 = speed2 * Math.sin(dir2);
    const y2 = speed2 * Math.cos(dir2);
    const newSpeed = Math.sqrt((x1+x2)*(x1+x2) + (y1+y2)*(y1+y2));
    var newDir = Math.acos((y1+y2)/newSpeed);
    if ((x1+x2) < 0) {
      newDir = 2*Math.PI - newDir;
    }
    return [newDir, newSpeed];
  }

  update(dt) {
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
      var [newTurretDirection, newBulletSpeed] = this.computeDirAndSpeed(this.turretDirection, this.bulletSpeed, this.direction, Constants.PLAYER_SPEED);
      return new Bullet(
        this.id,
        this.x,
        this.y,
        newTurretDirection,
        newBulletSpeed
      );
    }
    return null;
  }

  takeBulletDamage() {
    this.hp -= Constants.BULLET_DAMAGE;
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
}

module.exports = Player;
