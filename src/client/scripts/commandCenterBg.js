// Command Center Background - Tactical grid with animated scanlines

const Constants = require('../../shared/constants');
const { COMMAND_CENTER_BG } = Constants;

const canvas = document.getElementById('command-center-bg');
const ctx = canvas.getContext('2d');

let isActive = false;
let animationFrameId = null;
let scanlines = [];
let lastScanlineTime = 0;
let startTime = 0;

// Scanline object
class Scanline {
  constructor() {
    this.y = 0;
    this.speed = COMMAND_CENTER_BG.SCANLINE_SPEED;
    this.opacity = 1;
  }

  update(dt) {
    this.y += this.speed * dt;

    // Fade out near the bottom
    if (this.y > canvas.height - 200) {
      this.opacity = Math.max(0, 1 - (this.y - (canvas.height - 200)) / 200);
    }
  }

  draw() {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // Main scanline
    ctx.strokeStyle = COMMAND_CENTER_BG.SCANLINE_COLOR;
    ctx.lineWidth = COMMAND_CENTER_BG.SCANLINE_WIDTH;
    ctx.beginPath();
    ctx.moveTo(0, this.y);
    ctx.lineTo(canvas.width, this.y);
    ctx.stroke();

    // Glow effect
    ctx.strokeStyle = COMMAND_CENTER_BG.SCANLINE_COLOR.replace('0.3', '0.1');
    ctx.lineWidth = COMMAND_CENTER_BG.SCANLINE_WIDTH * 3;
    ctx.beginPath();
    ctx.moveTo(0, this.y);
    ctx.lineTo(canvas.width, this.y);
    ctx.stroke();

    ctx.restore();
  }

  isOffScreen() {
    return this.y > canvas.height;
  }
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function drawGrid() {
  const gridSize = COMMAND_CENTER_BG.GRID_SIZE;

  // Add subtle flicker effect
  const flicker = 1 + (Math.random() - 0.5) * COMMAND_CENTER_BG.FLICKER_INTENSITY;

  ctx.save();
  ctx.globalAlpha = flicker;
  ctx.strokeStyle = COMMAND_CENTER_BG.GRID_COLOR;
  ctx.lineWidth = 1;

  // Draw vertical lines
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  // Draw horizontal lines
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  ctx.restore();
}

function drawCornerAccents() {
  const accentSize = 40;
  const offset = 30;

  ctx.save();
  ctx.strokeStyle = COMMAND_CENTER_BG.ACCENT_COLOR;
  ctx.lineWidth = 3;

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(offset, offset + accentSize);
  ctx.lineTo(offset, offset);
  ctx.lineTo(offset + accentSize, offset);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.width - offset - accentSize, offset);
  ctx.lineTo(canvas.width - offset, offset);
  ctx.lineTo(canvas.width - offset, offset + accentSize);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(offset, canvas.height - offset - accentSize);
  ctx.lineTo(offset, canvas.height - offset);
  ctx.lineTo(offset + accentSize, canvas.height - offset);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.width - offset - accentSize, canvas.height - offset);
  ctx.lineTo(canvas.width - offset, canvas.height - offset);
  ctx.lineTo(canvas.width - offset, canvas.height - offset - accentSize);
  ctx.stroke();

  ctx.restore();
}

function drawScanlines(dt) {
  // Update and draw existing scanlines
  for (let i = scanlines.length - 1; i >= 0; i--) {
    scanlines[i].update(dt);
    scanlines[i].draw();

    // Remove off-screen scanlines
    if (scanlines[i].isOffScreen()) {
      scanlines.splice(i, 1);
    }
  }
}

function update() {
  if (!isActive) return;

  const currentTime = Date.now();
  const dt = (currentTime - startTime) / 1000; // Delta time in seconds
  startTime = currentTime;

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw grid
  drawGrid();

  // Draw corner accents
  drawCornerAccents();

  // Spawn new scanline periodically
  if (currentTime - lastScanlineTime > COMMAND_CENTER_BG.SCANLINE_INTERVAL) {
    scanlines.push(new Scanline());
    lastScanlineTime = currentTime;
  }

  // Draw scanlines
  drawScanlines(dt);

  animationFrameId = requestAnimationFrame(update);
}

export function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  startTime = Date.now();
  lastScanlineTime = Date.now() - COMMAND_CENTER_BG.SCANLINE_INTERVAL + 500; // First scanline appears soon
}

export function show() {
  if (isActive) return;

  isActive = true;
  canvas.style.display = 'block';
  startTime = Date.now();
  update();
}

export function hide() {
  isActive = false;
  canvas.style.display = 'none';

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Clear scanlines
  scanlines = [];
}
