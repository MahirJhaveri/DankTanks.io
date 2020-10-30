import io from 'socket.io-client';
import { processGameUpdate } from './state';
import { processLeaderboardUpdate } from './leaderboard';
import { processMapUpdate } from './map'

const Constants = require('../../shared/constants');

const socket = io(`ws://${window.location.host}`);

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