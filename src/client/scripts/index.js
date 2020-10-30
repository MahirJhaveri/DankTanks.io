import { connect, play } from "./networking";
import {
  startRendering,
  startRenderingWithDoubleBuffering,
  stopRendering,
} from "./render";
import { startCapturingInput, stopCapturingInput } from "./input";
import { downloadAssets } from "./assets";
import { initState } from "./state";
import {
  startRenderingLeaderboard,
  stopRenderingLeaderboard,
} from "./leaderboard";
import { startRenderingMap, stopRenderingMap } from "./map";
import { initChooseTankController, getTankStyle } from "./playMenu";

import "bootstrap/dist/css/bootstrap.min.css";
import "../css/main.css";

/* Use to toggle double buffering off while debugging but should be ON in PROD */
const ENABLE_DOUBLE_BUFFERING = true;

const playMenu = document.getElementById("play-menu");
const playButton = document.getElementById("play-button");
const usernameInput = document.getElementById("username-input");
export const intialToggle = document.getElementById("togBtn"); // true is auto(on), false is click(off)

Promise.all([connect(onGameOver), downloadAssets()])
  .then(() => {
    playMenu.classList.remove("hidden");
    initChooseTankController();
    usernameInput.focus();
    playButton.onclick = () => {
      // start playing...
      play(usernameInput.value, getTankStyle(), intialToggle.checked);
      playMenu.classList.add("hidden");
      initState();
      startCapturingInput();
      ENABLE_DOUBLE_BUFFERING
        ? startRenderingWithDoubleBuffering()
        : startRendering();
      startRenderingLeaderboard();
      startRenderingMap();
    };
  })
  .catch((error) => console.log(error));

function onGameOver() {
  stopCapturingInput();
  stopRendering();
  stopRenderingLeaderboard();
  stopRenderingMap();
  playMenu.classList.remove("hidden");
}
