import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import { Interval, Pitch, SPN, TonalContext } from "meantonal";
import createModule from "/src/cantus.js";
import { state } from "./state.js";
import { audio } from "./audio.js";

const VerovioModule = await createVerovioModule();
const verovio = new VerovioToolkit(VerovioModule);

let Module: any;
let actualMode: number = 0;
let tonicLetter: string = "";
let actualLength: number = 0;

export async function drawCantus() {
    Module = await createModule();
    audio.stop();

    let mei = `<?xml version="1.0" encoding="UTF-8"?>
<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.1">
  <meiHead>
    <fileDesc>
      <titleStmt>
        <title></title>
      </titleStmt>
      <pubStmt/>
    </fileDesc>
  </meiHead>
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

    actualMode = state.mode != 6 ? state.mode : Math.floor(Math.random() * 6);
    tonicLetter = "FCGDAEB"[actualMode];
    actualLength =
        state.length != 8 ? state.length + 9 : Math.floor(Math.random() * 8) + 9;

    state.cantus = await generateCantus();

    state.repositionedCantus =
        state.cantus.filter((x) => SPN.toPitch("A3").stepsTo(x) < 0).length == 0
            ? state.cantus
            : state.cantus.map((x) => x.transposeReal(new Interval(5, 2)));

    const solfa = getSolfa(state.cantus);

    state.repositionedCantus.forEach((p, i) => {
        mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1">`;
        mei += `<verse><syl>${solfa[i]}</syl></verse>`;
        mei += `</note>`;
    });

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
        lyricTopMinMargin: 7.0,
        pageHeight: 120,
        scale: 50,
    });

    verovio.loadData(mei);
    const svg = verovio.renderToSVG(1);

    document.getElementById("cantus")!.innerHTML = svg;

    drawCtp();
}

async function generateCantus(): Promise<Pitch[]> {
    // @ts-ignore
    const generate_cantus = Module.cwrap("generate_cantus", null, [
        "number",
        "number",
    ]);
    const get_cantus_value = Module.cwrap("get_cantus_value", "number", [
        "number",
    ]);

    generate_cantus(actualMode, actualLength);

    const values = Array.from({ length: 32 }, (_, i) => get_cantus_value(i));

    const reference = SPN.toPitch(tonicLetter + "4");
    const ctx = new TonalContext(reference.chroma, actualMode);
    let result: Pitch[] = [];
    for (let i = 0; i < actualLength; i++) {
        result.push(reference.transposeDiatonic(values[i], ctx));
    }
    return result;
}

function getSolfa(cantus: Pitch[]) {
    let chromas = cantus.map((x) => x.chroma + 1);
    let current = 0;
    let first = chromas.findIndex((x) => x == 0 || x == 6);
    if (first !== -1) current = chromas[first];
    else current == 0;
    let result = [];
    for (const chroma of chromas) {
        if (Math.abs(chroma - current) === 6) current = chroma;
        let offset = current ? 1 : 0;
        result.push(["fa", "ut", "sol", "re", "la", "mi"][chroma - offset]);
    }

    return result;
}

async function generateCtp() {
    const generate_ctp = Module.cwrap("generate_ctp", null, []);

    await generate_ctp();

    const pitches = readCtpArray();

    return pitches;
}

function readCtpArray() {
    const ptr = Module._get_ctp();

    const size = actualLength;
    const pitches = [];

    // int32 view into WASM memory
    const mem = Module.HEAP32 || Module.asm.HEAP32;

    for (let i = 0; i < size; i++) {
        const base = (ptr >> 2) + i * 2;
        const w = mem[base];
        const h = mem[base + 1];
        pitches.push(new Pitch(w, h));
    }

    return pitches;
}

function topNote(arr: Pitch[]): Pitch {
    return arr.reduce((a, c) => {
        return a.stepsTo(c) < 0 ? a : c;
    });
}

function bottomNote(arr: Pitch[]): Pitch {
    return arr.reduce((a, c) => {
        return c.stepsTo(a) < 0 ? a : c;
    });
}

