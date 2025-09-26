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
    playFrequencies();
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

function playFrequencies() {
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
