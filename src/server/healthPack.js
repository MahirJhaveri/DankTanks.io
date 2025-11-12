const Entity = require('./entity');
const Constants = require('../shared/constants');

class HealthPack extends Entity {
    constructor(id, x, y) {
        super(id);
        this.x = x;
        this.y = y;
        this.healAmount = Constants.HEALTH_PACK_HEAL;
    }

    // Calculate distance to another entity
    distanceTo(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Return fields relevant to the client for rendering
    serializeForUpdate() {
        return {
            id: this.id,
            x: this.x,
            y: this.y
        };
    }
}

module.exports = HealthPack;
