# Feature Specification: Tank Smoke Effect

## 1. Overview

This document outlines the feature specification for adding a smoke effect to moving tanks. The purpose of this feature is to provide visual feedback to the user, creating a stronger illusion of motion. The effect will be purely cosmetic and will not impact gameplay mechanics.

## 2. Client-Side Implementation

The smoke effect will be implemented entirely on the client-side to avoid unnecessary server load and network traffic.

*   **`src/client/scripts/particles.js`**:
    *   A new function, `createTankSmoke(x, y, direction)`, will be created to generate the smoke particles.
    *   This function will be responsible for creating a cluster of particles at the given `x` and `y` coordinates.
    *   The particles will be given a velocity that is opposite to the tank's `direction`, with some randomization to create a more natural-looking smoke effect.
    *   The particles will have a limited lifespan and will fade out over time.

*   **`src/client/scripts/render.js`**:
    *   The `renderPlayer` function will be modified to include the logic for triggering the smoke effect.
    *   A mechanism will be implemented to track the position of each tank between frames. A simple solution would be to store the last known position of each tank in a dictionary or map.
    *   On each frame, the current position of the tank will be compared to its last known position. If the distance between the two positions exceeds a certain threshold, the `createTankSmoke` function will be called to generate smoke particles.
    *   To prevent memory leaks, the position tracking mechanism should be designed to remove entries for players who have disconnected from the game.

## 3. Server-Side Implementation

No server-side changes are required for this feature.

## 4. Shared Constants

The following constants will be added to `src/shared/constants.js` to allow for easy configuration of the smoke effect:

*   `SMOKE_PARTICLE_COLOR`: The color of the smoke particles (e.g., `'128, 128, 128'` for gray).
*   `SMOKE_PARTICLE_LIFESPAN`: The lifespan of the smoke particles in seconds (e.g., `1`).
*   `SMOKE_PARTICLE_DENSITY`: The number of particles to generate on each tick (e.g., `10`).
*   `SMOKE_PARTICLE_SPEED`: The base speed of the smoke particles in pixels per second (e.g., `100`).
