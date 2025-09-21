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
    int leaps_total; // leaps larger than a 2nd
    int leaps_large; // leaps larger than a 4th
    int leaps_in_row;
    int prev_int;
    int prev_turn;
    int since_turn;
} State;

void try_note(State range);

static inline void shuffle(int a[], int length) {
    for (int i = 0; i < length; i++) {
        int s = rand() % (length - i) + i;
        int temp = a[i];
        a[i] = a[s];
        a[s] = temp;
    }
}

static inline bool bad_climax(int climax) {
    return climax == 6 && (MODE == MAJOR || MODE == LYDIAN);
}

static inline int create_range(const State *s, int *out) {
    int top = s->bottom + 9;
    if (bad_climax(top))
        top--;
    int bottom = s->top - 9;
    int range = top + 1 - bottom;
    memcpy(out, notes + bottom + 7, sizeof(out[0]) * range);
    return range;
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

#endif
