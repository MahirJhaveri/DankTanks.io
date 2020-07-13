
const Entity = require('./entity');

class DynamicEntity extends Entity {
    constructor(id, x, y, dir, speed) {
        super(id, x, y);
        this.direction = dir;
        this.speed = speed;
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
            ...(super.serializeForUpdate()),
            id: this.id,
        }
    }
}

module.exports = DynamicEntity;