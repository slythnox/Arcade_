import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

interface Bullet {
  x: number;
  y: number;
  vy: number;
  fromPlayer: boolean;
}

interface Alien {
  x: number;
  y: number;
  row: number;
  col: number;
  alive: boolean;
  frame: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

export class SpaceDefenderGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 300;
  private playerSpeed: number = 380;
  private movingLeft: boolean = false;
  private movingRight: boolean = false;
  private bullets: Bullet[] = [];
  private aliens: Alien[] = [];
  private stars: Star[] = [];
  private alienDir: number = 1;
  private alienTimer: number = 0;
  private alienShootTimer: number = 0;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTimer: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initStars();
    this.reset();
  }

  private initStars(): void {
    this.stars = [];
    const colors = ["#FFFFFF", "#93C5FD", "#FDE047", "#C084FC"];
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        speed: 30 + Math.random() * 80,
        size: Math.random() > 0.8 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 300;
    this.bullets = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.alienDir = 1;
    this.alienTimer = 0;
    this.alienShootTimer = 0;
    this.spawnAlienWave();
  }

  private spawnAlienWave(): void {
    this.aliens = [];
    const rows = 4;
    const cols = 8;
    const startX = 60;
    const startY = 80;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        this.aliens.push({
          x: startX + c * 58,
          y: startY + r * 48,
          row: r,
          col: c,
          alive: true,
          frame: 0,
        });
      }
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);

    // Update background starfield
    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > 700) {
        star.y = 0;
        star.x = Math.random() * 600;
      }
    }

    if (this.gameOver || this.isPaused) return;

    this.animTimer += dt;

    // Move player
    if (this.movingLeft) this.playerX = Math.max(30, this.playerX - this.playerSpeed * dt);
    if (this.movingRight) this.playerX = Math.min(570, this.playerX + this.playerSpeed * dt);

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * dt;

      if (b.y < 20 || b.y > 680) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check player bullet hit alien
      if (b.fromPlayer) {
        for (const a of this.aliens) {
          if (!a.alive) continue;
          if (Math.abs(b.x - a.x) < 22 && Math.abs(b.y - a.y) < 18) {
            a.alive = false;
            this.bullets.splice(i, 1);
            const pts = (4 - a.row) * 100 * this.level;
            this.score += pts;
            this.ctx.audio?.playExplosion?.();
            globalParticles.emitBurst(a.x, a.y, 16, ["#FF3366", "#ffd84d", "#00F0FF"], 70, 240);
            globalParticles.emitText(`+${pts}`, a.x, a.y - 10, "#ffd84d", 14);
            break;
          }
        }
      } else {
        // Alien bullet hit player
        if (Math.abs(b.x - this.playerX) < 20 && Math.abs(b.y - 620) < 20) {
          this.bullets.splice(i, 1);
          this.lives--;
          this.ctx.audio?.playGameOver?.();
          globalParticles.emitBurst(this.playerX, 620, 24, ["#EF4444", "#F59E0B", "#FFFFFF"], 90, 300);

          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
          break;
        }
      }
    }

    // Alien step timer
    this.alienTimer += dt;
    const stepInterval = Math.max(0.12, 0.6 - (this.level - 1) * 0.05 - (32 - this.aliens.filter((a) => a.alive).length) * 0.015);

    if (this.alienTimer >= stepInterval) {
      this.alienTimer = 0;
      let hitWall = false;

      for (const a of this.aliens) {
        if (!a.alive) continue;
        a.frame = 1 - a.frame;
        if ((a.x > 550 && this.alienDir > 0) || (a.x < 50 && this.alienDir < 0)) {
          hitWall = true;
        }
      }

      if (hitWall) {
        this.alienDir = -this.alienDir;
        for (const a of this.aliens) {
          if (!a.alive) continue;
          a.y += 18;
          if (a.y >= 580) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
            this.ctx.audio?.playGameOver?.();
          }
        }
      } else {
        for (const a of this.aliens) {
          if (!a.alive) continue;
          a.x += this.alienDir * 14;
        }
      }
    }

    // Alien shooting
    this.alienShootTimer += dt;
    if (this.alienShootTimer >= 1.1) {
      this.alienShootTimer = 0;
      const aliveAliens = this.aliens.filter((a) => a.alive);
      if (aliveAliens.length > 0) {
        const shooter = this.ctx.random.choice(aliveAliens);
        this.bullets.push({ x: shooter.x, y: shooter.y + 12, vy: 260 + this.level * 20, fromPlayer: false });
        this.ctx.audio?.playLaser?.();
      }
    }

    // Wave Clear Check
    if (this.aliens.every((a) => !a.alive)) {
      this.level++;
      this.score += 1000 * this.level;
      this.ctx.audio?.playVictory?.();
      this.spawnAlienWave();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.movingLeft = isPressed;
    if (action === "MOVE_RIGHT") this.movingRight = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isPaused) {
      if (this.bullets.filter((b) => b.fromPlayer).length < 4) {
        // Dual laser fire from fighter wings
        this.bullets.push({ x: this.playerX - 10, y: 605, vy: -550, fromPlayer: true });
        this.bullets.push({ x: this.playerX + 10, y: 605, vy: -550, fromPlayer: true });
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
    pr.clear("#040612");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Nebula Backdrop & Twinkling Stars
    pr.drawCircle(180, 240, 140, "rgba(124, 58, 237, 0.08)", true);
    pr.drawCircle(440, 380, 160, "rgba(2, 132, 199, 0.08)", true);

    for (const star of this.stars) {
      pr.drawRect(star.x, star.y, star.size, star.size, star.color, true);
    }

    // 2. Stage outer border
    pr.drawRect(8, 8, w - 16, h - 16, "#1e293b", false);

    // 3. Draw Pixel-Art Alien Invader Starships
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const wingSpread = a.frame === 0 ? 0 : 2;

      if (a.row === 0) {
        // Red Dreadnought
        pr.drawRect(a.x - 14 - wingSpread, a.y - 8, 28 + wingSpread * 2, 14, "#DC2626", true);
        pr.drawRect(a.x - 8, a.y - 12, 16, 6, "#F87171", true);
        pr.drawRect(a.x - 4, a.y - 4, 8, 8, "#FDE047", true); // Glowing eye
      } else if (a.row === 1) {
        // Gold Striker
        pr.drawRect(a.x - 12, a.y - 6, 24, 12, "#F59E0B", true);
        pr.drawRect(a.x - 14 - wingSpread, a.y, 6, 6, "#FCD34D", true);
        pr.drawRect(a.x + 8 + wingSpread, a.y, 6, 6, "#FCD34D", true);
        pr.drawRect(a.x - 3, a.y - 2, 6, 6, "#EF4444", true);
      } else {
        // Cyan Swarmer
        pr.drawRect(a.x - 10, a.y - 6, 20, 10, "#0284C7", true);
        pr.drawRect(a.x - 12, a.y - 8 - wingSpread, 4, 12, "#38BDF8", true);
        pr.drawRect(a.x + 8, a.y - 8 - wingSpread, 4, 12, "#38BDF8", true);
        pr.drawRect(a.x - 2, a.y - 2, 4, 4, "#00F0FF", true);
      }
    }

    // 4. Draw Plasma Bolts
    for (const b of this.bullets) {
      if (b.fromPlayer) {
        pr.drawRect(b.x - 1, b.y - 6, 3, 12, "#00F0FF", true);
        pr.drawRect(b.x, b.y - 4, 1, 8, "#FFFFFF", true);
      } else {
        pr.drawRect(b.x - 2, b.y - 4, 4, 10, "#EF4444", true);
        pr.drawCircle(b.x, b.y, 4, "#FCA5A5", false);
      }
    }

    // 5. Draw Reference Starfighter Spaceship for Player
    drawSpaceshipSprite(pr, this.playerX, 620, 42, 0, "#00F0FF");

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
      pr.drawText("MOTHERSHIP OVERRUN — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
