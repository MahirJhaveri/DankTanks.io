/**
 * Event Notification System
 * Manages DOM-based event notifications for game events
 * Queue-based system with max capacity (no auto-timeout)
 */

const Constants = require('../../shared/constants');
const { EVENT_TYPES } = Constants;

// DOM container reference
let notificationContainer = null;

// Notification queue management
let notificationIdCounter = 0;
const MAX_NOTIFICATIONS = 10;

/**
 * Initialize notification system
 * Call this once when the game starts
 */
export function initNotifications() {
    // Create or get notification container
    notificationContainer = document.getElementById('notification-container');
    if (!notificationContainer) {
        notificationContainer = document.createElement('div');
        notificationContainer.id = 'notification-container';
        document.body.appendChild(notificationContainer);
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
 * Add a new notification to the queue
 * If queue is full, remove oldest notification
 */
export function addNotification(eventType, data) {
    if (!notificationContainer) {
        console.error('Notification container not initialized');
        return;
    }

    const message = formatMessage(eventType, data);

    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    notification.dataset.id = `notif-${notificationIdCounter++}`;
    notification.dataset.eventType = eventType;

    // Add to container (append to bottom - newest at bottom like chat)
    notificationContainer.appendChild(notification);

    // Auto-scroll to bottom to show newest message
    notificationContainer.scrollTop = notificationContainer.scrollHeight;

    // Enforce max queue size - remove oldest if exceeding limit
    enforceQueueLimit();
}

/**
 * Enforce maximum queue size
 * Remove oldest notifications when exceeding MAX_NOTIFICATIONS
 */
function enforceQueueLimit() {
    if (!notificationContainer) {
        return;
    }

    const notifications = notificationContainer.querySelectorAll('.notification:not(.notification-fadeout)');

    // If we exceed the limit, remove oldest ones
    if (notifications.length > MAX_NOTIFICATIONS) {
        const excessCount = notifications.length - MAX_NOTIFICATIONS;

        // Remove from the beginning (oldest)
        for (let i = 0; i < excessCount; i++) {
            if (notifications[i]) {
                notifications[i].classList.add('notification-fadeout');
                // Remove from DOM after fade animation completes
                setTimeout(() => {
                    if (notifications[i].parentNode) {
                        notifications[i].parentNode.removeChild(notifications[i]);
                    }
                }, 300); // Match CSS animation duration
            }
        }
    }
}

/**
 * Clear crown notification (no-op now, kept for compatibility)
 * Crown notifications are now treated like any other notification
 */
export function clearCrownNotification() {
    // No longer needed - crown notifications are temporary now
    // Kept for backward compatibility with networking.js
}

/**
 * Clear all notifications (useful for game reset)
 */
export function clearAllNotifications() {
    if (notificationContainer) {
        notificationContainer.innerHTML = '';
    }
}
