import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

export class FloodFillGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 12;
  private grid: number[][] = [];
  private readonly colors: string[] = ["#FF3366", "#00FF66", "#00F0FF", "#FFB703", "#A855F7", "#EC4899"];
  private moves: number = 0;
  private maxMoves: number = 22;
  private selectedColorIdx: number = 0;
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
    this.moves = 0;
    this.maxMoves = 22;
    this.selectedColorIdx = 0;
    this.score = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => Math.floor(this.ctx.random.next() * this.colors.length))
    );
  }

  private applyFloodColor(newColorIdx: number): void {
    const originColor = this.grid[0][0];
    if (originColor === newColorIdx || this.gameOver || this.isWon || this.isPaused) return;

    this.moves++;
    const visited = new Set<string>();
    const queue: { r: number; c: number }[] = [{ r: 0, c: 0 }];
    visited.add("0,0");

    while (queue.length > 0) {
      const { r, c } = queue.shift()!;
      this.grid[r][c] = newColorIdx;

      const neighbors = [
        { r: r - 1, c },
        { r: r + 1, c },
        { r, c: c - 1 },
        { r, c: c + 1 },
      ];

      for (const n of neighbors) {
        if (n.r >= 0 && n.r < this.size && n.c >= 0 && n.c < this.size) {
          const key = `${n.r},${n.c}`;
          if (!visited.has(key) && this.grid[n.r][n.c] === originColor) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }

    this.ctx.audio.playRotate();
    this.checkStatus();
  }

  private checkStatus(): void {
    const firstColor = this.grid[0][0];
    const allFilled = this.grid.every((row) => row.every((c) => c === firstColor));

    if (allFilled) {
      this.isWon = true;
      this.score = (this.maxMoves - this.moves + 1) * 250;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    } else if (this.moves >= this.maxMoves) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.selectedColorIdx = (this.selectedColorIdx - 1 + this.colors.length) % this.colors.length;
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.selectedColorIdx = (this.selectedColorIdx + 1) % this.colors.length;
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      this.applyFloodColor(this.selectedColorIdx);
    } else if (action === "RESTART") {
      this.reset();
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

    const cellSize = 38;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 70;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "rgba(0, 255, 102, 0.4)", false);

    // Draw Flood Grid
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const col = this.colors[this.grid[r][c]];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;
        pr.drawPixelBlock(cx, cy, cellSize, col, "#FFFFFF", "rgba(0,0,0,0.4)");
      }
    }

    // Color Selector Palette at Bottom
    const palY = offY + boardWidth + 30;
    const palSize = 48;
    const palGap = 16;
    const totalPalWidth = this.colors.length * palSize + (this.colors.length - 1) * palGap;
    const palStartX = Math.floor((w - totalPalWidth) / 2);

    for (let i = 0; i < this.colors.length; i++) {
      const px = palStartX + i * (palSize + palGap);
      pr.drawPixelBlock(px, palY, palSize, this.colors[i], "#FFFFFF", "rgba(0,0,0,0.5)");

      if (i === this.selectedColorIdx) {
        pr.drawRect(px - 4, palY - 4, palSize + 8, palSize + 8, "#FFFFFF", false);
      }
    }

    pr.drawText(`MOVES: ${this.moves} / ${this.maxMoves}  •  [← → TO PICK COLOR, SPACE TO FLOOD]`, w / 2, 36, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("REGION FLOODED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MOVES EXHAUSTED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
