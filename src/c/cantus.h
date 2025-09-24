#ifndef CANTUS
#define CANTUS

#include <stdlib.h>
#include <string.h>

#define MEANTONAL
#include "meantonal.h"

#define max(x, y) (((x) >= (y)) ? (x) : (y))
#define min(x, y) (((x) <= (y)) ? (x) : (y))

extern int cantus[32];
extern const int notes[17];
extern bool success;

extern int BARS;
extern int MODE;
#define FA ((3 * MODE) % 7)
#define MI ((3 + 3 * MODE) % 7)

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
    bool must_fill;
    int *to_fill;
} State;

int generate_cantus(int mode, int length);

void try_note(State range);

int get_cantus_value(int i);

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
    // Pitch tonic, note_to_print;
    // pitch_from_spn("D4", &tonic);
    // TonalContext ctx = context_from_pitch(tonic, MODE);

    // printf("!lp simple \\fixed c { ");
    for (int i = 0; i < BARS; i++) {
        // note_to_print = transpose_diatonic(tonic, cantus[i], ctx);
        // char buf[8];
        // pitch_lily(note_to_print, buf);
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

static inline void shuffle(int a[], int length, State *state) {
    for (int i = 0; i < length; i++) {
        int s = rand() % (length - i) + i;
        int temp = a[i];
        a[i] = a[s];
        a[s] = temp;
    }
    // counteract bias towards "early spending" of leaps
    // by strongly preferencing steps as first choices
    int s = rand() % 5;
    if (s > 1) {
        for (int i = 0; i < length; i++) {
            if (i == 0 && abs(a[i] - cantus[state->bar - 1]) == 1)
                break;
            if (abs(a[i] - cantus[state->bar - 1]) == 1) {
                int temp = a[0];
                a[0] = a[i];
                a[i] = temp;
                break;
            }
        }
        for (int i = 1; i < length; i++) {
            if (i == 1 && abs(a[i] - cantus[state->bar - 1]) == 1)
                break;
            if (abs(a[i] - cantus[state->bar - 1]) == 1) {
                int temp = a[1];
                a[1] = a[i];
                a[i] = temp;
                break;
            }
        }
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

static inline bool registral_break(State *state, bool *must_fill,
                                   int to_fill[18], int this_note,
                                   int prev_note, int this_motion) {
    if (*must_fill) {
        for (int i = 0; i < 18; i++) {
            to_fill[i] = state->to_fill[i];
        }
        if (state->to_fill[this_note + 7] == -1) {
            for (int i = 0; i < 17; i++) {
                if (state->to_fill[i] == 0)
                    return true;
            }
            *must_fill = false;
        } else
            to_fill[this_note + 7]++;
    } else if (abs(this_motion) > 3) {
        for (int i = 0; i < 18; i++)
            to_fill[i] = -1; // sentinel value

        int low_bound = min(this_note, prev_note) + 7;
        int high_bound = max(this_note, prev_note) + 7;
        for (int i = low_bound; i <= high_bound; i++)
            to_fill[i] = 0;
        to_fill[low_bound] = to_fill[high_bound] = 1;
        *must_fill = true;
    }
    return false;
}

static inline bool large_unrecovered_leap(State *state, int this_motion) {
    return abs(state->prev_motion) > 3 &&
           (same_sign(state->prev_motion, this_motion) || abs(this_motion) > 3);
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

static inline int update_leaps_total(State *state, int this_motion) {
    return abs(this_motion) > 1 ? state->leaps_total + 1 : state->leaps_total;
}

static inline bool too_many_leaps(int leaps_total) {
    return (float)leaps_total > ((double)(BARS) / 4);
}

static inline int update_leaps_large(State *state, int this_motion) {
    return abs(this_motion) > 3 ? state->leaps_large + 1 : state->leaps_large;
}

static inline bool too_many_large_leaps(int leaps_large) {
    return leaps_large > 2;
}

static inline bool steps_past_arpeggio(State *state, int this_motion) {
    return state->leaps_in_row == 2 && state->since_turn > 1 &&
           same_sign(state->prev_motion, this_motion);
}

static inline bool arpeggio_past_step(State *state, int this_motion) {
    return state->leaps_in_row == 1 && state->since_turn > 1 &&
           same_sign(state->prev_motion, this_motion) && abs(this_motion) > 1;
}

static inline bool large_leap_past_step(State *state, int this_motion) {
    return (abs(this_motion) > 3 && same_sign(state->prev_motion, this_motion));
}

static inline int update_leaps_in_row(State *state, int this_motion) {
    return abs(this_motion) > 1 ? state->leaps_in_row + 1 : 0;
}

static inline bool too_many_leaps_in_row(int leaps_in_row) {
    return leaps_in_row > 2;
}

static inline bool bad_consecutive_leaps(State *state, int this_motion) {
    if ((state->prev_motion == 2) && (this_motion > 3))
        return true;
    if ((state->prev_motion == 3) && (abs(this_motion) > 2))
        return true;

    if ((state->prev_motion == -2) && (this_motion < -3))
        return true;
    if ((state->prev_motion == -3) && (abs(this_motion) > 2))
        return true;

    return false;
}

static inline bool new_climax(State *state, int this_note) {
    return this_note > state->top;
}

static inline bool cannot_surpass(int range) { return range == 10; }

static inline bool repeat_climax(State *state, int this_note) {
    return this_note == state->top;
}

static inline bool same_direction(State *state, int this_motion) {
    return same_sign(state->prev_motion, this_motion);
}

static inline bool should_change_direction(State *state) {
    return state->since_turn == 3;
}

static inline bool dissonant_outline(State *state, int prev_note) {
    int outline = abs(state->prev_turn - prev_note);
    if (outline == 6 || outline == 8)
        return true;
    if (tritone_between(state->prev_turn, prev_note))
        return true;
    return false;
}

static inline bool noodling(State *state, int this_note) {
    if ((state->bar >= 3 && this_note == cantus[state->bar - 2]) &&
        (cantus[state->bar - 1] == cantus[state->bar - 3]))
        return true;
    if (state->bar >= 4 && this_note == cantus[state->bar - 2] &&
        this_note == cantus[state->bar - 4])
        return true;
    return false;
}

static inline bool overemphasised_tone(State *state, int this_note) {
    int count = 0;
    if (this_note == 0)
        count++;
    if (this_note == 1 && state->bar != BARS - 2)
        count++;
    for (int i = 0; i < state->bar; i++)
        if (cantus[i] == this_note)
            count++;
    if (count > 2)
        return true;
    return false;
}

static inline bool bad_cadence_approach(State *state, int this_motion) {
    if (state->bar == BARS - 2 && this_motion < -3)
        return true;
    return false;
}

#endif
