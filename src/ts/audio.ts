import { Interval, Pitch, TuningMap } from "meantonal";
import { state } from "./state.js";
import { drawCompound } from "./scoreCompound.js";

type AudioState = {
    freq: TuningMap;
    currentEDO: number;
    bpm: string;
    waveform: OscillatorType;
    ctx?: AudioContext;
    volume?: GainNode;
    reverb?: ConvolverNode;
    dryGain?: GainNode;
    wetGain?: GainNode;
    playing: boolean;
    activeOscillators: OscillatorNode[];
    activeLitNotes: number[];
    stop: () => void;
};

export const audio: AudioState = {
    freq: TuningMap.fromEDO(31),
    currentEDO: 31,
    bpm: "100",
    waveform: "triangle",
    playing: false,
    activeOscillators: [],
    activeLitNotes: [],
    stop() {
        audio.activeOscillators.forEach((osc) => {
            try {
                osc.stop();
            } catch { }
        });
        audio.activeLitNotes.forEach((timer) => {
            try {
                clearTimeout(timer);
            } catch { }
        });
        audio.activeOscillators = [];
        audio.playing = false;
    },
};

function initialiseAudio() {
    audio.ctx = new window.AudioContext();
    audio.volume = audio.ctx.createGain();
    audio.volume.gain.value = 1;

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

    audio.reverb = audio.ctx.createConvolver();
    audio.reverb.buffer = createImpulseResponse(2, 3);

    audio.dryGain = audio.ctx.createGain();
    audio.wetGain = audio.ctx.createGain();

    audio.dryGain.gain.value = 0.6; // mostly dry
    audio.wetGain.gain.value = 0.9; // some reverb

    audio.volume.connect(audio.dryGain);
    audio.dryGain.connect(audio.ctx.destination);

    audio.volume.connect(audio.reverb);
    audio.reverb.connect(audio.wetGain);
    audio.wetGain.connect(audio.ctx.destination);
}

async function readyPlayback() {
    if (audio.ctx === undefined) initialiseAudio();
    if (audio.playing) {
        audio.stop();
    } else {
        await audio.ctx!.resume();
        audio.playing = true;
        audio.activeOscillators = [];
    }
}

function mapCantus53() {
    return state.repositionedCantus.map((p, i) => {
        if (p.chroma >= 2 && p.chroma < 7)
            return p.transposeReal(new Interval(-1, 2));
        else if (p.chroma >= 7) return p.transposeReal(new Interval(-2, 4));
        return p;
    });
}

export async function playCantus() {
    await readyPlayback();
    if (audio.playing) {
        let time = audio.ctx!.currentTime;

        let noteObjects = document.querySelectorAll(
            "#cantus g.note",
        ) as NodeListOf<SVGGElement>;

        let cantus = state.repositionedCantus;
        if (audio.currentEDO == 53) {
            cantus = mapCantus53();
        }

        scheduleFrequencies(cantus, noteObjects, time, 1);
    }
}

export function mapUpper53() {
    return state.upperVoice.map((p, i) => {
        const otherNote = state.lowerVoice[i].chroma;
        if (
            (p.chroma === 6 &&
                (otherNote === 5 || otherNote === 3 || otherNote === 2)) ||
            (p.chroma === 5 && otherNote === 6)
        )
            return p.transposeReal(new Interval(-2, 4));
        if (
            (p.chroma === 2 &&
                (otherNote === 6 || otherNote === 3 || otherNote === -1)) ||
            (p.chroma >= 3 && p.chroma < 7)
        )
            return p.transposeReal(new Interval(-1, 2));
        else if (p.chroma >= 7) return p.transposeReal(new Interval(-2, 4));
        return p;
    });
}

export async function playCtpTop() {
    await readyPlayback();
    if (audio.playing) {
        let time = audio.ctx!.currentTime;

        const layers = document.querySelectorAll("#ctp g.layer");

        const noteLists = Array.from(layers).map((layer) =>
            layer.querySelectorAll("g.note"),
        ) as Array<NodeListOf<SVGGElement>>;

        let upperVoice = state.upperVoice;
        if (audio.currentEDO == 53) {
            upperVoice = mapUpper53();
        }

        scheduleFrequencies(upperVoice, noteLists[0], time, 1, 0.66);
    }
}

