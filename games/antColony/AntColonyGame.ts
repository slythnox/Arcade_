import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

export class AntColonyGame implements GameInstance {
  private ctx!: GameContext;
  private score = 0;
  private time = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  public update(deltaTime: number): void {
    this.time += deltaTime;
  }
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#000000");
    pr.drawText("Ant Colony Simulation", 100, 100, { color: "#FFFFFF" });
    pr.drawText("Score: " + this.score, 100, 120, { color: "#FFFFFF" });
  }
  public handleInput(action: GameAction, isPressed: boolean): void {}
  public pause(): void {}
  public resume(): void {}
  public reset(seed?: number): void { this.score = 0; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }
}
