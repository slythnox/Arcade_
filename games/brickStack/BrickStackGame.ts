import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface StackLayer {
  x: number;
  y: number;
  width: number;
  color: string;
}

export class BrickStackGame implements GameInstance {
  private ctx!: GameContext;
  private stack: StackLayer[] = [];
  private currentX: number = 50;
  private currentY: number = 600;
  private currentWidth: number = 240;
  private currentDir: number = 1;
  private currentSpeed: number = 320;
  private blockHeight: number = 32;
  private score: number = 0;
  private level: number = 1;
  private combo: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.currentWidth = 240;
    this.currentX = 180;
    this.currentY = 600;
    this.currentSpeed = 320;
    this.currentDir = 1;
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.stack = [
      { x: 180, y: 640, width: 240, color: "#00FF66" },
    ];
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.currentX += this.currentDir * this.currentSpeed * dt;
    if (this.currentX < 40) {
      this.currentX = 40;
      this.currentDir = 1;
    } else if (this.currentX + this.currentWidth > 560) {
      this.currentX = 560 - this.currentWidth;
      this.currentDir = -1;
    }
  }

  private handleDrop(): void {
    if (this.gameOver || this.isPaused) return;

    const prevLayer = this.stack[this.stack.length - 1];
    const prevLeft = prevLayer.x;
    const prevRight = prevLayer.x + prevLayer.width;

    const curLeft = this.currentX;
    const curRight = this.currentX + this.currentWidth;

    // Check overlap
    const newLeft = Math.max(prevLeft, curLeft);
    const newRight = Math.min(prevRight, curRight);
    const overlap = newRight - newLeft;

    if (overlap <= 0) {
      // Total miss
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
      return;
    }

    // Precision placement check
    const diff = Math.abs(curLeft - prevLeft);
    let finalWidth = overlap;
    let finalX = newLeft;

    const colors = ["#00FF66", "#00F0FF", "#FFB703", "#FF3366", "#A855F7"];
    const color = colors[this.stack.length % colors.length];

    if (diff < 4) {
      // Perfect lock combo!
      this.combo++;
      finalWidth = prevLayer.width;
      finalX = prevLeft;
      this.score += 500 * this.combo;
      this.ctx.audio.playPowerUp();
    } else {
      this.combo = 0;
      this.score += Math.round(overlap * 2);
      this.ctx.audio.playMove();
    }

    this.stack.push({
      x: finalX,
      y: this.currentY,
      width: finalWidth,
      color,
    });

    this.currentWidth = finalWidth;
    this.level = this.stack.length;
    this.currentSpeed = Math.min(650, 320 + this.stack.length * 15);

    // Scroll stack if too high
    if (this.currentY < 200) {
      for (const s of this.stack) {
        s.y += this.blockHeight;
      }
    } else {
      this.currentY -= this.blockHeight;
    }

    this.currentX = 40;
    this.currentDir = 1;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY" && isPressed) {
      this.handleDrop();
    }
    if (action === "RESTART" && isPressed) this.reset();
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

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Stacked Layers
    for (const layer of this.stack) {
      pr.drawPixelBlock(layer.x, layer.y, layer.width, layer.color, "#FFFFFF", "rgba(0,0,0,0.5)");
    }

    // Draw Active Moving Block
    if (!this.gameOver) {
      pr.drawPixelBlock(this.currentX, this.currentY, this.currentWidth, "#FFFFFF", "#DCFCE7", "rgba(0,0,0,0.5)");
    }

    pr.drawText(`SCORE: ${this.score}  •  HEIGHT: ${this.level}  •  COMBO: ${this.combo}X`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("TOWER TOPPLED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
