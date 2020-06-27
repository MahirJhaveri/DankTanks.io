const ObjectClass = require('./Object');
const Bullet = require('./bullet');
const Constants = require('../shared/constants');

class Player extends ObjectClass {
    constructor(id, username, x, y, tankStyle) {
        super(id, x, y, Math.PI / 2, Constants.PLAYER_SPEED);
        //super(id, x, y, Math.random() * 2 * Math.PI, Constants.PLAYER_SPEED);
        this.username = username;
        this.hp = Constants.PLAYER_MAX_HP;
        this.fireCooldown = 0;
        this.score = 0;
        this.turretDirection = Math.random() * 2 * Math.PI; // Set Initial turret direction randomnly
        this.tankStyle = tankStyle;
    }

    update(dt) {
        super.update(dt);

        this.score += Constants.SCORE_PER_SECOND;

        // Make sure the player stays in bounds
        this.x = Math.max(0, Math.min(Constants.MAP_SIZE, this.x));
        this.y = Math.max(0, Math.min(Constants.MAP_SIZE, this.y));

        this.fireCooldown -= dt;
        if (this.fireCooldown <= 0) {
            this.fireCooldown += Constants.PLAYER_FIRE_COOLDOWN;
            return new Bullet(this.id, this.x, this.y, this.turretDirection);
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
            ...(super.serializeForUpdate()),
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
            y: this.y
        }
    }

    // use this to set the turret direction on the game object
    setTurretDirection(dir) {
        this.turretDirection = dir;
    }

    // Change direction based on which key was pressed
    // directionToMove can be LEFT or RIGHT
    updateTankDirection(directionToMove) {
        //const delta = Math.atan2(0.4, 1);
        const delta = Math.PI / 2;
        if (directionToMove == Constants.KEY.LEFT) {
            this.direction -= delta;
        } else if (directionToMove == Constants.KEY.RIGHT) {
            this.direction += delta;
        }
    }
}

module.exports = Player;