// @ts-nocheck
import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

const WALL = 0;
const FLOOR = 1;
const CORRIDOR = 2;

export class DungeonGeneratorGame implements GameInstance {
  private ctx!: GameContext;
  private grid: number[][] = [];
  private width = 80;
  private height = 50;
  private roomCount = 0;
  private isPaused = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.grid = Array(this.height)
      .fill(0)
      .map(() => Array(this.width).fill(WALL));
    this.roomCount = 0;
    this.generateBSP(2, 2, this.width - 4, this.height - 4, 0);
  }

  private generateBSP(x: number, y: number, w: number, h: number, depth: number): void {
    if (w < 14 || h < 14 || depth > 4 || this.ctx.random.nextFloat() < 0.15) {
      const roomW = Math.max(4, Math.floor(w * (0.6 + this.ctx.random.nextFloat() * 0.3)));
      const roomH = Math.max(4, Math.floor(h * (0.6 + this.ctx.random.nextFloat() * 0.3)));
      const rx = x + Math.floor((w - roomW) / 2);
      const ry = y + Math.floor((h - roomH) / 2);
      for (let cy = ry; cy < ry + roomH; cy++) {
        for (let cx = rx; cx < rx + roomW; cx++) {
          if (cx >= 0 && cx < this.width && cy >= 0 && cy < this.height) {
            this.grid[cy][cx] = FLOOR;
          }
        }
      }
      this.roomCount++;
      return;
    }

    const splitHoriz = h > w || (h === w && this.ctx.random.nextFloat() > 0.5);
    if (splitHoriz) {
      const split = Math.floor(h * (0.4 + this.ctx.random.nextFloat() * 0.2));
      this.generateBSP(x, y, w, split, depth + 1);
      this.generateBSP(x, y + split, w, h - split, depth + 1);
      // Corridor between sections
      const cx = x + Math.floor(w / 2);
      for (let cy = y + Math.floor(split / 2); cy <= y + split + 2 && cy < this.height - 2; cy++) {
        this.grid[cy][cx] = CORRIDOR;
      }
    } else {
      const split = Math.floor(w * (0.4 + this.ctx.random.nextFloat() * 0.2));
      this.generateBSP(x, y, split, h, depth + 1);
      this.generateBSP(x + split, y, w - split, h, depth + 1);
      // Corridor between sections
      const cy = y + Math.floor(h / 2);
      for (let cx = x + Math.floor(split / 2); cx <= x + split + 2 && cx < this.width - 2; cx++) {
        this.grid[cy][cx] = CORRIDOR;
      }
    }
  }

  public update(_deltaTime: number): void {}

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#04060c");

    const w = renderer.getWidth();
    const h = renderer.getHeight();
    const cellW = w / this.width;
    const cellH = (h - 60) / this.height;

    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        const cell = this.grid[y][x];
        let color = "#0d1424";
        if (cell === FLOOR) color = "#2a3d66";
        else if (cell === CORRIDOR) color = "#1e5c8a";

        pr.drawRect(x * cellW, y * cellH, cellW + 0.5, cellH + 0.5, color, true);
      }
    }

    // HUD
    pr.drawRect(0, h - 60, w, 60, "#080e1c", true);
    pr.drawText(`BSP DUNGEON GENERATOR | Rooms Created: ${this.roomCount}`, 16, h - 36, {
      color: "#ffd84d",
      size: 11,
    });
    pr.drawText("[SPACE / ENTER] Generate New BSP Layout  [R] Reset Seed", 16, h - 16, {
      color: "#4de8e8",
      size: 9,
    });
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    if (action === "ACTION_PRIMARY" || action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void {
    this.isPaused = true;
  }
  public resume(): void {
    this.isPaused = false;
  }
  public destroy(): void {}
  public getScore(): number {
    return this.roomCount;
  }
  public getLevel(): number {
    return 1;
  }
}
