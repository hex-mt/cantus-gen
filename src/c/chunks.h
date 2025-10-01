#ifndef CHUNKS_H
#define CHUNKS_H

#include "meantonal.h"
#include <emscripten/emscripten.h>
#include <stdio.h>

#define MAX_CHUNKS 32

typedef struct chunk {
    Interval cons;
    Interval motion;
} chunk;

typedef struct chunk_node {
    chunk data;
    struct chunk_node *next;
} chunk_node;

// 19 x 17 grid, each cell is a pointer to a linked list of chunk_node
#define MELODIC_INDEX_COUNT 19
#define HARMONIC_INDEX_COUNT 17

extern Interval motions[MELODIC_INDEX_COUNT];
extern Interval consonances[HARMONIC_INDEX_COUNT];

extern chunk_node *data[MELODIC_INDEX_COUNT][HARMONIC_INDEX_COUNT];
extern chunk_node node_pool[10000];

chunk_node *create_chunk(void);

EMSCRIPTEN_KEEPALIVE
void generate_chunks(void);

int map_melodic_index(Interval m);

int map_harmonic_index(Interval m);

void add_chunk(Interval i, Interval j, chunk c);

void print_chunks(Interval i, Interval j);

void shuffle_list(chunk_node **head);

chunk_node *get_chunks(Interval cons, Interval motion);

chunk_node *clone_list_into(const chunk_node *head, chunk_node buf[MAX_CHUNKS]);

#endif
