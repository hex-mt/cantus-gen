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
Pitch cantus_motions[32] = {0};
Pitch mt_ctp[32] = {0};
int ctp_success = false;

EMSCRIPTEN_KEEPALIVE
Pitch *get_ctp() { return mt_ctp; }

EMSCRIPTEN_KEEPALIVE
void generate_ctp(void) {
    generate_chunks();

    // cantus data init
    ctp_state c;
    TonalContext context = context_from_chroma(MODE - 1, MODE);
    Pitch tonic = pitch_from_chroma(MODE - 1, 4);

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
        c.ints[0] = firstInts[i];
        c.notes[0] = transpose_real(mt_cantus[0], c.ints[0]);
        next_chunk(&c, BARS - 1, BARS - 1);
    }
}

void next_chunk(ctp_state *c, int length, int left) {
    if (ctp_success)
        return;
    int index = length - left;
    if (left > 2) {
        chunk_node *chunks = get_chunks(c->ints[index], cantus_motions[index]);
        if (!chunks) {
            return;
        }
        for (chunk_node *cur = chunks; cur != NULL; cur = cur->next) {
            c->ints[index + 1] = cur->data.cons;
            c->notes[index + 1] =
                transpose_real(mt_cantus[index + 1], c->ints[index + 1]);
            c->motions[index] =
                interval_between(c->notes[index], c->notes[index + 1]);
            next_chunk(c, length, left - 1);
        }
    } else if (left == 2) {
        chunk_node *chunks = get_chunks(c->ints[index], cantus_motions[index]);
        if (!chunks) {
            return;
        }
        for (chunk_node *cur = chunks; cur != NULL; cur = cur->next) {
            if (intervals_equal(cur->data.cons, (Interval){4, 1}) ||   // M6
                intervals_equal(cur->data.cons, (Interval){-1, -1}) || // -m3
                intervals_equal(cur->data.cons, (Interval){-6, -3})) { // -m10
                c->ints[index + 1] = cur->data.cons;
                c->notes[index + 1] =
                    transpose_real(mt_cantus[index + 1], c->ints[index + 1]);
                c->motions[index] =
                    interval_between(c->notes[index], c->notes[index + 1]);
                if (check_adjacent(c, index))
                    return;
                next_chunk(c, length, left - 1);
            }
        }
        return;
    } else if (left == 1) {
        switch (stepspan(c->ints[index])) {
        case 5:
            c->ints[index + 1] = (Interval){5, 2};
            c->notes[index + 1] =
                transpose_real(mt_cantus[index + 1], (Interval){5, 2});
            break;
        case -2:
            c->ints[index + 1] = (Interval){0, 0};
            c->notes[index + 1] = mt_cantus[index + 1];
            break;
        case -9:
            c->ints[index + 1] = (Interval){-5, -2};
            c->notes[index + 1] =
                transpose_real(mt_cantus[index + 1], (Interval){-5, -2});
            break;
        }
        c->motions[index] = MODE == 5 ? (Interval){1, 0} : (Interval){0, 1};
        if (check_adjacent(c, index))
            return;
        next_chunk(c, length, left - 1);
    } else {
        ctp_success = true;
        for (int i = 0; i <= length; i++)
            mt_ctp[i] = c->notes[i];
    }
}

int check_adjacent(ctp_state *c, int index) {
    // handle consecutive leaps
    if (!index) {
        c->leaps[0] = 0;
        c->steps[0] = 0;
    }
    if (abs(stepspan(c->motions[index])) > 1)
        if (!index) {
            c->leaps[0]++;
        } else
            c->leaps[index] = c->leaps[index - 1] + 1;
    else
        c->leaps[index] = 0;
    if (c->leaps[index] == 2 &&
            // only allow consecutive leaps in the same direction if arpeggios
            // or subdividing leaps.
            (same_sign(stepspan(c->motions[index]),
                       stepspan(c->motions[index - 1])) &&
             !((abs(stepspan(c->motions[index])) == 2 &&
                abs(stepspan(c->motions[index - 1])) == 2) ||
               (abs(stepspan(c->motions[index])) == 2 &&
                abs(stepspan(c->motions[index - 1])) == 3) ||
               (abs(stepspan(c->motions[index])) == 3 &&
                abs(stepspan(c->motions[index - 1])) == 2) ||
               (abs(stepspan(c->motions[index])) == 4 &&
                abs(stepspan(c->motions[index - 1])) == 3) ||
               (abs(stepspan(c->motions[index])) == 3 &&
                abs(stepspan(c->motions[index - 1])) == 4))) ||
        // only allow consecutive leaps in opposite directions if at least one
        // of them is small.
        (same_sign(stepspan(c->motions[index]),
                   stepspan(c->motions[index - 1])) &&
         !(abs(stepspan(c->motions[index])) == 2 ||
           abs(stepspan(c->motions[index - 1])) == 2 ||
           abs(stepspan(c->motions[index])) == 3 ||
           abs(stepspan(c->motions[index - 1])) == 3))) {
        return 1;
    }
    // no more than 2 consecutive leaps, period.
    if (c->leaps[index] > 2)
        return 1;
    if (index >= 2 &&
        same_sign(stepspan(c->motions[index]),
                  stepspan(c->motions[index - 1])) &&
        abs(stepspan(c->motions[index - 1])) > 1 &&
        abs(stepspan(c->motions[index - 2])) > 1)
        return 1;

    // handle consecutive unisons
    if (index > 1 && stepspan(c->motions[index]) == 0 &&
        stepspan(c->motions[index - 1]) == 0)
        return 1;

    // handle consecutive imperfects
    if (index > 2 && intervals_equal(c->ints[index], c->ints[index - 1]) &&
        stepspan(c->ints[index - 1]) == stepspan(c->ints[index - 2]) &&
        stepspan(c->ints[index - 2]) == stepspan(c->ints[index - 3]) &&
        (abs(stepspan(c->ints[index])) == 2 ||
         abs(stepspan(c->ints[index])) == 5 ||
         abs(stepspan(c->ints[index])) == 9))
        return 1;

    // handle consecutive steps
    if (abs(stepspan(c->motions[index])) == 1)
        if (!index) {
            c->steps[0] = 1;
        } else
            c->steps[index] = c->steps[index - 1] + 1;
    else
        c->steps[index] = 0;
    if (c->steps[index] > STEP_LIMIT)
        return 1;

    // no more than 2 unisons max.
    int unisons = 0;
    for (int i = 0; i <= index; i++) {
        if (stepspan(c->motions[i]) == 0)
            unisons++;
    }
    if (unisons > 2)
        return 1;

    // no more than two perfects in a row
    if (index >= 2 &&
        (abs(stepspan(c->ints[index])) % 7 == 0 ||
         abs(stepspan(c->ints[index])) % 7 == 4) &&
        (abs(stepspan(c->ints[index - 1])) % 7 == 0 ||
         abs(stepspan(c->ints[index - 1])) % 7 == 4) &&
        (abs(stepspan(c->ints[index - 2])) % 7 == 0 ||
         abs(stepspan(c->ints[index - 2])) % 7 == 4))
        return 1;

    return 0;
}
