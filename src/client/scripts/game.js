import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';

const Constants = require('../../shared/constants');
const { MAP_SIZE } = Constants;

const config = {
  type: Phaser.AUTO, // Use WebGL if available, fallback to Canvas
  width: window.innerWidth,
  height: window.innerHeight,
  parent: 'game-container',
  backgroundColor: '#000000',
  scene: [MenuScene, GameScene],
  render: {
    pixelArt: false,
    antialias: true
  },
  fps: {
    target: 60,
    forceSetTimeOut: false
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  }
};

// Create the game instance
export const game = new Phaser.Game(config);

// Export functions to control the game
export function startGame() {
  game.scene.stop('MenuScene');
  game.scene.start('GameScene');
}

export function showMenu() {
  game.scene.stop('GameScene');
  game.scene.start('MenuScene');
}

// Handle window resize
window.addEventListener('resize', () => {
  game.scale.resize(window.innerWidth, window.innerHeight);
});

// Start with the menu scene
game.scene.start('MenuScene');
