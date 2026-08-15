# ARCADE_

> 88 original browser game cartridges + 14 mathematical lab experiments.  
> A custom TypeScript 2D engine. Zero ROM files. Zero external game assets.

## What is ARCADE_?
ARCADE_ is a collection of original implementations inspired by arcade classics, built from scratch using mathematical first principles. These are not ROM ports or direct recreations, but rather completely new codebases capturing the spirit and mechanics of classic games. 

## Games
The system includes 88 arcade cartridges spanning various genres, from logic puzzles to platformers. They all run on the same deterministic engine loop. View the full list at [/games](/games).

## Labs  
Beyond standard games, ARCADE_ features 14 mathematical and physics experiments, exploring algorithms, cellular automata, and procedural generation. Explore them at [/labs](/labs).

## Architecture
ARCADE_ is built on a custom architecture ensuring deterministic simulation and high performance without external game frameworks.
* **TypeScript Engine:** A fixed 60Hz timestep accumulator provides deterministic gameplay across any refresh rate.
* **Canvas Rendering:** A dedicated pixel rendering pipeline utilizes HTML5 Canvas 2D for efficient drawing.
* **Procedural Audio:** Real-time Web Audio API sound synthesis eliminates the need for any downloaded audio assets.
* **Deterministic Randomness:** A seeded Mulberry32 PRNG ensures reproducible procedural generation and behavior.

## Game Loading
The platform leverages Next.js dynamic `import()` for code splitting. This ensures that game logic is loaded on-demand when a cartridge is launched, avoiding a massive initial JavaScript bundle, though exact chunk boundaries are determined by Turbopack's optimization heuristics.

## Testing
102 smoke tests (one per cartridge) + 61 unit/integration tests = 163 total tests.

## Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run type checking
npm run typecheck

# Run test suites
npm run test
```

## License
MIT
