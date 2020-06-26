
const Constants = require('../../shared/constants');
const { TANK } = Constants;

const ASSET_NAMES = ['ship.svg', 'bullet.svg', 'TankBlue.png', 'TankRed.png', 'TurretBlue.png', 'TurretRed.png'];

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


export const getTank = (tankStyle) => {
    switch (tankStyle) {
        case TANK.RED:
            return getAsset('TankRed.png');
            break;
        default:
            return getAsset('TankBlue.png');
    }
}

export const getTurret = (tankStyle) => {
    switch (tankStyle) {
        case TANK.RED:
            return getAsset('TurretRed.png');
            break;
        default:
            return getAsset('TurretBlue.png');
    }
}