const Constants = require('../shared/constants');
const isSeparable = require('./utils/sat');

/* NOTES:
 * First, design the obstacles class
 * Obstacles are treated as game entities, just like tank and bullets 
 * Add obstacles to the list of params of the functions
 * check for collision of obstacles with tanks 
 * check for collision of obstacles with bullets
 */

 /* Caching to avoid recomputing normals for obstacles over and over */
const cache = {};

function applyCollisions(tanks, bullets, obstacles, crowns, powerups) {
    const bulletsHit = []; /* bullets that hit another tank */
    const crownsCaptured = []; /* crowns captured by someone */
    const powerupsCollected = []; /* powerups collected by tanks */
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
    
    /* Tank Collision */
    for (let i = 0; i < tanks.length; i++) {
        const tank = tanks[i];
        
        /* Player-Obstacle Collision */
        for(let l = 0; l < obstacles.length; l++) {
            const obstacle = obstacles[l];
            if(!isSeparable(obstacle.id, obstacle.vertices, 
                tank.getCoordinates(), Constants.PLAYER_RADIUS, cache)) {
                tank.lastHitByPlayer = null; /*since collided with obstacle*/
                tank.kill();
                continue;
            }
        }
        
        /* Tank-Bullet Collision */
        for (let j = 0; j < bullets.length; j++) {
            const bullet = bullets[j];
            if (bullet.parentID != tank.id &&
                bullet.distanceTo(tank) <= (Constants.BULLET_RADIUS + Constants.PLAYER_RADIUS)) {
                bulletsHit.push(bullet);
                bulletsToRemove[bullet.id] = true;
                tank.takeBulletDamage(bullet);
                break;
            }
        }

        /* Tank-Crown Collision */
        for (let k = 0; k < crowns.length; k++) {
            const crown = crowns[k];
            // Update this to use maps and have a faster check (will not matter now as there is just one crown)
            if (!crownsCaptured.find(c => c.crown === crown) &&
                tank.distanceTo(crown) <= (Constants.CROWN_RADIUS + Constants.PLAYER_RADIUS)) {
                tank.addCrownPowerup(crown);
                crownsCaptured.push({
                    crown: crown,
                    tankId: tank.id
                });
                break;
            }
        }

        /* Tank-Powerup Collision (unified for all powerup types) */
        for (let m = 0; m < powerups.length; m++) {
            const powerup = powerups[m];

            // Skip if already collected this frame
            if (powerupsCollected.find(p => p.powerup.id === powerup.id)) {
                continue;
            }

            // Check collection conditions
            if (powerup.canCollect(tank) &&
                tank.distanceTo(powerup) <= (powerup.getRadius() + Constants.PLAYER_RADIUS)) {

                // Apply powerup effect
                const result = powerup.apply(tank);

                powerupsCollected.push({
                    powerup: powerup,
                    playerId: tank.id,
                    result: result
                });
                break; // One powerup per tank per frame
            }
        }
    }

    return {
        updatedBullets: bullets.filter(b => !bulletsToRemove[b.id]),
        bulletsHit: bulletsHit,
        crownsCaptured: crownsCaptured,
        powerupsCollected: powerupsCollected,
    };
}

module.exports = applyCollisions;