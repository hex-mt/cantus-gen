import {
    handleDecrementMode,
    handleIncrementMode,
    handleDecrementLength,
    handleIncrementLength,
    toggleSolfa,
} from "./ts/state.js";
import { handleClickPlay, handleClickPlayCtp, handleClickPlayCtpBottom, handleClickPlayCtpTop } from "./ts/audio.js";
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
randomiseButton.addEventListener("click", drawCantus)

const playButton = document.getElementById("play")!;
playButton.addEventListener("click", handleClickPlay);

const solfaButton = document.getElementById("solfa");
solfaButton?.addEventListener("click", toggleSolfa);

const randomiseBothButton = document.getElementById("randomise-both")!;
randomiseBothButton.addEventListener("click", drawCantus)

const randomiseCtpButton = document.getElementById("randomise-ctp")!;
randomiseCtpButton.addEventListener("click", drawCtp);

const playCtpTopButton = document.getElementById("play-ctp-top")!;
playCtpTopButton.addEventListener("click", handleClickPlayCtpTop);

const playCtpBottomButton = document.getElementById("play-ctp-bottom")!;
playCtpBottomButton.addEventListener("click", handleClickPlayCtpBottom);

const playCtpButton = document.getElementById("play-ctp")!;
playCtpButton.addEventListener("click", handleClickPlayCtp);

drawCantus();
