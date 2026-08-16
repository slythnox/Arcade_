# Algorithmic Systems & Complexity Reference

This document details the discrete algorithms, graph search routines, spatial acceleration structures, and heuristic ranking models implemented in `core/algorithms/`.

---

## 1. Summary of Algorithmic Systems

| Algorithm | File | Time Complexity | Space Complexity | Primary Applications |
|---|---|---|---|---|
| **A\* Pathfinding** | `core/algorithms/aStar.ts` | $O(E + V \log V)$ | $O(V)$ | Intelligent AI chasers, Maze Runner |
| **Breadth-First Search** | `core/algorithms/bfs.ts` | $O(V + E)$ | $O(V)$ | Snake BFS autopilot, flood propagation |
| **Iterative Flood Fill** | `core/algorithms/floodFill.ts` | $O(\text{Area})$ | $O(\text{Perimeter})$ | Minesweeper blank cascades, Match-3 |
| **Spatial Hash Grid** | `core/algorithms/spatialHash.ts` | $O(k)$ average | $O(N)$ | Broad-phase bullet/particle collision |
| **Minimax ($\alpha$-$\beta$ Pruning)** | `core/algorithms/minimax.ts` | $O(b^{d/2})$ | $O(d)$ | Connect Four, Tic-Tac-Toe+ AI |
| **Cellular Automata** | `core/algorithms/cellularAutomata.ts` | $O(R \times C)$ | $O(R \times C)$ | Conway Life, Cave generation, Fire spread |
| **Optimized Levenshtein** | `core/algorithms/levenshtein.ts` | $O(N \times M)$ | $O(\min(N, M))$ | Fuzzy search token matching |
| **Multi-Attribute Search** | `core/algorithms/weightedSearch.ts` | $O(T \times G)$ | $O(G)$ | Instant client-side game ranking |

---

## 2. A\* Pathfinding (`core/algorithms/aStar.ts`)

### Mechanism
A\* finds the shortest collision-free path between `start` and `target` coordinates on a 2D discrete lattice using the cost function:

$$f(n) = g(n) + h(n)$$

- $g(n)$: Exact path cost from `start` to node $n$.
- $h(n)$: Admissible heuristic estimate from node $n$ to `target`. ARCADE_ uses the **Manhattan Distance**:

$$h(n) = |n_{\text{col}} - \text{target}_{\text{col}}| + |n_{\text{row}} - \text{target}_{\text{row}}|$$

### Tie-Breaking
When two nodes have identical $f$-scores, the algorithm breaks ties by choosing the node with the lower $h$-score (closer to target), preventing wide exploratory search fans.

---

## 3. Breadth-First Search (`core/algorithms/bfs.ts`)

### Mechanism
Explores the 2D grid in concentric frontier rings using an explicit FIFO queue. Guarantees finding the unweighted shortest path.

### Applications in ARCADE_
- **Snake Autopilot AI:** When enabled via `SHIFT` / `C`, BFS computes the reachability path from the snake's head to the food item on every movement tick.
- **Pipe Connect:** Verifies continuous fluid connection between source and drain tiles.

---

## 4. Iterative Queue Flood Fill (`core/algorithms/floodFill.ts`)

### The Call Stack Problem
Standard recursive flood fill implementations risk exceeding the browser JavaScript call-stack limit (`Maximum call stack size exceeded`) on large grids ($> 100 \times 100$).

### The Iterative Solution
ARCADE_ implements an explicit queue-based flood fill with visited hash-set tracking:

```typescript
export function iterativeFloodFill(
  origin: GridCoord,
  options: FloodFillOptions
): GridCoord[] {
  const { cols, rows, isMatch, onVisit, includeDiagonals = false } = options;
  if (!isMatch(origin)) return [];

  const queue: GridCoord[] = [origin];
  const visited = new Set<string>();
  const visitedList: GridCoord[] = [];

  const key = (c: GridCoord) => `${c.col},${c.row}`;
  visited.add(key(origin));

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitedList.push(current);

    const stopExpanding = onVisit(current);
    if (stopExpanding === true) continue;

    for (const dir of directions) {
      const neighbor = { col: current.col + dir.col, row: current.row + dir.row };
      if (outOfBounds(neighbor)) continue;

      const nKey = key(neighbor);
      if (!visited.has(nKey) && isMatch(neighbor)) {
        visited.add(nKey);
        queue.push(neighbor);
      }
    }
  }
  return visitedList;
}
```

*Applied in:* `Minesweeper` (blank tile expansion), `Match-3` (gem cluster discovery).

---

## 5. Spatial Hash Grid (`core/algorithms/spatialHash.ts`)

