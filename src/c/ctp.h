#ifndef CTP_H
#define CTP_H

#include "cantus.h"
#define LIMIT 32
#define STEP_LIMIT 5
#define IMP_LIMIT 3

typedef struct {
    Pitch top;
    Pitch bottom;
    int bar;
    bool repeated_climax;
    bool disconnected_climax;
} CtpState;

extern Pitch mt_cantus[32];
extern Interval cantus_motions[32];
extern Pitch mt_ctp[32];
extern Interval ctp_motions[32];
extern Interval v_ints[32];
extern TonalContext context;
extern Pitch tonic;

extern Pitch result_ctp[32];
extern int solutions;

void next_chunk(CtpState state);

static inline bool ctp_complete(CtpState *state) {
    return state->bar == BARS - 1;
}

static inline bool bad_ctp_climax(Pitch climax) {
    return intervals_equal(interval_between(climax, tonic), (Interval){0, 1});
}

static inline bool ctp_climax_good(CtpState *state) {
    return !state->repeated_climax && !bad_ctp_climax(state->top) &&
           !state->disconnected_climax;
}

static inline int bars_remaining(CtpState *state) {
    return BARS - state->bar - 1;
}

static inline bool chromatic_outside_cadence(CtpState *state, Pitch this_note) {
    int alteration = degree_alteration(this_note, context);
    int degree = degree_number(this_note, context);

    if (bars_remaining(state) > 2 && alteration)
        return true;

    if (bars_remaining(state) == 1 && alteration == -1 ||
        (alteration == 1 && MODE != 2 && MODE != 3 && MODE != 4 &&
         degree != 5 && degree != 6))
        return true;
    return false;
}

static inline bool is_subtonic(Pitch p) {
    return (MODE - 1) - pitch_chroma(p) == 2;
}

static inline bool is_leading_tone(Pitch p) {
    return pitch_chroma(p) - (MODE - 1) == 5;
}

static inline bool ctp_bad_penultima(CtpState *state, Pitch this_note) {
    if (MODE == 5 && !is_subtonic(this_note)) {
        return true;
    }
    if (MODE != 5 && !is_leading_tone(this_note))
        return true;
    return false;
}

static inline bool is_tonic(Pitch p) { return pitch_chroma(p) == MODE - 1; }

#endif
