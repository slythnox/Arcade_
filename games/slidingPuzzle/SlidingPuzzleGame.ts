import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class SlidingPuzzleGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 4;
  private grid: number[][] = [];
  private emptyPos: GridCoord = { col: 3, row: 3 };
  private cursor: GridCoord = { col: 3, row: 3 };
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
    this.moves = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.cursor = { col: 3, row: 3 };

    // Solved initial state
    let count = 1;
    this.grid = Array.from({ length: this.size }, (_, r) =>
      Array.from({ length: this.size }, (_, c) => {
        if (r === this.size - 1 && c === this.size - 1) return 0;
        return count++;
      })
    );
    this.emptyPos = { col: 3, row: 3 };

    // Solvable shuffle via valid random moves
    const shuffleSteps = 80;
    for (let i = 0; i < shuffleSteps; i++) {
      const neighbors: GridCoord[] = [];
      const { col, row } = this.emptyPos;
      if (row > 0) neighbors.push({ col, row: row - 1 });
      if (row < this.size - 1) neighbors.push({ col, row: row + 1 });
      if (col > 0) neighbors.push({ col: col - 1, row });
      if (col < this.size - 1) neighbors.push({ col: col + 1, row });

      const pick = neighbors[Math.floor(this.ctx.random.next() * neighbors.length)];
      this.grid[this.emptyPos.row][this.emptyPos.col] = this.grid[pick.row][pick.col];
      this.grid[pick.row][pick.col] = 0;
      this.emptyPos = pick;
    }
  }

  private trySlide(coord: GridCoord): void {
    const dRow = Math.abs(coord.row - this.emptyPos.row);
    const dCol = Math.abs(coord.col - this.emptyPos.col);

    if (dRow + dCol === 1) {
      this.grid[this.emptyPos.row][this.emptyPos.col] = this.grid[coord.row][coord.col];
      this.grid[coord.row][coord.col] = 0;
      this.emptyPos = { ...coord };
      this.moves++;
      this.ctx.audio.playMove();
      this.checkWin();
    } else {
      this.ctx.audio.playLaser();
    }
  }

  private checkWin(): void {
    let expected = 1;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (r === this.size - 1 && c === this.size - 1) {
          if (this.grid[r][c] !== 0) return;
        } else {
          if (this.grid[r][c] !== expected++) return;
        }
      }
    }

    this.isWon = true;
    this.score = Math.max(500, 3000 - this.moves * 25);
    this.ctx.session.setStatus("ready");
    this.ctx.audio.playVictory();
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
        this.trySlide(this.cursor);
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

    const cellSize = 110;
    const gap = 10;
    const boardWidth = this.size * cellSize + (this.size - 1) * gap;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 10;

    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "rgba(0, 255, 102, 0.4)", false);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * (cellSize + gap);
        const cy = offY + r * (cellSize + gap);

        if (val === 0) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#040805", true);
          pr.drawRect(cx, cy, cellSize, cellSize, "rgba(0, 255, 102, 0.15)", false);
        } else {
          const isCorrect = val === r * this.size + c + 1;
          const bg = isCorrect ? "#00FF66" : "#0f2316";
          const txt = isCorrect ? "#030604" : "#00FF66";
          pr.drawPixelBlock(cx, cy, cellSize, bg, "#FFFFFF", "rgba(0,0,0,0.5)");
          pr.drawText(val.toString(), cx + cellSize / 2, cy + cellSize / 2 + 10, {
            size: 36,
            color: txt,
            align: "center",
          });
        }

        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(cx - 2, cy - 2, cellSize + 4, cellSize + 4, "#00F0FF", false);
        }
      }
    }

    pr.drawText(`MOVES: ${this.moves}  •  [SPACE TO SLIDE TILE]`, w / 2, 28, {
      size: 13,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("15-PUZZLE SOLVED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
