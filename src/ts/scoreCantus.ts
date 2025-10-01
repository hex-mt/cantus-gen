import { Interval, Pitch, SPN } from "meantonal";
import { state } from "./state.js";
import { audio } from "./audio.js";
import { drawCtp } from "./scoreSpecies.js";

export async function drawCantus() {
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

  state.actualMode =
    state.mode != 6 ? state.mode : Math.floor(Math.random() * 6);
  state.tonicLetter = "FCGDAEB"[state.actualMode];
  state.actualLength =
    state.length != 8 ? state.length + 9 : Math.floor(Math.random() * 8) + 9;

  state.cantus = state.cantussy.generateCantus();

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
  state.verovio.setOptions({
    footer: "none",
    adjustPageWidth: true,
    adjustPageHeight: true,
    lyricTopMinMargin: 7.0,
    pageHeight: 120,
    scale: 50,
  });

  state.verovio.loadData(mei);
  const svg = state.verovio.renderToSVG(1);

  document.getElementById("cantus")!.innerHTML = svg;

  drawCtp();
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
