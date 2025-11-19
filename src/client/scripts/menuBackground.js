/**
 * Menu Background - Procedural Command Center / Tank Hangar
 *
 * Renders a dynamic, theme-aware background for the play menu
 * giving it a command center / tank hangar aesthetic.
 */

const Theme = require('../../shared/theme');

let canvas;
let ctx;
let animationFrame;
let animationTime = 0;

// Animation state
const scanLines = [];
const panels = [];
const gridLines = [];

/**
 * Initialize the menu background system
 * @param {HTMLCanvasElement} canvasElement - The canvas to render on
 */
function init(canvasElement) {
  canvas = canvasElement;
  ctx = canvas.getContext('2d');

  // Set canvas size to full window
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  // Generate static elements
  generatePanels();
  generateGridLines();

  // Generate animated scan lines
  generateScanLines();

  // Start animation loop
  startAnimation();
}

/**
 * Resize canvas to match window size
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  // Regenerate elements on resize
  generatePanels();
  generateGridLines();
}

/**
 * Generate background panels (suggesting monitors/wall sections)
 */
function generatePanels() {
  panels.length = 0;

  const panelCount = 12;
  const cols = 4;
  const rows = 3;
  const margin = 40;
  const spacing = 20;

  const panelWidth = (canvas.width - margin * 2 - spacing * (cols - 1)) / cols;
  const panelHeight = (canvas.height - margin * 2 - spacing * (rows - 1)) / rows;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      panels.push({
        x: margin + col * (panelWidth + spacing),
        y: margin + row * (panelHeight + spacing),
        width: panelWidth,
        height: panelHeight,
        opacity: 0.03 + Math.random() * 0.05,
        pulseSpeed: 0.5 + Math.random() * 1.5,
        pulseOffset: Math.random() * Math.PI * 2
      });
    }
  }
}

/**
 * Generate grid lines for technical aesthetic
 */
function generateGridLines() {
  gridLines.length = 0;

  const spacing = 50;

  // Vertical lines
  for (let x = 0; x < canvas.width; x += spacing) {
    gridLines.push({
      type: 'vertical',
      position: x,
      opacity: 0.05
    });
  }

  // Horizontal lines
  for (let y = 0; y < canvas.height; y += spacing) {
    gridLines.push({
      type: 'horizontal',
      position: y,
      opacity: 0.05
    });
  }
}

/**
 * Generate animated scan lines
 */
function generateScanLines() {
  scanLines.length = 0;

  // Create 3 horizontal scan lines
  for (let i = 0; i < 3; i++) {
    scanLines.push({
      y: Math.random() * canvas.height,
      speed: 30 + Math.random() * 40,
      opacity: 0.3,
      thickness: 2
    });
  }
}

/**
 * Get theme-specific colors
 */
function getThemeColors() {
  const theme = Theme.getCurrentTheme();
  const themeName = Theme.getCurrentThemeName();

  if (themeName === 'desert') {
    return {
      background: '#2a1a0f',
      accent: '#d4710a',
      gridColor: '#3d2415',
      panelColor: '#462003',
      scanLineColor: '#ff8c1a'
    };
  } else if (themeName === 'neon') {
    return {
      background: '#0a0a0a',
      accent: '#00f0ff',
      gridColor: '#1a1a2e',
      panelColor: '#1a1a2e',
      scanLineColor: '#00f0ff'
    };
  }

  // Default/fallback colors
  return {
    background: '#1a1a1a',
    accent: '#4a4a4a',
    gridColor: '#2a2a2a',
    panelColor: '#2a2a2a',
    scanLineColor: '#6a6a6a'
  };
}

/**
 * Render the background
 * @param {number} deltaTime - Time since last frame in seconds
 */
function render(deltaTime) {
  const colors = getThemeColors();

  // Clear with background color
  ctx.fillStyle = colors.background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw grid lines
  ctx.strokeStyle = colors.gridColor;
  ctx.lineWidth = 1;
  gridLines.forEach(line => {
    ctx.globalAlpha = line.opacity;
    ctx.beginPath();
    if (line.type === 'vertical') {
      ctx.moveTo(line.position, 0);
      ctx.lineTo(line.position, canvas.height);
    } else {
      ctx.moveTo(0, line.position);
      ctx.lineTo(canvas.width, line.position);
    }
    ctx.stroke();
  });
  ctx.globalAlpha = 1.0;

  // Draw panels with subtle pulsing
  panels.forEach(panel => {
    const pulse = Math.sin(animationTime * panel.pulseSpeed + panel.pulseOffset) * 0.5 + 0.5;
    const opacity = panel.opacity + pulse * 0.02;

    ctx.fillStyle = colors.panelColor;
    ctx.globalAlpha = opacity;
    ctx.fillRect(panel.x, panel.y, panel.width, panel.height);

    // Draw panel border
    ctx.strokeStyle = colors.accent;
    ctx.globalAlpha = opacity * 0.3;
    ctx.lineWidth = 1;
    ctx.strokeRect(panel.x, panel.y, panel.width, panel.height);
  });
  ctx.globalAlpha = 1.0;

  // Draw corner accents (command center aesthetic)
  drawCornerAccents(colors);

  // Draw animated scan lines
  ctx.strokeStyle = colors.scanLineColor;
  scanLines.forEach(line => {
    ctx.globalAlpha = line.opacity;
    ctx.lineWidth = line.thickness;
    ctx.beginPath();
    ctx.moveTo(0, line.y);
    ctx.lineTo(canvas.width, line.y);
    ctx.stroke();

    // Add glow effect
    ctx.shadowBlur = 15;
    ctx.shadowColor = colors.scanLineColor;
    ctx.stroke();
    ctx.shadowBlur = 0;
  });
  ctx.globalAlpha = 1.0;

  // Draw central crosshair/targeting reticle
  drawTargetingReticle(colors);

  // Draw status indicators (small colored dots suggesting active systems)
  drawStatusIndicators(colors);
}

