import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

export class CirclePackingLabGame implements GameInstance {
  private ctx!: GameContext;
  private score = 0;

  public init(ctx: GameContext): void { this.ctx = ctx; }
  public update(deltaTime: number): void {}
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#000000");
    pr.drawText("Circle Packing Lab", 100, 100, { color: "#FFFFFF" });
  }
  public handleInput(action: GameAction, isPressed: boolean): void {}
  public pause(): void {}
  public resume(): void {}
  public reset(seed?: number): void { this.score = 0; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }
}
