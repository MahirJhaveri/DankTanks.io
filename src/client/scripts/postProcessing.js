/**
 * Post-Processing Effects Pipeline
 *
 * Applies visual effects to the rendered canvas for enhanced atmosphere.
 */

/**
 * Apply bloom/glow effect
 * Creates a bright blur effect on high-intensity areas
 */
export function applyBloom(canvas, context, config) {
  if (!config || !config.enabled) return;

  const { threshold = 0.7, intensity = 0.5, radius = 10 } = config;

  // Get current canvas data
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  // Create temporary canvas for bright areas
  const brightCanvas = document.createElement('canvas');
  brightCanvas.width = canvas.width;
  brightCanvas.height = canvas.height;
  const brightCtx = brightCanvas.getContext('2d');
  const brightImageData = brightCtx.createImageData(canvas.width, canvas.height);
  const brightData = brightImageData.data;

  // Extract bright areas based on threshold
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const brightness = (r + g + b) / (3 * 255);

    if (brightness > threshold) {
      const boost = (brightness - threshold) / (1 - threshold);
      brightData[i] = r * boost;
      brightData[i + 1] = g * boost;
      brightData[i + 2] = b * boost;
      brightData[i + 3] = 255;
    } else {
      brightData[i + 3] = 0; // Transparent
    }
  }

  brightCtx.putImageData(brightImageData, 0, 0);

  // Apply blur to bright areas
  brightCtx.filter = `blur(${radius}px)`;
  brightCtx.drawImage(brightCanvas, 0, 0);
  brightCtx.filter = 'none';

  // Composite blurred bright areas back onto main canvas
  context.globalAlpha = intensity;
  context.globalCompositeOperation = 'screen';
  context.drawImage(brightCanvas, 0, 0);
  context.globalCompositeOperation = 'source-over';
  context.globalAlpha = 1.0;
}

/**
 * Apply heat distortion effect
 * Creates wavy distortion for desert heat haze
 */
export function applyHeatDistortion(canvas, context, config, time) {
  if (!config || !config.enabled) return;

  const { intensity = 2, speed = 0.5, frequency = 0.02 } = config;

  // Only apply to middle section of screen for performance
  const distortHeight = canvas.height;
  const imageData = context.getImageData(0, 0, canvas.width, distortHeight);
  const data = imageData.data;
  const distortedData = new Uint8ClampedArray(data);

  // Apply wave distortion
  for (let y = 0; y < distortHeight; y++) {
    const offset = Math.sin((y * frequency) + (time * speed * 0.001)) * intensity;
    const offsetPx = Math.floor(offset);

    for (let x = 0; x < canvas.width; x++) {
      const srcX = x + offsetPx;
      if (srcX >= 0 && srcX < canvas.width) {
        const srcIdx = (y * canvas.width + srcX) * 4;
        const destIdx = (y * canvas.width + x) * 4;

        distortedData[destIdx] = data[srcIdx];
        distortedData[destIdx + 1] = data[srcIdx + 1];
        distortedData[destIdx + 2] = data[srcIdx + 2];
        distortedData[destIdx + 3] = data[srcIdx + 3];
      }
    }
  }

  const newImageData = new ImageData(distortedData, canvas.width, distortHeight);
  context.putImageData(newImageData, 0, 0);
}

/**
 * Apply vignette effect
 * Darkens edges of screen for dramatic atmosphere
 */
