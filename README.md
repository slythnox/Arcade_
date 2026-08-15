# ARCADE_

> 60 original deterministic retro arcade game cartridges.  
> Pure TypeScript architecture with zero third-party game engine dependencies.

## What is ARCADE_

ARCADE_ is a deterministic, framework-free retro arcade engine and game library built from scratch in TypeScript, running on HTML5 Canvas 2D and synthesized Web Audio API.

The system includes 60 arcade cartridges (including *Diamond Run*, *Pixel Quest*, *Ray Sector*, *Pixel Circuit*, *Dungeon Quest*, *Tetris*, *Snake*, *Sokoban*, and *Logic Gates*) spanning 7 distinct genres. They all run on the same deterministic engine loop. View the full list at [/games](/games).

## Architecture
ARCADE_ is built on a custom architecture ensuring deterministic simulation and high performance without external game frameworks.
* **TypeScript Engine:** A fixed 60Hz timestep accumulator provides deterministic gameplay across any refresh rate.
* **Canvas Rendering:** A dedicated pixel rendering pipeline utilizes HTML5 Canvas 2D for efficient drawing.
* **Procedural Audio:** Real-time Web Audio API sound synthesis eliminates the need for any downloaded audio assets.
* **Deterministic Randomness:** A seeded Mulberry32 PRNG ensures reproducible procedural generation and behavior.

## Game Loading
The platform leverages Next.js dynamic `import()` for code splitting. This ensures that game logic is loaded on-demand when a cartridge is launched, avoiding a massive initial JavaScript bundle, though exact chunk boundaries are determined by Turbopack's optimization heuristics.

## Testing
60 smoke tests (one per cartridge) + unit & integration tests = 218 total passed tests.

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
