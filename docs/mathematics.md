# Engine Mathematics

This reference outlines the core mathematical formulas and algorithms driving ARCADE_.

## Vector Reflection
**Problem:** Calculating bounce trajectories off flat surfaces (paddles, walls).
**Formula:** `r = v - 2(v·n)n`
**Used In:** Breakout, Pong, Ricochet.
**Code Reference:** `core/math/vector.ts` -> `Vector2.reflect()`
```typescript
public reflect(normal: Vector2): Vector2 {
  const n = normal.normalize();
  const d = this.dot(n);
  return this.sub(n.scale(2 * d));
}
```

## AABB Intersection Test
**Problem:** Fast, simple collision detection for axis-aligned rectangles.
**Formula:** `Ax < Bx + Bw` AND `Ax + Aw > Bx` AND `Ay < By + Bh` AND `Ay + Ah > By`
**Used In:** Most 2D grid games, basic platformers.

## Circle/AABB Closest-Point Test
**Problem:** Accurate collisions between a circular projectile (ball) and a rectangle (paddle/brick).
**Formula:** Clamp the circle's center coordinates to the box's edges to find the closest point, then check if distance is less than radius.
**Used In:** Breakout, Cannonball.

## Tetris SRS Matrix Rotation
**Problem:** Rotating polyomino grids 90 degrees while managing wall kicks.
**Formula:** `R_{CW}(M)_{i,j} = M_{N-1-j,i}`
**Used In:** Tetris, Block puzzle derivatives.
**Code Reference:** `core/math/matrix.ts`

## Mulberry32 State Update
**Problem:** Deterministic, seeded random number generation.
**Formula:**
```typescript
let t = (this.state += 0x6d2b79f5);
t = Math.imul(t ^ (t >>> 15), t | 1);
t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
```
**Used In:** Everywhere relying on PRNG.
**Code Reference:** `core/math/random.ts`

## Levenshtein Edit Distance
**Problem:** Fuzzy searching the game library.
**Formula:** Recurrence relation checking substitution, insertion, and deletion costs.
**Used In:** `weightedSearch.ts` for Game Registry lookups.
**Code Reference:** `core/algorithms/levenshtein.ts`

## A* Heuristic
**Problem:** Finding the shortest path efficiently on a grid.
**Formula:** `f(n) = g(n) + h(n)` (using Manhattan Distance `|x1 - x2| + |y1 - y2|` as the heuristic).
**Used In:** Maze Runner, Tower Defense AI.
**Code Reference:** `core/algorithms/aStar.ts`

## Cellular Automaton
**Problem:** Procedural cave or life generation.
**Formula:** B3/S23 (Conway's Life) - Born on 3 neighbors, Survives on 2 or 3 neighbors.
**Used In:** Cell Colony, Procedural terrain mappers.
**Code Reference:** `core/algorithms/cellularAutomata.ts`

## Steering Behaviors
**Problem:** Simulating natural flocking and swarming movement.
**Formula:** Weighted summation of Separation, Alignment, and Cohesion vectors.
**Used In:** Drone Swarm, Alien Swarm.
