import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

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
}

export class SpaceDefenderGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 300;
  private playerSpeed: number = 350;
  private movingLeft: boolean = false;
  private movingRight: boolean = false;
  private bullets: Bullet[] = [];
  private aliens: Alien[] = [];
  private alienDir: number = 1;
  private alienStepDown: boolean = false;
  private alienTimer: number = 0;
  private alienShootTimer: number = 0;
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
          y: startY + r * 45,
          row: r,
          col: c,
          alive: true,
        });
      }
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

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
          if (a.alive && Math.abs(b.x - a.x) < 22 && Math.abs(b.y - a.y) < 18) {
            a.alive = false;
            this.bullets.splice(i, 1);
            const pts = (4 - a.row) * 100;
            this.score += pts;
            this.ctx.audio.playExplosion();

            globalParticles.emitBurst(a.x, a.y, 20, ["#00F0FF", "#FF5C8A", "#FFD700", "#ffffff"], 80, 260);
            globalParticles.emitText(`+${pts}`, a.x, a.y - 12, "#FFD700", 14);
            break;
          }
        }
      } else {
        // Alien bullet hit player
        if (Math.abs(b.x - this.playerX) < 24 && Math.abs(b.y - 620) < 16) {
          this.bullets.splice(i, 1);
          this.lives--;
          this.ctx.audio.playExplosion();
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      }
    }

    // Alien group movement
    this.alienTimer += dt;
    const speedInterval = Math.max(0.15, 0.6 - (this.level - 1) * 0.08);
    if (this.alienTimer >= speedInterval) {
      this.alienTimer = 0;
      let reachEdge = false;
      for (const a of this.aliens) {
        if (!a.alive) continue;
        if ((this.alienDir > 0 && a.x > 540) || (this.alienDir < 0 && a.x < 50)) {
          reachEdge = true;
          break;
        }
      }

      if (reachEdge) {
        this.alienDir *= -1;
        for (const a of this.aliens) {
          a.y += 20;
          if (a.alive && a.y >= 600) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      } else {
        for (const a of this.aliens) {
          a.x += this.alienDir * 18;
        }
      }
    }

    // Alien shooting
    this.alienShootTimer += dt;
    if (this.alienShootTimer > 1.2) {
      this.alienShootTimer = 0;
      const aliveAliens = this.aliens.filter((a) => a.alive);
      if (aliveAliens.length > 0) {
        const shooter = aliveAliens[Math.floor(this.ctx.random.next() * aliveAliens.length)];
        this.bullets.push({ x: shooter.x, y: shooter.y + 12, vy: 260, fromPlayer: false });
      }
    }

    // Next wave check
    if (this.aliens.every((a) => !a.alive)) {
      this.level++;
      this.score += 1000;
      this.ctx.audio.playPowerUp();
      this.spawnAlienWave();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.movingLeft = isPressed;
    if (action === "MOVE_RIGHT") this.movingRight = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isPaused) {
      if (this.bullets.filter((b) => b.fromPlayer).length < 3) {
        this.bullets.push({ x: this.playerX, y: 605, vy: -520, fromPlayer: true });
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
    pr.clear("#030604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Stage border
    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Aliens
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const col = a.row === 0 ? "#FF3366" : a.row === 1 ? "#FFB703" : "#00F0FF";
      pr.drawPixelBlock(a.x - 16, a.y - 12, 32, col, "#FFFFFF", "rgba(0,0,0,0.5)");
    }

    // Draw Bullets
    for (const b of this.bullets) {
      const bCol = b.fromPlayer ? "#00FF66" : "#FF3366";
      pr.drawRect(b.x - 2, b.y - 6, 4, 12, bCol, true);
    }

    // Draw Player Cannon
    pr.drawPixelBlock(this.playerX - 22, 615, 44, "#00FF66", "#FFFFFF", "#047857");
    pr.drawRect(this.playerX - 4, 600, 8, 15, "#00FF66", true);

    // Render Particles & Text Popups
    globalParticles.render(pr);

    // Top status
    pr.drawText(`SCORE: ${this.score}  •  LEVEL: ${this.level}  •  LIVES: ${this.lives}`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MOTHERSHIP OVERRUN — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
