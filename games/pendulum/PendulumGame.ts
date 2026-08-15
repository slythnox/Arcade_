import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

export class PendulumGame implements GameInstance {
  private ctx!: GameContext;
  private pivotX: number = 300;
  private pivotY: number = 180;
  private length: number = 260;
  private angle: number = Math.PI / 3;
  private angleVel: number = 0;
  private targetMinAngle: number = -0.15;
  private targetMaxAngle: number = 0.15;
  private score: number = 0;
  private streak: number = 0;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.angle = Math.PI / 2.8;
    this.angleVel = 0;
    this.score = 0;
    this.streak = 0;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
  }

  private handleTrigger(): void {
    if (this.gameOver || this.isPaused) return;

    if (this.angle >= this.targetMinAngle && this.angle <= this.targetMaxAngle) {
      // Perfect timing window!
      this.streak++;
      this.score += 200 * this.streak;
      this.ctx.audio.playPowerUp();
    } else {
      this.streak = 0;
      this.lives--;
      this.ctx.audio.playExplosion();
      if (this.lives <= 0) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      }
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Harmonic simple pendulum differential equation: \theta'' = - (g / L) * sin(\theta)
    const g = 980;
    const angleAcc = -(g / this.length) * Math.sin(this.angle);

    this.angleVel += angleAcc * dt;
    this.angle += this.angleVel * dt;

    // Natural air damping
    this.angleVel *= 0.9999;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY" && isPressed) this.handleTrigger();
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Target Hit Zone Arc
    const arcX1 = this.pivotX + Math.sin(this.targetMinAngle) * this.length;
    const arcY1 = this.pivotY + Math.cos(this.targetMinAngle) * this.length;
    const arcX2 = this.pivotX + Math.sin(this.targetMaxAngle) * this.length;
    const arcY2 = this.pivotY + Math.cos(this.targetMaxAngle) * this.length;

    pr.drawLine(this.pivotX, this.pivotY, arcX1, arcY1, "rgba(0, 255, 102, 0.15)", 1);
    pr.drawLine(this.pivotX, this.pivotY, arcX2, arcY2, "rgba(0, 255, 102, 0.15)", 1);
    pr.drawLine(arcX1, arcY1, arcX2, arcY2, "#00FF66", 6);

    // Draw Pivot Point
    pr.drawCircle(this.pivotX, this.pivotY, 10, "#FFB703", true);

    // Draw Pendulum Arm & Bob
    const bobX = this.pivotX + Math.sin(this.angle) * this.length;
    const bobY = this.pivotY + Math.cos(this.angle) * this.length;
    pr.drawLine(this.pivotX, this.pivotY, bobX, bobY, "#FFFFFF", 3);
    pr.drawCircle(bobX, bobY, 22, "#00F0FF", true);
    pr.drawCircle(bobX, bobY, 6, "#FFFFFF", true);

    pr.drawText(
      `SCORE: ${this.score}  •  STREAK: ${this.streak}X  •  LIVES: ${this.lives}  •  [SPACE TO STRIKE TARGET ZONE]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("RHYTHM BROKEN — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
