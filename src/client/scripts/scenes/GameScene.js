import Phaser from 'phaser';
import { getCurrentState } from '../state';
import { getCurrentTheme } from '../../../shared/theme';

const Constants = require('../../../shared/constants');
const { PLAYER_RADIUS, PLAYER_MAX_HP, BULLET_RADIUS, MAP_SIZE, SPRITES,
    EXPLOSION_RADIUS, CROWN_RADIUS, HEALTH_PACK_RADIUS, OBSTACLES,
    SMOKE_SPAWN_DISTANCE, SMOKE_PARTICLE_COLOR, SMOKE_PARTICLE_LIFESPAN,
    SMOKE_PARTICLE_DENSITY, SMOKE_PARTICLE_SPEED, TANK } = Constants;

export class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });

    // Object pools for efficient rendering
    this.playerSprites = new Map();
    this.bulletSprites = new Map();
    this.explosionSprites = new Map();
    this.crownSprites = new Map();
    this.healthPackSprites = new Map();

    // Graphics objects
    this.backgroundGraphics = null;
    this.gridGraphics = null;
    this.obstacleGraphics = null;

    // Particle emitters
    this.smokeEmitter = null;

    // Position tracking for smoke effect
    this.lastPlayerPositions = new Map();

    // Counters for unique IDs
    this.bulletIdCounter = 0;
  }

  preload() {
    // Load tank sprites
    this.load.image('tank-blue', `/assets/${SPRITES.TANK_BLUE}`);
    this.load.image('tank-red', `/assets/${SPRITES.TANK_RED}`);
    this.load.image('tank-green', `/assets/${SPRITES.TANK_GREEN}`);
    this.load.image('tank-gray', `/assets/${SPRITES.TANK_GRAY}`);
    this.load.image('tank-usa', `/assets/${SPRITES.TANK_USA}`);

    // Load turret sprites
    this.load.image('turret-blue', `/assets/${SPRITES.TURRET_BLUE}`);
    this.load.image('turret-red', `/assets/${SPRITES.TURRET_RED}`);
    this.load.image('turret-green', `/assets/${SPRITES.TURRET_GREEN}`);
    this.load.image('turret-gray', `/assets/${SPRITES.TURRET_GRAY}`);
    this.load.image('turret-usa', `/assets/${SPRITES.TURRET_USA}`);

    // Load bullet sprite
    this.load.image('laser', `/assets/${SPRITES.LASERBEAM}`);

    // Load explosion sprites
    this.load.image('explosion1', `/assets/${SPRITES.EXPLOSION.STATE1}`);
    this.load.image('explosion2', `/assets/${SPRITES.EXPLOSION.STATE2}`);
    this.load.image('explosion3', `/assets/${SPRITES.EXPLOSION.STATE3}`);
    this.load.image('explosion4', `/assets/${SPRITES.EXPLOSION.STATE4}`);
    this.load.image('explosion5', `/assets/${SPRITES.EXPLOSION.STATE5}`);
    this.load.image('explosion6', `/assets/${SPRITES.EXPLOSION.STATE6}`);
    this.load.image('explosion7', `/assets/${SPRITES.EXPLOSION.STATE7}`);
    this.load.image('explosion8', `/assets/${SPRITES.EXPLOSION.STATE8}`);

    // Load crown and health pack
    this.load.image('crown', `/assets/${SPRITES.CROWN}`);
    this.load.image('healthpack', `/assets/${SPRITES.HEALTH_PACK}`);

    // Create a simple smoke particle texture
    const graphics = this.make.graphics({ x: 0, y: 0, add: false });
    graphics.fillStyle(0x3c3c3c, 1);
    graphics.fillRect(0, 0, 8, 8);
    graphics.generateTexture('smoke-particle', 8, 8);
    graphics.destroy();
  }

  create() {
    const theme = getCurrentTheme();

    // Create background
    this.createBackground();

    // Create obstacles graphics
    this.obstacleGraphics = this.add.graphics();
    this.obstacleGraphics.setDepth(1);
    this.renderObstacles();

    // Create grid graphics
    this.gridGraphics = this.add.graphics();
    this.gridGraphics.setDepth(2);

    // Create boundary rectangle
    this.boundaryGraphics = this.add.graphics();
    this.boundaryGraphics.setDepth(3);

    // Create particle emitter for smoke
    this.smokeEmitter = this.add.particles(0, 0, 'smoke-particle', {
      speed: { min: 40, max: 100 },
      angle: { min: 0, max: 360 },
      scale: { start: 1, end: 0.1 },
      alpha: { start: 0.6, end: 0 },
      lifespan: SMOKE_PARTICLE_LIFESPAN * 1000,
      gravityY: -20,
      frequency: -1, // Manual emission
      tint: 0x3c3c3c
    });
    this.smokeEmitter.setDepth(4);

    // Setup camera
    this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
    this.cameras.main.setZoom(1);

    // Set physics world bounds (for reference, though we don't use Phaser physics)
    this.physics.world.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
  }

  update(time, delta) {
    const state = getCurrentState();
    if (!state.me) {
      return;
    }

    const { me, others, bullets, explosions, crowns, healthPacks } = state;

    // Update camera to follow player
    this.cameras.main.scrollX = me.x - this.cameras.main.width / 2;
    this.cameras.main.scrollY = me.y - this.cameras.main.height / 2;

    // Render grid and boundary every frame (matches original vanilla JS behavior)
    this.renderGrid();
    this.renderBoundary();

    // Update all game objects
    this.updateBullets(bullets);

    // Check and emit smoke for moving players
    this.checkAndEmitSmoke(me, me);
    others.forEach(other => this.checkAndEmitSmoke(me, other));

    // Cleanup position tracking
    this.cleanupPositionTracking([me, ...others]);

    // Update players
    this.updatePlayer(me, true);
    others.forEach(other => this.updatePlayer(other, false));

    // Update explosions
    this.updateExplosions(explosions);

    // Update crowns
    this.updateCrowns(crowns);

    // Update health packs
    this.updateHealthPacks(healthPacks || []);

    // Cleanup unused sprites
    this.cleanupUnusedSprites(bullets, explosions, crowns, healthPacks, [me, ...others]);
  }

  createBackground() {
    const theme = getCurrentTheme();

    // Create radial gradient texture
    const graphics = this.add.graphics();
    const centerX = MAP_SIZE / 2;
    const centerY = MAP_SIZE / 2;

    // Parse hex colors
    const color1 = Phaser.Display.Color.HexStringToColor(theme.background.colors[0]);
    const color2 = Phaser.Display.Color.HexStringToColor(theme.background.colors[1]);

    // Create gradient by drawing concentric circles
    const steps = 50;
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1);
      const radius = (MAP_SIZE / 2) * t;

      const color = Phaser.Display.Color.Interpolate.ColorWithColor(
        color1, color2, steps, i
      );

      graphics.fillStyle(Phaser.Display.Color.GetColor(color.r, color.g, color.b), 1);
      graphics.fillCircle(centerX, centerY, radius);
    }

    graphics.setDepth(-1);
    this.backgroundGraphics = graphics;
  }

  renderGrid() {
    const theme = getCurrentTheme();
    this.gridGraphics.clear();

    if (!theme.grid.enabled) {
      return;
    }

    const color = Phaser.Display.Color.HexStringToColor(theme.grid.color);
    this.gridGraphics.lineStyle(theme.grid.lineWidth, color.color);

    for (let x = 0; x < MAP_SIZE; x += 100) {
      for (let y = 0; y < MAP_SIZE; y += 100) {
        this.gridGraphics.strokeRect(x, y, 100, 100);
      }
    }
  }

  renderBoundary() {
    const theme = getCurrentTheme();
    this.boundaryGraphics.clear();
    const color = Phaser.Display.Color.HexStringToColor(theme.boundary.color);
    this.boundaryGraphics.lineStyle(theme.boundary.lineWidth, color.color);
    this.boundaryGraphics.strokeRect(0, 0, MAP_SIZE, MAP_SIZE);
  }

  renderObstacles() {
    const theme = getCurrentTheme();
    this.obstacleGraphics.clear();

    const fillColor = Phaser.Display.Color.HexStringToColor(theme.obstacles.fillColor);
    this.obstacleGraphics.fillStyle(fillColor.color);

    // Add shadow/glow effect
    this.obstacleGraphics.lineStyle(0);

    OBSTACLES.forEach(obstacle => {
      this.obstacleGraphics.beginPath();
      this.obstacleGraphics.moveTo(obstacle[0][0], obstacle[0][1]);
      for (let i = 1; i < obstacle.length; i++) {
        this.obstacleGraphics.lineTo(obstacle[i][0], obstacle[i][1]);
      }
      this.obstacleGraphics.closePath();
      this.obstacleGraphics.fillPath();
    });
  }

  updatePlayer(player, isMe) {
    const playerId = player.id || 'me';
    let sprite = this.playerSprites.get(playerId);

    if (!sprite) {
      // Create new player sprite container
      sprite = this.add.container(player.x, player.y);
      sprite.setDepth(10);

      // Get tank and turret textures based on tank style
      const tankKey = this.getTankKey(player.tankStyle);
      const turretKey = this.getTurretKey(player.tankStyle);

      // Create tank sprite
      const tankSprite = this.add.sprite(0, 0, tankKey);
      tankSprite.setDisplaySize(PLAYER_RADIUS * 2, PLAYER_RADIUS * 2);

      // Create turret sprite
      const turretSprite = this.add.sprite(0, 0, turretKey);
      turretSprite.setDisplaySize(30, 60);

      // Create health bar background
      const healthBarBg = this.add.graphics();
      healthBarBg.fillStyle(0xffffff);
      healthBarBg.fillRect(-PLAYER_RADIUS, PLAYER_RADIUS + 8, PLAYER_RADIUS * 2, 4);

      // Create health bar foreground
      const healthBarFg = this.add.graphics();

      // Create username text
      const usernameText = this.add.text(0, PLAYER_RADIUS + 25, player.username, {
        fontSize: '10px',
        fontFamily: 'Comic Sans MS',
        color: '#ffffff',
        align: 'center'
      });
      usernameText.setOrigin(0.5, 0.5);

      // Add all to container
      sprite.add([tankSprite, turretSprite, healthBarBg, healthBarFg, usernameText]);

      // Store references
      sprite.tankSprite = tankSprite;
      sprite.turretSprite = turretSprite;
      sprite.healthBarFg = healthBarFg;
      sprite.usernameText = usernameText;

      this.playerSprites.set(playerId, sprite);
    }

    // Update position
    sprite.x = player.x;
    sprite.y = player.y;

    // Update rotations
    sprite.tankSprite.rotation = player.direction;
    sprite.turretSprite.rotation = player.turretDirection;

    // Update health bar - matches original vanilla JS implementation
    sprite.healthBarFg.clear();
    sprite.healthBarFg.fillStyle(0xff0000);
    const healthPercentage = player.hp / PLAYER_MAX_HP;
    const healthWidth = PLAYER_RADIUS * 2 * (1 - healthPercentage);
    sprite.healthBarFg.fillRect(
      -PLAYER_RADIUS + PLAYER_RADIUS * 2 * healthPercentage,
      PLAYER_RADIUS + 8,
      healthWidth,
      4
    );

    // Update username
    sprite.usernameText.setText(player.username);
  }

  updateBullets(bullets) {
    const activeBulletIds = new Set();

    bullets.forEach((bullet, index) => {
      // FIX: Use proper unique ID - combine position with index and a counter
      // This prevents ID collisions when multiple bullets are at the same position
      const bulletId = bullet.id || `bullet-${bullet.x.toFixed(2)}-${bullet.y.toFixed(2)}-${index}-${this.bulletIdCounter++}`;
      activeBulletIds.add(bulletId);

      let sprite = this.bulletSprites.get(bulletId);

      if (!sprite) {
        sprite = this.add.sprite(bullet.x, bullet.y, 'laser');
        sprite.setDisplaySize(BULLET_RADIUS * 8, BULLET_RADIUS * 8);
        sprite.setDepth(5);
        sprite.bulletData = { x: bullet.x, y: bullet.y, angle: bullet.drawAngle };
        this.bulletSprites.set(bulletId, sprite);
      }

      sprite.x = bullet.x;
      sprite.y = bullet.y;
      sprite.rotation = bullet.drawAngle;
      sprite.bulletData = { x: bullet.x, y: bullet.y, angle: bullet.drawAngle };
    });

    // Clean up bullets that no longer exist
    for (const [id, sprite] of this.bulletSprites.entries()) {
      if (!activeBulletIds.has(id)) {
        // Check if this bullet still exists in the current frame
        const stillExists = bullets.some(b =>
          Math.abs(b.x - sprite.bulletData.x) < 1 &&
          Math.abs(b.y - sprite.bulletData.y) < 1 &&
          Math.abs(b.drawAngle - sprite.bulletData.angle) < 0.1
        );

        if (!stillExists) {
          sprite.destroy();
          this.bulletSprites.delete(id);
        }
      }
    }
  }

  updateExplosions(explosions) {
    const activeExplosionIds = new Set();

    explosions.forEach(explosion => {
      // FIX: Use position-only ID and update texture instead of creating new sprites
      const explosionId = `${explosion.x.toFixed(2)}-${explosion.y.toFixed(2)}`;
      activeExplosionIds.add(explosionId);

      let sprite = this.explosionSprites.get(explosionId);

      if (!sprite) {
        const explosionKey = this.getExplosionKey(explosion.state);
        sprite = this.add.sprite(explosion.x, explosion.y, explosionKey);
        sprite.setDisplaySize(EXPLOSION_RADIUS * 2, EXPLOSION_RADIUS * 2);
        sprite.setDepth(11);
        sprite.currentState = explosion.state;
        this.explosionSprites.set(explosionId, sprite);
      } else {
        // Update texture if state changed
        if (sprite.currentState !== explosion.state) {
          const explosionKey = this.getExplosionKey(explosion.state);
          sprite.setTexture(explosionKey);
          sprite.currentState = explosion.state;
        }
      }

      sprite.x = explosion.x;
      sprite.y = explosion.y;
    });

    // Clean up old explosions
    for (const [id, sprite] of this.explosionSprites.entries()) {
      if (!activeExplosionIds.has(id)) {
        sprite.destroy();
        this.explosionSprites.delete(id);
      }
    }
  }

  updateCrowns(crowns) {
    const activeCrownIds = new Set();

    crowns.forEach(crown => {
      const crownId = `${crown.x}-${crown.y}`;
      activeCrownIds.add(crownId);

      let sprite = this.crownSprites.get(crownId);

      if (!sprite) {
        sprite = this.add.sprite(crown.x, crown.y, 'crown');
        sprite.setDepth(6);

        // Calculate base scale to achieve desired display size
        // Crown texture is 2000x2000, we want CROWN_RADIUS * 2 = 60 pixels
        const baseScale = (CROWN_RADIUS * 2) / sprite.width;

        // Add pulsing animation - oscillates between 0.85 and 1.15 (±15% variation) to match original
        this.tweens.add({
          targets: sprite,
          scale: { from: baseScale * 0.85, to: baseScale * 1.15 },
          duration: 360, // Full cycle to match sin wave period
          yoyo: true,
          repeat: -1
        });

        this.crownSprites.set(crownId, sprite);
      }

      sprite.x = crown.x;
      sprite.y = crown.y;
    });

    // Clean up old crowns
    for (const [id, sprite] of this.crownSprites.entries()) {
      if (!activeCrownIds.has(id)) {
        // Stop tweens before destroying
        this.tweens.killTweensOf(sprite);
        sprite.destroy();
        this.crownSprites.delete(id);
      }
    }
  }

  updateHealthPacks(healthPacks) {
    const activeHealthPackIds = new Set();

    healthPacks.forEach(healthPack => {
      const healthPackId = `${healthPack.x}-${healthPack.y}`;
      activeHealthPackIds.add(healthPackId);

      let sprite = this.healthPackSprites.get(healthPackId);

      if (!sprite) {
        sprite = this.add.sprite(healthPack.x, healthPack.y, 'healthpack');
        sprite.setDepth(6);

        // Calculate base scale to achieve desired display size
        // Health pack SVG is 100x100, we want HEALTH_PACK_RADIUS * 2 = 50 pixels
        const baseScale = (HEALTH_PACK_RADIUS * 2) / sprite.width;

        // Add pulsing animation - oscillates between 0.9 and 1.1 (±10% variation) to match original
        this.tweens.add({
          targets: sprite,
          scale: { from: baseScale * 0.9, to: baseScale * 1.1 },
          duration: 400, // Full cycle to match sin wave period
          yoyo: true,
          repeat: -1
        });

        this.healthPackSprites.set(healthPackId, sprite);
      }

      sprite.x = healthPack.x;
      sprite.y = healthPack.y;
    });

    // Clean up old health packs
    for (const [id, sprite] of this.healthPackSprites.entries()) {
      if (!activeHealthPackIds.has(id)) {
        // Stop tweens before destroying
        this.tweens.killTweensOf(sprite);
        sprite.destroy();
        this.healthPackSprites.delete(id);
      }
    }
  }

  checkAndEmitSmoke(me, player) {
    // Only emit smoke for visible tanks
    if (!this.isPlayerVisible(me, player)) {
      return;
    }

    const playerId = player.id || 'me';
    const lastPos = this.lastPlayerPositions.get(playerId);

    if (!lastPos) {
      this.lastPlayerPositions.set(playerId, { x: player.x, y: player.y });
      return;
    }

    // Calculate distance moved
    const dx = player.x - lastPos.x;
    const dy = player.y - lastPos.y;
    const distMoved = Math.sqrt(dx * dx + dy * dy);

    // Emit smoke if moved enough
    if (distMoved > SMOKE_SPAWN_DISTANCE) {
      const smokeX = player.x - Math.sin(player.direction) * PLAYER_RADIUS;
      const smokeY = player.y + Math.cos(player.direction) * PLAYER_RADIUS;

      // Emit smoke particles
      for (let i = 0; i < SMOKE_PARTICLE_DENSITY; i++) {
        this.smokeEmitter.emitParticleAt(smokeX, smokeY);
      }

      this.lastPlayerPositions.set(playerId, { x: player.x, y: player.y });
    }
  }

  isPlayerVisible(me, player) {
    const screenX = player.x - this.cameras.main.scrollX;
    const screenY = player.y - this.cameras.main.scrollY;
    const margin = 200;

    return screenX > -margin && screenX < this.cameras.main.width + margin &&
           screenY > -margin && screenY < this.cameras.main.height + margin;
  }

  cleanupPositionTracking(currentPlayers) {
    const currentPlayerIds = new Set(currentPlayers.map(p => p.id || 'me'));
    for (const playerId of this.lastPlayerPositions.keys()) {
      if (!currentPlayerIds.has(playerId)) {
        this.lastPlayerPositions.delete(playerId);
      }
    }
  }

  cleanupUnusedSprites(bullets, explosions, crowns, healthPacks, players) {
    // FIX: Improved cleanup logic for all sprite types

    // Cleanup players who disconnected
    const activePlayerIds = new Set(players.map(p => p.id || 'me'));
    for (const [id, sprite] of this.playerSprites.entries()) {
      if (!activePlayerIds.has(id)) {
        // Stop any tweens
        this.tweens.killTweensOf(sprite);
        sprite.destroy();
        this.playerSprites.delete(id);
      }
    }

    // Bullets are cleaned up in updateBullets()
    // Explosions are cleaned up in updateExplosions()
    // Crowns are cleaned up in updateCrowns()
    // HealthPacks are cleaned up in updateHealthPacks()
  }

  getTankKey(tankStyle) {
    switch (tankStyle) {
      case TANK.BLUE: return 'tank-blue';
      case TANK.RED: return 'tank-red';
      case TANK.GREEN: return 'tank-green';
      case TANK.GRAY: return 'tank-gray';
      case TANK.USA: return 'tank-usa';
      default: return 'tank-blue';
    }
  }

  getTurretKey(tankStyle) {
    switch (tankStyle) {
      case TANK.BLUE: return 'turret-blue';
      case TANK.RED: return 'turret-red';
      case TANK.GREEN: return 'turret-green';
      case TANK.GRAY: return 'turret-gray';
      case TANK.USA: return 'turret-usa';
      default: return 'turret-blue';
    }
  }

  getExplosionKey(state) {
    const explosionMap = {
      [SPRITES.EXPLOSION.STATE1]: 'explosion1',
      [SPRITES.EXPLOSION.STATE2]: 'explosion2',
      [SPRITES.EXPLOSION.STATE3]: 'explosion3',
      [SPRITES.EXPLOSION.STATE4]: 'explosion4',
      [SPRITES.EXPLOSION.STATE5]: 'explosion5',
      [SPRITES.EXPLOSION.STATE6]: 'explosion6',
      [SPRITES.EXPLOSION.STATE7]: 'explosion7',
      [SPRITES.EXPLOSION.STATE8]: 'explosion8',
    };
    return explosionMap[state] || 'explosion1';
  }

  // FIX: Proper cleanup when scene is shut down
  shutdown() {
    // Clean up all sprites
    for (const sprite of this.playerSprites.values()) {
      this.tweens.killTweensOf(sprite);
      sprite.destroy();
    }
    this.playerSprites.clear();

    for (const sprite of this.bulletSprites.values()) {
      sprite.destroy();
    }
    this.bulletSprites.clear();

    for (const sprite of this.explosionSprites.values()) {
      sprite.destroy();
    }
    this.explosionSprites.clear();

    for (const sprite of this.crownSprites.values()) {
      this.tweens.killTweensOf(sprite);
      sprite.destroy();
    }
    this.crownSprites.clear();

    for (const sprite of this.healthPackSprites.values()) {
      this.tweens.killTweensOf(sprite);
      sprite.destroy();
    }
    this.healthPackSprites.clear();

    // Clean up graphics
    if (this.backgroundGraphics) {
      this.backgroundGraphics.destroy();
    }
    if (this.gridGraphics) {
      this.gridGraphics.destroy();
    }
    if (this.obstacleGraphics) {
      this.obstacleGraphics.destroy();
    }
    if (this.boundaryGraphics) {
      this.boundaryGraphics.destroy();
    }

    // Clean up particle emitter
    if (this.smokeEmitter) {
      this.smokeEmitter.destroy();
    }

    // Clear position tracking
    this.lastPlayerPositions.clear();
  }
}
