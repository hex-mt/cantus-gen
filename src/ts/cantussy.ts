import { Pitch, SPN, TonalContext } from "meantonal";
import { state } from "./state.js";

export class Cantussy {
    private module: any;
    private generate_cantus: (mode: number, length: number) => void;
    private get_cantus_value: (index: number) => number;
    private generate_ctp: () => void;
    private get_solutions: () => number;
    constructor(module: any) {
        this.module = module;

        this.generate_cantus = this.module.cwrap("generate_cantus", null, [
            "number",
            "number",
        ]);

        this.get_cantus_value = this.module.cwrap("get_cantus_value", "number", [
            "number",
        ]);

        this.generate_ctp = this.module.cwrap("generate_ctp", null, []);

        this.get_solutions = this.module.cwrap("get_solutions", "number", []);
    }
    generateCantus() {
        this.generate_cantus(state.actualMode, state.actualLength);

        const values = Array.from({ length: 32 }, (_, i) =>
            this.get_cantus_value(i),
        );

        const reference = SPN.toPitch(state.tonicLetter + "4");
        const ctx = new TonalContext(reference.chroma, state.actualMode);
        let result: Pitch[] = [];
        for (let i = 0; i < state.actualLength; i++) {
            result.push(reference.transposeDiatonic(values[i], ctx));
        }
        return result;
    }

    generateCtp() {
        this.generate_ctp();

        const ptr = this.module._get_ctp();

        const size = state.actualLength;
        const pitches = [];

        // int32 view into WASM memory
        const mem = this.module.HEAP32 || this.module.asm.HEAP32;

        for (let i = 0; i < size; i++) {
            const base = (ptr >> 2) + i * 2;
            const w = mem[base];
            const h = mem[base + 1];
            pitches.push(new Pitch(w, h));
        }

        return pitches;
    }

    get solutions() {
        return this.get_solutions();
    }
}
