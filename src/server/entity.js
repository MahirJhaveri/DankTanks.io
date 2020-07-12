
class Entity {
    constructor(id, x, y) {
        this.id = id;
        this.x = x;
        this.y = y;
    }

    // optimize app by not using sqrt at all and simply using squares everywhere
    distanceTo(entity) {
        const dx = this.x - object.x;
        const dy = this.y - object.y;
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
}

module.exports = {
    Entity: Entity,
    DynamicEntity: DynamicEntity,
};