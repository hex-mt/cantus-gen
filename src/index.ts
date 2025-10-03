import {
    state,
    handleDecrementMode,
    handleIncrementMode,
    handleDecrementLength,
    handleIncrementLength,
    toggleSolfa,
    toggleEdit,
    confirmEdit,
    showSection,
    updateTheme,
} from "./ts/state.js";
import {
    audio,
    setTuning,
    setWaveform,
    playCantus,
    playCompound,
    playCtp,
    playCtpBottom,
    playCtpTop,
} from "./ts/audio.js";
import createCantussyModule from "/src/cantus.js";
import { drawCantus } from "./ts/scoreCantus.js";
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import { drawCtp } from "./ts/scoreSpecies.js";
import { Cantussy } from "./ts/cantussy.js";

// Cantus controls

document
    .getElementById("mode-increment")!
    .addEventListener("click", handleIncrementMode);
document
    .getElementById("mode-decrement")!
    .addEventListener("click", handleDecrementMode);

document
    .getElementById("length-increment")!
    .addEventListener("click", handleIncrementLength);
document
    .getElementById("length-decrement")!
    .addEventListener("click", handleDecrementLength);

document
    .getElementById("randomise-cantus")!
    .addEventListener("click", () => drawCantus());

document.getElementById("play-cantus")!.addEventListener("click", playCantus);

document.getElementById("solfa")!.addEventListener("click", toggleSolfa);

document.getElementById("edit")!.addEventListener("click", toggleEdit);
document.getElementById("cancel-edit")!.addEventListener("click", toggleEdit);
document.getElementById("confirm-edit")!.addEventListener("click", confirmEdit);

// Counterpoint controls

document
    .getElementById("randomise-both")!
    .addEventListener("click", () => drawCantus());
document.getElementById("randomise-ctp")!.addEventListener("click", drawCtp);

document.getElementById("play-ctp-top")!.addEventListener("click", playCtpTop);
document
    .getElementById("play-ctp-bottom")!
    .addEventListener("click", playCtpBottom);
document.getElementById("play-ctp")!.addEventListener("click", playCtp);

// Compound controls

const playCompoundButton = document.getElementById("play-compound")!;
playCompoundButton.addEventListener("click", playCompound);

// Setting controls

[12, 19, 31, 50, 53, 55].forEach((edo) => {
    document.getElementById(`edo-${edo}`)?.addEventListener("click", () => {
        setTuning(edo);
    });
});

const bpmValue = document.getElementById("bpm-label")! as HTMLSpanElement;
document.getElementById("bpm-slider")!.addEventListener("input", (event) => {
    audio.bpm = bpmValue.textContent = (event.target as HTMLInputElement).value;
});

["triangle", "sawtooth", "square"].forEach((waveform) => {
    document.getElementById(waveform)?.addEventListener("click", () => {
        setWaveform(waveform as OscillatorType);
    });
});

document.getElementById("light-mode")?.addEventListener("click", () => {
    document
        .querySelectorAll("#theme-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document.getElementById("light-mode")?.classList.add("section-button-active");
    localStorage.theme = "light";
    updateTheme();
})

document.getElementById("dark-mode")?.addEventListener("click", () => {
    document
        .querySelectorAll("#theme-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document.getElementById("dark-mode")?.classList.add("section-button-active");
    localStorage.theme = "dark";
    updateTheme();
})

document.getElementById("system-mode")?.addEventListener("click", () => {
    document
        .querySelectorAll("#theme-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document.getElementById("system-mode")?.classList.add("section-button-active");
    localStorage.removeItem("theme");
    updateTheme();
})

// Section switching controls

for (let i = 1; i <= 4; i++) {
    document
        .getElementById(`section-button-${i}`)
        ?.addEventListener("click", () => {
            showSection(i);
        });
}

// State initialisation

const CantussyModule = await createCantussyModule();
state.cantussy = new Cantussy(CantussyModule);
const VerovioModule = await createVerovioModule();
state.verovio = new VerovioToolkit(VerovioModule);

showSection(1);
showSection(1);
setWaveform("triangle");
drawCantus();
setTuning(31);

if (localStorage.theme === "light") {
    document
        .querySelectorAll("#theme-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document
        .getElementById("light-mode")
        ?.classList.add("section-button-active");
} else if (localStorage.theme === "dark") {
    document
        .querySelectorAll("#theme-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document
        .getElementById("dark-mode")
        ?.classList.add("section-button-active");
} else {
    document
        .querySelectorAll("#theme-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document
        .getElementById("system-mode")
        ?.classList.add("section-button-active");
}
