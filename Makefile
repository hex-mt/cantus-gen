all:
	emcc -O3 src/c/cantus.c \
	  -s MODULARIZE=1 \
	  -s EXPORT_ES6=1 \
	  -s ENVIRONMENT=web \
	  -s EXPORTED_FUNCTIONS='["_generate_cantus","_get_cantus_value"]' \
	  -s EXPORTED_RUNTIME_METHODS='["cwrap"]' \
	  -o src/cantus.js
