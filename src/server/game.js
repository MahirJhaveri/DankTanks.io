const Constants = require('../shared/constants');
const Player = require('./player');
const Bot = require('./bot');
const applyCollisions = require('./collisions');
const Leaderboard = require('./leaderboard');
const Explosion = require('./explosion');
const Crown = require('./crown');
const Obstacle = require('./obstacle');
const Powerup = require('./powerup');
const shortid = require('shortid');

class Game {
    constructor() {
        this.sockets = {};
        this.players = {};
        this.bots = {}; // AI-controlled tanks
        this.bullets = [];
        this.obstacles = this.initObstacles();
        this.crowns = [new Crown(Constants.CROWN_POWERUP.RAPID_FIRE, Constants.MAP_SIZE / 2, Constants.MAP_SIZE / 2)];
        this.powerups = [];
        this.lastPowerupSpawn = {
            health: Date.now(),
            shield: Date.now(),
            speed: Date.now(),
        };
        this.explosions = [];
        this.leaderboard = new Leaderboard(Constants.LEADERBOARD_SIZE);
        this.lastUpdateTime = Date.now();
        this.shouldSendUpdate = false;
        this.shouldSendLeaderboard = 1; // send leaderboard updates only once every 4 game updates
        this.botSpawnTimer = 0; // Accumulates time for bot spawn checks
        setInterval(this.update.bind(this), 1000 / 60); // process game updates at 60fps
        setInterval(this.update_map.bind(this), 1000 / 5); // send out map updates at 5fps

        // Initial bot spawn
        this.checkBotSpawning();
    }

    // Broadcast event notification to all connected clients
    broadcastEvent(eventType, data) {
        const payload = {
            eventType: eventType,
            data: data,
            timestamp: Date.now()
        };
        Object.keys(this.sockets).forEach(socketID => {
            this.sockets[socketID].emit(Constants.MSG_TYPES.EVENT_NOTIFICATION, payload);
        });
    }

    /* Initializes a list of Obstacles from data in constants */
    initObstacles() {
        const obs = [];
        for(let i = 0; i < Constants.OBSTACLES.length; i++) {
            obs.push(new Obstacle(`Obstacle${i}`, Constants.OBSTACLES[i]));
        }
        return obs;
    }

    addPlayer(socket, username, tankStyle, fireToggle) {
        this.sockets[socket.id] = socket;

        const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        this.players[socket.id] = new Player(socket.id, username, x, y, tankStyle,fireToggle);

        // Broadcast player join event
        this.broadcastEvent(Constants.EVENT_TYPES.PLAYER_JOIN, {
            player: username
        });
    }

    removePlayer(socket) {
        // release crowns if player has any
        const player = this.players[socket.id];
        if (player) {
            const crown = player.dropCrownPowerup();
            if (crown) {
                this.crowns.push(crown);

                // Broadcast crown drop event to all players
                this.broadcastEvent(Constants.EVENT_TYPES.CROWN_DROP, {
                    player: player.username
                });
            }
        }

        delete this.sockets[socket.id];
        delete this.players[socket.id];
    }

    // ===== BOT MANAGEMENT METHODS =====

    /**
     * Spawn a new bot at a random position
     */
    spawnBot() {
        const id = shortid.generate();
        const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
        const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);

        const bot = new Bot(id, x, y);
        this.bots[id] = bot;

