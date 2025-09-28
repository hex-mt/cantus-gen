import {
    handleDecrementMode,
    handleIncrementMode,
    handleDecrementLength,
    handleIncrementLength,
    toggleSolfa,
    showSection,
} from "./ts/state.js";
import { handleClickPlay, handleClickPlayCompound, handleClickPlayCtp, handleClickPlayCtpBottom, handleClickPlayCtpTop, handleSetTuning } from "./ts/audio.js";
import { drawCantus, drawCtp } from "./ts/cantusScore.js";

// Cantus controls

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

// Counterpoint controls

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

// Compound controls

const playCompoundButton = document.getElementById("play-compound")!;
playCompoundButton.addEventListener("click", handleClickPlayCompound);

// Setting controls

[12, 17, 19, 22, 31, 50, 55].forEach(edo => {
    document.getElementById(`edo-${edo}`)?.addEventListener("click", () => {
        handleSetTuning(edo);
    })
})

// Section switching controls

for (let i = 1; i <= 4; i++) {
    document.getElementById(`section-button-${i}`)?.addEventListener("click", () => {
        showSection(i);
    })
}

showSection(1);
handleSetTuning(31);
drawCantus();
