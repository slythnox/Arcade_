import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface Asteroid {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  tier: number; // 3 = large, 2 = medium, 1 = small
}

interface Bullet {
  pos: Vector2;
  vel: Vector2;
  life: number;
}

export class AsteroidFieldGame implements GameInstance {
  private ctx!: GameContext;
  private shipPos: Vector2 = new Vector2(300, 350);
  private shipVel: Vector2 = new Vector2(0, 0);
  private shipAngle: number = -Math.PI / 2;
  private isThrusting: boolean = false;
  private rotateLeft: boolean = false;
  private rotateRight: boolean = false;
  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
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
    this.shipPos = new Vector2(300, 350);
    this.shipVel = new Vector2(0, 0);
    this.shipAngle = -Math.PI / 2;
    this.bullets = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.spawnAsteroids(4);
  }

  private spawnAsteroids(count: number): void {
    this.asteroids = [];
    for (let i = 0; i < count; i++) {
      let x = this.ctx.random.next() * 600;
      let y = this.ctx.random.next() * 700;
      while (Math.hypot(x - 300, y - 350) < 120) {
        x = this.ctx.random.next() * 600;
        y = this.ctx.random.next() * 700;
      }
      const angle = this.ctx.random.next() * Math.PI * 2;
      const speed = 40 + this.ctx.random.next() * 40 + this.level * 8;
      this.asteroids.push({
        pos: new Vector2(x, y),
        vel: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        radius: 34,
        tier: 3,
      });
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    // Ship rotation & thrust
    if (this.rotateLeft) this.shipAngle -= 4.2 * dt;
    if (this.rotateRight) this.shipAngle += 4.2 * dt;

    if (this.isThrusting) {
      const thrust = 340;
      this.shipVel.x += Math.cos(this.shipAngle) * thrust * dt;
      this.shipVel.y += Math.sin(this.shipAngle) * thrust * dt;
    }

    // Drag / inertia
    this.shipVel.x *= Math.pow(0.98, dt * 60);
    this.shipVel.y *= Math.pow(0.98, dt * 60);

    this.shipPos.x += this.shipVel.x * dt;
    this.shipPos.y += this.shipVel.y * dt;

    // Toroidal screen wrap
    if (this.shipPos.x < 0) this.shipPos.x += 600;
    if (this.shipPos.x > 600) this.shipPos.x -= 600;
    if (this.shipPos.y < 0) this.shipPos.y += 700;
    if (this.shipPos.y > 700) this.shipPos.y -= 700;

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;
      b.life -= dt;

      if (b.pos.x < 0) b.pos.x += 600;
      if (b.pos.x > 600) b.pos.x -= 600;
      if (b.pos.y < 0) b.pos.y += 700;
      if (b.pos.y > 700) b.pos.y -= 700;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check collision with asteroids
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const ast = this.asteroids[j];
        if (Math.hypot(b.pos.x - ast.pos.x, b.pos.y - ast.pos.y) < ast.radius) {
          this.ctx.audio.playExplosion();
          const pts = (4 - ast.tier) * 150;
          this.score += pts;
          this.bullets.splice(i, 1);

          globalParticles.emitBurst(ast.pos.x, ast.pos.y, 16, ["#FFB703", "#FF3366", "#ffffff"], 60, 240);
          globalParticles.emitText(`+${pts}`, ast.pos.x, ast.pos.y, "#FFB703", 14);

          // Split asteroid
          if (ast.tier > 1) {
            for (let k = 0; k < 2; k++) {
              const randAng = this.ctx.random.next() * Math.PI * 2;
              const spd = (4 - ast.tier + 1) * 60;
              this.asteroids.push({
                pos: new Vector2(ast.pos.x, ast.pos.y),
                vel: new Vector2(Math.cos(randAng) * spd, Math.sin(randAng) * spd),
                radius: ast.radius * 0.6,
                tier: ast.tier - 1,
              });
            }
          }
          this.asteroids.splice(j, 1);
          break;
        }
      }
    }

    // Update asteroids
    for (const ast of this.asteroids) {
      ast.pos.x += ast.vel.x * dt;
      ast.pos.y += ast.vel.y * dt;

      if (ast.pos.x < 0) ast.pos.x += 600;
      if (ast.pos.x > 600) ast.pos.x -= 600;
      if (ast.pos.y < 0) ast.pos.y += 700;
      if (ast.pos.y > 700) ast.pos.y -= 700;

      // Ship collision
      if (Math.hypot(this.shipPos.x - ast.pos.x, this.shipPos.y - ast.pos.y) < ast.radius + 12) {
        this.lives--;
        this.ctx.audio.playExplosion();
        this.shipPos = new Vector2(300, 350);
        this.shipVel = new Vector2(0, 0);
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
      }
    }

    // Next wave
    if (this.asteroids.length === 0) {
      this.level++;
      this.score += 2000;
      this.ctx.audio.playPowerUp();
      this.spawnAsteroids(4 + this.level);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.rotateLeft = isPressed;
    if (action === "MOVE_RIGHT") this.rotateRight = isPressed;
    if (action === "MOVE_UP") this.isThrusting = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isPaused) {
      if (this.bullets.length < 5) {
        const bSpeed = 600;
        this.bullets.push({
          pos: new Vector2(
            this.shipPos.x + Math.cos(this.shipAngle) * 16,
            this.shipPos.y + Math.sin(this.shipAngle) * 16
          ),
          vel: new Vector2(
            this.shipVel.x + Math.cos(this.shipAngle) * bSpeed,
            this.shipVel.y + Math.sin(this.shipAngle) * bSpeed
          ),
          life: 1.1,
        });
        this.ctx.audio.playLaser();
      }
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

    // Outer border
    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Asteroids
    for (const ast of this.asteroids) {
      const col = ast.tier === 3 ? "#A3B3A3" : ast.tier === 2 ? "#FFB703" : "#00F0FF";
      pr.drawCircle(ast.pos.x, ast.pos.y, ast.radius, col, false);
      pr.drawCircle(ast.pos.x, ast.pos.y, ast.radius * 0.4, "rgba(255,255,255,0.1)", true);
    }

    // Draw Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 3, "#00FF66", true);
    }

    // Draw Ship
    const noseX = this.shipPos.x + Math.cos(this.shipAngle) * 16;
    const noseY = this.shipPos.y + Math.sin(this.shipAngle) * 16;
    const leftX = this.shipPos.x + Math.cos(this.shipAngle + 2.4) * 14;
    const leftY = this.shipPos.y + Math.sin(this.shipAngle + 2.4) * 14;
    const rightX = this.shipPos.x + Math.cos(this.shipAngle - 2.4) * 14;
    const rightY = this.shipPos.y + Math.sin(this.shipAngle - 2.4) * 14;

    pr.drawLine(noseX, noseY, leftX, leftY, "#00FF66", 2);
    pr.drawLine(leftX, leftY, this.shipPos.x, this.shipPos.y, "#00FF66", 2);
    pr.drawLine(this.shipPos.x, this.shipPos.y, rightX, rightY, "#00FF66", 2);
    pr.drawLine(rightX, rightY, noseX, noseY, "#00FF66", 2);

    if (this.isThrusting) {
      const flameX = this.shipPos.x - Math.cos(this.shipAngle) * 14;
      const flameY = this.shipPos.y - Math.sin(this.shipAngle) * 14;
      pr.drawLine(leftX, leftY, flameX, flameY, "#FFB703", 2);
      pr.drawLine(rightX, rightY, flameX, flameY, "#FFB703", 2);
    }

    // Render Particle Explosions & Text Popups
    globalParticles.render(pr);

    pr.drawText(`SCORE: ${this.score}  •  LEVEL: ${this.level}  •  LIVES: ${this.lives}`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("SHIP DESTROYED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
