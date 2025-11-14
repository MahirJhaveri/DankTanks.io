# CLAUDE.md - AI Assistant Guide for DankTanks.io

> **Last Updated:** 2025-11-14
> **Purpose:** Comprehensive guide for AI assistants working on the DankTanks.io multiplayer tank game

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture & Technology Stack](#architecture--technology-stack)
3. [Directory Structure](#directory-structure)
4. [Code Organization & Conventions](#code-organization--conventions)
5. [Development Workflows](#development-workflows)
6. [Key Files Reference](#key-files-reference)
7. [Common Tasks & Patterns](#common-tasks--patterns)
8. [Testing & Quality Assurance](#testing--quality-assurance)
9. [Deployment Process](#deployment-process)
10. [AI Assistant Best Practices](#ai-assistant-best-practices)

---

## Project Overview

**DankTanks.io** is a real-time multiplayer 2D tank battle game where players compete for the top leaderboard position by destroying opponents and surviving. The game features:

- **Real-time multiplayer** using WebSockets (Socket.IO)
- **Authoritative server architecture** (all game logic server-side to prevent cheating)
- **Client-side prediction** with state interpolation for smooth 60 FPS gameplay
- **Multiple powerups** (Health, Shield, Speed, Crown with rapid-fire)
- **Visual effects** (particles, trail marks, explosions, themes)
- **Procedural audio** (Web Audio API, no audio files)
- **Live deployment:** https://danktanks-io.fly.dev/

### Key Metrics

- **Total Codebase:** ~3,263 lines of JavaScript
- **Server-side:** ~1,300 lines (Node.js/Express/Socket.IO)
- **Client-side:** ~1,600 lines (Vanilla ES6 JavaScript)
- **Shared Code:** 200+ lines (constants, themes)
- **Module Count:** 28 JavaScript files

---

## Architecture & Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 18+ | Runtime environment |
| Express | 4.17.1 | Web server framework |
| Socket.IO | 2.3.0 | Real-time bidirectional communication |
| shortid | 2.2.15 | Unique player ID generation |
| lodash | 4.17.15 | Utility functions |

### Frontend

| Technology | Purpose |
|------------|---------|
| Vanilla JavaScript | ES6+ with Babel transpilation |
| HTML5 Canvas | 2D rendering (double buffering) |
| Bootstrap 4 | CSS styling (no JS components) |
| Socket.IO Client | WebSocket communication |
| Web Audio API | Procedural sound effects |

### Build Tools

| Tool | Purpose |
|------|---------|
| Webpack 4 | Module bundling |
| Babel | ES6+ transpilation |
| ESLint | Code linting (Airbnb style guide) |
| Jest | Testing framework (configured, no tests yet) |
| cross-env | Cross-platform environment variables |

### Deployment

| Component | Details |
|-----------|---------|
| Containerization | Docker (Node.js 18-Alpine) |
| Hosting | Fly.io (1 CPU, 1GB RAM) |
| Region | IAD (US East) |
| Protocol | HTTPS with WebSocket (wss://) |

---

## Directory Structure

```
/home/user/DankTanks.io/
├── src/
│   ├── client/               # Client-side code (browser)
│   │   ├── scripts/         # JavaScript modules (12 files)
│   │   │   ├── index.js            # Entry point, asset loading
│   │   │   ├── render.js           # Canvas rendering (519 lines)
│   │   │   ├── state.js            # State management & interpolation
│   │   │   ├── networking.js       # Socket.IO client
│   │   │   ├── input.js            # Keyboard/mouse handling
│   │   │   ├── assets.js           # Asset preloading
│   │   │   ├── leaderboard.js      # Leaderboard UI
│   │   │   ├── map.js              # Mini-map rendering
│   │   │   ├── playMenu.js         # Tank selection UI
│   │   │   ├── particles.js        # Particle system
│   │   │   ├── audio.js            # Sound effects
│   │   │   └── trailMarks.js       # Tank trail effects
│   │   ├── css/
│   │   │   └── main.css            # Game styling
│   │   └── html/
│   │       └── index.html          # HTML template
│   │
│   ├── server/              # Server-side code (Node.js)
│   │   ├── server.js               # Express + Socket.IO setup (entry point)
│   │   ├── game.js                 # Game loop orchestrator (314 lines)
│   │   ├── player.js               # Player entity (225 lines)
│   │   ├── bullet.js               # Projectile entity
│   │   ├── collisions.js           # Collision detection system
│   │   ├── leaderboard.js          # Leaderboard management
│   │   ├── explosion.js            # Explosion animations
│   │   ├── entity.js               # Base entity class
│   │   ├── dynamicEntity.js        # Movable entity base
│   │   ├── obstacle.js             # Static obstacles
│   │   ├── crown.js                # Crown powerup
│   │   ├── powerup.js              # Generic powerup system (84 lines)
│   │   ├── timedEffect.js          # Duration-based effects
│   │   └── utils/
│   │       └── sat.js              # SAT collision algorithm
│   │
│   └── shared/              # Shared constants (client & server)
│       ├── constants.js            # Game parameters, sprites, configs
│       └── theme.js                # 4 visual themes (Classic, Desert, Arctic, Neon)
│
├── public/
│   └── assets/              # Game sprites & images
│       ├── Tank*.png               # 5 tank colors (Blue, Red, Green, Gray, USA)
│       ├── Turret*.png             # 5 turret sprites
│       ├── healthpack.svg          # Health powerup
│       ├── shieldpack.svg          # Shield powerup
│       ├── speedpack.svg           # Speed powerup
│       ├── crown.png               # Crown powerup
│       ├── bullet.svg              # Bullet sprite
│       └── explosions/             # 8 explosion frames
│
├── dist/                    # Compiled output (generated, not in git)
├── docs/                    # Developer documentation
│   ├── danktanks_design.md        # Architecture details
│   ├── hosting_strategy.md        # Deployment info
│   └── phaser_evaluation.md       # Framework comparison
│
├── webpack.common.js        # Base webpack config
├── webpack.dev.js           # Development config
├── webpack.prod.js          # Production config (minification)
├── package.json             # Dependencies & scripts
├── Dockerfile               # Docker containerization
├── fly.toml                 # Fly.io deployment config
├── .gitignore               # Git ignore (node_modules, dist)
└── README.md                # User-facing documentation
```

---

## Code Organization & Conventions

### File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Server classes | camelCase | `player.js`, `dynamicEntity.js` |
| Client modules | camelCase | `render.js`, `networking.js` |
| Config files | kebab-case | `webpack.common.js` |
| Assets | PascalCase or lowercase | `TankBlue.png`, `healthpack.svg` |

### Module System

- **Server:** CommonJS (`module.exports`, `require()`)
- **Client:** ES6 Modules (`export`, `import`)
- **Shared:** CommonJS with `Object.freeze()` for immutability

### Class Hierarchy (Server-Side OOP)

```
Entity (base class)
├── DynamicEntity (adds position, velocity)
│   ├── Player (controls, firing, health)
│   ├── Bullet (projectile physics)
│   └── Explosion (animation states)
├── Obstacle (static polygons)
├── Crown (powerup)
└── Powerup (generic: health/shield/speed)
```

### Client-Side Patterns

- **Functional programming** approach (no classes)
- **Modular exports** with named functions
- **State management:** Pure state updates with interpolation
- **Rendering:** Stateless render functions operating on game state
- **Event-driven:** Input handlers with debouncing

### Constants & Configuration

All game parameters are centralized in `src/shared/constants.js`:

- **Frozen objects** to prevent accidental mutations
- **Uppercase naming** for enums (e.g., `MSG_TYPES.GAME_UPDATE`)
- **Nested objects** for related constants (e.g., `POWERUP_CONFIGS`)
- **Shared between client and server** for consistency

Example:
```javascript
module.exports = Object.freeze({
    PLAYER_RADIUS: 40,
    PLAYER_MAX_HP: 100,
    PLAYER_SPEED: 500,
    MAP_SIZE: 3000,
    // ...
});
```

### Message Types (Socket.IO Events)

Defined in `constants.js` under `MSG_TYPES`:

```javascript
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
    POWERUP_COLLECTED: 'powerup_collected',
    // ...
}
```

### Code Style

- **ESLint:** Airbnb base configuration
- **Indentation:** 2 spaces (not tabs)
- **Semicolons:** Required
- **Quotes:** Single quotes preferred
- **Line length:** No strict limit, but keep readable
- **Comments:** Use JSDoc-style for functions, inline for complex logic

---

## Development Workflows

### Local Development

```bash
# Install dependencies
npm install

# Start development server (http://localhost:3000)
npm run develop

# Webpack dev middleware with hot reload
# Server watches for changes and restarts automatically
```

### Production Build

```bash
# Build optimized bundle
npm run build

# Start production server
npm start

# Output goes to /dist folder
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Clean dist folder
npm run clean

# Run tests (currently no tests)
npm test
```

### Git Workflow

1. **Branch naming:** Use feature branches (e.g., `claude/feature-name-xyz123`)
2. **Commit messages:** Descriptive, present tense (e.g., "Add shield powerup")
3. **Pull requests:** Include PR number in commit (e.g., "Add feature (#92)")
4. **Recent patterns:** Features are added incrementally with focused PRs

Example commit history pattern:
```
Add tank trail marks feature for enhanced visual feedback (#92)
Add double-shot feature for crown powerup (#90)
Add speed powerup feature (#89)
Add golden pulsating ring effect for crown powerup (#87)
```

---

## Key Files Reference

### Critical Files (Read First)

| File | Lines | Purpose | When to Modify |
|------|-------|---------|----------------|
| `src/shared/constants.js` | 160 | Game parameters, sprites, configs | Adding features, balancing |
| `src/server/game.js` | 314 | Game loop, entity management | Core game mechanics |
| `src/server/player.js` | 225 | Player behavior, movement, firing | Player abilities |
| `src/client/scripts/render.js` | 519 | Canvas rendering engine | Visual changes |
| `src/server/collisions.js` | 150+ | Collision detection (SAT) | Physics changes |

### Entry Points

- **Server:** `src/server/server.js` (Express + Socket.IO setup)
- **Client:** `src/client/scripts/index.js` (initialization, asset loading)

### Configuration Files

- **Webpack:** `webpack.common.js`, `webpack.dev.js`, `webpack.prod.js`
- **Docker:** `Dockerfile` (Node.js 18-Alpine multi-stage build)
- **Deployment:** `fly.toml` (Fly.io configuration)
- **Dependencies:** `package.json` (npm scripts and dependencies)

---

## Common Tasks & Patterns

### Adding a New Powerup

1. **Define constants** in `src/shared/constants.js`:
   ```javascript
   POWERUP_CONFIGS: {
       newPowerup: {
           radius: 25,
           duration: 10,
           maxActive: 3,
           spawnInterval: 20000,
           sprite: 'newpowerup.svg',
           collectSound: 'NEW_PICKUP',
           particleColor: '255, 0, 0', // Red RGB
       }
   }
   ```

2. **Add sprite** to `public/assets/newpowerup.svg`

3. **Update server** in `src/server/powerup.js`:
   - Add spawn logic in `game.js`
   - Add collision detection in `collisions.js`
   - Add effect application in `player.js`

4. **Update client** in `src/client/scripts/`:
   - Add rendering in `render.js`
   - Add sound in `audio.js`
   - Add particle effect in `particles.js`

### Adding a New Visual Effect

1. **Client-side only** (particles, trails):
   - Add constants to `src/shared/constants.js`
   - Implement in `src/client/scripts/particles.js` or new module
   - Call from `render.js` during render loop

2. **Server-side state** (explosions):
   - Create entity class in `src/server/`
   - Update `game.js` to manage lifecycle
   - Render in `src/client/scripts/render.js`

### Modifying Game Balance

1. **Edit `src/shared/constants.js`**:
   ```javascript
   PLAYER_SPEED: 500,           // Movement speed
   PLAYER_FIRE_COOLDOWN: 0.25,  // Time between shots
   BULLET_DAMAGE: 10,            // Damage per hit
   SCORE_BULLET_HIT: 20,         // Points per kill
   ```

2. **No build required for development** (webpack dev middleware auto-reloads)
3. **Rebuild for production:** `npm run build`

### Adding a New Theme

1. **Edit `src/shared/theme.js`**:
   ```javascript
   THEMES: {
       NEW_THEME: {
           background: '#RRGGBB',
           grid: '#RRGGBB',
           obstacles: '#RRGGBB',
           // ...
       }
   }
   ```

2. **Update client UI** in `src/client/html/index.html` (add theme selector)
3. **Theme applies automatically** via `render.js`

### Debugging

1. **Server logs:** `console.log()` outputs to terminal
2. **Client logs:** Use browser DevTools console
3. **Network inspection:** Browser DevTools → Network → WS (WebSocket)
4. **State inspection:** Add `console.log()` in `src/client/scripts/state.js`

### Performance Optimization

- **Server:** Game loop runs at 60 FPS (16.67ms per tick)
- **Client:** Double buffering prevents canvas flicker
- **Network:** State updates sent every frame, leaderboard every 4 frames
- **Collision caching:** SAT normals cached in `collisions.js`
- **Particle pooling:** Reuse particle objects in `particles.js`

---

## Testing & Quality Assurance

### Current State

- **ESLint:** Configured with Airbnb style guide
- **Jest:** Configured but **no tests written yet**
- **Manual testing:** Required for all changes

### Testing Checklist (Manual)

When adding features, test:

1. **Single player:** Core functionality works
2. **Multiplayer:** 2+ clients can connect and interact
3. **Network:** No desync, smooth interpolation
4. **Collision:** Bullets, obstacles, powerups work correctly
5. **UI:** Leaderboard, mini-map, menus update properly
6. **Cross-browser:** Test in Chrome, Firefox, Safari
7. **Mobile:** Responsive design (though game is desktop-focused)

### Future Testing (Recommendations for AI Assistants)

If asked to add tests:

1. **Unit tests** for core logic:
   - `src/server/collisions.js` (SAT algorithm)
   - `src/server/player.js` (movement, firing)
   - `src/client/scripts/state.js` (interpolation)

2. **Integration tests** for Socket.IO:
   - Connection/disconnection
   - Message passing
   - Multi-client scenarios

3. **Example test structure:**
   ```javascript
   // tests/server/collisions.test.js
   const { circleCircle } = require('../src/server/collisions');

   test('detects collision between overlapping circles', () => {
       const result = circleCircle(0, 0, 10, 5, 0, 10);
       expect(result).toBe(true);
   });
   ```

---

## Deployment Process

### Docker Build

```bash
# Build Docker image
docker build -t danktanks .

# Run locally in Docker
docker run -p 3000:3000 danktanks
```

Dockerfile stages:
1. Copy `package*.json`
2. `npm install` (production dependencies)
3. Copy source code
4. `npm run build` (Webpack production bundle)
5. `CMD ["npm", "start"]` (runs Express server)

### Fly.io Deployment

```bash
# Deploy to Fly.io
fly deploy

# View logs
fly logs

# Open in browser
fly open
```

Configuration (`fly.toml`):
- **App name:** danktanks-io
- **Region:** iad (US East)
- **Port:** 3000 (internal), 443/80 (external)
- **Resources:** 1 shared CPU, 1GB RAM
- **Auto-scaling:** 0-N machines

### Deployment Checklist

1. **Test locally:** `npm run develop`
2. **Build production:** `npm run build`
3. **Test production build:** `npm start`
4. **Commit changes:** `git add . && git commit -m "..."`
5. **Push to branch:** `git push -u origin <branch-name>`
6. **Create PR:** `gh pr create --title "..." --body "..."`
7. **Merge to main:** After review
8. **Deploy:** `fly deploy` (or automatic CI/CD)

---

## AI Assistant Best Practices

### General Guidelines

1. **Read before modifying:**
   - Always read existing files before editing
   - Check `src/shared/constants.js` for existing constants
   - Review recent commits to understand patterns

2. **Maintain consistency:**
   - Follow existing naming conventions
   - Match code style of surrounding code
   - Use ESLint to validate changes

3. **Test incrementally:**
   - Make small, focused changes
   - Test after each modification
   - Run `npm run develop` to verify

4. **Document changes:**
   - Add comments for complex logic
   - Update this CLAUDE.md if architecture changes
   - Write clear commit messages

### Feature Development Workflow

When adding a new feature:

1. **Understand the request:**
   - Clarify requirements with user
   - Identify affected files
   - Check for similar existing features

2. **Plan the implementation:**
   - List files to modify
   - Identify dependencies
   - Consider edge cases

3. **Server-side first:**
   - Add constants to `src/shared/constants.js`
   - Implement server logic (game mechanics)
   - Test with `console.log()` debugging

4. **Client-side second:**
   - Add rendering in `src/client/scripts/render.js`
   - Add UI elements if needed
   - Add sound/visual effects

5. **Integration:**
   - Test multiplayer scenarios
   - Check for race conditions
   - Verify network sync

6. **Polish:**
   - Run ESLint: `npm run lint`
   - Test edge cases
   - Optimize performance if needed

### Common Pitfalls to Avoid

1. **Breaking changes:**
   - Don't rename constants without updating all references
   - Don't change Socket.IO message types without updating both client and server
   - Don't modify shared files without rebuilding

2. **Performance issues:**
   - Avoid creating objects in render loop (use pooling)
   - Don't add heavy computations in game loop (60 FPS requirement)
   - Cache calculations when possible

3. **Network desync:**
   - Server is authoritative (don't trust client input blindly)
   - Client should interpolate, not predict
   - Use `RENDER_DELAY` for smooth animation

4. **Asset management:**
   - Place assets in `public/assets/`
   - Update constants with asset paths
   - Preload in `src/client/scripts/assets.js`

### Code Review Checklist

Before submitting changes:

- [ ] Code follows existing style conventions
- [ ] ESLint passes: `npm run lint`
- [ ] Constants added to `src/shared/constants.js` if needed
- [ ] Assets added to `public/assets/` if needed
- [ ] Server and client both updated for feature
- [ ] Tested in local development: `npm run develop`
- [ ] Tested production build: `npm run build && npm start`
- [ ] Multiplayer tested (2+ clients)
- [ ] No console errors or warnings
- [ ] Commit message is descriptive
- [ ] Changes are focused (single feature/fix)

### Security Considerations

1. **Input validation:**
   - Server validates all client input
   - Sanitize player names if adding custom names
   - Limit message size/rate to prevent DoS

2. **Authoritative server:**
   - Never trust client-side game state
   - Server calculates all positions, collisions, scores
   - Client only renders and sends input

3. **Dependencies:**
   - Keep `npm` packages updated
   - Check for security vulnerabilities: `npm audit`
   - Avoid adding unnecessary dependencies

### When to Ask the User

Ask for clarification when:

1. **Multiple valid approaches exist:**
   - "Should I add this as a new powerup or modify the crown?"
   - "Do you want this to be client-side only or synced?"

2. **Breaking changes are needed:**
   - "This will change the game balance significantly. Proceed?"
   - "This requires modifying the core collision system. Confirm?"

3. **Requirements are ambiguous:**
   - "How long should the effect last?"
   - "What color should the visual effect be?"

4. **Trade-offs exist:**
   - "This will improve performance but reduce visual quality. Acceptable?"
   - "This adds complexity. Do you want a simpler alternative?"

### File Modification Priority

When making changes, follow this order:

1. **Constants first:** `src/shared/constants.js`
2. **Server logic:** `src/server/*.js`
3. **Client rendering:** `src/client/scripts/render.js`
4. **Client effects:** `src/client/scripts/particles.js`, `audio.js`, etc.
5. **UI:** `src/client/html/index.html`, `src/client/css/main.css`
6. **Documentation:** `README.md`, `CLAUDE.md` (if significant changes)

### Useful Commands Quick Reference

```bash
# Development
npm run develop          # Start dev server with hot reload
npm run build            # Build production bundle
npm start                # Run production server
npm run lint             # Run ESLint
npm run clean            # Remove dist folder

# Git
git status               # Check current state
git log --oneline -10    # Recent commits
git diff                 # Uncommitted changes
git add .                # Stage all changes
git commit -m "msg"      # Commit with message
git push -u origin <branch>  # Push to remote

# Docker
docker build -t danktanks .  # Build image
docker run -p 3000:3000 danktanks  # Run container

# Fly.io
fly deploy               # Deploy to production
fly logs                 # View logs
fly status               # Check app status
```

---

## Additional Resources

- **Design Document:** `docs/danktanks_design.md`
- **Deployment Guide:** `docs/hosting_strategy.md`
- **Framework Comparison:** `docs/phaser_evaluation.md`
- **Live Game:** https://danktanks-io.fly.dev/
- **Socket.IO Docs:** https://socket.io/docs/v2/
- **Webpack Docs:** https://webpack.js.org/

---

## Version History

| Date | Changes | Author |
|------|---------|--------|
| 2025-11-14 | Initial creation of CLAUDE.md | Claude |

---

## Questions or Issues?

If you encounter issues or need clarification:

1. **Check existing code** for similar patterns
2. **Read documentation** in `docs/` folder
3. **Review recent commits** for examples
4. **Ask the user** for clarification
5. **Test incrementally** to isolate problems

Remember: This is a real-time multiplayer game with strict performance requirements (60 FPS). Always consider the impact on game loop performance and network sync when making changes.

Happy coding! 🎮🚀
