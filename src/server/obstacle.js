class Obstacle {
    constructor(id, points) {
        this.id = id;
        this.points = points;
    }

    serializeForUpdate() {
        return {
            points: this.points,
        }
    }
}

module.exports = Obstacle;