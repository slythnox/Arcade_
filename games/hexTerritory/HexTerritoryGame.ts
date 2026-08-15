import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

export class HexTerritoryGame implements GameInstance {
  private ctx!: GameContext;
  private score = 0;

  public init(ctx: GameContext): void { this.ctx = ctx; }
  public update(deltaTime: number): void {}
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#000000");
    pr.drawText("Hex Territory", 100, 100, { color: "#FFFFFF" });
  }
  public handleInput(action: GameAction, isPressed: boolean): void {}
  public pause(): void {}
  public resume(): void {}
  public reset(seed?: number): void { this.score = 0; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }
}
