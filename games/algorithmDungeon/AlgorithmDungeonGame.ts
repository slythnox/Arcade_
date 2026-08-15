import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";

export class AlgorithmDungeonGame implements GameInstance {
  private ctx!: GameContext;
  private paused: boolean = false;
  private speed: number = 1;
  private timer: number = 0;
  
  private cols: number = 25;
  private rows: number = 20;
  private maze: number[][] = []; // 0: wall, 1: path
  
  private aStarScore: number = 0;
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.generateMaze();
  }
  
  private generateMaze() {
    this.maze = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    // simplified maze generation
    for(let r=1; r<this.rows-1; r+=2) {
      for(let c=1; c<this.cols-1; c+=2) {
        this.maze[r][c] = 1;
      }
    }
  }

  public update(dt: number): void {
    if (this.paused) return;
    this.timer += dt * this.speed;
    if (this.timer > 0.1) {
      this.timer = 0;
      // algorithm step logic
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#111");
    // render maze
    const cellW = 16;
    const cellH = 16;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.maze[r][c] === 0) {
          pr.drawRect(c * cellW, r * cellH, cellW, cellH, "#444", true);
        }
      }
    }
  }

  public reset(): void {
    this.generateMaze();
  }

  public handleInput(action: string, isPressed: boolean): void {
    if (!isPressed) return;
    if (action === "ACTION_A") { // Space usually maps to ACTION_A or similar, just toggle pause
      this.paused = !this.paused;
    }
    // R, Z, X keys handling if raw keys are supported, or rely on specific game actions
  }

  public getScore(): number {
    return this.aStarScore;
  }

  public getLevel(): number {
    return 1;
  }

  public pause(): void {}
  public resume(): void {}

  public destroy(): void {}
}
