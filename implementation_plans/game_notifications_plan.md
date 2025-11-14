# Event Notification System - Implementation Plan

> **Project:** DankTanks.io
> **Feature:** Real-time Event Notifications
> **Approach:** DOM-based Notifications
> **Estimated Time:** 5-8 hours
> **Date:** 2025-11-14

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Summary](#architecture-summary)
3. [Phase 1: Constants and Types](#phase-1-constants-and-types)
4. [Phase 2: Server-Side Event Detection](#phase-2-server-side-event-detection)
5. [Phase 3: Client-Side Notification System](#phase-3-client-side-notification-system)
6. [Phase 4: Styling and Polish](#phase-4-styling-and-polish)
7. [Phase 5: Testing and Validation](#phase-5-testing-and-validation)
8. [Deployment Checklist](#deployment-checklist)
9. [Rollback Plan](#rollback-plan)

---

## Overview

### Objective
Implement a real-time event notification system that displays important game events to all players, including:
- Player kills: "PlayerA destroyed PlayerB"
- Player joins: "PlayerX joined the battle"
- Player deaths: "PlayerY was destroyed"
- Crown pickup: "PlayerZ has the crown!" (persistent)
- Crown drop: "The crown is up for grabs!"

### Technical Approach
- **Server-side:** Detect events and broadcast via Socket.IO
- **Client-side:** DOM-based notification rendering with CSS animations
- **Architecture:** Event-driven, authoritative server model

### Key Design Decisions
✅ DOM-based rendering (not Canvas)
✅ Single color scheme (simplicity)
✅ Full usernames displayed
✅ No sound effects (future enhancement)
✅ Max 3 visible transient notifications
✅ Persistent crown notification (until crown dropped)

---

## Architecture Summary

```
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js)                         │
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │  game.js     │──────│ Event        │                   │
│  │  player.js   │      │ Detection    │                   │
│  │  collisions.js│      └──────┬───────┘                   │
│  └──────────────┘             │                            │
│                               │                            │
│                               ▼                            │
│                    ┌──────────────────┐                    │
│                    │ broadcastEvent() │                    │
│                    └─────────┬────────┘                    │
└──────────────────────────────┼─────────────────────────────┘
                               │ Socket.IO
                               │ MSG_TYPES.EVENT_NOTIFICATION
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT (Browser)                         │
│                                                             │
│  ┌──────────────┐      ┌──────────────────┐               │
│  │networking.js │──────│ Event Listener   │               │
│  └──────────────┘      └────────┬─────────┘               │
│                                  │                         │
│                                  ▼                         │
│                    ┌─────────────────────┐                 │
│                    │ notifications.js    │                 │
│                    │ - addNotification() │                 │
│                    │ - renderDOM()       │                 │
│                    └─────────┬───────────┘                 │
│                              │                             │
│                              ▼                             │
│                    ┌──────────────────┐                    │
│                    │  DOM Elements    │                    │
│                    │  + CSS Animations│                    │
│                    └──────────────────┘                    │
└─────────────────────────────────────────────────────────────┘
```

### Message Flow

```javascript
// Server broadcasts event
io.emit('event_notification', {
  eventType: 'PLAYER_KILL',
  data: { killer: 'PlayerA', victim: 'PlayerB' },
  timestamp: 1699999999999
});

// Client receives and renders
socket.on('event_notification', (payload) => {
  addNotification(payload.eventType, payload.data);
  // DOM element created with CSS animation
});
```

---

## Phase 1: Constants and Types

**Duration:** 15-30 minutes
**Files to modify:** 1

### 1.1 Update `src/shared/constants.js`

**Location:** `/home/user/DankTanks.io/src/shared/constants.js`

**Task:** Add event notification message types and constants

**Changes:**

1. **Add new message type** to `MSG_TYPES` object (around line 96, after `POWERUP_COLLECTED`):

```javascript
MSG_TYPES: {
    JOIN_GAME: 'join_game',
    GAME_UPDATE: 'update',
    INPUT: {
        MOUSE: 'mouse_input',
        KEY: 'keydown_input',
        FIRE: 'mouse_fire'
    },
    GAME_OVER: 'dead',
    LEADERBOARD_UPDATE: 'leaderboard_update',
    MAP_UPDATE: 'map_update',
    HEALTH_PACK_COLLECTED: 'health_pack_collected',
    CROWN_COLLECTED: 'crown_collected',
    POWERUP_COLLECTED: 'powerup_collected',
    // NEW: Add event notification message type
    EVENT_NOTIFICATION: 'event_notification',
},
```

2. **Add event types enum** (after `CROWN_DOUBLE_SHOT_SPREAD` constant, around line 161):

```javascript
// Event notification types
EVENT_TYPES: {
    PLAYER_KILL: 'player_kill',
    PLAYER_JOIN: 'player_join',
    PLAYER_DEATH: 'player_death',
    CROWN_PICKUP: 'crown_pickup',
    CROWN_DROP: 'crown_drop',
},

// Event notification durations (in milliseconds)
NOTIFICATION_DURATIONS: {
    PLAYER_KILL: 3000,      // 3 seconds
    PLAYER_JOIN: 2500,      // 2.5 seconds
    PLAYER_DEATH: 2500,     // 2.5 seconds
    CROWN_PICKUP: -1,       // Persistent (never auto-hide)
    CROWN_DROP: 3000,       // 3 seconds
},
```

**Verification:**
```bash
# Ensure no syntax errors
node -c src/shared/constants.js
```

---

## Phase 2: Server-Side Event Detection

**Duration:** 1-2 hours
**Files to modify:** 3

### 2.1 Add Broadcast Helper to `src/server/game.js`

**Location:** `/home/user/DankTanks.io/src/server/game.js`

**Task 1:** Add `broadcastEvent()` method to Game class

**Location in file:** After constructor, around line 35

```javascript
class Game {
  constructor() {
    // ... existing constructor code
  }

  // NEW METHOD: Broadcast event notification to all connected clients
  broadcastEvent(eventType, data) {
    this.io.emit(Constants.MSG_TYPES.EVENT_NOTIFICATION, {
      eventType: eventType,
      data: data,
      timestamp: Date.now()
    });
  }

  addPlayer(socket, username, tankStyle, fireToggle) {
    // ... existing code
  }
  // ... rest of class
}
```

### 2.2 Add Player Join Event

**Location:** `src/server/game.js` → `addPlayer()` method (around line 41-47)

**Current code:**
```javascript
addPlayer(socket, username, tankStyle, fireToggle) {
    this.sockets[socket.id] = socket;

    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    this.players[socket.id] = new Player(socket.id, username, x, y, tankStyle, fireToggle);
}
```

**Modified code:**
```javascript
addPlayer(socket, username, tankStyle, fireToggle) {
    this.sockets[socket.id] = socket;

    const x = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    const y = Constants.MAP_SIZE * (0.25 + Math.random() * 0.5);
    this.players[socket.id] = new Player(socket.id, username, x, y, tankStyle, fireToggle);

    // NEW: Broadcast player join event
    this.broadcastEvent(Constants.EVENT_TYPES.PLAYER_JOIN, {
        player: username
    });
}
```

### 2.3 Add Player Death/Kill Events

**Location:** `src/server/game.js` → `update()` method (around line 191-207)

**Current code:**
```javascript
if (player.hp <= 0) {
    /* Restore the health of player who killed */
    if(player.lastHitByPlayer) {
        const killedByPlayer = this.players[player.lastHitByPlayer];
        killedByPlayer.hp = Constants.PLAYER_MAX_HP;
    }

    socket.emit(Constants.MSG_TYPES.GAME_OVER);
    this.removePlayer(socket);
    this.explosions.push(new Explosion(player.x, player.y));
}
```

**Modified code:**
```javascript
if (player.hp <= 0) {
    /* Restore the health of player who killed */
    if(player.lastHitByPlayer) {
        const killedByPlayer = this.players[player.lastHitByPlayer];
        if (killedByPlayer) {
            killedByPlayer.hp = Constants.PLAYER_MAX_HP;

            // NEW: Broadcast kill event (player killed by another player)
            this.broadcastEvent(Constants.EVENT_TYPES.PLAYER_KILL, {
                killer: killedByPlayer.username,
                victim: player.username
            });
        }
    } else {
        // NEW: Broadcast death event (player died to obstacle/environment)
        this.broadcastEvent(Constants.EVENT_TYPES.PLAYER_DEATH, {
            victim: player.username
        });
    }

    socket.emit(Constants.MSG_TYPES.GAME_OVER);
    this.removePlayer(socket);
    this.explosions.push(new Explosion(player.x, player.y));
}
```

**Important note:** Added `if (killedByPlayer)` check to prevent errors if killer disconnected before kill event is processed.

### 2.4 Add Crown Pickup Event

**Location:** `src/server/game.js` → `update()` method (around line 159-172)

**Current code:**
```javascript
// Emit crown collection event to specific player
socket.emit(Constants.MSG_TYPES.CROWN_COLLECTED, {
    x: crown.x,
    y: crown.y,
    powerupType: crown.id
});
```

**Modified code:**
```javascript
// Emit crown collection event to specific player
socket.emit(Constants.MSG_TYPES.CROWN_COLLECTED, {
    x: crown.x,
    y: crown.y,
    powerupType: crown.id
});

// NEW: Broadcast crown pickup event to all players
this.broadcastEvent(Constants.EVENT_TYPES.CROWN_PICKUP, {
    player: player.username
});
```

### 2.5 Add Crown Drop Event

**Location:** `src/server/game.js` → `removePlayer()` method (around line 49-59)

**Current code:**
```javascript
removePlayer(socket) {
    // release crowns if player has any
    const player = this.players[socket.id];
    if (player) {
        const crown = player.dropCrownPowerup();
        if (crown) this.crowns.push(crown);
    }

    delete this.sockets[socket.id];
    delete this.players[socket.id];
}
```

**Modified code:**
```javascript
removePlayer(socket) {
    // release crowns if player has any
    const player = this.players[socket.id];
    if (player) {
        const crown = player.dropCrownPowerup();
        if (crown) {
            this.crowns.push(crown);

            // NEW: Broadcast crown drop event to all players
            this.broadcastEvent(Constants.EVENT_TYPES.CROWN_DROP, {
                player: player.username
            });
        }
    }

    delete this.sockets[socket.id];
    delete this.players[socket.id];
}
```

### 2.6 Verification

**Test server compilation:**
```bash
# Run ESLint
npm run lint

# Start development server
npm run develop
```

**Expected result:** No errors, server starts successfully

---

## Phase 3: Client-Side Notification System

**Duration:** 2-3 hours
**Files to create:** 1
**Files to modify:** 3

### 3.1 Create `src/client/scripts/notifications.js` (NEW FILE)

**Location:** `/home/user/DankTanks.io/src/client/scripts/notifications.js`

**Full file contents:**

```javascript
/**
 * Event Notification System
 * Manages DOM-based event notifications for game events
 */

const Constants = require('../../shared/constants');
const { EVENT_TYPES, NOTIFICATION_DURATIONS } = Constants;

// DOM container references
let notificationContainer = null;
let crownNotificationContainer = null;

// Notification tracking
let notificationIdCounter = 0;
const MAX_VISIBLE_NOTIFICATIONS = 3;

/**
 * Initialize notification system
 * Call this once when the game starts
 */
export function initNotifications() {
    // Create main notification container
    notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
    }

    // Create crown notification container
    crownNotificationContainer = document.getElementById('crown-notification-container');
    if (!crownNotificationContainer) {
        crownNotificationContainer = document.createElement('div');
        crownNotificationContainer.id = 'crown-notification-container';
        document.body.appendChild(crownNotificationContainer);
    }
}

/**
 * Format notification message based on event type
 */
function formatMessage(eventType, data) {
    switch(eventType) {
        case EVENT_TYPES.PLAYER_KILL:
            return `${data.killer} destroyed ${data.victim}`;
        case EVENT_TYPES.PLAYER_JOIN:
            return `${data.player} joined the battle`;
        case EVENT_TYPES.PLAYER_DEATH:
            return `${data.victim} was destroyed`;
        case EVENT_TYPES.CROWN_PICKUP:
            return `👑 ${data.player} has the crown!`;
        case EVENT_TYPES.CROWN_DROP:
            return `The crown is up for grabs!`;
        default:
            return 'Unknown event';
    }
}

/**
 * Add a new notification
 */
export function addNotification(eventType, data) {
    const isPersistent = eventType === EVENT_TYPES.CROWN_PICKUP;
    const duration = NOTIFICATION_DURATIONS[eventType];
    const message = formatMessage(eventType, data);

    if (isPersistent) {
        // Handle persistent crown notification
        addCrownNotification(message, data);
    } else {
        // Handle transient notification
        addTransientNotification(message, eventType, duration);
    }
}

/**
 * Add a transient notification (kills, joins, deaths, crown drops)
 */
function addTransientNotification(message, eventType, duration) {
    if (!notificationContainer) {
        console.error('Notification container not initialized');
        return;
    }

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.dataset.id = `notif-${notificationIdCounter++}`;
    notification.dataset.eventType = eventType;

    // Add to container (prepend so newest is on top visually)
    notificationContainer.insertBefore(notification, notificationContainer.firstChild);

    // Limit number of visible notifications
    pruneNotifications();

    // Auto-remove after duration
    setTimeout(() => {
        if (notification.parentNode) {
            notification.classList.add('notification-fadeout');
            // Remove from DOM after fade animation completes
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300); // Match CSS animation duration
        }
    }, duration);
}

/**
 * Add or update persistent crown notification
 */
function addCrownNotification(message, data) {
    if (!crownNotificationContainer) {
        console.error('Crown notification container not initialized');
        return;
    }

    // Remove existing crown notification if any
    crownNotificationContainer.innerHTML = '';

    // Create crown notification element
    const notification = document.createElement('div');
    notification.className = 'crown-notification';
    notification.textContent = message;
    notification.dataset.player = data.player;

    // Add to container
    crownNotificationContainer.appendChild(notification);
}

/**
 * Clear crown notification (when crown is dropped)
 */
export function clearCrownNotification() {
    if (!crownNotificationContainer) {
        return;
    }

    // Add fade-out class to existing notification
    const existingNotification = crownNotificationContainer.querySelector('.crown-notification');
    if (existingNotification) {
        existingNotification.classList.add('crown-notification-fadeout');

        // Remove from DOM after animation
        setTimeout(() => {
            if (existingNotification.parentNode) {
                existingNotification.parentNode.removeChild(existingNotification);
            }
        }, 300);
    }
}

/**
 * Prune old notifications to keep max visible count
 */
function pruneNotifications() {
    if (!notificationContainer) {
        return;
    }

    const notifications = notificationContainer.querySelectorAll('.notification:not(.notification-fadeout)');

    // If we have more than max, remove oldest ones
    if (notifications.length > MAX_VISIBLE_NOTIFICATIONS) {
        // Remove from the end (oldest)
        for (let i = MAX_VISIBLE_NOTIFICATIONS; i < notifications.length; i++) {
            notifications[i].classList.add('notification-fadeout');
            setTimeout(() => {
                if (notifications[i].parentNode) {
                    notifications[i].parentNode.removeChild(notifications[i]);
                }
            }, 300);
        }
    }
}

/**
 * Clear all notifications (useful for game reset)
 */
export function clearAllNotifications() {
    if (notificationContainer) {
        notificationContainer.innerHTML = '';
    }
    if (crownNotificationContainer) {
        crownNotificationContainer.innerHTML = '';
    }
}
```

### 3.2 Update `src/client/scripts/networking.js`

**Location:** `/home/user/DankTanks.io/src/client/scripts/networking.js`

**Task 1:** Import notification functions (add to top of file, around line 5)

```javascript
import { getCurrentState, processGameUpdate } from './state';
import { downloadAssets } from './assets';
import { setLeaderboardHidden, processLeaderboardUpdate } from './leaderboard';
import { processMapUpdate } from './map';
import { createPowerupPickupEffect, createCrownPickupEffect } from './particles';
import { playSound, SOUNDS } from './audio';
// NEW: Import notification functions
import { addNotification, clearCrownNotification } from './notifications';
```

**Task 2:** Add event notification listener (add after existing socket.on listeners, around line 40)

```javascript
socket.on(Constants.MSG_TYPES.POWERUP_COLLECTED, ({ x, y, type, result }) => {
  const config = POWERUP_CONFIGS[type];
  playSound(SOUNDS[config.collectSound]);
  createPowerupPickupEffect(x, y, type, config);
});

// NEW: Event notification listener
socket.on(Constants.MSG_TYPES.EVENT_NOTIFICATION, ({ eventType, data }) => {
  // Handle crown drop - clear persistent crown notification
  if (eventType === Constants.EVENT_TYPES.CROWN_DROP) {
    clearCrownNotification();
  }

  // Add the notification
  addNotification(eventType, data);
});
```

### 3.3 Update `src/client/scripts/index.js`

**Location:** `/home/user/DankTanks.io/src/client/scripts/index.js`

**Task:** Initialize notification system on game start

**Find:** The `downloadAssets()` promise chain (around line 20-30)

**Current code:**
```javascript
Promise.all([
  connect(onGameOver),
  downloadAssets(),
]).then(() => {
  playMenu.classList.remove('hidden');
  usernameInput.focus();
}).catch(console.error);
```

**Modified code:**
```javascript
import { initNotifications } from './notifications';

// ... existing code ...

Promise.all([
  connect(onGameOver),
  downloadAssets(),
]).then(() => {
  // NEW: Initialize notification system
  initNotifications();

  playMenu.classList.remove('hidden');
  usernameInput.focus();
}).catch(console.error);
```

### 3.4 Update `src/client/html/index.html`

**Location:** `/home/user/DankTanks.io/src/client/html/index.html`

**Task:** Add notification containers to HTML

**Find:** The body section with game elements (around line 20-30)

**Add these containers before the closing `</body>` tag:**

```html
    <!-- Existing game elements -->
    <canvas id="game-canvas"></canvas>
    <canvas id="game-canvas-2"></canvas>

    <!-- NEW: Notification containers -->
    <div id="notification-container"></div>
    <div id="crown-notification-container"></div>

    <!-- Existing elements continue -->
    <div id="play-menu" class="hidden">
      <!-- ... -->
    </div>
  </body>
</html>
```

**Note:** The containers will be created dynamically by JavaScript if they don't exist, but adding them to HTML is cleaner.

---

## Phase 4: Styling and Polish

**Duration:** 1 hour
**Files to modify:** 1

### 4.1 Update `src/client/css/main.css`

**Location:** `/home/user/DankTanks.io/src/client/css/main.css`

**Task:** Add notification styles

**Add at the end of the file (after line 341):**

```css
/* ========================================
   EVENT NOTIFICATION STYLES
   ======================================== */

/* Main notification container - top center */
#notification-container {
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    width: 500px;
    max-width: 90vw;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    pointer-events: none; /* Don't block clicks */
    z-index: 1000;
}

/* Individual transient notification */
.notification {
    background: rgba(0, 0, 0, 0.85);
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    font-family: "Courier New", Courier, monospace;
    font-size: 16px;
    font-weight: bold;
    text-align: center;
    text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.9);
    white-space: nowrap;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);

    /* Slide-in animation */
    animation: notificationSlideIn 0.3s ease-out;
    opacity: 1;
    transform: translateY(0);
}

/* Slide in animation */
@keyframes notificationSlideIn {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Fade out class (applied when removing) */
.notification-fadeout {
    animation: notificationFadeOut 0.3s ease-out forwards;
}

@keyframes notificationFadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-10px);
    }
}

/* Crown notification container - below transient notifications */
#crown-notification-container {
    position: fixed;
    top: 200px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1001;
    pointer-events: none;
}

/* Persistent crown notification */
.crown-notification {
    background: linear-gradient(135deg, #FFD700 0%, #FFA500 50%, #FFD700 100%);
    color: white;
    padding: 16px 32px;
    border-radius: 12px;
    border: 3px solid #FFD700;
    font-family: "Courier New", Courier, monospace;
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    text-shadow:
        2px 2px 4px rgba(0, 0, 0, 1),
        -1px -1px 2px rgba(0, 0, 0, 0.5);
    box-shadow:
        0 0 20px rgba(255, 215, 0, 0.6),
        0 4px 8px rgba(0, 0, 0, 0.4);
    white-space: nowrap;

    /* Entrance animation */
    animation: crownSlideDown 0.4s ease-out, crownPulse 2s ease-in-out infinite;
}

/* Slide down entrance animation */
@keyframes crownSlideDown {
    from {
        opacity: 0;
        transform: translateY(-50px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

/* Pulsing glow effect */
@keyframes crownPulse {
    0%, 100% {
        box-shadow:
            0 0 20px rgba(255, 215, 0, 0.6),
            0 4px 8px rgba(0, 0, 0, 0.4);
    }
    50% {
        box-shadow:
            0 0 30px rgba(255, 215, 0, 0.9),
            0 4px 8px rgba(0, 0, 0, 0.4);
    }
}

/* Crown notification fade out */
.crown-notification-fadeout {
    animation: crownFadeOut 0.3s ease-out forwards;
}

@keyframes crownFadeOut {
    from {
        opacity: 1;
        transform: translateY(0);
    }
    to {
        opacity: 0;
        transform: translateY(-30px);
    }
}

/* Mobile responsiveness */
@media screen and (max-width: 640px) {
    #notification-container {
        top: 50px;
        width: 95vw;
    }

    .notification {
        font-size: 14px;
        padding: 10px 18px;
    }

    #crown-notification-container {
        top: 170px;
    }

    .crown-notification {
        font-size: 16px;
        padding: 12px 24px;
    }
}

/* Ensure notifications appear above game canvas but below menus */
#notification-container,
#crown-notification-container {
    z-index: 900; /* Below menus (z-index: 1000+) but above canvas */
}
```

---

## Phase 5: Testing and Validation

**Duration:** 1-2 hours

### 5.1 Unit Testing Checklist

**Test each event type individually:**

#### Test 1: Player Join Event
```
Steps:
1. Start server: npm run develop
2. Open browser: http://localhost:3000
3. Enter username and join game
4. Expected: "PlayerName joined the battle" notification appears for 2.5s
5. Verify: Notification fades in smoothly
6. Verify: Notification fades out after 2.5 seconds
```

#### Test 2: Player Kill Event
```
Steps:
1. Open two browser tabs/windows
2. Join with two different players (PlayerA, PlayerB)
3. PlayerA shoots and kills PlayerB
4. Expected on BOTH clients: "PlayerA destroyed PlayerB" notification
5. Verify: Notification displays for 3 seconds
6. Verify: PlayerA gets full HP restoration (existing behavior)
```

#### Test 3: Player Death Event (Obstacle)
```
Steps:
1. Join game
2. Crash tank into an obstacle until destroyed
3. Expected: "PlayerName was destroyed" notification
4. Verify: No killer mentioned (different from kill event)
5. Verify: Notification displays for 2.5 seconds
```

#### Test 4: Crown Pickup Event
```
Steps:
1. Join game
2. Locate crown on map
3. Drive tank over crown to collect it
4. Expected: "👑 PlayerName has the crown!" notification appears
5. Verify: Notification is PERSISTENT (doesn't fade out)
6. Verify: Notification has golden gradient background
7. Verify: Notification has pulsing glow animation
```

#### Test 5: Crown Drop Event
```
Steps:
1. Player has crown (see Test 4)
2. Get killed or crash into obstacle
3. Expected: Crown drops, persistent notification disappears
4. Expected: "The crown is up for grabs!" notification appears for 3s
5. Verify: Persistent crown notification fades out
6. Verify: Drop notification displays correctly
```

### 5.2 Integration Testing

#### Test 6: Multiple Rapid Events
```
Steps:
1. Have 3+ players join simultaneously
2. Expected: Multiple join notifications stack vertically
3. Verify: Max 3 notifications visible at once
4. Verify: Oldest notifications are removed when limit exceeded
5. Verify: Animations don't conflict
```

#### Test 7: Crown Transfer
```
Steps:
1. PlayerA picks up crown
2. Expected: "PlayerA has the crown!" (persistent)
3. PlayerB kills PlayerA
4. Expected: "PlayerB destroyed PlayerA" (transient)
5. Expected: "The crown is up for grabs!" (transient)
6. Expected: Persistent crown notification clears
7. PlayerB picks up crown
8. Expected: "PlayerB has the crown!" (persistent)
9. Verify: Clean transition between crown holders
```

#### Test 8: Notification Overflow
```
Steps:
1. Trigger 10+ events rapidly (multiple kills/joins)
2. Expected: Only 3 notifications visible at once
3. Verify: No DOM memory leak (check DevTools)
4. Verify: Smooth animations despite rapid events
5. Verify: No console errors
```

### 5.3 Cross-Browser Testing

**Test in:**
- ✅ Chrome (primary)
- ✅ Firefox
- ✅ Safari (if available)
- ✅ Edge

**Check:**
- CSS animations work correctly
- Gradient backgrounds render
- Text shadows display properly
- z-index layering correct

### 5.4 Mobile Responsiveness Testing

```
Steps:
1. Open DevTools → Device Emulation
2. Test on iPhone 12 (390px width)
3. Test on iPad (768px width)
4. Verify: Notifications scale down (see @media query)
5. Verify: No horizontal overflow
6. Verify: Readable text on small screens
```

### 5.5 Performance Testing

**Metrics to verify:**

```javascript
// In browser console during gameplay
console.time('notification-render');
// Trigger notification
console.timeEnd('notification-render');
// Should be < 5ms

// Check DOM element count
document.querySelectorAll('.notification').length;
// Should never exceed 3 transient + 1 crown = 4 max

// Check for memory leaks
// Play for 5 minutes with many events
// Open DevTools → Memory → Take Heap Snapshot
// Verify notification elements are garbage collected
```

**Expected performance:**
- No noticeable FPS drop when notifications appear
- Smooth 60 FPS gameplay maintained
- Animations run at 60 FPS
- No memory leaks after 100+ events

### 5.6 Edge Case Testing

#### Edge Case 1: Killer Disconnects Before Kill Event
```
Steps:
1. PlayerA damages PlayerB to near-death
2. PlayerA disconnects
3. PlayerB dies from remaining damage
4. Expected: "PlayerB was destroyed" (death event, not kill)
5. Verify: No errors in server console
6. Verify: No undefined killer name
```

#### Edge Case 2: Long Username
```
Steps:
1. Join with very long username (e.g., "SuperLongPlayerNameThatGoesOnForever")
2. Trigger kill/join event
3. Expected: Notification text doesn't overflow
4. Verify: CSS handles long text gracefully (may need text-overflow: ellipsis)
5. Consider: Truncate usernames server-side if needed
```

#### Edge Case 3: Special Characters in Username
```
Steps:
1. Join with username containing special chars (e.g., "Player<script>alert('xss')</script>")
2. Trigger event
3. Expected: Text is properly escaped (textContent prevents XSS)
4. Verify: No script execution
5. Verify: Special characters display correctly
```

#### Edge Case 4: Network Lag
```
Steps:
1. Use DevTools → Network → Throttle to "Slow 3G"
2. Trigger multiple events
3. Expected: Events arrive out of order but still display
4. Verify: No duplicate notifications
5. Verify: Timestamp-based ordering (if implemented)
```

#### Edge Case 5: Multiple Crown Holders (Race Condition)
```
Steps:
1. Have two players collide with crown simultaneously
2. Expected: Server-side collision detection prevents race
3. Expected: Only one player gets crown
4. Verify: Only one persistent crown notification
5. Verify: No duplicate crown notifications
```

### 5.7 Regression Testing

**Verify existing functionality still works:**

- ✅ Leaderboard updates correctly
- ✅ Mini-map displays properly
- ✅ Tank selection menu works
- ✅ Powerup collection (health, shield, speed)
- ✅ Crown double-shot functionality
- ✅ Particle effects render
- ✅ Trail marks appear
- ✅ Audio plays correctly
- ✅ Game over screen appears
- ✅ Theme switching works

### 5.8 Console Error Check

**Before deployment, verify NO errors in:**

```bash
# Server console (terminal)
npm run develop
# Should see: "Server listening on port 3000"
# Should NOT see: Any errors or warnings

# Client console (browser DevTools)
# Should NOT see: Any red errors
# Acceptable: Informational messages only
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All tests pass (Phase 5.1-5.7)
- [ ] No console errors (server or client)
- [ ] ESLint passes: `npm run lint`
- [ ] Production build succeeds: `npm run build`
- [ ] Test production build locally: `npm start`
- [ ] Code reviewed (if applicable)
- [ ] Git commit with descriptive message
- [ ] Push to feature branch

### Git Commands

```bash
# Stage all changes
git add .

# Commit with descriptive message
git commit -m "Add event notification system for game events

- Add event notification message types and constants
- Implement server-side event detection and broadcasting
- Create DOM-based client notification system
- Add CSS animations for transient and persistent notifications
- Support player kills, joins, deaths, crown pickup/drop events
- Max 3 transient notifications, persistent crown indicator
- Fully tested across browsers and edge cases"

# Push to feature branch
git push -u origin claude/add-event-notifications-01QKewRWjtj9GT44w7au5G3K
```

### Deployment to Fly.io

```bash
# Build production bundle
npm run build

# Deploy to Fly.io
fly deploy

# Monitor deployment
fly logs

# Verify deployment
fly open
```

### Post-Deployment Verification

- [ ] Visit production URL: https://danktanks-io.fly.dev/
- [ ] Join game and trigger all event types
- [ ] Verify notifications appear correctly
- [ ] Check browser console for errors
- [ ] Test with multiple concurrent players
- [ ] Monitor server logs for errors: `fly logs`
- [ ] Check performance (FPS, latency)

### Monitoring (First 24 Hours)

```bash
# Monitor logs
fly logs --follow

# Check for errors
fly logs | grep -i error

# Monitor metrics
fly status
```

---

## Rollback Plan

### If Critical Issues Occur

**Symptoms requiring rollback:**
- Server crashes
- Game becomes unplayable
- Notifications cause severe performance degradation
- Security vulnerability discovered

**Rollback steps:**

```bash
# 1. Identify last working commit
git log --oneline -10

# 2. Revert to previous commit (before notification feature)
git revert <commit-hash>

# 3. Rebuild and redeploy
npm run build
fly deploy

# 4. Verify rollback successful
fly open
fly logs
```

### Partial Rollback (Disable Notifications Only)

If server is fine but client notifications are problematic:

**Quick fix:** Comment out event listener in `networking.js`:

```javascript
// TEMPORARILY DISABLED - notifications causing issues
/*
socket.on(Constants.MSG_TYPES.EVENT_NOTIFICATION, ({ eventType, data }) => {
  if (eventType === Constants.EVENT_TYPES.CROWN_DROP) {
    clearCrownNotification();
  }
  addNotification(eventType, data);
});
*/
```

**Then:**
```bash
npm run build
fly deploy
```

This prevents client from rendering notifications while keeping server broadcasts (harmless).

---

## Known Limitations

### Current Implementation

1. **Username Length:** No truncation for very long usernames
   - **Impact:** May cause notification overflow
   - **Future fix:** Add CSS `text-overflow: ellipsis` or server-side validation

2. **Event Rate Limiting:** No throttling for rapid events
   - **Impact:** Could spam notifications in extreme cases
   - **Future fix:** Add server-side rate limiting per event type

3. **Notification History:** No persistent log of past events
   - **Impact:** Events disappear after duration
   - **Future fix:** Add "event log" UI component

4. **Accessibility:** Notifications not screen-reader friendly
   - **Impact:** Visually impaired users can't access events
   - **Future fix:** Add ARIA live regions and announcements

5. **Sound Effects:** No audio cues for events
   - **Impact:** Players may miss notifications if focused on gameplay
   - **Future fix:** Add optional sound effects (per requirements: future enhancement)

---

## Future Enhancements (Out of Scope)

### Potential Improvements

1. **Kill Streaks:** Track consecutive kills
   - "PlayerX is on a rampage!" (5 kills)
   - "PlayerX is unstoppable!" (10 kills)

2. **Event Icons:** Add visual icons next to text
   - Skull icon for kills
   - Trophy icon for crown
   - Entrance icon for joins

3. **Notification Customization:** Player settings
   - Mute specific event types
   - Adjust notification duration
   - Change position/size

4. **Event Log:** Persistent event history
   - Scrollable list of last 50 events
   - Timestamps
   - Filter by event type

5. **Sound Effects:** Audio feedback
   - Dramatic sound for kills
   - Fanfare for crown pickup
   - Alert sound for crown holder death

6. **Color Coding:** Event-specific colors
   - Red for kills
   - Green for joins
   - Yellow for crown events

7. **Animation Variations:** Different entrance/exit styles
   - Bounce, slide, fade, scale
   - Randomized for variety

8. **Revenge Notifications:** Track kill relationships
   - "PlayerA got revenge on PlayerB!"

9. **Multi-language Support:** i18n
   - Translate event messages
   - Support multiple languages

10. **Event Statistics:** Track event metrics
    - Most kills
    - Longest crown hold time
    - Death causes breakdown

---

## File Summary

### Files Modified (7)

| File | Lines Added | Lines Modified | Purpose |
|------|-------------|----------------|---------|
| `src/shared/constants.js` | ~20 | 0 | Add event types and constants |
| `src/server/game.js` | ~40 | ~15 | Add event detection and broadcasting |
| `src/client/scripts/networking.js` | ~10 | 0 | Add event listener |
| `src/client/scripts/index.js` | ~3 | 0 | Initialize notification system |
| `src/client/html/index.html` | ~3 | 0 | Add notification containers |
| `src/client/css/main.css` | ~150 | 0 | Add notification styles |

### Files Created (1)

| File | Lines | Purpose |
|------|-------|---------|
| `src/client/scripts/notifications.js` | ~200 | Notification management system |

### Total Code Changes

- **Lines added:** ~426
- **Lines modified:** ~15
- **Files changed:** 7
- **Files created:** 1

---

## Technical Debt

### Considerations for Future Refactoring

1. **Constants Organization:** Event-related constants could be moved to separate file
2. **Error Handling:** Add try-catch blocks around notification rendering
3. **Type Safety:** Consider TypeScript for better type checking
4. **Testing:** Add automated unit tests (Jest)
5. **Documentation:** Add JSDoc comments to all functions

---

## Success Criteria

### Definition of Done

✅ All 5 event types broadcast correctly from server
✅ All 5 event types render correctly on client
✅ Transient notifications auto-dismiss after duration
✅ Persistent crown notification stays until crown dropped
✅ Max 3 transient notifications enforced
✅ Smooth CSS animations (fade in/out)
✅ No console errors (server or client)
✅ ESLint passes with no warnings
✅ Production build succeeds
✅ Cross-browser compatible (Chrome, Firefox, Safari, Edge)
✅ Mobile responsive (tested on 2+ screen sizes)
✅ No performance degradation (60 FPS maintained)
✅ All edge cases handled gracefully
✅ Code follows existing style conventions
✅ Deployed to production successfully

---

## Contact & Support

### If You Encounter Issues

1. **Check console logs:**
   - Server: Terminal output
   - Client: Browser DevTools → Console

2. **Verify file paths:**
   - Ensure all imports are correct
   - Check for typos in file names

3. **Review recent commits:**
   ```bash
   git log --oneline -5
   git diff HEAD~1
   ```

4. **Test incrementally:**
   - Implement one phase at a time
   - Test after each phase
   - Commit working changes before moving forward

5. **Common issues:**
   - **"Cannot find module":** Check import paths
   - **"notification is not defined":** Verify initialization called
   - **Notifications not appearing:** Check z-index and container creation
   - **Events not firing:** Verify Socket.IO listener added correctly

---

## Appendix: Code Reference

### Socket.IO Event Flow

```javascript
// SERVER: Broadcast event
this.io.emit(Constants.MSG_TYPES.EVENT_NOTIFICATION, {
  eventType: Constants.EVENT_TYPES.PLAYER_KILL,
  data: { killer: 'PlayerA', victim: 'PlayerB' },
  timestamp: Date.now()
});

// CLIENT: Receive event
socket.on(Constants.MSG_TYPES.EVENT_NOTIFICATION, ({ eventType, data }) => {
  addNotification(eventType, data);
});

// CLIENT: Render notification
function addTransientNotification(message, eventType, duration) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  notificationContainer.appendChild(notification);

  setTimeout(() => {
    notification.classList.add('notification-fadeout');
    setTimeout(() => notification.remove(), 300);
  }, duration);
}
```

### CSS Animation Timeline

```
Transient Notification Lifecycle:
0ms: Create element, add to DOM
0-300ms: Fade in (notificationSlideIn)
300ms-2800ms: Visible (static)
2800ms-3000ms: Fade out (notificationFadeOut)
3000ms: Remove from DOM

Crown Notification Lifecycle:
0ms: Create element, add to DOM
0-400ms: Slide down (crownSlideDown)
400ms+: Pulsing glow (crownPulse, infinite loop)
On crown drop: Fade out (crownFadeOut, 300ms)
```

---

**End of Implementation Plan**

*Document Version: 1.0*
*Last Updated: 2025-11-14*
*Author: AI Assistant*
*Project: DankTanks.io Event Notification System*
