import { connect, play } from "./networking";
import {
  startRendering,
  startRenderingWithDoubleBuffering,
  stopRendering,
} from "./render";
import { startCapturingInput, stopCapturingInput } from "./input";
import { downloadAssets } from "./assets";
import { initState } from "./state";
import { loadAudio, playSound, SOUNDS } from "./audio";
import {
  startRenderingLeaderboard,
  stopRenderingLeaderboard,
} from "./leaderboard";
import { startRenderingMap, stopRenderingMap } from "./map";
import { initChooseTankController, getTankStyle } from "./playMenu";
import { initNotifications, clearAllNotifications } from "./notifications";

import "bootstrap/dist/css/bootstrap.min.css";
import "../css/main.css";

/* Use to toggle double buffering off while debugging but should be ON in PROD */
const ENABLE_DOUBLE_BUFFERING = true;

const playMenu = document.getElementById("play-menu");
const playButton = document.getElementById("play-button");
const usernameInput = document.getElementById("username-input");
const notificationContainer = document.getElementById("notification-container");
export const intialToggle = document.getElementById("togBtn"); // true is auto(on), false is click(off)

Promise.all([connect(onGameOver), downloadAssets()])
  .then(() => {
    loadAudio(); // Initialize audio system
    initNotifications(); // Initialize notification system
    playMenu.classList.remove("hidden");
    initChooseTankController();
    usernameInput.focus();
    playButton.onclick = () => {
      // start playing...
      play(usernameInput.value, getTankStyle(), intialToggle.checked);
      playMenu.classList.add("hidden");
      notificationContainer.classList.remove("hidden");
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
  // Stop input immediately to prevent player actions
  stopCapturingInput();

  // Play death sound effect
  playSound(SOUNDS.DEATH, 0.5);

  // Wait for explosion animation to complete before showing menu
  // Explosion has 8 frames at ~1/15 seconds each (~533ms total)
  // Adding buffer time to ensure full animation completion
  setTimeout(() => {
    stopRendering();
    stopRenderingLeaderboard();
    stopRenderingMap();
    notificationContainer.classList.add("hidden");
    clearAllNotifications();
    playMenu.classList.remove("hidden");
  }, 650); // 650ms delay for explosion animation
}
