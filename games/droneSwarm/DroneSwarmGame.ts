import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface BoidDrone {
  pos: Vector2;
  vel: Vector2;
  maxSpeed: number;
}

export class DroneSwarmGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 350);
  private drones: BoidDrone[] = [];
  private bullets: { pos: Vector2; vel: Vector2 }[] = [];
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 350);
    this.bullets = [];
    this.drones = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.spawnSwarm(12);
  }

  private spawnSwarm(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = this.ctx.random.next() * Math.PI * 2;
      const dist = 320;
      this.drones.push({
        pos: new Vector2(300 + Math.cos(angle) * dist, 350 + Math.sin(angle) * dist),
        vel: new Vector2((this.ctx.random.next() - 0.5) * 100, (this.ctx.random.next() - 0.5) * 100),
        maxSpeed: 140 + this.level * 10,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Move player
    const pSpeed = 280;
    if (this.moveLeft) this.playerPos.x -= pSpeed * dt;
    if (this.moveRight) this.playerPos.x += pSpeed * dt;
    if (this.moveUp) this.playerPos.y -= pSpeed * dt;
    if (this.moveDown) this.playerPos.y += pSpeed * dt;

    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));
    this.playerPos.y = Math.max(60, Math.min(640, this.playerPos.y));

    // Reynolds Boids Swarm Simulation
    for (let i = 0; i < this.drones.length; i++) {
      const d = this.drones[i];
      let sepX = 0;
      let sepY = 0;
      let cohX = 0;
      let cohY = 0;
      let count = 0;

      for (let j = 0; j < this.drones.length; j++) {
        if (i === j) continue;
        const other = this.drones[j];
        const dist = Math.hypot(d.pos.x - other.pos.x, d.pos.y - other.pos.y);

        if (dist < 32 && dist > 0) {
          // Separation
          sepX += (d.pos.x - other.pos.x) / dist;
          sepY += (d.pos.y - other.pos.y) / dist;
        }

        if (dist < 120) {
          // Cohesion
          cohX += other.pos.x;
          cohY += other.pos.y;
          count++;
        }
      }

      if (count > 0) {
        cohX = (cohX / count - d.pos.x) * 0.4;
        cohY = (cohY / count - d.pos.y) * 0.4;
      }

      // Pursuit vector towards player
      const toPlayerX = (this.playerPos.x - d.pos.x) * 0.8;
      const toPlayerY = (this.playerPos.y - d.pos.y) * 0.8;

      // Combine forces
      d.vel.x += (sepX * 45 + cohX + toPlayerX) * dt;
      d.vel.y += (sepY * 45 + cohY + toPlayerY) * dt;

      // Clamp speed
      const spd = Math.hypot(d.vel.x, d.vel.y);
      if (spd > d.maxSpeed) {
        d.vel.x = (d.vel.x / spd) * d.maxSpeed;
        d.vel.y = (d.vel.y / spd) * d.maxSpeed;
      }

      d.pos.x += d.vel.x * dt;
      d.pos.y += d.vel.y * dt;

      // Player collision
      if (Math.hypot(d.pos.x - this.playerPos.x, d.pos.y - this.playerPos.y) < 18) {
        this.lives--;
        this.ctx.audio.playExplosion();
        this.drones.splice(i, 1);
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
        break;
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      if (b.pos.x < 10 || b.pos.x > 590 || b.pos.y < 30 || b.pos.y > 670) {
        this.bullets.splice(i, 1);
        continue;
      }

      for (let j = this.drones.length - 1; j >= 0; j--) {
        const d = this.drones[j];
        if (Math.hypot(b.pos.x - d.pos.x, b.pos.y - d.pos.y) < 14) {
          this.drones.splice(j, 1);
          this.bullets.splice(i, 1);
          this.score += 150;
          this.ctx.audio.playExplosion();
          break;
        }
      }
    }

    if (this.drones.length === 0) {
      this.level++;
      this.score += 1000;
      this.ctx.audio.playPowerUp();
      this.spawnSwarm(12 + this.level * 3);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isPaused) {
      // 4-way pulse blast
      const bSpeed = 500;
      const dirs = [
        { vx: 0, vy: -bSpeed },
        { vx: bSpeed, vy: 0 },
        { vx: 0, vy: bSpeed },
        { vx: -bSpeed, vy: 0 },
      ];
      for (const d of dirs) {
        this.bullets.push({
          pos: new Vector2(this.playerPos.x, this.playerPos.y),
          vel: new Vector2(d.vx, d.vy),
        });
      }
      this.ctx.audio.playLaser();
    }
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
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Drones
    for (const d of this.drones) {
      pr.drawCircle(d.pos.x, d.pos.y, 8, "#FF3366", true);
      pr.drawCircle(d.pos.x, d.pos.y, 2, "#FFFFFF", true);
    }

    // Draw Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 4, "#00F0FF", true);
    }

    // Draw Player
    pr.drawPixelBlock(this.playerPos.x - 14, this.playerPos.y - 14, 28, "#00FF66", "#FFFFFF", "#047857");

    pr.drawText(
      `SCORE: ${this.score}  •  DRONES: ${this.drones.length}  •  LIVES: ${this.lives}  •  [SPACE FOR 4-WAY PULSE]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("SWARM OVERWHELMED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
