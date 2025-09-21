all:
	cc cantus.c -o cantus -Wall -Werror -O2

optimised:
	cc cantus.c -o cantus -O3
