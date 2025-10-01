#define MEANTONAL
#include "ctp.h"
#include "cantus.h"
#include "chunks.h"
#include "meantonal.h"
#include <emscripten/emscripten.h>
#include <stdio.h>

Interval firstInts[] = {(Interval){5, 2}, (Interval){3, 1}, (Interval){0, 0},
                        (Interval){-5, -2}};
extern int cantus[32];
Pitch mt_cantus[32] = {0};
Interval cantus_motions[32] = {0};
Pitch mt_ctp[32] = {0};
Interval ctp_motions[32] = {0};
Interval v_ints[32] = {0};
TonalContext context;
Pitch tonic;

Pitch result_ctp[32] = {0};
int solutions = 0;

EMSCRIPTEN_KEEPALIVE
Pitch *get_ctp() { return result_ctp; }

EMSCRIPTEN_KEEPALIVE
int get_solutions() { return solutions; }

EMSCRIPTEN_KEEPALIVE
void generate_ctp(void) {
    solutions = 0;
    for (int i = 0; i < BARS; i++) {
        result_ctp[i] = (Pitch){0, 0};
        mt_ctp[i] = (Pitch){0, 0};
        v_ints[i] = (Interval){0, 0};
    }
    generate_chunks();

    // cantus data init
    context = context_from_chroma(MODE - 1, MODE);
    tonic = pitch_from_chroma(MODE - 1, 4);

    for (int i = 0; i < BARS; i++) {
        mt_cantus[i] = transpose_diatonic(tonic, cantus[i], context);
    }

    for (int i = 0; i + 1 < BARS; i++) {
        cantus_motions[i] = interval_between(mt_cantus[i], mt_cantus[i + 1]);
    }

    // shuffle the firstInts array
    for (int i = 0; i < 4; i++) {
        int s = rand() % (4 - i) + i;
        Interval temp = firstInts[i];
        firstInts[i] = firstInts[s];
        firstInts[s] = temp;
    }

    for (int i = 0; i < 4; i++) {
        v_ints[0] = firstInts[i];
        mt_ctp[0] = transpose_real(mt_cantus[0], v_ints[0]);
        next_chunk((CtpState){
            .bar = 1,
            .top = mt_ctp[0],
            .bottom = mt_ctp[0],
        });
    }
}

void next_chunk(CtpState state) {
    chunk_node *chunks =
        get_chunks(v_ints[state.bar - 1], cantus_motions[state.bar - 1]);
    if (!chunks) {
        return;
    }

    chunk_node buf[MAX_CHUNKS];
    chunk_node *cloned_chunks = clone_list_into(chunks, buf);

    bool first_chunk = true;
    for (chunk_node *cur = cloned_chunks; cur != NULL; cur = cur->next) {
        Interval this_int = cur->data.cons;
        Pitch this_note = transpose_real(mt_cantus[state.bar], this_int);
        Pitch prev_note = mt_ctp[state.bar - 1];
        v_ints[state.bar] = this_int;
        mt_ctp[state.bar] = this_note;

        if (chromatic_outside_cadence(&state, this_note))
            continue;

        if (bars_remaining(&state) == 1 && ctp_bad_penultima(&state, this_note))
            continue;
        ;

        if (bars_remaining(&state) == 0) {
            if (!first_chunk)
                return;
            first_chunk = false;
            if (ctp_climax_good(&state)) {
                solutions++;
                for (int i = 0; i < state.bar; i++) {
                    result_ctp[i] = mt_ctp[i];
                }
                result_ctp[state.bar] =
                    transpose_diatonic(result_ctp[state.bar - 1], 1, context);
            }
            return;
        }

        next_chunk((CtpState){
            .bar = state.bar + 1,
        });
    }
}
