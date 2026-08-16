import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface FloorLayer {
  y: number;
  gapX: number;
  gapWidth: number;
  hasGem?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class BallDropGame implements GameInstance {
  private ctx!: GameContext;
  private ballX: number = 300;
  private ballY: number = 200;
  private ballVx: number = 0;
  private ballVy: number = 0;
  private readonly ballRadius: number = 11;
  private scrollSpeed: number = 180;
  private floors: FloorLayer[] = [];
  private particles: Particle[] = [];
  private score: number = 0;
  private depth: number = 0;
  private combo: number = 1;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.ballX = 300;
    this.ballY = 200;
    this.ballVx = 0;
    this.ballVy = 0;
    this.scrollSpeed = 180;
    this.score = 0;
    this.depth = 0;
    this.combo = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.floors = [];
    this.particles = [];

    for (let i = 0; i < 7; i++) {
      this.spawnFloor(250 + i * 85);
    }
  }

  private spawnFloor(y: number): void {
    const gapWidth = Math.max(70, 100 - Math.floor(this.depth / 200) * 4);
    this.floors.push({
      y,
      gapX: 60 + this.ctx.random.next() * (480 - gapWidth),
      gapWidth,
      hasGem: this.ctx.random.next() > 0.5,
    });
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 30 + this.ctx.random.next() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.35,
        color,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    this.scrollSpeed = 180 + Math.min(220, this.depth * 0.05);
    const scrollDelta = this.scrollSpeed * dt;
    this.depth += scrollDelta * 0.1;
    this.score += Math.floor(scrollDelta * 0.1);

    // Ball steering & gravity
    const speed = 360;
    if (this.moveLeft) this.ballVx = -speed;
    else if (this.moveRight) this.ballVx = speed;
    else this.ballVx *= 0.86;

    this.ballVy += 1100 * dt;
    this.ballX += this.ballVx * dt;
    this.ballY += this.ballVy * dt;

    this.ballX = Math.max(30, Math.min(570, this.ballX));

    // Scroll floors upward
    for (const f of this.floors) {
      f.y -= scrollDelta;
    }

    // Floor collisions
    let onFloor = false;
    for (const f of this.floors) {
      if (
        this.ballY + this.ballRadius >= f.y &&
        this.ballY - this.ballRadius <= f.y + 12 &&
        this.ballVy >= 0
      ) {
        // Check if inside gap
        if (this.ballX >= f.gapX && this.ballX <= f.gapX + f.gapWidth) {
          // Fall through gap
          this.combo++;
          this.score += 50 * this.combo;
          this.addParticles(this.ballX, f.y, "#00F0FF", 2);
        } else {
          // Land on platform
          this.ballY = f.y - this.ballRadius;
          this.ballVy = 0;
          this.combo = 1;
          onFloor = true;
          break;
        }
      }

      // Check gem pickup
      if (f.hasGem && Math.abs(f.y - this.ballY) < 20 && Math.abs(f.gapX + f.gapWidth / 2 - this.ballX) < 30) {
        f.hasGem = false;
        this.score += 250;
        this.addParticles(this.ballX, this.ballY, "#FFD84D", 8);
        this.ctx.audio.playCoin();
      }
    }

    // Ball rises with floor if resting on it
    if (onFloor) {
      this.ballY -= scrollDelta;
    }

    // Recycle top floors
    this.floors = this.floors.filter((f) => f.y > -20);
    while (this.floors.length < 8) {
      const botY = Math.max(...this.floors.map((f) => f.y));
      this.spawnFloor(botY + 85);
    }

    // Check ceiling crush or bottom fall
    if (this.ballY <= 70) {
      this.gameOver = true;
      this.addParticles(this.ballX, 70, "#EF4444", 24);
      this.ctx.audio.playExplosion();
      this.ctx.session.setStatus("game-over");
    } else if (this.ballY >= 680) {
      this.ballY = 680;
      this.ballVy = -200;
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
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
  public getLevel(): number { return Math.floor(this.depth / 100) + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Shaft Speed Grid
    pr.drawGrid(8, 9, 65, "rgba(0, 240, 255, 0.03)", 40, 60);

    // 2. Ceiling Hazard Spikes
    for (let x = 20; x < w - 20; x += 24) {
      pr.drawLine(x, 52, x + 12, 70, "#EF4444", 3);
      pr.drawLine(x + 12, 70, x + 24, 52, "#EF4444", 3);
    }

    // 3. Draw Floor Bars with Neon Edges
    for (const f of this.floors) {
      // Left Segment
      if (f.gapX > 20) {
        pr.drawPixelBlock(20, f.y, 12, "#1e293b", "#475569", "#0f172a");
        pr.drawRect(20, f.y, f.gapX - 20, 12, "#334155", true);
        pr.drawLine(20, f.y, f.gapX, f.y, "#38bdf8", 2);
      }

      // Right Segment
      const rightX = f.gapX + f.gapWidth;
      if (rightX < w - 20) {
        pr.drawPixelBlock(rightX, f.y, 12, "#1e293b", "#475569", "#0f172a");
        pr.drawRect(rightX, f.y, w - 20 - rightX, 12, "#334155", true);
        pr.drawLine(rightX, f.y, w - 20, f.y, "#38bdf8", 2);
      }

      // Gem pickup in gap
      if (f.hasGem) {
        const gx = f.gapX + f.gapWidth / 2;
        const pulse = Math.sin(this.animTime * 6 + gx) * 2;
        pr.drawCircle(gx, f.y + 6, 6 + pulse, "rgba(255, 216, 77, 0.3)", true);
        pr.drawCircle(gx, f.y + 6, 4, "#FFD84D", true);
      }
    }

    // 4. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 5. Draw Chrome Pinball
    const bx = this.ballX;
    const by = this.ballY;
    pr.drawCircle(bx, by, this.ballRadius, "#00F0FF", true);
    pr.drawCircle(bx - 3, by - 3, 5, "#FFFFFF", true);

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`DEPTH: ${Math.floor(this.depth)}m`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`COMBO: x${this.combo}`, w / 2, 32, { size: 13, color: "#38bdf8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("CRUSHED BY SPIKES — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO DROP AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
