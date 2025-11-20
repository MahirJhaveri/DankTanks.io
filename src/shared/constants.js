
// Constants shared by both client and server

// ============================================================================
// MAP SIZE CONFIGURATION
// ============================================================================
// To adjust the map size, simply change the MAP_SIZE constant below.
// All obstacles will automatically scale to the new size.
//
// Recommended sizes:
//   3000 (original) - Good for 1-3 players
//   4000 - Comfortable for 3-5 players
//   4500 (current) - Spacious for 4-7 players
//   5000+ - Large battles with 5-8+ players
//
// Note: Obstacles are defined as relative coordinates (0.0-1.0) and
// automatically scaled to MAP_SIZE, making future adjustments easy.
// ============================================================================

const MAP_SIZE = 4500;

// Obstacles defined as relative coordinates (0.0 to 1.0)
// These are automatically scaled to MAP_SIZE for easy map size adjustments
const OBSTACLES_RELATIVE = [
    [[0.1667, 0.1667], [0.2667, 0.0667], [0.3, 0.2333], [0.2, 0.2], [0.1667, 0.1667]],
    [[0.6667, 0.6667], [0.7333, 0.7333], [0.8, 0.6667], [0.7667, 0.6], [0.6667, 0.6667]],
    [[0.7, 0.3667], [0.7, 0.3], [0.67, 0.2333], [0.6, 0.3], [0.6167, 0.3667], [0.6633, 0.4], [0.7, 0.3667]],
    [[0.1333, 0.5667], [0.1833, 0.6333], [0.2333, 0.6], [0.2, 0.3], [0.1333, 0.5667]],
];

// Scale obstacles to actual map size
const OBSTACLES = OBSTACLES_RELATIVE.map(relativeVertices =>
    relativeVertices.map(vertex => [vertex[0] * MAP_SIZE, vertex[1] * MAP_SIZE])
);

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

    // Bot configuration
    BOT_CONFIG: {
        MAX_COUNT: 1,                    // Number of simultaneous bots (easy to increase later)
        RESPAWN_DELAY: 5000,             // Not used directly, implicit in spawn check interval
        SPAWN_CHECK_INTERVAL: 5000,      // Check for spawning every 5 seconds
        ATTACK_RADIUS: 500,              // Distance (px) to detect and shoot at players
        AIM_INACCURACY: 0.20,            // ±0.15 radians (~8.6 degrees) for human-like aim
        DIRECTION_CHANGE_CHANCE: 0.02,   // 2% chance per frame to randomly change direction
        OBSTACLE_LOOKAHEAD: 150,         // Distance (px) to check for obstacles ahead
        BOUNDARY_MARGIN: 100,            // Distance (px) from map edge to trigger turn

        NAMES: [
            'Tank', 'Blaze', 'Nova', 'Rex', 'Zara', 'Ace', 'Max', 'Luna',
            'Bolt', 'Dash', 'Echo', 'Finn', 'Ghost', 'Hawk', 'Iron', 'Jet',
            'Pyro', 'Radar', 'Scout', 'Turbo', 'Viper', 'Wolf', 'Zen', 'Apex',
            'Blitz', 'Comet', 'Dagger', 'Ember', 'Flash', 'Grit', 'Hunter'
        ]
    },

    // Smoke effect constants
    SMOKE_PARTICLE_COLOR: '60, 60, 60', // Dark gray RGB
    SMOKE_PARTICLE_LIFESPAN: 1, // seconds
    SMOKE_PARTICLE_DENSITY: 3, // particles per emission
    SMOKE_PARTICLE_SPEED: 80, // base speed in pixels/second
    SMOKE_SPAWN_DISTANCE: 10, // min pixels moved to emit smoke

    // Trail mark constants
    TRAIL_MARK_LIFESPAN: 0.75, // seconds
    TRAIL_MARK_WIDTH: 8, // pixels
    TRAIL_MARK_LENGTH: 15, // pixels
    TRAIL_MARK_SPAWN_DISTANCE: 15, // min pixels moved to emit trail mark
    TRAIL_MARK_TREAD_OFFSET: 30, // pixels from tank center to tread
    TRAIL_MARK_MAX_COUNT: 500, // performance limit
    TRAIL_MARK_COLOR: '200, 200, 200', // dark gray RGB

    // Command Center Background constants
    COMMAND_CENTER_BG: {
        GRID_SIZE: 50, // Grid cell size in pixels
        GRID_COLOR: 'rgba(0, 255, 100, 0.15)', // Green grid lines
        SCANLINE_COLOR: 'rgba(0, 255, 100, 0.3)', // Brighter green for scanlines
        SCANLINE_WIDTH: 3, // Thickness of scanline
        SCANLINE_SPEED: 80, // Pixels per second
        SCANLINE_INTERVAL: 3000, // Time between scanlines in ms
        ACCENT_COLOR: 'rgba(255, 200, 0, 0.2)', // Amber accent
        FLICKER_INTENSITY: 0.05, // Amount of random flicker (0-1)

        // Radar sweep
        RADAR_RADIUS: 80, // Radar circle radius
        RADAR_POSITION: { x: 120, y: 120 }, // Top-left position
        RADAR_SWEEP_SPEED: 1.5, // Radians per second
        RADAR_BLIP_COUNT: 8, // Number of random blips
        RADAR_RING_INTERVAL: 2000, // Pulse ring every 2 seconds
        RADAR_COLOR: 'rgba(0, 255, 100, 0.6)',
        RADAR_SWEEP_COLOR: 'rgba(0, 255, 100, 0.4)',
        RADAR_BLIP_COLOR: 'rgba(255, 100, 0, 0.8)',

        // Tactical data displays
        DATA_UPDATE_INTERVAL: 2000, // Update stats every 2 seconds
        COORD_UPDATE_INTERVAL: 100, // Update coordinates frequently
        TEXT_COLOR: 'rgba(0, 255, 100, 0.7)',
        TEXT_SIZE: 12,
    },

    SCORE_BULLET_HIT: 20,
    SCORE_PER_SECOND: 1,

    RENDER_DELAY: 120,

    MAP_SIZE: MAP_SIZE,
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
        EVENT_NOTIFICATION: 'event_notification',
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

    TANK_NAMES: {
        0: "Blue Steel",
        1: "Cherry Bomber",
        2: "Green Machine",
        3: "Iron Giant",
        4: "Star Spangled Slammer"
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
        BACKGROUND_DESERT: "background.png",
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
    CROWN_DOUBLE_SHOT_SPREAD: 0.05, // Angle spread in radians for visual separation

    // Event notification types
    EVENT_TYPES: {
        PLAYER_KILL: 'player_kill',
        PLAYER_JOIN: 'player_join',
        PLAYER_DEATH: 'player_death',
        CROWN_PICKUP: 'crown_pickup',
        CROWN_DROP: 'crown_drop',
    },

    // Event notification durations (in milliseconds)
    NOTIFICATION_DURATIONS: {
        PLAYER_KILL: 3000,      // 3 seconds
        PLAYER_JOIN: 2500,      // 2.5 seconds
        PLAYER_DEATH: 2500,     // 2.5 seconds
        CROWN_PICKUP: -1,       // Persistent (never auto-hide)
        CROWN_DROP: 3000,       // 3 seconds
    },

    // Obstacles (auto-scaled from OBSTACLES_RELATIVE defined at top of file)
    OBSTACLES: OBSTACLES,
});