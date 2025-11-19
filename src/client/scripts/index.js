import { connect, play } from "./networking";
import {
  startRendering,
  startRenderingWithDoubleBuffering,
  stopRendering,
} from "./render";
import { startCapturingInput, stopCapturingInput } from "./input";
import { downloadAssets } from "./assets";
import { initState } from "./state";
import { loadAudio } from "./audio";
import {
  startRenderingLeaderboard,
  stopRenderingLeaderboard,
} from "./leaderboard";
import { startRenderingMap, stopRenderingMap } from "./map";
import { initChooseTankController, getTankStyle, getThemeChoice } from "./playMenu";
import { initNotifications, clearAllNotifications } from "./notifications";

const Theme = require('../../shared/theme');
const { setTheme } = Theme;

const menuBackground = require('./menuBackground');

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
    playMenu.classList.remove("hidden");
    initChooseTankController();

    // Initialize menu background
    const menuBackgroundCanvas = document.getElementById("menu-background-canvas");
    menuBackground.init(menuBackgroundCanvas);

    usernameInput.focus();
    playButton.onclick = () => {
      // start playing...
      // Ensure the selected theme is applied
      setTheme(getThemeChoice());
      play(usernameInput.value, getTankStyle(), intialToggle.checked);
      playMenu.classList.add("hidden");
      notificationContainer.classList.remove("hidden");

      // Stop menu background animation
      menuBackground.stop();

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

  // Restart menu background animation
  const menuBackgroundCanvas = document.getElementById("menu-background-canvas");
  menuBackground.init(menuBackgroundCanvas);
}
