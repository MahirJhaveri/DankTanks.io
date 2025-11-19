// Audio system for game sound effects using Web Audio API

const SOUNDS = {
    HEALTH_PICKUP: 'health_pickup',
    CROWN_PICKUP: 'crown_pickup',
    SHIELD_PICKUP: 'shield_pickup',
    SPEED_PICKUP: 'speed_pickup',
    KILL: 'kill',
    BUTTON_CLICK: 'button_click',
    TYPING: 'typing',
    SWITCH_TOGGLE: 'switch_toggle',
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

// Procedurally generate kill confirmation sound effect
function playKillSound(volume = 0.4) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Create oscillators for an aggressive "elimination" sound
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const osc3 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect audio graph
    osc1.connect(gainNode);
    osc2.connect(gainNode);
    osc3.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Aggressive descending sweep (like an "elimination" sound)
    // Start high, drop low for impact
    osc1.type = 'sawtooth';
    osc2.type = 'square';
    osc3.type = 'triangle';

    // High impact start (800Hz) → deep punch (100Hz)
    osc1.frequency.setValueAtTime(800, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.3);

    osc2.frequency.setValueAtTime(400, now);
    osc2.frequency.exponentialRampToValueAtTime(50, now + 0.3);

    // Add harmonic for richness
    osc3.frequency.setValueAtTime(1200, now);
    osc3.frequency.exponentialRampToValueAtTime(150, now + 0.3);

    // Punchy envelope with sharp attack and moderate decay
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01); // Immediate impact
    gainNode.gain.setValueAtTime(volume, now + 0.1);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4); // Smooth fadeout

    // Start and stop
    osc1.start(now);
    osc2.start(now);
    osc3.start(now);
    osc1.stop(now + 0.4);
    osc2.stop(now + 0.4);
    osc3.stop(now + 0.4);
}

// Procedurally generate mechanical button click sound
function playButtonClickSound(volume = 0.15) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Create noise buffer for mechanical "click"
    const bufferSize = audioContext.sampleRate * 0.05; // 50ms
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate filtered noise for click
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    // Add tone for mechanical resonance
    const osc = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

    noiseSource.connect(gainNode);
    osc.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Sharp envelope for mechanical click
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.005);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);

    noiseSource.start(now);
    osc.start(now);
    noiseSource.stop(now + 0.05);
    osc.stop(now + 0.05);
}

// Procedurally generate keyboard typing sound
function playTypingSound(volume = 0.1) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Very short click for keystroke
    const bufferSize = audioContext.sampleRate * 0.02; // 20ms
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    // Generate short click noise
    for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.15));
    }

    const noiseSource = audioContext.createBufferSource();
    noiseSource.buffer = buffer;

    const gainNode = audioContext.createGain();
    noiseSource.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Very quick envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.002);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.02);

    noiseSource.start(now);
    noiseSource.stop(now + 0.02);
}

// Procedurally generate mechanical switch toggle sound
function playSwitchToggleSound(volume = 0.2) {
    if (!audioContext) return;

    const now = audioContext.currentTime;

    // Two-stage mechanical switch sound (down + up)
    const osc1 = audioContext.createOscillator();
    const osc2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    osc1.type = 'square';
    osc2.type = 'triangle';

    // First click (down)
    osc1.frequency.setValueAtTime(200, now);
    osc1.frequency.exponentialRampToValueAtTime(100, now + 0.04);

    // Second click (up) - slightly higher pitch
    osc2.frequency.setValueAtTime(250, now + 0.06);
    osc2.frequency.exponentialRampToValueAtTime(120, now + 0.1);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Two-stage envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.04);
    gainNode.gain.linearRampToValueAtTime(volume * 0.7, now + 0.07);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc1.start(now);
    osc1.stop(now + 0.04);
    osc2.start(now + 0.06);
    osc2.stop(now + 0.12);
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
        case SOUNDS.KILL:
            playKillSound(volume);
            break;
        case SOUNDS.BUTTON_CLICK:
            playButtonClickSound(volume);
            break;
        case SOUNDS.TYPING:
            playTypingSound(volume);
            break;
        case SOUNDS.SWITCH_TOGGLE:
            playSwitchToggleSound(volume);
            break;
        default:
            console.warn(`Unknown sound: ${soundKey}`);
    }
}

export { SOUNDS };
