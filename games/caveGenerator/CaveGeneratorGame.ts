// @ts-nocheck
import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { stepCellularAutomata, caveRule } from "../../core/algorithms/cellularAutomata";

export class CaveGeneratorGame implements GameInstance {
  private ctx!: GameContext;
  private grid: number[][] = [];
  private width = 80;
  private height = 50;
  private fillPercent = 45;
  private iterations = 5;
  private isPaused = false;
  private score = 0;

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
      .map(() =>
        Array(this.width)
          .fill(0)
          .map(() => (this.ctx.random.nextFloat() * 100 < this.fillPercent ? 1 : 0))
      );

    for (let i = 0; i < this.iterations; i++) {
      this.grid = stepCellularAutomata(this.grid, caveRule);
    }
    this.calculateScore();
  }

  private calculateScore(): void {
    let openCount = 0;
    for (let y = 0; y < this.height; y++) {
      for (let x = 0; x < this.width; x++) {
        if (this.grid[y][x] === 0) openCount++;
      }
    }
    this.score = openCount;
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
        const isWall = this.grid[y][x] === 1;
        pr.drawRect(
          x * cellW,
          y * cellH,
          cellW + 0.5,
          cellH + 0.5,
          isWall ? "#1a233a" : "#0d1424",
          true
        );
      }
    }

    // HUD
    pr.drawRect(0, h - 60, w, 60, "#080e1c", true);
    pr.drawText(`CAVE GENERATOR | Fill: ${this.fillPercent}% | Iters: ${this.iterations} | Open Cells: ${this.score}`, 16, h - 36, {
      color: "#ffd84d",
      size: 11,
    });
    pr.drawText("[SPACE] Regenerate  [Z/X] Fill%  [UP/DOWN] Iters  [R] Reset", 16, h - 16, {
      color: "#4de8e8",
      size: 9,
    });
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    if (action === "ACTION_PRIMARY") {
      this.reset();
    } else if (action === "ACTION_SECONDARY") {
      this.fillPercent = Math.min(80, this.fillPercent + 5);
      this.reset();
    } else if (action === "MOVE_UP") {
      this.iterations = Math.min(15, this.iterations + 1);
      this.reset();
    } else if (action === "MOVE_DOWN") {
      this.iterations = Math.max(1, this.iterations - 1);
      this.reset();
    } else if (action === "MOVE_LEFT") {
      this.fillPercent = Math.max(20, this.fillPercent - 5);
      this.reset();
    } else if (action === "MOVE_RIGHT") {
      this.fillPercent = Math.min(80, this.fillPercent + 5);
      this.reset();
    } else if (action === "RESTART") {
      this.fillPercent = 45;
      this.iterations = 5;
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
    return this.score;
  }
  public getLevel(): number {
    return this.iterations;
  }
}