export async function drawCtp() {
    audio.stop();

    state.ctp = await generateCtp();

    if (state.ctp[0].isEqual(new Pitch(0, 0))) {
        document.getElementById("ctp")!.innerHTML =
            `<div class="p-6 my-18 border-orange-100 border-2 text-orange-100 text-xl">No solutions found :(</div>`;
        return;
    }

    let mei = `<?xml version="1.0" encoding="UTF-8"?>
<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.1">
  <meiHead>
    <fileDesc>
      <titleStmt>
        <title></title>
      </titleStmt>
      <pubStmt/>
    </fileDesc>
  </meiHead>
  <music>
    <body>
      <mdiv>
        <score>
          <scoreDef>`;

    const cantusOnTop = topNote(state.cantus).stepsTo(topNote(state.ctp)) < 0;

    state.upperVoice = cantusOnTop ? state.cantus.slice() : state.ctp.slice();
    state.lowerVoice = !cantusOnTop ? state.cantus.slice() : state.ctp.slice();

    if (bottomNote(state.upperVoice).stepsTo(new Pitch(24, 9)) > 0) {
        state.upperVoice = state.upperVoice.map((p) =>
            p.transposeReal(new Interval(5, 2)),
        );
        state.lowerVoice = state.lowerVoice.map((p) =>
            p.transposeReal(new Interval(5, 2)),
        );
    }

    let lowerClef;

    if (bottomNote(state.lowerVoice).stepsTo(new Pitch(24, 9)) > 0)
        lowerClef = `<staffDef n="2" lines="5" clef.shape="G" clef.line="2" clef.dis="8" clef.dis.place="below" />`;
    else lowerClef = `<staffDef n="2" lines="5" clef.shape="G" clef.line="2" />`;

    mei += `<staffGrp symbol="bracket">
              <staffDef n="1" lines="5" clef.shape="G" clef.line="2" />
              ${lowerClef}
            </staffGrp>
          </scoreDef>
          <section>
            <pb xml:id="jytxbtq" />
            <measure n="1">
              <staff n="1">
                <layer n="1">`;

    state.upperVoice.forEach((p) => {
        mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1">`;
        if (p.accidental !== 0)
            mei += `<accid accid="${p.accidental === 1 ? "s" : "f"}" />`;
        mei += `</note>`;
    });

    mei += `</layer>
              </staff>
              <staff n="2">
                <layer n="1">`;

    state.lowerVoice.forEach((p) => {
        mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1">`;
        if (p.accidental !== 0)
            mei += `<accid accid="${p.accidental === 1 ? "s" : "f"}" />`;
        mei += `</note>`;
    });

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
        pageHeight: 120,
        scale: 50,
    });

    verovio.loadData(mei);
    const svg = verovio.renderToSVG(1);

    document.getElementById("ctp")!.innerHTML = svg;

    drawCompound();
}

function unfoldCtp() {
    return state.lowerVoice.flatMap((val, i) => [val, state.upperVoice[i], val]);
}

export async function drawCompound() {
    audio.stop();

    if (state.ctp[0].isEqual(new Pitch(0, 0))) {
        document.getElementById("ctp")!.innerHTML =
            `<div class="p-6 my-18 border-orange-100 border-2 text-orange-100 text-xl">No solutions found :(</div>`;
        return;
    }

    state.compound = unfoldCtp();
    // for (let i = 0; i < state.compound.length; i++) {
    //     if (i % 4 === 2) {
    //         [state.compound[i], state.compound[i + 1]] = [state.compound[i + 1], state.compound[i]];
    //     }
    // }

    let mei = `<?xml version="1.0" encoding="UTF-8"?>
<mei xmlns="http://www.music-encoding.org/ns/mei" meiversion="5.1">
  <meiHead>
    <fileDesc>
      <titleStmt>
        <title></title>
      </titleStmt>
      <pubStmt/>
    </fileDesc>
  </meiHead>
  <music>
    <body>
      <mdiv>
        <score>
          <scoreDef>
            <staffGrp symbol="bracket">
              <staffDef n="1" lines="5" clef.shape="G" clef.line="2" />
            </staffGrp>
          </scoreDef>
          <section>
            <pb xml:id="jytxbtq" />
            <measure n="1">
              <staff n="1">
                <layer n="1">`;

    state.compound.forEach((p, i) => {
        if (i % 3 === 0) mei += `<beam>`
        mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="8">`;
        if (p.accidental !== 0)
            mei += `<accid accid="${p.accidental === 1 ? "s" : "f"}" />`;
        mei += `</note>`;
        if (i % 3 === 2) mei += `</beam>`
    });

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
        pageHeight: 120,
        scale: 50,
    });

    verovio.loadData(mei);
    const svg = verovio.renderToSVG(1);

    document.getElementById("compound")!.innerHTML = svg;
}

