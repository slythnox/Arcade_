import type { GridCoord } from "../../core/types/geometry";
import { findPathBFS } from "../../core/algorithms/bfs";
import type { GameAction } from "../../core/types/game";

/**
 * Automated Snake AI using Breadth-First Search.
 * Finds shortest safe path from snake head to food avoiding snake body segments.
 */
export function getNextSnakeAIMove(
  head: GridCoord,
  food: GridCoord,
  body: GridCoord[],
  cols: number,
  rows: number
): GameAction | null {
  const bodySet = new Set(body.slice(0, -1).map((b) => `${b.col},${b.row}`));

  const isBlocked = (c: GridCoord) => bodySet.has(`${c.col},${c.row}`);

  const path = findPathBFS(head, food, cols, rows, isBlocked);
  if (!path || path.length === 0) {
    // If no path to food, pick any safe adjacent cell
    const directions: { dir: GameAction; coord: GridCoord }[] = [
      { dir: "MOVE_UP", coord: { col: head.col, row: head.row - 1 } },
      { dir: "MOVE_RIGHT", coord: { col: head.col + 1, row: head.row } },
      { dir: "MOVE_DOWN", coord: { col: head.col, row: head.row + 1 } },
      { dir: "MOVE_LEFT", coord: { col: head.col - 1, row: head.row } },
    ];

    for (const d of directions) {
      if (
        d.coord.col >= 0 &&
        d.coord.col < cols &&
        d.coord.row >= 0 &&
        d.coord.row < rows &&
        !isBlocked(d.coord)
      ) {
        return d.dir;
      }
    }
    return null;
  }

  const nextStep = path[0];
  if (nextStep.col > head.col) return "MOVE_RIGHT";
  if (nextStep.col < head.col) return "MOVE_LEFT";
  if (nextStep.row > head.row) return "MOVE_DOWN";
  if (nextStep.row < head.row) return "MOVE_UP";

  return null;
}
