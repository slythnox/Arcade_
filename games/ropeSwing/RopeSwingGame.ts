import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface AnchorPoint {
  x: number;
  y: number;
  hasRing?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class RopeSwingGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(100, 300);
  private playerVel: Vector2 = new Vector2(280, 0);
  private cameraX: number = 0;
  private anchors: AnchorPoint[] = [];
  private attachedAnchor: AnchorPoint | null = null;
  private ropeLength: number = 0;
  private particles: Particle[] = [];
  private score: number = 0;
  private distance: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(100, 300);
    this.playerVel = new Vector2(280, 0);
    this.cameraX = 0;
    this.score = 0;
    this.distance = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.attachedAnchor = null;
    this.anchors = [];
    this.particles = [];

    for (let i = 0; i < 8; i++) {
      this.anchors.push({
        x: 180 + i * 220,
        y: 120 + (i % 2) * 60,
        hasRing: this.ctx.random.next() > 0.4,
      });
    }
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 30 + this.ctx.random.next() * 90;
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

  private toggleRope(): void {
    if (this.gameOver || this.isPaused) return;

    if (this.attachedAnchor) {
      // Release rope with boost
      this.attachedAnchor = null;
      this.playerVel.x += 40;
      this.ctx.audio.playLaser();
      this.addParticles(this.playerPos.x - this.cameraX, this.playerPos.y, "#38BDF8", 8);
    } else {
      // Attach to nearest forward anchor
      let bestAnchor: AnchorPoint | null = null;
      let minDist = 340;

      for (const a of this.anchors) {
        if (a.x >= this.playerPos.x - 40) {
          const d = Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y);
          if (d < minDist) {
            minDist = d;
            bestAnchor = a;
          }
        }
      }

      if (bestAnchor) {
        this.attachedAnchor = bestAnchor;
        this.ropeLength = Math.hypot(bestAnchor.x - this.playerPos.x, bestAnchor.y - this.playerPos.y);
        this.ctx.audio.playRotate();
        this.addParticles(bestAnchor.x - this.cameraX, bestAnchor.y, "#00F0FF", 8);
      }
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    if (this.attachedAnchor) {
      // Pendulum swing physics
      const toAnchor = new Vector2(
        this.attachedAnchor.x - this.playerPos.x,
        this.attachedAnchor.y - this.playerPos.y
      );
      const currentDist = toAnchor.magnitude();

      // Gravity
      this.playerVel.y += 980 * dt;

      // Tension constraint
      if (currentDist >= this.ropeLength) {
        const norm = toAnchor.normalize();
        const radialVel = this.playerVel.dot(norm);
        if (radialVel < 0) {
          // Remove outward component
          this.playerVel = this.playerVel.sub(norm.scale(radialVel));
        }
        // Correct position
        this.playerPos = new Vector2(
          this.attachedAnchor.x - norm.x * this.ropeLength,
          this.attachedAnchor.y - norm.y * this.ropeLength
        );
      }
    } else {
      // Free flight gravity
      this.playerVel.y += 850 * dt;
    }

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Camera follow
    this.cameraX = this.playerPos.x - 140;
    this.distance = Math.max(this.distance, this.playerPos.x);
    this.score = Math.floor(this.distance / 10);

    // Spawn new anchors ahead
    const maxAnchorX = Math.max(...this.anchors.map((a) => a.x));
    if (maxAnchorX < this.cameraX + 800) {
      const nextX = maxAnchorX + 200 + this.ctx.random.next() * 60;
      const nextY = 100 + this.ctx.random.next() * 120;
      this.anchors.push({
        x: nextX,
        y: nextY,
        hasRing: this.ctx.random.next() > 0.4,
      });
    }

    // Check ring collectibles
    for (const a of this.anchors) {
      if (a.hasRing) {
        const ringX = a.x;
        const ringY = a.y + 120;
        if (Math.hypot(ringX - this.playerPos.x, ringY - this.playerPos.y) < 32) {
          a.hasRing = false;
          this.score += 500;
          this.addParticles(ringX - this.cameraX, ringY, "#FFD84D", 12);
          this.ctx.audio.playCoin();
        }
      }
    }

    // Recycle behind anchors
    this.anchors = this.anchors.filter((a) => a.x > this.cameraX - 100);

    // Abyss fall death
    if (this.playerPos.y > 690) {
      this.gameOver = true;
      this.addParticles(this.playerPos.x - this.cameraX, 680, "#EF4444", 24);
      this.ctx.audio.playExplosion();
      this.ctx.session.setStatus("game-over");
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
    if (!isPressed) return;
    if (action === "ACTION_PRIMARY" || action === "MOVE_UP" || action === "ROTATE") {
      this.toggleRope();
    }
    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return Math.floor(this.distance / 1500) + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cyber City Skyline Backdrop (Parallax 0.2)
    for (let x = 0; x < w + 100; x += 60) {
      const bx = x - ((this.cameraX * 0.2) % 60);
      const bh = 180 + ((x * 13) % 120);
      pr.drawRect(bx, h - bh, 48, bh, "#0c1527", true);
      pr.drawRect(bx + 4, h - bh + 10, 8, 8, "rgba(56, 189, 248, 0.2)", true);
    }

    // 2. Draw Magnetic Grapple Anchors
    for (const a of this.anchors) {
      const sx = a.x - this.cameraX;
      if (sx < -40 || sx > w + 40) continue;

      const isCurrent = this.attachedAnchor === a;
      const col = isCurrent ? "#00F0FF" : "#FFD84D";
      const pulse = isCurrent ? Math.sin(this.animTime * 10) * 3 : 0;

      pr.drawCircle(sx, a.y, 16 + pulse, "rgba(0, 240, 255, 0.2)", true);
      pr.drawCircle(sx, a.y, 10, col, true);
      pr.drawCircle(sx, a.y, 4, "#FFFFFF", true);

      // Energy Ring bonus
      if (a.hasRing) {
        const ry = a.y + 120;
        pr.drawCircle(sx, ry, 14, "rgba(255, 216, 77, 0.3)", true);
        pr.drawCircle(sx, ry, 10, "#FFD84D", false);
      }
    }

    // 3. Draw Grapple Laser Tether
    if (this.attachedAnchor) {
      const ax = this.attachedAnchor.x - this.cameraX;
      const ay = this.attachedAnchor.y;
      const px = this.playerPos.x - this.cameraX;
      const py = this.playerPos.y;

      pr.drawLine(ax, ay, px, py, "#00F0FF", 3);
      pr.drawLine(ax, ay, px, py, "#FFFFFF", 1);
    }

    // 4. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 5. Draw Cyber Grapple Ninja
    const px = this.playerPos.x - this.cameraX;
    const py = this.playerPos.y;
    pr.drawPixelBlock(px - 10, py - 14, 20, "#00F0FF", "#E0F2FE", "#0284C7");
    pr.drawCircle(px, py - 18, 6, "#FFFFFF", true);
    // Glowing Scarf
    pr.drawLine(px - 8, py - 14, px - 22, py - 20, "#F43F5E", 3);

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`DIST: ${Math.floor(this.distance / 10)}m`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`ROPE SWING • LVL ${this.getLevel()}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("FALLEN INTO THE ABYSS — GAME OVER", w / 2, h / 2 - 10, { size: 18, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO SWING AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
