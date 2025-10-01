#include "chunks.h"
#include "meantonal.h"

Interval motions[] = {(Interval){-5, -2}, // -P8
                      (Interval){-4, -1}, // -M6
                      (Interval){-3, -2}, // -m6
                      (Interval){-3, -1}, // -P5
                      (Interval){-2, -1}, // -P4
                      (Interval){-2, 0},  // -M3
                      (Interval){-1, -1}, // -m3
                      (Interval){-1, 0},  // -M2
                      (Interval){0, -1},  // -m2
                      (Interval){0, 0},   // P1
                      (Interval){0, 1},   // m2
                      (Interval){1, 0},   // M2
                      (Interval){1, 1},   // m3
                      (Interval){2, 0},   // M3
                      (Interval){2, 1},   // P4
                      (Interval){3, 1},   // P5
                      (Interval){3, 2},   // m6
                      (Interval){4, 1},   // M6
                      (Interval){5, 2}};  // M10

Interval consonances[] = {(Interval){-7, -2}, // -M10
                          (Interval){-6, -3}, // -m10
                          (Interval){-5, -2}, // -P8
                          (Interval){-4, -1}, // -M6
                          (Interval){-3, -2}, // -m6
                          (Interval){-3, -1}, // -P5
                          (Interval){-2, 0},  // -M3
                          (Interval){-1, -1}, // -m3
                          (Interval){0, 0},   // P1
                          (Interval){1, 1},   // m3
                          (Interval){2, 0},   // M3
                          (Interval){3, 1},   // P5
                          (Interval){3, 2},   // m6
                          (Interval){4, 1},   // M6
                          (Interval){5, 2},   // P8
                          (Interval){6, 3},   // m10
                          (Interval){7, 2}};  // M10

chunk_node *data[MELODIC_INDEX_COUNT][HARMONIC_INDEX_COUNT] = {0};

chunk_node node_pool[1000];

chunk_node *create_chunk(void) {
    static int i = 0;
    i++;
    return node_pool + i - 1;
}

void generate_chunks(void) {
    for (int i = 0; i < MELODIC_INDEX_COUNT; i++) {
        for (int j = 0; j < HARMONIC_INDEX_COUNT; j++) {
            for (int k = 0; k < HARMONIC_INDEX_COUNT; k++) {
                // no unisons (outlide of outer measures)
                if (stepspan(consonances[k]) == 0 ||
                    // no voice crossing
                    (stepspan(consonances[j]) > 0 &&
                     stepspan(consonances[k]) < 0) ||
                    (stepspan(consonances[j]) < 0 &&
                     stepspan(consonances[k]) > 0) ||
                    // no consecutive perfects
                    (stepspan(consonances[j]) == 0 &&
                     stepspan(consonances[k]) == 0) ||
                    (stepspan(consonances[j]) == 4 &&
                     stepspan(consonances[k]) == 4) ||
                    (stepspan(consonances[j]) == 7 &&
                     stepspan(consonances[k]) == 7) ||
                    (stepspan(consonances[j]) == -4 &&
                     stepspan(consonances[k]) == -4) ||
                    (stepspan(consonances[j]) == -7 &&
                     stepspan(consonances[k]) == -7))
                    continue;
                Interval secondMotion = intervals_subtract(
                    intervals_add(consonances[k], motions[i]), consonances[j]);
                // no direct motion to perfect consonances
                if (((stepspan(motions[i]) > 0 && stepspan(secondMotion) > 0) ||
                     (stepspan(motions[i]) < 0 &&
                      stepspan(secondMotion) < 0)) &&
                    (abs(stepspan(consonances[k])) == 4 ||
                     abs(stepspan(consonances[k])) == 7))
                    continue;
                // no similar motion where either part is moving by more than a
                // third.
                if ((stepspan(motions[i]) >= 2 && stepspan(secondMotion) > 1) ||
                    (stepspan(motions[i]) <= -2 &&
                     stepspan(secondMotion) < -1) ||
                    (stepspan(motions[i]) > 1 && stepspan(secondMotion) >= 2) ||
                    (stepspan(motions[i]) < -1 && stepspan(secondMotion) <= -2))
                    continue;
                // no ottava battuta
                if (abs(stepspan(secondMotion)) > 1 &&
                    abs(stepspan(motions[i])) == 1 &&
                    abs(stepspan(consonances[k])) % 7 == 0)
                    continue;

                for (int m = 0; m < 13; m++) {
                    if (intervals_equal(secondMotion, motions[m])) {
                        add_chunk(motions[i], consonances[j],
                                  (chunk){consonances[k], secondMotion});
                    }
                }
            }
        }
    }
}

int map_melodic_index(Interval m) {
    for (int i = 0; i < MELODIC_INDEX_COUNT; i++) {
        if (intervals_equal(m, motions[i]))
            return i;
    }
    return -1;
}

int map_harmonic_index(Interval m) {
    for (int i = 0; i < HARMONIC_INDEX_COUNT; i++) {
        if (intervals_equal(m, consonances[i]))
            return i;
    }
    return -1;
}

void add_chunk(Interval i, Interval j, chunk c) {
    int fi = map_melodic_index(i);
    int si = map_harmonic_index(j);
    if (fi < 0 || fi >= MELODIC_INDEX_COUNT || si < 0 ||
        si >= HARMONIC_INDEX_COUNT) {
        char iname[8], jname[8];
        interval_name(i, iname);
        interval_name(j, jname);
        fprintf(stderr, "Invalid index: (%s, %s)\n", iname, jname);
        return;
    }

    chunk_node *new_node = create_chunk();
    new_node->data = c;
    new_node->next = data[fi][si];
    data[fi][si] = new_node; // insert at head
}

void print_chunks(Interval i, Interval j) {
    int fi = map_melodic_index(i);
    int si = map_harmonic_index(j);
    chunk_node *current = data[fi][si];

    char iname[8], jname[8];
    interval_name(i, iname);
    interval_name(j, jname);
    printf("Chunks at (%s, %s):\n", iname, jname);
    while (current) {
        interval_name(current->data.cons, iname);
        interval_name(current->data.motion, jname);
        printf("  { cons: %s, motion: %s }\n", iname, jname);
        current = current->next;
    }
}

void shuffle_list(chunk_node **head) {
    if (!head || !*head)
        return;

    // Step 1: copy node pointers into an array
    chunk_node *arr[16]; // list length is <16
    int n = 0;
    chunk_node *cur = *head;
    while (cur && n < 16) {
        arr[n++] = cur;
        cur = cur->next;
    }

    // Step 2: Fisher–Yates shuffle
    for (int i = n - 1; i > 0; i--) {
        int j = rand() % (i + 1);
        chunk_node *tmp = arr[i];
        arr[i] = arr[j];
        arr[j] = tmp;
    }

    // Step 3: re-link nodes in shuffled order
    for (int i = 0; i < n - 1; i++) {
        arr[i]->next = arr[i + 1];
    }
    arr[n - 1]->next = NULL;

    *head = arr[0];
}

chunk_node *get_chunks(Interval cons, Interval motion) {
    int fi = map_melodic_index(motion);
    int si = map_harmonic_index(cons);

    if (fi < 0 || fi >= MELODIC_INDEX_COUNT || si < 0 ||
        si >= HARMONIC_INDEX_COUNT)
        return NULL;

    shuffle_list(&data[fi][si]);

    return data[fi][si]; // may be NULL if no chunks
}
