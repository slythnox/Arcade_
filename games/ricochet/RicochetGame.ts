import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Target {
  pos: Vector2;
  radius: number;
  hit: boolean;
}

interface ObstacleWall {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class RicochetGame implements GameInstance {
  private ctx!: GameContext;
  private gunPos: Vector2 = new Vector2(60, 350);
  private aimAngle: number = 0;
  private aimDir: number = 0;
  private bulletPos: Vector2 | null = null;
  private bulletVel: Vector2 | null = null;
  private bulletBounces: number = 0;
  private readonly maxBounces: number = 10;
  private targets: Target[] = [];
  private walls: ObstacleWall[] = [];
  private particles: Particle[] = [];
  private shotsRemaining: number = 5;
  private score: number = 0;
  private level: number = 1;
  private isWon: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.gunPos = new Vector2(60, 350);
    this.aimAngle = 0;
    this.aimDir = 0;
    this.bulletPos = null;
    this.bulletVel = null;
    this.shotsRemaining = 5;
    this.score = 0;
    this.level = 1;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;
    this.particles = [];

    this.targets = [
      { pos: new Vector2(480, 160), radius: 20, hit: false },
      { pos: new Vector2(480, 540), radius: 20, hit: false },
      { pos: new Vector2(300, 140), radius: 20, hit: false },
    ];

    this.walls = [
      { x: 220, y: 220, w: 20, h: 260 },
      { x: 380, y: 100, w: 20, h: 200 },
      { x: 380, y: 400, w: 20, h: 200 },
    ];
  }

