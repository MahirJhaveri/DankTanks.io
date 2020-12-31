
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
        GRAY: 3
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
        BULLET: "bullet.svg",
        LASERBEAM: "LaserBeam.png",
        MISSILE: "Missile.png",
        CROWN: "crown.png",
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