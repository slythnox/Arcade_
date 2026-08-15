import { GridCoord } from "../types/geometry";

interface AStarNode {
  coord: GridCoord;
  g: number;
  h: number;
  f: number;
  parent?: AStarNode;
}

/**
 * A* Pathfinding on 2D grid using Manhattan heuristic.
 * Returns array of coordinates from start (exclusive) to target (inclusive), or null if unreachable.
 */
export function findPathAStar(
  start: GridCoord,
  target: GridCoord,
  cols: number,
  rows: number,
  isBlocked: (coord: GridCoord) => boolean
): GridCoord[] | null {
  if (start.col === target.col && start.row === target.row) {
    return [];
  }

  const heuristic = (a: GridCoord, b: GridCoord) =>
    Math.abs(a.col - b.col) + Math.abs(a.row - b.row);

  const key = (c: GridCoord) => `${c.col},${c.row}`;
  const openList: AStarNode[] = [];
  const closedSet = new Set<string>();

  openList.push({
    coord: start,
    g: 0,
    h: heuristic(start, target),
    f: heuristic(start, target),
  });

  const directions: GridCoord[] = [
    { col: 0, row: -1 }, // UP
    { col: 1, row: 0 },  // RIGHT
    { col: 0, row: 1 },  // DOWN
    { col: -1, row: 0 }, // LEFT
  ];

  while (openList.length > 0) {
    // Pick lowest f cost (and lowest h on tie)
    let bestIdx = 0;
    for (let i = 1; i < openList.length; i++) {
      if (
        openList[i].f < openList[bestIdx].f ||
        (openList[i].f === openList[bestIdx].f && openList[i].h < openList[bestIdx].h)
      ) {
        bestIdx = i;
      }
    }

    const current = openList.splice(bestIdx, 1)[0];
    closedSet.add(key(current.coord));

    if (current.coord.col === target.col && current.coord.row === target.row) {
      const path: GridCoord[] = [];
      let curr: AStarNode | undefined = current;
      while (curr && !(curr.coord.col === start.col && curr.coord.row === start.row)) {
        path.unshift({ col: curr.coord.col, row: curr.coord.row });
        curr = curr.parent;
      }
      return path;
    }

    for (const dir of directions) {
      const neighborCoord: GridCoord = {
        col: current.coord.col + dir.col,
        row: current.coord.row + dir.row,
      };

      if (
        neighborCoord.col < 0 ||
        neighborCoord.col >= cols ||
        neighborCoord.row < 0 ||
        neighborCoord.row >= rows
      ) {
        continue;
      }

      const nKey = key(neighborCoord);
      if (closedSet.has(nKey)) continue;

      const isTarget =
        neighborCoord.col === target.col && neighborCoord.row === target.row;
      if (!isTarget && isBlocked(neighborCoord)) continue;

      const tentativeG = current.g + 1;
      const existing = openList.find((n) => key(n.coord) === nKey);

      if (!existing) {
        const h = heuristic(neighborCoord, target);
        openList.push({
          coord: neighborCoord,
          g: tentativeG,
          h,
          f: tentativeG + h,
          parent: current,
        });
      } else if (tentativeG < existing.g) {
        existing.g = tentativeG;
        existing.f = tentativeG + existing.h;
        existing.parent = current;
      }
    }
  }

  return null;
}
