const Entity = require('./entity');

class Crown extends Entity {
    constructor(id, x, y) {
        super(id);
        this.x = x;
        this.y = y;
    }

    // optimize app by not using sqrt at all and simply using squares everywhere
    distanceTo(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Return fields relevant to the client for rendering
    serializeForUpdate() {
        return {
            x: this.x,
            y: this.y
        };
    }
}

module.exports = Crown;