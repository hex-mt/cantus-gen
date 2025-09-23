import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import { Pitch, SPN, TonalContext, TuningMap } from "meantonal";
import createModule from "/src/cantus.js";

const randomiseButton = document.getElementById("randomise")!;
randomiseButton.addEventListener("click", (event) => {
    populateStaff();
});
let T = TuningMap.fromEDO(31);
let frequencies: number[];
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();
const playButton = document.getElementById("play")!;
let playing = false;
let activeOscillators: OscillatorNode[] = [];
playButton.addEventListener("click", async () => {
    if (playing) {
        stop();
    } else {
        await audioCtx.resume();
        playFrequencies(frequencies);
        playing = true;
    }
});

function stop() {
    // stop all currently active oscillators
    activeOscillators.forEach((osc) => {
        try {
            osc.stop();
        } catch { }
    });
    activeOscillators = [];
    playing = false;
}

async function populateStaff() {
    stop();
    const VerovioModule = await createVerovioModule();
    const verovio = new VerovioToolkit(VerovioModule);

    let mei = `<?xml version="1.0" encoding="UTF-8"?>
<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.1">
  <music>
    <body>
      <mdiv>
        <score>
          <scoreDef>
            <staffGrp>
              <staffDef n="1" lines="5" clef.shape="G" clef.line="2"/>
            </staffGrp>
          </scoreDef>
          <section>
            <measure n="1">
              <staff n="1">
                <layer n="1">`;

    const index = Math.floor(Math.random() * 6);
    const letter = "FCGDAEB"[index];
    const length = Math.floor(Math.random() * 8) + 9;

    let cantus = await generateCantus(letter, index, length);

    cantus.forEach((p) => {
        mei += `
<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1"/>`;
    });

    frequencies = cantus.map((p) => T.toHz(p));

    mei += `</layer>
              </staff>
            </measure>
          </section>
        </score>
      </mdiv>
    </body>
  </music>
</mei>`;
    verovio.setOptions({
        footer: "none",
        adjustPageWidth: true,
        adjustPageHeight: true,
        pageHeight: 100,
        scale: 50,
    });

    verovio.loadData(mei);
    const svg = verovio.renderToSVG(1, {});

    document.getElementById("notation")!.innerHTML = svg;
}

async function generateCantus(
    tonic: string,
    mode: number,
    length: number,
): Promise<Pitch[]> {
    // @ts-ignore
    const Module = await createModule();
    const generate_cantus = Module.cwrap("generate_cantus", null, [
        "number",
        "number",
    ]);
    const get_cantus_value = Module.cwrap("get_cantus_value", "number", [
        "number",
    ]);

    generate_cantus(mode, length);

    const values = Array.from({ length: 32 }, (_, i) => get_cantus_value(i));

    const reference = SPN.toPitch(tonic + "4");
    const ctx = new TonalContext(reference.chroma, mode);
    let result: Pitch[] = [];
    for (let i = 0; i < length; i++) {
        result.push(reference.transposeDiatonic(values[i], ctx));
    }
    return result;
}

populateStaff();

function playFrequencies(frequencies: number[]) {
    const duration = 0.5;

    let time = audioCtx.currentTime;

    activeOscillators = [];

    let noteObjects = document.querySelectorAll("g.note");
    noteObjects.forEach((note, i) => {
        setTimeout(
            () => (note.style.fill = "var(--color-orange-300)"),
            i * duration * 1000,
        );
        setTimeout(() => (note.style.fill = ""), (i + 1) * duration * 1000);
    });

    frequencies.forEach((freq, i) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        gain.gain.value = 0.05;
        osc.type = "sawtooth";
        osc.frequency.value = freq;
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        gain.gain.setValueAtTime(0.06, audioCtx.currentTime + i * duration);
        gain.gain.linearRampToValueAtTime(
            0.3,
            audioCtx.currentTime + i * duration + 0.01,
        );
        gain.gain.linearRampToValueAtTime(
            0.06,
            audioCtx.currentTime + (i + 1) * duration,
        );
        osc.start(time);
        osc.stop(time + duration);

        // remove oscillator from active list when it ends
        osc.onended = () => {
            activeOscillators = activeOscillators.filter((o) => o !== osc);
            if (activeOscillators.length === 0) {
                playing = false; // playback finished naturally
            }
        };

        activeOscillators.push(osc);
        time += duration;
    });
}
