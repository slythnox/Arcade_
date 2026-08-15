/**
 * Generic cellular automaton step.
 * Applies a rule function to every cell and returns the next generation grid.
 *
 * Used by: sandWorld, fireSpread, caveGenerator, cellColony.
 *
 * @param grid - 2D grid of cell states (any numeric type)
 * @param rule - Given current cell value and 8-neighbor values, returns next state
 * @param wrap - Whether to wrap edges (toroidal topology)
 */
export function stepCellularAutomata(
  grid: number[][],
  rule: (current: number, neighbors: number[]) => number,
  wrap: boolean = false
): number[][] {
  const rows = grid.length;
  const cols = grid[0].length;
  const next: number[][] = Array.from({ length: rows }, () => new Array(cols).fill(0));

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const neighbors: number[] = [];
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          let nr = r + dr;
          let nc = c + dc;
          if (wrap) {
            nr = ((nr % rows) + rows) % rows;
            nc = ((nc % cols) + cols) % cols;
          } else if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) {
            neighbors.push(0);
            continue;
          }
          neighbors.push(grid[nr][nc]);
        }
      }
      next[r][c] = rule(grid[r][c], neighbors);
    }
  }

  return next;
}

/** Conway's Game of Life rule: B3/S23 */
export function golRule(current: number, neighbors: number[]): number {
  const alive = neighbors.filter(n => n === 1).length;
  if (current === 1) return (alive === 2 || alive === 3) ? 1 : 0;
  return alive === 3 ? 1 : 0;
}

/** Cave smoothing rule: B5678/S45678 (fills sparse areas, hollows dense ones) */
export function caveRule(current: number, neighbors: number[]): number {
  const walls = neighbors.filter(n => n === 1).length;
  if (current === 1) return walls >= 4 ? 1 : 0;
  return walls >= 5 ? 1 : 0;
}

/** Fire spread rule: probabilistic propagation */
export function fireRule(prng: () => number, spreadChance: number = 0.3) {
  return (current: number, neighbors: number[]): number => {
    // States: 0=empty, 1=tree, 2=burning, 3=burnt
    if (current === 2) return 3; // burning -> burnt
    if (current === 3) return 3; // burnt stays burnt
    if (current === 1) {
      // tree catches fire if neighbor is burning
      const burningNeighbors = neighbors.filter(n => n === 2).length;
      if (burningNeighbors > 0 && prng() < spreadChance) return 2;
    }
    return current;
  };
}