        console.log(`Bot spawned: ${bot.username} (${id})`);
    }

    /**
     * Check if we need to spawn bots (called every 5 seconds)
     */
    checkBotSpawning() {
        const currentBotCount = Object.keys(this.bots).length;
        const { MAX_COUNT } = Constants.BOT_CONFIG;

        // If under max count, spawn exactly 1 bot
        if (currentBotCount < MAX_COUNT) {
            this.spawnBot();
        }
    }

    /**
     * Handle bot death (cleanup and allow respawn)
     */
    handleBotDeath(botId) {
        const bot = this.bots[botId];
        if (!bot) return;

        console.log(`Bot died: ${bot.username} (${botId})`);

        // Release name for reuse
        Bot.releaseUsername(bot.username);

        // Drop crown if bot has one
        const crown = bot.dropCrownPowerup();
        if (crown) {
            this.crowns.push(crown);
        }

        // Remove from bots collection
        delete this.bots[botId];

        // Create explosion
        this.explosions.push(new Explosion(bot.x, bot.y));

        // Note: Next spawn check will spawn a new bot if under MAX_COUNT
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

    handleFireInput(socket, toggle) {
        // Check if player is still connected
        if (this.players[socket.id]) {
            this.players[socket.id].updateFireToggle(toggle);
        }
    }

    /**
     * Sends out map updates, independent of game updates
     */
    update_map() {
        const playerLocations = [];
        // Include both players and bots in map
        Object.keys(this.players).forEach(playerID => {
            playerLocations.push(this.players[playerID].serializeForMapUpdate());
        });
        Object.keys(this.bots).forEach(botID => {
            playerLocations.push(this.bots[botID].serializeForMapUpdate());
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

        // === BOT SPAWN CHECK (every 5 seconds) ===
        this.botSpawnTimer += dt;
        if (this.botSpawnTimer >= Constants.BOT_CONFIG.SPAWN_CHECK_INTERVAL / 1000) {
            this.botSpawnTimer = 0;
            this.checkBotSpawning();
        }

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
            const newBullets = player.update(dt);
            if (newBullets) {
                // Handle both single bullet and array of bullets (crown powerup)
                if (Array.isArray(newBullets)) {
                    this.bullets.push(...newBullets);
                } else {
                    this.bullets.push(newBullets);
                }
            }

            // Update player timed effects
            player.updateTimedEffects(now);

            if (this.shouldSendLeaderboard == 0) {
                this.leaderboard.updatePlayerScore(playerID, player.username, player.score);
            }
        });

        // === UPDATE BOTS ===
        const allTanks = { ...this.players, ...this.bots };
        Object.values(this.bots).forEach(bot => {
            // Update AI (decision making)
            bot.updateAI(allTanks, this.obstacles, Constants.MAP_SIZE);

            // Update tank physics and get bullets
            const newBullets = bot.update(dt);
            if (newBullets) {
                // Handle both single bullet and array of bullets (crown powerup)
                if (Array.isArray(newBullets)) {
                    this.bullets.push(...newBullets);
                } else {
                    this.bullets.push(newBullets);
                }
            }

            // Update bot timed effects
            bot.updateTimedEffects(now);

            // Update bot in leaderboard
            if (this.shouldSendLeaderboard == 0) {
                this.leaderboard.updatePlayerScore(bot.id, bot.username, bot.score);
            }
        });

        // Check for collisions (combine players and bots)
        const allTanksArray = [...Object.values(this.players), ...Object.values(this.bots)];
        const destroyedEntities = applyCollisions(
            allTanksArray,
            this.bullets,
            this.obstacles,
            this.crowns,
            this.powerups
        );

        destroyedEntities.bulletsHit.forEach(bullet => {
            // Check if shooter is a player
            if (this.players[bullet.parentID]) {
                this.players[bullet.parentID].onDealtDamage()
                if (this.shouldSendLeaderboard == 0) {
                    this.leaderboard.updatePlayerScore(bullet.parentID,
                        this.players[bullet.parentID].username, this.players[bullet.parentID].score);
                }
            }
            // Check if shooter is a bot
            else if (this.bots[bullet.parentID]) {
                this.bots[bullet.parentID].onDealtDamage()
                if (this.shouldSendLeaderboard == 0) {
                    this.leaderboard.updatePlayerScore(bullet.parentID,
                        this.bots[bullet.parentID].username, this.bots[bullet.parentID].score);
                }
            }
        });

        this.bullets = destroyedEntities.updatedBullets;

        // Process collected crowns (emit events for VFX/SFX)
        destroyedEntities.crownsCaptured.forEach(({ crown, playerId }) => {
            // Remove crown from game
            this.crowns = this.crowns.filter(c => c !== crown);

            // Emit collection event to player for VFX/SFX
            const socket = this.sockets[playerId];
            const player = this.players[playerId];
            if (socket) {
                socket.emit(Constants.MSG_TYPES.CROWN_COLLECTED, {
                    x: crown.x,
                    y: crown.y,
                    powerupType: crown.id
                });

                // Broadcast crown pickup event to all players
                if (player) {
                    this.broadcastEvent(Constants.EVENT_TYPES.CROWN_PICKUP, {
                        player: player.username
                    });
                }
            }
        });

        // Process collected powerups
        destroyedEntities.powerupsCollected.forEach(({ powerup, playerId, result }) => {
            // Remove powerup from game
            this.powerups = this.powerups.filter(p => p.id !== powerup.id);

            // Emit collection event to player for VFX/SFX
            const socket = this.sockets[playerId];
            if (socket) {
                socket.emit(Constants.MSG_TYPES.POWERUP_COLLECTED, {
                    x: powerup.x,
                    y: powerup.y,
                    type: powerup.type,
                    result: result
                });
            }
        });

        // Check for dead players
        Object.keys(this.sockets).forEach(playerID => {
            const socket = this.sockets[playerID];
            const player = this.players[playerID];

            if (player.hp <= 0) {
                /* Restore the health of player/bot who killed */
                if(player.lastHitByPlayer) {
                    const killedByPlayer = this.players[player.lastHitByPlayer];
                    const killedByBot = this.bots[player.lastHitByPlayer];
                    const killer = killedByPlayer || killedByBot;

                    if (killer) {
                        killer.hp = Constants.PLAYER_MAX_HP;

                        // Broadcast kill event (player killed by another player/bot)
                        this.broadcastEvent(Constants.EVENT_TYPES.PLAYER_KILL, {
                            killer: killer.username,
                            victim: player.username
                        });
                    }
                } else {
                    // Broadcast death event (player died to obstacle/environment)
                    this.broadcastEvent(Constants.EVENT_TYPES.PLAYER_DEATH, {
                        victim: player.username
                    });
                }

                socket.emit(Constants.MSG_TYPES.GAME_OVER);
                this.removePlayer(socket);
                this.explosions.push(new Explosion(player.x, player.y));
            }
        });

        // Check for dead bots
        Object.keys(this.bots).forEach(botID => {
            const bot = this.bots[botID];

            if (bot.hp <= 0) {
                /* Restore the health of player/bot who killed */
                if(bot.lastHitByPlayer) {
                    const killedByPlayer = this.players[bot.lastHitByPlayer];
                    const killedByBot = this.bots[bot.lastHitByPlayer];
                    const killer = killedByPlayer || killedByBot;

                    if (killer) {
                        killer.hp = Constants.PLAYER_MAX_HP;
                    }
                }

                // Handle bot death (removes bot and creates explosion)
                this.handleBotDeath(botID);
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

        // Spawn powerups (unified system for all types)
        Object.keys(Constants.POWERUP_CONFIGS).forEach(type => {
            this.checkAndSpawnPowerup(type, now);
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

        //console.log(`Time to run update = ${(Date.now() - now)}`);
    }

    createUpdate(player) {
        // Include both players and bots as "others"
        const nearbyPlayers = Object.values(this.players).filter(
            p => p !== player && p.distanceTo(player) <= Constants.MAP_SIZE / 2
        );

        const nearbyBots = Object.values(this.bots).filter(
            b => b.distanceTo(player) <= Constants.MAP_SIZE / 2
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

        const nearbyPowerups = this.powerups.filter(
            p => player.distanceTo(p) <= Constants.MAP_SIZE / 2
        )

        return {
            t: Date.now(),
            me: player.serializeForUpdate(),
            others: [...nearbyPlayers, ...nearbyBots].map(p => p.serializeForUpdate()),
            bullets: nearbyBullets.map(b => b.serializeForUpdate()),
            explosions: nearbyExplosions.map(e => e.serializeForUpdate()),
            crowns: nearbyCrowns.map(c => c.serializeForUpdate()),
            powerups: nearbyPowerups.map(p => p.serializeForUpdate()),
        }
    }

    checkAndSpawnPowerup(type, currentTime) {
        const config = Constants.POWERUP_CONFIGS[type];
        const count = this.powerups.filter(p => p.type === type).length;

        if (currentTime - this.lastPowerupSpawn[type] >= config.spawnInterval &&
            count < config.maxActive) {
            this.spawnPowerup(type);
            this.lastPowerupSpawn[type] = currentTime;
        }
    }

    spawnPowerup(type) {
        const config = Constants.POWERUP_CONFIGS[type];
        const margin = config.spawnMargin;
        const maxPos = Constants.MAP_SIZE - margin;

        // Random position avoiding edges
        const x = margin + Math.random() * (maxPos - margin);
        const y = margin + Math.random() * (maxPos - margin);

        const id = `${type}_${Date.now()}_${Math.random()}`;
        this.powerups.push(new Powerup(id, x, y, type));
    }
}

module.exports = Game;