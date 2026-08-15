import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class LightsOutGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 5;
  private grid: boolean[][] = [];
  private cursor: GridCoord = { col: 2, row: 2 };
  private moves: number = 0;
  private score: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 2 };
    this.moves = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(false));

    // Generate solvable state by simulating random valid clicks
    const pressCount = 8;
    for (let i = 0; i < pressCount; i++) {
      const r = Math.floor(this.ctx.random.next() * this.size);
      const c = Math.floor(this.ctx.random.next() * this.size);
      this.toggleCell(r, c, false);
    }
  }

  private toggleCell(row: number, col: number, playSound: boolean = true): void {
    const coords = [
      { r: row, c: col },
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
    ];

    for (const { r, c } of coords) {
      if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
        this.grid[r][c] = !this.grid[r][c];
      }
    }

    if (playSound) {
      this.moves++;
      this.ctx.audio.playRotate();
      this.checkWin();
    }
  }

  private checkWin(): void {
    const anyOn = this.grid.some((row) => row.some((v) => v));
    if (!anyOn && !this.isWon) {
      this.isWon = true;
      this.score = Math.max(500, 3000 - this.moves * 120);
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
      case "ROTATE":
        if (!this.isWon) {
          this.toggleCell(this.cursor.row, this.cursor.col, true);
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

    const cellSize = 96;
    const gap = 12;
    const boardWidth = this.size * cellSize + (this.size - 1) * gap;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 10;

    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "rgba(0, 255, 102, 0.4)", false);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const isOn = this.grid[r][c];
        const cx = offX + c * (cellSize + gap);
        const cy = offY + r * (cellSize + gap);

        if (isOn) {
          pr.drawPixelBlock(cx, cy, cellSize, "#00FF66", "#FFFFFF", "#047857");
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 14, "#FFFFFF", true);
        } else {
          pr.drawPixelBlock(cx, cy, cellSize, "#0e180e", "rgba(0,255,102,0.2)", "#040604");
        }

        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(cx - 2, cy - 2, cellSize + 4, cellSize + 4, "#00F0FF", false);
        }
      }
    }

    pr.drawText(`MOVES: ${this.moves}  •  [SPACE TO TOGGLE]`, w / 2, 28, {
      size: 13,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("GRID DEACTIVATED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
