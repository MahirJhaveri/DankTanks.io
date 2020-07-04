class Entity {
    constructor(id, x, y, dir, speed) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.direction = dir;
        this.speed = speed;
    }

    update(dt) {
        this.x += dt * this.speed * Math.sin(this.direction);
        this.y -= dt * this.speed * Math.cos(this.direction);
    }

    // optimize app by not using sqrt at all and simply using squares everywhere
    distanceTo(object) {
        const dx = this.x - object.x;
        const dy = this.y - object.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    setDirection(dir) {
        this.direction = dir;
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

module.exports = Entity;