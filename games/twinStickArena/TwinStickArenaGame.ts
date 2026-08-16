import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

type EnemyType = "chaser" | "shooter" | "tank";

interface Enemy {
  pos: Vector2;
  vel: Vector2;
  speed: number;
  hp: number;
  maxHp: number;
  type: EnemyType;
  shootCooldown: number;
}

interface Bullet {
  pos: Vector2;
  vel: Vector2;
  isEnemy: boolean;
  color: string;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export class TwinStickArenaGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 350);
  private playerVel: Vector2 = new Vector2(0, 0);
  private aimAngle: number = 0;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private spawnTimer: number = 0;
  private shootTimer: number = 0;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private shield: number = 100;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 350);
    this.playerVel = new Vector2(0, 0);
    this.aimAngle = 0;
    this.bullets = [];
    this.enemies = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.shield = 100;
    this.spawnTimer = 0;
    this.shootTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  private spawnParticle(x: number, y: number, color: string, count: number = 6): void {
    for (let i = 0; i < count; i++) {
      const angle = this.ctx.random.next() * Math.PI * 2;
      const spd = 40 + this.ctx.random.next() * 120;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 0.4 + this.ctx.random.next() * 0.3,
        maxLife: 0.7,
        color,
      });
    }
  }

  private spawnEnemy(): void {
    const angle = this.ctx.random.next() * Math.PI * 2;
    const dist = 380;
    const x = 300 + Math.cos(angle) * dist;
    const y = 350 + Math.sin(angle) * dist;

    const roll = this.ctx.random.next();
    let type: EnemyType = "chaser";
    let hp = 1;
    let speed = 140 + this.level * 10;

    if (roll > 0.7 && this.level >= 2) {
      type = "shooter";
      hp = 2;
      speed = 90 + this.level * 5;
    } else if (roll > 0.9 && this.level >= 3) {
      type = "tank";
      hp = 5;
      speed = 60 + this.level * 5;
    }

    this.enemies.push({
      pos: new Vector2(x, y),
      vel: new Vector2(0, 0),
      speed,
      hp,
      maxHp: hp,
      type,
      shootCooldown: 1.5 + this.ctx.random.next(),
    });
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    // Movement acceleration
    const accel = 1200;
    if (this.moveLeft) this.playerVel.x -= accel * dt;
    if (this.moveRight) this.playerVel.x += accel * dt;
    if (this.moveUp) this.playerVel.y -= accel * dt;
    if (this.moveDown) this.playerVel.y += accel * dt;

    this.playerVel.x *= 0.92;
    this.playerVel.y *= 0.92;

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Arena boundary containment (radius 260 circle)
    const distFromCenter = Math.hypot(this.playerPos.x - 300, this.playerPos.y - 350);
    if (distFromCenter > 250) {
      const ang = Math.atan2(this.playerPos.y - 350, this.playerPos.x - 300);
      this.playerPos.x = 300 + Math.cos(ang) * 250;
      this.playerPos.y = 350 + Math.sin(ang) * 250;
    }

    // Auto-aim toward nearest enemy if any, else direction of movement
    if (this.enemies.length > 0) {
      let nearestDist = Infinity;
      let targetAngle = this.aimAngle;
      for (const e of this.enemies) {
        const d = Math.hypot(e.pos.x - this.playerPos.x, e.pos.y - this.playerPos.y);
        if (d < nearestDist) {
          nearestDist = d;
          targetAngle = Math.atan2(e.pos.y - this.playerPos.y, e.pos.x - this.playerPos.x);
        }
      }
      this.aimAngle = targetAngle;
    } else if (this.playerVel.magnitude() > 20) {
      this.aimAngle = Math.atan2(this.playerVel.y, this.playerVel.x);
    }

    // Auto-fire player lasers
    this.shootTimer += dt;
    if (this.shootTimer >= 0.16) {
      this.shootTimer = 0;
      const bSpeed = 520;
      this.bullets.push({
        pos: new Vector2(this.playerPos.x, this.playerPos.y),
        vel: new Vector2(Math.cos(this.aimAngle) * bSpeed, Math.sin(this.aimAngle) * bSpeed),
        isEnemy: false,
        color: "#00F0FF",
      });
      this.ctx.audio.playLaser();
    }

    // Spawn enemies
    this.spawnTimer += dt;
    const rate = Math.max(0.6, 2.0 - this.level * 0.15);
    if (this.spawnTimer >= rate) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      // Despawn if out of arena
      if (b.pos.x < 0 || b.pos.x > 600 || b.pos.y < 0 || b.pos.y > 700) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check hit against player
      if (b.isEnemy) {
        const pDist = Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y);
        if (pDist < 16) {
          this.bullets.splice(i, 1);
          this.shield -= 20;
          this.spawnParticle(b.pos.x, b.pos.y, "#FF3366", 8);
          this.ctx.audio.playHit();
          if (this.shield <= 0) {
            this.lives--;
            this.shield = 100;
            this.ctx.audio.playExplosion();
            if (this.lives <= 0) {
              this.gameOver = true;
              this.ctx.session.setStatus("game-over");
            }
          }
          continue;
        }
      } else {
        // Player bullet vs enemies
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const hitRadius = e.type === "tank" ? 22 : 14;
          if (Math.hypot(b.pos.x - e.pos.x, b.pos.y - e.pos.y) < hitRadius) {
            this.bullets.splice(i, 1);
            e.hp--;
            this.spawnParticle(b.pos.x, b.pos.y, "#00F0FF", 4);
            this.ctx.audio.playHit();

            if (e.hp <= 0) {
              this.enemies.splice(j, 1);
              this.score += e.type === "tank" ? 300 : (e.type === "shooter" ? 150 : 50);
              this.spawnParticle(e.pos.x, e.pos.y, e.type === "tank" ? "#FFB703" : "#FF3366", 16);
              this.ctx.audio.playExplosion();
            }
            break;
          }
        }
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = this.playerPos.x - e.pos.x;
      const dy = this.playerPos.y - e.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        e.pos.x += (dx / dist) * e.speed * dt;
        e.pos.y += (dy / dist) * e.speed * dt;
      }

      // Shooter behavior
      if (e.type === "shooter") {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 2.2;
          const sAngle = Math.atan2(dy, dx);
          this.bullets.push({
            pos: new Vector2(e.pos.x, e.pos.y),
            vel: new Vector2(Math.cos(sAngle) * 260, Math.sin(sAngle) * 260),
            isEnemy: true,
            color: "#FF3366",
          });
        }
      }

      // Contact damage with player
      if (dist < 22) {
        this.enemies.splice(i, 1);
        this.shield -= 35;
        this.spawnParticle(e.pos.x, e.pos.y, "#FF3366", 12);
        this.ctx.audio.playExplosion();
        if (this.shield <= 0) {
          this.lives--;
          this.shield = 100;
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Level progression
    if (this.score >= this.level * 2500) {
      this.level++;
      this.shield = 100;
      this.ctx.audio.playVictory();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Draw Circular Arena Perimeter with pulsing glow
    const arenaRadius = 260;
    pr.drawCircle(300, 350, arenaRadius, "rgba(0, 240, 255, 0.15)", false);
    pr.drawCircle(300, 350, arenaRadius - 10, "rgba(0, 240, 255, 0.05)", false);
    pr.drawGrid(8, 9, 65, "rgba(0, 240, 255, 0.04)", 40, 90);

    // 2. Draw Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      pr.drawCircle(p.x, p.y, Math.max(1, 3 * alpha), p.color, true);
    }

    // 3. Draw Enemies
    for (const e of this.enemies) {
      if (e.type === "tank") {
        pr.drawPixelBlock(e.pos.x - 16, e.pos.y - 16, 32, "#FFB703", "#FFF", "#B45309");
        pr.drawCircle(e.pos.x, e.pos.y, 6, "#EF4444", true);
      } else if (e.type === "shooter") {
        pr.drawPixelBlock(e.pos.x - 12, e.pos.y - 12, 24, "#A855F7", "#FFF", "#6B21A8");
      } else {
        pr.drawPixelBlock(e.pos.x - 10, e.pos.y - 10, 20, "#FF3366", "#FFF", "#9F1239");
      }

      // Health bar above enemy if damaged
      if (e.hp < e.maxHp) {
        const barW = 24;
        const hpPct = e.hp / e.maxHp;
        pr.drawRect(e.pos.x - barW / 2, e.pos.y - 22, barW, 4, "#334155", true);
        pr.drawRect(e.pos.x - barW / 2, e.pos.y - 22, barW * hpPct, 4, "#22C55E", true);
      }
    }

    // 4. Draw Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, b.isEnemy ? 4 : 3, b.color, true);
    }

    // 5. Draw Player Craft & Aim Pointer
    pr.drawPixelBlock(this.playerPos.x - 14, this.playerPos.y - 14, 28, "#00F0FF", "#FFFFFF", "#0369A1");
    // Engine Thruster Flame
    const flameLen = 6 + Math.sin(this.animTime * 20) * 4;
    const tx = this.playerPos.x - Math.cos(this.aimAngle) * (14 + flameLen);
    const ty = this.playerPos.y - Math.sin(this.aimAngle) * (14 + flameLen);
    pr.drawCircle(tx, ty, 4, "#FFB703", true);

    // Aim Laser Sight Line
    const rx = this.playerPos.x + Math.cos(this.aimAngle) * 36;
    const ry = this.playerPos.y + Math.sin(this.aimAngle) * 36;
    pr.drawLine(this.playerPos.x, this.playerPos.y, rx, ry, "rgba(0, 240, 255, 0.6)", 2);
    pr.drawCircle(rx, ry, 3, "#FFD84D", true);

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`LEVEL ${this.level}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 32, { size: 13, color: "#f43f5e", align: "right", font: "monospace" });

    // Shield Bar
    pr.drawRect(w / 2 - 60, 40, 120, 6, "#1e293b", true);
    pr.drawRect(w / 2 - 60, 40, 120 * (this.shield / 100), 6, "#38bdf8", true);

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("ARENA OVERRUN — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
