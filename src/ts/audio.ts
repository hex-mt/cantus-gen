import { TuningMap } from "meantonal";
import { state } from "./state.js";

type AudioState = {
  freq: TuningMap;
  ctx: AudioContext | undefined;
  playing: boolean;
  activeOscillators: OscillatorNode[];
  activeLitNotes: number[];
  stop: () => void;
};

export const audio: AudioState = {
  freq: TuningMap.fromEDO(31),
  ctx: undefined,
  playing: false,
  activeOscillators: [],
  activeLitNotes: [],
  stop() {
    audio.activeOscillators.forEach((osc) => {
      try {
        osc.stop();
      } catch {}
    });
    audio.activeLitNotes.forEach((timer) => {
      try {
        clearTimeout(timer);
      } catch {}
    });
    audio.activeOscillators = [];
    audio.playing = false;
  },
};

export async function handleClickPlay() {
  if (audio.ctx === undefined) initialiseAudio();
  if (audio.playing) {
    audio.stop();
  } else {
    await audio.ctx!.resume();
    playCantus();
    audio.playing = true;
  }
}

export async function handleClickPlayCtp() {
  if (audio.ctx === undefined) initialiseAudio();
  if (audio.playing) {
    audio.stop();
  } else {
    await audio.ctx!.resume();
    playCtp();
    audio.playing = true;
  }
}

let gain: GainNode;
let convolver: ConvolverNode;
let dryGain: GainNode;
let wetGain: GainNode;

function initialiseAudio() {
  audio.ctx = new window.AudioContext();
  gain = audio.ctx.createGain();
  gain.gain.value = 0.05;

  function createImpulseResponse(duration = 2, decay = 2) {
    const sampleRate = audio.ctx!.sampleRate;
    const length = sampleRate * duration;
    const impulse = audio.ctx!.createBuffer(2, length, sampleRate);
    for (let c = 0; c < 2; c++) {
      const channel = impulse.getChannelData(c);
      for (let i = 0; i < length; i++) {
        channel[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay); // exponential decay
      }
    }
    return impulse;
  }

  convolver = audio.ctx.createConvolver();
  convolver.buffer = createImpulseResponse(2, 3);

  dryGain = audio.ctx.createGain();
  wetGain = audio.ctx.createGain();

  // set wet/dry balance
  dryGain.gain.value = 0.6; // mostly dry
  wetGain.gain.value = 0.9; // some reverb

  gain.connect(dryGain);
  dryGain.connect(audio.ctx.destination);

  gain.connect(convolver);
  convolver.connect(wetGain);
  wetGain.connect(audio.ctx.destination);
}

function playCantus() {
  let frequencies = state.repositionedCantus.map((p) => audio.freq.toHz(p));
  const duration = 0.5;

  let time = audio.ctx!.currentTime;

  audio.activeOscillators = [];

  let noteObjects = document.querySelectorAll(
    "#cantus g.note",
  ) as NodeListOf<SVGGElement>;
  noteObjects.forEach((note, i) => {
    audio.activeLitNotes.push(
      setTimeout(
        () => (note.style.fill = "var(--color-orange-300)"),
        i * duration * 1000,
      ),
    );
    setTimeout(() => (note.style.fill = ""), (i + 1) * duration * 1000);
  });

  frequencies.forEach((freq, i) => {
    let osc = audio.ctx!.createOscillator();
    osc.type = "triangle";
    osc.connect(gain);
    osc.frequency.value = freq;

    gain.gain.setValueAtTime(0.06, audio.ctx!.currentTime + i * duration);
    gain.gain.linearRampToValueAtTime(
      0.3,
      audio.ctx!.currentTime + i * duration + 0.01,
    );
    gain.gain.linearRampToValueAtTime(
      0.06,
      audio.ctx!.currentTime + (i + 1) * duration,
    );
    osc.start(time);
    osc.stop(time + duration);

    // remove oscillator from active list when it ends
    osc.onended = () => {
      audio.activeOscillators = audio.activeOscillators.filter(
        (o) => o !== osc,
      );
      if (audio.activeOscillators.length === 0) {
        audio.playing = false; // playback finished naturally
      }
    };

    audio.activeOscillators.push(osc);
    time += duration;
  });
}

function playCtp() {
  let frequenciesUpper = state.upperVoice.map((p) => audio.freq.toHz(p));
  let frequenciesLower = state.lowerVoice.map((p) => audio.freq.toHz(p));
  const duration = 0.5;

  let time = audio.ctx!.currentTime;

  audio.activeOscillators = [];

  let noteObjects = document.querySelectorAll(
    "#cantus g.note",
  ) as NodeListOf<SVGGElement>;

  const layers = document.querySelectorAll("#ctp g.layer");

  const noteLists = Array.from(layers).map((layer) =>
    layer.querySelectorAll("g.note"),
  ) as Array<NodeListOf<SVGGElement>>;

  noteLists[0].forEach((note, i) => {
    audio.activeLitNotes.push(
      setTimeout(
        () => (note.style.fill = "var(--color-orange-300)"),
        i * duration * 1000,
      ),
    );
    audio.activeLitNotes.push(
      setTimeout(
        () => (noteLists[1][i].style.fill = "var(--color-orange-300)"),
        i * duration * 1000,
      ),
    );
    setTimeout(() => (note.style.fill = ""), (i + 1) * duration * 1000);
    setTimeout(
      () => (noteLists[1][i].style.fill = ""),
      (i + 1) * duration * 1000,
    );
  });

  scheduleFrequencies(audio, frequenciesLower, time, duration);
  scheduleFrequencies(audio, frequenciesUpper, time, duration);
}

function scheduleFrequencies(
  audio: AudioState, // your audio state object
  frequencies: number[], // array of freqs
  baseTime: number, // absolute start time
  duration: number, // duration per note
) {
  frequencies.forEach((freq, i) => {
    const osc = audio.ctx!.createOscillator();
    osc.type = "triangle";
    osc.frequency.value = freq;

    const gain = audio.ctx!.createGain();
    osc.connect(gain);
    gain.connect(audio.ctx!.destination);

    gain.gain.setValueAtTime(0.06, baseTime + i * duration);
    gain.gain.linearRampToValueAtTime(0.3, baseTime + i * duration + 0.01);
    gain.gain.linearRampToValueAtTime(0.06, baseTime + (i + 1) * duration);

    osc.start(baseTime + i * duration);
    osc.stop(baseTime + (i + 1) * duration);

    // remove oscillator from active list when it ends
    osc.onended = () => {
      audio.activeOscillators = audio.activeOscillators.filter(
        (o) => o !== osc,
      );
      if (audio.activeOscillators.length === 0) {
        audio.playing = false; // playback finished naturally
      }
    };

    audio.activeOscillators.push(osc);
  });
}
