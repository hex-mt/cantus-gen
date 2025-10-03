import { Interval, LilyPond, Pitch } from "meantonal";
import { drawCantus } from "./scoreCantus.js";
import { VerovioToolkit } from "verovio/esm";
import { Cantussy } from "./cantussy.js";

export const state = {
    cantus: [] as Pitch[],
    cantusString: "",
    customCantus: false,
    ctp: [] as Pitch[],
    repositionedCantus: [] as Pitch[],
    upperVoice: [] as Pitch[],
    lowerVoice: [] as Pitch[],
    compound: [] as Pitch[],
    compoundAdjusted: [] as Pitch[],
    mode: 6,
    length: 8,
    modeLabel: document.getElementById("mode-label")!,
    lenLabel: document.getElementById("len-label")!,
    solutionsLabel: document.getElementById("solutions-label")!,
    cantusInput: document.getElementById("cantus-string")! as HTMLInputElement,
    solfa: false,
    edit: false,
    currentSection: 2,
    verovio: undefined as unknown as VerovioToolkit,
    cantussy: undefined as unknown as Cantussy,
    actualMode: 0,
    tonicLetter: "",
    actualLength: 0,
};

export function handleIncrementMode() {
    state.customCantus = false;
    state.mode = (state.mode + 6) % 7;
    updateModeLabel();
    drawCantus();
}

export function handleDecrementMode() {
    state.customCantus = false;
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
    state.customCantus = false;
    state.length = (state.length + 1) % 9;
    updateLenLabel();
    drawCantus();
}

export function handleDecrementLength() {
    state.customCantus = false;
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
    else document.documentElement.style.setProperty("--box-visibility", "hidden");
    hand?.classList.toggle("hidden");
    fist?.classList.toggle("hidden");
}

export function toggleEdit() {
    if (state.edit) state.edit = false;
    else state.edit = true

    document.getElementById("cantus")?.classList.toggle("hidden")
    document.getElementById("edit-input")?.classList.toggle("hidden")
    state.cantusInput.focus();
}

export function confirmEdit() {
    state.customCantus = true;
    state.cantusString =
        state.cantusInput.value;
    state.cantus = cantusFromString();
    state.actualMode = state.cantus[0].chroma + 1;
    state.actualLength = state.cantus.length;
    state.tonicLetter = "FCGDAE"[state.actualMode];
    state.cantussy.updateCantus();
    drawCantus();
    toggleEdit();
}

function cantusFromString() {
    const pitchStrings = state.cantusString.split(" ");
    let pitches = pitchStrings.map(s => LilyPond.toPitch(s));

    pitches[0] = Pitch.fromChroma(pitches[0].chroma, 4);
    for (let i = 1; i < pitches.length; i++) {
        let p = Pitch.fromChroma(pitches[i].chroma, 0);
        let steps = Math.abs(p.stepsTo(pitches[i - 1]))
        while (steps > 3) {
            p = p.transposeReal(new Interval(5, 2));
            steps = Math.abs(p.stepsTo(pitches[i - 1]))
        }
        const raise = pitchStrings[i].split("").filter(x => x === "'").length
        p = p.transposeReal(new Interval(5 * raise, 2 * raise));
        const lower = pitchStrings[i].split("").filter(x => x === ",").length
        p = p.transposeReal(new Interval(-5 * lower, -2 * lower));
        pitches[i] = p;
    }

    return pitches;
}

export function showSection(next: number) {
    if (next === state.currentSection) return;

    const currEl = document.getElementById(`section-${state.currentSection}`)!;
    const nextEl = document.getElementById(`section-${next}`)!;
    const forward = next > state.currentSection;

    const currButton = document.getElementById(
        `section-button-${state.currentSection}`,
    )!;
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

export function updateTheme() {
    document.documentElement.classList.toggle(
        "dark",
        localStorage.theme === "dark" ||
        (!("theme" in localStorage) &&
            window.matchMedia("(prefers-color-scheme: dark)").matches),
    );
}
