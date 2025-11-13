const Entity = require('./entity');
const Constants = require('../shared/constants');

class Powerup extends Entity {
    constructor(id, x, y, type) {
        super(id);
        this.x = x;
        this.y = y;
        this.type = type; // 'health', 'shield', 'speed_boost', etc.
    }

    // Calculate distance to another entity
    distanceTo(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // Get configuration for this powerup type
    getConfig() {
        return Constants.POWERUP_CONFIGS[this.type];
    }

    // Get collision radius for this powerup
    getRadius() {
        return this.getConfig().radius;
    }

    // Apply the powerup effect to a player
    // Returns an object with effect details for client feedback
    apply(player) {
        const config = this.getConfig();

        switch(this.type) {
            case 'health':
                const healedAmount = player.heal(config.healAmount);
                return { healedAmount };

            case 'shield':
                player.addTimedEffect('shield', config.duration);
                return { duration: config.duration };

            case 'speed':
                player.addTimedEffect('speed', config.duration);
                return { duration: config.duration, multiplier: config.speedMultiplier };

            // Future powerups can be added here
            default:
                return {};
        }
    }

    // Check if player can collect this powerup
    canCollect(player) {
        switch(this.type) {
            case 'health':
                return player.hp < Constants.PLAYER_MAX_HP;

            case 'shield':
                // Can't collect if already shielded
                return !player.hasActiveEffect('shield');

            case 'speed':
                // Can't collect if already speed-boosted
                return !player.hasActiveEffect('speed');

            default:
                return true;
        }
    }

    // Serialize for network updates
    serializeForUpdate() {
        return {
            id: this.id,
            x: this.x,
            y: this.y,
            type: this.type
        };
    }
}

module.exports = Powerup;
