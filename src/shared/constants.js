
// Constants shared by both client and server

module.exports = Object.freeze({
    PLAYER_RADIUS: 40,
    PLAYER_MAX_HP: 100,
    PLAYER_SPEED: 500,
    PLAYER_FIRE_COOLDOWN: 0.25,

    BULLET_RADIUS: 5,
    BULLET_SPEED: 1000,
    BULLET_DAMAGE: 10,

    EXPLOSION_RADIUS: 60,

    CROWN_RADIUS: 30,

    HEALTH_PACK_RADIUS: 25,
    HEALTH_PACK_HEAL: 50,
    HEALTH_PACK_MAX_ACTIVE: 3,
    HEALTH_PACK_SPAWN_INTERVAL: 20000, // 20 seconds in ms
    HEALTH_PACK_SPAWN_MARGIN: 100, // Distance from edges

    // Unified powerup configuration
    POWERUP_CONFIGS: {
        health: {
            radius: 25,
            healAmount: 50,
            maxActive: 3,
            spawnInterval: 20000, // 20 seconds
            spawnMargin: 100,
            sprite: 'healthpack.svg',
            collectSound: 'HEALTH_PICKUP',
            particleColor: '0, 255, 0', // Green
        },
        shield: {
            radius: 25,
            duration: 10, // 10 second shield
            maxActive: 5,
            spawnInterval: 20000, // 20 seconds
            spawnMargin: 100,
            sprite: 'shieldpack.svg',
            collectSound: 'SHIELD_PICKUP',
            particleColor: '0, 217, 255', // Cyan
        },
        speed: {
            radius: 25,
            speedMultiplier: 1.5, // 1.5x normal speed
            duration: 10, // 10 second boost
            maxActive: 3, // Max 3 on map
            spawnInterval: 20000, // 20 seconds minimum
            spawnMargin: 100,
            sprite: 'speedpack.svg',
            collectSound: 'SPEED_PICKUP',
            particleColor: '255, 165, 0', // Orange
        },
    },

    // Smoke effect constants
    SMOKE_PARTICLE_COLOR: '60, 60, 60', // Dark gray RGB
    SMOKE_PARTICLE_LIFESPAN: 1, // seconds
    SMOKE_PARTICLE_DENSITY: 3, // particles per emission
    SMOKE_PARTICLE_SPEED: 80, // base speed in pixels/second
    SMOKE_SPAWN_DISTANCE: 10, // min pixels moved to emit smoke

    SCORE_BULLET_HIT: 20,
    SCORE_PER_SECOND: 1,

    RENDER_DELAY: 120,

    MAP_SIZE: 3000,
    NAV_MAP_SIZE: 100,

    MSG_TYPES: {
        JOIN_GAME: 'join_game',
        GAME_UPDATE: 'update',
        INPUT: {
            MOUSE: 'mouse_input',
            KEY: 'keydown_input',
            FIRE: 'mouse_fire'
        },
        GAME_OVER: 'dead',
        LEADERBOARD_UPDATE: 'leaderboard_update',
        MAP_UPDATE: 'map_update',
        HEALTH_PACK_COLLECTED: 'health_pack_collected',
        CROWN_COLLECTED: 'crown_collected',
        POWERUP_COLLECTED: 'powerup_collected',
    },

    KEY: {
        LEFT: 1.5,
        UP: 0,
        RIGHT: 0.5,
        DOWN: 1
    },

    LEADERBOARD_SIZE: 5,

    TANK: {
        BLUE: 0,
        RED: 1,
        GREEN: 2,
        GRAY: 3,
        USA: 4
    },

    SPRITES: {
        TANK_RED: "TankRed.png",
        TURRET_RED: "TurretRed.png",
        TANK_BLUE: "TankBlue.png",
        TURRET_BLUE: "TurretBlue.png",
        TANK_GREEN: "TankGreen.png",
        TURRET_GREEN: "TurretGreen.png",
        TANK_GRAY: "TankGray.png",
        TURRET_GRAY: "TurretGray.png",
        TANK_USA: "TankUSA.png",
        TURRET_USA: "TurretUSA.png",
        BULLET: "bullet.svg",
        LASERBEAM: "LaserBeam.png",
        MISSILE: "Missile.png",
        CROWN: "crown.png",
        HEALTH_PACK: "healthpack.svg",
        SHIELD_PACK: "shieldpack.svg",
        SPEED_PACK: "speedpack.svg",
        EXPLOSION: {
            STATE1: "explosions/explosion1.png",
            STATE2: "explosions/explosion2.png",
            STATE3: "explosions/explosion3.png",
            STATE4: "explosions/explosion4.png",
            STATE5: "explosions/explosion5.png",
            STATE6: "explosions/explosion6.png",
            STATE7: "explosions/explosion7.png",
            STATE8: "explosions/explosion8.png",
        },
    },

    CROWN_POWERUP: {
        RAPID_FIRE: "rapidfire",
    },

    RAPID_FIRE_BULLET_SPEED: 1500,
    RAPID_FIRE_COOLDOWN: 0.2,

    OBSTACLES: [
        [[500,500], [800, 200], [900, 700], [600, 600], [500, 500]],
        [[2000, 2000], [2200, 2200], [2400, 2000], [2300, 1800], [2000, 2000],],
        [[2100, 1100],[2100, 900],[2010, 700],[1800, 900],[1850, 1100],[1990, 1200],[2100, 1100],],
        [[400,1700],[550, 1900],[700, 1800],[600,900],[400,1700]],
    ],
});