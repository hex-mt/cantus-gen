# Cantus Firmus Generator

This program generates a cantus firmus roughly in line with the restrictions given in Salzer and Schachter's _Counterpoint in Composition_.

The melody is generated non-deterministically via randomised recursive exploration of a tree, where each node represents a new note concatenated onto the current melody. Any time a note is tried, various checks are performed, and if no valid cantus can result from continuing down a given branch, backtracking occurs.

This method tries to achieve three objectives:

1. Generation time for a cantus with length between 9 and 16 should be as low as possible.
2. Any valid cantus by the ruleset given should be within the range of the function and possible to generate.
3. The chances of any two canti in the range of the function being generated should be as close to even as possible.

To the extent that these objectives are achieved, it should hopefully be useful for stress-testing other species counterpoint related programs.

The error checks are also parameterised in a way that should make them easy to selectively disable and add inverse checks for to generate canti that are deliberately flawed in a specified way, which might be useful pedagogically.
