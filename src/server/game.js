const Constants = require('../shared/constants');
const Player = require('./player');
const applyCollisions = require('./collisions');
const Leaderboard = require('./leaderboard');
const Explosion = require('./explosion');
const Crown = require('./crown');

class Game {
    constructor() {
        this.sockets = {};
        this.players = {};
        this.bullets = [];
        this.crowns = [new Crown(Constants.CROWN_POWERUP.RAPID_FIRE, Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2)];
        this.explosions = [];
        this.leaderboard = new Leaderboard(Constants.LEADERBOARD_SIZE);
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        this.shouldSendLeaderboard = 1; // send leaderboard updates only once every 4 game updates
        setInterval(this.update.bind(this), 1000 / 60); // process game updates at 60fps
        setInterval(this.update_map.bind(this), 1000 / 5); // send out map updates at 5fps
    }

    addPlayer(socket, username, tankStyle) {
        this.sockets[socket.id] = socket;

        const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        this.players[socket.id] = new Player(socket.id, username, x, y, tankStyle);
    }

    removePlayer(socket) {
        // release crowns if player has any
        const player = this.players[socket.id];
        const crown = player.dropCrownPowerup();
        if (crown) this.crowns.push(crown);

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
        const playerLocations = [];
        Object.keys(this.players).forEach(playerID => {
            playerLocations.push(this.players[playerID].serializeForMapUpdate());
        });
        Object.keys(this.sockets).forEach(socketID => {
            this.sockets[socketID].emit(Constants.MSG_TYPES.MAP_UPDATE, {
                players: playerLocations,
                curr: this.players[socketID].serializeForMapUpdate()
            });
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
        const destroyedEntities = applyCollisions(
            Object.values(this.players),
            this.bullets,
            this.crowns
        );
        destroyedEntities.destroyedBullets.forEach(bullet => {
            if (this.players[bullet.parentID]) {
                this.players[bullet.parentID].onDealtDamage()
                if (this.shouldSendLeaderboard == 0) {
                    this.leaderboard.updatePlayerScore(bullet.parentID,
                        this.players[bullet.parentID].username, this.players[bullet.parentID].score);
                }
            }
        });
        // optimize this by use of maps instead of lists
        this.bullets = this.bullets.filter(
            b => !destroyedEntities.destroyedBullets.includes(b)
        );
        this.crowns = this.crowns.filter(
            c => !destroyedEntities.destroyedCrowns.includes(c)
        )

        // Check for dead players
        Object.keys(this.sockets).forEach(playerID => {
            const socket = this.sockets[playerID];
            const player = this.players[playerID];

            if (player.hp <= 0) {
                // remove player crown and make it available on the map
                const crown = player.dropCrownPowerup();
                if (crown) this.crowns.push(crown);

                socket.emit(Constants.MSG_TYPES.GAME_OVER);
                this.removePlayer(socket);
                this.explosions.push(new Explosion(player.x, player.y));
            }
        });

        // update each explosion (for optimized version use linkedlist)
        this.explosions = this.explosions.map(
            explosion => {
                explosion.update(dt);
                return explosion;
            }
        );
        this.explosions = this.explosions.filter(
            explosion => explosion.state != null
        );



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

        //console.log(`Time to run update = ${(Date.now() - now) / 1000}`);
    }

    createUpdate(player) {
        const nearbyPlayers = Object.values(this.players).filter(
            p => p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 2
        );

        const nearbyBullets = this.bullets.filter(
            b => b.distanceTo(player) <= Constants.MAP_SIZE / 2
        );

        const nearbyExplosions = this.explosions.filter(
            e => player.distanceTo(e) <= Constants.MAP_SIZE / 2
        );

        const nearbyCrowns = this.crowns.filter(
            c => player.distanceTo(c) <= Constants.MAP_SIZE / 2
        )

        return {
            t: Date.now(),
            me: player.serializeForUpdate(),
            others: nearbyPlayers.map(p => p.serializeForUpdate()),
            bullets: nearbyBullets.map(b => b.serializeForUpdate()),
            explosions: nearbyExplosions.map(e => e.serializeForUpdate()),
            crowns: nearbyCrowns.map(c => c.serializeForUpdate()),
        }
    }
}

module.exports = Game;