import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

interface Asteroid {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  tier: number; // 3 = large, 2 = medium, 1 = small
  rotAngle: number;
  rotSpeed: number;
}

interface Bullet {
  pos: Vector2;
  vel: Vector2;
  life: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
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
  private stars: Star[] = [];
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initStars();
    this.reset();
  }

  private initStars(): void {
    this.stars = [];
    const colors = ["#FFFFFF", "#93C5FD", "#FDE047", "#C084FC", "#67E8F9"];
    for (let i = 0; i < 65; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        size: Math.random() > 0.85 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
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
        rotAngle: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 2,
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
      const thrust = 360;
      this.shipVel.x += Math.cos(this.shipAngle) * thrust * dt;
      this.shipVel.y += Math.sin(this.shipAngle) * thrust * dt;

      // Exhaust particle
      if (Math.random() < 0.6) {
        globalParticles.emitBurst(
          this.shipPos.x - Math.cos(this.shipAngle) * 16,
          this.shipPos.y - Math.sin(this.shipAngle) * 16,
          2,
          ["#00F0FF", "#22C55E", "#E0F2FE"],
          20,
          60
        );
      }
    }

    // Drag / inertia
    this.shipVel.x *= Math.pow(0.985, dt * 60);
    this.shipVel.y *= Math.pow(0.985, dt * 60);

    this.shipPos.x += this.shipVel.x * dt;
    this.shipPos.y += this.shipVel.y * dt;

    // Screen wrap
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

      // Wrap bullets
      if (b.pos.x < 0) b.pos.x += 600;
      if (b.pos.x > 600) b.pos.x -= 600;
      if (b.pos.y < 0) b.pos.y += 700;
      if (b.pos.y > 700) b.pos.y -= 700;

      if (b.life <= 0) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check bullet hit asteroid
      for (let aIdx = this.asteroids.length - 1; aIdx >= 0; aIdx--) {
        const ast = this.asteroids[aIdx];
        if (Math.hypot(b.pos.x - ast.pos.x, b.pos.y - ast.pos.y) < ast.radius) {
          this.bullets.splice(i, 1);
          const pts = (4 - ast.tier) * 100 * this.level;
          this.score += pts;
          this.ctx.audio?.playExplosion?.();

          globalParticles.emitBurst(
            ast.pos.x,
            ast.pos.y,
            ast.tier * 8,
            ["#CBD5E1", "#94A3B8", "#64748B", "#ffd84d"],
            60,
            240
          );
          globalParticles.emitText(`+${pts}`, ast.pos.x, ast.pos.y, "#ffd84d", 14);

          // Split asteroid if tier > 1
          if (ast.tier > 1) {
            for (let k = 0; k < 2; k++) {
              const splitAngle = Math.random() * Math.PI * 2;
              const splitSpeed = 60 + Math.random() * 50 + this.level * 10;
              this.asteroids.push({
                pos: new Vector2(ast.pos.x, ast.pos.y),
                vel: new Vector2(Math.cos(splitAngle) * splitSpeed, Math.sin(splitAngle) * splitSpeed),
                radius: ast.radius * 0.55,
                tier: ast.tier - 1,
                rotAngle: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 3,
              });
            }
          }

          this.asteroids.splice(aIdx, 1);
          break;
        }
      }
    }

    // Update asteroids & check ship collision
    for (const ast of this.asteroids) {
      ast.pos.x += ast.vel.x * dt;
      ast.pos.y += ast.vel.y * dt;
      ast.rotAngle += ast.rotSpeed * dt;

      if (ast.pos.x < -ast.radius) ast.pos.x += 600 + ast.radius * 2;
      if (ast.pos.x > 600 + ast.radius) ast.pos.x -= 600 + ast.radius * 2;
      if (ast.pos.y < -ast.radius) ast.pos.y += 700 + ast.radius * 2;
      if (ast.pos.y > 700 + ast.radius) ast.pos.y -= 700 + ast.radius * 2;

      // Ship collision
      if (Math.hypot(this.shipPos.x - ast.pos.x, this.shipPos.y - ast.pos.y) < ast.radius + 12) {
        this.lives--;
        this.ctx.audio?.playGameOver?.();
        globalParticles.emitBurst(this.shipPos.x, this.shipPos.y, 24, ["#FF3366", "#F59E0B", "#FFFFFF"], 90, 300);

        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        } else {
          this.shipPos.set(300, 350);
          this.shipVel.set(0, 0);
        }
        break;
      }
    }

    // Level clear check
    if (this.asteroids.length === 0) {
      this.level++;
      this.score += 1000 * this.level;
      this.ctx.audio?.playVictory?.();
      this.spawnAsteroids(Math.min(8, 3 + this.level));
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.rotateLeft = isPressed;
    if (action === "MOVE_RIGHT") this.rotateRight = isPressed;
    if (action === "MOVE_UP") this.isThrusting = isPressed;

    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isPaused) {
      if (this.bullets.length < 5) {
        const noseX = this.shipPos.x + Math.cos(this.shipAngle) * 18;
        const noseY = this.shipPos.y + Math.sin(this.shipAngle) * 18;
        const speed = 560;
        this.bullets.push({
          pos: new Vector2(noseX, noseY),
          vel: new Vector2(
            this.shipVel.x + Math.cos(this.shipAngle) * speed,
            this.shipVel.y + Math.sin(this.shipAngle) * speed
          ),
          life: 1.1,
        });
        this.ctx.audio?.playLaser?.();
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
    pr.clear("#040714");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Starfield background
    for (const star of this.stars) {
      pr.drawRect(star.x, star.y, star.size, star.size, star.color, true);
    }

    // 2. Outer border
    pr.drawRect(8, 8, w - 16, h - 16, "#1e293b", false);

    // 3. Draw Textured Craggy Asteroids
    for (const ast of this.asteroids) {
      pr.save();
      pr.translate(ast.pos.x, ast.pos.y);
      pr.rotate(ast.rotAngle);

      const baseCol = ast.tier === 3 ? "#475569" : ast.tier === 2 ? "#64748B" : "#94A3B8";
      const highlightCol = "#CBD5E1";
      const shadowCol = "#1E293B";

      pr.drawCircle(0, 0, ast.radius, baseCol, true);
      pr.drawCircle(0, 0, ast.radius, highlightCol, false);

      // Crater details
      pr.drawCircle(ast.radius * 0.3, -ast.radius * 0.2, ast.radius * 0.25, shadowCol, true);
      pr.drawCircle(-ast.radius * 0.3, ast.radius * 0.2, ast.radius * 0.35, shadowCol, true);
      pr.drawCircle(ast.radius * 0.1, ast.radius * 0.4, ast.radius * 0.2, shadowCol, true);

      pr.restore();
    }

    // 4. Draw Bullets (Glowing Cyan Plasma Orbs)
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 4, "rgba(0, 240, 255, 0.4)", true);
      pr.drawCircle(b.pos.x, b.pos.y, 2, "#FFFFFF", true);
    }

    // 5. Draw Player Starfighter (Rotated Reference Sprite)
    drawSpaceshipSprite(pr, this.shipPos.x, this.shipPos.y, 36, this.shipAngle + Math.PI / 2, "#00F0FF");

    // 6. Render Particles & Floating Text
    globalParticles.render(pr);

    // 7. Top HUD
    pr.drawRect(12, 12, w - 24, 28, "rgba(8, 14, 28, 0.8)", true);
    pr.drawRect(12, 12, w - 24, 28, "#1e293b", false);
    pr.drawText(`SCORE: ${this.score}  •  LEVEL: ${this.level}  •  LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`, w / 2, 30, {
      size: 11,
      color: "#00F0FF",
      align: "center",
      font: "monospace",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("SHIP DESTROYED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
