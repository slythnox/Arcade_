import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface HazardSpike {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class OneButtonJumpGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 100;
  private playerY: number = 550;
  private playerVy: number = 0;
  private isGrounded: boolean = true;
  private speed: number = 360;
  private hazards: HazardSpike[] = [];
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 100;
    this.playerY = 550;
    this.playerVy = 0;
    this.isGrounded = true;
    this.speed = 360;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.hazards = [];

    for (let i = 0; i < 4; i++) {
      this.hazards.push({
        x: 400 + i * 220,
        y: 540,
        w: 24,
        h: 24,
      });
    }
  }

  private jump(): void {
    if (this.gameOver || this.isPaused || !this.isGrounded) return;
    this.playerVy = -540;
    this.isGrounded = false;
    this.ctx.audio.playRotate();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Gravity
    this.playerVy += 1400 * dt;
    this.playerY += this.playerVy * dt;

    if (this.playerY >= 550) {
      this.playerY = 550;
      this.playerVy = 0;
      this.isGrounded = true;
    }

    // Scroll hazards
    for (const h of this.hazards) {
      h.x -= this.speed * dt;

      // Check collision (AABB)
      if (
        this.playerX + 20 > h.x &&
        this.playerX - 20 < h.x + h.w &&
        this.playerY + 20 > h.y &&
        this.playerY - 20 < h.y + h.h
      ) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      }
    }

    // Recycle hazards
    if (this.hazards[0].x < -50) {
      this.hazards.shift();
      const lastX = this.hazards[this.hazards.length - 1].x;
      this.hazards.push({
        x: lastX + 180 + this.ctx.random.next() * 120,
        y: 540,
        w: 24,
        h: 24,
      });
      this.score += 150;
      this.ctx.audio.playMove();
    }

    this.score += Math.round(dt * 50);
    this.speed += dt * 3;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY" && isPressed) this.jump();
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Ground Floor
    pr.drawRect(10, 564, w - 20, 100, "#080e08", true);
    pr.drawLine(10, 564, w - 10, 564, "#00FF66", 2);

    // Draw Hazard Spikes
    for (const haz of this.hazards) {
      pr.drawPixelBlock(haz.x, haz.y, haz.w, "#FF3366", "#FFFFFF", "#040604");
    }

    // Draw Player Runner
    pr.drawPixelBlock(this.playerX - 14, this.playerY - 14, 28, "#00F0FF", "#FFFFFF", "#040604");

    pr.drawText(`SCORE: ${this.score}  •  [SPACE TO TIMING JUMP]`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("TIMING FAILED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
