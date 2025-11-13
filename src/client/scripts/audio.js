// Audio system for game sound effects using Web Audio API

const SOUNDS = {
    HEALTH_PICKUP: 'health_pickup',
    CROWN_PICKUP: 'crown_pickup',
    SHIELD_PICKUP: 'shield_pickup',
    SPEED_PICKUP: 'speed_pickup'
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

// Procedurally generate crown pickup sound effect
function playCrownPickupSound(volume = 0.4) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Create oscillators for a powerful "power-up" sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const osc3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect audio graph
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Power chord (G + D) with square waves for punch
    osc1.type = 'square';
    osc2.type = 'square';
    osc1.frequency.setValueAtTime(196, now);      // G3
    osc2.frequency.setValueAtTime(293.66, now);   // D4

    // Transition to bright sine wave arpeggio
    osc1.frequency.setValueAtTime(523.25, now + 0.15);  // C5
    osc2.frequency.setValueAtTime(659.25, now + 0.25);  // E5
    osc3.frequency.setValueAtTime(783.99, now + 0.35);  // G5

    osc1.type = 'sine';
    osc2.type = 'sine';
    osc3.type = 'sine';

    // Envelope for punchy attack and smooth decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Instant attack
    gainNode.gain.setValueAtTime(volume, now + 0.3);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.45); // Smooth decay

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now + 0.15);  // osc3 only for arpeggio
    osc1.stop(now + 0.45);
    osc2.stop(now + 0.45);
    osc3.stop(now + 0.45);
}

// Procedurally generate shield pickup sound effect
function playShieldPickupSound(volume = 0.3) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Create oscillators for a "protective" sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect audio graph
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillators
    osc1.type = 'sine';
    osc2.type = 'triangle';

    // Ascending "protective" sweep: 200Hz → 600Hz
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(600, now + 0.4);

    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(800, now + 0.4);

    // Smooth envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.5);

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.5);
    osc2.stop(now + 0.5);
}

// Procedurally generate speed pickup sound effect
function playSpeedPickupSound(volume = 0.35) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Create oscillators for a "fast whoosh" sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect audio graph
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillators with sawtooth for energetic feel
    osc1.type = 'sawtooth';
    osc2.type = 'triangle';

    // Fast ascending sweep: 300Hz → 1200Hz (rapid, energetic)
    osc1.frequency.setValueAtTime(300, now);
    osc1.frequency.exponentialRampToValueAtTime(1200, now + 0.2);

    osc2.frequency.setValueAtTime(450, now);
    osc2.frequency.exponentialRampToValueAtTime(1600, now + 0.2);

    // Quick, punchy envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02); // Very fast attack
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.25); // Quick decay

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.25);
    osc2.stop(now + 0.25);
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
        case SOUNDS.CROWN_PICKUP:
            playCrownPickupSound(volume);
            break;
        case SOUNDS.SHIELD_PICKUP:
            playShieldPickupSound(volume);
            break;
        case SOUNDS.SPEED_PICKUP:
            playSpeedPickupSound(volume);
            break;
        default:
            console.warn(`Unknown sound: ${soundKey}`);
    }
}

export { SOUNDS };
