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
