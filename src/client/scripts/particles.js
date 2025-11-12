// Particle effect system for visual feedback

class Particle {
    constructor(x, y, vx, vy, life, color, size) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.life = life;
        this.maxLife = life;
        this.color = color;
        this.size = size;
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        return this.life > 0;
    }

    render(canvas, cameraX, cameraY) {
        const context = canvas.getContext('2d');
        const alpha = this.life / this.maxLife;
        context.fillStyle = `rgba(${this.color}, ${alpha})`;
        context.fillRect(
            canvas.width / 2 + this.x - cameraX - this.size / 2,
            canvas.height / 2 + this.y - cameraY - this.size / 2,
            this.size,
            this.size
        );
    }
}

const particles = [];

// Create a green burst effect for health pack collection
export function createHealthPickupEffect(x, y) {
    // Green burst particles
    for (let i = 0; i < 12; i++) {
        const angle = (Math.PI * 2 * i) / 12;
        const speed = 100 + Math.random() * 50;
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            0.5,  // 0.5 second life
            '0, 255, 0',  // Green RGB
            8
        ));
    }

    // Add floating "+" symbols
    for (let i = 0; i < 3; i++) {
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 20,
            y,
            (Math.random() - 0.5) * 30,
            -80 - Math.random() * 40,
            0.8,  // 0.8 second life
            '255, 255, 255',  // White RGB
            12
        ));
    }
}

// Create a golden burst effect for crown collection
export function createCrownPickupEffect(x, y) {
    // Golden starburst particles
    for (let i = 0; i < 16; i++) {
        const angle = (Math.PI * 2 * i) / 16;
        const speed = 120 + Math.random() * 60;
        // Vary gold color slightly for richness
        const colorVariation = Math.floor(Math.random() * 30);
        particles.push(new Particle(
            x, y,
            Math.cos(angle) * speed,
            Math.sin(angle) * speed,
            0.6,  // 0.6 second life
            `255, ${215 - colorVariation}, 0`,  // Gold RGB with variation
            10
        ));
    }

    // Add floating sparkle symbols
    for (let i = 0; i < 4; i++) {
        particles.push(new Particle(
            x + (Math.random() - 0.5) * 40,
            y,
            (Math.random() - 0.5) * 50,
            -100 - Math.random() * 40,
            0.9,  // 0.9 second life
            '255, 255, 150',  // Yellow/white RGB
            14
        ));
    }
}

// Create smoke particles for tank movement
export function createTankSmoke(x, y, direction, constants) {
    const { SMOKE_PARTICLE_COLOR, SMOKE_PARTICLE_LIFESPAN,
            SMOKE_PARTICLE_DENSITY, SMOKE_PARTICLE_SPEED } = constants;

    // Calculate opposite direction for smoke emission
    const smokeDirection = direction + Math.PI;

    // Create multiple smoke particles
    for (let i = 0; i < SMOKE_PARTICLE_DENSITY; i++) {
        // Add randomization to direction (±30 degrees)
        const angleVariation = (Math.random() - 0.5) * Math.PI / 3;
        const particleAngle = smokeDirection + angleVariation;

        // Add speed variation (±30%)
        const speedVariation = 0.7 + Math.random() * 0.6;
        const speed = SMOKE_PARTICLE_SPEED * speedVariation;

        // Calculate velocity components
        const vx = Math.cos(particleAngle) * speed;
        const vy = Math.sin(particleAngle) * speed;

        // Add slight position offset for natural spread
        const offsetX = (Math.random() - 0.5) * 20;
        const offsetY = (Math.random() - 0.5) * 20;

        // Vary particle size (3-6 pixels)
        const size = 3 + Math.random() * 3;

        // Slight color variation for realism
        const colorVariation = Math.floor(Math.random() * 20);
        const grayValue = 60 + colorVariation;
        const smokeColor = `${grayValue}, ${grayValue}, ${grayValue}`;

        particles.push(new Particle(
            x + offsetX,
            y + offsetY,
            vx,
            vy,
            SMOKE_PARTICLE_LIFESPAN,
            smokeColor,
            size
        ));
    }
}

// Update all particles
export function updateParticles(dt) {
    for (let i = particles.length - 1; i >= 0; i--) {
        if (!particles[i].update(dt)) {
            particles.splice(i, 1);
        }
    }
}

// Render all particles
export function renderParticles(canvas, cameraX, cameraY) {
    particles.forEach(p => p.render(canvas, cameraX, cameraY));
}