export function mapLower53() {
    return state.lowerVoice.map((p, i) => {
        const otherNote = state.upperVoice[i].chroma;
        if (
            (p.chroma === 6 &&
                (otherNote === 5 || otherNote === 3 || otherNote === 2)) ||
            (p.chroma === 5 && otherNote === 6)
        )
            return p.transposeReal(new Interval(-2, 4));
        if (
            (p.chroma === 2 &&
                (otherNote === 6 || otherNote === 3 || otherNote === -1)) ||
            (p.chroma >= 3 && p.chroma < 7)
        )
            return p.transposeReal(new Interval(-1, 2));
        else if (p.chroma >= 7) return p.transposeReal(new Interval(-2, 4));
        return p;
    });
}

export async function playCtpBottom() {
    await readyPlayback();
    if (audio.playing) {
        let time = audio.ctx!.currentTime;

        const layers = document.querySelectorAll("#ctp g.layer");

        const noteLists = Array.from(layers).map((layer) =>
            layer.querySelectorAll("g.note"),
        ) as Array<NodeListOf<SVGGElement>>;

        let lowerVoice = state.lowerVoice;
        if (audio.currentEDO == 53) {
            lowerVoice = mapLower53();
        }

        scheduleFrequencies(lowerVoice, noteLists[1], time, 1, 0.66);
    }
}

export async function playCtp() {
    await readyPlayback();
    if (audio.playing) {
        let time = audio.ctx!.currentTime;

        const layers = document.querySelectorAll("#ctp g.layer");
        const noteLists = Array.from(layers).map((layer) =>
            layer.querySelectorAll("g.note"),
        ) as Array<NodeListOf<SVGGElement>>;

        let upperVoice = state.upperVoice;
        let lowerVoice = state.lowerVoice;
        if (audio.currentEDO == 53) {
            upperVoice = mapUpper53();
            lowerVoice = mapLower53();
        }

        scheduleFrequencies(upperVoice, noteLists[0], time, 1, -0.66);
        scheduleFrequencies(lowerVoice, noteLists[1], time, 1, 0.66);
    }
}

export async function playCompound() {
    await readyPlayback();
    if (audio.playing) {
        let time = audio.ctx!.currentTime;

        let noteObjects = document.querySelectorAll(
            "#compound g.note",
        ) as NodeListOf<SVGGElement>;

        scheduleFrequencies(state.compoundAdjusted, noteObjects, time, 1 / 3);
    }
}

function scheduleFrequencies(
    pitches: Pitch[],
    noteObjects: NodeListOf<SVGGElement>,
    baseTime: number,
    noteLength: number,
    pan: number = 0,
) {
    const duration = (noteLength * 60) / (audio.bpm as unknown as number);

    noteObjects.forEach((note, i) => {
        audio.activeLitNotes.push(
            setTimeout(
                () => (note.style.fill = "var(--color-orange-300)"),
                i * duration * 1000,
            ),
        );
        setTimeout(() => (note.style.fill = ""), (i + 1) * duration * 1000);
    });

    const frequencies = pitches.map((p) => audio.freq.toHz(p));
    frequencies.forEach((freq, i) => {
        const osc = audio.ctx!.createOscillator();
        osc.type = audio.waveform;
        osc.frequency.value = freq;

        // per-note nodes
        const noteGain = audio.ctx!.createGain();
        const panner = audio.ctx!.createStereoPanner();

        // set pan
        panner.pan.setValueAtTime(pan, baseTime);

        // connect chain: osc → noteGain → panner → global gain
        osc.connect(noteGain);
        noteGain.connect(panner);
        panner.connect(audio.volume!); // "gain" is the one from initialiseAudio

        // envelope
        noteGain.gain.setValueAtTime(0.06, baseTime + i * duration);
        noteGain.gain.linearRampToValueAtTime(0.3, baseTime + i * duration + 0.01);
        noteGain.gain.linearRampToValueAtTime(0.06, baseTime + (i + 1) * duration);

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

function setTuningMap(edo: number) {
    audio.freq = TuningMap.fromEDO(edo);
    audio.currentEDO = edo;
    drawCompound();
}

export function setTuning(edo: number) {
    document
        .querySelectorAll("#edo-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document.getElementById(`edo-${edo}`)?.classList.add("section-button-active");
    setTuningMap(edo);
}

export function setWaveform(waveform: OscillatorType) {
    document
        .querySelectorAll("#waveform-buttons button")
        .forEach((x) => x?.classList.remove("section-button-active"));
    document.getElementById(waveform)?.classList.add("section-button-active");
    audio.waveform = waveform;
}