### The $O(N^2)$ Broad-Phase Bottleneck
In bullet-hell games (e.g. *Bullet Garden*, *Twin Stick Arena*) testing 500 bullets against 50 enemies requires $500 \times 50 = 25,000$ distance checks per frame.

### Hash Bucket Spatial Index
The `SpatialHash` grid partitions 2D space into uniform buckets of size `cellSize` (e.g. 64px). Coordinates are mapped to unique integer hash keys using the **Cantor Pairing Function**:

$$\text{key}(c_x, c_y) = \frac{(c_x + c_y)(c_x + c_y + 1)}{2} + c_y$$

```typescript
export class SpatialHash<T extends Positioned> {
  private readonly cellSize: number;
  private readonly cells: Map<number, Set<T>> = new Map();

  public query(x: number, y: number, radius: number): T[] {
    const results: T[] = [];
    const radiusSq = radius * radius;

    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);

    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const cell = this.cells.get(this.cellKey(cx, cy));
        if (!cell) continue;
        for (const entity of cell) {
          const dx = entity.x - x;
          const dy = entity.y - y;
          if (dx * dx + dy * dy <= radiusSq) results.push(entity);
        }
      }
    }
    return results;
  }
}
```
*Complexity:* Reduces proximity lookup time from $O(N)$ to $O(k)$, where $k$ is the number of entities within the immediate 9-bucket neighborhood.

---

## 6. Minimax with $\alpha$-$\beta$ Pruning (`core/algorithms/minimax.ts`)

### Mechanism
Evaluates optimal adversarial moves up to depth $d$. Prunes branches that cannot influence the final decision:

- **$\alpha$:** The minimum score the maximizing player is assured of.
- **$\beta$:** The maximum score the minimizing player is assured of.
- **Cutoff Condition:** If $\beta \le \alpha$, remaining subtrees are skipped.

$$\text{Effective Branching Factor: } b_{\text{optimal}} \approx \sqrt{b}$$

```typescript
if (isMaximizing) {
  let best = -Infinity;
  for (const move of availableMoves) {
    applyMove(move);
    const result = minimax([], evaluate, applyMove, undoMove, isTerminal, getMoves, depth - 1, false, alpha, beta);
    undoMove(move);
    best = Math.max(best, result.score);
    alpha = Math.max(alpha, best);
    if (beta <= alpha) break; // Beta cutoff
  }
  return { score: best, move: bestMove };
}
```

*Applied in:* `Connect Four` (depth 4-6 search), `Tic-Tac-Toe+` (exhaustive game tree).

---

## 7. Cellular Automata (`core/algorithms/cellularAutomata.ts`)

Implements discrete 2D grid evolution functions across 8-neighbor Moore neighborhoods:

### 1. Conway's Game of Life (B3/S23)
- **Birth (B3):** Dead cell becomes alive if exactly 3 live neighbors.
- **Survival (S23):** Live cell survives if 2 or 3 live neighbors; otherwise dies (under/over-population).

### 2. Cave Smoothing Rule (B5678/S45678)
Used to generate organic cave systems from white noise. Cells with $\ge 5$ walls become walls; cells with $< 4$ become open caverns.

### 3. Stochastic Fire Spread Rule
Probabilistic burn propagation based on PRNG spread chance ($p = 0.3$).

---

## 8. Space-Optimized Levenshtein Distance (`core/algorithms/levenshtein.ts`)

Calculates minimum edit distance (insertions, deletions, substitutions) between strings:

### Memory Optimization
Standard dynamic programming uses an $(N+1) \times (M+1)$ table ($O(NM)$ space). ARCADE_ uses two alternating 1D rows, reducing space to $O(\min(N, M))$:

```typescript
export function levenshteinDistance(s1: string, s2: string): number {
  const str1 = s1.toLowerCase();
  const str2 = s2.toLowerCase();
  const len1 = str1.length;
  const len2 = str2.length;

  if (len1 === 0) return len2;
  if (len2 === 0) return len1;

  let prevRow = new Array(len2 + 1);
  let currRow = new Array(len2 + 1);
  for (let j = 0; j <= len2; j++) prevRow[j] = j;

  for (let i = 1; i <= len1; i++) {
    currRow[0] = i;
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1,
        prevRow[j] + 1,
        prevRow[j - 1] + cost
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[len2];
}
```

### Normalized String Similarity Score
$$\text{Similarity}(s_1, s_2) = \max\left(0, 1 - \frac{\text{Levenshtein}(s_1, s_2)}{\max(|s_1|, |s_2|)}\right)$$
