import {
    handleDecrementMode,
    handleIncrementMode,
    handleDecrementLength,
    handleIncrementLength,
    toggleSolfa,
    showSection,
} from "./ts/state.js";
import { audio, handleClickPlay, handleClickPlayCompound, handleClickPlayCtp, handleClickPlayCtpBottom, handleClickPlayCtpTop, handleSetTuning } from "./ts/audio.js";
import { drawCantus, drawCtp } from "./ts/cantusScore.js";

// Cantus controls

document.getElementById("mode-increment")!.addEventListener("click", handleIncrementMode);
document.getElementById("mode-decrement")!.addEventListener("click", handleDecrementMode);

document.getElementById("len-increment")!.addEventListener("click", handleIncrementLength);
document.getElementById("len-decrement")!.addEventListener("click", handleDecrementLength);

document.getElementById("randomise")!.addEventListener("click", drawCantus)

document.getElementById("play")!.addEventListener("click", handleClickPlay);

document.getElementById("solfa")!.addEventListener("click", toggleSolfa);

// Counterpoint controls

document.getElementById("randomise-both")!.addEventListener("click", drawCantus)
document.getElementById("randomise-ctp")!.addEventListener("click", drawCtp);

document.getElementById("play-ctp-top")!.addEventListener("click", handleClickPlayCtpTop);
document.getElementById("play-ctp-bottom")!.addEventListener("click", handleClickPlayCtpBottom);
document.getElementById("play-ctp")!.addEventListener("click", handleClickPlayCtp);

// Compound controls

const playCompoundButton = document.getElementById("play-compound")!;
playCompoundButton.addEventListener("click", handleClickPlayCompound);

// Setting controls

[12, 19, 31, 50, 55].forEach(edo => {
    document.getElementById(`edo-${edo}`)?.addEventListener("click", () => {
        handleSetTuning(edo);
    })
})

const bpmValue = document.getElementById("bpm-label")! as HTMLSpanElement;
const bpmInput = document.getElementById("bpm-slider")! as HTMLInputElement;
bpmValue.textContent = bpmInput.value;
bpmInput.addEventListener("input", (event) => {
    audio.bpm = bpmValue.textContent = event.target!.value;
});

// Section switching controls

for (let i = 1; i <= 4; i++) {
    document.getElementById(`section-button-${i}`)?.addEventListener("click", () => {
        showSection(i);
    })
}

showSection(1);
handleSetTuning(31);
drawCantus();
