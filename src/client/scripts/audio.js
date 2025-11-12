// Audio system for game sound effects

const SOUNDS = {
    HEALTH_PICKUP: 'health_pickup.mp3'
    // Future sounds: SHOOT, HIT, EXPLOSION, etc.
};

const audioCache = {};

// Load all audio files
export function loadAudio() {
    Object.entries(SOUNDS).forEach(([key, filename]) => {
        const audio = new Audio(`/assets/sounds/${filename}`);
        audio.preload = 'auto';
        audioCache[key] = audio;
    });
}

// Play a sound effect
export function playSound(soundKey, volume = 0.5) {
    const audio = audioCache[soundKey];
    if (audio) {
        // Clone the audio node to allow overlapping sounds
        const soundInstance = audio.cloneNode();
        soundInstance.volume = volume;
        soundInstance.play().catch(e => console.warn('Audio play failed:', e));
    }
}

export { SOUNDS };
