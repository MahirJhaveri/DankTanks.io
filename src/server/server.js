const express = require('express');
const webpack = require('webpack');
const webpackDevMiddleware = require('webpack-dev-middleware');
const webpackConfig = require('../../webpack.dev.js');
const socketio = require('socket.io');
const Constants = require('../shared/constants');

const Game = require('./game');

// Setup an express server
const app = express()
app.use(express.static('public'));

if (process.env.NODE_ENV === 'development') {
    // Setup webpack for development
    const compiler = webpack(webpackConfig);
    app.use(webpackDevMiddleware(compiler));
} else {
    // Use the pre-compiled files 
    app.use(express.static('dist'));
}

// Listen on port
const port = process.env.PORT || 3000;
const server = app.listen(port);
console.log(`Server listening on port ${port}`);

// Setup socket.io
const io = socketio(server);

io.on('connection', socket => {
    console.log('Player connected!', socket.id);

    socket.on(Constants.MSG_TYPES.JOIN_GAME, joinGame);
    socket.on(Constants.MSG_TYPES.INPUT.MOUSE, handleMouseInput);  // sets the direction of the turret
    socket.on(Constants.MSG_TYPES.INPUT.KEY, handleKeyInput);  // sets the direction of the tank
    socket.on(Constants.MSG_TYPES.INPUT.FIRE, handleFireInput);  // sets the direction of the tank

    socket.on('disconnect', onDisconnect);
});

// Initialize the game
const game = new Game();

// NOTE: This keyword ??? idk how that works??

function joinGame(msg) {
    game.addPlayer(this, msg.username, (msg.color) ? msg.color : Constants.TANK.BLUE, msg.fireToggle);
}

// Use the mouse data to move the turret
function handleMouseInput(dir) {
    game.handleMouseInput(this, dir);
}

function handleKeyInput(keyCode) {
    game.handleKeyInput(this, keyCode);
}

function handleFireInput(toggle) {
    game.handleFireInput(this, toggle);
}

function onDisconnect() {
    console.log("Player Disconnected", this.id);
    game.removePlayer(this);
}