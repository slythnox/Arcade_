import { GridCoord } from "../../core/types/geometry";
import { RandomSource } from "../../core/math/random";

export interface MineCell {
  col: number;
  row: number;
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  neighborMines: number;
}

export class MinesweeperBoard {
  public readonly cols: number;
  public readonly rows: number;
  public readonly totalMines: number;
  public grid: MineCell[][];
  public isGenerated: boolean = false;

  constructor(cols: number = 10, rows: number = 10, totalMines: number = 15) {
    this.cols = cols;
    this.rows = rows;
    this.totalMines = totalMines;
    this.grid = this.createEmptyGrid();
  }

  private createEmptyGrid(): MineCell[][] {
    return Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) => ({
        col: c,
        row: r,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborMines: 0,
      }))
    );
  }

  public reset(): void {
    this.grid = this.createEmptyGrid();
    this.isGenerated = false;
  }

  /**
   * Deterministically generates mine layout avoiding safeFirstClick coordinate and its neighbors.
   */
  public generate(safeFirstClick: GridCoord, rng: RandomSource): void {
    const safeZone = new Set<string>();
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        safeZone.add(`${safeFirstClick.col + dc},${safeFirstClick.row + dr}`);
      }
    }

    const availableCoords: GridCoord[] = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!safeZone.has(`${c},${r}`)) {
          availableCoords.push({ col: c, row: r });
        }
      }
    }

    const shuffled = rng.shuffle(availableCoords);
    const mineCoords = shuffled.slice(0, this.totalMines);

    for (const mc of mineCoords) {
      this.grid[mc.row][mc.col].isMine = true;
    }

    // Calculate neighbor counts
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!this.grid[r][c].isMine) {
          this.grid[r][c].neighborMines = this.countNeighborMines(c, r);
        }
      }
    }

    this.isGenerated = true;
  }

  private countNeighborMines(col: number, row: number): number {
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = row + dr;
        const nc = col + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          if (this.grid[nr][nc].isMine) {
            count++;
          }
        }
      }
    }
    return count;
  }
}
