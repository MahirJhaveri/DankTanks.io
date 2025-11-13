/**
 * Texture Loading and Caching System
 *
 * Handles loading external texture images and creating canvas patterns from them.
 */

// Texture cache to avoid reloading
const textureCache = new Map();
const patternCache = new Map();

/**
 * Load a texture image from URL
 * @param {string} url - Path to texture image
 * @returns {Promise<HTMLImageElement>} Loaded image
 */
export function loadTexture(url) {
  // Check cache first
  if (textureCache.has(url)) {
    const cached = textureCache.get(url);
    if (cached instanceof Promise) {
      return cached; // Still loading
    }
    return Promise.resolve(cached); // Already loaded
  }

  // Create loading promise
  const loadingPromise = new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => {
      textureCache.set(url, img);
      resolve(img);
    };

    img.onerror = () => {
      textureCache.delete(url);
      reject(new Error(`Failed to load texture: ${url}`));
    };

    img.src = url;
  });

  // Store loading promise in cache
  textureCache.set(url, loadingPromise);
  return loadingPromise;
}

/**
 * Create a canvas pattern from an image
 * @param {HTMLImageElement} image - Loaded image
 * @param {CanvasRenderingContext2D} context - Canvas context to create pattern with
 * @param {number} scale - Scaling factor for the pattern
 * @param {string} mode - 'repeat', 'repeat-x', 'repeat-y', or 'no-repeat'
 * @returns {CanvasPattern} Canvas pattern
 */
export function createCanvasPattern(image, context, scale = 1.0, mode = 'repeat') {
  const cacheKey = `${image.src}_${scale}_${mode}`;

  // Check pattern cache
  if (patternCache.has(cacheKey)) {
    return patternCache.get(cacheKey);
  }

  // Scale image if needed
  if (scale !== 1.0) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = image.width * scale;
    scaledCanvas.height = image.height * scale;
    const scaledCtx = scaledCanvas.getContext('2d');
    scaledCtx.drawImage(image, 0, 0, scaledCanvas.width, scaledCanvas.height);

    const pattern = context.createPattern(scaledCanvas, mode);
    patternCache.set(cacheKey, pattern);
    return pattern;
  }

  // Create pattern from original image
  const pattern = context.createPattern(image, mode);
  patternCache.set(cacheKey, pattern);
  return pattern;
}

/**
 * Preload multiple textures
 * @param {string[]} urls - Array of texture URLs to preload
 * @returns {Promise<HTMLImageElement[]>} Promise resolving to array of loaded images
 */
export async function preloadTextures(urls) {
  const promises = urls.map(url => loadTexture(url));
  return Promise.all(promises);
}

/**
 * Check if a texture is loaded
 * @param {string} url - Texture URL to check
 * @returns {boolean} True if texture is loaded and ready
 */
export function isTextureLoaded(url) {
  const cached = textureCache.get(url);
  return cached && !(cached instanceof Promise);
}

/**
 * Get a loaded texture (returns null if not loaded)
 * @param {string} url - Texture URL
 * @returns {HTMLImageElement|null} Loaded image or null
 */
export function getTexture(url) {
  const cached = textureCache.get(url);
  return (cached && !(cached instanceof Promise)) ? cached : null;
}

/**
 * Clear texture cache
 */
export function clearTextureCache() {
  textureCache.clear();
  patternCache.clear();
}

/**
 * Get cache stats
 */
export function getTextureStats() {
  return {
    textureCount: textureCache.size,
    patternCount: patternCache.size
  };
}

/**
 * Create a fallback pattern when texture fails to load
 * @param {CanvasRenderingContext2D} context - Canvas context
 * @param {string[]} colors - Fallback gradient colors
 * @returns {CanvasGradient} Gradient pattern
 */
export function createFallbackPattern(context, colors) {
  const gradient = context.createLinearGradient(0, 0, 100, 100);
  colors.forEach((color, index) => {
    gradient.addColorStop(index / (colors.length - 1), color);
  });
  return gradient;
}
