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
let statusIndicatorTime = 0; // Used to render status indicator animation

// Radar sweep state
let radarAngle = 0;
let radarBlips = [];
let lastRadarRingTime = 0;
let radarRings = [];

// Tactical data state
let tacticalData = {
  activeTanks: 0,
  uptime: 0,
  sector: 'A-7',
  coordinates: { lat: 0, lon: 0 },
  threatLevel: 'LOW',
};
let lastDataUpdateTime = 0;
let lastCoordUpdateTime = 0;

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

// Radar blip object
class RadarBlip {
  constructor() {
    // Random position within radar circle
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * COMMAND_CENTER_BG.RADAR_RADIUS * 0.8;
    this.x = Math.cos(angle) * distance;
    this.y = Math.sin(angle) * distance;
    this.opacity = 0.8;
    this.fadeRate = Math.random() * 0.3 + 0.2; // Random fade speed
  }

  update(dt) {
    this.opacity -= this.fadeRate * dt;
  }

  draw(centerX, centerY) {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.fillStyle = COMMAND_CENTER_BG.RADAR_BLIP_COLOR;
    ctx.beginPath();
    ctx.arc(centerX + this.x, centerY + this.y, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.opacity <= 0;
  }
}

// Radar ring object
class RadarRing {
  constructor() {
    this.radius = 0;
    this.opacity = 0.6;
    this.maxRadius = COMMAND_CENTER_BG.RADAR_RADIUS;
  }

  update(dt) {
    this.radius += 100 * dt; // Expand speed
    this.opacity = Math.max(0, 0.6 * (1 - this.radius / this.maxRadius));
  }

