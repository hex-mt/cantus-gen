#include <time.h>
#define MEANTONAL
#include "cantus.h"
#include "chunks.h"
#include "ctp.h"
#include "meantonal.h"
#include <emscripten/emscripten.h>

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
void generate_ctp(void) {
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

    bool first_chunk = true;
    for (chunk_node *cur = chunks; cur != NULL; cur = cur->next) {
        Interval this_int = cur->data.cons;
        Pitch this_note = transpose_real(mt_cantus[state.bar], this_int);

        if (bars_remaining(&state) == 1 && ctp_bad_penultima(&state, this_note))
            return;
        if (bars_remaining(&state) == 0) {
            if (is_tonic(this_note) && ctp_climax_good(&state)) {
                solutions++;
                for (int i = 0; i < BARS; i++) {
                    result_ctp[i] = mt_ctp[i];
                }
                result_ctp[state.bar] = this_note;
            }
            return;
        }

        v_ints[state.bar] = this_int;
        mt_ctp[state.bar] = this_note;

        next_chunk((CtpState){
            .bar = state.bar + 1,
        });
    }
}
