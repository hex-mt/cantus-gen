all:
	emcc -O3 src/c/ctp.c src/c/cantus.c src/c/chunks.c \
	  -s MODULARIZE=1 \
	  -s EXPORT_ES6=1 \
	  -s ENVIRONMENT=web \
	  -s EXPORTED_FUNCTIONS='["_initialise_env","_generate_cantus","_get_cantus_value","_generate_chunks","_generate_ctp","_get_ctp", "_get_solutions"]' \
	  -s EXPORTED_RUNTIME_METHODS='["cwrap","getValue","HEAP32"]' \
	  -o src/cantus.js
