import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

interface Swooper {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  tier: number; // 0: Boss, 1: Escort, 2: Swarmer
  state: "home" | "dive" | "return";
  t: number;
  diveAngle: number;
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

export class AlienSwarmGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 300;
  private movingLeft: boolean = false;
  private movingRight: boolean = false;
  private aliens: Swooper[] = [];
  private bullets: { x: number; y: number; vy: number; vx?: number; fromPlayer: boolean }[] = [];
  private stars: Star[] = [];
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private globalTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initStars();
    this.reset();
  }

  private initStars(): void {
    this.stars = [];
    const colors = ["#FFFFFF", "#93C5FD", "#FDE047", "#C084FC", "#67E8F9"];
    for (let i = 0; i < 70; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        speed: 40 + Math.random() * 90,
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
    this.globalTime = 0;
    this.spawnSwarm();
  }

  private spawnSwarm(): void {
    this.aliens = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        const hx = 90 + c * 70;
        const hy = 80 + r * 48;
        const tier = r === 0 ? 0 : r === 1 ? 1 : 2;
        this.aliens.push({
          x: hx,
          y: hy,
          homeX: hx,
          homeY: hy,
          tier,
          state: "home",
          t: 0,
          diveAngle: 0,
          alive: true,
          frame: 0,
        });
      }
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);

    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > 700) {
        star.y = 0;
        star.x = Math.random() * 600;
      }
    }

    if (this.gameOver || this.isPaused) return;
    this.globalTime += dt;

    if (this.movingLeft) this.playerX = Math.max(30, this.playerX - 400 * dt);
    if (this.movingRight) this.playerX = Math.min(570, this.playerX + 400 * dt);

    // Update aliens with aggressive dive-bombing mechanics
    let diveCount = this.aliens.filter((a) => a.state === "dive").length;
    const maxDivers = Math.min(6, 2 + this.level);

    for (const a of this.aliens) {
      if (!a.alive) continue;
      a.frame = Math.floor(this.globalTime * 4) % 2;

      if (a.state === "home") {
        a.x = a.homeX + Math.sin(this.globalTime * 2.8 + a.homeY * 0.05) * 26;
        a.y = a.homeY + Math.cos(this.globalTime * 1.8) * 8;

        // Escalating chance to dive based on level
        const diveProb = 0.008 + (this.level - 1) * 0.004;
        if (diveCount < maxDivers && this.ctx.random.next() < diveProb) {
          a.state = "dive";
          a.t = 0;
          diveCount++;
        }
      } else if (a.state === "dive") {
        a.t += dt * (1.6 + (this.level - 1) * 0.15);
        // Aggressive loop-de-loop swoop toward player
        a.y += (220 + this.level * 25) * dt;
        a.x += Math.sin(a.t * 3.8) * (180 + this.level * 20) * dt;

        // Dive shooter
        if (this.ctx.random.next() < 0.035 + this.level * 0.01) {
          const aimAngle = Math.atan2(620 - a.y, this.playerX - a.x);
          const spd = 300 + this.level * 30;
          this.bullets.push({
            x: a.x,
            y: a.y + 10,
            vx: Math.cos(aimAngle) * (spd * 0.4),
            vy: Math.abs(Math.sin(aimAngle) * spd) || 300,
            fromPlayer: false,
          });
          this.ctx.audio?.playLaser?.();
        }

        if (a.y > 690) {
          a.y = -20;
          a.state = "return";
        }
      } else if (a.state === "return") {
        a.y += 180 * dt;
        const dx = a.homeX - a.x;
        a.x += Math.sign(dx) * Math.min(Math.abs(dx), 160 * dt);
        if (a.y >= a.homeY) {
          a.y = a.homeY;
          a.state = "home";
        }
      }

      // Check alien collision with player
      if (Math.hypot(a.x - this.playerX, a.y - 620) < 26) {
        a.alive = false;
        this.lives--;
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(this.playerX, 620, 24, ["#EF4444", "#F59E0B", "#FFFFFF"], 90, 300);
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.vx) b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.y < 10 || b.y > 690 || b.x < 10 || b.x > 590) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        for (const a of this.aliens) {
          if (!a.alive) continue;
          if (Math.hypot(b.x - a.x, b.y - a.y) < 22) {
            a.alive = false;
            this.bullets.splice(i, 1);
            const pts = (a.state === "dive" ? 300 : 150) * (3 - a.tier) * this.level;
            this.score += pts;
            this.ctx.audio?.playExplosion?.();
            globalParticles.emitBurst(a.x, a.y, 16, ["#00F0FF", "#ffd84d", "#FF3366"], 70, 250);
            globalParticles.emitText(`+${pts}`, a.x, a.y, "#ffd84d", 14);
            break;
          }
        }
      } else {
        if (Math.hypot(b.x - this.playerX, b.y - 620) < 18) {
          this.bullets.splice(i, 1);
          this.lives--;
          this.ctx.audio?.playExplosion?.();
          globalParticles.emitBurst(this.playerX, 620, 20, ["#EF4444", "#F59E0B", "#FFFFFF"], 80, 260);
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      }
    }

    if (this.aliens.every((a) => !a.alive)) {
      this.level++;
      this.score += 2000 * this.level;
      this.ctx.audio?.playVictory?.();
      this.spawnSwarm();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.movingLeft = isPressed;
    if (action === "MOVE_RIGHT") this.movingRight = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isPaused) {
      if (this.bullets.filter((b) => b.fromPlayer).length < 4) {
        // Dual laser fire
        this.bullets.push({ x: this.playerX - 10, y: 605, vy: -600, fromPlayer: true });
        this.bullets.push({ x: this.playerX + 10, y: 605, vy: -600, fromPlayer: true });
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

    // 1. Nebula Backdrop & Starfield
    pr.drawCircle(450, 220, 150, "rgba(220, 38, 38, 0.08)", true);
    pr.drawCircle(150, 420, 140, "rgba(2, 132, 199, 0.08)", true);

    for (const star of this.stars) {
      pr.drawRect(star.x, star.y, star.size, star.size, star.color, true);
    }

    // 2. Stage outer border
    pr.drawRect(8, 8, w - 16, h - 16, "#1e293b", false);

    // 3. Draw Detailed Swarm Attackers
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const wingSpread = a.frame === 0 ? 0 : 3;

      if (a.tier === 0) {
        // Galaga Commander Alien (Green/Yellow)
        pr.drawRect(a.x - 14 - wingSpread, a.y - 8, 28 + wingSpread * 2, 14, "#16A34A", true);
        pr.drawRect(a.x - 8, a.y - 12, 16, 6, "#86EFAC", true);
        pr.drawRect(a.x - 4, a.y - 4, 8, 8, "#FACC15", true);
      } else if (a.tier === 1) {
        // Red Escort Butterfly
        pr.drawRect(a.x - 12, a.y - 6, 24, 12, "#DC2626", true);
        pr.drawRect(a.x - 14 - wingSpread, a.y - 2, 6, 8, "#F87171", true);
        pr.drawRect(a.x + 8 + wingSpread, a.y - 2, 6, 8, "#F87171", true);
        pr.drawRect(a.x - 2, a.y - 2, 4, 4, "#FFFFFF", true);
      } else {
        // Yellow Horn Wasp
        pr.drawRect(a.x - 10, a.y - 6, 20, 10, "#EAB308", true);
        pr.drawRect(a.x - 12, a.y - 8 - wingSpread, 4, 12, "#FEF08A", true);
        pr.drawRect(a.x + 8, a.y - 8 - wingSpread, 4, 12, "#FEF08A", true);
        pr.drawRect(a.x - 2, a.y - 2, 4, 4, "#00F0FF", true);
      }
    }

    // 4. Draw Bullets
    for (const b of this.bullets) {
      if (b.fromPlayer) {
        pr.drawRect(b.x - 1, b.y - 6, 3, 12, "#00F0FF", true);
        pr.drawRect(b.x, b.y - 4, 1, 8, "#FFFFFF", true);
      } else {
        pr.drawCircle(b.x, b.y, 4, "#EF4444", true);
        pr.drawCircle(b.x, b.y, 2, "#FFFFFF", true);
      }
    }

    // 5. Draw Reference Starfighter for Player
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
      pr.drawText("SWARM BREACH — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
