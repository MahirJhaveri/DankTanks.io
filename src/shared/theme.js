/**
 * Theme System for DankTanks.io - Option B (Advanced)
 *
 * Centralized theme configuration for all visual elements.
 * Supports patterns, textures, animations, and post-processing effects.
 */

const THEMES = {
  default: {
    name: "Classic",
    description: "Original DankTanks theme with purple obstacles",

    // Main background
    background: {
      type: 'radial-gradient',  // 'radial-gradient' | 'pattern' | 'texture'
      colors: ['black', 'gray'],
      centerRatio: 0.2
    },

    // Grid overlay
    grid: {
      color: 'white',
      lineWidth: 0.1,
      enabled: true,
      opacity: 1.0
    },

    // Obstacles in main view
    obstacles: {
      fillType: 'solid',  // 'solid' | 'pattern' | 'texture'
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
    description: "Sandy battlefield with heat haze and rocky terrain",

    background: {
      type: 'pattern',
      patternType: 'noise',
      patternConfig: {
        density: 0.03,
        colors: ['#D4A574', '#E8D4B0', '#C4955C'],
        pointSize: 1
      },
      overlayGradient: {
        enabled: true,
        colors: ['rgba(232, 212, 176, 0.2)', 'rgba(180, 140, 90, 0.1)'],
        centerRatio: 0.2
      },
      fallbackColors: ['#D4A574', '#E8D4B0']
    },

    grid: {
      color: '#C4955C',
      lineWidth: 0.05,
      enabled: true,
      opacity: 0.3
    },

    obstacles: {
      fillType: 'pattern',
      patternType: 'rock',
      patternConfig: {
        colors: ['#8B7355', '#6B5345', '#5C4033']
      },
      shadowColor: '#6B5345',
      shadowBlur: 25
    },

    boundary: {
      color: '#5C4033',
      lineWidth: 2
    },

    minimap: {
      background: ['rgba(212, 165, 116, 0.3)', 'rgba(232, 212, 176, 0.3)'],
      obstacleColor: '#a94d18ff',
      borderColor: '#5C4033',
      borderWidth: 2
    },

    postProcessing: {
      heatDistortion: {
        enabled: true,
        intensity: 1.5,
        speed: 0.3,
        frequency: 0.015
      },
      vignette: {
        enabled: true,
        strength: 0.2,
        falloff: 0.8
      },
      colorGrading: {
        enabled: true,
        brightness: 1.1,
        contrast: 1.1,
        saturation: 1.2,
        hueShift: 0
      }
    }
  },

  arctic: {
    name: "Arctic Frost",
    description: "Frozen battlefield with ice obstacles",

    background: {
      type: 'radial-gradient',
      colors: ['#E8F4F8', '#B8D4E8'],
      centerRatio: 0.2
    },

    grid: {
      color: '#A0C4D8',
      lineWidth: 0.1,
      enabled: true,
      opacity: 0.6
    },

    obstacles: {
      fillType: 'solid',
      fillColor: '#A0C4D8',
      shadowColor: '#7BA4B8',
      shadowBlur: 30
    },

    boundary: {
      color: '#6090B0',
      lineWidth: 2
    },

    minimap: {
      background: ['rgba(232, 244, 248, 0.4)', 'rgba(184, 212, 232, 0.4)'],
      obstacleColor: '#7BA4B8',
      borderColor: '#6090B0',
      borderWidth: 2
    },

    postProcessing: {
      vignette: {
        enabled: true,
        strength: 0.15,
        falloff: 0.9
      },
      colorGrading: {
        enabled: true,
        brightness: 1.05,
        contrast: 1.1,
        saturation: 0.9,
        hueShift: 0
      }
    }
  },

  neon: {
    name: "Neon Cyberpunk",
    description: "Futuristic grid world with intense glow",

    background: {
      type: 'pattern',
      patternType: 'grid',
      patternConfig: {
        cellSize: 50,
        lineWidth: 1,
        color: '#00F0FF',
        glowColor: '#00F0FF',
        glowIntensity: 20,
        animated: true,
        animationSpeed: 0.002,
        baseColor: '#0A0A0A'
      },
      fallbackColors: ['#0A0A0A', '#1A1A2E']
    },

    grid: {
      enabled: false  // Using background pattern instead
    },

    obstacles: {
      fillType: 'solid',
      fillColor: '#FF00FF',
      shadowColor: '#FF00FF',
      shadowBlur: 60,
      glowAnimation: {
        enabled: true,
        pulseSpeed: 0.003,
        minBlur: 40,
        maxBlur: 80
      }
    },

    boundary: {
      color: '#00F0FF',
      lineWidth: 3
    },

    minimap: {
      background: ['rgba(26, 26, 46, 0.6)', 'rgba(10, 10, 10, 0.6)'],
      obstacleColor: '#FF00FF',
      borderColor: '#00F0FF',
      borderWidth: 2
    },

    postProcessing: {
      bloom: {
        enabled: true,
        threshold: 0.5,
        intensity: 0.8,
        radius: 15
      },
      vignette: {
        enabled: true,
        strength: 0.5,
        falloff: 0.5
      },
      colorGrading: {
        enabled: true,
        brightness: 1.2,
        contrast: 1.3,
        saturation: 1.5,
        hueShift: 0
      }
    }
  },

  space: {
    name: "Lunar Surface",
    description: "Low gravity battlefield on the moon",

    background: {
      type: 'pattern',
      patternType: 'stars',
      patternConfig: {
        count: 300,
        colors: ['white', '#FFE4B5', '#87CEEB', '#FFA500'],
        twinkle: true,
        twinkleSpeed: 0.001,
        baseColor: '#0A0A1E'
      },
      overlayGradient: {
        enabled: true,
        colors: ['rgba(10, 10, 30, 0.8)', 'rgba(30, 30, 50, 0.6)'],
        centerRatio: 0.3
      },
      fallbackColors: ['#0A0A1E', '#1E1E32']
    },

    grid: {
      color: '#4A4A6A',
      lineWidth: 0.05,
      enabled: true,
      opacity: 0.2
    },

    obstacles: {
      fillType: 'pattern',
      patternType: 'crater',
      patternConfig: {
        colors: ['#666', '#888', '#AAA'],
        baseColor: '#777'
      },
      shadowColor: '#222',
      shadowBlur: 40
    },

    boundary: {
      color: '#4A4A6A',
      lineWidth: 2
    },

    minimap: {
      background: ['rgba(10, 10, 30, 0.6)', 'rgba(30, 30, 50, 0.6)'],
      obstacleColor: '#666',
      borderColor: '#4A4A6A',
      borderWidth: 2
    },

    postProcessing: {
      vignette: {
        enabled: true,
        strength: 0.6,
        falloff: 0.4
      },
      colorGrading: {
        enabled: true,
        brightness: 0.9,
        contrast: 1.2,
        saturation: 0.7,
        hueShift: -10
      }
    }
  },

  lava: {
    name: "Volcanic Wasteland",
    description: "Dangerous molten terrain with glowing cracks",

    background: {
      type: 'pattern',
      patternType: 'cracks',
      patternConfig: {
        lineCount: 25,
        baseColor: '#2A0A0A',
        glowColor: '#FF4500',
        glowIntensity: 40,
        animated: true,
        pulseSpeed: 0.002
      },
      fallbackColors: ['#3A0A0A', '#5A1010']
    },

    grid: {
      enabled: false
    },

    obstacles: {
      fillType: 'solid',
      fillColor: '#1A0A0A',  // Dark obsidian
      shadowColor: '#FF4500',  // Orange glow
      shadowBlur: 50,
      strokeStyle: '#FF6600',
      lineWidth: 2,
      strokeGlow: true,
      glowAnimation: {
        enabled: true,
        pulseSpeed: 0.0015,
        minBlur: 30,
        maxBlur: 70
      }
    },

    boundary: {
      color: '#FF4500',
      lineWidth: 3
    },

    minimap: {
      background: ['rgba(42, 10, 10, 0.8)', 'rgba(90, 16, 16, 0.8)'],
      obstacleColor: '#1A0A0A',
      borderColor: '#FF4500',
      borderWidth: 2
    },

    postProcessing: {
      bloom: {
        enabled: true,
        threshold: 0.3,
        intensity: 0.6,
        radius: 20
      },
      vignette: {
        enabled: true,
        strength: 0.4,
        falloff: 0.6
      },
      colorGrading: {
        enabled: true,
        brightness: 1.0,
        contrast: 1.3,
        saturation: 1.4,
        hueShift: 5
      }
    }
  }
};

// Current active theme (neon for testing)
let currentTheme = 'neon';

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
