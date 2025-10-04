#ifndef CTP_H
#define CTP_H

#include "cantus.h"
#define LIMIT 32
#define STEP_LIMIT 5
#define IMP_LIMIT 3
#define TIE_LIMIT (BARS - 3) / 4

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
    Pitch prev_turn;
    int since_turn;
    bool must_fill;
    int *to_fill;
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

static inline int pitch_index(Pitch p) {
    return stepspan(interval_between(mt_ctp[0], p));
}

static inline bool ctp_registral_break(CtpState *state, bool *must_fill,
                                       int to_fill[19], Pitch this_note,
                                       Pitch prev_note, Interval this_motion) {
    if (*must_fill) {
        int lower = get_lower_boundary(state->to_fill);
        int upper = get_upper_boundary(state->to_fill);
        if ((pitch_index(this_note) == lower ||
             pitch_index(this_note) == upper) &&
            (pitch_index(prev_note) == lower ||
             pitch_index(prev_note) == upper))
            return true;
        for (int i = 0; i < 19; i++) {
            to_fill[i] = state->to_fill[i];
        }
        if (state->to_fill[pitch_index(this_note) + 9] == -1) {
            for (int i = 1; i < 18; i++) {
                if (state->to_fill[i] == 0)
                    return true;
            }
            *must_fill = false;
        } else
            to_fill[pitch_index(this_note) + 9]++;
    } else if (abs(stepspan(this_motion)) > 3) {
        for (int i = 0; i < 19; i++)
            to_fill[i] = -1; // sentinel value

        int low_bound = min(pitch_index(this_note), pitch_index(prev_note)) + 9;
        int high_bound =
            max(pitch_index(this_note), pitch_index(prev_note)) + 9;
        for (int i = low_bound; i <= high_bound; i++)
            to_fill[i] = 0;
        to_fill[low_bound] = to_fill[high_bound] = 1;
        *must_fill = true;
    }
    return false;
}

static inline bool ctp_large_unrecovered_leap(CtpState *state,
                                              Interval this_motion) {
    Interval prev_motion = ctp_motions[state->bar - 1];
    return abs(stepspan(prev_motion)) > 3 &&
           (same_sign(stepspan(prev_motion), stepspan(this_motion)) ||
            abs(stepspan(this_motion)) > 3);
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

static inline bool ctp_same_direction(CtpState *state, Interval this_motion) {
    return same_sign(stepspan(ctp_motions[state->bar - 1]),
                     stepspan(this_motion));
}

static inline bool ctp_should_change_direction(CtpState *state) {
    return state->since_turn == 3;
}

static inline bool ctp_dissonant_outline(CtpState *state, Pitch prev_note) {
    Interval outline = interval_between(state->prev_turn, prev_note);
    int steps = abs(stepspan(outline));
    if (steps == 6 || steps == 8 || abs(interval_quality(outline)) > 1)
        return true;
    return false;
}

static inline bool ctp_has_tritone(CtpState *state, int since_turn,
                                   Pitch this_note) {
    if (since_turn > 1) {
        if (abs(interval_pc12(
                interval_between(this_note, mt_ctp[state->bar - 2]))) == 6) {
            return true;
        }
    } else if (since_turn > 2) {
        if (abs(interval_pc12(
                interval_between(this_note, mt_ctp[state->bar - 3]))) == 6) {
            for (int i = 0; i < 3; i++) {
                if (abs(stepspan(interval_between(
                        mt_ctp[state->bar - i], mt_ctp[state->bar - i - 1]))) >
                    1)
                    return true;
            }
        }
    }
    return false;
}

static inline bool ctp_noodling(CtpState *state, Pitch this_note) {
    if ((state->bar >= 3 && pitches_equal(this_note, mt_ctp[state->bar - 2])) &&
        (pitches_equal(mt_ctp[state->bar - 1], mt_ctp[state->bar - 3])))
        return true;
    if (state->bar >= 4 && pitches_equal(this_note, mt_ctp[state->bar - 2]) &&
        pitches_equal(this_note, mt_ctp[state->bar - 4]))
        return true;
    return false;
}

static inline bool ctp_overemphasised_tone(CtpState *state, Pitch this_note) {
    int count = 0;
    for (int i = 0; i < state->bar; i++)
        if (pitches_equal(mt_ctp[i], this_note))
            count++;
    if (count > 3)
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

static inline bool ctp_complete(CtpState *state) {
    return state->bar == BARS - 1;
}

static inline bool bad_ctp_climax(Pitch climax) {
    return interval_chroma(interval_between(tonic, climax)) == 5;
}

static inline bool ctp_climax_good(CtpState *state) {
    return !state->repeated_climax && !bad_ctp_climax(state->top) &&
           !state->disconnected_climax;
}

#endif