  draw(centerX, centerY) {
    if (this.opacity <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;
    ctx.strokeStyle = COMMAND_CENTER_BG.RADAR_COLOR;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, this.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  isDead() {
    return this.radius >= this.maxRadius;
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

function drawRadar(dt, currentTime) {
  const centerX = COMMAND_CENTER_BG.RADAR_POSITION.x;
  const centerY = COMMAND_CENTER_BG.RADAR_POSITION.y;
  const radius = COMMAND_CENTER_BG.RADAR_RADIUS;

  // Draw radar background circle
  ctx.save();
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.fill();

  // Draw radar border
  ctx.strokeStyle = COMMAND_CENTER_BG.RADAR_COLOR;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw concentric circles
  for (let i = 1; i <= 3; i++) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, (radius / 3) * i, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(0, 255, 100, 0.2)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw crosshairs
  ctx.strokeStyle = 'rgba(0, 255, 100, 0.3)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(centerX - radius, centerY);
  ctx.lineTo(centerX + radius, centerY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(centerX, centerY - radius);
  ctx.lineTo(centerX, centerY + radius);
  ctx.stroke();

  // Update and draw radar rings
  for (let i = radarRings.length - 1; i >= 0; i--) {
    radarRings[i].update(dt);
    radarRings[i].draw(centerX, centerY);
    if (radarRings[i].isDead()) {
      radarRings.splice(i, 1);
    }
  }

  // Spawn new ring periodically
  if (currentTime - lastRadarRingTime > COMMAND_CENTER_BG.RADAR_RING_INTERVAL) {
    radarRings.push(new RadarRing());
    lastRadarRingTime = currentTime;
  }

  // Update and draw blips
  for (let i = radarBlips.length - 1; i >= 0; i--) {
    radarBlips[i].update(dt);
    radarBlips[i].draw(centerX, centerY);
    if (radarBlips[i].isDead()) {
      radarBlips.splice(i, 1);
    }
  }

  // Maintain blip count
  while (radarBlips.length < COMMAND_CENTER_BG.RADAR_BLIP_COUNT) {
    radarBlips.push(new RadarBlip());
  }

  // Draw radar sweep
  radarAngle += COMMAND_CENTER_BG.RADAR_SWEEP_SPEED * dt;
  if (radarAngle > Math.PI * 2) {
    radarAngle -= Math.PI * 2;
  }

  // Sweep line with gradient
  const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
  gradient.addColorStop(0, 'rgba(0, 255, 100, 0.6)');
  gradient.addColorStop(0.5, 'rgba(0, 255, 100, 0.3)');
  gradient.addColorStop(1, 'rgba(0, 255, 100, 0)');

  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.arc(centerX, centerY, radius, radarAngle - 0.3, radarAngle);
  ctx.lineTo(centerX, centerY);
  ctx.fill();

  // Sweep line edge
  ctx.strokeStyle = COMMAND_CENTER_BG.RADAR_COLOR;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(centerX, centerY);
  ctx.lineTo(
    centerX + Math.cos(radarAngle) * radius,
    centerY + Math.sin(radarAngle) * radius
  );
  ctx.stroke();

  // Draw "RADAR" label
  ctx.font = '10px "Courier New"';
  ctx.fillStyle = COMMAND_CENTER_BG.TEXT_COLOR;
  ctx.textAlign = 'center';
  ctx.fillText('RADAR', centerX, centerY + radius + 15);

  ctx.restore();
}

function updateTacticalData(currentTime) {
  // Update tactical data periodically
  if (currentTime - lastDataUpdateTime > COMMAND_CENTER_BG.DATA_UPDATE_INTERVAL) {
    tacticalData.activeTanks = Math.floor(Math.random() * 15) + 3;
    tacticalData.uptime = Math.floor((currentTime - lastDataUpdateTime) / 1000);
    const sectors = ['A-7', 'B-3', 'C-9', 'D-2', 'E-5', 'F-8'];
    tacticalData.sector = sectors[Math.floor(Math.random() * sectors.length)];
    const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
    tacticalData.threatLevel = levels[Math.floor(Math.random() * levels.length)];
    lastDataUpdateTime = currentTime;
  }

  // Update coordinates more frequently for animation
  if (currentTime - lastCoordUpdateTime > COMMAND_CENTER_BG.COORD_UPDATE_INTERVAL) {
    tacticalData.coordinates.lat = (Math.random() * 180 - 90).toFixed(4);
    tacticalData.coordinates.lon = (Math.random() * 360 - 180).toFixed(4);
    lastCoordUpdateTime = currentTime;
  }
}

function drawTacticalData() {
  ctx.save();
  ctx.font = `${COMMAND_CENTER_BG.TEXT_SIZE}px "Courier New"`;
  ctx.fillStyle = COMMAND_CENTER_BG.TEXT_COLOR;
  ctx.textAlign = 'left';

  // Top-left data (below radar)
  const leftX = 30;
  let leftY = COMMAND_CENTER_BG.RADAR_POSITION.y + COMMAND_CENTER_BG.RADAR_RADIUS + 40;

  ctx.fillText(`ACTIVE UNITS: ${tacticalData.activeTanks}`, leftX, leftY);
  leftY += 18;
  ctx.fillText(`SECTOR: ${tacticalData.sector}`, leftX, leftY);
  leftY += 18;

  // Threat level with color
  const threatColors = {
    'LOW': 'rgba(0, 255, 100, 0.7)',
    'MEDIUM': 'rgba(255, 200, 0, 0.7)',
    'HIGH': 'rgba(255, 100, 0, 0.7)',
    'CRITICAL': 'rgba(255, 0, 0, 0.7)',
  };
  ctx.fillStyle = threatColors[tacticalData.threatLevel] || COMMAND_CENTER_BG.TEXT_COLOR;
  ctx.fillText(`THREAT: ${tacticalData.threatLevel}`, leftX, leftY);

  // Top-right data
  ctx.textAlign = 'right';
  const rightX = canvas.width - 30;
  let rightY = 30;

  ctx.fillStyle = COMMAND_CENTER_BG.TEXT_COLOR;
  ctx.fillText(`LAT: ${tacticalData.coordinates.lat}`, rightX, rightY);
  rightY += 18;
  ctx.fillText(`LON: ${tacticalData.coordinates.lon}`, rightX, rightY);
  rightY += 18;
  ctx.fillText(`STATUS: OPERATIONAL`, rightX, rightY);

  // Bottom-right timestamp
  const now = new Date();
  const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
  ctx.fillText(`TIME: ${timestamp}`, rightX, canvas.height - 30);

  ctx.restore();
}

/**
 * Draw status indicator dots
 */
function drawStatusIndicators(statusIndicatorTime) {
  const margin = 30;
  const dotSize = 4;
  const spacing = 12;
  const count = 8;

  ctx.globalAlpha = 0.5;

  for (let i = 0; i < count; i++) {
    // Alternate between green (active) and dim
    const isActive = Math.sin(statusIndicatorTime * 2 + i) > 0;
    ctx.fillStyle = isActive ? '#00ff00' : '#535151ff';

    // Draw in top-right corner
    const x = canvas.width - margin - i * spacing;
    const y = margin + 18 * 3;

    ctx.beginPath();
    ctx.arc(x, y, dotSize, 0, Math.PI * 2);
    ctx.fill();

    // Add subtle glow for active indicators
    if (isActive) {
      ctx.shadowBlur = 8;
      ctx.shadowColor = '#00ff00';
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  ctx.globalAlpha = 1.0;
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

  // Draw radar
  drawRadar(dt, currentTime);

  // Update and draw tactical data
  updateTacticalData(currentTime);
  drawTacticalData();

  // Draw status indicators
  drawStatusIndicators(statusIndicatorTime);
  statusIndicatorTime += dt;

  animationFrameId = requestAnimationFrame(update);
}

export function init() {
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  const now = Date.now();
  startTime = now;
  lastScanlineTime = now - COMMAND_CENTER_BG.SCANLINE_INTERVAL + 500; // First scanline appears soon
  lastRadarRingTime = now;
  lastDataUpdateTime = now;
  lastCoordUpdateTime = now;
  statusIndicatorTime = 0;
}

export function show() {
  if (isActive) return;

  isActive = true;
  canvas.style.display = 'block';
  const now = Date.now();
  startTime = now;
  lastDataUpdateTime = now;
  lastCoordUpdateTime = now;
  update();
}

export function hide() {
  isActive = false;
  canvas.style.display = 'none';

  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }

  // Clear all state
  scanlines = [];
  radarBlips = [];
  radarRings = [];
  radarAngle = 0;
}
