<div align="center">

# 🕹️ THE ARCADE_
### *A Mathematical, Zero-Dependency Retro Arcade Platform & Game Engine*

```
 ▄████████  ▄████████   ▄████████    ▄████████ ████████▄     ▄████████    ▄█ 
███    ███ ███    ███  ███    ███   ███    ███ ███   ▀███   ███    ███   ███ 
███    ███ ███    █▀   ███    █▀    ███    ███ ███    ███   ███    █▀    ███ 
███    ███ ███         ███          ███    ███ ███    ███  ▄███▄▄▄       ███ 
██████████ ███         ███        ▀███████████ ███    ███ ▀▀███▀▀▀       ███ 
███    ███ ███    █▄   ███    █▄    ███    ███ ███    ███   ███    █▄    ███ 
███    ███ ███    ███  ███    ███   ███    ███ ███   ▄███   ███    ███   ███ 
███    █▀  ████████▀   ████████▀    ███    █▀  ████████▀    ██████████   █▀  
```

**84 Playable Cartridges • Custom 60Hz Physics Engine • Pure TypeScript • Zero External Game Frameworks**

---

[![Next.js](https://img.shields.io/badge/Next.js-16.3-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vitest](https://img.shields.io/badge/Vitest-61_Tests_Passing-6E9F18?style=for-the-badge&logo=vitest&logoColor=white)](https://vitest.dev/)
[![HTML5 Canvas 2D](https://img.shields.io/badge/Renderer-HTML5_Canvas_2D-EA4335?style=for-the-badge&logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)
[![Web Audio API](https://img.shields.io/badge/Sound-Realtime_Web_Audio_Synthesis-FBBC05?style=for-the-badge&logo=webaudio&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API)
[![Deterministic Core](https://img.shields.io/badge/Simulation-60Hz_Fixed_Accumulator-34A853?style=for-the-badge)](https://en.wikipedia.org/wiki/Delta_timing)
[![License: MIT](https://img.shields.io/badge/License-MIT-4da3ff?style=for-the-badge)](LICENSE)

[Platform Overview](#-platform-overview) • [System Architecture](#-system-architecture) • [Engine Deep Dive](#-engine-deep-dive) • [Math & Physics](#-mathematics--physics-foundations) • [Algorithms](#-algorithms-in-action) • [The 84-Cartridge Library](#-the-84-cartridge-library) • [Getting Started](#-getting-started)

---

</div>

## 🌐 Platform Overview

**ARCADE_ is not a ROM emulator and does not rely on third-party game frameworks** (such as Phaser, PixiJS, Babylon, or Three.js).

Every single game cartridge in ARCADE_ is built from mathematical first principles in **pure TypeScript**, rendered via **HTML5 Canvas 2D**, and backed by real-time **procedural Web Audio API sound synthesis**.

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                               WHY DOES ARCADE_ EXIST?                                   │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│ Most web games today are black boxes: packaged ROMs running inside bloated WebAssembly  │
│ emulators, or heavy generic engines downloading megabytes of third-party dependencies. │
│                                                                                         │
│ ARCADE_ was engineered to prove that high-performance, beautiful, deterministic retro   │
│ simulations can be built from mathematical first principles using transparent, pure     │
│ TypeScript with 0 external game dependencies.                                           │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

### Core Engineering Invariants

1. **Zero External Game Framework Dependencies**: The engine loop, math library, physics integrators, and rendering systems are 100% custom-crafted.
2. **Fixed 60Hz Accumulator Simulation**: Game physics ticks run at deterministic $\Delta t = \frac{1}{60\text{ s}}$ ($16.666\text{ ms}$) regardless of whether the user plays on a 60Hz, 144Hz, or 240Hz monitor.
3. **Seeded Determinism**: Mulberry32 pseudo-random number generation ensures reproducible procedural generation and deterministic gameplay replays.
4. **Decoupled Simulation & UI**: React and Next.js handle outer routing and UI; simulation state is strictly isolated from the React DOM lifecycle.
5. **Procedural Sound Synthesis**: Zero `.mp3` or `.wav` asset downloads. Sound effects are synthesized in real-time via square, triangle, and noise oscillators with custom ADSR envelopes.

---

## 🏛️ System Architecture

ARCADE_ employs a strict three-tier unidirectional architecture ensuring deterministic simulation and high-performance canvas throughput.

```text
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                                     ARCADE_ ENGINE                                      │
├──────────────────────────┬─────────────────────────────┬────────────────────────────────┤
│       INPUT TIER         │       SIMULATION TIER       │          RENDER TIER           │
│   (Event Normalizer)     │      (60Hz Fixed Loop)      │     (Pixel Canvas Pipeline)    │
├──────────────────────────┼─────────────────────────────┼────────────────────────────────┤
│                          │                             │                                │
│   Keyboard / Touch / Pad │   ┌──────────────────────┐  │   ┌────────────────────────┐   │
│            │             │   │    GameLoop (60Hz)   │  │   │     PixelRenderer      │   │
│            ▼             │   │   Fixed Accumulator  │  │   │  Integer Snap Blitting │   │
│   ┌──────────────────┐   │   └──────────┬───────────┘  │   └───────────▲────────────┘   │
│   │   InputManager   │   │              │              │               │                │
│   │ Normalizes keys  ├───┼──────────────┼──────────────┼───────────────┘                │
│   │ to GameActions   │   │              ▼              │   Canvas2D Buffer Context      │
│   └──────────────────┘   │   ┌──────────────────────┐  │                                │
│                          │   │  GameInstance (Game) │  │                                │
│                          │   │  • Pure Math / State │  │                                │
│                          │   │  • Collision Engine  │  │                                │
│                          │   │  • Spatial Hash / AI │  │                                │
│                          │   └──────────┬───────────┘  │                                │
│                          │              │              │                                │
│                          │              ▼              │                                │
│                          │   ┌──────────────────────┐  │                                │
│                          │   │     AudioManager     │  │                                │
│                          │   │  Web Audio Synthesis │  │                                │
│                          │   └──────────────────────┘  │                                │
└──────────────────────────┴─────────────────────────────┴────────────────────────────────┘
```

### Unidirectional Execution Lifecycle

```
[Hardware Event] ──► [InputManager] ──► [GameAction Normalized] ──► [Fixed Accumulator (dt=1/60s)]
                                                                           │
                                                                           ▼
[Canvas 2D Display] ◄── [PixelRenderer] ◄── [State Updated] ◄── [GameInstance.update(dt)]
```

---

## ⚡ Engine Deep Dive

### 1. Deterministic Fixed-Timestep Loop (`engine/GameLoop.ts`)

Variable delta time ($\Delta t = \text{now} - \text{last}$) causes tunneling, inconsistent jumping physics, and uneven difficulty between devices. ARCADE_ solves this using a **fixed accumulator pattern**:

```typescript
// engine/GameLoop.ts
private tick = (): void => {
  if (!this.isRunning) return;

  const now = performance.now();
  let frameDelta = (now - this.lastTime) / 1000;
  this.lastTime = now;

  // Clamp frame delta to prevent the "spiral of death" on tab resume
  if (frameDelta > MAX_FRAME_DELTA) {
    frameDelta = MAX_FRAME_DELTA;
  }

  if (!this.isPaused) {
    this.accumulator += frameDelta;

    // Fixed timestep simulation steps: updates at exact 60Hz (dt = 1/60s)
    while (this.accumulator >= FIXED_DT) {
      this.onUpdate(FIXED_DT);
      this.accumulator -= FIXED_DT;
    }
  }

  // Render pass executes on screen V-Sync
  this.onRender();
  this.rafId = requestAnimationFrame(this.tick);
};
```

### 2. Zero-Allocation Object Pool (`core/math/pool.ts`)

In bullet-hell shooters and particle simulations, allocating thousands of `Vector2` instances per second triggers heavy garbage collection pauses. ARCADE_ uses a generic object recycling pool:

```typescript
// core/math/pool.ts
export class ObjectPool<T> {
  private readonly pool: T[];
  private readonly active: Set<T>;

  public acquire(): T {
    const obj = this.pool.pop() ?? this.create();
    this.active.add(obj);
    return obj;
  }

  public release(obj: T): void {
    if (!this.active.has(obj)) return;
    this.active.delete(obj);
    this.reset(obj);
    this.pool.push(obj);
  }
}
```

### 3. Spatial Partitioning Hash Grid (`core/algorithms/spatialHash.ts`)

Naive collision testing between $N$ entities is $O(N^2)$. ARCADE_'s spatial hash divides the 2D world into discrete grid cells using a Cantor pairing function, achieving **average-case $O(k)$ constant-time queries**:

```typescript
// core/algorithms/spatialHash.ts
export class SpatialHash<T extends Positioned> {
  private cellKey(cx: number, cy: number): number {
    return ((cx + cy) * (cx + cy + 1)) / 2 + cy;
  }

  public query(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.cells.get(this.cellKey(cx, cy));
        if (cell) {
          for (const entity of cell) {
            if (this.distSq(entity, x, y) <= radius * radius) results.push(entity);
          }
        }
      }
    }
    return results;
  }
}
```

### 4. Real-time Web Audio Synthesizer (`engine/audio/AudioManager.ts`)

Sound effects are synthesized procedurally in real-time without audio files:

```typescript
// Procedural coin pickup sound using exponential frequency sweep
public playCoin(): void {
  const osc = this.ctx.createOscillator();
  const gain = this.ctx.createGain();
  osc.type = "square";
  osc.frequency.setValueAtTime(987.77, this.ctx.currentTime); // B5
  osc.frequency.setValueAtTime(1318.51, this.ctx.currentTime + 0.08); // E6
  gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.35);
  osc.connect(gain);
  gain.connect(this.ctx.destination);
  osc.start();
  osc.stop(this.ctx.currentTime + 0.35);
}
```

---

## 📐 Mathematics & Physics Foundations

### 1. Vector Reflection ($L_2$ Space)
Used in **Breakout**, **Pong**, **Ricochet**, and **Mirror Maze**:

$$\mathbf{r} = \mathbf{v} - 2(\mathbf{v} \cdot \hat{\mathbf{n}})\hat{\mathbf{n}}$$

```typescript
// core/math/vector.ts
public reflect(normal: Vector2): Vector2 {
  const n = normal.normalize();
  const d = this.dot(n);
  return this.sub(n.scale(2 * d));
}
```

### 2. Super Rotation System (SRS) Matrix Rotations
Used in **Tetris** for discrete $N \times N$ matrix transposition and horizontal reflection:

$$R_{\text{CW}}(M)_{i,j} = M_{N - 1 - j, \, i}$$

```typescript
// core/math/matrix.ts
export function rotateMatrixCW(matrix: number[][]): number[][] {
  const N = matrix.length;
  const result: number[][] = Array.from({ length: N }, () => new Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
}
```

### 3. Keplerian Gravitational Integration
Used in **Orbital Mechanics** and **Gravity Well**:

$$\mathbf{a} = -\frac{G \cdot M}{\|\mathbf{r}\|^3} \mathbf{r}, \quad \mathbf{v}_{t+\Delta t} = \mathbf{v}_t + \mathbf{a}\Delta t, \quad \mathbf{x}_{t+\Delta t} = \mathbf{x}_t + \mathbf{v}_{t+\Delta t}\Delta t$$

### 4. Hooke's Law Elastic Spring Forces & Verlet Integration
Used in **Spring Mass System**:

$$\mathbf{F}_{\text{spring}} = -k(\|\mathbf{x}\| - L_0)\frac{\mathbf{x}}{\|\mathbf{x}\|}, \quad \mathbf{F}_{\text{damping}} = -c\mathbf{v}$$

### 5. Craig Reynolds Boid Steering Vectors
Used in **Predator Prey** and **Alien Swarm**:

$$\mathbf{F}_{\text{total}} = w_s \mathbf{F}_{\text{separation}} + w_a \mathbf{F}_{\text{alignment}} + w_c \mathbf{F}_{\text{cohesion}} + w_e \mathbf{F}_{\text{evasion}}$$

### 6. Deterministic Mulberry32 PRNG
Ensures seeded random generation remains identical across any platform:

```typescript
// core/math/random.ts
let t = (this.state += 0x6d2b79f5);
t = Math.imul(t ^ (t >>> 15), t | 1);
t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
```

---

## 🧠 Algorithms in Action

| Algorithm | Complexity | Purpose & Application in ARCADE_ |
|---|---|---|
| **A\* Pathfinding** | $O((V + E) \log V)$ | Heuristic Manhattan-guided shortest path navigation (**Maze Runner**, **Algorithm Dungeon**). |
| **Breadth-First Search** | $O(V + E)$ | Unweighted shortest path and ring-based exploration comparison. |
| **Iterative Flood Fill** | $O(N \cdot M)$ | Non-recursive queue-based matrix flooding (**Flood Fill**, **Minesweeper**, **Color Flood**). |
| **Minimax ($\alpha$-$\beta$ Pruning)** | $O(b^{d/2})$ | Optimal zero-sum decision tree evaluation (**Chess Mini**, **Checkers**, **Connect Four**). |
| **Cellular Automata (Moore)** | $O(W \cdot H)$ | Subterranean cave excavation and fire spreading (**Cave Generator**, **Fire Spread**, **Sand World**). |
| **Binary Space Partitioning** | $O(N \log N)$ | Recursive spatial bisection for dungeon generation (**Dungeon Generator**). |
| **Wave Function Collapse** | $O(N \cdot K)$ | Superposition entropy collapse with constraint propagation (**Quantum Tiles**). |
| **Genetic Algorithm** | $O(G \cdot P)$ | Locomotion genotype tournament selection, crossover, and mutation (**Evolution Lab**). |
| **Levenshtein Distance** | $O(M \cdot N)$ | Dynamic programming multi-criteria fuzzy search ranking. |

---

## 🕹️ The 84-Cartridge Library

All 84 games are organized into 9 distinct mathematical tiers:

```
TIER 1: Core Classics (10)       TIER 4: Shooters & Bullet Hell (8)  TIER 7: Experimental Simulation (4)
TIER 2: Logic Puzzles (12)       TIER 5: Platformers & Movement (8)  TIER 8: Simulation & Geometry (12)
TIER 3: Physics & Reflex (10)     TIER 6: Strategy & Board Games (8)  TIER 9: Advanced AI & WFC (12)
```

<details open>
<summary><b>Complete Catalog of all 84 Cartridges (Click to Collapse/Expand)</b></summary>

| # | Name | Genre | Mathematical Concept | Algorithm / Engine System |
|---|---|---|---|---|
| **1** | Tetris | Puzzle | Discrete Matrix Rotations | Super Rotation System (SRS) |
| **2** | Snake | Arcade | Discrete Manhattan Grid | FIFO Body Ring Buffer |
| **3** | Breakout | Arcade | Angle of Incidence Reflection | Circle-AABB Contact Normal |
| **4** | Pong | Arcade | Linear Elastic Momentum | Paddle Segment Angle Mapping |
| **5** | Minesweeper | Puzzle | Discrete Neighbor Adjacency | Iterative Zero-Spread Flood Fill |
| **6** | Space Defender | Shooter | Projectile Trajectory | AABB Bounding Box Broad-phase |
| **7** | Asteroid Field | Shooter | Radial Polygon Collision | Inertial Torque & Angular Drag |
| **8** | Alien Swarm | Shooter | Coordinated Parametric Waves | Sinusoidal Grid Matrix Offset |
| **9** | Brick Stack | Reflex | 1D Interval Overlap Clipping | Shrinking Width Truncation |
| **10** | Laser Grid | Puzzle | Line-Segment Intersections | Vector Dot Product Routing |
| **11** | 2048 | Puzzle | Directional Array Compaction | Exponent Base-2 Value Merging |
| **12** | Lights Out | Puzzle | GF(2) Boolean Field Math | Cross Toggle Operator Matrix |
| **13** | Flood Fill | Puzzle | Graph Connected Components | Multi-color Queue Flood Fill |
| **14** | Color Collapse | Puzzle | Contiguous Cluster Detection | Gravity Dropdown Compaction |
| **15** | Match Three | Puzzle | Orthogonal Run Length Encoding | Cascade Gravitational Physics |
| **16** | Sliding Puzzle | Puzzle | Parity Inversion Permutations | Solvability Inversion Counter |
| **17** | Maze Runner | Puzzle | Graph Edge Traversal | Recursive Backtracker Generator |
| **18** | Pipe Connect | Puzzle | Graph Edge Adjacency | Flow Path Validation Search |
| **19** | Sudoku | Puzzle | Latin Square CSP Math | Backtracking Constraint Solver |
| **20** | Nonogram | Puzzle | Discrete Tomography Line Runs | 1D Row/Column Constraint Verifier |
| **21** | 2048 Hex | Puzzle | Hexagonal Axial Coordinates | 6-Way Hex Grid Movement |
| **22** | Number Merge | Puzzle | Proximity Circle Clustering | Value Summation & Growth |
| **23** | Orbital | Physics | Centripetal Acceleration | Euler Numerical Orbit Integrator |
| **24** | Gravity Flip | Platformer | Inverted Vector Gravity | State-Swapped Kinematic Equations |
| **25** | Ball Drop | Physics | Peg Elastic Restitution | Galton Board Probability Math |
| **26** | Rope Swing | Physics | Pendulum Torque Mechanics | Polar Coordinate Acceleration |
| **27** | Particle Lab | Simulation | Brownian Motion & Particle Math | Velocity Damping & Dissipation |
| **28** | Magnet Run | Physics | Inverse-Square Dipole Fields | Magnetic Attraction/Repulsion |
| **29** | Newton's Box | Physics | Conservation of Momentum | Multi-body Elastic Impulse |
| **30** | Ricochet | Reflex | Specular Reflection Normals | Multi-wall Velocity Reflection |
| **31** | Pendulum | Physics | Harmonic Damped Oscillation | Angular Velocity Differential |
| **32** | Cannonball | Physics | Parabolic Ballistic Trajectories | Drag & Gravity Vector Projection |
| **33** | Twin Stick Arena | Shooter | Directional Aim Trigonometry | $360^\circ$ Heading Angle Vectors |
| **34** | Bullet Garden | Shooter | Bullet-Hell Parametric Curvature | Archimedean Spiral Bullet Waves |
| **35** | Meteor Rush | Shooter | Spatial Debris Distribution | Relative Velocity Scaling |
| **36** | Boss Reactor | Shooter | Multi-phase State Machines | Segmented Angular Shield Nodes |
| **37** | Rail Blaster | Shooter | Pseudo-3D Perspective Projection | Depth $Z$-Scaling Math |
| **38** | Drone Swarm | Shooter | Vector Steering Behavior | Predator Avoidance & Cohesion |
| **39** | Target Range | Shooter | Circular Radius Geometry | Distance-from-Center Scoring |
| **40** | Missile Command | Shooter | Intercept Vector Calculus | Radius-of-Explosion Damage Math |
| **41** | Pixel Jumper | Platformer | Sub-pixel Kinematics | Jump Parabola & Variable Height |
| **42** | Wall Runner | Platformer | Normal-Oriented Movement | Wall-Slide Friction Reduction |
| **43** | Dash Runner | Platformer | Impulse Velocity Bursts | Cooldown State Timers |
| **44** | Cave Escape | Platformer | Terrain Boundary Clamping | Obstacle Sweep Collision Test |
| **45** | Ladder Climb | Platformer | Constrained 1D Axis Movement | Multi-tier Ladder Transitions |
| **46** | One Button Jump | Platformer | Rhythm & Timing Windows | Fixed-Velocity Jump Triggers |
| **47** | Shadow Runner | Platformer | Inverse Light Projection | Silhouette Collision Masking |
| **48** | Gravity Maze | Platformer | $90^\circ$ World Orientation Shifts | Matrix World Rotation Transform |
| **49** | Connect Four | Strategy | 4-in-a-Row Diagonal Line Vector | Minimax Heuristic Evaluation |
| **50** | Tic Tac Toe Plus | Strategy | Spatial Line Intersection | Dynamic Board Expansion Logic |
| **51** | Checkers | Strategy | Diagonal Move Matrices | Forced Jump Graph Search |
| **52** | Reversi | Strategy | 8-Directional Flanking Rays | Board Flanking Tile Inversion |
| **53** | Chess Mini | Strategy | 6x6 Simplified Piece Moves | Alpha-Beta Pruning Depth Search |
| **54** | Tower Defense | Strategy | Shortest Path Navigation | Range Circle Target Acquisition |
| **55** | Kingdom Grid | Strategy | Turn-based Resource Optimization | Territory Expansion Economics |
| **56** | Resource Miner | Strategy | Procedural Subterranean Grid | Mining Hardness Energy Decay |
| **57** | Fractal Garden | Simulation | Lindenmayer (L-System) Trees | Recursive Grammatical Geometry |
| **58** | Cell Colony | Simulation | Conway's Game of Life (B3/S23) | Moore Neighborhood Bit Counting |
| **59** | Gravity Well | Simulation | Multi-Body N-Body Problem | Net Gravitational Force Vectors |
| **60** | Neon Circuit | Simulation | Directed Graph Edge Traversal | Discrete Logic Signal Routing |
| **61** | Sand World | Simulation | Falling-Sand Cellular Automata | Multi-material Velocity Settling |
| **62** | Mirror Maze | Puzzle | Ray Tracing & Specular Vectors | 45-Degree Discrete Reflections |
| **63** | Fractal Explorer | Experimental | Mandelbrot Set ($z_{n+1} = z_n^2 + c$) | Escape-Time Complex Iterations |
| **64** | Predator Prey | AI | Craig Reynolds Boid Steering | Separation, Alignment, Cohesion |
| **65** | Evolution Lab | AI | Genetic Algorithm Optimization | Tournament Selection & Crossover |
| **66** | Sokoban | Puzzle | Discrete Grid State Transitions | Move History Stack Undo Engine |
| **67** | Algorithm Dungeon | Experimental | Heuristic vs Unweighted Search | Concurrent BFS vs A* vs Dijkstra |
| **68** | Spring Mass System | Physics | Hooke's Law Elastic Forces | Verlet Numerical Integration |
| **69** | Logic Gates | Puzzle | Boolean Algebra & Truth Tables | Digital Gate Topology Evaluation |
| **70** | Cave Generator | Procedural | Subterranean Automata Smoothing | B5678/S45678 Cellular Smoothing |
| **71** | Voronoi Garden | Geometry | $L_1$ and $L_2$ Distance Metric Fields | Nearest-Seed Metric Tessellation |
| **72** | Dungeon Generator | Procedural | Binary Space Partitioning (BSP) | Recursive Subtree Spatial Split |
| **73** | Ant Colony | AI | Stigmergic Pheromone Diffusion | Pheromone Evaporation Gradient |
| **74** | Orbital Mechanics | Simulation | Keplerian Elliptical Orbits | Gravity Runge-Kutta Integrator |
| **75** | Pool Simulator | Physics | 2D Elastic Sphere Collisions | Restitution & Surface Friction |
| **76** | Infinite Forest | Procedural | 1D Value & Fractal Noise Waves | Deterministic Heightmap Scrolling |
| **77** | Time Loop | Experimental | Temporal Ghost Recording | Frame-by-Frame Deterministic Replay |
| **78** | Hex Territory | Strategy | Axial Coordinate Hexagons | Hex Grid Territory Expansion |
| **79** | Quantum Tiles | Experimental | Wave Function Collapse (WFC) | Entropy Minimization & Collapse |
| **80** | Color Flood | Puzzle | Combinatorial Graph Flooding | Reachability Connected Set Logic |
| **81** | Fire Spread | Simulation | Probabilistic Fire Propagation | Asymmetric Wind Direction Vectors |
| **82** | Liquid Cells | Simulation | Pressure-Driven Fluid Dynamics | Discrete Cellular Fluid Spreading |
| **83** | Circle Packing Lab | Geometry | Tangent Circle Repulsion Forces | Iterative Relaxation Settlement |
| **84** | Omega Run | Platformer | Multi-lane Velocity Projection | Procedural Obstacle Wave Sweeper |

</details>

---

## 🛠️ Getting Started

### Prerequisites
- **Node.js**: `>= 18.0.0`
- **npm**: `>= 9.0.0`

### Installation & Local Development

```bash
# 1. Clone the repository
git clone https://github.com/slythnox/Arcade_.git
cd Arcade_

# 2. Install dependencies
npm install

# 3. Start high-performance development server with Next.js Turbopack
npm run dev
```

Navigate to `http://localhost:3000` in your web browser.

---

## 🚀 Deploying to Vercel

ARCADE_ is built on Next.js 16 and is fully optimized for **instant zero-configuration deployment to Vercel**:

### Option 1: One-Click Vercel Web Import (Recommended)
1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import the repository: **`slythnox/Arcade_`**.
3. Keep default settings (Framework: Next.js, Build Command: `npm run build`, Output Directory: `.next`).
4. Click **Deploy**. Your custom arcade will be live on `https://<your-project>.vercel.app` in under 60 seconds!

### Option 2: Deploy via Vercel CLI
```bash
# Install Vercel CLI globally
npm i -g vercel

# Deploy directly from repository root
vercel
```

---

## 🧪 Testing & Verification

ARCADE_ includes automated testing covering math, algorithms, engine loops, and games:

```bash
# Run Vitest test suites
npm test

# Run strict TypeScript compiler verification (0 errors required)
npm run typecheck

# Run ESLint quality checks
npm run lint

# Build full static production distribution (103 static pages)
npm run build
```

---

## 📖 Architecture Decision Records (ADRs)

Key architectural decisions are documented in [`docs/adr/`](docs/adr/):

- [`ADR-001: Custom Game Engine Over Third-Party Frameworks`](docs/adr/001-custom-engine.md)
- [`ADR-002: Fixed 60Hz Timestep Accumulator Over Variable Delta`](docs/adr/002-fixed-timestep.md)
- [`ADR-003: HTML5 Canvas 2D Over DOM & WebGL Shaders`](docs/adr/003-canvas-over-dom.md)
- [`ADR-004: Compile-Time Static Registry Over Dynamic File Resolution`](docs/adr/004-registry-architecture.md)
- [`ADR-005: Mulberry32 Seeded PRNG Over Math.random()`](docs/adr/005-seeded-randomness.md)

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for details.
