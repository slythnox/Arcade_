import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  isCeiling: boolean;
}

interface Particle {
  x: number;
  y: number;
  life: number;
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
  private trail: Particle[] = [];
  private spawnTimer: number = 0;
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private time: number = 0;
  private flipFlash: number = 0;

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
    this.trail = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.time = 0;
    this.flipFlash = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  private flipGravity(): void {
    if (this.gameOver || this.isPaused || !this.isGrounded) return;
    this.gravityDir *= -1;
    this.isGrounded = false;
    this.flipFlash = 0.25;
    this.ctx.audio.playRotate();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.time += dt;
    if (this.flipFlash > 0) this.flipFlash = Math.max(0, this.flipFlash - dt);

    this.trail.push({ x: this.playerX + 12, y: this.playerY + 12, life: 1.0 });
    if (this.trail.length > 10) this.trail.shift();
    for (const p of this.trail) p.life -= dt * 2;

    const gravityForce = 1800 * this.gravityDir;
    this.playerVy += gravityForce * dt;
    this.playerY += this.playerVy * dt;

    const floorY = 580;
    const ceilY = 120;

    if (this.gravityDir === 1 && this.playerY >= floorY - 24) {
      this.playerY = floorY - 24;
      this.playerVy = 0;
      this.isGrounded = true;
    } else if (this.gravityDir === -1 && this.playerY <= ceilY) {
      this.playerY = ceilY;
      this.playerVy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    this.spawnTimer += dt;
    if (this.spawnTimer > 1.3 - Math.min(0.8, this.speed / 2000)) {
      this.spawnTimer = 0;
      const isCeiling = this.ctx.random.next() < 0.5;
      const h = 40 + this.ctx.random.next() * 50;
      this.obstacles.push({
        x: 620,
        y: isCeiling ? ceilY : floorY - h,
        width: 32,
        height: h,
        isCeiling,
      });
    }

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed * dt;

      if (obs.x < -50) {
        this.obstacles.splice(i, 1);
        this.score += 100;
        continue;
      }

      if (
        this.playerX + 20 > obs.x &&
        this.playerX + 4 < obs.x + obs.width &&
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
    const rawCtx = pr.getContext();
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const grad = rawCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0a0a2e');
    grad.addColorStop(1, '#1a0a3e');
    rawCtx.fillStyle = grad;
    rawCtx.fillRect(0, 0, w, h);

    if (this.flipFlash > 0) {
      pr.drawRect(0, 0, w, h, `rgba(255, 255, 255, ${this.flipFlash * 2})`, false);
      rawCtx.lineWidth = 8;
      rawCtx.strokeStyle = `rgba(0, 255, 255, ${this.flipFlash * 4})`;
      rawCtx.strokeRect(4, 4, w - 8, h - 8);
    }

    pr.drawRect(10, 110, w - 20, 10, "#00FF66", true);
    pr.drawRect(10, 580, w - 20, 10, "#00FF66", true);

    for (const obs of this.obstacles) {
      rawCtx.fillStyle = "#FF3366";
      rawCtx.beginPath();
      if (obs.isCeiling) {
        rawCtx.moveTo(obs.x, obs.y);
        rawCtx.lineTo(obs.x + obs.width, obs.y);
        rawCtx.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
      } else {
        rawCtx.moveTo(obs.x + obs.width / 2, obs.y);
        rawCtx.lineTo(obs.x + obs.width, obs.y + obs.height);
        rawCtx.lineTo(obs.x, obs.y + obs.height);
      }
      rawCtx.fill();
    }

    for (const p of this.trail) {
      if (p.life > 0) {
        pr.drawCircle(p.x, p.y, 4 * p.life, `rgba(0, 240, 255, ${p.life})`, true);
      }
    }

    rawCtx.save();
    rawCtx.translate(this.playerX + 12, this.playerY + 12);
    if (this.gravityDir === -1) {
      rawCtx.rotate(Math.PI);
    }
    
    pr.drawRect(-6, -8, 12, 16, "#00F0FF", true); // Body
    pr.drawCircle(0, -12, 6, "#FFFFFF", true); // Head
    
    const legOffset = Math.sin(this.time * 15) * 5;
    pr.drawRect(-4, 8, 4, 6 + legOffset, "#047857", true);
    pr.drawRect(2, 8, 4, 6 - legOffset, "#047857", true);
    
    rawCtx.restore();

    pr.drawRect(w - 20, 150, 10, 400, "#111", true);
    const speedRatio = Math.min(1, (this.speed - 380) / 1000);
    pr.drawRect(w - 20, 550 - 400 * speedRatio, 10, 400 * speedRatio, "#00F0FF", true);

    pr.drawText(`DISTANCE: ${this.score}  •  [SPACE] INVERT GRAVITY`, w / 2, 28, {
      size: 14,
      color: "#00FF66",
      align: "center",
      font: "monospace"
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("COLLISION — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
