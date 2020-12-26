
const Constants = require('../../shared/constants');
const { TANK, SPRITES } = Constants;

const ASSET_NAMES = [SPRITES.TANK_RED, SPRITES.TURRET_RED, SPRITES.TANK_BLUE, SPRITES.TURRET_BLUE, SPRITES.TANK_GREEN,
SPRITES.TURRET_GREEN, SPRITES.TANK_GRAY, SPRITES.TURRET_GRAY, SPRITES.BULLET, SPRITES.LASERBEAM, SPRITES.MISSILE, SPRITES.CROWN, SPRITES.EXPLOSION.STATE1,
SPRITES.EXPLOSION.STATE2, SPRITES.EXPLOSION.STATE3, SPRITES.EXPLOSION.STATE4, SPRITES.EXPLOSION.STATE5,
SPRITES.EXPLOSION.STATE6, SPRITES.EXPLOSION.STATE7, SPRITES.EXPLOSION.STATE8];

const assets = {};
const downloadPromise = Promise.all(ASSET_NAMES.map(downloadAsset));

// return a promise to download an individual assets
function downloadAsset(assetName) {
    return new Promise(resolve => {
        const asset = new Image();
        asset.onload = () => {
            console.log(`Downloaded ${assetName}`);
            assets[assetName] = asset;
            resolve();
        }
        asset.src = `/assets/${assetName}`;
    });
}

// promise to download all assets
export const downloadAssets = () => downloadPromise;


export const getAsset = (assetName) => assets[assetName];

// tankStyle ==> tank base mapper
export const getTank = (tankStyle) => {
    switch (tankStyle) {
        case TANK.RED:
            return getAsset(SPRITES.TANK_RED);
            break;
        case TANK.GREEN:
            return getAsset(SPRITES.TANK_GREEN);
            break;
        case TANK.GRAY:
            return getAsset(SPRITES.TANK_GRAY);
            break;
        default:
            return getAsset(SPRITES.TANK_BLUE);
    }
}

// tankStyle ==> turret mapper
export const getTurret = (tankStyle) => {
    switch (tankStyle) {
        case TANK.RED:
            return getAsset(SPRITES.TURRET_RED);
            break;
        case TANK.GREEN:
            return getAsset(SPRITES.TURRET_GREEN);
            break;
        case TANK.GRAY:
            return getAsset(SPRITES.TURRET_GRAY);
            break;
        default:
            return getAsset(SPRITES.TURRET_BLUE);
    }
}