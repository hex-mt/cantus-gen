import createVerovioModule from 'verovio/wasm';
import { VerovioToolkit } from 'verovio/esm';

createVerovioModule().then(VerovioModule => {
    const verovio = new VerovioToolkit(VerovioModule);

    const mei = `<?xml version="1.0" encoding="UTF-8"?>
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
                <layer n="1">
                  <note pname="c" oct="4" dur="4"/>
                  <note pname="d" oct="4" dur="4"/>
                  <note pname="e" oct="4" dur="4"/>
                  <note pname="f" oct="4" dur="4"/>
                  <note pname="f" oct="4" dur="4"/>
                </layer>
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
        scale: 50
    });

    console.log("Verovio options:", verovio.getOptions());
    // for the default values
    console.log("Verovio options:", verovio.getDefaultOptions());


    verovio.loadData(mei);
    const svg = verovio.renderToSVG(1, {});

    document.getElementById("notation")!.innerHTML += svg;
    document.getElementById("notation")!.innerHTML += svg;
});


import createModule from "../public/cantus.js";
import { Pitch, SPN, TonalContext } from 'meantonal';

async function generateCantus(tonic: string, mode: number, length: number) {
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
    let result: (Pitch)[] = [];
    for (let i = 0; i < length; i++) {
        result.push(reference.transposeDiatonic(values[i], ctx));
    }
    console.log("Cantus:", values);
}
