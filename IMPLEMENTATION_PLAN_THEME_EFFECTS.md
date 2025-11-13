# Theme-Specific Visual Effects - Detailed Implementation Plan

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [File Structure](#file-structure)
3. [Core Classes & APIs](#core-classes--apis)
4. [Integration Points](#integration-points)
5. [Phase-by-Phase Implementation](#phase-by-phase-implementation)
6. [Effect Specifications](#effect-specifications)
7. [Performance Optimization](#performance-optimization)
8. [Testing Strategy](#testing-strategy)

---

## Architecture Overview

### System Design Principles
- **Modular**: Each effect is self-contained and can be enabled/disabled independently
- **Performant**: Particle pooling, culling, and adaptive quality
- **Theme-driven**: Effects are configured in theme.js and automatically loaded
- **Layered**: Effects render in specific layers for proper z-ordering

### Effect Pipeline
```
Game Loop
  ↓
updateEffects(dt)
  ↓
renderEffects(canvas, camera)
  ├─> Background Layer (sandstorm, snow)
  ├─> Midground Layer (dust clouds, trails)
  ├─> Foreground Layer (scanlines, overlays)
  └─> Post-process Layer (distortion, glitch)
```

### Performance Budget
- **Target**: < 5% FPS impact
- **Max particles**: 200 simultaneous (pooled)
- **Update budget**: 2ms per frame
- **Render budget**: 3ms per frame

---

## File Structure

### New Files

```
src/
├── client/
│   └── scripts/
│       └── effects.js              # Main effects system (NEW)
│
└── shared/
    └── constants.js                # Add effect constants (MODIFY)
```

### Modified Files

```
src/
├── client/
│   └── scripts/
│       ├── render.js               # Integrate effect rendering
│       ├── particles.js            # Extend for effect particles
│       └── index.js                # Initialize effects system
│
└── shared/
    └── theme.js                    # Add effects configuration
```

---

## Core Classes & APIs

### 1. EffectSystem Class (`effects.js`)

**Purpose**: Central manager for all visual effects

```javascript
class EffectSystem {
  constructor() {
    this.effects = [];              // Active effect instances
    this.effectPool = new Map();     // Recycled effects for performance
    this.layers = {                  // Organized by render layer
      background: [],
      midground: [],
      foreground: [],
      postprocess: []
    };
    this.enabled = true;
    this.quality = 'high';           // 'low', 'medium', 'high', 'ultra'
    this.performanceMode = false;
    this.frameTime = 0;
  }

  // Lifecycle
  initialize(theme)
  shutdown()

  // Update loop
  update(dt, gameState, camera)

  // Render loop
  renderLayer(layer, canvas, camera)

  // Effect management
  addEffect(effectType, config)
  removeEffect(effectId)
  clearEffects()

  // Event hooks (called from game code)
  onExplosion(x, y, radius)
  onTankFire(x, y, direction, tankId)
  onTankTurn(x, y, oldDirection, newDirection)
  onBulletImpact(x, y, normal)

  // Performance
  setQuality(level)
  enablePerformanceMode(enabled)
  getPerformanceStats()
}
```

### 2. Base Effect Class

```javascript
class Effect {
  constructor(config) {
    this.id = generateId();
    this.type = config.type;
    this.layer = config.layer;        // 'background', 'midground', etc.
    this.active = true;
    this.lifespan = config.lifespan;  // -1 for infinite
    this.age = 0;
  }

  update(dt, gameState, camera) {
    this.age += dt;
    if (this.lifespan > 0 && this.age >= this.lifespan) {
      this.active = false;
    }
    return this.active;
  }

  render(context, canvas, camera) {
    // Override in subclasses
  }

  reset(config) {
    // Reset for pooling
  }
}
```

### 3. Specific Effect Classes

#### ParticleEffect (extends Effect)
```javascript
class ParticleEffect extends Effect {
  constructor(config) {
    super(config);
    this.particles = [];
    this.maxParticles = config.maxParticles || 50;
    this.emissionRate = config.emissionRate || 10; // particles/second
    this.emissionTimer = 0;
  }

  update(dt, gameState, camera) {
    // Emit new particles
    // Update existing particles
    // Remove dead particles
  }

  render(context, canvas, camera) {
    // Render all particles
  }
}
```

#### OverlayEffect (extends Effect)
```javascript
class OverlayEffect extends Effect {
  // For scanlines, distortion, full-screen effects
  constructor(config) {
    super(config);
    this.opacity = config.opacity || 1.0;
    this.blendMode = config.blendMode || 'normal';
  }
}
```

#### AnimatedEffect (extends Effect)
```javascript
class AnimatedEffect extends Effect {
  // For time-based animations
  constructor(config) {
    super(config);
    this.animationPhase = 0;
    this.animationSpeed = config.speed || 1.0;
  }
}
```

### 4. Particle Pool

```javascript
class ParticlePool {
  constructor(maxSize = 500) {
    this.pool = [];
    this.maxSize = maxSize;
  }

  acquire(x, y, vx, vy, life, color, size) {
    if (this.pool.length > 0) {
      const particle = this.pool.pop();
      particle.reset(x, y, vx, vy, life, color, size);
      return particle;
    }
    return new Particle(x, y, vx, vy, life, color, size);
  }

  release(particle) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(particle);
    }
  }

  clear() {
    this.pool = [];
  }
}
```

---

## Integration Points

### 1. Theme Configuration (`theme.js`)

Add `effects` property to each theme:

```javascript
const THEMES = {
  desert: {
    name: "Desert Warfare",
    // ... existing properties ...

    effects: {
      ambient: [
        {
          type: 'sandstorm',
          intensity: 0.7,           // 0-1 scale
          particleCount: 60,
          color: [242, 125, 8],     // RGB
          windSpeed: 150,           // px/s
          gustInterval: 5000        // ms between gusts
        },
        {
          type: 'heatDistortion',
          intensity: 0.3,
          waveAmplitude: 2,
          waveFrequency: 0.5
        }
      ],

      gameplay: [
        {
          type: 'dustClouds',
          trigger: 'turn',
          threshold: 90,            // degrees
          particleCount: 12,
          color: [194, 149, 92]
        }
      ],

      particles: {
        smoke: [140, 120, 100],     // Tan smoke
        healthPickup: [242, 125, 8], // Orange
        crownPickup: [255, 215, 0]   // Gold
      }
    }
  },

  arctic: {
    // ... similar structure for arctic effects ...
  },

  neon: {
    // ... similar structure for neon effects ...
  },

  default: {
    // ... similar structure for classic effects ...
  }
};
```

### 2. Constants (`constants.js`)

Add effect-related constants:

```javascript
module.exports = Object.freeze({
  // ... existing constants ...

  // Effect system constants
  EFFECTS: {
    MAX_PARTICLES: 200,
    PARTICLE_POOL_SIZE: 500,
    QUALITY_LEVELS: {
      LOW: {
        particleMultiplier: 0.3,
        updateFrequency: 30,      // FPS
        enableDistortion: false,
        enableComplexEffects: false
      },
      MEDIUM: {
        particleMultiplier: 0.6,
        updateFrequency: 60,
        enableDistortion: true,
        enableComplexEffects: false
      },
      HIGH: {
        particleMultiplier: 1.0,
        updateFrequency: 60,
        enableDistortion: true,
        enableComplexEffects: true
      },
      ULTRA: {
        particleMultiplier: 1.5,
        updateFrequency: 60,
        enableDistortion: true,
        enableComplexEffects: true
      }
    },

    // Performance thresholds
    PERFORMANCE_MODE_FPS_THRESHOLD: 45,
    EFFECT_DISABLE_FPS_THRESHOLD: 30,

    // Effect-specific constants
    SANDSTORM_HEIGHT_RANGE: [0.2, 0.8],  // % of screen height
    SNOWFLAKE_FALL_SPEED: [50, 150],     // px/s range
    SCANLINE_SPEED: 120,                 // px/s
    GLITCH_DURATION: 80,                 // ms
    TRAIL_SPEED_THRESHOLD: 100,          // px/s to trigger trails
    MUZZLE_FLASH_DURATION: 100,          // ms
    ICE_TRACK_FADE_TIME: 2.5             // seconds
  }
});
```

### 3. Render Pipeline Integration (`render.js`)

Modify the main render function:

```javascript
import { updateEffects, renderEffects } from './effects';

function render(canvas) {
  const context = canvas.getContext('2d');
  const { me, others, bullets, explosions, crowns, healthPacks } = getCurrentState();

  if (!me) return;

  const dt = 1 / 60;

  // Update effects
  updateEffects(dt, { me, others, bullets, explosions }, { x: me.x, y: me.y });

  // Draw background
  renderBackground(canvas, me.x, me.y);

  // BACKGROUND LAYER EFFECTS (sandstorm, snow, ambient)
  renderEffects('background', canvas, { x: me.x, y: me.y });

  // Draw obstacles
  renderObstacles(canvas, me);

  // Draw grid
  renderGrid(context, me);

  // Draw boundaries
  // ... existing code ...

  // Draw bullets
  bullets.forEach(renderBullet.bind(null, canvas, me));

  // MIDGROUND LAYER EFFECTS (dust clouds, smoke, trails)
  renderEffects('midground', canvas, { x: me.x, y: me.y });

  // Draw players
  renderPlayer(canvas, me, me);
  others.forEach(renderPlayer.bind(null, canvas, me));

  // Draw explosions
  explosions.forEach(renderExplosion.bind(null, canvas, me));

  // Draw pickups
  crowns.forEach(renderCrowns.bind(null, canvas, me));
  if (healthPacks) {
    healthPacks.forEach(renderHealthPack.bind(null, canvas, me));
  }

  // Render particles (existing system)
  renderParticles(canvas, me.x, me.y);

  // FOREGROUND LAYER EFFECTS (scanlines, overlays)
  renderEffects('foreground', canvas, { x: me.x, y: me.y });

  // POST-PROCESS LAYER (distortion, glitch)
  renderEffects('postprocess', canvas, { x: me.x, y: me.y });
}
```

### 4. Event Hooks

Add effect triggers in appropriate locations:

**In `render.js` or game update code:**

```javascript
import { triggerExplosionEffect, triggerTankFireEffect } from './effects';

// When explosion occurs
function renderExplosion(canvas, me, explosion) {
  // ... existing rendering code ...

  // Trigger effects
  if (explosion.isNew) {  // Add flag to track first render
    triggerExplosionEffect(explosion.x, explosion.y, EXPLOSION_RADIUS);
  }
}

// When tank fires (add to input.js or wherever shooting is handled)
function onTankFire(x, y, direction) {
  triggerTankFireEffect(x, y, direction);
}
```

### 5. Initialization (`index.js`)

Initialize effects system on game start:

```javascript
import { initializeEffects, shutdownEffects } from './effects';
import { getCurrentThemeName } from '../../shared/theme';

// In the play button onclick handler
playButton.onclick = () => {
  play(usernameInput.value, getTankStyle(), intialToggle.checked);
  playMenu.classList.add("hidden");
  initState();
  startCapturingInput();

  // Initialize effects system
  initializeEffects(getCurrentThemeName());

  ENABLE_DOUBLE_BUFFERING
    ? startRenderingWithDoubleBuffering()
    : startRendering();
  startRenderingLeaderboard();
  startRenderingMap();
};

// In onGameOver
function onGameOver() {
  stopCapturingInput();
  stopRendering();
  stopRenderingLeaderboard();
  stopRenderingMap();

  // Cleanup effects
  shutdownEffects();

  playMenu.classList.remove("hidden");
}
```

---

## Phase-by-Phase Implementation

### Phase 1: Foundation (2 hours)

**Step 1.1: Create effects.js skeleton (30 min)**

Create `/home/user/DankTanks.io/src/client/scripts/effects.js`:

```javascript
// Import dependencies
const { getCurrentTheme } = require('../../shared/theme');
const Constants = require('../../shared/constants');

// Global effect system instance
let effectSystem = null;

// Base classes
class Effect {
  // ... implementation from above
}

class EffectSystem {
  // ... implementation from above
}

// Particle pool
class ParticlePool {
  // ... implementation from above
}

// Public API
export function initializeEffects(themeName) {
  if (effectSystem) {
    effectSystem.shutdown();
  }
  effectSystem = new EffectSystem();
  effectSystem.initialize(getCurrentTheme());
  console.log(`Effects initialized for theme: ${themeName}`);
}

export function shutdownEffects() {
  if (effectSystem) {
    effectSystem.shutdown();
    effectSystem = null;
  }
}

export function updateEffects(dt, gameState, camera) {
  if (effectSystem && effectSystem.enabled) {
    effectSystem.update(dt, gameState, camera);
  }
}

export function renderEffects(layer, canvas, camera) {
  if (effectSystem && effectSystem.enabled) {
    effectSystem.renderLayer(layer, canvas, camera);
  }
}

// Event hooks
export function triggerExplosionEffect(x, y, radius) {
  if (effectSystem) {
    effectSystem.onExplosion(x, y, radius);
  }
}

export function triggerTankFireEffect(x, y, direction) {
  if (effectSystem) {
    effectSystem.onTankFire(x, y, direction);
  }
}

export function triggerTankTurnEffect(x, y, oldDir, newDir) {
  if (effectSystem) {
    effectSystem.onTankTurn(x, y, oldDir, newDir);
  }
}

export function triggerBulletImpactEffect(x, y, normal) {
  if (effectSystem) {
    effectSystem.onBulletImpact(x, y, normal);
  }
}

// Performance management
export function setEffectQuality(quality) {
  if (effectSystem) {
    effectSystem.setQuality(quality);
  }
}

export function getEffectStats() {
  return effectSystem ? effectSystem.getPerformanceStats() : null;
}
```

**Step 1.2: Add effect constants (15 min)**

Modify `src/shared/constants.js` - add EFFECTS object as shown in Integration Points section.

**Step 1.3: Add theme effect configurations (30 min)**

Modify `src/shared/theme.js` - add `effects` property to each theme as shown above.

Start with minimal configurations:

```javascript
effects: {
  ambient: [],
  gameplay: [],
  particles: {
    smoke: [60, 60, 60],           // Default gray
    healthPickup: [0, 255, 0],     // Green
    crownPickup: [255, 215, 0]     // Gold
  }
}
```

**Step 1.4: Integrate into render pipeline (45 min)**

Modify `src/client/scripts/render.js`:
- Import effect functions
- Add render calls in appropriate layers
- Add update call

Modify `src/client/scripts/index.js`:
- Import initialization functions
- Call initializeEffects on game start
- Call shutdownEffects on game over

**Testing Phase 1:**
- Verify effects system initializes without errors
- Verify render pipeline still works
- Check console for initialization messages
- Verify no performance regression

---

### Phase 2: Desert Theme Effects (2-3 hours)

**Step 2.1: Sandstorm Particle Effect (90 min)**

Create `SandstormEffect` class in `effects.js`:

```javascript
class SandstormEffect extends ParticleEffect {
  constructor(config) {
    super({
      ...config,
      layer: 'background',
      lifespan: -1  // Infinite
    });

    this.windSpeed = config.windSpeed || 150;
    this.gustIntensity = 1.0;
    this.gustTimer = 0;
    this.gustInterval = config.gustInterval || 5000;
    this.gustDuration = 2000;
    this.baseParticleCount = config.particleCount || 60;
    this.particleColor = config.color || [242, 125, 8];

    // Pre-spawn initial particles
    this.initializeParticles();
  }

  initializeParticles() {
    const canvas = document.getElementById('game-canvas');
    for (let i = 0; i < this.baseParticleCount; i++) {
      this.spawnParticle(canvas.width, canvas.height, true);
    }
  }

  spawnParticle(canvasWidth, canvasHeight, randomX = false) {
    const heightMin = canvasHeight * 0.2;
    const heightMax = canvasHeight * 0.8;

    const x = randomX ? Math.random() * canvasWidth : -10;
    const y = heightMin + Math.random() * (heightMax - heightMin);

    const baseSpeed = this.windSpeed * this.gustIntensity;
    const vx = baseSpeed * (0.8 + Math.random() * 0.4);
    const vy = -20 + Math.random() * 40;  // Slight vertical drift

    const size = 2 + Math.random() * 3;
    const life = (canvasWidth + 100) / vx;  // Life based on travel time

    // Color variation
    const colorVar = Math.floor(Math.random() * 20) - 10;
    const color = `${this.particleColor[0] + colorVar}, ${this.particleColor[1] + colorVar}, ${this.particleColor[2] + colorVar}`;

    this.particles.push({
      x, y, vx, vy, life, maxLife: life, color, size, alpha: 0.6
    });
  }

  update(dt, gameState, camera) {
    const canvas = document.getElementById('game-canvas');

    // Update gust effect
    this.gustTimer += dt * 1000;
    if (this.gustTimer > this.gustInterval) {
      this.gustTimer = 0;
    }

    // Calculate gust intensity (sine wave)
    if (this.gustTimer < this.gustDuration) {
      const gustPhase = this.gustTimer / this.gustDuration;
      this.gustIntensity = 1.0 + 0.5 * Math.sin(gustPhase * Math.PI);
    } else {
      this.gustIntensity = 1.0;
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Remove if off-screen or dead
      if (p.x > canvas.width + 50 || p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Spawn new particles to maintain count
    while (this.particles.length < this.baseParticleCount * this.gustIntensity) {
      this.spawnParticle(canvas.width, canvas.height, false);
    }

    return true;  // Always active
  }

  render(context, canvas, camera) {
    context.save();

    this.particles.forEach(p => {
      const alpha = (p.life / p.maxLife) * p.alpha;
      context.fillStyle = `rgba(${p.color}, ${alpha})`;
      context.fillRect(p.x, p.y, p.size, p.size);
    });

    context.restore();
  }
}
```

Add to theme configuration:
```javascript
desert: {
  effects: {
    ambient: [
      {
        type: 'sandstorm',
        intensity: 0.7,
        particleCount: 60,
        color: [242, 125, 8],
        windSpeed: 150,
        gustInterval: 5000
      }
    ]
  }
}
```

Register effect in EffectSystem.initialize():
```javascript
initialize(theme) {
  this.clearEffects();

  if (theme.effects && theme.effects.ambient) {
    theme.effects.ambient.forEach(effectConfig => {
      if (effectConfig.type === 'sandstorm') {
        this.addEffect(new SandstormEffect(effectConfig));
      }
    });
  }
}
```

**Step 2.2: Heat Distortion Effect (60 min)**

```javascript
class HeatDistortionEffect extends AnimatedEffect {
  constructor(config) {
    super({
      ...config,
      layer: 'postprocess',
      lifespan: -1
    });

    this.intensity = config.intensity || 0.3;
    this.waveAmplitude = config.waveAmplitude || 2;
    this.waveFrequency = config.waveFrequency || 0.5;
  }

  render(context, canvas, camera) {
    if (this.intensity === 0) return;

    // Apply subtle wave distortion to lower portion of screen
    const distortHeight = canvas.height * 0.3;
    const imageData = context.getImageData(0, canvas.height - distortHeight, canvas.width, distortHeight);
    const outputData = context.createImageData(imageData);

    for (let y = 0; y < distortHeight; y++) {
      const waveOffset = Math.sin((y * this.waveFrequency) + (this.animationPhase * 2)) * this.waveAmplitude * this.intensity;

      for (let x = 0; x < canvas.width; x++) {
        const sourceX = Math.floor(x + waveOffset);
        if (sourceX >= 0 && sourceX < canvas.width) {
          const sourceIdx = (y * canvas.width + sourceX) * 4;
          const destIdx = (y * canvas.width + x) * 4;

          outputData.data[destIdx] = imageData.data[sourceIdx];
          outputData.data[destIdx + 1] = imageData.data[sourceIdx + 1];
          outputData.data[destIdx + 2] = imageData.data[sourceIdx + 2];
          outputData.data[destIdx + 3] = imageData.data[sourceIdx + 3];
        }
      }
    }

    context.putImageData(outputData, 0, canvas.height - distortHeight);
  }

  update(dt) {
    this.animationPhase += dt * this.animationSpeed;
    return true;
  }
}
```

**Step 2.3: Dust Cloud Gameplay Effect (30 min)**

```javascript
class DustCloudEffect extends ParticleEffect {
  constructor(x, y, config) {
    super({
      ...config,
      layer: 'midground',
      lifespan: 0.5
    });

    this.x = x;
    this.y = y;
    this.particleCount = config.particleCount || 12;
    this.color = config.color || [194, 149, 92];

    this.spawnParticles();
  }

  spawnParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      const angle = (Math.PI * 2 * i) / this.particleCount;
      const speed = 50 + Math.random() * 30;

      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.5,
        maxLife: 0.5,
        size: 3 + Math.random() * 3,
        color: `${this.color[0]}, ${this.color[1]}, ${this.color[2]}`
      });
    }
  }

  update(dt) {
    super.update(dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Friction
      p.vx *= 0.95;
      p.vy *= 0.95;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    return this.particles.length > 0;
  }

  render(context, canvas, camera) {
    context.save();

    this.particles.forEach(p => {
      const screenX = canvas.width / 2 + p.x - camera.x;
      const screenY = canvas.height / 2 + p.y - camera.y;
      const alpha = p.life / p.maxLife;

      context.fillStyle = `rgba(${p.color}, ${alpha * 0.6})`;
      context.fillRect(screenX - p.size/2, screenY - p.size/2, p.size, p.size);
    });

    context.restore();
  }
}

// Add to EffectSystem
onTankTurn(x, y, oldDirection, newDirection) {
  const theme = getCurrentTheme();
  if (!theme.effects || !theme.effects.gameplay) return;

  const dustConfig = theme.effects.gameplay.find(e => e.type === 'dustClouds');
  if (!dustConfig) return;

  // Calculate turn angle
  let angleDiff = Math.abs(newDirection - oldDirection);
  if (angleDiff > Math.PI) angleDiff = 2 * Math.PI - angleDiff;
  const angleDegrees = angleDiff * 180 / Math.PI;

  if (angleDegrees >= dustConfig.threshold) {
    this.addEffect(new DustCloudEffect(x, y, dustConfig));
  }
}
```

**Testing Phase 2:**
- Test sandstorm appearance and performance
- Verify gust effect works
- Test heat distortion (may be heavy, consider LOW quality toggle)
- Test dust clouds on sharp turns
- Check FPS impact

---

### Phase 3: Arctic Theme Effects (2-3 hours)

**Step 3.1: Snowfall Effect (60 min)**

```javascript
class SnowfallEffect extends ParticleEffect {
  constructor(config) {
    super({
      ...config,
      layer: 'background',
      lifespan: -1
    });

    this.particleCount = config.particleCount || 80;
    this.fallSpeedRange = config.fallSpeedRange || [50, 150];
    this.driftSpeed = config.driftSpeed || 30;

    this.initializeParticles();
  }

  initializeParticles() {
    const canvas = document.getElementById('game-canvas');

    for (let i = 0; i < this.particleCount; i++) {
      this.spawnParticle(canvas.width, canvas.height, true);
    }
  }

  spawnParticle(canvasWidth, canvasHeight, randomY = false) {
    const x = Math.random() * canvasWidth;
    const y = randomY ? Math.random() * canvasHeight : -10;

    const fallSpeed = this.fallSpeedRange[0] + Math.random() * (this.fallSpeedRange[1] - this.fallSpeedRange[0]);
    const driftSpeed = (Math.random() - 0.5) * this.driftSpeed;

    const size = 2 + Math.random() * 4;
    const life = (canvasHeight + 50) / fallSpeed;

    this.particles.push({
      x, y,
      vx: driftSpeed,
      vy: fallSpeed,
      life,
      maxLife: life,
      size,
      color: '255, 255, 255',
      alpha: 0.6 + Math.random() * 0.4
    });
  }

  update(dt, gameState, camera) {
    const canvas = document.getElementById('game-canvas');

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;

      // Add subtle drift variation
      p.vx += (Math.random() - 0.5) * 10 * dt;
      p.vx = Math.max(-this.driftSpeed, Math.min(this.driftSpeed, p.vx));

      if (p.y > canvas.height + 20 || p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Respawn particles
    while (this.particles.length < this.particleCount) {
      this.spawnParticle(canvas.width, canvas.height, false);
    }

    return true;
  }

  render(context, canvas, camera) {
    context.save();

    this.particles.forEach(p => {
      context.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      context.beginPath();
      context.arc(p.x, p.y, p.size / 2, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
  }
}
```

**Step 3.2: Ice Track Trails (90 min)**

```javascript
class IceTrackSystem {
  constructor() {
    this.tracks = [];  // Array of track segments
    this.maxTracks = 100;
    this.fadeTime = 2.5;  // seconds
  }

  addTrack(x, y, direction, width = 30) {
    // Create track segment
    const track = {
      x, y, direction, width,
      age: 0,
      lifespan: this.fadeTime
    };

    this.tracks.push(track);

    // Limit total tracks
    if (this.tracks.length > this.maxTracks) {
      this.tracks.shift();
    }
  }

  update(dt) {
    for (let i = this.tracks.length - 1; i >= 0; i--) {
      this.tracks[i].age += dt;
      if (this.tracks[i].age >= this.tracks[i].lifespan) {
        this.tracks.splice(i, 1);
      }
    }
  }

  render(context, canvas, camera) {
    context.save();

    this.tracks.forEach(track => {
      const alpha = 1.0 - (track.age / track.lifespan);
      const screenX = canvas.width / 2 + track.x - camera.x;
      const screenY = canvas.height / 2 + track.y - camera.y;

      context.save();
      context.translate(screenX, screenY);
      context.rotate(track.direction);

      // Draw two parallel track lines
      context.strokeStyle = `rgba(180, 220, 255, ${alpha * 0.5})`;
      context.lineWidth = 3;

      context.beginPath();
      context.moveTo(-track.width / 2, -5);
      context.lineTo(-track.width / 2, 5);
      context.stroke();

      context.beginPath();
      context.moveTo(track.width / 2, -5);
      context.lineTo(track.width / 2, 5);
      context.stroke();

      context.restore();
    });

    context.restore();
  }
}

// Integrate into EffectSystem
// In update loop, track tank positions and add tracks
```

**Step 3.3: Ice Refraction (30 min)**

```javascript
class IceRefractionEffect extends Effect {
  constructor(config) {
    super({
      ...config,
      layer: 'midground',
      lifespan: -1
    });

    this.shimmerPhase = 0;
  }

  update(dt) {
    this.shimmerPhase += dt * 2;
    return true;
  }

  render(context, canvas, camera) {
    const { OBSTACLES } = require('../../shared/constants');

    context.save();

    OBSTACLES.forEach(obstacle => {
      const vertices = obstacle;

      // Calculate center
      let cx = 0, cy = 0;
      vertices.forEach(v => { cx += v[0]; cy += v[1]; });
      cx /= vertices.length;
      cy /= vertices.length;

      const screenX = canvas.width / 2 + cx - camera.x;
      const screenY = canvas.height / 2 + cy - camera.y;

      // Draw prismatic shimmer
      const shimmer = 0.2 + 0.1 * Math.sin(this.shimmerPhase + cx * 0.01);
      const gradient = context.createRadialGradient(screenX, screenY, 0, screenX, screenY, 50);
      gradient.addColorStop(0, `rgba(180, 220, 255, ${shimmer})`);
      gradient.addColorStop(1, 'rgba(180, 220, 255, 0)');

      context.fillStyle = gradient;
      context.beginPath();
      vertices.forEach((v, i) => {
        const vx = canvas.width / 2 + v[0] - camera.x;
        const vy = canvas.height / 2 + v[1] - camera.y;
        if (i === 0) context.moveTo(vx, vy);
        else context.lineTo(vx, vy);
      });
      context.closePath();
      context.fill();
    });

    context.restore();
  }
}
```

**Testing Phase 3:**
- Test snowfall appearance and performance
- Verify ice tracks render and fade correctly
- Test ice refraction shimmer
- Check overall Arctic theme cohesion
- Verify FPS remains acceptable

---

### Phase 4: Neon Theme Effects (3-4 hours)

**Step 4.1: Scanline Overlay (45 min)**

```javascript
class ScanlineEffect extends AnimatedEffect {
  constructor(config) {
    super({
      ...config,
      layer: 'foreground',
      lifespan: -1
    });

    this.lineCount = config.lineCount || 3;
    this.lineHeight = config.lineHeight || 2;
    this.speed = config.speed || 120;  // px/s
    this.color = config.color || [0, 240, 255];
    this.alpha = config.alpha || 0.15;

    // Initialize line positions
    this.lines = [];
    for (let i = 0; i < this.lineCount; i++) {
      this.lines.push({
        y: (i / this.lineCount) * window.innerHeight,
        offset: i * (window.innerHeight / this.lineCount)
      });
    }
  }

  update(dt) {
    const canvas = document.getElementById('game-canvas');

    this.lines.forEach(line => {
      line.y += this.speed * dt;
      if (line.y > canvas.height) {
        line.y = -this.lineHeight;
      }
    });

    return true;
  }

  render(context, canvas, camera) {
    context.save();
    context.fillStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${this.alpha})`;

    this.lines.forEach(line => {
      context.fillRect(0, line.y, canvas.width, this.lineHeight);
    });

    context.restore();
  }
}
```

**Step 4.2: Digital Glitch Effect (90 min)**

```javascript
class GlitchEffect extends Effect {
  constructor(x, y, config) {
    super({
      ...config,
      layer: 'postprocess',
      lifespan: 0.08  // 80ms
    });

    this.epicenterX = x;
    this.epicenterY = y;
    this.intensity = config.intensity || 1.0;
    this.glitchRegions = [];

    // Generate random glitch regions
    const regionCount = 3 + Math.floor(Math.random() * 5);
    for (let i = 0; i < regionCount; i++) {
      this.glitchRegions.push({
        x: x + (Math.random() - 0.5) * 200,
        y: y + (Math.random() - 0.5) * 200,
        width: 50 + Math.random() * 100,
        height: 10 + Math.random() * 30,
        offsetX: (Math.random() - 0.5) * 20 * this.intensity,
        offsetY: (Math.random() - 0.5) * 10 * this.intensity,
        rgbSeparation: Math.random() * 5 * this.intensity
      });
    }
  }

  render(context, canvas, camera) {
    context.save();

    this.glitchRegions.forEach(region => {
      const screenX = canvas.width / 2 + region.x - camera.x;
      const screenY = canvas.height / 2 + region.y - camera.y;

      try {
        // Get source image data
        const sourceData = context.getImageData(
          screenX, screenY,
          region.width, region.height
        );

        // Apply RGB separation
        const glitchedData = context.createImageData(sourceData);

        for (let y = 0; y < region.height; y++) {
          for (let x = 0; x < region.width; x++) {
            const idx = (y * region.width + x) * 4;

            // Red channel shift
            const rIdx = (y * region.width + Math.min(region.width - 1, x + region.rgbSeparation)) * 4;
            glitchedData.data[idx] = sourceData.data[rIdx];

            // Green channel (no shift)
            glitchedData.data[idx + 1] = sourceData.data[idx + 1];

            // Blue channel shift
            const bIdx = (y * region.width + Math.max(0, x - region.rgbSeparation)) * 4;
            glitchedData.data[idx + 2] = sourceData.data[bIdx + 2];

            glitchedData.data[idx + 3] = sourceData.data[idx + 3];
          }
        }

        // Draw glitched data with offset
        context.putImageData(
          glitchedData,
          screenX + region.offsetX,
          screenY + region.offsetY
        );
      } catch (e) {
        // Ignore errors from trying to read off-canvas
      }
    });

    context.restore();
  }
}

// Hook into explosion events
onExplosion(x, y, radius) {
  const theme = getCurrentTheme();
  if (theme.effects?.gameplay?.find(e => e.type === 'glitch')) {
    this.addEffect(new GlitchEffect(x, y, { intensity: 1.0 }));
  }
}
```

**Step 4.3: Motion Trails (60 min)**

```javascript
class MotionTrailEffect extends Effect {
  constructor(x, y, direction, config) {
    super({
      ...config,
      layer: 'midground',
      lifespan: 0.2
    });

    this.segments = [];
    this.segmentCount = 5;
    this.length = config.length || 40;
    this.colors = config.colors || [[255, 0, 255], [0, 240, 255]];

    // Create trail segments
    for (let i = 0; i < this.segmentCount; i++) {
      const t = i / this.segmentCount;
      const dist = this.length * t;

      this.segments.push({
        x: x - Math.cos(direction) * dist,
        y: y - Math.sin(direction) * dist,
        alpha: 1.0 - t,
        size: (1.0 - t) * 20
      });
    }
  }

  update(dt) {
    super.update(dt);

    // Fade out
    const fadeRatio = this.age / this.lifespan;
    this.segments.forEach(seg => {
      seg.alpha = (1.0 - fadeRatio) * seg.alpha;
    });

    return this.age < this.lifespan;
  }

  render(context, canvas, camera) {
    context.save();

    this.segments.forEach((seg, i) => {
      const screenX = canvas.width / 2 + seg.x - camera.x;
      const screenY = canvas.height / 2 + seg.y - camera.y;

      // Gradient between colors
      const t = i / this.segmentCount;
      const color = this.colors[0].map((c, idx) =>
        Math.floor(c + (this.colors[1][idx] - c) * t)
      );

      context.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${seg.alpha * 0.6})`;
      context.beginPath();
      context.arc(screenX, screenY, seg.size / 2, 0, Math.PI * 2);
      context.fill();
    });

    context.restore();
  }
}

// Track tank velocities and create trails for fast-moving tanks
// Add velocity tracking to gameState or calculate from position deltas
```

**Step 4.4: Grid Pulse Effect (45 min)**

```javascript
class GridPulseEffect extends Effect {
  constructor(x, y, config) {
    super({
      ...config,
      layer: 'foreground',
      lifespan: 0.5
    });

    this.x = x;
    this.y = y;
    this.radius = 0;
    this.maxRadius = config.maxRadius || 200;
    this.expansionSpeed = this.maxRadius / this.lifespan;
    this.color = config.color || [0, 240, 255];
  }

  update(dt) {
    super.update(dt);
    this.radius += this.expansionSpeed * dt;
    return this.age < this.lifespan;
  }

  render(context, canvas, camera) {
    const { MAP_SIZE } = require('../../shared/constants');
    const gridSize = 100;

    const screenX = canvas.width / 2 + this.x - camera.x;
    const screenY = canvas.height / 2 + this.y - camera.y;

    context.save();

    // Draw pulsing grid lines near epicenter
    const alpha = (1.0 - this.age / this.lifespan) * 0.5;
    context.strokeStyle = `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${alpha})`;
    context.lineWidth = 1.5;

    // Vertical lines
    for (let x = 0; x < MAP_SIZE; x += gridSize) {
      const dist = Math.abs(x - this.x);
      if (dist < this.radius && dist > this.radius - 50) {
        const lineX = canvas.width / 2 + x - camera.x;
        context.beginPath();
        context.moveTo(lineX, 0);
        context.lineTo(lineX, canvas.height);
        context.stroke();
      }
    }

    // Horizontal lines
    for (let y = 0; y < MAP_SIZE; y += gridSize) {
      const dist = Math.abs(y - this.y);
      if (dist < this.radius && dist > this.radius - 50) {
        const lineY = canvas.height / 2 + y - camera.y;
        context.beginPath();
        context.moveTo(0, lineY);
        context.lineTo(canvas.width, lineY);
        context.stroke();
      }
    }

    context.restore();
  }
}
```

**Testing Phase 4:**
- Test scanlines rendering smoothly
- Verify glitch effect triggers on explosions
- Test motion trails on fast-moving tanks
- Verify grid pulse effect
- Check overall Neon theme impact
- Performance test (Neon has most effects)

---

### Phase 5: Classic Theme Effects (1-2 hours)

**Step 5.1: Muzzle Flash (30 min)**

```javascript
class MuzzleFlashEffect extends Effect {
  constructor(x, y, direction, config) {
    super({
      ...config,
      layer: 'foreground',
      lifespan: 0.1
    });

    this.x = x;
    this.y = y;
    this.direction = direction;
    this.radius = config.radius || 30;
    this.color = config.color || [255, 255, 200];
  }

  render(context, canvas, camera) {
    const screenX = canvas.width / 2 + this.x - camera.x;
    const screenY = canvas.height / 2 + this.y - camera.y;

    context.save();

    const alpha = 1.0 - (this.age / this.lifespan);
    const gradient = context.createRadialGradient(screenX, screenY, 0, screenX, screenY, this.radius);
    gradient.addColorStop(0, `rgba(${this.color[0]}, ${this.color[1]}, ${this.color[2]}, ${alpha * 0.8})`);
    gradient.addColorStop(0.5, `rgba(255, 200, 100, ${alpha * 0.4})`);
    gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');

    context.fillStyle = gradient;
    context.beginPath();
    context.arc(screenX, screenY, this.radius, 0, Math.PI * 2);
    context.fill();

    context.restore();
  }
}
```

**Step 5.2: Impact Sparks (30 min)**

```javascript
class ImpactSparksEffect extends ParticleEffect {
  constructor(x, y, normal, config) {
    super({
      ...config,
      layer: 'midground',
      lifespan: 0.4
    });

    this.x = x;
    this.y = y;
    this.normal = normal;
    this.particleCount = config.particleCount || 8;

    this.spawnSparks();
  }

  spawnSparks() {
    // Calculate reflection direction
    const reflectionAngle = Math.atan2(this.normal[1], this.normal[0]);
    const spread = Math.PI / 3;  // 60 degree spread

    for (let i = 0; i < this.particleCount; i++) {
      const angle = reflectionAngle + (Math.random() - 0.5) * spread;
      const speed = 150 + Math.random() * 100;

      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.3,
        maxLife: 0.3,
        size: 2 + Math.random() * 2,
        color: Math.random() > 0.5 ? '255, 255, 200' : '255, 200, 100'
      });
    }
  }

  update(dt) {
    super.update(dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 300 * dt;  // Gravity
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    return this.particles.length > 0;
  }

  render(context, canvas, camera) {
    context.save();

    this.particles.forEach(p => {
      const screenX = canvas.width / 2 + p.x - camera.x;
      const screenY = canvas.height / 2 + p.y - camera.y;
      const alpha = p.life / p.maxLife;

      context.fillStyle = `rgba(${p.color}, ${alpha})`;
      context.fillRect(screenX - p.size/2, screenY - p.size/2, p.size, p.size);
    });

    context.restore();
  }
}
```

**Step 5.3: Ambient Dust (30 min)**

```javascript
class AmbientDustEffect extends ParticleEffect {
  constructor(config) {
    super({
      ...config,
      layer: 'background',
      lifespan: -1
    });

    this.particleCount = config.particleCount || 40;
    this.initializeParticles();
  }

  initializeParticles() {
    const canvas = document.getElementById('game-canvas');

    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 20,
        vy: (Math.random() - 0.5) * 20,
        size: 1 + Math.random() * 2,
        color: '200, 200, 200',
        alpha: 0.2 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2
      });
    }
  }

  update(dt) {
    const canvas = document.getElementById('game-canvas');

    this.particles.forEach(p => {
      // Brownian motion
      p.vx += (Math.random() - 0.5) * 30 * dt;
      p.vy += (Math.random() - 0.5) * 30 * dt;

      // Damping
      p.vx *= 0.98;
      p.vy *= 0.98;

      p.x += p.vx * dt;
      p.y += p.vy * dt;

      // Wrap around screen
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width) p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;

      // Alpha pulsing
      p.phase += dt;
      p.alpha = 0.2 + 0.2 * Math.sin(p.phase);
    });

    return true;
  }

  render(context, canvas, camera) {
    context.save();

    this.particles.forEach(p => {
      context.fillStyle = `rgba(${p.color}, ${p.alpha})`;
      context.fillRect(p.x - p.size/2, p.y - p.size/2, p.size, p.size);
    });

    context.restore();
  }
}
```

**Testing Phase 5:**
- Test muzzle flash on shooting
- Verify impact sparks on bullet-obstacle collision
- Test ambient dust particles
- Check Classic theme overall feel
- Performance verification

---

### Phase 6: Polish & Optimization (2 hours)

**Step 6.1: Performance Monitoring (45 min)**

Add to EffectSystem:

```javascript
class EffectSystem {
  constructor() {
    // ... existing code ...

    this.performanceStats = {
      updateTime: 0,
      renderTime: 0,
      particleCount: 0,
      effectCount: 0,
      fps: 60
    };

    this.fpsHistory = [];
    this.fpsCheckInterval = 1000;  // Check every second
    this.lastFpsCheck = 0;
  }

  update(dt, gameState, camera) {
    const startTime = performance.now();

    // Update all effects
    Object.values(this.layers).forEach(layer => {
      for (let i = layer.length - 1; i >= 0; i--) {
        if (!layer[i].update(dt, gameState, camera)) {
          layer.splice(i, 1);
        }
      }
    });

    // Performance monitoring
    const updateTime = performance.now() - startTime;
    this.performanceStats.updateTime = updateTime;
    this.performanceStats.effectCount = Object.values(this.layers)
      .reduce((sum, layer) => sum + layer.length, 0);

    // Auto-adjust quality if FPS drops
    this.monitorPerformance(dt);
  }

  monitorPerformance(dt) {
    this.lastFpsCheck += dt * 1000;

    if (this.lastFpsCheck >= this.fpsCheckInterval) {
      const avgFps = 1000 / dt;
      this.fpsHistory.push(avgFps);

      if (this.fpsHistory.length > 5) {
        this.fpsHistory.shift();
      }

      const avgOfLast5 = this.fpsHistory.reduce((a, b) => a + b, 0) / this.fpsHistory.length;
      this.performanceStats.fps = avgOfLast5;

      // Auto-adjust quality
      const { PERFORMANCE_MODE_FPS_THRESHOLD, EFFECT_DISABLE_FPS_THRESHOLD }
        = require('../../shared/constants').EFFECTS;

      if (avgOfLast5 < EFFECT_DISABLE_FPS_THRESHOLD && this.enabled) {
        console.warn('FPS critically low, disabling effects');
        this.enabled = false;
      } else if (avgOfLast5 < PERFORMANCE_MODE_FPS_THRESHOLD && !this.performanceMode) {
        console.warn('FPS low, enabling performance mode');
        this.enablePerformanceMode(true);
      } else if (avgOfLast5 > PERFORMANCE_MODE_FPS_THRESHOLD + 10 && this.performanceMode) {
        console.log('FPS recovered, disabling performance mode');
        this.enablePerformanceMode(false);
      }

      this.lastFpsCheck = 0;
    }
  }

  enablePerformanceMode(enabled) {
    this.performanceMode = enabled;

    if (enabled) {
      // Reduce particle counts
      Object.values(this.layers).forEach(layer => {
        layer.forEach(effect => {
          if (effect instanceof ParticleEffect && effect.particleCount) {
            effect.maxParticles = Math.floor(effect.maxParticles * 0.5);
          }
        });
      });

      // Disable expensive effects
      this.layers.postprocess = [];
    }
  }

  getPerformanceStats() {
    return { ...this.performanceStats };
  }
}
```

**Step 6.2: Quality Settings Implementation (45 min)**

```javascript
setQuality(quality) {
  this.quality = quality;
  const qualityConfig = require('../../shared/constants').EFFECTS.QUALITY_LEVELS[quality.toUpperCase()];

  if (!qualityConfig) return;

  // Apply quality settings
  Object.values(this.layers).forEach(layer => {
    layer.forEach(effect => {
      if (effect instanceof ParticleEffect) {
        effect.maxParticles = Math.floor(
          effect.maxParticles * qualityConfig.particleMultiplier
        );
      }
    });
  });

  // Disable expensive effects on low quality
  if (!qualityConfig.enableComplexEffects) {
    this.layers.postprocess = [];
  }

  if (!qualityConfig.enableDistortion) {
    this.layers.postprocess = this.layers.postprocess.filter(
      e => !(e instanceof HeatDistortionEffect)
    );
  }

  console.log(`Effect quality set to: ${quality}`);
}
```

**Step 6.3: Effect Culling (30 min)**

Add viewport culling to reduce rendering cost:

```javascript
isEffectVisible(effect, canvas, camera, margin = 100) {
  if (!effect.x || !effect.y) return true;  // Always render non-positional effects

  const screenX = canvas.width / 2 + effect.x - camera.x;
  const screenY = canvas.height / 2 + effect.y - camera.y;

  return screenX > -margin && screenX < canvas.width + margin &&
         screenY > -margin && screenY < canvas.height + margin;
}

renderLayer(layer, canvas, camera) {
  const startTime = performance.now();
  const context = canvas.getContext('2d');

  const effectsToRender = this.layers[layer].filter(
    effect => this.isEffectVisible(effect, canvas, camera)
  );

  effectsToRender.forEach(effect => {
    effect.render(context, canvas, camera);
  });

  const renderTime = performance.now() - startTime;
  this.performanceStats.renderTime += renderTime;
}
```

**Testing Phase 6:**
- Monitor FPS with effects enabled
- Test auto-quality adjustment
- Verify performance mode activates when needed
- Test effect culling
- Stress test with multiple effects active

---

## Effect Specifications

### Effect Configuration Reference

Each effect type has specific configuration parameters:

#### Sandstorm
```javascript
{
  type: 'sandstorm',
  intensity: 0.7,          // 0-1 scale
  particleCount: 60,       // Number of particles
  color: [242, 125, 8],    // RGB array
  windSpeed: 150,          // px/s
  gustInterval: 5000       // ms between gusts
}
```

#### Snowfall
```javascript
{
  type: 'snowfall',
  particleCount: 80,
  fallSpeedRange: [50, 150],
  driftSpeed: 30
}
```

#### Scanlines
```javascript
{
  type: 'scanlines',
  lineCount: 3,
  lineHeight: 2,
  speed: 120,
  color: [0, 240, 255],
  alpha: 0.15
}
```

#### Heat Distortion
```javascript
{
  type: 'heatDistortion',
  intensity: 0.3,
  waveAmplitude: 2,
  waveFrequency: 0.5
}
```

---

## Performance Optimization

### Optimization Techniques

1. **Particle Pooling**
   - Pre-allocate particle objects
   - Reuse instead of creating new
   - Reduces GC pressure

2. **Viewport Culling**
   - Only render effects visible on screen
   - Check bounds before rendering
   - Significant savings for off-screen effects

3. **Quality Levels**
   - LOW: 30% particles, 30 FPS update, no post-process
   - MEDIUM: 60% particles, 60 FPS, simple post-process
   - HIGH: 100% particles, 60 FPS, all effects
   - ULTRA: 150% particles, 60 FPS, maximum quality

4. **Adaptive Performance**
   - Monitor FPS continuously
   - Auto-reduce quality if FPS < 45
   - Disable effects if FPS < 30

5. **Effect Complexity Budget**
   - Limit total active effects
   - Pool and reuse effect objects
   - Short-lived effects cleaned up immediately

---

## Testing Strategy

### Unit Testing

Test each effect class individually:

```javascript
// Test sandstorm particle generation
const sandstorm = new SandstormEffect({ particleCount: 60, windSpeed: 150 });
console.assert(sandstorm.particles.length === 60, 'Particle count mismatch');

// Test effect lifecycle
const effect = new DustCloudEffect(100, 100, {});
effect.update(0.1);
console.assert(effect.active, 'Effect should be active');
effect.update(1.0);  // Exceed lifespan
console.assert(!effect.active, 'Effect should be inactive');
```

### Integration Testing

1. **Theme Switching**
   - Switch between all themes
   - Verify effects load correctly
   - Check for memory leaks

2. **Performance Testing**
   - Run with all effects for 5 minutes
   - Monitor FPS and memory
   - Verify no degradation over time

3. **Event Testing**
   - Trigger all gameplay events
   - Verify effects spawn correctly
   - Check effect cleanup

### Visual QA Checklist

- [ ] All themes have appropriate effects
- [ ] Effects don't obscure gameplay
- [ ] No visual artifacts or glitches
- [ ] Smooth animations without stuttering
- [ ] Effects respect theme color palette
- [ ] Particle effects fade smoothly
- [ ] No z-fighting or layering issues

### Performance QA Checklist

- [ ] FPS remains > 55 on medium hardware
- [ ] Memory usage stable (no leaks)
- [ ] Effects disable gracefully when needed
- [ ] Quality settings work correctly
- [ ] Particle counts respect limits
- [ ] No sudden FPS drops

---

## Risk Mitigation

### Potential Risks

1. **Performance Impact**
   - Mitigation: Strict budgets, quality levels, auto-disable

2. **Visual Clutter**
   - Mitigation: Subtle effects, opacity control, user toggles

3. **Browser Compatibility**
   - Mitigation: Feature detection, fallbacks, graceful degradation

4. **Complexity Creep**
   - Mitigation: Modular design, clear APIs, documentation

---

## Success Criteria

### Must Have
- ✅ All 4 themes have unique effects
- ✅ FPS impact < 5% on medium hardware
- ✅ No gameplay obstruction
- ✅ Effects enhance theme atmosphere

### Nice to Have
- ✅ User-configurable quality settings
- ✅ Per-effect toggles
- ✅ Performance auto-adjustment
- ✅ Accessibility options (reduce motion)

### Future Enhancements
- Weather transitions
- Seasonal variations
- Custom effect scripting
- More themes with effects

---

## Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| Phase 1 | 2 hrs | Foundation & architecture |
| Phase 2 | 2-3 hrs | Desert effects |
| Phase 3 | 2-3 hrs | Arctic effects |
| Phase 4 | 3-4 hrs | Neon effects |
| Phase 5 | 1-2 hrs | Classic effects |
| Phase 6 | 2 hrs | Polish & optimization |
| **Total** | **12-16 hrs** | Complete implementation |

---

## Conclusion

This implementation plan provides a complete roadmap for adding theme-specific visual effects to DankTanks.io. The modular architecture allows for easy extension, performance optimization ensures smooth gameplay, and the phased approach enables incremental delivery.

**Next Steps:**
1. Review and approve this plan
2. Begin Phase 1 implementation
3. Test after each phase
4. Iterate based on feedback
5. Deploy and monitor performance

**Questions or clarifications?** Please ask before beginning implementation!
