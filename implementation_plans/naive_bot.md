# Naive Bot Implementation Plan

> **Feature**: Add AI-controlled bot tanks to DankTanks.io
> **Date**: 2025-11-15
> **Complexity**: Medium (refactor + new feature)
> **Est. Time**: 4-6 hours
> **Files Modified**: 6 files (3 new, 3 modified)

---

## Table of Contents

1. [Overview](#overview)
2. [Requirements](#requirements)
3. [Architecture Changes](#architecture-changes)
4. [Implementation Phases](#implementation-phases)
5. [Testing Checklist](#testing-checklist)
6. [Edge Cases](#edge-cases)
7. [Future Extensibility](#future-extensibility)

---

## Overview

This feature adds AI-controlled bot tanks to provide an engaging experience when human players are scarce. The implementation involves:

1. **Refactoring**: Extract shared tank logic into a `Tank` base class
2. **New Bot Class**: AI-controlled tanks that extend `Tank`
3. **Game Loop Integration**: Spawn/despawn bots automatically
4. **Transparent to Client**: Bots appear identical to human players

### Key Design Principles

- **Clean Separation**: Tank (shared) → Player (human) / Bot (AI)
- **Scalable**: Easy to increase bot count in the future
- **Efficient**: Spawn checks every 5 seconds (not every frame)
- **Simple**: No complex state tracking, just count-based spawning

---

## Requirements

### Bot Behavior

**Number & Spawning**:
- Max count: 1 bot (configurable for future expansion)
- Spawn at game start
- When a bot dies, respawn after ~5 seconds (via spawn check interval)
- Spawn checks run every 5 seconds, spawning max 1 bot per check

**Movement**:
- Move randomly while avoiding obstacles
- Continue mostly in same direction (low chance of direction change)
- Exception: Turn away from obstacles and map boundaries
- Same speed as human players

**Attack**:
- Shoot at nearest player if within 700 pixel radius
- Aim with slight inaccuracy (±8.6 degrees) to feel human-like
- Respect fire cooldown (same as players)

**Identity**:
- Spawn with random name from predefined list
- Random tank skin (Blue, Red, Green, Gray, USA)
- **Not distinguishable** from human players on client

**Powerups**:
- No active collection behavior (phase 1)
- Will receive powerup effects if they drive over them
- Future: Add deliberate powerup seeking

---

## Architecture Changes

### Current Class Hierarchy

```
Entity
├── DynamicEntity
│   ├── Player (movement, shooting, health, socket, input)
│   ├── Bullet
│   └── Explosion
├── Obstacle
└── Powerup
```

### New Class Hierarchy

```
Entity
├── DynamicEntity
│   ├── Tank (NEW - shared: movement, shooting, health)
│   │   ├── Player (socket, user input handling)
│   │   └── Bot (AI logic, autonomous behavior)
│   ├── Bullet
│   └── Explosion
├── Obstacle
└── Powerup
```

### Benefits

1. **Code Reuse**: All tank mechanics written once
2. **Type Safety**: Game logic treats all tanks uniformly
3. **Maintainability**: Easy to modify tank behavior for all types
4. **Extensibility**: Simple to add new tank types (e.g., different bot difficulties)

---

## Implementation Phases

### Phase 1: Add Bot Configuration Constants

**File**: `src/shared/constants.js`

**Action**: Add new configuration object

```javascript
BOT_CONFIG: Object.freeze({
  MAX_COUNT: 1,                    // Number of simultaneous bots (easy to increase later)
  RESPAWN_DELAY: 5000,             // Not used directly, implicit in spawn check interval
  SPAWN_CHECK_INTERVAL: 5000,      // Check for spawning every 5 seconds
  ATTACK_RADIUS: 700,              // Distance (px) to detect and shoot at players
  AIM_INACCURACY: 0.15,            // ±0.15 radians (~8.6 degrees) for human-like aim
  DIRECTION_CHANGE_CHANCE: 0.02,   // 2% chance per frame to randomly change direction
  OBSTACLE_LOOKAHEAD: 150,         // Distance (px) to check for obstacles ahead
  BOUNDARY_MARGIN: 100,            // Distance (px) from map edge to trigger turn

  NAMES: [
    'Tank', 'Blaze', 'Nova', 'Rex', 'Zara', 'Ace', 'Max', 'Luna',
    'Bolt', 'Dash', 'Echo', 'Finn', 'Ghost', 'Hawk', 'Iron', 'Jet',
    'Pyro', 'Radar', 'Scout', 'Turbo', 'Viper', 'Wolf', 'Zen', 'Apex',
    'Blitz', 'Comet', 'Dagger', 'Ember', 'Flash', 'Grit', 'Hunter'
  ]
}),
```

**Location**: Add after existing powerup configs, before `module.exports`

**Validation**:
- [ ] Constants are frozen (immutable)
- [ ] NAMES array has 30+ unique names
- [ ] All numeric values are positive

---

### Phase 2: Create Tank Base Class

**File**: `src/server/tank.js` (NEW FILE)

**Purpose**: Shared tank behavior for both players and bots

**Estimated Lines**: ~200

#### Implementation Steps

1. **Import Dependencies**:
```javascript
const DynamicEntity = require('./dynamicEntity');
const Bullet = require('./bullet');
const Constants = require('../shared/constants');
```

2. **Create Tank Class**:
```javascript
class Tank extends DynamicEntity {
  constructor(id, username, x, y, tankType) {
    super(id, x, y, 0, Constants.PLAYER_SPEED);

    // Identity
    this.username = username;
    this.tankType = tankType;  // 'Blue', 'Red', 'Green', 'Gray', 'USA'

    // Combat stats
    this.hp = Constants.PLAYER_MAX_HP;
    this.fireCooldown = 0;
    this.score = 0;

    // Physics
    this.radius = Constants.PLAYER_RADIUS;
    this.speed = Constants.PLAYER_SPEED;

    // Input state (controlled by Player via socket or Bot via AI)
    this.input = {
      up: false,
      down: false,
      left: false,
      right: false
    };
    this.mouseAngle = 0;  // Direction tank is aiming

    // Active effects
    this.shield = false;
    this.speedBoost = false;
    this.crownHolder = false;
    this.timedEffects = [];  // Array of {type, expiresAt}
  }
}
```

3. **Move Logic from Player Class**:

Extract these methods from `src/server/player.js` to `Tank`:

- [ ] **`update(dt)`**: Movement based on input state
  - Process directional input (up/down/left/right)
  - Update velocity
  - Call `super.update(dt)` for position update
  - Decrement fire cooldown

- [ ] **`fire()`**: Create bullet
  - Check fire cooldown
  - Create bullet at tank position/angle
  - Set cooldown (normal or rapid-fire if crown holder)
  - Return bullet object or null

- [ ] **`takeDamage(amount)`**: Apply damage
  - Reduce damage if shield active
  - Subtract from hp
  - Check for death

- [ ] **`isDead()`**: Health check
  - Return `this.hp <= 0`

- [ ] **`applyShield(duration)`**: Shield powerup
  - Set `this.shield = true`
  - Add timed effect

- [ ] **`applySpeedBoost(duration)`**: Speed powerup
  - Set `this.speedBoost = true`
  - Increase speed
  - Add timed effect

- [ ] **`applyHealth(amount)`**: Health powerup
  - Increase hp (capped at max)

- [ ] **`setCrownHolder(isHolder)`**: Crown status
  - Set `this.crownHolder = isHolder`

- [ ] **`updateTimedEffects()`**: Effect expiration
  - Called in `update()`
  - Remove expired effects
  - Revert shield/speed when expired

- [ ] **`serializeForUpdate()`**: Network serialization
  ```javascript
  serializeForUpdate() {
    return {
      id: this.id,
      x: this.x,
      y: this.y,
      direction: this.direction,
      hp: this.hp,
      username: this.username,
      tankType: this.tankType,
      shield: this.shield,
      speedBoost: this.speedBoost,
      crownHolder: this.crownHolder,
      mouseAngle: this.mouseAngle
    };
  }
  ```

4. **Export Module**:
```javascript
module.exports = Tank;
```

**Validation**:
- [ ] Tank extends DynamicEntity
- [ ] All original Player functionality preserved
- [ ] No socket-specific code in Tank
- [ ] No AI-specific code in Tank

---

### Phase 3: Refactor Player Class

**File**: `src/server/player.js`

**Action**: Simplify to extend Tank, keep only socket logic

**Estimated Changes**: Remove ~125 lines, add ~25 lines

#### Implementation Steps

1. **Update Imports**:
```javascript
const Tank = require('./tank');
const Constants = require('../shared/constants');
// Remove DynamicEntity import
```

2. **Change Inheritance**:
```javascript
class Player extends Tank {
  constructor(id, username, x, y, tankType, socket) {
    super(id, username, x, y, tankType);
    this.socket = socket;  // Only Player has socket
  }
}
```

3. **Keep Player-Specific Methods**:

Only these should remain in Player:

- [ ] **`updateInput(input)`**: Receive input from socket
  ```javascript
  updateInput(input) {
    this.input = input;  // Updates Tank's input state
  }
  ```

- [ ] **`updateMouseDirection(angle)`**: Receive aim from socket
  ```javascript
  updateMouseDirection(angle) {
    this.mouseAngle = angle;  // Updates Tank's aim
  }
  ```

- [ ] **Socket reference**: `this.socket` for emitting events

4. **Remove from Player** (now in Tank):
- All movement logic
- All combat logic (fire, takeDamage)
- All powerup application logic
- Health/shield/speed properties (moved to Tank constructor)
- serializeForUpdate (now in Tank)

5. **Verify Backward Compatibility**:
- Player still has all public methods game.js expects
- Player still emits socket events correctly
- Player.fire() still works (now inherited from Tank)

**Validation**:
- [ ] Player extends Tank (not DynamicEntity)
- [ ] Player is ~100 lines (down from ~225)
- [ ] No functionality broken
- [ ] Existing game still works

---

### Phase 4: Create Bot Class

**File**: `src/server/bot.js` (NEW FILE)

**Purpose**: AI-controlled tank with autonomous behavior

**Estimated Lines**: ~180

#### Implementation Steps

1. **Imports**:
```javascript
const Tank = require('./tank');
const Constants = require('../shared/constants');
const { circlePolygon } = require('./collisions');
```

2. **Static State** (track used names):
```javascript
const usedNames = new Set();

class Bot extends Tank {
  // ...
}
```

3. **Constructor**:
```javascript
constructor(id, x, y) {
  const username = Bot.selectRandomName();
  const tankType = Bot.selectRandomTankType();
  super(id, username, x, y, tankType);

  // AI state
  this.currentDirection = Math.random() * 2 * Math.PI;  // Random initial direction
  this.directionChangeCounter = 0;
}
```

4. **Static Helper: selectRandomName()**:
```javascript
static selectRandomName() {
  const { NAMES } = Constants.BOT_CONFIG;
  const availableNames = NAMES.filter(name => !usedNames.has(name));

  // If all names used, clear set (allows reuse)
  if (availableNames.length === 0) {
    usedNames.clear();
    availableNames.push(...NAMES);
  }

  const name = availableNames[Math.floor(Math.random() * availableNames.length)];
  usedNames.add(name);
  return name;
}
```

5. **Static Helper: selectRandomTankType()**:
```javascript
static selectRandomTankType() {
  const types = ['Blue', 'Red', 'Green', 'Gray', 'USA'];
  return types[Math.floor(Math.random() * types.length)];
}
```

6. **Static Helper: releaseUsername()** (called on death):
```javascript
static releaseUsername(username) {
  usedNames.delete(username);
}
```

7. **Core AI Method: updateAI()**:
```javascript
updateAI(allTanks, obstacles, mapSize) {
  // === MOVEMENT AI ===
  this.updateMovement(obstacles, mapSize);

  // === ATTACK AI ===
  this.updateAttack(allTanks);
}
```

8. **Movement AI: updateMovement()**:
```javascript
updateMovement(obstacles, mapSize) {
  const { DIRECTION_CHANGE_CHANCE, OBSTACLE_LOOKAHEAD, BOUNDARY_MARGIN } = Constants.BOT_CONFIG;

  // Increment counter for periodic direction changes
  this.directionChangeCounter++;

  // Random direction change (2% per frame = ~once per second at 60fps)
  if (Math.random() < DIRECTION_CHANGE_CHANCE) {
    this.currentDirection = Math.random() * 2 * Math.PI;
  }

  // Check for obstacles ahead
  const obstacleAhead = this.checkObstacleAhead(obstacles, OBSTACLE_LOOKAHEAD);
  if (obstacleAhead) {
    // Turn away from obstacle (add 90-180 degrees)
    this.currentDirection += Math.PI / 2 + Math.random() * Math.PI / 2;
  }

  // Check map boundaries
  const nearBoundary = this.checkMapBoundary(mapSize, BOUNDARY_MARGIN);
  if (nearBoundary) {
    // Turn toward center
    const centerX = mapSize / 2;
    const centerY = mapSize / 2;
    this.currentDirection = Math.atan2(centerY - this.y, centerX - this.x);
  }

  // Always move forward
  this.input.up = true;
  this.input.down = false;
  this.input.left = false;
  this.input.right = false;

  // Face movement direction (bot doesn't strafe)
  this.mouseAngle = this.currentDirection;
}
```

9. **Attack AI: updateAttack()**:
```javascript
updateAttack(allTanks) {
  const { ATTACK_RADIUS, AIM_INACCURACY } = Constants.BOT_CONFIG;

  // Find nearest living tank (exclude self)
  const target = this.findNearestTank(allTanks);

  if (!target) return;

  // Calculate distance
  const dx = target.x - this.x;
  const dy = target.y - this.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  // If within attack radius, aim and shoot
  if (distance <= ATTACK_RADIUS) {
    // Calculate angle to target
    let angleToTarget = Math.atan2(dy, dx);

    // Add inaccuracy for human-like aim
    const inaccuracy = (Math.random() - 0.5) * 2 * AIM_INACCURACY;
    angleToTarget += inaccuracy;

    // Aim at target
    this.mouseAngle = angleToTarget;

    // Attempt to fire (respects cooldown in Tank.fire())
    this.fire();
  }
}
```

10. **Helper: findNearestTank()**:
```javascript
findNearestTank(allTanks) {
  let nearest = null;
  let minDistance = Infinity;

  Object.values(allTanks).forEach(tank => {
    // Skip self and dead tanks
    if (tank.id === this.id || tank.isDead()) return;

    const dx = tank.x - this.x;
    const dy = tank.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < minDistance) {
      minDistance = distance;
      nearest = tank;
    }
  });

  return nearest;
}
```

11. **Helper: checkObstacleAhead()**:
```javascript
checkObstacleAhead(obstacles, lookAheadDistance) {
  // Project position forward
  const futureX = this.x + Math.cos(this.currentDirection) * lookAheadDistance;
  const futureY = this.y + Math.sin(this.currentDirection) * lookAheadDistance;

  // Check if future position collides with any obstacle
  for (const obstacle of obstacles) {
    const collision = circlePolygon(
      futureX,
      futureY,
      this.radius,
      obstacle.vertices
    );

    if (collision) return true;
  }

  return false;
}
```

12. **Helper: checkMapBoundary()**:
```javascript
checkMapBoundary(mapSize, margin) {
  // Check if near any edge
  return (
    this.x < margin ||
    this.x > mapSize - margin ||
    this.y < margin ||
    this.y > mapSize - margin
  );
}
```

13. **Export**:
```javascript
module.exports = Bot;
```

**Validation**:
- [ ] Bot extends Tank
- [ ] AI is autonomous (no socket input needed)
- [ ] Movement looks natural (straight with occasional turns)
- [ ] Attack logic targets nearest player
- [ ] Obstacle avoidance works

---

### Phase 5: Integrate Bots into Game Loop

**File**: `src/server/game.js`

**Action**: Add bot spawning, updating, and lifecycle management

**Estimated Changes**: +80-100 lines

#### Implementation Steps

1. **Add Import**:
```javascript
const Bot = require('./bot');
```

2. **Add Bot Tracking to Constructor**:
```javascript
constructor() {
  // ... existing code ...

  // Bot management
  this.bots = {};  // Same structure as this.players: {id: Bot}
  this.botSpawnTimer = 0;  // Accumulates time for spawn checks
}
```

3. **Create spawnBot() Method**:
```javascript
spawnBot() {
  const shortid = require('shortid');

  // Generate unique ID
  const id = shortid.generate();

  // Get random spawn position (reuse existing spawn logic)
  const { x, y } = this.getSpawnPosition();  // Use existing method

  // Create bot
  const bot = new Bot(id, x, y);

  // Add to bots collection
  this.bots[id] = bot;

  console.log(`Bot spawned: ${bot.username} (${id})`);
}
```

4. **Create getSpawnPosition() Helper** (if not exists):
```javascript
getSpawnPosition() {
  // Find safe spawn position (away from obstacles and other tanks)
  // This likely already exists in your code for player spawning
  // If not, implement basic version:

  const { MAP_SIZE, PLAYER_RADIUS } = Constants;
  let x, y, isSafe;
  let attempts = 0;
  const maxAttempts = 50;

  do {
    x = PLAYER_RADIUS + Math.random() * (MAP_SIZE - 2 * PLAYER_RADIUS);
    y = PLAYER_RADIUS + Math.random() * (MAP_SIZE - 2 * PLAYER_RADIUS);

    // Check if position collides with obstacles
    isSafe = !this.obstacles.some(obstacle =>
      circlePolygon(x, y, PLAYER_RADIUS, obstacle.vertices)
    );

    attempts++;
  } while (!isSafe && attempts < maxAttempts);

  return { x, y };
}
```

5. **Create checkBotSpawning() Method**:
```javascript
checkBotSpawning() {
  const currentBotCount = Object.keys(this.bots).length;
  const { MAX_COUNT } = Constants.BOT_CONFIG;

  // If under max count, spawn exactly 1 bot
  if (currentBotCount < MAX_COUNT) {
    this.spawnBot();
  }
}
```

6. **Create handleBotDeath() Method**:
```javascript
handleBotDeath(botId) {
  const bot = this.bots[botId];
  if (!bot) return;

  console.log(`Bot died: ${bot.username} (${botId})`);

  // Release name for reuse
  Bot.releaseUsername(bot.username);

  // Remove from bots collection
  delete this.bots[botId];

  // Note: Next spawn check will spawn a new bot if under MAX_COUNT
}
```

7. **Update Main Game Loop** (`update()` method):

Add spawn check timer:
```javascript
update() {
  const now = Date.now();
  const dt = (now - this.lastUpdateTime) / 1000;  // Delta time in seconds
  this.lastUpdateTime = now;

  // === BOT SPAWN CHECK (every 5 seconds) ===
  this.botSpawnTimer += dt;
  if (this.botSpawnTimer >= Constants.BOT_CONFIG.SPAWN_CHECK_INTERVAL / 1000) {
    this.botSpawnTimer = 0;
    this.checkBotSpawning();
  }

  // ... existing player updates ...

  // === UPDATE BOTS ===
  Object.values(this.bots).forEach(bot => {
    // Update tank physics (movement, cooldowns)
    bot.update(dt);

    // Update AI (decision making)
    const allTanks = { ...this.players, ...this.bots };
    bot.updateAI(allTanks, this.obstacles, Constants.MAP_SIZE);
  });

  // ... rest of game loop ...
}
```

8. **Update Bullet Creation**:

Find where bullets are created (likely in update loop when tanks fire):
```javascript
// Collect bullets from players
Object.values(this.players).forEach(player => {
  const bullet = player.fire();
  if (bullet) {
    bullet.parentID = player.id;
    this.bullets.push(bullet);
  }
});

// Collect bullets from bots
Object.values(this.bots).forEach(bot => {
  const bullet = bot.fire();
  if (bullet) {
    bullet.parentID = bot.id;
    this.bullets.push(bullet);
  }
});
```

9. **Update Collision Detection**:

Find bullet-tank collision handling:
```javascript
// Create combined tank list for collision checks
const allTanks = { ...this.players, ...this.bots };

// Check bullet collisions
this.bullets.forEach(bullet => {
  Object.values(allTanks).forEach(tank => {
    if (bullet.parentID === tank.id) return;  // Can't hit self

    if (this.checkBulletTankCollision(bullet, tank)) {
      // Apply damage
      tank.takeDamage(Constants.BULLET_DAMAGE);

      // Award points to shooter
      const shooter = allTanks[bullet.parentID];
      if (shooter) {
        shooter.score += Constants.SCORE_BULLET_HIT;
      }

      // Check if tank died
      if (tank.isDead()) {
        // Determine if player or bot
        if (this.players[tank.id]) {
          // Existing player death handling
          this.handlePlayerDeath(tank.id, shooter);
        } else if (this.bots[tank.id]) {
          // Bot death handling
          this.handleBotDeath(tank.id);

          // Award kill points to shooter
          if (shooter) {
            shooter.score += Constants.SCORE_PER_KILL;
          }

          // Create explosion
          this.explosions.push(/* ... */);
        }
      }

      // Remove bullet
      bullet.destroy();
    }
  });
});
```

10. **Update createUpdate() for Network Sync**:

Merge bots into player array for client:
```javascript
createUpdate() {
  const players = Object.values(this.players).map(p => p.serializeForUpdate());
  const bots = Object.values(this.bots).map(b => b.serializeForUpdate());

  return {
    t: Date.now(),
    players: [...players, ...bots],  // Client treats all as "players"
    bullets: this.bullets.map(b => b.serializeForUpdate()),
    explosions: this.explosions.map(e => e.serializeForUpdate()),
    // ... other game state ...
  };
}
```

11. **Initialize Bots on Game Start**:

In constructor or initialization method:
```javascript
constructor() {
  // ... existing setup ...

  // Initial bot spawn (will spawn 1 immediately if under MAX_COUNT)
  this.checkBotSpawning();
}
```

**Validation**:
- [ ] Bot spawns at game start
- [ ] Bot respawns within 5 seconds of death
- [ ] Maximum of MAX_COUNT bots active
- [ ] Bots update every frame
- [ ] Bots appear in game state sent to clients

---

### Phase 6: Update Collision System

**File**: `src/server/collisions.js`

**Action**: Ensure collision functions work with combined tank lists

**Estimated Changes**: +10-20 lines (mostly in game.js, minimal here)

#### Implementation Steps

Most collision work is in `game.js` (Phase 5), but verify:

1. **Collision Functions Accept Any Tank**:
- Functions like `circleCircle`, `circlePolygon` don't need changes
- They work on position/radius, not class type

2. **If There Are Tank-Specific Collision Handlers**:
- Ensure they work with Tank base class
- Should accept `Tank` instances (not just `Player`)

3. **Tank-Tank Collision** (if implemented):
```javascript
// In game.js update loop
const allTanks = { ...this.players, ...this.bots };
const tankArray = Object.values(allTanks);

// Check tank-tank collisions
for (let i = 0; i < tankArray.length; i++) {
  for (let j = i + 1; j < tankArray.length; j++) {
    if (this.checkTankCollision(tankArray[i], tankArray[j])) {
      // Handle collision (push apart, etc.)
    }
  }
}
```

**Validation**:
- [ ] Bullets can hit bots
- [ ] Bots can hit players
- [ ] Bot-obstacle collision works
- [ ] Bot-tank collision works (if implemented)

---

### Phase 7: Client Compatibility Verification

**Files**: `src/client/scripts/*.js`

**Action**: Verify no changes needed (bots are transparent)

#### Verification Steps

1. **Check render.js**:
- [ ] Renders all entities in `update.players` array
- [ ] Doesn't check for player vs bot distinction
- [ ] Should render bots automatically

2. **Check leaderboard.js**:
- [ ] Displays all players from game state
- [ ] Should show bot names/scores automatically

3. **Check map.js** (minimap):
- [ ] Shows all player positions
- [ ] Should show bots automatically

4. **Check state.js**:
- [ ] Interpolates all player positions
- [ ] Should work with bots automatically

**Expected Result**: **NO CLIENT CHANGES NEEDED**

Bots are merged into the `players` array server-side, so client treats them identically to human players.

**Validation**:
- [ ] Bots visible on main canvas
- [ ] Bots visible on minimap
- [ ] Bot names appear in leaderboard
- [ ] Bot movement is smooth (interpolation works)

---

## Testing Checklist

### Unit Tests (Manual)

**Bot Spawning**:
- [ ] Bot spawns when game starts
- [ ] Bot spawns with unique name from BOT_CONFIG.NAMES
- [ ] Bot spawns with random tank skin
- [ ] Bot spawns at safe position (no obstacle collision)
- [ ] Only MAX_COUNT bots spawn (test with 0, 1, 5 players)

**Bot Respawning**:
- [ ] When bot dies, it's removed from game
- [ ] New bot spawns within 5 seconds
- [ ] New bot has different ID and possibly different name/skin
- [ ] Spawn check runs every 5 seconds (not every frame)

**Bot Movement**:
- [ ] Bot moves continuously
- [ ] Bot mostly travels straight
- [ ] Bot occasionally changes direction randomly
- [ ] Bot avoids obstacles (turns before collision)
- [ ] Bot avoids map boundaries (turns toward center)
- [ ] Bot doesn't get stuck in corners

**Bot Combat**:
- [ ] Bot detects nearby players (within 700px)
- [ ] Bot aims at nearest player
- [ ] Bot fires at player (bullets created)
- [ ] Bot aim has slight inaccuracy (not perfect)
- [ ] Bot respects fire cooldown (doesn't spam)
- [ ] Bot doesn't shoot at itself
- [ ] Bot doesn't shoot at dead tanks

**Game Integration**:
- [ ] Bot takes damage from bullets
- [ ] Bot health decreases correctly
- [ ] Bot dies when health reaches 0
- [ ] Bot death creates explosion
- [ ] Killing bot awards points to shooter
- [ ] Bot can kill players
- [ ] Bot can be killed by players
- [ ] Bot can collect powerups (passive)
- [ ] Powerups affect bot (shield, speed, health work)

**Client Rendering**:
- [ ] Bot appears on screen
- [ ] Bot name displays above tank
- [ ] Bot movement is smooth (interpolation)
- [ ] Bot appears in leaderboard
- [ ] Bot appears on minimap
- [ ] Bot explosions render correctly
- [ ] Bot is indistinguishable from human players

### Integration Tests

**Multiplayer Scenarios**:
- [ ] 0 human players: Bot roams alone
- [ ] 1 human player: Bot fights player
- [ ] Multiple human players: Bot engages with all
- [ ] Bot dies while human watching: respawn works

**Edge Cases**:
- [ ] All bots die simultaneously (if MAX_COUNT > 1)
- [ ] Bot killed at exact moment of spawn check
- [ ] Bot fires bullet as it dies
- [ ] Bot collects powerup as it dies
- [ ] Player disconnects while bot is shooting them

**Performance**:
- [ ] Game runs at 60 FPS with bots
- [ ] No lag spikes during bot spawn
- [ ] No memory leaks (bot names released on death)
- [ ] Spawn check doesn't slow down game loop

### Scalability Tests

**Increase MAX_COUNT**:
- [ ] Change MAX_COUNT to 5
- [ ] Verify 5 bots spawn
- [ ] Verify spawn limiter (max 1 per 5-second check)
- [ ] Verify performance is acceptable
- [ ] Bots interact with each other (bot vs bot combat)

---

## Edge Cases

### Bot Behavior

1. **Bot stuck on obstacle**:
   - **Prevention**: Lookahead distance checks obstacle before collision
   - **Fallback**: If stuck for >2 seconds, teleport to new spawn position (future enhancement)

2. **Bot stuck in corner**:
   - **Prevention**: Boundary margin triggers turn toward center
   - **Fallback**: Random direction change should eventually free bot

3. **Bot chasing player into wall**:
   - **Current**: Bot may crash into wall while shooting
   - **Acceptable**: Makes bot feel less perfect/more human-like
   - **Future**: Add obstacle awareness to attack AI

4. **All bot names used** (if MAX_COUNT > name count):
   - **Handling**: Clear `usedNames` set when all names taken
   - **Result**: Names can repeat after all used once

### Game Logic

5. **Bot dies at exact spawn check moment**:
   - **Handling**: Death removes from `this.bots`, spawn check adds new one
   - **Result**: Count remains correct, no duplicate spawns

6. **Player disconnects while bot is targeting them**:
   - **Handling**: `findNearestTank()` filters out dead/missing tanks
   - **Result**: Bot switches to next nearest target or stops shooting

7. **Bot fires bullet as it dies**:
   - **Handling**: Bullet already created and added to `this.bullets`
   - **Result**: Bullet continues to exist and can hit targets (intended)

### Network

8. **Client receives bot in update before "join" event**:
   - **Handling**: Client treats all entities in `players` array equally
   - **Result**: No issue, bot appears immediately

9. **Bot ID collision with player ID**:
   - **Prevention**: Both use `shortid.generate()`, collision chance ~0%
   - **Fallback**: No special handling needed (extremely unlikely)

---

## Future Extensibility

### Easy to Add Later

1. **Increase Bot Count**:
   - Change `BOT_CONFIG.MAX_COUNT` to 5, 10, etc.
   - No code changes needed

2. **Bot Difficulty Levels**:
   ```javascript
   class EasyBot extends Bot {
     // Lower attack radius, more inaccuracy
   }

   class HardBot extends Bot {
     // Higher attack radius, less inaccuracy, better dodging
   }
   ```

3. **Powerup Seeking**:
   - Add `findNearestPowerup()` in Bot
   - Navigate toward powerup if no enemies nearby

4. **Tactical Behaviors**:
   - Retreat when low health
   - Seek cover behind obstacles
   - Flank enemies

5. **Team Bots**:
   - Assign bots to teams
   - Coordinate attacks
   - Protect teammates

6. **Named Bot Personalities**:
   ```javascript
   {
     name: 'Rex',
     aggression: 0.8,  // Seeks combat
     caution: 0.2      // Doesn't retreat
   }
   ```

### Architecture Supports

- **Multiple bot types**: Easy to add subclasses of Bot
- **Bot-specific features**: All isolated in `bot.js`
- **Configurable behavior**: All params in `BOT_CONFIG`
- **A/B testing**: Easy to spawn different bot types and compare

---

## Implementation Checklist

### Phase 1: Constants
- [ ] Add `BOT_CONFIG` to `src/shared/constants.js`
- [ ] Verify constants are frozen
- [ ] Test game still runs

### Phase 2: Tank Base Class
- [ ] Create `src/server/tank.js`
- [ ] Move shared logic from Player to Tank
- [ ] Verify all methods work
- [ ] Test game still runs

### Phase 3: Refactor Player
- [ ] Update `src/server/player.js` to extend Tank
- [ ] Remove duplicated code
- [ ] Keep only socket logic
- [ ] Test multiplayer still works

### Phase 4: Create Bot
- [ ] Create `src/server/bot.js`
- [ ] Implement AI methods
- [ ] Test bot logic in isolation (if possible)

### Phase 5: Game Integration
- [ ] Update `src/server/game.js`
- [ ] Add bot spawning
- [ ] Add bot updating
- [ ] Add bot collision handling
- [ ] Test bot lifecycle

### Phase 6: Collision Updates
- [ ] Verify `src/server/collisions.js` works with bots
- [ ] Update collision handling in game.js
- [ ] Test bot combat

### Phase 7: Client Verification
- [ ] Test bot rendering
- [ ] Test bot in leaderboard
- [ ] Test bot on minimap
- [ ] Verify no client changes needed

### Final Testing
- [ ] Run through all test cases
- [ ] Test edge cases
- [ ] Test with multiple players
- [ ] Test performance
- [ ] Deploy to staging

---

## Estimated Timeline

| Phase | Time | Complexity |
|-------|------|------------|
| Phase 1: Constants | 15 min | Low |
| Phase 2: Tank Base Class | 90 min | High (careful refactor) |
| Phase 3: Refactor Player | 45 min | Medium |
| Phase 4: Create Bot | 60 min | Medium |
| Phase 5: Game Integration | 90 min | High (many touchpoints) |
| Phase 6: Collision Updates | 30 min | Low |
| Phase 7: Client Verification | 20 min | Low |
| Testing & Debugging | 60 min | Medium |
| **Total** | **~6.5 hours** | Medium |

---

## Files Summary

| File | Status | Est. Lines | Complexity |
|------|--------|------------|------------|
| `src/shared/constants.js` | Modify | +20 | Low |
| `src/server/tank.js` | **New** | ~200 | Medium |
| `src/server/bot.js` | **New** | ~180 | Medium |
| `src/server/player.js` | Refactor | -125 / +25 | High |
| `src/server/game.js` | Modify | +90 | High |
| `src/server/collisions.js` | Verify | +10 | Low |
| Client files | Verify | 0 | Low |

**Total New Code**: ~310 lines
**Refactored Code**: ~125 lines moved
**Net Addition**: ~185 lines

---

## Success Criteria

Feature is complete when:

1. ✅ Bot spawns automatically at game start
2. ✅ Bot moves naturally (straight with occasional turns)
3. ✅ Bot avoids obstacles and map boundaries
4. ✅ Bot shoots at nearby players with slight inaccuracy
5. ✅ Bot can be killed and killed players
6. ✅ Bot respawns within 5 seconds of death
7. ✅ Bot is indistinguishable from human players on client
8. ✅ Game runs at 60 FPS with bot active
9. ✅ All existing features still work (multiplayer, powerups, etc.)
10. ✅ Code is clean, well-commented, and follows existing conventions

---

## Questions or Issues?

If you encounter problems during implementation:

1. **Refactor breaking existing code**: Test each phase independently, roll back if needed
2. **Bot AI not working**: Add console.log debugging in `updateAI()`
3. **Bot getting stuck**: Adjust `OBSTACLE_LOOKAHEAD` and `BOUNDARY_MARGIN` constants
4. **Performance issues**: Profile with multiple bots, optimize AI if needed
5. **Client not showing bots**: Verify bots are in `createUpdate()` players array

---

**Good luck with implementation! 🎮🤖**
