// @ts-nocheck
import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface VoronoiSite {
  x: number;
  y: number;
  color: string;
}

export class VoronoiGardenGame implements GameInstance {
  private ctx!: GameContext;
  private sites: VoronoiSite[] = [];
  private cursorX = 400;
  private cursorY = 300;
  private useManhattan = false;
  private isPaused = false;

  private colors = [
    "#ffd84d",
    "#ff5c8a",
    "#4da3ff",
    "#4de8e8",
    "#63e66d",
    "#a879ff",
    "#ff9f43",
    "#a3e635",
  ];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.sites = [];
    for (let i = 0; i < 7; i++) {
      this.sites.push({
        x: 80 + this.ctx.random.nextFloat() * 640,
        y: 60 + this.ctx.random.nextFloat() * 460,
        color: this.colors[i % this.colors.length],
      });
    }
  }

  public update(_deltaTime: number): void {}

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#060e1c");

    const w = renderer.getWidth();
    const h = renderer.getHeight() - 60;
    const step = 8;

    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        let minDist = Infinity;
        let nearestColor = "#060e1c";

        for (const s of this.sites) {
          const dx = Math.abs(x - s.x);
          const dy = Math.abs(y - s.y);
          const dist = this.useManhattan ? dx + dy : dx * dx + dy * dy;
          if (dist < minDist) {
            minDist = dist;
            nearestColor = s.color;
          }
        }

        pr.drawRect(x, y, step, step, nearestColor, true);
      }
    }

    // Draw site points
    for (const s of this.sites) {
      pr.drawRect(s.x - 4, s.y - 4, 8, 8, "#04060c", true);
      pr.drawRect(s.x - 2, s.y - 2, 4, 4, "#ffffff", true);
    }

    // Draw Cursor
    pr.drawRect(this.cursorX - 5, this.cursorY - 5, 10, 10, "#ffffff", false);

    // HUD
    const fullH = renderer.getHeight();
    pr.drawRect(0, fullH - 60, w, 60, "#080e1c", true);
    pr.drawText(
      `VORONOI GARDEN | Metric: ${this.useManhattan ? "Manhattan (L1)" : "Euclidean (L2)"} | Sites: ${this.sites.length}/16`,
      16,
      fullH - 36,
      { color: "#ffd84d", size: 11 }
    );
    pr.drawText(
      "[ARROWS] Move  [SPACE] Add Site  [Z] Remove Last  [X] Toggle Metric  [R] Reset",
      16,
      fullH - 16,
      { color: "#4de8e8", size: 9 }
    );
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    const step = 24;
    switch (action) {
      case "MOVE_LEFT":
        this.cursorX = Math.max(20, this.cursorX - step);
        break;
      case "MOVE_RIGHT":
        this.cursorX = Math.min(780, this.cursorX + step);
        break;
      case "MOVE_UP":
        this.cursorY = Math.max(20, this.cursorY - step);
        break;
      case "MOVE_DOWN":
        this.cursorY = Math.min(540, this.cursorY + step);
        break;
      case "ACTION_PRIMARY":
        if (this.sites.length < 16) {
          this.sites.push({
            x: this.cursorX,
            y: this.cursorY,
            color: this.colors[this.sites.length % this.colors.length],
          });
        }
        break;
      case "ACTION_SECONDARY":
        this.useManhattan = !this.useManhattan;
        break;
      case "RESTART":
        this.reset();
        break;
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
    return this.sites.length;
  }
  public getLevel(): number {
    return this.useManhattan ? 2 : 1;
  }
}
