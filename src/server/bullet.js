const shortid = require('shortid');
const DynamicEntity = require('./dynamicEntity');
const Constants = require('../shared/constants');

class Bullet extends DynamicEntity {
    constructor(parentID, x, y, dir, speed, drawAngle) {
        super(shortid(), x, y, dir, speed);
        this.parentID = parentID;
        this.drawAngle = drawAngle; /* Angle to draw the bullet */ 
    }

    update(dt) {
        super.update(dt);
        return this.x < 0 || this.x > Constants.MAP_SIZE || this.y < 0 || this.y > Constants.MAP_SIZE;
    }

    serializeForUpdate() {
        return {
          ...super.serializeForUpdate(),
          drawAngle: this.drawAngle,
        };
      }
}

module.exports = Bullet;