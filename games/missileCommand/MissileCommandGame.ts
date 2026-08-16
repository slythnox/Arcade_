import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface ICBMMissile {
  start: Vector2;
  current: Vector2;
  target: Vector2;
  speed: number;
}

interface DefenseMissile {
  start: Vector2;
  current: Vector2;
  target: Vector2;
  speed: number;
}

interface FlakExplosion {
  pos: Vector2;
  radius: number;
  maxRadius: number;
  expanding: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class MissileCommandGame implements GameInstance {
  private ctx!: GameContext;
  private crosshair: Vector2 = new Vector2(300, 320);
  private icbms: ICBMMissile[] = [];
  private defenseMissiles: DefenseMissile[] = [];
  private explosions: FlakExplosion[] = [];
  private particles: Particle[] = [];
  private cities: { x: number; alive: boolean; buildings: number[] }[] = [];
  private ammo: number = 30;
  private spawnTimer: number = 0;
  private score: number = 0;
  private level: number = 1;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.crosshair = new Vector2(300, 320);
    this.icbms = [];
    this.defenseMissiles = [];
    this.explosions = [];
    this.particles = [];
    this.cities = [
      { x: 100, alive: true, buildings: [16, 28, 20, 32, 14] },
      { x: 200, alive: true, buildings: [24, 18, 36, 22, 16] },
      { x: 400, alive: true, buildings: [18, 30, 24, 16, 26] },
      { x: 500, alive: true, buildings: [22, 34, 18, 28, 20] },
    ];
    this.ammo = 30;
    this.score = 0;
    this.level = 1;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  private addParticles(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 40 + this.ctx.random.next() * 120;
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

  private spawnICBM(): void {
    const startX = 40 + this.ctx.random.next() * 520;
    const aliveCities = this.cities.filter((c) => c.alive);
    let targetX = 300;

    if (aliveCities.length > 0 && this.ctx.random.next() > 0.3) {
      const c = aliveCities[Math.floor(this.ctx.random.next() * aliveCities.length)];
      targetX = c.x;
    } else {
      targetX = 60 + this.ctx.random.next() * 480;
    }

    this.icbms.push({
      start: new Vector2(startX, 60),
      current: new Vector2(startX, 60),
      target: new Vector2(targetX, 610),
      speed: 60 + this.level * 14,
    });
  }

  private launchInterceptor(): void {
    if (this.ammo <= 0 || this.gameOver || this.isPaused) return;
    this.ammo--;

    // Choose nearest silo from (150, 610), (300, 610), (450, 610)
    const silos = [150, 300, 450];
    let bestSiloX = 300;
    let minDist = Infinity;
    for (const sx of silos) {
      const d = Math.abs(sx - this.crosshair.x);
      if (d < minDist) {
        minDist = d;
        bestSiloX = sx;
      }
    }

    this.defenseMissiles.push({
      start: new Vector2(bestSiloX, 610),
      current: new Vector2(bestSiloX, 610),
      target: new Vector2(this.crosshair.x, this.crosshair.y),
      speed: 550,
    });
    this.ctx.audio.playLaser();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    // Move Crosshair
    const cSpeed = 440;
    if (this.moveLeft) this.crosshair.x -= cSpeed * dt;
    if (this.moveRight) this.crosshair.x += cSpeed * dt;
    if (this.moveUp) this.crosshair.y -= cSpeed * dt;
    if (this.moveDown) this.crosshair.y += cSpeed * dt;

    this.crosshair.x = Math.max(30, Math.min(570, this.crosshair.x));
    this.crosshair.y = Math.max(80, Math.min(590, this.crosshair.y));

    // Spawn ICBMs
    this.spawnTimer += dt;
    const rate = Math.max(0.6, 2.2 - this.level * 0.2);
    if (this.spawnTimer >= rate) {
      this.spawnTimer = 0;
      this.spawnICBM();
    }

    // Update Defense Interceptors
    for (let i = this.defenseMissiles.length - 1; i >= 0; i--) {
      const m = this.defenseMissiles[i];
      const dx = m.target.x - m.start.x;
      const dy = m.target.y - m.start.y;
      const totalDist = Math.hypot(dx, dy);
      const curDist = Math.hypot(m.current.x - m.start.x, m.current.y - m.start.y);

      if (curDist >= totalDist || totalDist < 5) {
        // Detonate into flak explosion
        this.explosions.push({
          pos: new Vector2(m.target.x, m.target.y),
          radius: 4,
          maxRadius: 38,
          expanding: true,
        });
        this.defenseMissiles.splice(i, 1);
        this.ctx.audio.playExplosion();
      } else {
        m.current.x += (dx / totalDist) * m.speed * dt;
        m.current.y += (dy / totalDist) * m.speed * dt;
      }
    }

    // Update Flak Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      if (exp.expanding) {
        exp.radius += 70 * dt;
        if (exp.radius >= exp.maxRadius) {
          exp.expanding = false;
        }
      } else {
        exp.radius -= 35 * dt;
        if (exp.radius <= 0) {
          this.explosions.splice(i, 1);
        }
      }
    }

    // Update ICBMs
    for (let i = this.icbms.length - 1; i >= 0; i--) {
      const m = this.icbms[i];
      const dx = m.target.x - m.start.x;
      const dy = m.target.y - m.start.y;
      const totalDist = Math.hypot(dx, dy);

      m.current.x += (dx / totalDist) * m.speed * dt;
      m.current.y += (dy / totalDist) * m.speed * dt;

      // Check collision with any flak explosion
      let destroyed = false;
      for (const exp of this.explosions) {
        if (Math.hypot(m.current.x - exp.pos.x, m.current.y - exp.pos.y) <= exp.radius) {
          destroyed = true;
          this.score += 50;
          this.addParticles(m.current.x, m.current.y, "#FFD84D", 10);
          this.ctx.audio.playHit();
          break;
        }
      }

      if (destroyed) {
        this.icbms.splice(i, 1);
        continue;
      }

      // Check hit ground / city
      if (m.current.y >= 610) {
        this.icbms.splice(i, 1);
        this.addParticles(m.current.x, 610, "#FF3366", 24);
        this.ctx.audio.playExplosion();

        // Check if city hit
        for (const c of this.cities) {
          if (c.alive && Math.abs(m.current.x - c.x) < 32) {
            c.alive = false;
            break;
          }
        }

        // Check game over (all cities destroyed)
        if (!this.cities.some((c) => c.alive)) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
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

    // Level progression
    if (this.score >= this.level * 2000) {
      this.level++;
      this.ammo += 20;
      this.ctx.audio.playPowerUp();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed) this.launchInterceptor();
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#04060c");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Starry Night Sky Backdrop
    pr.drawGrid(8, 9, 65, "rgba(255, 255, 255, 0.02)", 40, 60);

    // 2. Ground Terrain & Silo Bases
    pr.drawRect(0, 610, w, 90, "#0f172a", true);
    pr.drawLine(0, 610, w, 610, "#38bdf8", 2);

    // 3. Draw Cities (Skyscraper Silhouettes)
    for (const c of this.cities) {
      if (c.alive) {
        let bx = c.x - 24;
        for (const bh of c.buildings) {
          pr.drawRect(bx, 610 - bh, 8, bh, "#0284c7", true);
          pr.drawRect(bx + 1, 610 - bh + 1, 6, 2, "#ffd84d", true); // lit window
          bx += 10;
        }
      } else {
        // Destroyed city rubble
        pr.drawRect(c.x - 24, 604, 48, 6, "#334155", true);
      }
    }

    // 4. Draw Defense Silos at x=150, 300, 450
    for (const sx of [150, 300, 450]) {
      pr.drawPixelBlock(sx - 12, 598, 24, "#475569", "#94A3B8", "#1E293B");
    }

    // 5. Draw Interceptor Rocket Trails
    for (const dm of this.defenseMissiles) {
      pr.drawLine(dm.start.x, dm.start.y, dm.current.x, dm.current.y, "#38BDF8", 2);
      pr.drawCircle(dm.current.x, dm.current.y, 3, "#FFFFFF", true);
    }

    // 6. Draw Incoming ICBM Streaks
    for (const m of this.icbms) {
      pr.drawLine(m.start.x, m.start.y, m.current.x, m.current.y, "#EF4444", 2);
      pr.drawCircle(m.current.x, m.current.y, 3, "#FFD84D", true);
    }

    // 7. Draw Flak Nuclear Explosions (Expanding Multi-Ring Blast)
    for (const exp of this.explosions) {
      pr.drawCircle(exp.pos.x, exp.pos.y, exp.radius, "rgba(255, 183, 3, 0.25)", true);
      pr.drawCircle(exp.pos.x, exp.pos.y, exp.radius * 0.7, "#FFB703", true);
      pr.drawCircle(exp.pos.x, exp.pos.y, exp.radius * 0.35, "#FFFFFF", true);
    }

    // 8. Draw Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 9. Draw Targeting Crosshair
    const cx = this.crosshair.x;
    const cy = this.crosshair.y;
    pr.drawCircle(cx, cy, 14, "#00FF66", false);
    pr.drawLine(cx - 20, cy, cx + 20, cy, "#00FF66", 1.5);
    pr.drawLine(cx, cy - 20, cx, cy + 20, "#00FF66", 1.5);

    // 10. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`AMMO: ${this.ammo}`, 20, 32, { size: 13, color: this.ammo < 8 ? "#ef4444" : "#ffd84d", font: "monospace" });
    pr.drawText(`DEFENSE WAVE ${this.level} • SCORE: ${this.score}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    const aliveCount = this.cities.filter((c) => c.alive).length;
    pr.drawText(`CITIES: ${aliveCount}/4`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("ALL CITIES DESTROYED — DEFENSE FAILED", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
