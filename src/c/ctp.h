#ifndef CTP_H
#define CTP_H

#include "cantus.h"
#define LIMIT 32
#define STEP_LIMIT 5
#define IMP_LIMIT 3
#define TIE_LIMIT (double)(BARS - 3.0) / 4.0

typedef struct {
    Pitch top;
    Pitch bottom;
    int bar;
    bool repeated_climax;
    bool disconnected_climax;
    int ties;
    int imps_in_row;
    int leaps_total; // leaps larger than a 2nd
    int leaps_large; // leaps larger than a 4th
    int leaps_in_row;
    // int prev_turn;
    // int since_turn;
    // bool must_fill;
    // int *to_fill;
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

static inline int bars_remaining(CtpState *state) {
    return BARS - state->bar - 1;
}

static inline bool consecutive_ties(CtpState *state, Pitch this_note,
                                    Pitch prev_note) {
    if (pitches_equal(this_note, prev_note) &&
        pitches_equal(prev_note, mt_ctp[state->bar - 2]))
        return true;
    return false;
}

static inline int update_ties(CtpState *state, Interval this_motion) {
    return stepspan(this_motion) == 0 ? state->ties + 1 : state->ties;
}

static inline bool too_many_ties(int ties) { return ties > TIE_LIMIT; }

static inline int update_imps(CtpState *state, Interval this_int) {
    int abs_this_int = abs(stepspan(this_int));
    bool is_imp = abs_this_int == 2 || abs_this_int == 5 || abs_this_int == 9;

    if (!is_imp)
        return 0;

    int abs_prev_int = abs(stepspan(v_ints[state->bar - 1]));
    bool same_int = abs_this_int == abs_prev_int;

    if (!same_int)
        return 1;

    return state->imps_in_row + 1;
}

static inline bool too_many_imps_in_row(int imps) { return imps > IMP_LIMIT; }

static inline int ctp_update_leaps_total(CtpState *state,
                                         Interval this_motion) {
    return abs(stepspan(this_motion)) > 1 ? state->leaps_total + 1
                                          : state->leaps_total;
}

static inline int ctp_update_leaps_large(CtpState *state,
                                         Interval this_motion) {
    return abs(stepspan(this_motion)) > 3 ? state->leaps_large + 1
                                          : state->leaps_large;
}

static inline bool chromatic_outside_cadence(CtpState *state, Pitch this_note) {
    int alteration = degree_alteration(this_note, context);
    int degree = degree_number(this_note, context);

    if (bars_remaining(state) > 2 && alteration)
        return true;

    if (bars_remaining(state) == 2 && alteration == -1 ||
        (alteration == 1 && ((MODE != 2 && MODE != 3 && MODE != 4) ||
                             (degree != 5 && degree != 6))))
        return true;
    return false;
}

static inline bool update_disconnected_climax(CtpState *state,
                                              Interval this_motion) {
    Interval prev_motion = ctp_motions[state->bar - 1];
    return state->disconnected_climax ||
           (pitches_equal(mt_ctp[state->bar - 1], state->top) &&
            abs(stepspan(prev_motion)) > 1 && abs(stepspan(this_motion)) > 1);
}

static inline bool ctp_new_climax(CtpState *state, Pitch this_note) {
    return stepspan(interval_between(state->top, this_note)) > 0;
}

static inline bool ctp_cannot_surpass(int range) { return range == 9; }

static inline bool ctp_repeat_climax(CtpState *state, Pitch this_note) {
    return stepspan((Interval)this_note) == stepspan((Interval)state->top);
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

#endif
