import {
    state,
    handleDecrementMode,
    handleIncrementMode,
    handleDecrementLength,
    handleIncrementLength,
    toggleSolfa,
    showSection,
} from "./ts/state.js";
import { audio, setTuning, setWaveform, playCantus, playCompound, playCtp, playCtpBottom, playCtpTop } from "./ts/audio.js";
import { drawCantus } from "./ts/cantusScore.js";
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import { drawCtp } from "./ts/speciesScore.js";

// Cantus controls

document.getElementById("mode-increment")!.addEventListener("click", handleIncrementMode);
document.getElementById("mode-decrement")!.addEventListener("click", handleDecrementMode);

document.getElementById("length-increment")!.addEventListener("click", handleIncrementLength);
document.getElementById("length-decrement")!.addEventListener("click", handleDecrementLength);

document.getElementById("randomise-cantus")!.addEventListener("click", drawCantus)

document.getElementById("play-cantus")!.addEventListener("click", playCantus);

document.getElementById("solfa")!.addEventListener("click", toggleSolfa);

// Counterpoint controls

document.getElementById("randomise-both")!.addEventListener("click", drawCantus)
document.getElementById("randomise-ctp")!.addEventListener("click", drawCtp);

document.getElementById("play-ctp-top")!.addEventListener("click", playCtpTop);
document.getElementById("play-ctp-bottom")!.addEventListener("click", playCtpBottom);
document.getElementById("play-ctp")!.addEventListener("click", playCtp);

// Compound controls

const playCompoundButton = document.getElementById("play-compound")!;
playCompoundButton.addEventListener("click", playCompound);

// Setting controls

[12, 19, 31, 50, 55].forEach(edo => {
    document.getElementById(`edo-${edo}`)?.addEventListener("click", () => {
        setTuning(edo);
    })
})

const bpmValue = document.getElementById("bpm-label")! as HTMLSpanElement;
document.getElementById("bpm-slider")!.addEventListener("input", (event) => {
    audio.bpm = bpmValue.textContent = (event.target as HTMLInputElement).value;
});

["triangle", "sawtooth", "square"].forEach(waveform => {
    document.getElementById(waveform)?.addEventListener("click", () => {
        setWaveform(waveform as OscillatorType);
    })
})

// Section switching controls

for (let i = 1; i <= 4; i++) {
    document.getElementById(`section-button-${i}`)?.addEventListener("click", () => {
        showSection(i);
    })
}

// State initialisation

const VerovioModule = await createVerovioModule();
state.verovio = new VerovioToolkit(VerovioModule);

showSection(1);
setTuning(31);
setWaveform("triangle");
drawCantus();
