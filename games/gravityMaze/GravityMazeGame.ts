import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

export class GravityMazeGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private walls: boolean[][] = [];
  private ballPos: GridCoord = { col: 1, row: 1 };
  private exitPos: GridCoord = { col: 6, row: 6 };
  private gravityDir: "DOWN" | "UP" | "LEFT" | "RIGHT" = "DOWN";
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
    this.ballPos = { col: 1, row: 1 };
    this.exitPos = { col: 6, row: 6 };
    this.gravityDir = "DOWN";
    this.moves = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;

    // Fixed intricate maze layout
    this.walls = Array.from({ length: this.size }, (_, r) =>
      Array.from({ length: this.size }, (_, c) => {
        if (r === 0 || r === this.size - 1 || c === 0 || c === this.size - 1) return true;
        if ((r === 2 && c <= 4) || (r === 4 && c >= 3) || (r === 5 && c === 2) || (r === 3 && c === 5)) return true;
        return false;
      })
    );
  }

  private rotateGravity(dir: "DOWN" | "UP" | "LEFT" | "RIGHT"): void {
    if (this.isWon || this.isPaused) return;

    this.gravityDir = dir;
    this.moves++;
    this.ctx.audio.playRotate();

    // Roll ball in gravity direction until wall
    let dCol = 0;
    let dRow = 0;
    if (dir === "DOWN") dRow = 1;
    if (dir === "UP") dRow = -1;
    if (dir === "LEFT") dCol = -1;
    if (dir === "RIGHT") dCol = 1;

    let curCol = this.ballPos.col;
    let curRow = this.ballPos.row;

    while (true) {
      const nextCol = curCol + dCol;
      const nextRow = curRow + dRow;
      if (this.walls[nextRow][nextCol]) break;
      curCol = nextCol;
      curRow = nextRow;
    }

    this.ballPos.col = curCol;
    this.ballPos.row = curRow;

    if (this.ballPos.col === this.exitPos.col && this.ballPos.row === this.exitPos.row && !this.isWon) {
      this.isWon = true;
      this.score = Math.max(500, 3000 - this.moves * 60);
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.isWon) return;

    if (action === "MOVE_DOWN") this.rotateGravity("DOWN");
    if (action === "MOVE_UP") this.rotateGravity("UP");
    if (action === "MOVE_LEFT") this.rotateGravity("LEFT");
    if (action === "MOVE_RIGHT") this.rotateGravity("RIGHT");
    if (action === "RESTART") this.reset();
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

    const cellSize = 66;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 12;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "rgba(0, 255, 102, 0.4)", false);

    pr.drawGrid(this.size, this.size, cellSize, "rgba(0, 255, 102, 0.1)", offX, offY);

    // Draw Walls
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.walls[r][c]) {
          const cx = offX + c * cellSize;
          const cy = offY + r * cellSize;
          pr.drawPixelBlock(cx + 2, cy + 2, cellSize - 4, "#00FF66", "#FFFFFF", "#047857");
        }
      }
    }

    // Draw Exit Goal
    const ex = offX + this.exitPos.col * cellSize + cellSize / 2;
    const ey = offY + this.exitPos.row * cellSize + cellSize / 2;
    pr.drawCircle(ex, ey, 20, "#FFB703", true);
    pr.drawCircle(ex, ey, 8, "#FFFFFF", true);

    // Draw Rolling Gravity Ball
    const bx = offX + this.ballPos.col * cellSize + cellSize / 2;
    const by = offY + this.ballPos.row * cellSize + cellSize / 2;
    pr.drawCircle(bx, by, 18, "#00F0FF", true);
    pr.drawCircle(bx, by, 6, "#FFFFFF", true);

    pr.drawText(
      `ROTATIONS: ${this.moves}  •  GRAVITY: ${this.gravityDir}  •  [ARROW KEYS TO ROTATE GRAVITY]`,
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
      pr.drawText("GRAVITY MAZE SOLVED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
