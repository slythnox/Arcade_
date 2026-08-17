import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawGravityRunner } from "./gravityRunnerSprite";

interface Obstacle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isCeiling: boolean;
  type: "spike" | "laser_gate" | "barrier";
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

export class GravityFlipGame implements GameInstance {
  private ctx!: GameContext;

  private playerX: number = 120;
  private playerY: number = 550;
  private playerVy: number = 0;
  private gravityDir: number = 1; // 1 = down (floor), -1 = up (ceiling)
  private isGrounded: boolean = true;
  private rotationAngle: number = 0;

  private speed: number = 420;
  private maxSpeed: number = 780;
  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];

  private spawnTimer: number = 0;
  private score: number = 0;
  private flipsCount: number = 0;
  private multiplier: number = 1;

  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private time: number = 0;
  private flipFlash: number = 0;
  private screenShake: number = 0;

  // Track Boundaries
  private readonly floorY: number = 560;
  private readonly ceilY: number = 130;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
    if (!canvas) return;

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        this.flipGravity();
      }
    };

    canvas.addEventListener("pointerdown", this.boundPointerDown);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 120;
    this.playerY = this.floorY - 24;
    this.playerVy = 0;
    this.gravityDir = 1;
    this.isGrounded = true;
    this.rotationAngle = 0;

    this.speed = 420;
    this.obstacles = [];
    this.particles = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.flipsCount = 0;
    this.multiplier = 1;

    this.time = 0;
    this.flipFlash = 0;
    this.screenShake = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  public flipGravity(): void {
    if (this.gameOver || this.isPaused || !this.isGrounded) return;

    this.gravityDir *= -1;
    this.isGrounded = false;
    this.flipFlash = 0.3;
    this.screenShake = 0.25;
    this.flipsCount++;
    this.score += 50;

    this.ctx.audio?.playRotate?.();

    // Emit Gravity Warp Ring & Sparks
    globalParticles.emitBurst(this.playerX + 12, this.playerY + 12, 16, ["#00F0FF", "#38BDF8", "#FFFFFF"], 60, 200);
    globalParticles.emitText("GRAVITY INVERT!", this.playerX + 12, this.playerY - 20 * this.gravityDir, "#00F0FF", 12);
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.time += dt;
    if (this.flipFlash > 0) this.flipFlash -= dt * 2;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // Running Sparks / Footstep Dust
    if (this.isGrounded) {
      if (Math.random() < 0.35) {
        this.particles.push({
          x: this.playerX + (this.gravityDir === 1 ? 4 : 4),
          y: this.gravityDir === 1 ? this.floorY : this.ceilY,
          vx: -this.speed * 0.4 + (Math.random() - 0.5) * 60,
          vy: -this.gravityDir * (20 + Math.random() * 40),
          life: 0.35,
          maxLife: 0.35,
          color: "#34D399",
        });
      }
    } else {
      // Mid-Air Inversion Trail
      this.particles.push({
        x: this.playerX + 10,
        y: this.playerY + 12,
        vx: -this.speed * 0.5,
        vy: (Math.random() - 0.5) * 40,
        life: 0.3,
        maxLife: 0.3,
        color: "#00F0FF",
      });
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Gravity Physics
    const gravityForce = 2400 * this.gravityDir;
    this.playerVy += gravityForce * dt;
    this.playerY += this.playerVy * dt;

    // Floor & Ceiling Landing
    if (this.gravityDir === 1 && this.playerY >= this.floorY - 26) {
      this.playerY = this.floorY - 26;
      this.playerVy = 0;
      if (!this.isGrounded) {
        // Landing Impact
        this.isGrounded = true;
        globalParticles.emitBurst(this.playerX + 12, this.floorY, 8, ["#34D399", "#FFFFFF"], 30, 90);
      }
    } else if (this.gravityDir === -1 && this.playerY <= this.ceilY + 2) {
      this.playerY = this.ceilY + 2;
      this.playerVy = 0;
      if (!this.isGrounded) {
        // Ceiling Landing Impact
        this.isGrounded = true;
        globalParticles.emitBurst(this.playerX + 12, this.ceilY, 8, ["#34D399", "#FFFFFF"], 30, 90);
      }
    } else {
      this.isGrounded = false;
    }

    // Spawn Obstacles (Scaling dynamic rate)
    this.spawnTimer += dt;
    const spawnRate = Math.max(0.65, 1.4 - (this.speed - 420) / 1200);
    if (this.spawnTimer >= spawnRate) {
      this.spawnTimer = 0;
      const isCeiling = Math.random() < 0.5;
      const typeRand = Math.random();
      const type = typeRand > 0.5 ? "spike" : typeRand > 0.25 ? "laser_gate" : "barrier";
      const h = type === "spike" ? 44 + Math.random() * 32 : type === "laser_gate" ? 75 : 55;

      this.obstacles.push({
        id: Math.random(),
        x: 640,
        y: isCeiling ? this.ceilY : this.floorY - h,
        width: type === "spike" ? 34 : 26,
        height: h,
        isCeiling,
        type,
      });
    }

    // Update Obstacles & Collision Check
    const playerBox = {
      x: this.playerX + 6,
      y: this.playerY + 4,
      w: 18,
      h: 22,
    };

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.x -= this.speed * dt;

      if (obs.x < -60) {
        this.obstacles.splice(i, 1);
        this.score += 150;
        continue;
      }

      // Collision Detection
      if (
        playerBox.x + playerBox.w > obs.x &&
        playerBox.x < obs.x + obs.width &&
        playerBox.y + playerBox.h > obs.y &&
        playerBox.y < obs.y + obs.height
      ) {
        this.gameOver = true;
        this.screenShake = 0.8;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(this.playerX + 12, this.playerY + 12, 40, ["#EF4444", "#F59E0B", "#FFFFFF"], 120, 360);
      }
    }

    // Score & Speed Progression
    this.score += Math.round(dt * (this.speed * 0.25));
    this.speed = Math.min(this.maxSpeed, this.speed + dt * 6.5);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (
      (action === "ACTION_PRIMARY" ||
        action === "MOVE_UP" ||
        action === "MOVE_DOWN" ||
        action === "CONFIRM") &&
      isPressed
    ) {
      this.flipGravity();
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerDown) {
      const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
      canvas?.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return Math.floor(this.speed / 100); }

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

    // 1. Futuristic Cyber Runner Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#08061C");
      bgGrad.addColorStop(0.5, "#130E30");
      bgGrad.addColorStop(1, "#09061F");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#08061C");
    }

    // Holographic Parallax Grid
    pr.drawGrid(8, 10, 60, "rgba(99, 102, 241, 0.06)", (this.time * this.speed * 0.3) % 60, 0);

    // Parallax Cyber Speed-Lines
    for (let i = 0; i < 15; i++) {
      const lineX = ((this.time * 600 + i * 48) % (w + 100)) - 50;
      const lineY = 160 + (i * 26) % 360;
      pr.drawLine(w - lineX, lineY, w - lineX - 40, lineY, "rgba(0, 240, 255, 0.12)", 1.5);
    }

    // 2. Gravity Inversion Flash Aura
    if (this.flipFlash > 0) {
      pr.drawRect(0, 0, w, h, `rgba(0, 240, 255, ${this.flipFlash * 0.4})`, true);
      pr.drawRect(0, 0, w, h, "#00F0FF", false);
    }

    // 3. Top Ceiling & Bottom Floor Magnetic Neon Rails
    const railOffset = (this.time * this.speed) % 40;

    // Floor Magnetic Rail
    pr.drawRect(0, this.floorY, w, 140, "#0F172A", true);
    pr.drawRect(0, this.floorY, w, 6, "#34D399", true);
    pr.drawRect(0, this.floorY + 6, w, 2, "#10B981", true);
    for (let rx = -railOffset; rx < w; rx += 40) {
      pr.drawRect(rx, this.floorY + 8, 18, 4, "#065F46", true);
      pr.drawRect(rx + 4, this.floorY + 2, 8, 3, "#FEF08A", true);
    }

    // Ceiling Magnetic Rail
    pr.drawRect(0, 0, w, this.ceilY, "#0F172A", true);
    pr.drawRect(0, this.ceilY - 6, w, 6, "#34D399", true);
    pr.drawRect(0, this.ceilY - 8, w, 2, "#10B981", true);
    for (let rx = -railOffset; rx < w; rx += 40) {
      pr.drawRect(rx, this.ceilY - 12, 18, 4, "#065F46", true);
      pr.drawRect(rx + 4, this.ceilY - 5, 8, 3, "#FEF08A", true);
    }

    // 4. Obstacles (Spikes, Laser Gates, Plasma Barriers)
    for (const obs of this.obstacles) {
      if (obs.type === "spike") {
        // Neon Crimson Danger Spikes
        if (ctx2d) {
          ctx2d.fillStyle = "#EF4444";
          ctx2d.beginPath();
          if (obs.isCeiling) {
            ctx2d.moveTo(obs.x, obs.y);
            ctx2d.lineTo(obs.x + obs.width, obs.y);
            ctx2d.lineTo(obs.x + obs.width / 2, obs.y + obs.height);
          } else {
            ctx2d.moveTo(obs.x + obs.width / 2, obs.y);
            ctx2d.lineTo(obs.x + obs.width, obs.y + obs.height);
            ctx2d.lineTo(obs.x, obs.y + obs.height);
          }
          ctx2d.closePath();
          ctx2d.fill();

          // Highlight Core
          ctx2d.fillStyle = "#FEF08A";
          ctx2d.beginPath();
          if (obs.isCeiling) {
            ctx2d.moveTo(obs.x + 8, obs.y);
            ctx2d.lineTo(obs.x + obs.width - 8, obs.y);
            ctx2d.lineTo(obs.x + obs.width / 2, obs.y + obs.height - 10);
          } else {
            ctx2d.moveTo(obs.x + obs.width / 2, obs.y + 10);
            ctx2d.lineTo(obs.x + obs.width - 8, obs.y + obs.height);
            ctx2d.lineTo(obs.x + 8, obs.y + obs.height);
          }
          ctx2d.closePath();
          ctx2d.fill();
        }
      } else if (obs.type === "laser_gate") {
        // High-Voltage Laser Gate
        pr.drawRect(obs.x, obs.y, obs.width, obs.height, "rgba(239, 68, 68, 0.25)", true);
        pr.drawRect(obs.x + 4, obs.y, obs.width - 8, obs.height, "#F43F5E", true);
        pr.drawRect(obs.x + 8, obs.y, obs.width - 16, obs.height, "#FFFFFF", true);
        // Emitter Nodes
        pr.drawCircle(obs.x + obs.width / 2, obs.y, 7, "#38BDF8", true);
        pr.drawCircle(obs.x + obs.width / 2, obs.y + obs.height, 7, "#38BDF8", true);
      } else {
        // Magnetic Flux Barrier Block
        pr.drawRect(obs.x, obs.y, obs.width, obs.height, "#1E1B4B", true);
        pr.drawRect(obs.x, obs.y, obs.width, obs.height, "#A855F7", false);
        pr.drawRect(obs.x + 4, obs.y + 4, obs.width - 8, obs.height - 8, "#C084FC", true);
      }
    }

    // 5. Running Sparks & Trail Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      pr.drawCircle(p.x, p.y, 3 * alpha, p.color, true);
    }

    // 6. Player Character (Exact match to user's pixel reference)
    drawGravityRunner(
      pr,
      this.playerX + 12,
      this.playerY + 12,
      this.gravityDir,
      this.time,
      this.isGrounded,
      2.4
    );

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 7. Top Cyber HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, "#34D399", false);

    pr.drawText(`DISTANCE: ${this.score} M`, 24, 28, { size: 13, color: "#FFD84D", font: "monospace" });
    pr.drawText(`FLIPS: ${this.flipsCount}`, w / 2, 28, { size: 12, color: "#00F0FF", align: "center", font: "monospace" });
    pr.drawText(`VELOCITY: ${Math.round(this.speed)} KM/H`, w - 24, 28, { size: 13, color: "#34D399", align: "right", font: "monospace" });

    // Speedometer Gauge (Right side bar)
    const speedPct = Math.min(1, (this.speed - 420) / (this.maxSpeed - 420));
    pr.drawRect(w - 18, 150, 6, 380, "#0F172A", true);
    pr.drawRect(w - 18, 530 - 380 * speedPct, 6, 380 * speedPct, "#00F0FF", true);

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 300, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[CLICK / SPACE: INVERT GRAVITY  •  R: RETRY]", 166, h - 20, {
      size: 8,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("POLARITY COLLISION — RUN TERMINATED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO RETRY RUN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
