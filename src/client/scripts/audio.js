// Audio system for game sound effects using Web Audio API

const SOUNDS = {
    HEALTH_PICKUP: 'health_pickup'
    // Future sounds: SHOOT, HIT, EXPLOSION, etc.
};

let audioContext = null;

// Initialize audio context
export function loadAudio() {
    try {
        // Create AudioContext (handles browser compatibility)
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        console.log('Audio system initialized');
    } catch (e) {
        console.warn('Web Audio API not supported:', e);
    }
}

// Procedurally generate health pickup sound effect
function playHealthPickupSound(volume = 0.3) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Create oscillators for a pleasant "healing chime"
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect audio graph
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillators (major chord for positive feel)
    osc1.type = 'sine';
    osc2.type = 'sine';

    // Play a rising arpeggio: E -> G# -> B (E major chord)
    // First note (E5 - 659.25 Hz)
    osc1.frequency.setValueAtTime(659.25, now);
    osc2.frequency.setValueAtTime(659.25, now);

    // Second note (G#5 - 830.61 Hz) at 80ms
    osc1.frequency.setValueAtTime(830.61, now + 0.08);
    osc2.frequency.setValueAtTime(830.61, now + 0.08);

    // Third note (B5 - 987.77 Hz) at 160ms
    osc1.frequency.setValueAtTime(987.77, now + 0.16);
    osc2.frequency.setValueAtTime(987.77, now + 0.16);

    // Envelope for smooth attack and decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02); // Quick attack
    gainNode.gain.setValueAtTime(volume, now + 0.16);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); // Gentle decay

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
}

// Play a sound effect
export function playSound(soundKey, volume = 0.3) {
    if (!audioContext) {
        console.warn('Audio context not initialized');
        return;
    }

    // Resume audio context if suspended (browser autoplay policy)
    if (audioContext.state === 'suspended') {
        audioContext.resume();
    }

    switch (soundKey) {
        case SOUNDS.HEALTH_PICKUP:
            playHealthPickupSound(volume);
            break;
        default:
            console.warn(`Unknown sound: ${soundKey}`);
    }
}

export { SOUNDS };
