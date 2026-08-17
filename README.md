# ARCADE_

> **A mathematical, zero-dependency retro arcade platform and 2D game engine built from scratch in pure TypeScript with 60 deterministic cartridges, procedural Web Audio sound synthesis, and pixel-quantized HTML5 Canvas rendering.**

---

## Quick Navigation

- [What is ARCADE_?](#what-is-arcade)
- [Design Philosophy](#design-philosophy)
- [Platform Architecture](#platform-architecture)
- [Deterministic Game Engine](#deterministic-game-engine)
- [Mathematical Core](#mathematical-core)
- [Algorithmic Systems](#algorithmic-systems)
- [Audio Synthesis](#audio-synthesis)
- [Input & Mobile Controls](#input--mobile-controls)
- [Search Engine](#search-engine)
- [Game Library Catalogue](#game-library-catalogue)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Adding a New Game](#adding-a-new-game)
- [Testing & Quality Assurance](#testing--quality-assurance)
- [Documentation Index](#documentation-index)
- [License](#license)

---

## What is ARCADE_?

**ARCADE_** is an open-source web arcade platform running 60 original, from-scratch game cartridges. It is not an emulator and hosts zero copyrighted ROM files. Every game cartridge is an original, deterministic implementation written in strict TypeScript.

The platform provides a complete custom 2D runtime:
- **Zero Third-Party Game Frameworks:** Built without Phaser, Pixi, Babylon, or Unity WebGL.
- **Deterministic Fixed Timestep:** 60Hz physics accumulator decoupling simulation ticks from display refresh rate (60Hz to 240Hz+).
- **Procedural Web Audio API:** 100% synthesized 8-bit chip tunes and SFX using oscillators and dynamic gain envelopes (0 audio asset downloads).
- **Pixel-Quantized Canvas 2D:** Low-latency rendering with discrete integer coordinate snapping, CRT effects, and bevel highlighting.
- **Dynamic Code Splitting:** Every cartridge is lazily loaded via Next.js dynamic `import()`, keeping the initial application payload minimal.

---

## Design Philosophy

```text
┌─────────────────────────────────────────────────────────────┐
│                       ARCADE_ CORE                          │
├──────────────────────────────┬──────────────────────────────┤
│       VISUAL LANGUAGE        │     ENGINEERING RIGOR        │
│  1980s / 1990s Arcade UI     │  Strict TypeScript 5.x       │
│  Monochrome & CRT scanlines  │  Deterministic 60Hz loop     │
│  Tactile D-pad controls      │  Zero runtime dependencies   │
│  Synthesized square waves    │  Isolated module boundaries  │
└──────────────────────────────┴──────────────────────────────┘
```

1. **Mathematical Purity:** Game mechanics are modeled from first principles using standard vector geometry, discrete lattices, cellular automata, and graph theory.
2. **Deterministic Simulation:** Games use an explicit seed and fixed delta-time (`1/60s`). Given the same sequence of user inputs and PRNG seed, gameplay proceeds identically.
3. **No Heavy Framework Overhead:** By writing an engine tailored specifically to retro 2D games, ARCADE_ avoids hundreds of kilobytes of unused generic engine features.

---

## Platform Architecture

ARCADE_ strictly separates the browser application layer from the game simulation runtime:

```text
┌───────────────────────────────────────────────────────────────────────────┐
│ NEXT.JS 16 APP ROUTER (Web Shell, SSR Metadata, SEO, Navigation)          │
│   ├── app/page.tsx (Arcade Floor Hero, Cartridge Grid, Search Filters)    │
│   └── app/games/[slug]/page.tsx (Dynamic Route, OpenGraph, JSON-LD)       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ mounts
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ GAME SHELL (React Bridge, Mobile HUD, Responsive Sizing, Overlays)        │
│   └── components/game/GameShell.tsx                                       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ instantiates & controls
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ GAME ENGINE RUNTIME (Pure TypeScript, Zero React Dependencies)            │
│   ├── GameLoop (60Hz Fixed Accumulator, Delta Clamping, FPS Tracking)     │
│   ├── GameSession (Status Machine, Scoring, Replay Frame Recording)       │
│   ├── InputManager (Keyboard, Virtual Touch Controls, Pointer)            │
│   ├── PixelRenderer (Canvas 2D, Quantization Grid, Bevel Rectangles)      │
│   └── AudioManager (Web Audio API Synthesizer, Chip Tones, Presets)       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ injects GameContext into
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ GAME INSTANCE (Cartridge Logic Consumer)                                  │
│   └── games/{cartridge}/{Cartridge}Game.ts (Implements GameInstance)       │
└─────────────────────────────────────┬─────────────────────────────────────┘
                                      │ consumes
                                      ▼
┌───────────────────────────────────────────────────────────────────────────┐
│ CORE MATHEMATICAL & ALGORITHMIC LIBRARIES                                 │
│   ├── core/math/ (Vector2, AABB, Matrix2, Mulberry32 PRNG, ValueNoise)    │
│   └── core/algorithms/ (A*, BFS, FloodFill, SpatialHash, Minimax, Leven)  │
└───────────────────────────────────────────────────────────────────────────┘
```

See the full [Architecture Guide](docs/architecture.md) for architectural boundaries and dependency rules.

---

## Deterministic Game Engine

The game loop utilizes the classic **fixed-timestep accumulator pattern** (`engine/GameLoop.ts`):

```typescript
// Fixed simulation tick interval: 60Hz (16.67ms)
const FIXED_DT = 1 / 60;
const MAX_FRAME_DELTA = 0.25; // Prevents "spiral of death" lag spikes

private tick = (): void => {
  if (!this.isRunning) return;

  const now = performance.now();
  let frameDelta = (now - this.lastTime) / 1000;
  this.lastTime = now;

  // Clamp lag spikes when switching browser tabs
  if (frameDelta > MAX_FRAME_DELTA) {
    frameDelta = MAX_FRAME_DELTA;
  }

  if (!this.isPaused) {
    this.accumulator += frameDelta;

    // Execute exact discrete simulation steps
    while (this.accumulator >= FIXED_DT) {
      this.onUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }
  }

  // Render after simulation is up to date
  this.onRender();
  this.rafId = requestAnimationFrame(this.tick);
};
```

Read the full [Engine Internals Document](docs/engine.md) for detailed analysis of `GameSession`, `InputManager`, and `PixelRenderer`.

---

## Mathematical Core

ARCADE_ includes zero-dependency mathematics modules in `core/math/`:

| Module | Location | Primary Mechanics / Applications |
|---|---|---|
| **Vector2** | `core/math/vector.ts` | 2D kinematics, dot product, scalar cross product, projection, reflection (`R = V - 2(V·N)N`), lerp |
| **AABB & Geometry** | `core/math/geometry.ts` | Axis-aligned bounding box collision, circle-to-circle, circle-to-AABB contact normal resolution |
| **Matrix2 & Rotation** | `core/math/matrix.ts` | 2x2 linear transformation matrices, discrete $N \times N$ matrix rotation for Tetris SRS |
| **Mulberry32 PRNG** | `core/math/random.ts` | 32-bit state deterministic pseudo-random number generator, Fisher-Yates array shuffle |
| **ValueNoise** | `core/math/noise.ts` | 1D and 2D seeded gradient value noise for procedural terrain, vines, and moss |
| **ObjectPool** | `core/math/pool.ts` | Fixed-capacity reusable object pool eliminating garbage collection stutter in hot paths |
| **Distance Metrics** | `core/math/distance.ts` | Manhattan ($L_1$), Euclidean ($L_2$), and Chebyshev ($L_\infty$) distance functions |

Read the [Mathematics Reference](docs/mathematics.md) for full LaTeX formulas and derivations.

---

## Algorithmic Systems

Core algorithms located in `core/algorithms/`:

- **A\* Pathfinding (`aStar.ts`):** 4-way grid pathfinding with Manhattan distance heuristic for intelligent AI chasers.
- **Breadth-First Search (`bfs.ts`):** Unweighted shortest path calculation used in maze navigation and Snake autopilot.
- **Iterative Flood Fill (`floodFill.ts`):** Stack-safe queue traversal for contiguous tile clearing (Minesweeper, Match-3).
- **Spatial Hash Grid (`spatialHash.ts`):** $O(k)$ average-case broad-phase collision lookup for bullet hells and particle systems.
- **Minimax with $\alpha$-$\beta$ Pruning (`minimax.ts`):** Recursive game-tree exploration for turn-based strategy AI.
- **Cellular Automata (`cellularAutomata.ts`):** Conway B3/S23 Life rules, cave smoothing, and fire propagation.
- **Space-Optimized Levenshtein (`levenshtein.ts`):** $O(\min(N, M))$ memory edit distance for fuzzy cartridge search.

Read the [Algorithms Guide](docs/algorithms.md) for complexity analysis and implementation details.

---

## Audio Synthesis

ARCADE_ downloads zero audio files (MP3, WAV, OGG). The sound system (`engine/audio/AudioManager.ts`) creates real-time procedural sound effects using the browser's native **Web Audio API**:

- **Oscillators:** Square waves for 8-bit retro chip tones, Sawtooth for explosions/lasers, Triangle for melodious cues.
- **Dynamic Envelopes:** Attack-Decay-Sustain-Release (ADSR) shaping via exponential gain ramps.
- **Pitch Sweeps:** Frequency sliding (`exponentialRampToValueAtTime`) for laser blasts, jumping arcs, and falling drops.
- **Autoplay Handling:** Lazy initialization on the first user interaction to comply with modern browser autoplay policies.

Read the [Audio System Document](docs/audio.md) for synth presets and audio architecture.

---

## Input & Mobile Controls

The input system abstracts hardware events into standardized `GameAction` enums:
- **Keyboard:** WASD + Arrow keys, Space/X (Primary Action), Shift/C (Secondary Action), P (Pause), R (Restart).
- **Mobile Touch Controls:** Responsive virtual D-Pad and dual action buttons rendered directly inside `components/game/GameShell.tsx`.
- **Gamepads:** Standard Gamepad API polling for directional and action buttons.

Read the [Input & Controls Document](docs/input.md) for keymapping and touch HUD design.

---

## Search Engine

The client-side search engine (`lib/search/searchGames.ts`) matches queries across 60 cartridges with instant multi-attribute ranking:

$$\text{Score} = w_{\text{name}} S_{\text{name}} + w_{\text{platform}} S_{\text{platform}} + w_{\text{genre}} S_{\text{genre}} + w_{\text{desc}} S_{\text{desc}} + w_{\text{tag}} S_{\text{tag}} + w_{\text{year}} S_{\text{year}}$$

Exact name matches receive a $+0.2$ priority bonus, and token queries are evaluated with fuzzy Levenshtein similarity.

Read the [Search Engine Document](docs/search.md) for tokenization rules and scoring weights.

---

## Game Library Catalogue

ARCADE_ features **60 playable cartridges** across 8 genres:

| Slug | Name | Platform | Genre | Key Mathematical Concept |
|---|---|---|---|---|
| `hotlap` | Hotlap | Arcade | Racing | 2D vector tire kinematics ($v_{\text{long}}, v_{\text{lat}}$), Catmull-Rom spline projection, ghost telemetry |
| `tetris` | Tetris | Game Boy | Puzzle | Discrete $N \times N$ matrix rotation, Super Rotation System (SRS) wall kicks |
| `snake` | Snake | Arcade | Action | Discrete lattice queue, Manhattan distance, BFS autopilot |
| `breakout` | Breakout | Arcade | Physics | Continuous vector reflection $\mathbf{R} = \mathbf{V} - 2(\mathbf{V}\cdot\mathbf{N})\mathbf{N}$, swept AABB collision |
| `pong` | Pong | Arcade | Arcade | Linear paddle deflection mapping, kinematic acceleration curves |
| `minesweeper` | Minesweeper | Handheld | Strategy | Moore neighborhood adjacency, iterative queue flood fill |
| `space-defender` | Space Defender | Arcade | Shooter | Wave step-down kinematics, AABB projectile interception |
| `asteroid-field` | Asteroid Field | Arcade | Physics | Angular inertia, toroidal wrap-around topology, momentum conservation |
| `alien-swarm` | Alien Swarm | Arcade | Shooter | Trigonometric sine-wave dive paths, particle projectile pooling |
| `laser-grid` | Laser Grid | Arcade | Puzzle | Discrete raycasting, orthogonal beam deflection |
| `maze-chaser` | Maze Chaser | Arcade | Action | Grid intersection decision trees, Manhattan pursuit AI |
| `road-hopper` | Road Hopper | Arcade | Action | Multi-lane velocity lanes, discrete step-based hopping |
| `star-formation` | Rail Storm | Arcade | Shooter | Parametric Bézier curve swoops, radial bullet bursts |
| `bomb-grid` | Bomb Grid | NES | Action | Cross-pattern orthogonal explosion rays, destructible tile maps |
| `peg-blast` | Peg Blast | Arcade | Puzzle | Ballistics trajectories, circle-peg elastic restitution |
| `cave-hunter` | Cave Hunter | Arcade | Action | Subterranean gravity kinematics, rope swinging pendulum physics |
| `donkey-climb` | Donkey Climb | Arcade | Platformer | Inclined ramp kinematics, rolling barrel projectile gravity |
| `marble-rush` | Marble Rush | Arcade | Puzzle | Tangent rail physics, match-3 topological grouping |
| `velocity-rush` | Velocity Rush | NES | Platformer | Variable jump height via release-clamped velocity, momentum dampening |
| `pixel-quest` | Pixel Quest | NES | Platformer | Tilemap collision resolution, enemy patrol state machines |
| `ray-sector` | Ray Sector | Arcade | Shooter | 2.5D DDA raycasting, endless concentric corridor loops, line-of-sight opponent AI |
| `pixel-brawl` | Pixel Brawl | Arcade | Fighting | Hitbox vs Hurtbox frame windows, state-machine combat |
| `pixel-circuit` | Pixel Kart | NES | Racing | Longitudinal/lateral drift decomposition, mini-turbos, slipstream drafting |
| `2048` | 2048 | Arcade | Puzzle | Array slide-and-merge compaction, powers-of-two arithmetic |
| `lights-out` | Lights Out | Handheld | Puzzle | GF(2) linear algebra matrix state flips |
| `match-3` | Match-3 | Arcade | Puzzle | 2D matrix pattern recognition, gravity-cascade drop logic |
| `sliding-puzzle` | Sliding Puzzle | Handheld | Puzzle | Inversion count parity validation (15-puzzle solvability) |
| `maze-runner` | Maze Runner | Arcade | Puzzle | Recursive backtracker maze generation, A\* pathfinding |
| `pipe-connect` | Pipe Connect | Arcade | Puzzle | Graph connectivity validation, BFS fluid propagation |
| `sudoku` | Sudoku | Handheld | Puzzle | Constraint satisfaction backtracking solver, 9x9 box partitioning |
| `gravity-flip` | Gravity Flip | Arcade | Action | Instantaneous gravity sign inversion $\mathbf{g}' = -\mathbf{g}$ |
| `ball-drop` | Ball Drop | Arcade | Physics | Galton board normal distribution approximation |
| `rope-swing` | Rope Swing | Arcade | Physics | Verlet integration, distance constraint resolution |
| `magnet-run` | Magnet Run | Arcade | Physics | Inverse-square magnetic force calculation $F \propto 1/r^2$ |
| `newtons-box` | Newton's Box | Arcade | Physics | Conservation of linear momentum, elastic impulse collision |
| `ricochet` | Ricochet | Arcade | Physics | Multi-surface specular reflection ray tracing |
| `twin-stick-arena` | Twin Stick Arena | Arcade | Shooter | Dual polar coordinate targeting, spatial hash broadphase |
| `bullet-garden` | Bullet Garden | Arcade | Shooter | Parametric bullet curtains, polar pattern generation |
| `boss-reactor` | Void Vanguard | Arcade | Shooter | Multi-phase boss finite state machine (FSM), radial lasers |
| `drone-swarm` | Drone Swarm | Arcade | Shooter | Craig Reynolds boid steering (Separation, Alignment, Cohesion) |
| `missile-command` | Missile Command | Arcade | Shooter | Vector intercept trajectories, expanding explosive shockwaves |
| `pixel-jumper` | Pixel Jumper | Arcade | Platformer | Parabolic jump curves, procedural vertical platform generation |
| `wall-runner` | Wall Runner | Arcade | Platformer | Wall-slide friction damping, wall-jump directional impulses |
| `cave-escape` | Cave Escape | Arcade | Platformer | Procedural terrain scrolling, upward thrust kinematics |
| `shadow-runner` | Shadow Runner | Arcade | Action | Dynamic 2D shadow ray projection and visibility polygons |
| `connect-four` | Connect Four | Arcade | Strategy | Minimax tree search, diagonal bitmask line evaluation |
| `tic-tac-toe-plus` | Tic-Tac-Toe+ | Arcade | Strategy | Complete game-tree traversal, optimal minimax AI |
| `reversi` | Reversi | Arcade | Strategy | 8-directional flank evaluation, positional corner weighting |
| `tower-defense` | Tower Defense | Arcade | Strategy | Dijkstra distance maps, continuous target angle tracking |
| `cell-colony` | Cell Colony | Arcade | Strategy | Microbial node graph expansion, exponential spore swarms, resource allocation |
| `pool-simulator` | Pool Simulator | Arcade | Physics | 2D rigid-body circle collisions, cue impulse vectors, rotational friction |
| `infinite-forest` | Tractor Mulcher | Arcade | Action | ValueNoise terrain heightmaps, carbide grinder wood shredding, projectile splinter ballistics |
| `time-loop` | Circuit Lab | Handheld | Puzzle | Ohm's Law ($V = IR$), RC time constants ($\tau = RC$), NE555 multivibrator logic |
| `fire-spread` | Inferno Strike | Arcade | Action | Aerial fire retardant dispersal physics, chemical flame suppression barriers |
| `liquid-cells` | Liquid Cells | Arcade | Physics | Cellular fluid dynamics, lateral pressure equalization |
| `omega-run` | Omega Run | Arcade | Platformer | Infinite speed acceleration curves, procedural obstacle layout |
| `sokoban` | Sokoban | Arcade | Puzzle | Push mechanics, state-space search, undo history stack |
| `logic-gates` | Logic Gates | Arcade | Puzzle | Boolean logic gate evaluation (AND, OR, NOT, XOR, NAND, NOR) |
| `diamond-run` | Diamond Run | Handheld | Platformer | Gem collection mechanics, multi-layer platform collision |
| `brick-stack` | Brick Stack | Arcade | Physics | Center-of-mass overhang calculations, dynamic stacking physics |

---

## Project Structure

```text
c:\1337\arcade_\
├── app/                        # Next.js 16 App Router pages & metadata
│   ├── about/                  # Platform documentation & tech stack page
│   ├── case-studies/           # Technical engineering deep-dives
│   ├── faq/                    # Engineering & design FAQ
│   ├── games/[slug]/           # Dynamic cartridge route (GameShell host)
│   ├── privacy/                # Privacy policy (acknowledges Vercel Analytics)
│   ├── terms/                  # Terms of service (MIT License)
│   ├── layout.tsx              # Root HTML shell & analytics injection
│   └── page.tsx                # Homepage arcade floor & search hero
├── components/                 # Reusable React components
│   ├── arcade/                 # Hero, CartridgeCard, Grid, Featured
│   ├── game/                   # GameShell, MobileControls, SteamOverlay
│   ├── layout/                 # SiteHeader, SiteFooter, BreadcrumbTrail
│   └── ui/                     # Badges, Tooltips, Buttons
├── core/                       # Core mathematical & algorithmic libraries
│   ├── algorithms/             # A*, BFS, Minimax, Levenshtein, SpatialHash
│   ├── constants/              # Simulation timing (60Hz), Search weights
│   ├── math/                   # Vector2, AABB, Matrix2, RandomSource, Noise
│   ├── types/                  # TypeScript interfaces for games & math
│   └── utils/                  # String helpers, math clamps, formatters
├── data/                       # Static definitions (FAQ, categories)
├── docs/                       # Comprehensive technical documentation
│   ├── adr/                    # Architecture Decision Records (ADRs)
│   ├── architecture.md         # System architecture & boundary guide
│   ├── engine.md               # Custom engine runtime internals
│   ├── mathematics.md          # Mathematical formulas & derivations
│   ├── algorithms.md           # Algorithm complexity & design
│   ├── rendering.md            # Canvas 2D pixel pipeline
│   ├── input.md                # Input normalization & mobile controls
│   ├── audio.md                # Web Audio synthesis architecture
│   ├── adding-games.md         # Tutorial for creating new cartridges
│   ├── testing.md              # Vitest test suite documentation
│   ├── performance.md          # Optimization & memory management
│   ├── limitations.md          # Project boundaries & constraints
│   └── ...                     # Additional deep-dive docs
├── engine/                     # Framework-agnostic 2D engine runtime
│   ├── audio/                  # AudioManager (Web Audio synth)
│   ├── debug/                  # Performance profiler
│   ├── input/                  # InputManager (keybindings & triggers)
│   ├── particles/              # Universal ParticleSystem & floating text
│   ├── rendering/              # CanvasRenderer, PixelRenderer, Renderer API
│   ├── GameContext.ts          # Dependency injection container
│   ├── GameEngine.ts           # Engine orchestrator
│   ├── GameLoop.ts             # 60Hz fixed accumulator loop
│   └── GameSession.ts          # State machine & scoring session
├── games/                      # Individual game implementations
│   ├── definitions/            # Static metadata definitions (60 files)
│   ├── {gameName}/             # Game cartridge logic classes
│   ├── registry.ts             # Authoritative single-source-of-truth registry
│   └── types.ts                # GameInstance and GameDefinition interfaces
├── lib/                        # Services and utilities
│   ├── analytics/              # Telemetry event dispatcher
│   ├── featured/               # Deterministic Weekly/Daily game pickers
│   ├── search/                 # Multi-attribute fuzzy search ranker
│   ├── seo/                    # Metadata & JSON-LD schema generators
│   └── storage/                # Versioned localStorage abstraction
├── tests/                      # Automated Vitest test suite
│   ├── engine/                 # GameLoop & session tests
│   ├── games/                  # Isolated game logic unit tests
│   ├── search/                 # Search ranking & fuzzy matching tests
│   ├── smoke/                  # 60 cartridge initialization smoke tests
│   └── unit/                   # Vector2, AABB, Math, and Algorithms tests
├── package.json                # Dependencies, scripts, and project metadata
├── tsconfig.json               # Strict TypeScript configuration
└── vitest.config.ts            # Test runner configuration
```

---

## Getting Started

### Prerequisites
- **Node.js:** v18.17.0+ or v20.x+
- **npm:** v9.x+

### Installation

```bash
# Clone the repository
git clone https://github.com/slythnox/Arcade_.git
cd Arcade_

# Install dependencies
npm install

# Launch local development server (Turbopack enabled)
npm run dev
```

Visit **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## Adding a New Game

Follow the 5-step process to add a new game cartridge:

1. **Create the Game Class:** Create `games/{name}/{PascalCaseName}Game.ts` implementing `GameInstance`.
2. **Create the Definition:** Create `games/definitions/{name}.ts` exporting a `GameDefinition` with metadata, controls, SEO, and mathematical explanation.
3. **Register the Cartridge:** Import your definition in `games/registry.ts` and append it to `gameRegistry`.
4. **Write a Smoke Test:** Add a test case in `tests/smoke/allGames.smoke.test.ts` to ensure clean lifecycle initialization.
5. **Verify:** Run `npm run typecheck` and `npm test`.

See the complete, copy-pasteable guide in [Adding a Game Tutorial](docs/adding-games.md).

---

## Testing & Quality Assurance

ARCADE_ maintains an automated test suite powered by [Vitest](https://vitest.dev/):

```bash
# Run all unit, game logic, and smoke tests
npm test

# Run TypeScript compiler check (strict mode)
npm run typecheck

# Run production build validation
npm run build
```

The test suite covers:
- **60 Cartridge Smoke Tests:** Instantiates, initializes with mock `GameContext`, ticks update loops, renders, and verifies clean `destroy()` cleanup for all 60 games.
- **Input Robustness Smoke Tests:** Simulates all `GameAction` triggers against each game to prevent unhandled exceptions.
- **Vector & Geometric Tests:** Projections, reflections, AABB containment, circle intersection normal resolution.
- **Mathematical & Algorithmic Tests:** A\*, BFS, FloodFill, Levenshtein distance, Matrix rotations, and PRNG distributions.

Read the [Testing Documentation](docs/testing.md) for testing patterns and mock context helpers.

---

## Documentation Index

Explore the complete technical documentation suite in the [`docs/`](docs/) directory:

- 🏛️ **[System Architecture](docs/architecture.md):** Application boundaries, data flow, and dependency direction.
- ⚙️ **[Engine Internals](docs/engine.md):** Fixed timestep accumulator, GameSession state, and CanvasRenderer.
- 📐 **[Mathematical Reference](docs/mathematics.md):** Formal formulas for kinematics, reflections, PRNG, and matrices.
- 🧠 **[Algorithmic Systems](docs/algorithms.md):** A\*, BFS, Minimax, Spatial Hashing, and Cellular Automata.
- 🎨 **[Rendering Pipeline](docs/rendering.md):** Pixel quantization grid, CRT effects, and canvas optimization.
- 🎮 **[Input Architecture](docs/input.md):** Key mappings, action normalization, and mobile touch D-Pad.
- 🔊 **[Audio Synthesis](docs/audio.md):** Web Audio API oscillators, ADSR envelopes, and chip presets.
- 📦 **[Game Loading & Splitting](docs/game-loading.md):** Next.js dynamic imports, bundle size, and chunk isolation.
- ⚡ **[Performance Engineering](docs/performance.md):** Zero-allocation loops, object pooling, and profiler tools.
- 🎲 **[Determinism & PRNG](docs/determinism.md):** Mulberry32 implementation, seed hashing, and replay systems.
- 🌲 **[Procedural Generation](docs/procedural-generation.md):** ValueNoise terrain, cave generation, and particle systems.
- 🔍 **[Search Engine](docs/search.md):** Multi-attribute weighted ranking and Levenshtein similarity.
- 💾 **[Local Storage & State](docs/storage.md):** Versioned local storage, high scores, and settings.
- 🌐 **[SEO & Metadata](docs/seo.md):** Dynamic OpenGraph generation and JSON-LD structured data.
- ♿ **[Accessibility](docs/accessibility.md):** Keyboard navigation, contrast ratios, and canvas limitations.
- 🧪 **[Testing Strategy](docs/testing.md):** Unit testing, mock contexts, and smoke test suites.
- 📁 **[Project Structure](docs/project-structure.md):** Comprehensive file and directory breakdown.
- 🛠️ **[Configuration Reference](docs/configuration.md):** TSConfig, Next.js, and Vitest configuration.
- 🚀 **[Deployment Guide](docs/deployment.md):** Production builds, static optimization, and Vercel hosting.
- ➕ **[Adding a Game](docs/adding-games.md):** Complete tutorial for writing and registering new cartridges.
- 🔬 **[Adding a Lab](docs/adding-labs.md):** Guide for mathematical simulations and experiments.
- ⚠️ **[Known Limitations](docs/limitations.md):** Honest architectural constraints and trade-offs.
- 🖼️ **[Asset Guidelines](docs/assets.md):** Pixel art standards, thumbnails, and rasterization rules.
- 🎨 **[Design System](docs/design-system.md):** Retro color palettes, CRT effects, and typography.
- 📜 **[Architecture Decision Records (ADRs)](docs/adr/):** Historical design choices (ADR-001 through ADR-005).

---

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](CONTRIBUTING.md) and [Security Policy](SECURITY.md) before submitting pull requests.

---

## License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.
