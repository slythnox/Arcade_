import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawGravityRunner } from "../gravityFlip/gravityRunnerSprite";

type PlatformType = "normal" | "moving" | "fragile" | "spring" | "booster";

interface Platform {
  id: number;
  x: number;
  y: number;
  width: number;
  type: PlatformType;
  dir: number;
  broken: boolean;
  hasGem: boolean;
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

export class PixelJumperGame implements GameInstance {
  private ctx!: GameContext;

  private playerPos: Vector2 = new Vector2(300, 500);
  private playerVel: Vector2 = new Vector2(0, -680);
  private isGrounded: boolean = false;

  private platforms: Platform[] = [];
  private particles: Particle[] = [];

  private score: number = 0;
  private maxHeight: number = 0;
  private comboJumps: number = 0;

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private screenShake: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 500);
    this.playerVel = new Vector2(0, -680);
    this.score = 0;
    this.maxHeight = 0;
    this.comboJumps = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.screenShake = 0;

    this.platforms = [];
    this.particles = [];

    // Starting stable platform
    this.platforms.push({
      id: Math.random(),
      x: 230,
      y: 550,
      width: 140,
      type: "normal",
      dir: 1,
      broken: false,
      hasGem: false,
    });

    for (let i = 1; i < 11; i++) {
      this.spawnPlatform(550 - i * 68);
    }
  }

  private spawnPlatform(y: number): void {
    const roll = Math.random();
    let type: PlatformType = "normal";
    let width = 85;

    if (roll > 0.85) {
      type = "spring";
      width = 80;
    } else if (roll > 0.65) {
      type = "moving";
      width = 80;
    } else if (roll > 0.48) {
      type = "fragile";
      width = 75;
    }

    this.platforms.push({
      id: Math.random(),
      x: 40 + Math.random() * (520 - width),
      y,
      width,
      type,
      dir: Math.random() > 0.5 ? 1 : -1,
      broken: false,
      hasGem: Math.random() > 0.45 && type !== "fragile",
    });
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // Smooth horizontal steering
    const steerSpeed = 440;
    if (this.moveLeft) {
      this.playerVel.x = -steerSpeed;
    } else if (this.moveRight) {
      this.playerVel.x = steerSpeed;
    } else {
      this.playerVel.x *= 0.86;
    }

    // Gravity & Kinematics
    this.playerVel.y += 1150 * dt;
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Horizontal Screen Wrap (Seamless looping through screen sides)
    if (this.playerPos.x < 10) this.playerPos.x = 590;
    else if (this.playerPos.x > 590) this.playerPos.x = 10;

    // Update Moving Platforms
    for (const p of this.platforms) {
      if (p.type === "moving") {
        p.x += p.dir * 130 * dt;
        if (p.x < 30) {
          p.x = 30;
          p.dir = 1;
        } else if (p.x > 570 - p.width) {
          p.x = 570 - p.width;
          p.dir = -1;
        }
      }
    }

    // Downward Platform Landing Check
    this.isGrounded = false;
    if (this.playerVel.y > 0) {
      for (const p of this.platforms) {
        if (p.broken) continue;

        const isXMatch =
          this.playerPos.x >= p.x - 12 &&
          this.playerPos.x <= p.x + p.width + 12;
        const isYMatch =
          this.playerPos.y >= p.y - 14 &&
          this.playerPos.y <= p.y + 16;

        if (isXMatch && isYMatch) {
          this.isGrounded = true;

          if (p.type === "fragile") {
            // Fragile Break
            p.broken = true;
            this.playerVel.y = -520;
            this.screenShake = 0.2;
            this.ctx.audio?.playExplosion?.();
            globalParticles.emitBurst(p.x + p.width / 2, p.y, 20, ["#B45309", "#78350F", "#FFFFFF"], 60, 180);
            globalParticles.emitText("CRACK!", p.x + p.width / 2, p.y - 16, "#B45309", 12);
          } else if (p.type === "spring") {
            // Super Spring Launch
            this.playerVel.y = -1050;
            this.comboJumps++;
            this.screenShake = 0.4;
            this.ctx.audio?.playPowerUp?.();
            globalParticles.emitBurst(p.x + p.width / 2, p.y, 24, ["#FEF08A", "#F59E0B", "#FFFFFF"], 80, 260);
            globalParticles.emitText("⚡ SUPER BOUNCE! +500", this.playerPos.x, this.playerPos.y - 28, "#FEF08A", 14);
            this.score += 500;
          } else {
            // Normal / Moving Rebound
            this.playerVel.y = -680;
            this.comboJumps++;
            this.ctx.audio?.playRotate?.();
            globalParticles.emitBurst(this.playerPos.x, p.y, 10, ["#34D399", "#FFFFFF"], 40, 120);
          }

          // Collectible Gem Check
          if (p.hasGem) {
            p.hasGem = false;
            this.score += 300;
            this.ctx.audio?.playCoin?.();
            globalParticles.emitBurst(p.x + p.width / 2, p.y - 10, 16, ["#FEF08A", "#38BDF8", "#FFFFFF"], 50, 160);
            globalParticles.emitText("+300 GEM!", p.x + p.width / 2, p.y - 20, "#FEF08A", 13);
          }
          break;
        }
      }
    }

    // Camera Upward Ascent Scrolling
    if (this.playerPos.y < 320) {
      const diff = 320 - this.playerPos.y;
      this.playerPos.y = 320;
      this.maxHeight += diff;
      this.score = Math.floor(this.maxHeight / 8);

      for (const p of this.platforms) {
        p.y += diff;
      }

      // Recycle fallen platforms
      this.platforms = this.platforms.filter((p) => p.y < 720);
      while (this.platforms.length < 11) {
        const topY = Math.min(...this.platforms.map((p) => p.y));
        this.spawnPlatform(topY - 68);
      }
    }

    // Fall Death Check
    if (this.playerPos.y > 710) {
      this.gameOver = true;
      this.screenShake = 0.8;
      this.ctx.audio?.playGameOver?.();
      this.ctx.session.setStatus("game-over");
      globalParticles.emitBurst(this.playerPos.x, 690, 40, ["#EF4444", "#F59E0B", "#FFFFFF"], 120, 360);
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
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
  public getLevel(): number { return Math.floor(this.maxHeight / 1500) + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = pr.getWidth();
    const h = pr.getHeight();

    pr.save();
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake * 12;
      const sy = (Math.random() - 0.5) * this.screenShake * 12;
      pr.translate(sx, sy);
    }

    // 1. Dynamic Vertical Sky Gradient (Deep Sky -> High Stratosphere)
    if (ctx2d) {
      const skyGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, "#08061C");
      skyGrad.addColorStop(0.5, "#150E34");
      skyGrad.addColorStop(1, "#0A0520");
      ctx2d.fillStyle = skyGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#08061C");
    }

    // Vertical Ascension Parallax Grid
    pr.drawGrid(8, 10, 60, "rgba(56, 189, 248, 0.04)", 0, (this.maxHeight * 0.4) % 60);

    // Parallax Ascending Clouds
    for (let i = 0; i < 8; i++) {
      const cy = ((i * 120 - this.maxHeight * 0.25) % (h + 100));
      const cx = (i * 95) % (w - 60) + 30;
      pr.drawCircle(cx, cy, 32, "rgba(56, 189, 248, 0.06)", true);
      pr.drawCircle(cx + 20, cy - 8, 24, "rgba(56, 189, 248, 0.06)", true);
      pr.drawCircle(cx - 20, cy - 8, 24, "rgba(56, 189, 248, 0.06)", true);
    }

    // 2. High-Polish Multi-Tier Platforms
    for (const p of this.platforms) {
      if (p.broken) continue;

      if (p.type === "spring") {
        // Super Spring Golden Booster Platform
        pr.drawRect(p.x, p.y, p.width, 14, "#F59E0B", true);
        pr.drawRect(p.x, p.y, p.width, 3, "#FEF08A", true);
        pr.drawRect(p.x, p.y + 11, p.width, 3, "#B45309", true);

        // Animated Spring Coils
        const springX = p.x + p.width / 2;
        const coilH = 6 + Math.sin(this.animTime * 10) * 2;
        pr.drawRect(springX - 10, p.y - coilH, 20, coilH, "#FEF08A", true);
        pr.drawCircle(springX, p.y - coilH, 6, "#FFFFFF", true);
      } else if (p.type === "moving") {
        // Cyan Mag-Lev Moving Platform
        pr.drawRect(p.x, p.y, p.width, 14, "#0284C7", true);
        pr.drawRect(p.x, p.y, p.width, 3, "#00F0FF", true);
        pr.drawRect(p.x, p.y + 11, p.width, 3, "#0369A1", true);

        // Jet Thrusters on Sides
        pr.drawRect(p.x - 3, p.y + 3, 3, 8, "#38BDF8", true);
        pr.drawRect(p.x + p.width, p.y + 3, 3, 8, "#38BDF8", true);
      } else if (p.type === "fragile") {
        // Cracked Timber Fragile Platform
        pr.drawRect(p.x, p.y, p.width, 14, "#78350F", true);
        pr.drawRect(p.x, p.y, p.width, 3, "#B45309", true);
        pr.drawRect(p.x, p.y + 11, p.width, 3, "#451A03", true);

        // Cracks
        pr.drawLine(p.x + 15, p.y + 2, p.x + 35, p.y + 12, "#1E293B", 2);
        pr.drawLine(p.x + 45, p.y + 2, p.x + 65, p.y + 12, "#1E293B", 2);
      } else {
        // Standard Emerald Platform
        pr.drawRect(p.x, p.y, p.width, 14, "#15803D", true);
        pr.drawRect(p.x, p.y, p.width, 3, "#34D399", true);
        pr.drawRect(p.x, p.y + 11, p.width, 3, "#065F46", true);
      }

      // Collectible Floating Diamond
      if (p.hasGem) {
        const gx = p.x + p.width / 2;
        const gy = p.y - 14;
        const gemPulse = Math.sin(this.animTime * 6 + p.id) * 3;
        pr.drawCircle(gx, gy, 8 + gemPulse, "rgba(254, 240, 138, 0.25)", true);

        if (ctx2d) {
          ctx2d.fillStyle = "#FEF08A";
          ctx2d.beginPath();
          ctx2d.moveTo(gx, gy - 7);
          ctx2d.lineTo(gx + 6, gy);
          ctx2d.lineTo(gx, gy + 7);
          ctx2d.lineTo(gx - 6, gy);
          ctx2d.closePath();
          ctx2d.fill();

          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.beginPath();
          ctx2d.moveTo(gx - 2, gy - 4);
          ctx2d.lineTo(gx + 2, gy - 4);
          ctx2d.lineTo(gx, gy);
          ctx2d.closePath();
          ctx2d.fill();
        }
      }
    }

    // 3. Particles
    for (const pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      pr.drawCircle(pt.x, pt.y, 2.5 * alpha, pt.color, true);
    }

    // 4. Pixel Runner Character (Matching Gravity Flip & Rope Swing)
    const px = this.playerPos.x;
    const py = this.playerPos.y;

    drawGravityRunner(
      pr,
      px,
      py,
      1, // Standing/jumping upright
      this.animTime,
      this.isGrounded,
      2.4
    );

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 5. Top Cyber HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, "#34D399", false);

    pr.drawText(`ALTITUDE: ${Math.floor(this.maxHeight / 10)}M`, 24, 28, { size: 14, color: "#FFD84D", font: "monospace" });
    pr.drawText(`LEVEL ${this.getLevel()}`, w / 2, 28, { size: 12, color: "#00F0FF", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 24, 28, { size: 13, color: "#34D399", align: "right", font: "monospace" });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 300, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[← / → or A / D: STEER RUNNER  •  R: RETRY]", 166, h - 20, {
      size: 8,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("FELL INTO THE VOID — RUN TERMINATED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO BOUNCE AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
