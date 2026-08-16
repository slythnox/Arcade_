import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface BoidDrone {
  pos: Vector2;
  vel: Vector2;
  maxSpeed: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class DroneSwarmGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 350);
  private drones: BoidDrone[] = [];
  private bullets: { pos: Vector2; vel: Vector2 }[] = [];
  private particles: Particle[] = [];
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private shootTimer: number = 0;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
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
    this.bullets = [];
    this.drones = [];
    this.particles = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.shootTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.spawnSwarm(14 + this.level * 4);
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 30 + this.ctx.random.next() * 100;
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

  private spawnSwarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = this.ctx.random.next() * Math.PI * 2;
      const dist = 320;
      this.drones.push({
        pos: new Vector2(300 + Math.cos(angle) * dist, 350 + Math.sin(angle) * dist),
        vel: new Vector2((this.ctx.random.next() - 0.5) * 100, (this.ctx.random.next() - 0.5) * 100),
        maxSpeed: 130 + this.level * 12,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    // Player movement
    const pSpeed = 300;
    if (this.moveLeft) this.playerPos.x -= pSpeed * dt;
    if (this.moveRight) this.playerPos.x += pSpeed * dt;
    if (this.moveUp) this.playerPos.y -= pSpeed * dt;
    if (this.moveDown) this.playerPos.y += pSpeed * dt;

    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));
    this.playerPos.y = Math.max(70, Math.min(630, this.playerPos.y));

    // Auto-Target Closest Drone
    let closestDrone: BoidDrone | null = null;
    let closestDist = Infinity;
    for (const d of this.drones) {
      const dist = Math.hypot(d.pos.x - this.playerPos.x, d.pos.y - this.playerPos.y);
      if (dist < closestDist) {
        closestDist = dist;
        closestDrone = d;
      }
    }

    // Auto-fire
    this.shootTimer += dt;
    if (this.shootTimer >= 0.18 && closestDrone) {
      this.shootTimer = 0;
      const angle = Math.atan2(closestDrone.pos.y - this.playerPos.y, closestDrone.pos.x - this.playerPos.x);
      const bSpeed = 580;
      this.bullets.push({
        pos: new Vector2(this.playerPos.x, this.playerPos.y),
        vel: new Vector2(Math.cos(angle) * bSpeed, Math.sin(angle) * bSpeed),
      });
      this.ctx.audio.playLaser();
    }

    // Reynolds Boids Flocking Simulation
    const count = this.drones.length;
    for (let i = 0; i < count; i++) {
      const drone = this.drones[i];
      const sep = new Vector2(0, 0);
      const ali = new Vector2(0, 0);
      const coh = new Vector2(0, 0);
      let neighbors = 0;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const other = this.drones[j];
        const d = Math.hypot(drone.pos.x - other.pos.x, drone.pos.y - other.pos.y);

        if (d > 0 && d < 65) {
          // Separation
          sep.x += (drone.pos.x - other.pos.x) / d;
          sep.y += (drone.pos.y - other.pos.y) / d;

          // Alignment
          ali.x += other.vel.x;
          ali.y += other.vel.y;

          // Cohesion
          coh.x += other.pos.x;
          coh.y += other.pos.y;

          neighbors++;
        }
      }

      // Pursue Player
      const toPlayer = new Vector2(this.playerPos.x - drone.pos.x, this.playerPos.y - drone.pos.y);
      toPlayer.normalizeMut();
      toPlayer.scaleMut(80);

      if (neighbors > 0) {
        ali.scaleMut(1 / neighbors);
        coh.scaleMut(1 / neighbors);
        coh.subMut(drone.pos);
        coh.normalizeMut();
        coh.scaleMut(40);

        drone.vel.x += (sep.x * 120 + ali.x * 0.4 + coh.x * 0.4 + toPlayer.x) * dt;
        drone.vel.y += (sep.y * 120 + ali.y * 0.4 + coh.y * 0.4 + toPlayer.y) * dt;
      } else {
        drone.vel.x += toPlayer.x * dt * 2.5;
        drone.vel.y += toPlayer.y * dt * 2.5;
      }

      // Clamp max speed
      const speed = drone.vel.magnitude();
      if (speed > drone.maxSpeed) {
        drone.vel.normalizeMut();
        drone.vel.scaleMut(drone.maxSpeed);
      }

      drone.pos.x += drone.vel.x * dt;
      drone.pos.y += drone.vel.y * dt;

      // Contact with player
      if (Math.hypot(drone.pos.x - this.playerPos.x, drone.pos.y - this.playerPos.y) < 18) {
        this.drones.splice(i, 1);
        this.lives--;
        this.addParticles(this.playerPos.x, this.playerPos.y, "#FF3366", 16);
        this.ctx.audio.playExplosion();
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
        break;
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      if (b.pos.x < 0 || b.pos.x > 600 || b.pos.y < 0 || b.pos.y > 700) {
        this.bullets.splice(i, 1);
        continue;
      }

      for (let j = this.drones.length - 1; j >= 0; j--) {
        const d = this.drones[j];
        if (Math.hypot(b.pos.x - d.pos.x, b.pos.y - d.pos.y) < 16) {
          this.bullets.splice(i, 1);
          this.drones.splice(j, 1);
          this.score += 100;
          this.addParticles(d.pos.x, d.pos.y, "#FFB703", 8);
          this.ctx.audio.playHit();
          break;
        }
      }
    }

    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Wave advancement
    if (this.drones.length === 0) {
      this.level++;
      this.score += 1000 * this.level;
      this.ctx.audio.playVictory();
      this.spawnSwarm(14 + this.level * 4);
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

    // 1. Cyber Arena Grid
    pr.drawGrid(8, 9, 65, "rgba(0, 240, 255, 0.04)", 40, 90);

    // 2. Draw Drones (Rotating Cyber Diamond Boids)
    for (const d of this.drones) {
      const ang = Math.atan2(d.vel.y, d.vel.x);
      const dx = d.pos.x;
      const dy = d.pos.y;
      
      // Drone Body (Glowing Red/Orange Diamond)
      pr.drawPixelBlock(dx - 8, dy - 8, 16, "#FF3366", "#FFFFFF", "#9F1239");
      // Motion direction marker
      pr.drawLine(dx, dy, dx + Math.cos(ang) * 14, dy + Math.sin(ang) * 14, "#FFB703", 2);
    }

    // 3. Draw Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 4. Draw Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 3, "#00F0FF", true);
    }

    // 5. Draw Player Vessel (Cyan Hexagon with Shield Halo)
    const px = this.playerPos.x;
    const py = this.playerPos.y;
    pr.drawCircle(px, py, 16, "rgba(0, 240, 255, 0.2)", true);
    pr.drawPixelBlock(px - 12, py - 12, 24, "#00F0FF", "#FFFFFF", "#0284C7");

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`WAVE ${this.level} • SWARM: ${this.drones.length}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 32, { size: 13, color: "#f43f5e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("SWARM OVERWHELMED SHIP — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
