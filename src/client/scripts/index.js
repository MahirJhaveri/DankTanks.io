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
import { initChooseTankController, getTankStyle, getThemeChoice } from "./playMenu";
import { initNotifications, clearAllNotifications } from "./notifications";
import { init as initCommandCenter, show as showCommandCenter, hide as hideCommandCenter } from "./commandCenterBg";

const Theme = require('../../shared/theme');
const { setTheme } = Theme;

import "bootstrap/dist/css/bootstrap.min.css";
import "../css/main.css";

/* Use to toggle double buffering off while debugging but should be ON in PROD */
const ENABLE_DOUBLE_BUFFERING = true;

const playMenu = document.getElementById("play-menu");
const playButton = document.getElementById("play-button");
const usernameInput = document.getElementById("username-input");
const notificationContainer = document.getElementById("notification-container");
export const intialToggle = document.getElementById("togBtn"); // true is auto(on), false is manual(off)

Promise.all([connect(onGameOver), downloadAssets()])
  .then(() => {
    loadAudio(); // Initialize audio system
    initNotifications(); // Initialize notification system
    initCommandCenter(); // Initialize command center background
    playMenu.classList.remove("hidden");
    showCommandCenter(); // Show tactical background
    initChooseTankController();
    usernameInput.focus();

    // Add typing sound to username input
    usernameInput.addEventListener('keydown', () => {
      playSound(SOUNDS.TYPING, 0.08);
    });

    // Add toggle sound to fire mode switch
    intialToggle.addEventListener('change', () => {
      playSound(SOUNDS.SWITCH_TOGGLE, 0.2);
    });

    playButton.onclick = () => {
      playSound(SOUNDS.BUTTON_CLICK, 0.2);
      // start playing...
      // Ensure the selected theme is applied
      setTheme(getThemeChoice());
      play(usernameInput.value, getTankStyle(), intialToggle.checked);
      playMenu.classList.add("hidden");
      hideCommandCenter(); // Hide tactical background
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
  stopCapturingInput();
  stopRendering();
  stopRenderingLeaderboard();
  stopRenderingMap();
  notificationContainer.classList.add("hidden");
  clearAllNotifications();
  playMenu.classList.remove("hidden");
  showCommandCenter(); // Show tactical background again
}
