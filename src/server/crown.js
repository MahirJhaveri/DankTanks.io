const Entity = require('./entity');

class Crown extends Entity {
    constructor(x, y) {
        super('CROWN', x, y);
    }
}

module.exports = Crown;