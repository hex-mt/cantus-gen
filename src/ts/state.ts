import type { Pitch } from "meantonal";
import { drawCantus } from "./cantusScore.js";

export const state = {
    cantus: [] as Pitch[],
    ctp: [] as Pitch[],
    repositionedCantus: [] as Pitch[],
    upperVoice: [] as Pitch[],
    lowerVoice: [] as Pitch[],
    compound: [] as Pitch[],
    mode: 6,
    length: 8,
    modeLabel: document.getElementById("mode-label")!,
    lenLabel: document.getElementById("len-label")!,
    solfa: false,
    currentSection: 2,
};

export function handleIncrementMode() {
    state.mode = (state.mode + 6) % 7;
    updateModeLabel();
    drawCantus();
}

export function handleDecrementMode() {
    state.mode = (state.mode + 1) % 7;
    updateModeLabel();
    drawCantus();
}

const modes = [
    "Lydian",
    "Ionian",
    "Mixolydian",
    "Dorian",
    "Aeolian",
    "Phrygian",
    "Random",
];

function updateModeLabel() {
    state.modeLabel.innerHTML = modes[state.mode];
}

export function handleIncrementLength() {
    state.length = (state.length + 1) % 9;
    updateLenLabel();
    drawCantus();
}

export function handleDecrementLength() {
    state.length = (state.length + 8) % 9;
    updateLenLabel();
    drawCantus();
}

function updateLenLabel() {
    state.lenLabel.innerHTML =
        state.length != 8 ? `${state.length + 9}` : "Random";
}

const hand = document.getElementById("hand");
const fist = document.getElementById("fist");

export function toggleSolfa() {
    state.solfa = !state.solfa;
    if (state.solfa)
        document.documentElement.style.setProperty("--box-visibility", "visible");
    else
        document.documentElement.style.setProperty("--box-visibility", "hidden");
    hand?.classList.toggle("hidden");
    fist?.classList.toggle("hidden");
}

export function showSection(next: number) {
    if (next === state.currentSection) return;

    const currEl = document.getElementById(`section-${state.currentSection}`)!;
    const nextEl = document.getElementById(`section-${next}`)!;
    const forward = next > state.currentSection;

    const currButton = document.getElementById(`section-button-${state.currentSection}`)!;
    const nextButton = document.getElementById(`section-button-${next}`)!;
    currButton.classList.remove("section-button-active");
    nextButton.classList.add("section-button-active");

    // Remove active from current
    currEl.classList.remove("section-active");
    currEl.classList.add(forward ? "to-left" : "to-right");

    // Prep next off-screen without animating
    nextEl.classList.remove("to-left", "to-right", "section-active");
    nextEl.classList.add(forward ? "from-right" : "from-left");

    // Force reflow to apply staging styles
    void nextEl.offsetWidth;

    // Now animate in
    nextEl.classList.remove("from-right", "from-left");
    nextEl.classList.add("section-active");

    state.currentSection = next;
}
