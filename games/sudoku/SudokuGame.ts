import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class SudokuGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 9;
  private solution: number[][] = [];
  private initialGrid: number[][] = [];
  private playerGrid: number[][] = [];
  private cursor: GridCoord = { col: 4, row: 4 };
  private mistakes: number = 0;
  private maxMistakes: number = 3;
  private score: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 4, row: 4 };
    this.mistakes = 0;
    this.score = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.generateBoard();
  }

  private generateBoard(): void {
    // Valid base solution
    const base = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    this.solution = base.map((row) => [...row]);
    this.initialGrid = base.map((row) => [...row]);
    this.playerGrid = base.map((row) => [...row]);

    // Remove ~35 cells for a playable medium puzzle
    const removedIndices: Set<number> = new Set();
    while (removedIndices.size < 36) {
      const idx = Math.floor(this.ctx.random.next() * 81);
      removedIndices.add(idx);
    }

    for (const idx of removedIndices) {
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      this.initialGrid[r][c] = 0;
      this.playerGrid[r][c] = 0;
    }
  }

  private inputDigit(d: number): void {
    if (this.gameOver || this.isWon || this.isPaused) return;
    const { row, col } = this.cursor;

    if (this.initialGrid[row][col] !== 0) {
      this.ctx.audio.playLaser();
      return;
    }

    if (d === 0) {
      this.playerGrid[row][col] = 0;
      this.ctx.audio.playMove();
      return;
    }

    if (this.solution[row][col] === d) {
      this.playerGrid[row][col] = d;
      this.score += 100;
      this.ctx.audio.playPowerUp();
      this.checkWin();
    } else {
      this.mistakes++;
      this.ctx.audio.playExplosion();
      if (this.mistakes >= this.maxMistakes) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      }
    }
  }

  private checkWin(): void {
    const isComplete = this.playerGrid.every((row, r) =>
      row.every((val, c) => val === this.solution[r][c])
    );
    if (isComplete && !this.isWon) {
      this.isWon = true;
      this.score += 2500;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
        this.ctx.audio.playMove();
        break;
      case "ACTION_PRIMARY":
        // Cycle numbers 1..9
        {
          const curVal = this.playerGrid[this.cursor.row][this.cursor.col];
          const nextVal = curVal >= 9 ? 1 : curVal + 1;
          this.inputDigit(nextVal);
        }
        break;
      case "RESTART":
        this.reset();
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 56;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 12;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight(boardWidth), "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight(boardWidth), "rgba(0, 255, 102, 0.4)", false);

    // Draw standard grid
    pr.drawGrid(this.size, this.size, cellSize, "rgba(0, 255, 102, 0.1)", offX, offY);

    // Draw thick 3x3 block sub-borders
    for (let i = 0; i <= 3; i++) {
      pr.drawLine(offX, offY + i * 3 * cellSize, offX + boardWidth, offY + i * 3 * cellSize, "#00FF66", 2);
      pr.drawLine(offX + i * 3 * cellSize, offY, offX + i * 3 * cellSize, offY + boardWidth, "#00FF66", 2);
    }

    // Draw Digits
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.playerGrid[r][c];
        const isFixed = this.initialGrid[r][c] !== 0;
        const cx = offX + c * cellSize + cellSize / 2;
        const cy = offY + r * cellSize + cellSize / 2 + 8;

        if (val !== 0) {
          pr.drawText(val.toString(), cx, cy, {
            size: 24,
            color: isFixed ? "#FFFFFF" : "#00FF66",
            align: "center",
          });
        }

        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(offX + c * cellSize, offY + r * cellSize, cellSize, cellSize, "#00F0FF", false);
        }
      }
    }

    pr.drawText(
      `SCORE: ${this.score}  •  MISTAKES: ${this.mistakes}/${this.maxMistakes}  •  [SPACE TO ENTER DIGIT]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("SUDOKU SOLVED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MISTAKES LIMIT — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}

function boardHeight(bw: number): number {
  return bw + 8;
}
