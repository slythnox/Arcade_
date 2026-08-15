import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Platform {
  x: number;
  y: number;
  width: number;
}

export class PixelJumperGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 500);
  private playerVel: Vector2 = new Vector2(0, 0);
  private platforms: Platform[] = [];
  private score: number = 0;
  private maxHeight: number = 0;
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
    this.playerPos = new Vector2(300, 500);
    this.playerVel = new Vector2(0, -600);
    this.score = 0;
    this.maxHeight = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.platforms = [];

    // Starting platforms
    this.platforms.push({ x: 240, y: 550, width: 120 });
    for (let i = 1; i < 8; i++) {
      this.platforms.push({
        x: 60 + this.ctx.random.next() * 400,
        y: 550 - i * 75,
        width: 90,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    if (this.moveLeft) this.playerVel.x = -360;
    else if (this.moveRight) this.playerVel.x = 360;
    else this.playerVel.x *= 0.85;

    // Gravity
    this.playerVel.y += 980 * dt;

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Screen wrapping
    if (this.playerPos.x < 0) this.playerPos.x += 600;
    if (this.playerPos.x > 600) this.playerPos.x -= 600;

    // Check platform collision (only when falling)
    if (this.playerVel.y > 0) {
      for (const p of this.platforms) {
        if (
          this.playerPos.x + 14 > p.x &&
          this.playerPos.x - 14 < p.x + p.width &&
          this.playerPos.y + 16 >= p.y &&
          this.playerPos.y + 16 <= p.y + 14
        ) {
          // Bounce jump!
          this.playerVel.y = -620;
          this.ctx.audio.playPowerUp();
          break;
        }
      }
    }

    // Camera scroll up
    if (this.playerPos.y < 320) {
      const diff = 320 - this.playerPos.y;
      this.playerPos.y = 320;
      this.score += Math.round(diff);

      for (const p of this.platforms) {
        p.y += diff;
      }

      // Recycle platforms that fell below screen
      for (let i = this.platforms.length - 1; i >= 0; i--) {
        if (this.platforms[i].y > 670) {
          this.platforms.splice(i, 1);
          const topY = Math.min(...this.platforms.map((p) => p.y));
          this.platforms.push({
            x: 60 + this.ctx.random.next() * 400,
            y: topY - (65 + this.ctx.random.next() * 25),
            width: Math.max(60, 90 - this.score * 0.002),
          });
        }
      }
    }

    // Fell off bottom
    if (this.playerPos.y > 670) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    }
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

    // Draw Platforms
    for (const p of this.platforms) {
      pr.drawPixelBlock(p.x, p.y, p.width, "#00FF66", "#FFFFFF", "#047857");
    }

    // Draw Player
    pr.drawPixelBlock(this.playerPos.x - 12, this.playerPos.y - 12, 24, "#00F0FF", "#FFFFFF", "#040604");

    pr.drawText(`ALTITUDE: ${this.score}  •  [← → TO STEER JUMPER]`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("FALLEN FROM SKY — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
