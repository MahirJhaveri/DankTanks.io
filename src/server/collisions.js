const Constants = require('../shared/constants');

function applyCollisions(players, bullets) {
    const destroyedBullets = [];
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        for (let j = 0; j < bullets.length; j++) {
            const bullet = bullets[j];
            if (bullet.parentID != player.id &&
                bullet.distanceTo(player) <= (Constants.BULLET_RADIUS + Constants.PLAYER_RADIUS)) {
                destroyedBullets.push(bullet);
                player.takeBulletDamage();
                break;
            }
        }
    }
    return destroyedBullets; ß
}

module.exports = applyCollisions;