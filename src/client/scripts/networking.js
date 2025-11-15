import io from 'socket.io-client';
import { processGameUpdate, getCurrentState } from './state';
import { processLeaderboardUpdate } from './leaderboard';
import { processMapUpdate } from './map';
import { playSound, SOUNDS } from './audio';
import { createPowerupPickupEffect, createCrownPickupEffect } from './particles';
import { addNotification } from './notifications';

const Constants = require('../../shared/constants');
const { POWERUP_CONFIGS } = Constants;

const protocol = window.location.protocol.includes('https') ? 'wss' : 'ws';
const socket = io(`${protocol}://${window.location.host}`, { transports: ['websocket'] });

// promise to connect to game server
const connectedPromise = new Promise(resolve => {
    socket.on('connect', () => {
        console.log("Connected to server!");
        resolve();
    })
});

// add callback to listen for game updates and game over
export const connect = onGameOver => (
    connectedPromise.then(() => {
        // callbacks
        socket.on(Constants.MSG_TYPES.GAME_UPDATE, processGameUpdate);
        socket.on(Constants.MSG_TYPES.GAME_OVER, onGameOver);
        socket.on(Constants.MSG_TYPES.LEADERBOARD_UPDATE, processLeaderboardUpdate);
        socket.on(Constants.MSG_TYPES.MAP_UPDATE, processMapUpdate);
        socket.on(Constants.MSG_TYPES.POWERUP_COLLECTED, ({ x, y, type, result }) => {
            const config = POWERUP_CONFIGS[type];
            playSound(SOUNDS[config.collectSound]);
            createPowerupPickupEffect(x, y, type, config);
        });
        socket.on(Constants.MSG_TYPES.CROWN_COLLECTED, ({ x, y, powerupType }) => {
            playSound(SOUNDS.CROWN_PICKUP);
            createCrownPickupEffect(x, y);
        });
        socket.on(Constants.MSG_TYPES.EVENT_NOTIFICATION, ({ eventType, data }) => {
            // Add notification to queue (all notifications treated equally)
            addNotification(eventType, data);

            // Play kill sound if this player is the killer
            if (eventType === Constants.EVENT_TYPES.PLAYER_KILL) {
                const gameState = getCurrentState();
                const myPlayerId = gameState.me?.id;
                if (myPlayerId && data.killerId === myPlayerId) {
                    playSound(SOUNDS.KILL, 0.4);
                }
            }
        });
    })
);

// join game with username
export const play = (username, color, fireToggle) => {
    socket.emit(Constants.MSG_TYPES.JOIN_GAME, { username: username, color: color, fireToggle:fireToggle });
};


export const updateTurretDirection = dir => {
    socket.emit(Constants.MSG_TYPES.INPUT.MOUSE, dir);
};

// Send the key to update the tank direction
export const updateTankDirection = keyCode => {
    socket.emit(Constants.MSG_TYPES.INPUT.KEY, keyCode);
}

export const updateFireToggle = toggle => {
    socket.emit(Constants.MSG_TYPES.INPUT.FIRE, toggle);
}