
// Constants shared by both client and server

module.exports = Object.freeze({
    PLAYER_RADIUS: 40,
    PLAYER_MAX_HP: 100,
    PLAYER_SPEED: 300,
    PLAYER_FIRE_COOLDOWN: 0.25,

    BULLET_RADIUS: 3,
    BULLET_SPEED: 800,
    BULLET_DAMAGE: 10,

    EXPLOSION_RADIUS: 60,

    SCORE_BULLET_HIT: 20,
    SCORE_PER_SECOND: 1,

    RENDER_DELAY: 100,

    MAP_SIZE: 3000,
    NAV_MAP_SIZE: 100,

    MSG_TYPES: {
        JOIN_GAME: 'join_game',
        GAME_UPDATE: 'update',
        INPUT: {
            MOUSE: 'mouse_input',
            KEY: 'keydown_input'
        },
        GAME_OVER: 'dead',
        LEADERBOARD_UPDATE: 'leaderboard_update',
        MAP_UPDATE: 'map_update',
    },

    KEY: {
        LEFT: 37,
        RIGHT: 39
    },

    LEADERBOARD_SIZE: 5,

    TANK: {
        BLUE: 0,
        RED: 1,
    },

    SPRITES: {
        TANK_RED: "TankRed.png",
        TANK_BLUE: "TankBlue.png",
        TURRET_RED: "TurretRed.png",
        TURRET_BLUE: "TurretBlue.png",
        BULLET: "bullet.svg",
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
});