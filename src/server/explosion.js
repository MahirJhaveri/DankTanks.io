const Entity = require('./entity');
const shortid = require('shortid');
const Constants = require('../shared/constants');
const EXPLOSION = Constants.SPRITES.EXPLOSION;

const states = [EXPLOSION.STATE1, EXPLOSION.STATE2, EXPLOSION.STATE3, EXPLOSION.STATE4, EXPLOSION.STATE5, EXPLOSION.STATE6,
EXPLOSION.STATE7, EXPLOSION.STATE8];

class Explosion extends Entity {
    constructor(x, y) {
        super(shortid());
        this.x = x;
        this.y = y;
        this.stateIndex = 0;
        this.state = states[this.stateIndex];
        this.timeSinceLastUpdate = 0;
    }

    // optimize app by not using sqrt at all and simply using squares everywhere
    distanceTo(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // deals with updating the state of the explosion
    // as of now simply increments the state when update called
    update(dt) {
        this.timeSinceLastUpdate += dt;
        if (this.timeSinceLastUpdate > 1 / 15) {
            this.stateIndex++;
            this.state = (this.stateIndex < states.length) ? states[this.stateIndex] : null;
            this.timeSinceLastUpdate = 0;
        }
    }

    serializeForUpdate() {
        return {
            x: this.x,
            y: this.y,
            state: this.state,
        };
    }
}

module.exports = Explosion;