  private addParticles(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 40 + this.ctx.random.next() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.4,
        color,
      });
    }
  }

  private shoot(): void {
    if (this.bulletPos || this.shotsRemaining <= 0 || this.isWon || this.gameOver) return;

    this.shotsRemaining--;
    this.bulletPos = new Vector2(this.gunPos.x + Math.cos(this.aimAngle) * 36, this.gunPos.y + Math.sin(this.aimAngle) * 36);
    const speed = 720;
    this.bulletVel = new Vector2(Math.cos(this.aimAngle) * speed, Math.sin(this.aimAngle) * speed);
    this.bulletBounces = 0;
    this.addParticles(this.bulletPos.x, this.bulletPos.y, "#00F0FF", 8);
    this.ctx.audio.playLaser();
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;

    if (this.aimDir !== 0) {
      this.aimAngle += this.aimDir * 2.5 * dt;
    }

    if (this.bulletPos && this.bulletVel) {
      this.bulletPos.x += this.bulletVel.x * dt;
      this.bulletPos.y += this.bulletVel.y * dt;

      // Trailing sparks
      if (this.ctx.random.next() > 0.4) {
        this.addParticles(this.bulletPos.x, this.bulletPos.y, "#00F0FF", 1);
      }

      // Arena boundary bounces
      if (this.bulletPos.x <= 20 || this.bulletPos.x >= 580) {
        this.bulletVel.x *= -1;
        this.bulletBounces++;
        this.addParticles(this.bulletPos.x, this.bulletPos.y, "#FFD84D", 4);
        this.ctx.audio.playHit();
      }
      if (this.bulletPos.y <= 70 || this.bulletPos.y >= 650) {
        this.bulletVel.y *= -1;
        this.bulletBounces++;
        this.addParticles(this.bulletPos.x, this.bulletPos.y, "#FFD84D", 4);
        this.ctx.audio.playHit();
      }

      // Wall bounces
      for (const w of this.walls) {
        if (
          this.bulletPos.x >= w.x &&
          this.bulletPos.x <= w.x + w.w &&
          this.bulletPos.y >= w.y &&
          this.bulletPos.y <= w.y + w.h
        ) {
          // Reflect along closest axis
          const toLeft = Math.abs(this.bulletPos.x - w.x);
          const toRight = Math.abs(this.bulletPos.x - (w.x + w.w));
          const toTop = Math.abs(this.bulletPos.y - w.y);
          const toBottom = Math.abs(this.bulletPos.y - (w.y + w.h));
          const minD = Math.min(toLeft, toRight, toTop, toBottom);

          if (minD === toLeft || minD === toRight) this.bulletVel.x *= -1;
          else this.bulletVel.y *= -1;

          this.bulletBounces++;
          this.addParticles(this.bulletPos.x, this.bulletPos.y, "#38BDF8", 6);
          this.ctx.audio.playHit();
          break;
        }
      }

      // Target collisions
      for (const t of this.targets) {
        if (!t.hit && Math.hypot(t.pos.x - this.bulletPos.x, t.pos.y - this.bulletPos.y) < t.radius) {
          t.hit = true;
          this.score += 500 * (this.bulletBounces + 1);
          this.addParticles(t.pos.x, t.pos.y, "#22C55E", 16);
          this.ctx.audio.playExplosion();
        }
      }

      // Max bounce or done
      if (this.bulletBounces >= this.maxBounces) {
        this.bulletPos = null;
        this.bulletVel = null;
      }

      // Check win
      if (this.targets.every((t) => t.hit)) {
        this.isWon = true;
        this.score += this.shotsRemaining * 1000;
        this.ctx.audio.playVictory();
        this.ctx.session.setStatus("ready");
      } else if (!this.bulletPos && this.shotsRemaining <= 0) {
        this.gameOver = true;
        this.ctx.audio.playGameOver();
        this.ctx.session.setStatus("game-over");
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_UP") this.aimDir = isPressed ? -1 : 0;
    if (action === "MOVE_DOWN") this.aimDir = isPressed ? 1 : 0;

    if (action === "ACTION_PRIMARY" && isPressed) {
      this.shoot();
    }

    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cyber Target Chamber Grid
    pr.drawGrid(8, 9, 65, "rgba(0, 240, 255, 0.04)", 40, 70);

    // Arena Perimeter Bounds
    pr.drawRect(20, 70, 560, 580, "#1e293b", false);
    pr.drawRect(21, 71, 558, 578, "rgba(0, 240, 255, 0.15)", false);

    // 2. Reflective Metal Obstacle Walls
    for (const wl of this.walls) {
      pr.drawPixelBlock(wl.x, wl.y, wl.w, "#334155", "#64748B", "#0F172A");
      pr.drawRect(wl.x, wl.y, wl.w, wl.h, "#00F0FF", false);
    }

    // 3. Draw Laser Aim Trajectory Sight
    const sightLen = 80;
    pr.drawLine(
      this.gunPos.x,
      this.gunPos.y,
      this.gunPos.x + Math.cos(this.aimAngle) * sightLen,
      this.gunPos.y + Math.sin(this.aimAngle) * sightLen,
      "rgba(0, 240, 255, 0.4)",
      2
    );

    // 4. Draw Targets
    for (const t of this.targets) {
      const col = t.hit ? "#334155" : "#EF4444";
      const pulse = !t.hit ? Math.sin(this.animTime * 6 + t.pos.x) * 2 : 0;

      pr.drawCircle(t.pos.x, t.pos.y, t.radius + pulse, col, true);
      pr.drawCircle(t.pos.x, t.pos.y, t.radius * 0.65, "#FFFFFF", true);
      pr.drawCircle(t.pos.x, t.pos.y, t.radius * 0.3, col, true);
    }

    // 5. Draw Active High-Velocity Bullet
    if (this.bulletPos) {
      pr.drawCircle(this.bulletPos.x, this.bulletPos.y, 6, "#00F0FF", true);
      pr.drawCircle(this.bulletPos.x, this.bulletPos.y, 3, "#FFFFFF", true);
    }

    // 6. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2.5, p.color, true);
    }

    // 7. Draw Cannon Turret at left
    pr.drawCircle(this.gunPos.x, this.gunPos.y, 18, "#1E293B", true);
    pr.drawCircle(this.gunPos.x, this.gunPos.y, 14, "#0284C7", true);
    // Barrel
    const bx = this.gunPos.x + Math.cos(this.aimAngle) * 28;
    const by = this.gunPos.y + Math.sin(this.aimAngle) * 28;
    pr.drawLine(this.gunPos.x, this.gunPos.y, bx, by, "#38BDF8", 6);

    // 8. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SHOTS: ${"●".repeat(Math.max(0, this.shotsRemaining))}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    const targetsLeft = this.targets.filter((t) => !t.hit).length;
    pr.drawText(`TARGETS: ${targetsLeft} LEFT`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    // Bottom Controls Bar
    pr.drawRect(0, h - 45, w, 45, "#080e1c", true);
    pr.drawLine(0, h - 45, w, h - 45, "#1e293b", 1);
    pr.drawText("[UP/DOWN] Aim Cannon  •  [SPACE] Fire Ricochet Bullet  •  [R] Reset", 20, h - 18, { size: 11, color: "#94a3b8", font: "monospace" });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22c55e", false);
      pr.drawText("ALL TARGETS NEUTRALIZED — VICTORY!", w / 2, h / 2 - 10, { size: 18, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#ef4444", false);
      pr.drawText("OUT OF AMMO — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#ef4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