export function applyVignette(canvas, context, config) {
  if (!config || !config.enabled) return;

  const { strength = 0.4, falloff = 0.6 } = config;

  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const maxRadius = Math.sqrt(centerX * centerX + centerY * centerY);

  const gradient = context.createRadialGradient(
    centerX, centerY, maxRadius * falloff,
    centerX, centerY, maxRadius
  );

  gradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
  gradient.addColorStop(1, `rgba(0, 0, 0, ${strength})`);

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

/**
 * Apply color grading adjustments
 * Modifies brightness, contrast, saturation
 */
export function applyColorGrading(canvas, context, config) {
  if (!config || !config.enabled) return;

  const {
    brightness = 1.0,
    contrast = 1.0,
    saturation = 1.0,
    hueShift = 0
  } = config;

  // Only apply if values differ from defaults
  if (brightness === 1.0 && contrast === 1.0 && saturation === 1.0 && hueShift === 0) {
    return;
  }

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Apply brightness
    if (brightness !== 1.0) {
      r *= brightness;
      g *= brightness;
      b *= brightness;
    }

    // Apply contrast
    if (contrast !== 1.0) {
      r = ((r / 255 - 0.5) * contrast + 0.5) * 255;
      g = ((g / 255 - 0.5) * contrast + 0.5) * 255;
      b = ((b / 255 - 0.5) * contrast + 0.5) * 255;
    }

    // Apply saturation
    if (saturation !== 1.0) {
      const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
      r = gray + saturation * (r - gray);
      g = gray + saturation * (g - gray);
      b = gray + saturation * (b - gray);
    }

    // Clamp values
    data[i] = Math.max(0, Math.min(255, r));
    data[i + 1] = Math.max(0, Math.min(255, g));
    data[i + 2] = Math.max(0, Math.min(255, b));
  }

  context.putImageData(imageData, 0, 0);
}

/**
 * Apply scanline effect (optional retro effect)
 */
export function applyScanlines(canvas, context, config) {
  if (!config || !config.enabled) return;

  const { opacity = 0.1, lineHeight = 2 } = config;

  context.fillStyle = `rgba(0, 0, 0, ${opacity})`;
  for (let y = 0; y < canvas.height; y += lineHeight * 2) {
    context.fillRect(0, y, canvas.width, lineHeight);
  }
}

/**
 * Apply chromatic aberration (optional RGB split effect)
 */
export function applyChromaticAberration(canvas, context, config) {
  if (!config || !config.enabled) return;

  const { offset = 2 } = config;

  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const shifted = context.createImageData(canvas.width, canvas.height);
  const shiftedData = shifted.data;

  // Copy original alpha and apply RGB shift
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const idx = (y * canvas.width + x) * 4;

      // Red channel - shift left
      const rIdx = (y * canvas.width + Math.max(0, x - offset)) * 4;
      shiftedData[idx] = data[rIdx];

      // Green channel - no shift
      shiftedData[idx + 1] = data[idx + 1];

      // Blue channel - shift right
      const bIdx = (y * canvas.width + Math.min(canvas.width - 1, x + offset)) * 4;
      shiftedData[idx + 2] = data[bIdx + 2];

      // Alpha
      shiftedData[idx + 3] = data[idx + 3];
    }
  }

  context.putImageData(shifted, 0, 0);
}

/**
 * Master post-processing function
 * Applies all enabled effects in the correct order
 */
export function processFrame(canvas, theme, time) {
  if (!theme.postProcessing) return;

  const context = canvas.getContext('2d');
  const effects = theme.postProcessing;

  // Apply effects in order:
  // 1. Heat distortion (geometric distortion, must be first)
  if (effects.heatDistortion) {
    applyHeatDistortion(canvas, context, effects.heatDistortion, time);
  }

  // 2. Color grading (adjust colors before glow effects)
  if (effects.colorGrading) {
    applyColorGrading(canvas, context, effects.colorGrading);
  }

  // 3. Bloom (adds glow to bright areas)
  if (effects.bloom) {
    applyBloom(canvas, context, effects.bloom);
  }

  // 4. Vignette (darkens edges, should be after bloom)
  if (effects.vignette) {
    applyVignette(canvas, context, effects.vignette);
  }

  // 5. Optional retro effects
  if (effects.scanlines) {
    applyScanlines(canvas, context, effects.scanlines);
  }

  if (effects.chromaticAberration) {
    applyChromaticAberration(canvas, context, effects.chromaticAberration);
  }
}

/**
 * Check if theme has any post-processing enabled
 */
export function hasPostProcessing(theme) {
  if (!theme.postProcessing) return false;

  const effects = theme.postProcessing;
  return (
    (effects.bloom && effects.bloom.enabled) ||
    (effects.heatDistortion && effects.heatDistortion.enabled) ||
    (effects.vignette && effects.vignette.enabled) ||
    (effects.colorGrading && effects.colorGrading.enabled) ||
    (effects.scanlines && effects.scanlines.enabled) ||
    (effects.chromaticAberration && effects.chromaticAberration.enabled)
  );
}
