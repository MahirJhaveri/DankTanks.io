const Entity = require('./entity');

class Obstacle extends Entity {
    constructor(id, vertices) {
        super(id);
        this.vertices = vertices;
    }

    serializeForUpdate() {
        return {
            vertices: this.vertices,
        }
    }
}

module.exports = Obstacle;