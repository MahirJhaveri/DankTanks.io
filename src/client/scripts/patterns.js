/**
 * Procedural Pattern Generation System
 *
 * Generates canvas patterns for backgrounds and obstacles without requiring image files.
 */

// Cache for generated patterns to avoid regenerating every frame
const patternCache = new Map();

/**
 * Generate a noise/grain texture pattern
 */
export function generateNoisePattern(width, height, config) {
  const cacheKey = `noise_${width}_${height}_${JSON.stringify(config)}`;
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const { density = 0.02, colors = ['#D4A574', '#E8D4B0', '#C4955C'], pointSize = 1 } = config;

  // Fill base color
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, width, height);

  // Add noise points
  const pointCount = Math.floor(width * height * density);
  for (let i = 0; i < pointCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const colorIndex = Math.floor(Math.random() * colors.length);
    ctx.fillStyle = colors[colorIndex];

    if (pointSize === 1) {
      ctx.fillRect(x, y, 1, 1);
    } else {
      ctx.beginPath();
      ctx.arc(x, y, pointSize / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  patternCache.set(cacheKey, canvas);
  return canvas;
}

/**
 * Generate a star field pattern for space theme
 */
export function generateStarField(width, height, config) {
  const cacheKey = `stars_${width}_${height}_${JSON.stringify(config)}`;
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const { count = 200, colors = ['white', '#FFE4B5', '#87CEEB'], baseColor = '#0A0A1E' } = config;

  // Fill background
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Add stars with varying sizes and colors
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const size = Math.random() * 2 + 0.5; // 0.5 - 2.5 pixels
    const colorIndex = Math.floor(Math.random() * colors.length);
    const opacity = 0.3 + Math.random() * 0.7; // 0.3 - 1.0

    ctx.fillStyle = colors[colorIndex];
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    ctx.arc(x, y, size / 2, 0, Math.PI * 2);
    ctx.fill();

    // Add occasional larger stars with glow
    if (Math.random() > 0.95) {
      ctx.shadowBlur = 4;
      ctx.shadowColor = colors[colorIndex];
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  ctx.globalAlpha = 1.0;
  patternCache.set(cacheKey, canvas);
  return canvas;
}

/**
 * Generate animated star field (returns canvas, needs to be updated each frame)
 */
export function generateAnimatedStarField(width, height, config, time = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const { count = 200, colors = ['white', '#FFE4B5', '#87CEEB'], baseColor = '#0A0A1E' } = config;

  // Fill background
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Use seeded random for consistent star positions
  const stars = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: (i * 7919 % width),
      y: (i * 7919 % height),
      size: 0.5 + (i % 20) / 10,
      colorIndex: i % colors.length,
      twinklePhase: i * 0.1
    });
  }

  // Render stars with twinkling
  stars.forEach(star => {
    const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 + star.twinklePhase);
    const opacity = 0.3 + twinkle * 0.7;

    ctx.fillStyle = colors[star.colorIndex];
    ctx.globalAlpha = opacity;

    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size / 2, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.globalAlpha = 1.0;
  return canvas;
}

/**
 * Generate glowing crack pattern for lava theme
 */
export function generateCrackPattern(width, height, config, time = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const {
    lineCount = 25,
    baseColor = '#2A0A0A',
    glowColor = '#FF4500',
    glowIntensity = 40,
    animated = false,
    pulseSpeed = 0.002
  } = config;

  // Fill base color
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Calculate pulse intensity if animated
  const pulseMultiplier = animated ? (0.7 + 0.3 * Math.sin(time * pulseSpeed)) : 1.0;
  const currentGlow = glowIntensity * pulseMultiplier;

  // Generate cracks from random start points
  ctx.strokeStyle = glowColor;
  ctx.lineWidth = 2;
  ctx.shadowBlur = currentGlow;
  ctx.shadowColor = glowColor;

  for (let i = 0; i < lineCount; i++) {
    let x = Math.random() * width;
    let y = Math.random() * height;

    ctx.beginPath();
    ctx.moveTo(x, y);

    // Create branching crack
    const segments = 10 + Math.floor(Math.random() * 20);
    for (let j = 0; j < segments; j++) {
      const angle = Math.random() * Math.PI * 2;
      const length = 20 + Math.random() * 40;
      x += Math.cos(angle) * length;
      y += Math.sin(angle) * length;

      // Keep within bounds
      x = Math.max(0, Math.min(width, x));
      y = Math.max(0, Math.min(height, y));

      ctx.lineTo(x, y);

      // Occasionally branch
      if (Math.random() > 0.7 && j < segments - 5) {
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  }

  return canvas;
}

/**
 * Generate animated grid pattern for neon theme
 */
export function generateGridPattern(width, height, config, time = 0) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const {
    cellSize = 50,
    lineWidth = 1,
    color = '#00F0FF',
    glowColor = '#00F0FF',
    glowIntensity = 20,
    animated = false,
    animationSpeed = 0.002,
    baseColor = '#0A0A0A'
  } = config;

  // Fill background
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Calculate pulse intensity if animated
  const pulseMultiplier = animated ? (0.6 + 0.4 * Math.sin(time * animationSpeed)) : 1.0;
  const currentGlow = glowIntensity * pulseMultiplier;

  // Draw grid
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.shadowBlur = currentGlow;
  ctx.shadowColor = glowColor;

  // Vertical lines
  for (let x = 0; x <= width; x += cellSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Horizontal lines
  for (let y = 0; y <= height; y += cellSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  return canvas;
}

/**
 * Generate rock texture pattern for desert theme
 */
export function generateRockPattern(width, height, config) {
  const cacheKey = `rock_${width}_${height}_${JSON.stringify(config)}`;
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const { colors = ['#8B7355', '#6B5345', '#5C4033'] } = config;

  // Base fill
  ctx.fillStyle = colors[0];
  ctx.fillRect(0, 0, width, height);

  // Add random blobs to simulate rock texture
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 5 + Math.random() * 15;
    const colorIndex = 1 + Math.floor(Math.random() * (colors.length - 1));

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colors[colorIndex]);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  patternCache.set(cacheKey, canvas);
  return canvas;
}

/**
 * Generate crater pattern for space/lunar theme
 */
export function generateCraterPattern(width, height, config) {
  const cacheKey = `crater_${width}_${height}_${JSON.stringify(config)}`;
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey);
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  const { colors = ['#666', '#888', '#AAA'], baseColor = '#777' } = config;

  // Base fill
  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, width, height);

  // Add craters
  const craterCount = 5 + Math.floor(Math.random() * 10);
  for (let i = 0; i < craterCount; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const radius = 10 + Math.random() * 30;

    // Crater depression (darker)
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(0.7, colors[1]);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();

    // Crater rim highlight
    ctx.strokeStyle = colors[2];
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(x, y, radius * 0.9, Math.PI, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1.0;
  }

  patternCache.set(cacheKey, canvas);
  return canvas;
}

/**
 * Clear pattern cache (useful for memory management)
 */
export function clearPatternCache() {
  patternCache.clear();
}

/**
 * Get pattern cache size
 */
export function getPatternCacheSize() {
  return patternCache.size;
}
