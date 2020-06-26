const Constants = require('../shared/constants');
const Player = require('./player');
const applyCollisions = require('./collisions');
const Leaderboard = require('./leaderboard');

class Game {
    constructor() {
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.leaderboard = new Leaderboard(Constants.LEADERBOARD_SIZE);
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        this.shouldSendLeaderboard = 1; // send leaderboard updates only once every 4 game updates
        setInterval(this.update.bind(this), 1000 / 60); // process game updates at 60fps
        setInterval(this.update_map.bind(this), 1000 / 5); // send out map updates at 5fps
    }

    addPlayer(socket, username) {
        this.sockets[socket.id] = socket;

        const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        this.players[socket.id] = new Player(socket.id, username, x, y);
    }

    removePlayer(socket) {
        delete this.sockets[socket.id];
        delete this.players[socket.id];
    }

    handleMouseInput(socket, dir) {
        if (this.players[socket.id]) {
            this.players[socket.id].setTurretDirection(dir);
        }
    }

    handleKeyInput(socket, keyCode) {
        // Check if player is still connected
        if (this.players[socket.id]) {
            this.players[socket.id].updateTankDirection(keyCode);
        }
    }

    /**
     * Sends out map updates, independent of game updates
     */
    update_map() {
        const update = {
            players: []
        }
        Object.keys(this.players).forEach(playerID => {
            update.players.push(this.players[playerID].serializeForMapUpdate());
        });
        Object.keys(this.sockets).forEach(socketID => {
            this.sockets[socketID].emit(Constants.MSG_TYPES.MAP_UPDATE, update);
        });
    }

    // updates the state of the game 'fps' times per second
    // deals with moving people ahead, bullets ahead, collision, ...
    // deals with game updates and leaderboard_updates
    update() {
        const now = Date.now();
        const dt = (now - this.lastUpdateTime) / 1000;
        this.lastUpdateTime = now;

        // update each bullet
        const bulletsRemoved = [];
        this.bullets.forEach(bullet => {
            if (bullet.update(dt)) {
                bulletsRemoved.push(bullet);
            }
        });
        this.bullets = this.bullets.filter(
            bullet => !bulletsRemoved.includes(bullet)
        );

        // Update each player
        Object.keys(this.sockets).forEach(playerID => {
            const player = this.players[playerID];
            const newBullet = player.update(dt);
            if (newBullet) {
                this.bullets.push(newBullet);
            }

            if (this.shouldSendLeaderboard == 0) {
                this.leaderboard.updatePlayerScore(playerID, player.username, player.score);
            }
        });

        // Check for collisions
        const destroyedBullets = applyCollisions(
            Object.values(this.players),
            this.bullets
        );
        destroyedBullets.forEach(bullet => {
            if (this.players[bullet.parentID]) {
                this.players[bullet.parentID].onDealtDamage()
                if (this.shouldSendLeaderboard == 0) {
                    this.leaderboard.updatePlayerScore(bullet.parentID,
                        this.players[bullet.parentID].username, this.players[bullet.parentID].score);
                }
            }
        });
        this.bullets = this.bullets.filter(
            b => !destroyedBullets.includes(b)
        );

        // Check for dead players
        Object.keys(this.sockets).forEach(playerID => {
            const socket = this.sockets[playerID];
            const player = this.players[playerID];

            if (player.hp <= 0) {
                socket.emit(Constants.MSG_TYPES.GAME_OVER);
                this.removePlayer(socket);
            }
        });

        // Precompute the leaderboardUpdate package for efficiency
        var leaderboardUpdate = null;
        if (this.shouldSendLeaderboard == 0) {
            leaderboardUpdate = this.leaderboard.serializeForUpdate();
        }

        // send out updates
        if (this.shouldSendUpdate) {
            Object.keys(this.sockets).forEach(playerID => {
                const socket = this.sockets[playerID];
                const player = this.players[playerID];
                socket.emit(Constants.MSG_TYPES.GAME_UPDATE, this.createUpdate(player));

                // Make sure to keep the frequency of leaderboardupdates divisible by the freq of 
                // game updates
                if (this.shouldSendLeaderboard == 0) {
                    const update = {
                        leaderboardUpdate: leaderboardUpdate,
                        score: player.score
                    }
                    socket.emit(Constants.MSG_TYPES.LEADERBOARD_UPDATE, update);
                }
            });
            this.shouldSendUpdate = false;
        } else {
            this.shouldSendUpdate = true;
        }

        this.shouldSendLeaderboard = (this.shouldSendLeaderboard + 1) % 4;
    }

    createUpdate(player) {
        const nearbyPlayers = Object.values(this.players).filter(
            p => p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 2
        );

        const nearbyBullets = this.bullets.filter(
            b => b.distanceTo(player) <= Constants.MAP_SIZE / 2
        );

        return {
            t: Date.now(),
            me: player.serializeForUpdate(),
            others: nearbyPlayers.map(p => p.serializeForUpdate()),
            bullets: nearbyBullets.map(b => b.serializeForUpdate())
        }
    }
}

module.exports = Game;