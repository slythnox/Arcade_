import type { MinesweeperBoard } from "./MinesweeperBoard";
import type { GridCoord } from "../../core/types/geometry";
import { iterativeFloodFill } from "../../core/algorithms/floodFill";

export interface RevealResult {
  hitMine: boolean;
  revealedCount: number;
  isWon: boolean;
}

/**
 * Executes iterative flood-fill reveal on click.
 */
export function revealCell(
  board: MinesweeperBoard,
  coord: GridCoord
): RevealResult {
  if (coord.row < 0 || coord.row >= board.rows || coord.col < 0 || coord.col >= board.cols) {
    return { hitMine: false, revealedCount: 0, isWon: false };
  }

  const cell = board.grid[coord.row][coord.col];

  if (cell.isFlagged || cell.isRevealed) {
    return { hitMine: false, revealedCount: 0, isWon: false };
  }

  if (cell.isMine) {
    cell.isRevealed = true;
    return { hitMine: true, revealedCount: 1, isWon: false };
  }

  let newlyRevealed = 0;

  // Single numbered cell (> 0) reveal
  if (cell.neighborMines > 0) {
    cell.isRevealed = true;
    newlyRevealed = 1;
  } else {
    // Zero-mine empty region: expand connected empty region & perimeter numbers
    iterativeFloodFill(coord, {
      cols: board.cols,
      rows: board.rows,
      includeDiagonals: true,
      isMatch: (c) => {
        const currentCell = board.grid[c.row][c.col];
        return !currentCell.isMine && !currentCell.isFlagged && !currentCell.isRevealed;
      },
      onVisit: (c) => {
        const targetCell = board.grid[c.row][c.col];
        targetCell.isRevealed = true;
        newlyRevealed++;
        // Stop expanding further neighbors if this cell has neighboring mines (> 0)
        return targetCell.neighborMines > 0;
      },
    });
  }

  // Check victory condition: all non-mine cells are revealed
  let nonMineUnrevealed = 0;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cur = board.grid[r][c];
      if (!cur.isMine && !cur.isRevealed) {
        nonMineUnrevealed++;
      }
    }
  }

  return {
    hitMine: false,
    revealedCount: newlyRevealed,
    isWon: nonMineUnrevealed === 0,
  };
}

/**
 * Chording: If a revealed numbered cell has the exact number of neighboring flags,
 * auto-reveals all other non-flagged adjacent cells.
 */
export function chordCell(
  board: MinesweeperBoard,
  coord: GridCoord
): RevealResult {
  const cell = board.grid[coord.row][coord.col];
  if (!cell.isRevealed || cell.neighborMines === 0) {
    return { hitMine: false, revealedCount: 0, isWon: false };
  }

  // Count surrounding flags
  let flagCount = 0;
  const neighborsToReveal: GridCoord[] = [];

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nr = coord.row + dr;
      const nc = coord.col + dc;
      if (nr >= 0 && nr < board.rows && nc >= 0 && nc < board.cols) {
        const neighbor = board.grid[nr][nc];
        if (neighbor.isFlagged) {
          flagCount++;
        } else if (!neighbor.isRevealed) {
          neighborsToReveal.push({ col: nc, row: nr });
        }
      }
    }
  }

  // Only chord if flags match the digit exactly
  if (flagCount !== cell.neighborMines) {
    return { hitMine: false, revealedCount: 0, isWon: false };
  }

  let totalRevealed = 0;
  let hitMine = false;

  for (const nCoord of neighborsToReveal) {
    const res = revealCell(board, nCoord);
    if (res.hitMine) {
      hitMine = true;
    }
    totalRevealed += res.revealedCount;
  }

  // Check victory condition
  let nonMineUnrevealed = 0;
  for (let r = 0; r < board.rows; r++) {
    for (let c = 0; c < board.cols; c++) {
      const cur = board.grid[r][c];
      if (!cur.isMine && !cur.isRevealed) {
        nonMineUnrevealed++;
      }
    }
  }

  return {
    hitMine,
    revealedCount: totalRevealed,
    isWon: nonMineUnrevealed === 0,
  };
}

export function toggleFlag(board: MinesweeperBoard, coord: GridCoord): boolean {
  if (coord.row < 0 || coord.row >= board.rows || coord.col < 0 || coord.col >= board.cols) {
    return false;
  }
  const cell = board.grid[coord.row][coord.col];
  if (!cell.isRevealed) {
    cell.isFlagged = !cell.isFlagged;
    return cell.isFlagged;
  }
  return false;
}
