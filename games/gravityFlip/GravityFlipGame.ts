import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  isCeiling: boolean;
}

export class GravityFlipGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 100;
  private playerY: number = 550;
  private playerVy: number = 0;
  private gravityDir: number = 1; // 1 = down, -1 = up
  private isGrounded: boolean = true;
  private speed: number = 380;
  private obstacles: Obstacle[] = [];
  private spawnTimer: number = 0;
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
    this.gravityDir = 1;
    this.isGrounded = true;
    this.speed = 380;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  private flipGravity(): void {
    if (this.gameOver || this.isPaused || !this.isGrounded) return;
    this.gravityDir *= -1;
    this.isGrounded = false;
    this.ctx.audio.playRotate();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Apply gravity
    const gravityForce = 1800 * this.gravityDir;
    this.playerVy += gravityForce * dt;
    this.playerY += this.playerVy * dt;

    // Floor & Ceiling bounds
    const floorY = 580;
    const ceilY = 120;

    if (this.gravityDir === 1 && this.playerY >= floorY) {
      this.playerY = floorY;
      this.playerVy = 0;
      this.isGrounded = true;
    } else if (this.gravityDir === -1 && this.playerY <= ceilY) {
      this.playerY = ceilY;
      this.playerVy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Spawn Obstacles
    this.spawnTimer += dt;
    if (this.spawnTimer > 1.3) {
      this.spawnTimer = 0;
      const isCeiling = this.ctx.random.next() < 0.5;
      const h = 40 + this.ctx.random.next() * 50;
      this.obstacles.push({
        x: 620,
        y: isCeiling ? ceilY : floorY - h + 24,
        width: 32,
        height: h,
        isCeiling,
      });
    }

    // Move Obstacles
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed * dt;

      if (obs.x < -50) {
        this.obstacles.splice(i, 1);
        this.score += 100;
        continue;
      }

      // Check AABB collision with player (size 24x24)
      if (
        this.playerX + 24 > obs.x &&
        this.playerX < obs.x + obs.width &&
        this.playerY + 24 > obs.y &&
        this.playerY < obs.y + obs.height
      ) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      }
    }

    this.score += Math.round(dt * 60);
    this.speed += dt * 4;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY" && isPressed) this.flipGravity();
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

    // Draw Ceiling & Floor Runners
    pr.drawRect(10, 110, w - 20, 10, "#00FF66", true);
    pr.drawRect(10, 604, w - 20, 10, "#00FF66", true);

    // Draw Obstacles (Spikes / Barriers)
    for (const obs of this.obstacles) {
      pr.drawPixelBlock(obs.x, obs.y, obs.width, "#FF3366", "#FFFFFF", "#040604");
    }

    // Draw Player
    pr.drawPixelBlock(this.playerX, this.playerY, 24, "#00F0FF", "#FFFFFF", "#047857");

    pr.drawText(`DISTANCE: ${this.score}  •  [SPACE TO INVERT GRAVITY]`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("COLLISION — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
