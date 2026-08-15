# ADR-005: Seeded Randomness

## Status
Accepted

## Context
Procedural generation and randomized game mechanics (e.g. Tetris pieces, enemy spawn points) rely on Random Number Generators (RNG). The built-in `Math.random()` provides unpredictable randomness but no way to set a seed.

## Decision
We integrated the **Mulberry32** algorithm as our core PRNG (`core/math/random.ts`), completely avoiding `Math.random()`.

## Consequences
- **Determinism & Reproducibility:** By starting with a known seed, Mulberry32 generates the exact same sequence of floats across all browsers and devices. 
- **Replay Capability:** We can easily implement replays simply by recording the initial random seed and the deterministic sequence of user inputs.
- **Platform Independence:** Unlike `Math.random()`, which has implementation-defined behavior that varies between V8 and Spidermonkey, Mulberry32 is purely mathematical and strictly identical everywhere.
