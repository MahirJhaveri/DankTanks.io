
const Entity = require('./entity');

class DynamicEntity extends Entity {
    constructor(id, x, y, dir, speed) {
        super(id, x, y);
        this.x = x;
        this.y = y;
        this.direction = dir;
        this.speed = speed;
    }

    getCoordinates() {
        return [this.x, this.y];
    }

    distanceTo(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    update(dt) {
        this.x += dt * this.speed * Math.sin(this.direction);
        this.y -= dt * this.speed * Math.cos(this.direction);
    }

    setDirection(dir) {
        this.direction = dir;
    }

    serializeForUpdate() {
        return {
            x: this.x,
            y: this.y,
            id: this.id,
        }
    }
}

module.exports = DynamicEntity;