/**
 * Draw corner accent lines for command center aesthetic
 */
function drawCornerAccents(colors) {
  const cornerSize = 60;
  const lineWidth = 3;
  const margin = 20;

  ctx.strokeStyle = colors.accent;
  ctx.globalAlpha = 0.4;
  ctx.lineWidth = lineWidth;

  // Top-left corner
  ctx.beginPath();
  ctx.moveTo(margin + cornerSize, margin);
  ctx.lineTo(margin, margin);
  ctx.lineTo(margin, margin + cornerSize);
  ctx.stroke();

  // Top-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.width - margin - cornerSize, margin);
  ctx.lineTo(canvas.width - margin, margin);
  ctx.lineTo(canvas.width - margin, margin + cornerSize);
  ctx.stroke();

  // Bottom-left corner
  ctx.beginPath();
  ctx.moveTo(margin, canvas.height - margin - cornerSize);
  ctx.lineTo(margin, canvas.height - margin);
  ctx.lineTo(margin + cornerSize, canvas.height - margin);
  ctx.stroke();

  // Bottom-right corner
  ctx.beginPath();
  ctx.moveTo(canvas.width - margin - cornerSize, canvas.height - margin);
  ctx.lineTo(canvas.width - margin, canvas.height - margin);
  ctx.lineTo(canvas.width - margin, canvas.height - margin - cornerSize);
  ctx.stroke();

  ctx.globalAlpha = 1.0;
}

/**
 * Draw targeting reticle in center (subtle)
 */
function drawTargetingReticle(colors) {
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = 80;
  const gap = 20;

  ctx.strokeStyle = colors.accent;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;

  // Draw circle
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  // Draw crosshair with gaps
  ctx.beginPath();
  ctx.moveTo(centerX - radius - 20, centerY);
  ctx.lineTo(centerX - gap, centerY);
  ctx.moveTo(centerX + gap, centerY);
  ctx.lineTo(centerX + radius + 20, centerY);
  ctx.moveTo(centerX, centerY - radius - 20);
  ctx.lineTo(centerX, centerY - gap);
  ctx.moveTo(centerX, centerY + gap);
  ctx.lineTo(centerX, centerY + radius + 20);
  ctx.stroke();

  ctx.globalAlpha = 1.0;
}

/**
 * Draw status indicator dots
 */
function drawStatusIndicators(colors) {
  const margin = 30;
  const dotSize = 4;
  const spacing = 12;
  const count = 8;

  ctx.globalAlpha = 0.5;

  for (let i = 0; i < count; i++) {
    // Alternate between green (active) and dim
    const isActive = Math.sin(animationTime * 2 + i) > 0;
    ctx.fillStyle = isActive ? '#00ff00' : colors.accent;

    // Draw in top-right corner
    const x = canvas.width - margin - i * spacing;
    const y = margin;

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

/**
 * Update animation state
 * @param {number} deltaTime - Time since last frame in seconds
 */
function update(deltaTime) {
  animationTime += deltaTime;

  // Update scan lines
  scanLines.forEach(line => {
    line.y += line.speed * deltaTime;

    // Wrap around
    if (line.y > canvas.height + 50) {
      line.y = -50;
    }
  });
}

/**
 * Start the animation loop
 */
function startAnimation() {
  let lastTime = Date.now();

  function loop() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Convert to seconds
    lastTime = currentTime;

    update(deltaTime);
    render(deltaTime);

    animationFrame = requestAnimationFrame(loop);
  }

  loop();
}

/**
 * Stop the animation loop
 */
function stop() {
  if (animationFrame) {
    cancelAnimationFrame(animationFrame);
    animationFrame = null;
  }
}

/**
 * Update theme (call this when theme changes)
 */
function updateTheme() {
  // Theme colors are fetched dynamically in render, so just force a render
  // This function exists for future extensibility
}

module.exports = {
  init,
  stop,
  updateTheme
};
