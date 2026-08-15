import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface WallSpike {
  y: number;
  isLeft: boolean;
}

export class WallRunnerGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 60;
  private playerY: number = 550;
  private playerVx: number = 0;
  private currentWall: "left" | "right" | "midair" = "left";
  private climbSpeed: number = 240;
  private spikes: WallSpike[] = [];
  private score: number = 0;
  private spawnTimer: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 60;
    this.playerY = 550;
    this.playerVx = 0;
    this.currentWall = "left";
    this.climbSpeed = 240;
    this.score = 0;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.spikes = [];

    for (let i = 0; i < 5; i++) {
      this.spikes.push({
        y: 350 - i * 110,
        isLeft: this.ctx.random.next() < 0.5,
      });
    }
  }

  private jump(): void {
    if (this.gameOver || this.isPaused) return;

    if (this.currentWall === "left") {
      this.currentWall = "midair";
      this.playerVx = 550;
      this.ctx.audio.playRotate();
    } else if (this.currentWall === "right") {
      this.currentWall = "midair";
      this.playerVx = -550;
      this.ctx.audio.playRotate();
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Midair horizontal travel
    if (this.currentWall === "midair") {
      this.playerX += this.playerVx * dt;

      if (this.playerX <= 60) {
        this.playerX = 60;
        this.currentWall = "left";
        this.playerVx = 0;
        this.ctx.audio.playMove();
      } else if (this.playerX >= 540) {
        this.playerX = 540;
        this.currentWall = "right";
        this.playerVx = 0;
        this.ctx.audio.playMove();
      }
    }

    // Scroll vertical wall spikes
    for (const s of this.spikes) {
      s.y += this.climbSpeed * dt;

      // Spike collision check
      if (Math.abs(s.y - this.playerY) < 22) {
        if ((s.isLeft && this.playerX <= 75) || (!s.isLeft && this.playerX >= 525)) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
          this.ctx.audio.playExplosion();
        }
      }
    }

    // Recycle top spikes
    if (this.spikes[0].y > 670) {
      this.spikes.shift();
      const topY = this.spikes[this.spikes.length - 1].y;
      this.spikes.push({
        y: topY - (90 + this.ctx.random.next() * 30),
        isLeft: this.ctx.random.next() < 0.5,
      });
      this.score += 100;
    }

    this.score += Math.round(dt * 40);
    this.climbSpeed += dt * 3;
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

    // Left and Right Shaft Walls
    pr.drawRect(10, 10, 40, h - 20, "#00FF66", true);
    pr.drawRect(w - 50, 10, 40, h - 20, "#00FF66", true);

    // Draw Spikes
    for (const s of this.spikes) {
      if (s.isLeft) {
        pr.drawPixelBlock(50, s.y - 10, 20, "#FF3366", "#FFFFFF", "#040604");
      } else {
        pr.drawPixelBlock(w - 70, s.y - 10, 20, "#FF3366", "#FFFFFF", "#040604");
      }
    }

    // Draw Ninja Player
    pr.drawPixelBlock(this.playerX - 12, this.playerY - 12, 24, "#00F0FF", "#FFFFFF", "#040604");

    pr.drawText(`CLIMB ALTITUDE: ${this.score}  •  [SPACE TO WALL JUMP]`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("IMPALED ON SPIKE — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
