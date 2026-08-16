import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface StackLayer {
  x: number;
  y: number;
  width: number;
  color: string;
  glow: string;
}

interface SlicedChunk {
  x: number;
  y: number;
  width: number;
  color: string;
  vy: number;
}

export class BrickStackGame implements GameInstance {
  private ctx!: GameContext;
  private stack: StackLayer[] = [];
  private slicedChunks: SlicedChunk[] = [];
  private currentX: number = 50;
  private currentY: number = 580;
  private currentWidth: number = 240;
  private currentDir: number = 1;
  private currentSpeed: number = 340;
  private blockHeight: number = 28;
  private score: number = 0;
  private level: number = 1;
  private combo: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  private rainbowColors = [
    { color: "#FF3366", glow: "#FFE4E6" },
    { color: "#FF7A00", glow: "#FFEDD5" },
    { color: "#FFD84D", glow: "#FEF9C3" },
    { color: "#10B981", glow: "#D1FAE5" },
    { color: "#00F0FF", glow: "#E0F2FE" },
    { color: "#3B82F6", glow: "#DBEAFE" },
    { color: "#A855F7", glow: "#F3E8FF" },
    { color: "#EC4899", glow: "#FCE7F3" },
  ];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.currentWidth = 240;
    this.currentX = 180;
    this.currentY = 580;
    this.currentSpeed = 340;
    this.currentDir = 1;
    this.score = 0;
    this.level = 1;
    this.combo = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.slicedChunks = [];
    this.stack = [
      { x: 180, y: 610, width: 240, color: "#00F0FF", glow: "#E0F2FE" },
    ];
  }

  public update(dt: number): void {
    globalParticles.update(dt);

    // Update falling sliced chunks
    for (let i = this.slicedChunks.length - 1; i >= 0; i--) {
      const c = this.slicedChunks[i];
      c.vy += 900 * dt;
      c.y += c.vy * dt;
      if (c.y > 720) this.slicedChunks.splice(i, 1);
    }

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

    const newLeft = Math.max(prevLeft, curLeft);
    const newRight = Math.min(prevRight, curRight);
    const overlap = newRight - newLeft;

    if (overlap <= 0) {
      // Total miss
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio?.playExplosion?.();
      globalParticles.emitBurst(this.currentX + this.currentWidth / 2, this.currentY, 24, ["#FF3366", "#F59E0B"], 80, 260);
      return;
    }

    const diff = Math.abs(curLeft - prevLeft);
    let finalWidth = overlap;
    let finalX = newLeft;

    const colObj = this.rainbowColors[this.stack.length % this.rainbowColors.length];

    if (diff < 5) {
      // Perfect lock combo!
      this.combo++;
      finalWidth = prevLayer.width;
      finalX = prevLeft;
      const pts = 500 * this.combo;
      this.score += pts;
      this.ctx.audio?.playPowerUp?.();
      globalParticles.emitBurst(finalX + finalWidth / 2, this.currentY, 18, [colObj.color, "#FFFFFF", "#ffd84d"], 70, 240);
      globalParticles.emitText(`PERFECT ${this.combo}X! +${pts}`, finalX + finalWidth / 2, this.currentY - 10, "#ffd84d", 16);
    } else {
      this.combo = 0;
      this.score += 100 * this.level;
      this.ctx.audio?.playHit?.();

      // Sliced chunk drops off edge
      const sliceWidth = this.currentWidth - overlap;
      const sliceX = curLeft < prevLeft ? curLeft : newRight;
      this.slicedChunks.push({
        x: sliceX,
        y: this.currentY,
        width: sliceWidth,
        color: colObj.color,
        vy: 40,
      });
      globalParticles.emitBurst(sliceX + sliceWidth / 2, this.currentY, 8, [colObj.color, "#94A3B8"], 40, 160);
    }

    this.currentWidth = finalWidth;
    this.stack.push({
      x: finalX,
      y: this.currentY,
      width: finalWidth,
      color: colObj.color,
      glow: colObj.glow,
    });

    this.level++;
    this.currentSpeed = Math.min(680, 340 + this.level * 12);

    // Scroll stack downward when reaching upper threshold
    if (this.currentY < 180) {
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
    pr.clear("#040714");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Stage border
    pr.drawRect(8, 8, w - 16, h - 16, "#1e293b", false);

    // Draw Falling Sliced Chunks
    for (const chunk of this.slicedChunks) {
      pr.drawPixelRect(chunk.x, chunk.y, chunk.width, this.blockHeight, chunk.color, "#FFFFFF", "rgba(0,0,0,0.5)");
    }

    // Draw Stacked Layers
    for (const layer of this.stack) {
      pr.drawPixelRect(layer.x, layer.y, layer.width, this.blockHeight, layer.color, layer.glow, "#0F172A");
    }

    // Draw Active Moving Block
    if (!this.gameOver) {
      const activeCol = this.rainbowColors[this.stack.length % this.rainbowColors.length];
      pr.drawPixelRect(
        this.currentX,
        this.currentY,
        this.currentWidth,
        this.blockHeight,
        activeCol.color,
        "#FFFFFF",
        "#0F172A"
      );
    }

    // Render Particles & Floating Text
    globalParticles.render(pr);

    // Top HUD
    pr.drawRect(12, 12, w - 24, 28, "rgba(8, 14, 28, 0.8)", true);
    pr.drawRect(12, 12, w - 24, 28, "#1e293b", false);
    pr.drawText(`SCORE: ${this.score}  •  HEIGHT: ${this.level}  •  COMBO: ${this.combo}X`, w / 2, 30, {
      size: 11,
      color: "#00F0FF",
      align: "center",
      font: "monospace",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("TOWER TOPPLED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
