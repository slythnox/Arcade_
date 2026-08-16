import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

type PlatformType = "normal" | "moving" | "fragile" | "spring";

interface Platform {
  x: number;
  y: number;
  width: number;
  type: PlatformType;
  dir?: number;
  broken?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class PixelJumperGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 500);
  private playerVel: Vector2 = new Vector2(0, -650);
  private platforms: Platform[] = [];
  private particles: Particle[] = [];
  private score: number = 0;
  private maxHeight: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 500);
    this.playerVel = new Vector2(0, -650);
    this.score = 0;
    this.maxHeight = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.platforms = [];
    this.particles = [];

    // Starting platforms
    this.platforms.push({ x: 240, y: 550, width: 120, type: "normal" });
    for (let i = 1; i < 10; i++) {
      this.spawnPlatform(550 - i * 65);
    }
  }

  private spawnPlatform(y: number): void {
    const roll = this.ctx.random.next();
    let type: PlatformType = "normal";
    if (roll > 0.8) type = "spring";
    else if (roll > 0.6) type = "moving";
    else if (roll > 0.45) type = "fragile";

    this.platforms.push({
      x: 40 + this.ctx.random.next() * 440,
      y,
      width: 80,
      type,
      dir: this.ctx.random.next() > 0.5 ? 1 : -1,
      broken: false,
    });
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 30 + this.ctx.random.next() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.35,
        color,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    if (this.moveLeft) this.playerVel.x = -340;
    else if (this.moveRight) this.playerVel.x = 340;
    else this.playerVel.x *= 0.88;

    // Gravity
    this.playerVel.y += 1100 * dt;
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Screen horizontal wrap
    if (this.playerPos.x < 0) this.playerPos.x = 600;
    else if (this.playerPos.x > 600) this.playerPos.x = 0;

    // Update moving platforms
    for (const p of this.platforms) {
      if (p.type === "moving" && p.dir) {
        p.x += p.dir * 120 * dt;
        if (p.x < 30) { p.x = 30; p.dir = 1; }
        if (p.x > 490) { p.x = 490; p.dir = -1; }
      }
    }

    // Platform collision when falling
    if (this.playerVel.y > 0) {
      for (const p of this.platforms) {
        if (
          !p.broken &&
          this.playerPos.x >= p.x - 10 &&
          this.playerPos.x <= p.x + p.width + 10 &&
          this.playerPos.y >= p.y - 12 &&
          this.playerPos.y <= p.y + 14
        ) {
          if (p.type === "fragile") {
            p.broken = true;
            this.addParticles(p.x + p.width / 2, p.y, "#B45309", 10);
            this.ctx.audio.playExplosion();
          } else if (p.type === "spring") {
            this.playerVel.y = -950;
            this.addParticles(p.x + p.width / 2, p.y, "#FFD84D", 12);
            this.ctx.audio.playPowerUp();
          } else {
            this.playerVel.y = -620;
            this.addParticles(p.x + p.width / 2, p.y, "#22C55E", 6);
            this.ctx.audio.playRotate();
          }
          break;
        }
      }
    }

    // Camera upward scroll
    if (this.playerPos.y < 300) {
      const diff = 300 - this.playerPos.y;
      this.playerPos.y = 300;
      this.maxHeight += diff;
      this.score = Math.floor(this.maxHeight / 10);

      for (const p of this.platforms) {
        p.y += diff;
      }

      // Recycle fallen platforms
      this.platforms = this.platforms.filter((p) => p.y < 700);
      while (this.platforms.length < 10) {
        const topY = Math.min(...this.platforms.map((p) => p.y));
        this.spawnPlatform(topY - 65);
      }
    }

    // Fall death
    if (this.playerPos.y > 720) {
      this.gameOver = true;
      this.ctx.audio.playGameOver();
      this.ctx.session.setStatus("game-over");
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
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
  public getLevel(): number { return Math.floor(this.score / 1000) + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Vertical Sky Grid
    pr.drawGrid(8, 9, 65, "rgba(56, 189, 248, 0.03)", 40, 60);

    // 2. Platforms
    for (const p of this.platforms) {
      if (p.broken) continue;

      if (p.type === "spring") {
        pr.drawPixelBlock(p.x, p.y, 16, "#F59E0B", "#FEF08A", "#B45309");
        pr.drawRect(p.x + 16, p.y, p.width - 32, 14, "#F59E0B", true);
        // Spring coil
        pr.drawCircle(p.x + p.width / 2, p.y - 4, 6, "#FFD84D", true);
      } else if (p.type === "moving") {
        pr.drawPixelBlock(p.x, p.y, 16, "#0284C7", "#38BDF8", "#0369A1");
        pr.drawRect(p.x + 16, p.y, p.width - 32, 14, "#0284C7", true);
      } else if (p.type === "fragile") {
        pr.drawPixelBlock(p.x, p.y, 16, "#78350F", "#B45309", "#451A03");
        pr.drawRect(p.x + 16, p.y, p.width - 32, 14, "#78350F", true);
        pr.drawLine(p.x + 20, p.y + 2, p.x + 60, p.y + 12, "#000000", 2);
      } else {
        pr.drawPixelBlock(p.x, p.y, 16, "#16A34A", "#4ADE80", "#15803D");
        pr.drawRect(p.x + 16, p.y, p.width - 32, 14, "#16A34A", true);
      }
    }

    // 3. Particles
    for (const pt of this.particles) {
      pr.drawCircle(pt.x, pt.y, 2.5, pt.color, true);
    }

    // 4. Draw Jumper Character (Squash & Stretch)
    const px = this.playerPos.x;
    const py = this.playerPos.y;
    const stretchY = Math.max(-6, Math.min(6, -this.playerVel.y * 0.015));

    pr.drawPixelBlock(px - 12, py - 18 - stretchY, 24, "#00F0FF", "#E0F2FE", "#0284C7");
    pr.drawCircle(px, py - 24 - stretchY, 8, "#FFFFFF", true);
    // Eyes
    pr.drawCircle(px - 3, py - 25 - stretchY, 2, "#0F172A", true);
    pr.drawCircle(px + 3, py - 25 - stretchY, 2, "#0F172A", true);

    // 5. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`ALTITUDE: ${Math.floor(this.maxHeight / 10)}m`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w / 2, 32, { size: 13, color: "#38bdf8", align: "center", font: "monospace" });
    pr.drawText(`LVL ${this.getLevel()}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("GRAVITY PREVAILED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO BOUNCE AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
