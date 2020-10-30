import { updateTurretDirection, updateTankDirection, updateFireToggle } from './networking';
import {intialToggle} from './index';
const Constants = require('../../shared/constants');

// NEW INPUT CONFIG:
// Mouse pointer indicates the direction of the turret
// A/D/<-/-> keys can change the direction of the tank
// the tank always goes ahead

function onMouseInput(e) {
    handleMouseInput(e.clientX, e.clientY);
}

// for touchscreen devices - not yet supported
function onTouchInput(e) {
    const touch = e.touches[0];
    handleMouseInput(touch.clientX, touch.clientY);
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
        updateTankDirection(Constants.KEY.UP);
    }
    else if (keyCode == 68 || keyCode == 39) {
        updateTankDirection(Constants.KEY.RIGHT);
    }
    else if (keyCode == 83 || keyCode == 40) {
        updateTankDirection(Constants.KEY.DOWN);
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
// used to start sending data to server
export function startCapturingInput() {
    window.addEventListener('mousemove', onMouseInput);
    window.addEventListener('click', onMouseInput);

    window.addEventListener('mousedown', startFiring);
    window.addEventListener('mouseup', stopFiring);

    // Add event listerner to start capturing input on keydown events
    window.addEventListener('keydown', onKeyDown);

    window.addEventListener('touchstart', onTouchInput);
    window.addEventListener('touchmove', onTouchInput);
}

// stops sending data to server
export function stopCapturingInput() {
    window.removeEventListener('mousemove', onMouseInput);
    window.removeEventListener('click', onMouseInput);

    // Stop event listerner to start capturing input on keydown events
    window.removeEventListener('keydown', onKeyDown);

    window.removeEventListener('touchstart', onTouchInput);
    window.removeEventListener('touchmove', onTouchInput);

    window.removeEventListener('mousedown', startFiring);
    window.removeEventListener('mouseup', stopFiring);

}