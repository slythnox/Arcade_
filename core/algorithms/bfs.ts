import type { GridCoord } from "../types/geometry";

/**
 * 4-directional Breadth-First Search on a 2D grid.
 * Finds shortest path from start to target avoiding blocked cells.
 * Returns array of coordinates from start (exclusive) to target (inclusive), or null if unreachable.
 */
export function findPathBFS(
  start: GridCoord,
  target: GridCoord,
  cols: number,
  rows: number,
  isBlocked: (coord: GridCoord) => boolean
): GridCoord[] | null {
  if (start.col === target.col && start.row === target.row) {
    return [];
  }

  const queue: GridCoord[] = [start];
  const visited = new Set<string>();
  const parent = new Map<string, GridCoord>();

  const key = (c: GridCoord) => `${c.col},${c.row}`;
  visited.add(key(start));

  const directions: GridCoord[] = [
    { col: 0, row: -1 }, // UP
    { col: 1, row: 0 },  // RIGHT
    { col: 0, row: 1 },  // DOWN
    { col: -1, row: 0 }, // LEFT
  ];

  let found = false;

  while (queue.length > 0) {
    const current = queue.shift()!;

    if (current.col === target.col && current.row === target.row) {
      found = true;
      break;
    }

    for (const dir of directions) {
      const next: GridCoord = {
        col: current.col + dir.col,
        row: current.row + dir.row,
      };

      // Check grid boundaries
      if (next.col < 0 || next.col >= cols || next.row < 0 || next.row >= rows) {
        continue;
      }

      const nextKey = key(next);
      if (visited.has(nextKey)) continue;

      // Allow target cell even if marked as blocked (e.g. food cell)
      const isTarget = next.col === target.col && next.row === target.row;
      if (!isTarget && isBlocked(next)) continue;

      visited.add(nextKey);
      parent.set(nextKey, current);
      queue.push(next);
    }
  }

  if (!found) return null;

  // Reconstruct path
  const path: GridCoord[] = [];
  let curr: GridCoord = target;

  while (curr.col !== start.col || curr.row !== start.row) {
    path.unshift(curr);
    const p = parent.get(key(curr));
    if (!p) break;
    curr = p;
  }

  return path;
}
