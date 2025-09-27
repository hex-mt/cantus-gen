import {
  handleDecrementMode,
  handleIncrementMode,
  handleDecrementLength,
  handleIncrementLength,
  toggleSolfa,
} from "./ts/state.js";
import { handleClickPlay, handleClickPlayCtp } from "./ts/audio.js";
import { drawCantus, drawCtp } from "./ts/cantusScore.js";

const modeInc = document.getElementById("mode-increment")!;
modeInc.addEventListener("click", handleIncrementMode);
const modeDec = document.getElementById("mode-decrement")!;
modeDec.addEventListener("click", handleDecrementMode);

const lenInc = document.getElementById("len-increment")!;
lenInc.addEventListener("click", handleIncrementLength);
const lenDec = document.getElementById("len-decrement")!;
lenDec.addEventListener("click", handleDecrementLength);

const randomiseButton = document.getElementById("randomise")!;
randomiseButton.addEventListener("click", () => {
  drawCantus(true);
});

const playButton = document.getElementById("play")!;
playButton.addEventListener("click", handleClickPlay);

const solfaButton = document.getElementById("solfa");
solfaButton?.addEventListener("click", toggleSolfa);

const randomiseCtpButton = document.getElementById("randomise-ctp")!;
randomiseCtpButton.addEventListener("click", () => {
  drawCtp();
});

const playCtpButton = document.getElementById("play-ctp")!;
playCtpButton.addEventListener("click", handleClickPlayCtp);

drawCantus(true);
