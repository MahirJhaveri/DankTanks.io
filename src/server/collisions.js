const Constants = require('../shared/constants');
const isSeparable = require('./utils/sat');

/* NOTES:
 * First, design the obstacles class
 * Obstacles are treated as game entities, just like player and bullets 
 * Add obstacles to the list of params of the functions
 * check for collision of obstacles with player 
 * check for collision of obstacles with bullets
 */

 /* Caching to avoid recomputing normals for obstacles over and over */
const cache = {};

function applyCollisions(players, bullets, obstacles, crowns) {
    const bulletsHit = []; /* bullets that hit another player */
    const crownsCaptured = []; /* crowns captured by someone */
    const bulletsToRemove = {};

    /* Bullet-Obstacle Collisions 
    * simply, remove the destroyed bullet from bullets, since we dont need to 
    * update parent score, in this case.
    */
    for(let i = 0; i < bullets.length; i++) {
        const bullet = bullets[i];
        for(let l = 0; l < obstacles.length; l++) {
            const obstacle = obstacles[l];
            if(!isSeparable(obstacle.id, obstacle.vertices, 
                bullet.getCoordinates(), Constants.BULLET_RADIUS, cache)) {
                bulletsToRemove[bullet.id] = true;
            }
        }
    }
    
    /* Player Collision */
    for (let i = 0; i < players.length; i++) {
        const player = players[i];
        
        /* Player-Obstacle Collision */
        for(let l = 0; l < obstacles.length; l++) {
            const obstacle = obstacles[l];
            if(!isSeparable(obstacle.id, obstacle.vertices, 
                player.getCoordinates(), Constants.PLAYER_RADIUS, cache)) {
                player.lastHitByPlayer = null; /*since collided with obstacle*/
                player.kill();
                continue;
            }
        }
        
        /* Player-Bullet Collision */
        for (let j = 0; j < bullets.length; j++) {
            const bullet = bullets[j];
            if (bullet.parentID != player.id &&
                bullet.distanceTo(player) <= (Constants.BULLET_RADIUS + Constants.PLAYER_RADIUS)) {
                bulletsHit.push(bullet);
                bulletsToRemove[bullet.id] = true;
                player.takeBulletDamage(bullet);
                break;
            }
        }

        /* Player-Crown Collision */
        for (let k = 0; k < crowns.length; k++) {
            const crown = crowns[k];
            // Update this to use maps and have a faster check (will not matter now as there is just one crown)
            if (!crownsCaptured.includes(crown) &&
                player.distanceTo(crown) <= (Constants.CROWN_RADIUS + Constants.PLAYER_RADIUS)) {
                player.addCrownPowerup(crown);
                crownsCaptured.push(crown);
                break;
            }
        }
    }

    return {
        updatedBullets: bullets.filter(b => !bulletsToRemove[b.id]),
        bulletsHit: bulletsHit,
        crownsCaptured: crownsCaptured,
    };
}

module.exports = applyCollisions;