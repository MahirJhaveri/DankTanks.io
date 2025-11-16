/**
 * Theme System for DankTanks.io
 *
 * Centralized theme configuration for all visual elements.
 * Supports multiple themes with easy switching.
 */

const Constants = require('./constants');
const { SPRITES } = Constants;

const THEMES = {
  default: {
    name: "Classic",
    description: "Original DankTanks theme with purple obstacles",

    // Main background
    background: {
      type: 'radial-gradient',
      colors: ['black', 'gray'],
      centerRatio: 0.2  // MAP_SIZE / 5 relative to MAP_SIZE / 2
    },

    // Grid overlay
    grid: {
      color: 'white',
      lineWidth: 0.1,
      enabled: true
    },

    // Obstacles in main view
    obstacles: {
      fillColor: '#B24BCB',
      shadowColor: '#652DC1',
      shadowBlur: 35
    },

    // Map boundary
    boundary: {
      color: 'black',
      lineWidth: 2
    },

    // Minimap styling
    minimap: {
      background: ['rgba(24, 99, 35, 0.2)', 'rgba(38, 156, 56, 0.2)'],
      obstacleColor: '#926F5B',
      borderColor: 'black',
      borderWidth: 2
    }
  },

  desert: {
    name: "Desert Warfare",
    description: "Sandy battlefield with rocky terrain",

    background: {
      type: 'image',
      imageName: SPRITES.BACKGROUND_DESERT,
      fallbackColors: ['black', 'rgba(242, 125, 8, 1)'],  // Fallback gradient if image fails
      overlay: {
        enabled: true,
        colors: ['rgba(0, 0, 0, 0.9)', 'rgba(242, 125, 8, 0.43)'],  // Semi-transparent gradient overlay
        centerRatio: 0.2
      }
    },

    grid: {
      color: '#1d1203ff',  // Darker sand
      lineWidth: 0.3,
      enabled: true
    },

    obstacles: {
      fillColor: '#462003ff',  // Rock brown
      shadowColor: '#bf4e0cff',  // Darker shadow
      shadowBlur: 25
    },

    boundary: {
      color: '#5C4033',  // Dark brown
      lineWidth: 2
    },

    minimap: {
      background: ['rgba(212, 165, 116, 0.3)', 'rgba(232, 212, 176, 0.3)'],
      obstacleColor: '#a94d18ff',
      borderColor: '#5C4033',
      borderWidth: 2
    }
  },

  arctic: {
    name: "Arctic Frost",
    description: "Frozen battlefield with ice obstacles",

    background: {
      type: 'radial-gradient',
      colors: ['#E8F4F8', '#B8D4E8'],  // Ice blue/white
      centerRatio: 0.2
    },

    grid: {
      color: '#A0C4D8',  // Light blue
      lineWidth: 0.1,
      enabled: true
    },

    obstacles: {
      fillColor: '#A0C4D8',  // Ice blue
      shadowColor: '#7BA4B8',  // Darker ice
      shadowBlur: 30
    },

    boundary: {
      color: '#6090B0',  // Deep ice blue
      lineWidth: 2
    },

    minimap: {
      background: ['rgba(232, 244, 248, 0.4)', 'rgba(184, 212, 232, 0.4)'],
      obstacleColor: '#7BA4B8',
      borderColor: '#6090B0',
      borderWidth: 2
    }
  },

  neon: {
    name: "Neon Cyberpunk",
    description: "Futuristic grid world with glowing elements",

    background: {
      type: 'radial-gradient',
      colors: ['#0A0A0A', '#1A1A2E'],  // Dark purple-black
      centerRatio: 0.2
    },

    grid: {
      color: '#00F0FF',  // Cyan
      lineWidth: 0.2,  // Slightly thicker for visibility
      enabled: true
    },

    obstacles: {
      fillColor: '#FF00FF',  // Magenta
      shadowColor: '#FF00FF',  // Same color for neon glow
      shadowBlur: 50  // Stronger glow
    },

    boundary: {
      color: '#00F0FF',  // Cyan
      lineWidth: 3  // Thicker for neon look
    },

    minimap: {
      background: ['rgba(26, 26, 46, 0.6)', 'rgba(10, 10, 10, 0.6)'],
      obstacleColor: '#FF00FF',
      borderColor: '#00F0FF',
      borderWidth: 2
    }
  }
};

// Current active theme (default at start)
let currentTheme = 'desert';

/**
 * Get the current theme configuration object
 * @returns {Object} The current theme configuration
 */
function getCurrentTheme() {
  return THEMES[currentTheme];
}

/**
 * Set the active theme
 * @param {string} themeName - The name of the theme to activate
 * @returns {boolean} True if theme was changed successfully, false otherwise
 */
function setTheme(themeName) {
  if (THEMES[themeName]) {
    currentTheme = themeName;
    console.log(`Theme changed to: ${THEMES[themeName].name}`);
    return true;
  }
  console.error(`Theme "${themeName}" not found. Available themes: ${Object.keys(THEMES).join(', ')}`);
  return false;
}

/**
 * Get the name of the currently active theme
 * @returns {string} The current theme name
 */
function getCurrentThemeName() {
  return currentTheme;
}

/**
 * Get a list of all available themes
 * @returns {Array} Array of theme objects with id, name, and description
 */
function getAvailableThemes() {
  return Object.keys(THEMES).map(key => ({
    id: key,
    name: THEMES[key].name,
    description: THEMES[key].description
  }));
}

// Export for CommonJS (Node.js/server)
module.exports = {
  THEMES,
  getCurrentTheme,
  setTheme,
  getCurrentThemeName,
  getAvailableThemes
};
