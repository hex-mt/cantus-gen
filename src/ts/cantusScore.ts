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

export async function drawCantus(newCantus: boolean = false) {
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

  if (newCantus) {
    actualMode = state.mode != 6 ? state.mode : Math.floor(Math.random() * 6);
    tonicLetter = "FCGDAEB"[actualMode];
    actualLength =
      state.length != 8 ? state.length + 9 : Math.floor(Math.random() * 8) + 9;

    state.cantus = await generateCantus();
  }

  state.repositionedCantus =
    state.cantus.filter((x) => SPN.toPitch("A3").stepsTo(x) < 0).length == 0
      ? state.cantus
      : state.cantus.map((x) => x.transposeReal(new Interval(5, 2)));

  const solfa = getSolfa(state.cantus);

  state.repositionedCantus.forEach((p, i) => {
    mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1">`;
    if (state.solfa) mei += `<verse><syl>${solfa[i]}</syl></verse>`;
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
  Module = await createModule();
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
  const ptr = Module._get_ctp(); // pointer to ctp array

  const size = actualLength;
  const pitches = [];

  // int32 view into WASM memory
  const mem = Module.HEAP32 || Module.asm.HEAP32;

  for (let i = 0; i < size; i++) {
    const base = (ptr >> 2) + i * 2; // >>2 since HEAP32 indexes by 4 bytes
    const w = mem[base];
    const h = mem[base + 1];
    pitches.push(new Pitch(w, h));
  }

  return pitches;
}

export async function drawCtp(newCtp: boolean = false) {
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
            <staffGrp symbol="bracket">
              <staffDef n="1" lines="5" clef.shape="G" clef.line="2" />
              <staffDef n="2" lines="5" clef.shape="G" clef.line="2" />
            </staffGrp>
          </scoreDef>
          <section>
            <pb xml:id="jytxbtq" />
            <measure n="1">
              <staff n="1">
                <layer n="1">`;

  state.ctp = await generateCtp();

  const solfa = getSolfa(state.ctp);

  state.ctp.forEach((p, i) => {
    mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1">`;
    if (p.accidental !== 0)
      mei += `<accid accid="${p.accidental === 1 ? "s" : "f"}" />`;
    mei += `</note>`;
  });

  mei += `</layer>
              </staff>
              <staff n="2">
                <layer n="1">`;

  state.cantus.forEach((p, i) => {
    mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1"/>`;
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
}
