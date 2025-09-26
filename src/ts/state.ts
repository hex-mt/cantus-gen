import type { Pitch } from "meantonal";
import { drawCantus } from "./cantusScore.js";

export const state = {
  cantus: [] as Pitch[],
  ctp: [] as Pitch[],
  repositionedCantus: [] as Pitch[],
  mode: 6,
  length: 8,
  modeLabel: document.getElementById("mode-label")!,
  lenLabel: document.getElementById("len-label")!,
  solfa: false,
};

export function handleIncrementMode() {
  state.mode = (state.mode + 1) % 7;
  updateModeLabel();
}

export function handleDecrementMode() {
  state.mode = (state.mode + 6) % 7;
  updateModeLabel();
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
}

export function handleDecrementLength() {
  state.length = (state.length + 8) % 9;
  updateLenLabel();
}

function updateLenLabel() {
  state.lenLabel.innerHTML =
    state.length != 8 ? `${state.length + 9}` : "Random";
}

const hand = document.getElementById("hand");
const fist = document.getElementById("fist");

export function toggleSolfa() {
  state.solfa = !state.solfa;
  hand?.classList.toggle("hidden");
  fist?.classList.toggle("hidden");
  drawCantus();
}
