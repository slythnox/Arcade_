import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Bullet {
  pos: Vector2;
  vel: Vector2;
  fromPlayer: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class BossReactorGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 620);
  private bossPos: Vector2 = new Vector2(300, 180);
  private bossHealth: number = 150;
  private maxHealth: number = 150;
  private bossAngle: number = 0;
  private phase: number = 1;
  private bullets: Bullet[] = [];
  private particles: Particle[] = [];
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private shootTimer: number = 0;
  private attackTimer: number = 0;
  private score: number = 0;
  private lives: number = 3;
  private isWon: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private laserSweepAngle: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 620);
    this.bossPos = new Vector2(300, 180);
    this.bossHealth = 150;
    this.maxHealth = 150;
    this.bossAngle = 0;
    this.phase = 1;
    this.bullets = [];
    this.particles = [];
    this.shootTimer = 0;
    this.attackTimer = 0;
    this.score = 0;
    this.lives = 3;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;
  }

  private addParticles(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 60 + this.ctx.random.next() * 140;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.5,
        color,
      });
    }
  }

  public update(dt: number): void {
    if (this.isWon || this.gameOver || this.isPaused) return;
    this.animTime += dt;

    if (this.moveLeft) this.playerPos.x -= 380 * dt;
    if (this.moveRight) this.playerPos.x += 380 * dt;
    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));

    // Boss motion
    this.bossPos.x = 300 + Math.sin(this.bossAngle) * 160;
    this.bossPos.y = 170 + Math.cos(this.bossAngle * 0.7) * 30;
    this.bossAngle += 1.8 * dt;

    // Automatic Player Shooting
    this.shootTimer += dt;
    if (this.shootTimer >= 0.15) {
      this.shootTimer = 0;
      this.bullets.push({
        pos: new Vector2(this.playerPos.x - 8, this.playerPos.y - 12),
        vel: new Vector2(0, -680),
        fromPlayer: true,
        color: "#00F0FF",
      });
      this.bullets.push({
        pos: new Vector2(this.playerPos.x + 8, this.playerPos.y - 12),
        vel: new Vector2(0, -680),
        fromPlayer: true,
        color: "#00F0FF",
      });
      this.ctx.audio.playLaser();
    }

    // Boss Attack Patterns
    this.attackTimer += dt;
    const interval = this.phase === 1 ? 0.7 : this.phase === 2 ? 0.45 : 0.28;
    if (this.attackTimer >= interval) {
      this.attackTimer = 0;
      const count = this.phase === 1 ? 3 : this.phase === 2 ? 5 : 7;
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * (this.phase === 3 ? 0.35 : 0.22);
        this.bullets.push({
          pos: new Vector2(this.bossPos.x, this.bossPos.y + 36),
          vel: new Vector2(Math.sin(spread) * 320, Math.cos(spread) * 320),
          fromPlayer: false,
          color: this.phase === 3 ? "#FF0055" : "#FFB703",
        });
      }
      this.ctx.audio.playHit();
    }

    // Update Laser Sweep in Phase 3
    if (this.phase === 3) {
      this.laserSweepAngle += 2.0 * dt;
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      // Out of bounds
      if (b.pos.y < 40 || b.pos.y > 700 || b.pos.x < 0 || b.pos.x > 600) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        // Hit boss
        if (Math.hypot(b.pos.x - this.bossPos.x, b.pos.y - this.bossPos.y) < 44) {
          this.bullets.splice(i, 1);
          this.bossHealth--;
          this.score += 20;
          this.addParticles(b.pos.x, b.pos.y, "#00F0FF", 3);
          this.ctx.audio.playHit();

          if (this.bossHealth === 100 && this.phase === 1) {
            this.phase = 2;
            this.ctx.audio.playPowerUp();
          } else if (this.bossHealth === 45 && this.phase === 2) {
            this.phase = 3;
            this.ctx.audio.playPowerUp();
          } else if (this.bossHealth <= 0) {
            this.isWon = true;
            this.score += 10000;
            this.addParticles(this.bossPos.x, this.bossPos.y, "#FFD84D", 32);
            this.ctx.audio.playVictory();
          }
        }
      } else {
        // Hit player
        if (Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y) < 16) {
          this.bullets.splice(i, 1);
          this.lives--;
          this.addParticles(this.playerPos.x, this.playerPos.y, "#FF3366", 16);
          this.ctx.audio.playExplosion();
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
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
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.phase; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cyber Arena Grid Backdrop
    pr.drawGrid(8, 9, 65, "rgba(255, 0, 85, 0.04)", 40, 90);

    // 2. Boss Reactor Visual (Sci-Fi Cyber Core)
    const bx = this.bossPos.x;
    const by = this.bossPos.y;

    // Outer rotating energy rings
    const ringAngle = this.animTime * 3;
    pr.drawCircle(bx, by, 48, this.phase === 3 ? "#FF0055" : (this.phase === 2 ? "#FFB703" : "#00F0FF"), false);
    for (let i = 0; i < 4; i++) {
      const ang = ringAngle + (i * Math.PI) / 2;
      const sx = bx + Math.cos(ang) * 48;
      const sy = by + Math.sin(ang) * 48;
      pr.drawCircle(sx, sy, 5, "#FFFFFF", true);
    }

    // Heavy Metal Armor Chassis
    pr.drawPixelBlock(bx - 32, by - 32, 64, "#1E293B", "#475569", "#0F172A");

    // Glowing Core Reactor Eye
    const corePulse = Math.sin(this.animTime * 8) * 4;
    const coreCol = this.phase === 3 ? "#EF4444" : (this.phase === 2 ? "#F59E0B" : "#38BDF8");
    pr.drawCircle(bx, by, 16 + corePulse, coreCol, true);
    pr.drawCircle(bx, by, 6, "#FFFFFF", true);

    // Phase 3 Death Ray Sweeping Beams
    if (this.phase === 3) {
      const lx = bx + Math.sin(this.laserSweepAngle) * 200;
      pr.drawLine(bx, by + 20, lx, h, "rgba(255, 0, 85, 0.4)", 4);
    }

    // 3. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2.5, p.color, true);
    }

    // 4. Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, b.fromPlayer ? 3 : 4, b.color, true);
    }

    // 5. Player Starfighter Sprite
    const px = this.playerPos.x;
    const py = this.playerPos.y;
    pr.drawPixelBlock(px - 14, py - 10, 28, "#00F0FF", "#FFFFFF", "#0369A1");
    // Wings
    pr.drawRect(px - 22, py + 2, 8, 8, "#38BDF8", true);
    pr.drawRect(px + 14, py + 2, 8, 8, "#38BDF8", true);
    // Twin Thruster Flames
    const thrusterFlame = 6 + Math.sin(this.animTime * 25) * 4;
    pr.drawRect(px - 10, py + 14, 6, thrusterFlame, "#FFB703", true);
    pr.drawRect(px + 4, py + 14, 6, thrusterFlame, "#FFB703", true);

    // 6. Top HUD & Boss Health Gauge
    pr.drawRect(0, 0, w, 54, "#080e1c", true);
    pr.drawLine(0, 54, w, 54, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 26, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`PHASE ${this.phase}/3`, w / 2, 26, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 26, { size: 13, color: "#f43f5e", align: "right", font: "monospace" });

    // Boss HP Meter Bar
    const hpPct = Math.max(0, this.bossHealth / this.maxHealth);
    pr.drawRect(w / 2 - 120, 36, 240, 8, "#1e293b", true);
    pr.drawRect(w / 2 - 120, 36, 240 * hpPct, 8, this.phase === 3 ? "#EF4444" : "#F59E0B", true);

    // Overlay Screens
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("REACTOR CRITICAL — SHIP DESTROYED", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22c55e", false);
      pr.drawText("REACTOR CORE DESTROYED — VICTORY!", w / 2, h / 2 - 10, { size: 20, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
