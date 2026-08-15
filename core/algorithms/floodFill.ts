import { GridCoord } from "../types/geometry";

export interface FloodFillOptions {
  cols: number;
  rows: number;
  isMatch: (coord: GridCoord) => boolean;
  onVisit: (coord: GridCoord) => boolean | void; // return true to stop expanding neighbors from this cell
  includeDiagonals?: boolean;
}

/**
 * Safe iterative queue-based 2D flood fill.
 * Prevents call-stack overflow on large boards.
 */
export function iterativeFloodFill(
  origin: GridCoord,
  options: FloodFillOptions
): GridCoord[] {
  const { cols, rows, isMatch, onVisit, includeDiagonals = false } = options;

  if (origin.col < 0 || origin.col >= cols || origin.row < 0 || origin.row >= rows) {
    return [];
  }

  if (!isMatch(origin)) {
    return [];
  }

  const queue: GridCoord[] = [origin];
  const visited = new Set<string>();
  const visitedList: GridCoord[] = [];

  const key = (c: GridCoord) => `${c.col},${c.row}`;
  visited.add(key(origin));

  const directions: GridCoord[] = [
    { col: 0, row: -1 }, // UP
    { col: 1, row: 0 },  // RIGHT
    { col: 0, row: 1 },  // DOWN
    { col: -1, row: 0 }, // LEFT
  ];

  if (includeDiagonals) {
    directions.push(
      { col: -1, row: -1 },
      { col: 1, row: -1 },
      { col: 1, row: 1 },
      { col: -1, row: 1 }
    );
  }

  while (queue.length > 0) {
    const current = queue.shift()!;
    visitedList.push(current);

    const stopExpanding = onVisit(current);
    if (stopExpanding === true) {
      continue;
    }

    for (const dir of directions) {
      const neighbor: GridCoord = {
        col: current.col + dir.col,
        row: current.row + dir.row,
      };

      if (
        neighbor.col < 0 ||
        neighbor.col >= cols ||
        neighbor.row < 0 ||
        neighbor.row >= rows
      ) {
        continue;
      }

      const nKey = key(neighbor);
      if (visited.has(nKey)) continue;

      if (isMatch(neighbor)) {
        visited.add(nKey);
        queue.push(neighbor);
      }
    }
  }

  return visitedList;
}
