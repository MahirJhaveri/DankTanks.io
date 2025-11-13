class TimedEffect {
    constructor(type, duration, activatedAt) {
        this.type = type;           // e.g., "shield", "speed_boost"
        this.duration = duration;   // Duration in seconds
        this.activatedAt = activatedAt; // Timestamp (ms) when activated
    }

    // Check if effect is still active
    isActive(currentTime) {
        return (currentTime - this.activatedAt) < (this.duration * 1000);
    }

    // Get remaining time in seconds
    getRemainingTime(currentTime) {
        const elapsed = (currentTime - this.activatedAt) / 1000;
        return Math.max(0, this.duration - elapsed);
    }

    // Serialize for network sync
    serialize() {
        return {
            type: this.type,
            duration: this.duration,
            activatedAt: this.activatedAt
        };
    }
}

module.exports = TimedEffect;
