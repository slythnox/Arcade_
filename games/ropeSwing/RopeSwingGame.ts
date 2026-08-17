import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawGravityRunner } from "../gravityFlip/gravityRunnerSprite";

interface AnchorPoint {
  id: number;
  x: number;
  y: number;
  hasRing: boolean;
  pulseTimer: number;
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

export class RopeSwingGame implements GameInstance {
  private ctx!: GameContext;

  // Player Kinematics
  private playerPos: Vector2 = new Vector2(100, 320);
  private playerVel: Vector2 = new Vector2(340, 0);
  private cameraX: number = 0;
  private swingAngle: number = 0;

  // Anchor & Tether Physics
  private anchors: AnchorPoint[] = [];
  private attachedAnchor: AnchorPoint | null = null;
  private ropeLength: number = 0;
  private tetherLaserAnim: number = 0;

  private particles: Particle[] = [];
  private score: number = 0;
  private distance: number = 0;
  private chainedSwings: number = 0;

  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private screenShake: number = 0;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerUp?: (e: MouseEvent | PointerEvent) => void;

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
        this.attachNearestRope();
      }
    };

    this.boundPointerUp = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        this.releaseRope();
      }
    };

    canvas.addEventListener("pointerdown", this.boundPointerDown);
    canvas.addEventListener("pointerup", this.boundPointerUp);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(100, 320);
    this.playerVel = new Vector2(360, 0);
    this.cameraX = 0;
    this.swingAngle = 0;
    this.score = 0;
    this.distance = 0;
    this.chainedSwings = 0;
    this.attachedAnchor = null;
    this.ropeLength = 0;

    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.screenShake = 0;
    this.anchors = [];
    this.particles = [];

    // Spawn starting anchors with smooth pacing
    for (let i = 0; i < 9; i++) {
      this.anchors.push({
        id: Math.random(),
        x: 180 + i * 220,
        y: 130 + Math.sin(i * 0.8) * 50,
        hasRing: i > 0 && Math.random() > 0.35,
        pulseTimer: Math.random() * Math.PI * 2,
      });
    }
  }

  private attachNearestRope(): void {
    if (this.gameOver || this.isPaused || this.attachedAnchor) return;

    // Find nearest anchor ahead of the player within grapple range
    let bestAnchor: AnchorPoint | null = null;
    let minDist = 380;

    for (const a of this.anchors) {
      if (a.x >= this.playerPos.x - 50) {
        const d = Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y);
        if (d < minDist) {
          minDist = d;
          bestAnchor = a;
        }
      }
    }

    if (bestAnchor) {
      this.attachedAnchor = bestAnchor;
      this.ropeLength = Math.max(90, Math.hypot(bestAnchor.x - this.playerPos.x, bestAnchor.y - this.playerPos.y));
      this.chainedSwings++;

      // Powerful Momentum Transfer Boost
      const currentSpeed = this.playerVel.magnitude();
      const boostedSpeed = Math.max(380, currentSpeed * 1.12);
      const angle = Math.atan2(this.playerPos.y - bestAnchor.y, this.playerPos.x - bestAnchor.x);

      // Set tangent velocity in the forward direction
      const tangentAngle = angle + Math.PI / 2;
      this.playerVel = new Vector2(Math.cos(tangentAngle) * boostedSpeed, Math.sin(tangentAngle) * boostedSpeed);

      this.ctx.audio?.playRotate?.();
      globalParticles.emitBurst(bestAnchor.x - this.cameraX, bestAnchor.y, 14, ["#00F0FF", "#38BDF8", "#FFFFFF"], 60, 180);
      globalParticles.emitText(`SWING x${this.chainedSwings}!`, this.playerPos.x - this.cameraX, this.playerPos.y - 24, "#00F0FF", 13);
    }
  }

  private releaseRope(): void {
    if (!this.attachedAnchor || this.gameOver || this.isPaused) return;

    const ax = this.attachedAnchor.x;
    const ay = this.attachedAnchor.y;
    const angle = Math.atan2(this.playerPos.y - ay, this.playerPos.x - ax);

    // Slingshot forward release impulse (More powerful fling!)
    const forwardImpulse = 140;
    const liftImpulse = -80;
    this.playerVel.x += Math.max(80, forwardImpulse);
    if (this.playerVel.y > 0 && angle > Math.PI / 2) {
      this.playerVel.y += liftImpulse; // Upward slingshot lift
    }

    this.attachedAnchor = null;
    this.screenShake = 0.2;
    this.ctx.audio?.playLaser?.();

    const px = this.playerPos.x - this.cameraX;
    globalParticles.emitBurst(px, this.playerPos.y, 12, ["#FEF08A", "#00F0FF", "#FFFFFF"], 50, 150);
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    this.tetherLaserAnim += dt * 8;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // --- Pendulum Swing Physics ---
    if (this.attachedAnchor) {
      const anchor = this.attachedAnchor;
      const toAnchor = new Vector2(anchor.x - this.playerPos.x, anchor.y - this.playerPos.y);
      const currentDist = toAnchor.magnitude();

      // Strong Gravity for fast, energetic pendulum swing
      this.playerVel.y += 1250 * dt;

      // Tether Tension Constraint & Angular Acceleration
      if (currentDist >= this.ropeLength - 2) {
        const norm = toAnchor.normalize();
        const radialVel = this.playerVel.dot(norm);

        // Remove outward velocity
        if (radialVel < 0) {
          this.playerVel = this.playerVel.sub(norm.scale(radialVel));
        }

        // Apply extra tangential slingshot acceleration so pendulum never dies down!
        const tangent = new Vector2(-norm.y, norm.x);
        const tangentialSpeed = this.playerVel.dot(tangent);
        if (tangentialSpeed > 0) {
          this.playerVel = this.playerVel.add(tangent.scale(420 * dt)); // Constant forward swing pump!
        }

        // Clamp distance to rope length
        this.playerPos = new Vector2(
          anchor.x - norm.x * this.ropeLength,
          anchor.y - norm.y * this.ropeLength
        );
      }

      // Air trail particles while swinging
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.playerPos.x - this.cameraX,
          y: this.playerPos.y,
          vx: -this.playerVel.x * 0.2 + (Math.random() - 0.5) * 30,
          vy: -this.playerVel.y * 0.2 + (Math.random() - 0.5) * 30,
          life: 0.35,
          maxLife: 0.35,
          color: "#00F0FF",
        });
      }
    } else {
      // Free Flight Aerial Gravity
      this.playerVel.y += 920 * dt;
      // Air resistance damping on Y only
      this.playerVel.x = Math.max(260, this.playerVel.x * 0.998);

      if (Math.random() < 0.3) {
        this.particles.push({
          x: this.playerPos.x - this.cameraX,
          y: this.playerPos.y,
          vx: -this.playerVel.x * 0.25,
          vy: (Math.random() - 0.5) * 20,
          life: 0.3,
          maxLife: 0.3,
          color: "#FEF08A",
        });
      }
    }

    // Integrate Position
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Smooth Dynamic Camera Tracking
    const targetCamX = this.playerPos.x - 160;
    this.cameraX += (targetCamX - this.cameraX) * 0.12;

    this.distance = Math.max(this.distance, this.playerPos.x);
    this.score = Math.floor(this.distance / 8);

    // Infinite Procedural Anchor Generation (Smooth Wave Arc)
    const maxAnchorX = Math.max(...this.anchors.map((a) => a.x));
    if (maxAnchorX < this.cameraX + 900) {
      const idx = this.anchors.length;
      const nextX = maxAnchorX + 210 + Math.random() * 50;
      const nextY = 125 + Math.sin(idx * 0.75) * 55;
      this.anchors.push({
        id: Math.random(),
        x: nextX,
        y: nextY,
        hasRing: Math.random() > 0.3,
        pulseTimer: Math.random() * Math.PI * 2,
      });
    }

    // Check Gold Energy Rings Collectibles
    for (const a of this.anchors) {
      if (a.hasRing) {
        const ringX = a.x;
        const ringY = a.y + 115;
        if (Math.hypot(ringX - this.playerPos.x, ringY - this.playerPos.y) < 36) {
          a.hasRing = false;
          this.score += 500;
          this.playerVel.x += 60; // Extra speed boost!
          this.ctx.audio?.playCoin?.();
          globalParticles.emitBurst(ringX - this.cameraX, ringY, 16, ["#FEF08A", "#F59E0B", "#FFFFFF"], 60, 180);
          globalParticles.emitText("+500 RING BOOST!", ringX - this.cameraX, ringY - 20, "#FEF08A", 13);
        }
      }
    }

    // Recycle Past Anchors
    this.anchors = this.anchors.filter((a) => a.x > this.cameraX - 120);

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Abyss Fall Death Check
    if (this.playerPos.y > 690) {
      this.gameOver = true;
      this.screenShake = 0.8;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio?.playExplosion?.();
      globalParticles.emitBurst(this.playerPos.x - this.cameraX, 680, 40, ["#EF4444", "#F59E0B", "#FFFFFF"], 120, 360);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY" || action === "MOVE_UP" || action === "CONFIRM") {
      if (isPressed) {
        this.attachNearestRope();
      } else {
        this.releaseRope();
      }
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerDown || this.boundPointerUp) {
      const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
      if (this.boundPointerDown) canvas?.removeEventListener("pointerdown", this.boundPointerDown);
      if (this.boundPointerUp) canvas?.removeEventListener("pointerup", this.boundPointerUp);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return Math.floor(this.distance / 1500) + 1; }

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

    // 1. Ethereal Cyber Cityscape Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#08061C");
      bgGrad.addColorStop(0.55, "#150E34");
      bgGrad.addColorStop(1, "#0A0520");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#08061C");
    }

    // Parallax Distant Neon Skyscraper Skyline
    for (let i = 0; i < 20; i++) {
      const bx = ((i * 75 - this.cameraX * 0.18) % (w + 150)) - 75;
      const bh = 190 + (i * 37) % 150;
      pr.drawRect(bx, h - bh, 60, bh, "#0F172A", true);
      pr.drawRect(bx, h - bh, 60, 2, "rgba(56, 189, 248, 0.3)", true);

      // Lit Windows
      for (let wy = h - bh + 14; wy < h - 20; wy += 22) {
        if ((i + wy) % 3 === 0) {
          pr.drawRect(bx + 8, wy, 8, 8, "rgba(254, 240, 138, 0.2)", true);
          pr.drawRect(bx + 26, wy, 8, 8, "rgba(0, 240, 255, 0.2)", true);
          pr.drawRect(bx + 44, wy, 8, 8, "rgba(254, 240, 138, 0.2)", true);
        }
      }
    }

    // Glowing Cyber Mist at Abyss Floor
    pr.drawRect(0, h - 70, w, 70, "rgba(239, 68, 68, 0.15)", true);
    pr.drawLine(0, h - 70, w, h - 70, "rgba(239, 68, 68, 0.4)", 2);

    // 2. Magnetic Grapple Anchors & Energy Rings
    for (const a of this.anchors) {
      const sx = a.x - this.cameraX;
      if (sx < -60 || sx > w + 60) continue;

      const isCurrent = this.attachedAnchor === a;
      const pulse = Math.sin(this.animTime * 6 + a.pulseTimer) * 3;

      // Outer Magnetic Aura
      pr.drawCircle(sx, a.y, 18 + (isCurrent ? 6 : pulse), isCurrent ? "rgba(0, 240, 255, 0.35)" : "rgba(244, 114, 182, 0.2)", true);
      pr.drawCircle(sx, a.y, 12, isCurrent ? "#00F0FF" : "#EC4899", true);
      pr.drawCircle(sx, a.y, 6, "#FFFFFF", true);

      // Energy Ring Collectibles
      if (a.hasRing) {
        const ry = a.y + 115;
        const ringPulse = Math.sin(this.animTime * 8 + a.id) * 3;
        pr.drawCircle(sx, ry, 16 + ringPulse, "rgba(254, 240, 138, 0.25)", true);
        pr.drawCircle(sx, ry, 12, "#FEF08A", false);
        pr.drawCircle(sx, ry, 10, "#F59E0B", false);
        pr.drawCircle(sx, ry, 4, "#FFFFFF", true);
      }
    }

    // 3. Shimmering Laser Tether Rope
    if (this.attachedAnchor) {
      const ax = this.attachedAnchor.x - this.cameraX;
      const ay = this.attachedAnchor.y;
      const px = this.playerPos.x - this.cameraX;
      const py = this.playerPos.y;

      // Multi-layer glowing laser beam
      pr.drawLine(ax, ay, px, py, "rgba(0, 240, 255, 0.3)", 6);
      pr.drawLine(ax, ay, px, py, "#00F0FF", 3);
      pr.drawLine(ax, ay, px, py, "#FFFFFF", 1.5);

      // Animated energy pulse nodes sliding along rope
      const pulseProgress = (this.tetherLaserAnim % 1.0);
      const nx = ax + (px - ax) * pulseProgress;
      const ny = ay + (py - ay) * pulseProgress;
      pr.drawCircle(nx, ny, 4, "#FFFFFF", true);
    }

    // 4. Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      pr.drawCircle(p.x, p.y, 3 * alpha, p.color, true);
    }

    // 5. Render Pixel Runner Character (Matching Gravity Flip Reference)
    const px = this.playerPos.x - this.cameraX;
    const py = this.playerPos.y;

    drawGravityRunner(
      pr,
      px,
      py,
      1,
      this.animTime,
      false, // Airborne swinging pose
      2.4
    );

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 6. Top Cyber HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, "#00F0FF", false);

    pr.drawText(`DISTANCE: ${Math.floor(this.distance / 10)}M`, 24, 28, { size: 14, color: "#FFD84D", font: "monospace" });
    pr.drawText(`SWINGS: ${this.chainedSwings}`, w / 2, 28, { size: 12, color: "#00F0FF", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 24, 28, { size: 13, color: "#34D399", align: "right", font: "monospace" });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 320, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[HOLD SPACE / CLICK: SWING  •  RELEASE: FLING  •  R: RETRY]", 176, h - 20, {
      size: 7.5,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("FALLEN INTO THE ABYSS — RUN TERMINATED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO SWING AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
