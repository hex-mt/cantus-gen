#ifndef CANTUS
#define CANTUS

#include <stdlib.h>
#include <string.h>

#define MEANTONAL
#include "meantonal.h"

#define BARS 13
#define MODE DORIAN
#define FA ((3 * MODE) % 7)
#define MI ((3 + 3 * MODE) % 7)

#define max(x, y) (((x) >= (y)) ? (x) : (y))
#define min(x, y) (((x) <= (y)) ? (x) : (y))

extern int cantus[BARS];
extern int notes[17];
extern bool success;

typedef struct {
    int top;
    int bottom;
    int bar;
    bool repeated_climax;
    bool disconnected_climax;
    int leaps_total; // leaps larger than a 2nd
    int leaps_large; // leaps larger than a 4th
    int leaps_in_row;
    int prev_motion;
    int prev_turn;
    int since_turn;
} State;

void try_note(State range);

static inline bool cantus_complete(State *state) {
    return state->bar == BARS - 1;
}

static inline bool bad_climax(int climax) {
    return climax == 6 && (MODE == MAJOR || MODE == LYDIAN);
}

static inline bool climax_good(State *state) {
    return !state->repeated_climax && !bad_climax(state->top) &&
           !state->disconnected_climax;
}

static void print_cantus(void) {
    Pitch tonic, note_to_print;
    pitch_from_spn("D4", &tonic);
    TonalContext ctx = context_from_pitch(tonic, MODE);

    // printf("!lp simple \\fixed c { ");
    for (int i = 0; i < BARS; i++) {
        note_to_print = transpose_diatonic(tonic, cantus[i], ctx);
        char buf[8];
        pitch_lily(note_to_print, buf);
        // printf("%s%s ", buf, i == 0 ? "4" : "");
        printf("%d ", cantus[i]);
    }
    // printf("}\n");
    printf("\n");
}

static inline int create_range(const State *s, int *out) {
    int top = s->bottom + 9;
    if (bad_climax(top))
        top--;
    int bottom = s->top - 9;
    int range = top + 1 - bottom;
    int start = bottom + 7;
    if (start < 0)
        start = 0;
    if (start + range > (int)(sizeof notes / sizeof notes[0]))
        range = (sizeof notes / sizeof notes[0]) - start;

    memcpy(out, notes + start, sizeof(out[0]) * range);

    return range;
}

static inline void shuffle(int a[], int length) {
    for (int i = 0; i < length; i++) {
        int s = rand() % (length - i) + i;
        int temp = a[i];
        a[i] = a[s];
        a[s] = temp;
    }
}

static inline bool in_cadence(State *state) { return state->bar >= BARS - 2; }

static inline int get_next_note(State *state, int to_try) {
    if (in_cadence(state))
        return cantus[state->bar];
    else {
        return to_try;
    }
}

static inline bool same_sign(int x, int y) { return (x >= 0) ^ (y < 0); }

static inline bool large_unrecovered_leap(State *state, int this_motion) {
    return abs(state->prev_motion) > 4 &&
           same_sign(state->prev_motion, this_motion);
}

static inline bool repeated_note(State *state, int this_note) {
    return cantus[state->bar - 1] == this_note;
}

static inline bool climax_disconnected(State *state, int this_motion) {
    return cantus[state->bar - 1] == state->top &&
           abs(state->prev_motion) > 1 && abs(this_motion) > 1;
}

static inline bool dissonant_leap(int this_motion) {
    return abs(this_motion) == 6;
}

static inline bool larger_than_octave(int this_motion) {
    return abs(this_motion) > 7;
}

static inline bool tritone_between(int p, int q) {
    return ((p == MI || p == MI - 7) && (q == FA || q == FA - 7)) ||
           ((p == FA || p == FA - 7) && (q == MI || q == MI - 7));
}

#endif
