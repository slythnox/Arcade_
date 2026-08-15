import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class NonogramGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private solution: boolean[][] = [];
  private playerGrid: boolean[][] = [];
  private rowClues: number[][] = [];
  private colClues: number[][] = [];
  private cursor: GridCoord = { col: 3, row: 3 };
  private score: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 3, row: 3 };
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.playerGrid = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    this.generatePicture();
  }

  private generatePicture(): void {
    // 8x8 Heart / Pixel Art Shape
    this.solution = [
      [false, true, true, false, false, true, true, false],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [true, true, true, true, true, true, true, true],
      [false, true, true, true, true, true, true, false],
      [false, false, true, true, true, true, false, false],
      [false, false, false, true, true, false, false, false],
      [false, false, false, false, false, false, false, false],
    ];

    // Compute Row Clues
    this.rowClues = [];
    for (let r = 0; r < this.size; r++) {
      const clues: number[] = [];
      let run = 0;
      for (let c = 0; c < this.size; c++) {
        if (this.solution[r][c]) run++;
        else if (run > 0) {
          clues.push(run);
          run = 0;
        }
      }
      if (run > 0) clues.push(run);
      if (clues.length === 0) clues.push(0);
      this.rowClues.push(clues);
    }

    // Compute Col Clues
    this.colClues = [];
    for (let c = 0; c < this.size; c++) {
      const clues: number[] = [];
      let run = 0;
      for (let r = 0; r < this.size; r++) {
        if (this.solution[r][c]) run++;
        else if (run > 0) {
          clues.push(run);
          run = 0;
        }
      }
      if (run > 0) clues.push(run);
      if (clues.length === 0) clues.push(0);
      this.colClues.push(clues);
    }
  }

  private toggleCell(): void {
    if (this.isWon || this.isPaused) return;
    const { row, col } = this.cursor;
    this.playerGrid[row][col] = !this.playerGrid[row][col];
    this.ctx.audio.playMove();

    const matches = this.playerGrid.every((r, rowIdx) =>
      r.every((c, colIdx) => c === this.solution[rowIdx][colIdx])
    );

    if (matches && !this.isWon) {
      this.isWon = true;
      this.score = 2000;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.isWon) return;

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
      case "CONFIRM":
        this.toggleCell();
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

    const cellSize = 48;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2) + 20;
    const offY = Math.floor((h - boardWidth) / 2) + 30;

    // Draw Column Clues on Top
    for (let c = 0; c < this.size; c++) {
      const clues = this.colClues[c];
      const cx = offX + c * cellSize + cellSize / 2;
      for (let i = 0; i < clues.length; i++) {
        pr.drawText(clues[i].toString(), cx, offY - 14 - (clues.length - 1 - i) * 16, {
          size: 13,
          color: "#00FF66",
          align: "center",
        });
      }
    }

    // Draw Row Clues on Left
    for (let r = 0; r < this.size; r++) {
      const clues = this.rowClues[r];
      const cy = offY + r * cellSize + cellSize / 2 + 6;
      const text = clues.join(" ");
      pr.drawText(text, offX - 16, cy, {
        size: 13,
        color: "#00FF66",
        align: "right",
      });
    }

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "rgba(0, 255, 102, 0.4)", false);
    pr.drawGrid(this.size, this.size, cellSize, "rgba(0, 255, 102, 0.15)", offX, offY);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const isFilled = this.playerGrid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (isFilled) {
          pr.drawPixelBlock(cx + 2, cy + 2, cellSize - 4, "#00FF66", "#FFFFFF", "#047857");
        }

        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#00F0FF", false);
        }
      }
    }

    pr.drawText("[SPACE TO FILL / CLEAR PIXEL]", w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("PIXEL ART REVEALED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
