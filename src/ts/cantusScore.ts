
import createVerovioModule from "verovio/wasm";
import { VerovioToolkit } from "verovio/esm";
import { Interval, Pitch, SPN, TonalContext } from "meantonal";
import createModule from "/src/cantus.js";
import { state } from "./state.js";
import { audio } from "./audio.js";
export async function drawStaff(newCantus: boolean = false) {
    audio.stop();
    const VerovioModule = await createVerovioModule();
    const verovio = new VerovioToolkit(VerovioModule);

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

    const randomMode = Math.floor(Math.random() * 6);
    const letter = "FCGDAEB"[state.mode != 6 ? state.mode : randomMode];
    const randomLength = Math.floor(Math.random() * 8) + 9;

    if (newCantus)
        state.cantus = await generateCantus(
            letter,
            state.mode != 6 ? state.mode : randomMode,
            state.length != 8 ? state.length + 9 : randomLength,
        );

    const solfa = getSolfa(state.cantus);

    state.cantus.forEach((p, i) => {
        mei += `<note pname="${p.letter.toLowerCase()}" oct="${p.octave}" dur="1">`;
        if (state.solfa)
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
    return result.filter(x => SPN.toPitch("A3").stepsTo(x) < 0).length == 0 ? result : result.map(x => x.transposeReal(new Interval(5, 2)));
}

function getSolfa(cantus: Pitch[]) {
    let chromas = cantus.map(x => x.chroma + 1);
    let current = 0;
    let first = chromas.findIndex(x => x == 0 || x == 6);
    if (first !== -1)
        current = chromas[first];
    else current == 0;
    let result = [];
    for (const chroma of chromas) {
        if (Math.abs(chroma - current) === 6) current = chroma;
        let offset = current ? 1 : 0;
        result.push(["fa", "ut", "sol", "re", "la", "mi"][chroma - offset])
    }

    return result;
}
