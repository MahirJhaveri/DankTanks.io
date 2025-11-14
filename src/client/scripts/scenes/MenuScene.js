import Phaser from 'phaser';
import { getCurrentTheme } from '../../../shared/theme';

const Constants = require('../../../shared/constants');
const { MAP_SIZE } = Constants;

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
    this.cameraAngle = 0;
  }

  create() {
    // Create background
    this.createBackground();

    // Setup camera to pan around the map in a circle
    this.cameras.main.setBounds(0, 0, MAP_SIZE, MAP_SIZE);
    this.cameras.main.setZoom(1);
  }

  update(time, delta) {
    // Rotate camera around the center of the map
    // This creates the circular panning effect from the original menu
    const t = time / 7500;
    const centerX = MAP_SIZE / 2;
    const centerY = MAP_SIZE / 2;
    const radius = 800;

    const cameraX = centerX + radius * Math.cos(t) - this.cameras.main.width / 2;
    const cameraY = centerY + radius * Math.sin(t) - this.cameras.main.height / 2;

    this.cameras.main.scrollX = cameraX;
    this.cameras.main.scrollY = cameraY;
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
  }
}
