#ifndef CTP_H
#define CTP_H

#include "cantus.h"
#define LIMIT 32
#define STEP_LIMIT 5
#define IMP_LIMIT 3

typedef struct ctp_state {
    Interval cantus_motions[LIMIT - 1];
    Interval ints[LIMIT];
    Pitch notes[LIMIT];
    Interval motions[LIMIT - 1];
    int leaps[LIMIT - 1];
    int steps[LIMIT - 1];
} ctp_state;

extern Pitch mt_cantus[32];
extern Pitch cantus_motions[32];
extern Pitch mt_ctp[32];

void next_chunk(ctp_state *c, int length, int left);

int check_adjacent(ctp_state *c, int index);

#endif
