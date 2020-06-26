
// Constants shared by both client and server

module.exports = Object.freeze({
    PLAYER_RADIUS: 30,
    PLAYER_MAX_HP: 100,
    PLAYER_SPEED: 300,
    PLAYER_FIRE_COOLDOWN: 0.25,

    BULLET_RADIUS: 3,
    BULLET_SPEED: 800,
    BULLET_DAMAGE: 10,

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
});