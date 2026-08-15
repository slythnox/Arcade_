import type { TetrisPiece } from "./TetrisPiece";

export interface CellData {
  filled: boolean;
  color?: string;
}

export class TetrisBoard {
  public readonly cols: number = 10;
  public readonly rows: number = 20;
  public grid: (CellData | null)[][];

  constructor(cols: number = 10, rows: number = 20) {
    this.cols = cols;
    this.rows = rows;
    this.grid = this.createEmptyGrid();
  }

  public createEmptyGrid(): (CellData | null)[][] {
    return Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => null)
    );
  }

  public reset(): void {
    this.grid = this.createEmptyGrid();
  }

  public isValidPosition(piece: TetrisPiece): boolean {
    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] !== 0) {
          const boardX = piece.x + c;
          const boardY = piece.y + r;

          // Wall and floor boundaries
          if (boardX < 0 || boardX >= this.cols || boardY >= this.rows) {
            return false;
          }

          // Locked pieces check (only if inside visible grid)
          if (boardY >= 0 && this.grid[boardY][boardX] !== null) {
            return false;
          }
        }
      }
    }
    return true;
  }

  public lockPiece(piece: TetrisPiece, color: string): boolean {
    let topOut = false;

    for (let r = 0; r < piece.matrix.length; r++) {
      for (let c = 0; c < piece.matrix[r].length; c++) {
        if (piece.matrix[r][c] !== 0) {
          const boardX = piece.x + c;
          const boardY = piece.y + r;

          if (boardY < 0) {
            topOut = true;
          } else if (boardY < this.rows && boardX >= 0 && boardX < this.cols) {
            this.grid[boardY][boardX] = { filled: true, color };
          }
        }
      }
    }

    return topOut;
  }

  /**
   * Scans and clears complete lines.
   * Returns array of row indices cleared.
   */
  public clearLines(): number[] {
    const clearedRows: number[] = [];

    for (let r = this.rows - 1; r >= 0; r--) {
      const isFull = this.grid[r].every((cell) => cell !== null);
      if (isFull) {
        clearedRows.push(r);
      }
    }

    if (clearedRows.length > 0) {
      // Filter out cleared rows and unshift new empty rows at top
      const newGrid = this.grid.filter((_, idx) => !clearedRows.includes(idx));
      while (newGrid.length < this.rows) {
        newGrid.unshift(Array.from({ length: this.cols }, () => null));
      }
      this.grid = newGrid;
    }

    return clearedRows;
  }
}
