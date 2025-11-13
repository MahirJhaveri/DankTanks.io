import { connect, play } from "./networking";
import { startCapturingInput, stopCapturingInput } from "./input";
import { initState } from "./state";
import { loadAudio } from "./audio";
import {
  startRenderingLeaderboard,
  stopRenderingLeaderboard,
} from "./leaderboard";
import { startRenderingMap, stopRenderingMap } from "./map";
import { initChooseTankController, getTankStyle } from "./playMenu";
import { game, startGame, showMenu } from "./game";
import { downloadAssets } from "./assets";

import "bootstrap/dist/css/bootstrap.min.css";
import "../css/main.css";

const playMenu = document.getElementById("play-menu");
const playButton = document.getElementById("play-button");
const usernameInput = document.getElementById("username-input");
export const intialToggle = document.getElementById("togBtn"); // true is auto(on), false is click(off)

// Wait for both network connection and assets (for tank selection menu)
Promise.all([connect(onGameOver), downloadAssets()]).then(() => {
  loadAudio(); // Initialize audio system
  playMenu.classList.remove("hidden");
  initChooseTankController();
  usernameInput.focus();

  playButton.onclick = () => {
    // start playing...
    play(usernameInput.value, getTankStyle(), intialToggle.checked);
    playMenu.classList.add("hidden");
    initState();
    startCapturingInput();
    startGame(); // Switch to GameScene
    startRenderingLeaderboard();
    startRenderingMap();
  };
}).catch((error) => console.log(error));

function onGameOver() {
  stopCapturingInput();
  stopRenderingLeaderboard();
  stopRenderingMap();
  showMenu(); // Switch back to MenuScene
  playMenu.classList.remove("hidden");
}
