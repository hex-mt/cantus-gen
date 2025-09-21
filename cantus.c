#include <stdint.h>
#include <stdio.h>
#include <sys/time.h>
#include <time.h>

#include "cantus.h"

int cantus[BARS];
int notes[] = {-7, -6, -5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9};
bool success = false;

int main(void) {
    srand(time(NULL));
    // srand(0L);

    cantus[0] = cantus[BARS - 1] = 0;
    cantus[BARS - 2] = 1;

    State initial_state = {.top = 1,
                           .bottom = 0,
                           .bar = 1,
                           .repeated_climax = false,
                           .leaps_total = 0,
                           .leaps_large = 0,
                           .leaps_in_row = 0,
                           .prev_int = 0,
                           .prev_turn = 0,
                           .since_turn = 1};

    struct timeval st, et;

    gettimeofday(&st, NULL);

    int steps[BARS - 2] = {0};
    for (int i = 0; i < 10000; i++) {
        try_note(initial_state);
        for (int i = 0; i < 10; i++) {
            if (abs(cantus[i + 1] - cantus[i]) == 1)
                steps[i]++;
        }
        success = false;
    }

    gettimeofday(&et, NULL);

    int elapsed =
        ((et.tv_sec - st.tv_sec) * 1000000) + (et.tv_usec - st.tv_usec);
    printf("Time to generate: %d micro seconds\n", elapsed);
    for (int i = 0; i < BARS - 3; i++)
        printf("%d - %d: %f%% were steps\n", i, i + 1,
               (double)steps[i] / 100.0);

    return EXIT_SUCCESS;
}

void try_note(State state) {
    // create shuffled array of notes to try
    int to_try[18];
    int range = create_range(&state, to_try);
    shuffle(to_try, range);

    // if the cantus is complete...
    if (state.bar == BARS - 1) {
        // and it doesn't repeat the climax or climax on the leading tone...
        if (!state.repeated_climax && !bad_climax(state.top)) {

            // raise success flag and print the cantus
            success = true;
            print_cantus();
            return;
        }
        // otherwise backtrack
        return;
    }

    int prev_note = cantus[state.bar - 1];

    // otherwise try out all the options recursively
    for (int i = 0; i < range; i++) {
        if (success)
            return;

        int this_note = to_try[i];
        if (state.bar < BARS - 2)
            this_note = to_try[i];
        else {
            if (i > 0)
                return;
            this_note = cantus[state.bar];
        }

        int motion = this_note - prev_note;

        if (abs(state.prev_int) > 5 && ((state.prev_int > 0 && motion > 0) ||
                                        (state.prev_int < 0 && motion < 0)))
            continue;

        // climax must be connected by step on at least one side
        if (prev_note == state.top && range == 10 && abs(state.prev_int) > 1 &&
            abs(motion) > 1)
            continue;

        // no repeated notes or dissonant leaps, or leaps larger than an 8ve
        if (prev_note == this_note || abs(motion) == 6 || abs(motion) > 7 ||
            // no tritone leaps
            ((prev_note == MI || prev_note == MI - 7) &&
             (this_note == FA || this_note == FA - 7)) ||
            ((prev_note == FA || prev_note == FA - 7) &&
             (this_note == MI || this_note == MI - 7)))
            continue;

        int leaps_total =
            abs(motion) > 1 ? state.leaps_total + 1 : state.leaps_total;
        // stepwise motion should predominate
        if ((float)leaps_total > ((float)(BARS - 1) / 4))
            continue;

        int leaps_large =
            abs(motion) > 3 ? state.leaps_large + 1 : state.leaps_large;
        // no more than two large leaps per cantus
        if (leaps_large > 2)
            continue;

        int leaps_in_row = abs(motion) > 1 ? state.leaps_in_row + 1 : 0;
        // no more than two leaps in a row
        if (leaps_in_row > 2)
            continue;

        if ((state.prev_int == 2) && (motion == 4 || motion == 5))
            continue;
        if ((state.prev_int == 3) && (abs(motion) > 2 && motion != 4))
            continue;

        if ((state.prev_int == -2) && (motion == -4 || motion == -5))
            continue;
        if ((state.prev_int == -3) && (abs(motion) > 2 && motion != -4))
            continue;

        bool repeated;
        if (this_note > state.top) {
            // skip if attempting dissonant climax that cannot be exceeded.
            if (range == 10 &&
                (this_note == 6 || this_note == 8 || this_note == -6 ||
                 (this_note == 3 && MODE == LYDIAN)))
                continue;
            repeated = false;
        } else if (this_note == state.top) {
            // skip if repeating a climactic note that cannot be exceeded.
            if (range == 10)
                continue;
            // otherwise just flag it.
            repeated = true;
        } else
            repeated = state.repeated_climax;

        int since_turn, new_turn;
        if ((state.prev_int > 0 && motion > 0) ||
            (state.prev_int < 0 && motion < 0)) {
            // no excessive motion in a single direction
            if (state.since_turn == 3)
                continue;
            since_turn = state.since_turn + 1;
        } else {
            // no outlined 7ths or 9ths
            int outline = abs(state.prev_turn - this_note);
            if (outline == 6 || outline == 8)
                continue;
            // no outlined tritones
            if (((state.prev_turn == MI || state.prev_turn == MI - 7) &&
                 (this_note == FA || this_note == FA - 7)) ||
                ((state.prev_turn == FA || state.prev_turn == FA - 7) &&
                 (this_note == MI || this_note == MI - 7)))
                continue;
            since_turn = 1;
            new_turn = this_note;
        }

        // add the prospective note to the cantus
        if (state.bar < BARS - 2)
            cantus[state.bar] = this_note;
        // construct a new state object and recursively try the next note.
        try_note((State){.top = max(state.top, this_note),
                         .bottom = min(state.bottom, this_note),
                         .bar = state.bar + 1,
                         .repeated_climax = repeated,
                         .leaps_total = leaps_total,
                         .leaps_large = leaps_large,
                         .leaps_in_row = leaps_in_row,
                         .prev_int = motion,
                         .since_turn = since_turn,
                         .prev_turn = new_turn});
    }
}
