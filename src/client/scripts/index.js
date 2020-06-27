import { connect, play } from './networking';
import { startRendering, stopRendering } from './render';
import { startCapturingInput, stopCapturingInput } from './input';
import { downloadAssets } from './assets';
import { initState } from './state';
import { startRenderingLeaderboard, stopRenderingLeaderboard } from './leaderboard';
import { startRenderingMap, stopRenderingMap } from './map';
import { initChooseTankController, getTankStyle } from './chooseTankController';

import 'bootstrap/dist/css/bootstrap.min.css';
import '../css/main.css';


const playMenu = document.getElementById('play-menu');
const playButton = document.getElementById('play-button');
const usernameInput = document.getElementById('username-input');

Promise.all([
    connect(onGameOver),
    downloadAssets(),
]).then(() => {
    playMenu.classList.remove('hidden');
    initChooseTankController();
    usernameInput.focus();
    playButton.onclick = () => {
        // start playing...
        play(usernameInput.value, getTankStyle());
        playMenu.classList.add('hidden');
        initState();
        startCapturingInput();
        startRendering();
        startRenderingLeaderboard();
        startRenderingMap();
    };
}).catch((error) => console.log(error));

function onGameOver() {
    stopCapturingInput();
    stopRendering();
    stopRenderingLeaderboard();
    stopRenderingMap();
    playMenu.classList.remove('hidden');
}