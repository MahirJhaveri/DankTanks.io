import { updateTurretDirection, updateTankDirection, updateFireToggle } from './networking';
import { intialToggle } from './index';
const Constants = require('../../shared/constants');

const joystickContainer = document.getElementById('joystick-container');
const joystick = document.getElementById('joystick');
const fireButton = document.getElementById('fire-button');

// NEW INPUT CONFIG:
// Mouse pointer indicates the direction of the turret
// A/D/<-/-> keys can change the direction of the tank
// the tank always goes ahead

function onMouseInput(e) {
    handleMouseInput(e.clientX, e.clientY);
}

// for touchscreen devices
function onTouchInput(e) {
    // Ignore touches on UI elements
    if (e.target.closest('.mobile-only-controls')) {
        return;
    }
    const touch = e.touches[0];
    if (touch) {
        handleMouseInput(touch.clientX, touch.clientY);
    }
}

function onKeyDown(event) {
    handleKeyDown(event.keyCode)
}

// handles input for each client
function handleMouseInput(x, y) {
    const dir = Math.atan2(x - window.innerWidth / 2, window.innerHeight / 2 - y);
    updateTurretDirection(dir);
}

function handleKeyDown(keyCode) {
    if (keyCode == 65 || keyCode == 37) {
        updateTankDirection(Constants.KEY.LEFT);
    }
    else if (keyCode == 87 || keyCode == 38) {
        // UP does not have a server-side implementation yet
        // updateTankDirection(Constants.KEY.UP);
    }
    else if (keyCode == 68 || keyCode == 39) {
        updateTankDirection(Constants.KEY.RIGHT);
    }
    else if (keyCode == 83 || keyCode == 40) {
        // DOWN does not have a server-side implementation yet
        // updateTankDirection(Constants.KEY.DOWN);
    }
}

function startFiring(x,y) {
    if (intialToggle.checked) {
        updateFireToggle(true);
    }
}

function stopFiring(x,y) {
    if (intialToggle.checked) {
        updateFireToggle(false);
    }
}

function clickFire() {
    updateFireToggle(true);
    setTimeout(() => updateFireToggle(false), 100);
}

// used to start sending data to server
export function startCapturingInput() {
    window.addEventListener('mousemove', onMouseInput);
    window.addEventListener('click', onMouseInput);

    window.addEventListener('mousedown', startFiring);
    window.addEventListener('mouseup', stopFiring);

    // Add event listerner to start capturing input on keydown events
    window.addEventListener('keydown', onKeyDown);

    window.addEventListener('touchstart', onTouchInput, { passive: false });
    window.addEventListener('touchmove', onTouchInput, { passive: false });

    // Mobile controls logic
    const isTouchDevice = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    if (isTouchDevice) {
        // Joystick logic
        if (joystickContainer) {
            let joystickActive = false;
            let joystickCenterX = 0;

            const onJoystickTouchStart = e => {
                e.preventDefault();
                e.stopPropagation();
                const joystickRect = joystickContainer.getBoundingClientRect();
                joystickCenterX = joystickRect.left + joystickRect.width / 2;
                joystickActive = true;
            };

            const onJoystickTouchMove = e => {
                e.preventDefault();
                e.stopPropagation();
                if (!joystickActive) return;

                const touch = e.touches[0];
                if (!touch) return;
                const currentX = touch.clientX;

                const deltaX = currentX - joystickCenterX;

                const maxDist = joystickContainer.offsetWidth / 4;
                const clampedX = Math.max(-maxDist, Math.min(maxDist, deltaX));
                joystick.style.transform = `translateX(${clampedX}px)`;

                if (deltaX < -10) {
                    updateTankDirection(Constants.KEY.LEFT);
                } else if (deltaX > 10) {
                    updateTankDirection(Constants.KEY.RIGHT);
                } else {
                    updateTankDirection(null);
                }
            };

            const onJoystickTouchEnd = e => {
                e.preventDefault();
                e.stopPropagation();
                joystickActive = false;
                joystick.style.transform = 'translateX(0px)';
                updateTankDirection(null);
            };

            joystickContainer.addEventListener('touchstart', onJoystickTouchStart, { passive: false });
            joystickContainer.addEventListener('touchmove', onJoystickTouchMove, { passive: false });
            joystickContainer.addEventListener('touchend', onJoystickTouchEnd);
            joystickContainer.addEventListener('touchcancel', onJoystickTouchEnd);
        }

        // Fire Button Logic
        if (fireButton) {
            const onFireTouchStart = e => {
                e.preventDefault();
                e.stopPropagation();
                if (intialToggle.checked) { // "Click" mode = hold to fire
                    updateFireToggle(true);
                } else { // "Auto" mode = tap to fire
                    clickFire();
                }
            };

            const onFireTouchEnd = e => {
                e.preventDefault();
                e.stopPropagation();
                if (intialToggle.checked) { // "Click" mode
                    updateFireToggle(false);
                }
            };

            fireButton.addEventListener('touchstart', onFireTouchStart, { passive: false });
            fireButton.addEventListener('touchend', onFireTouchEnd);
            fireButton.addEventListener('touchcancel', onFireTouchEnd);
        }
    }
}

// stops sending data to server
export function stopCapturingInput() {
    window.removeEventListener('mousemove', onMouseInput);
    window.removeEventListener('click', onMouseInput);

    window.removeEventListener('mousedown', startFiring);
    window.removeEventListener('mouseup', stopFiring);

    // Stop event listerner to start capturing input on keydown events
    window.removeEventListener('keydown', onKeyDown);


    window.removeEventListener('touchstart', onTouchInput);
    window.removeEventListener('touchmove', onTouchInput);

    // Note: Joystick and fire button listeners are not removed here. They are tied
    // to the element and will be garbage collected if the element is removed.
    // For this app's lifecycle, this is acceptable.
}