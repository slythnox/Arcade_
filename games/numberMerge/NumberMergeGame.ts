import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

export class NumberMergeGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 5;
  private readonly rows: number = 7;
  private grid: number[][] = [];
  private currentCol: number = 2;
  private nextNumber: number = 2;
  private score: number = 0;
  private level: number = 1;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.currentCol = 2;
    this.nextNumber = 2;
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
  }

  private dropNumber(): void {
    if (this.gameOver || this.isPaused) return;

    // Find lowest available row in currentCol
    let targetRow = -1;
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][this.currentCol] === 0) {
        targetRow = r;
        break;
      }
    }

    if (targetRow === -1) {
      // Column is full
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
      return;
    }

    this.grid[targetRow][this.currentCol] = this.nextNumber;
    this.ctx.audio.playMove();

    // Trigger merge cascade
    this.processMerges(targetRow, this.currentCol);

    // Pick next random number power of 2
    const powers = [2, 4, 8, 16];
    this.nextNumber = powers[Math.floor(this.ctx.random.next() * powers.length)];
  }

  private processMerges(row: number, col: number): void {
    const val = this.grid[row][col];
    if (val === 0) return;

    // Check neighbors: bottom, left, right
    const neighbors = [
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
    ];

    for (const n of neighbors) {
      if (n.r >= 0 && n.r < this.rows && n.c >= 0 && n.c < this.cols && this.grid[n.r][n.c] === val) {
        // Merge into current cell
        this.grid[n.r][n.c] = 0;
        this.grid[row][col] = val * 2;
        this.score += val * 2;
        this.ctx.audio.playPowerUp();
        // Recurse cascade
        this.processMerges(row, col);
        break;
      }
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.gameOver) return;

    if (action === "MOVE_LEFT") {
      this.currentCol = Math.max(0, this.currentCol - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.currentCol = Math.min(this.cols - 1, this.currentCol + 1);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "MOVE_DOWN") {
      this.dropNumber();
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 76;
    const gap = 8;
    const boardWidth = this.cols * cellSize + (this.cols - 1) * gap;
    const boardHeight = this.rows * cellSize + (this.rows - 1) * gap;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 110;

    // Draw Next Drop Preview
    const previewX = offX + this.currentCol * (cellSize + gap);
    pr.drawPixelBlock(previewX, 40, cellSize, "#00FF66", "#FFFFFF", "#040604");
    pr.drawText(this.nextNumber.toString(), previewX + cellSize / 2, 40 + cellSize / 2 + 8, {
      size: 28,
      color: "#030604",
      align: "center",
    });

    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardHeight + 12, "#080e08", true);
    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardHeight + 12, "rgba(0, 255, 102, 0.4)", false);

    const colors: Record<number, string> = {
      2: "#0f2316",
      4: "#143320",
      8: "#1f4a2e",
      16: "#2a663e",
      32: "#00FF66",
      64: "#FFB703",
      128: "#F97316",
      256: "#FF3366",
      512: "#A855F7",
      1024: "#00F0FF",
      2048: "#FFFFFF",
    };

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * (cellSize + gap);
        const cy = offY + r * (cellSize + gap);

        if (val === 0) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#060a06", true);
          pr.drawRect(cx, cy, cellSize, cellSize, "rgba(0, 255, 102, 0.1)", false);
        } else {
          const bg = colors[val] || "#FF3366";
          pr.drawPixelBlock(cx, cy, cellSize, bg, "#FFFFFF", "rgba(0,0,0,0.5)");
          pr.drawText(val.toString(), cx + cellSize / 2, cy + cellSize / 2 + 8, {
            size: val >= 100 ? 24 : 28,
            color: val >= 32 ? "#030604" : "#FFFFFF",
            align: "center",
          });
        }
      }
    }

    pr.drawText(`SCORE: ${this.score}  •  [← → CHOOSE COLUMN, SPACE/↓ TO DROP]`, w / 2, 24, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("COLUMN OVERFLOW — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
