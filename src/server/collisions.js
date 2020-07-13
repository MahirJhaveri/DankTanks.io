const Constants = require('../shared/constants');

function applyCollisions(players, bullets, crowns) {
    const destroyedBullets = [];
    const destroyedCrowns = [];
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
        for (let k = 0; k < crowns.length; k++) {
            const crown = crowns[k];
            // Update this to use maps and have a faster check (will not matter now as there is just one crown)
            if (!destroyedCrowns.includes(crown) &&
                player.distanceTo(crown) <= (Constants.CROWN_RADIUS + Constants.PLAYER_RADIUS)) {
                player.addCrownPowerup(crown);
                destroyedCrowns.push(crown);
                break;
            }
        }
    }
    return {
        destroyedBullets: destroyedBullets,
        destroyedCrowns: destroyedCrowns,
    };
}

module.exports = applyCollisions;