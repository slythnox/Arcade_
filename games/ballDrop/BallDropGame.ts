import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface FloorLayer {
  y: number;
  gapX: number;
  gapWidth: number;
}

export class BallDropGame implements GameInstance {
  private ctx!: GameContext;
  private ballX: number = 300;
  private ballY: number = 200;
  private ballVx: number = 0;
  private ballVy: number = 0;
  private ballRadius: number = 10;
  private scrollSpeed: number = 180;
  private floors: FloorLayer[] = [];
  private score: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.ballX = 300;
    this.ballY = 200;
    this.ballVx = 0;
    this.ballVy = 0;
    this.scrollSpeed = 180;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.floors = [];

    for (let i = 0; i < 6; i++) {
      this.floors.push({
        y: 250 + i * 90,
        gapX: 80 + this.ctx.random.next() * 380,
        gapWidth: 90,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Horizontal steering
    if (this.moveLeft) this.ballVx = -360;
    else if (this.moveRight) this.ballVx = 360;
    else this.ballVx *= 0.85;

    this.ballX += this.ballVx * dt;
    this.ballX = Math.max(30, Math.min(570, this.ballX));

    // Vertical gravity
    this.ballVy += 980 * dt;
    this.ballY += this.ballVy * dt;

    // Scroll floors upward
    for (const f of this.floors) {
      f.y -= this.scrollSpeed * dt;

      // Check collision with floor (ball resting on it)
      if (
        this.ballY + this.ballRadius >= f.y &&
        this.ballY - this.ballRadius <= f.y + 12 &&
        this.ballVy >= 0
      ) {
        // Is ball outside gap?
        if (this.ballX < f.gapX || this.ballX > f.gapX + f.gapWidth) {
          this.ballY = f.y - this.ballRadius;
          this.ballVy = -this.scrollSpeed; // Pushed up with floor
        }
      }
    }

    // Recycle top floor
    if (this.floors[0].y < 40) {
      this.floors.shift();
      const lastY = this.floors[this.floors.length - 1].y;
      this.floors.push({
        y: lastY + 90,
        gapX: 60 + this.ctx.random.next() * 400,
        gapWidth: Math.max(60, 90 - this.score * 0.005),
      });
      this.score += 100;
      this.ctx.audio.playMove();
    }

    // Check ceiling crush / floor fall
    if (this.ballY - this.ballRadius <= 50 || this.ballY + this.ballRadius >= 660) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    }

    this.score += Math.round(dt * 30);
    this.scrollSpeed += dt * 3;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
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

    // Hazard Ceiling Spikes
    pr.drawRect(10, 40, w - 20, 10, "#FF3366", true);

    // Draw Floors
    for (const f of this.floors) {
      // Left segment
      if (f.gapX > 10) {
        pr.drawPixelBlock(10, f.y, f.gapX - 10, "#00FF66", "#FFFFFF", "#047857");
      }
      // Right segment
      const rStart = f.gapX + f.gapWidth;
      if (rStart < w - 10) {
        pr.drawPixelBlock(rStart, f.y, w - 10 - rStart, "#00FF66", "#FFFFFF", "#047857");
      }
    }

    // Draw Ball
    pr.drawCircle(this.ballX, this.ballY, this.ballRadius, "#00F0FF", true);
    pr.drawCircle(this.ballX, this.ballY, 4, "#FFFFFF", true);

    pr.drawText(`DEPTH SCORE: ${this.score}  •  [← → TO STEER BALL]`, w / 2, 24, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("BALL CRUSHED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
