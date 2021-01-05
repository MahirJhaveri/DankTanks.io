
/*
TODO:
- Use a queue to store updates for fast insertion and removal
- 
*/

const Constants = require('../../shared/constants');

const gameUpdates = [];
let gameStart = 0;
let firstServerTimestamp = 0;

// initialize the game state
export function initState() {
    gameStart = 0;
    firstServerTimestamp = 0;
}

// receive and update game states
export function processGameUpdate(update) {
    if (!firstServerTimestamp) {
        firstServerTimestamp = update.t;
        gameStart = Date.now()
    }

    // console.log(`Network delay = ${(firstServerTimestamp + (Date.now() - gameStart) - update.t) / 1000}s`)

    // add game updates to the queue
    gameUpdates.push(update);

    // remove updates prior to the base update
    const base = getBaseUpdate()
    if (base > 0) {
        gameUpdates.splice(0, base);
    }
}

// The time on the Server according to the client
// Render_delay is subtracted because the client thinks that the server is 100ms
// behind its actual time
function currentServerTime() {
    return firstServerTimestamp + (Date.now() - gameStart) - Constants.RENDER_DELAY
}

// Fetch the server update received just before the serverTime
function getBaseUpdate() {
    const serverTime = currentServerTime()
    var i = gameUpdates.length - 1;
    while (i >= 0) {
        if (gameUpdates[i].t <= serverTime) {
            return i;
        }
        i -= 1
    }
    return -1
}

// get the current state to render
export function getCurrentState() {
    // If nothing received from the server then simply dont return anything
    if (!firstServerTimestamp) {
        return {}
    } else {
        const base = getBaseUpdate()
        const serverTime = currentServerTime()

        if (base < 0) {
            // revaluate: base can only be < 0 at the start of the game
            return gameUpdates[gameUpdates.length - 1]
        } else if (base == gameUpdates.length - 1) {
            //console.log("Awaiting game update from server");
            return gameUpdates[gameUpdates.length - 1]
        } else {
            const baseUpdate = gameUpdates[base];
            const nextUpdate = gameUpdates[base + 1];
            const r = (serverTime - baseUpdate.t) / (nextUpdate.t - baseUpdate.t);

            return {
                me: interpolateObject(baseUpdate.me, nextUpdate.me, r),
                others: interpolateObjectArray(baseUpdate.others, nextUpdate.others, r),
                bullets: interpolateObjectArray(baseUpdate.bullets, nextUpdate.bullets, r),
                explosions: baseUpdate.explosions,
                crowns: baseUpdate.crowns,
            };
        }
    }
}


// Functions to interpolate the different structures
function interpolateObject(object1, object2, ratio) {
    if (!object2) {
        return object1;
    }

    const interpolated = {};
    Object.keys(object1).forEach(key => {
        if (key === 'username' || key === 'hp' || key === 'tankStyle') {
            interpolated[key] = object1[key];
        }
        else if (key === 'direction' || key === 'turretDirection') {
            interpolated[key] = interpolateDirection(object1[key], object2[key], ratio);
        } else {
            interpolated[key] = object1[key] + (object2[key] - object1[key]) * ratio;
        }
    });
    return interpolated;
}

function interpolateObjectArray(objects1, objects2, ratio) {
    return objects1.map(o => interpolateObject(o, objects2.find(o2 => o.id === o2.id), ratio));
}

// Determines the best way to rotate (cw or ccw) when interpolating a direction.
// For example, when rotating from -3 radians to +3 radians, we should really rotate from
// -3 radians to +3 - 2pi radians.
function interpolateDirection(d1, d2, ratio) {
    const absD = Math.abs(d2 - d1);
    if (absD >= Math.PI) {
        // The angle between the directions is large - we should rotate the other way
        if (d1 > d2) {
            return d1 + (d2 + 2 * Math.PI - d1) * ratio;
        } else {
            return d1 - (d2 - 2 * Math.PI - d1) * ratio;
        }
    } else {
        // Normal interp
        return d1 + (d2 - d1) * ratio;
    }
}