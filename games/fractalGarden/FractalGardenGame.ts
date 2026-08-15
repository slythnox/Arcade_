import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

export class FractalGardenGame implements GameInstance {
  private ctx!: GameContext;
  private branchAngle: number = 0.45;
  private depth: number = 7;
  private growth: number = 1.0;
  private lengthScale: number = 0.72;
  private swayTime: number = 0;
  private score: number = 0;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.branchAngle = 0.45;
    this.depth = 7;
    this.growth = 1.0;
    this.lengthScale = 0.72;
    this.swayTime = 0;
    this.score = 1000;
    this.isPaused = false;
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.swayTime += dt * 1.5;
    this.score = Math.round(Math.pow(2, this.depth) * 10);
  }

  private drawBranch(
    pr: PixelRenderer,
    x: number,
    y: number,
    length: number,
    angle: number,
    currentDepth: number
  ): void {
    if (currentDepth <= 0) {
      // Draw leaf blossom
      pr.drawCircle(x, y, 3, "#FF3366", true);
      return;
    }

    const sway = Math.sin(this.swayTime + currentDepth * 0.5) * 0.05;
    const effectiveAngle = angle + sway;

    const nextX = x + Math.cos(effectiveAngle) * length;
    const nextY = y + Math.sin(effectiveAngle) * length;

    const colors = ["#047857", "#00FF66", "#00F0FF", "#FFB703", "#FF3366"];
    const col = colors[currentDepth % colors.length];

    pr.drawLine(x, y, nextX, nextY, col, Math.max(1, currentDepth));

    // Left child branch
    this.drawBranch(
      pr,
      nextX,
      nextY,
      length * this.lengthScale,
      effectiveAngle - this.branchAngle,
      currentDepth - 1
    );

    // Right child branch
    this.drawBranch(
      pr,
      nextX,
      nextY,
      length * this.lengthScale,
      effectiveAngle + this.branchAngle,
      currentDepth - 1
    );
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.branchAngle = Math.max(0.15, this.branchAngle - 0.05);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.branchAngle = Math.min(1.2, this.branchAngle + 0.05);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_UP") {
      this.depth = Math.min(9, this.depth + 1);
      this.ctx.audio.playPowerUp();
    } else if (action === "MOVE_DOWN") {
      this.depth = Math.max(3, this.depth - 1);
      this.ctx.audio.playPowerUp();
    } else if (action === "ACTION_PRIMARY") {
      this.lengthScale = this.lengthScale === 0.72 ? 0.78 : 0.72;
      this.ctx.audio.playRotate();
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.depth; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Ground Root
    pr.drawRect(10, 640, w - 20, 30, "#080e08", true);
    pr.drawLine(10, 640, w - 10, 640, "#00FF66", 2);

    // Render Recursive L-System Fractal Tree
    const rootX = 300;
    const rootY = 640;
    const initialLen = 130;
    this.drawBranch(pr, rootX, rootY, initialLen, -Math.PI / 2, this.depth);

    pr.drawText(
      `FRACTAL GARDEN  •  DEPTH: ${this.depth}  •  ANGLE: ${(this.branchAngle * 57.3).toFixed(1)}°  •  [← → ANGLE, ↑ ↓ RECURSION]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );
  }
}
