import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

interface MagnetPole {
  id: number;
  pos: Vector2;
  polarity: number; // 1 = positive (Red/Amber), -1 = negative (Cyan/Blue)
  radius: number;
  pulseTimer: number;
  spinAngle: number;
}

interface FluxParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export class MagnetRunGame implements GameInstance {
  private ctx!: GameContext;

  private shipPos: Vector2 = new Vector2(300, 560);
  private shipVel: Vector2 = new Vector2(0, 0);
  private playerPolarity: number = 1; // 1 = positive (+), -1 = negative (-)

  private poles: MagnetPole[] = [];
  private fluxParticles: FluxParticle[] = [];

  private score: number = 0;
  private level: number = 1;
  private polesPassed: number = 0;
  private comboCount: number = 0;

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  private time: number = 0;
  private polaritySwitchFlash: number = 0;
  private screenShake: number = 0;

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
        this.togglePolarity();
      }
    };

    canvas.addEventListener("pointerdown", this.boundPointerDown);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.shipPos = new Vector2(300, 560);
    this.shipVel = new Vector2(0, 0);
    this.playerPolarity = 1;
    this.score = 0;
    this.level = 1;
    this.polesPassed = 0;
    this.comboCount = 0;

    this.gameOver = false;
    this.isPaused = false;
    this.time = 0;
    this.polaritySwitchFlash = 0;
    this.screenShake = 0;

    this.poles = [];
    this.fluxParticles = [];

    this.spawnPoles();
  }

  private spawnPoles(): void {
    this.poles = [];
    const count = 5;
    for (let i = 0; i < count; i++) {
      this.poles.push({
        id: Math.random(),
        pos: new Vector2(90 + Math.random() * 420, 70 + i * 120),
        polarity: Math.random() < 0.5 ? 1 : -1,
        radius: 26,
        pulseTimer: Math.random() * Math.PI * 2,
        spinAngle: Math.random() * Math.PI * 2,
      });
    }
  }

  public togglePolarity(): void {
    if (this.gameOver || this.isPaused) return;

    this.playerPolarity *= -1;
    this.polaritySwitchFlash = 0.3;
    this.screenShake = 0.25;
    this.ctx.audio?.playRotate?.();

    const pCol = this.playerPolarity > 0 ? "#EF4444" : "#00F0FF";
    globalParticles.emitBurst(this.shipPos.x, this.shipPos.y, 24, [pCol, "#FFFFFF"], 80, 240);
    globalParticles.emitText(
      this.playerPolarity > 0 ? "⚡ POSITIVE (+)" : "❄️ NEGATIVE (−)",
      this.shipPos.x,
      this.shipPos.y - 28,
      pCol,
      14
    );
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.time += dt;
    if (this.polaritySwitchFlash > 0) this.polaritySwitchFlash -= dt * 2;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // Steering Thrusters
    const steerForce = 580;
    if (this.moveLeft) this.shipVel.x -= steerForce * dt;
    if (this.moveRight) this.shipVel.x += steerForce * dt;

    // --- High-Power Tangible Magnetic Force System ---
    const magneticRange = 360; // Wide magnetic influence field

    for (const p of this.poles) {
      p.pulseTimer += dt * 3.5;
      p.spinAngle += (p.polarity > 0 ? 2.5 : -2.5) * dt;

      const dx = p.pos.x - this.shipPos.x;
      const dy = p.pos.y - this.shipPos.y;
      const dist = Math.max(25, Math.hypot(dx, dy));

      if (dist < magneticRange) {
        // Opposites attract (+ / - -> interaction = 1), Identical repel (+ / + or - / - -> interaction = -1)
        const isAttracting = this.playerPolarity !== p.polarity;
        const normDist = dist / magneticRange;
        const fieldStrength = (1 - normDist) * (1 - normDist); // Smooth quadratic falloff

        // Strong, high-impact force
        if (isAttracting) {
          // Intense magnetic gravitational attraction pull!
          const pullForce = 2200 * (fieldStrength + 0.25);
          this.shipVel.x += (dx / dist) * pullForce * dt;
          this.shipVel.y += (dy / dist) * pullForce * dt;

          // Slingshot orbital momentum injection
          const tangentX = -dy / dist;
          const tangentY = dx / dist;
          this.shipVel.x += tangentX * 350 * fieldStrength * dt;
          this.shipVel.y += tangentY * 350 * fieldStrength * dt;

          // Suction flux particles
          if (Math.random() < 0.4) {
            this.fluxParticles.push({
              x: this.shipPos.x + (dx * Math.random()),
              y: this.shipPos.y + (dy * Math.random()),
              vx: (dx / dist) * 220,
              vy: (dy / dist) * 220,
              life: 0.25,
              maxLife: 0.25,
              color: "#34D399",
            });
          }
        } else {
          // Powerful electromagnetic repulsion blast!
          const repelForce = 1850 * (fieldStrength + 0.35);
          this.shipVel.x -= (dx / dist) * repelForce * dt;
          this.shipVel.y -= (dy / dist) * repelForce * dt;

          // Repulsion sparks
          if (Math.random() < 0.35) {
            this.fluxParticles.push({
              x: this.shipPos.x + (dx * 0.4),
              y: this.shipPos.y + (dy * 0.4),
              vx: -(dx / dist) * 180 + (Math.random() - 0.5) * 60,
              vy: -(dy / dist) * 180 + (Math.random() - 0.5) * 60,
              life: 0.22,
              maxLife: 0.22,
              color: "#EF4444",
            });
          }
        }
      }

      // Crash into Pole Core
      if (dist < p.radius + 12) {
        this.gameOver = true;
        this.screenShake = 0.8;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(this.shipPos.x, this.shipPos.y, 45, ["#EF4444", "#F59E0B", "#FFFFFF"], 120, 360);
        return;
      }
    }

    // Natural Aerodynamic & Field Drag (Ensures smooth, controllable flight)
    this.shipVel.x *= 0.94;
    this.shipVel.y *= 0.94;

    this.shipPos.x += this.shipVel.x * dt;
    this.shipPos.y += this.shipVel.y * dt;

    // Arena Boundaries
    this.shipPos.x = Math.max(30, Math.min(570, this.shipPos.x));
    this.shipPos.y = Math.max(90, Math.min(630, this.shipPos.y));

    // Scroll Poles Downward
    const scrollSpeed = 140 + this.level * 22;
    for (const p of this.poles) {
      p.pos.y += scrollSpeed * dt;

      // Passed Pole Safely
      if (p.pos.y > 670) {
        p.pos.y = -30 - Math.random() * 40;
        p.pos.x = 80 + Math.random() * 440;
        p.polarity = Math.random() < 0.5 ? 1 : -1;

        this.score += 200;
        this.polesPassed++;
        this.comboCount++;
        this.ctx.audio?.playMove?.();

        globalParticles.emitText("+200", p.pos.x, 620, "#34D399", 12);

        // Level Up Progression
        if (this.polesPassed % 8 === 0) {
          this.level++;
          this.screenShake = 0.4;
          this.ctx.audio?.playPowerUp?.();
          globalParticles.emitText(`LEVEL ${this.level} FLUX SURGE!`, 300, 300, "#FDE047", 20);
        }
      }
    }

    // Update Particles
    for (let i = this.fluxParticles.length - 1; i >= 0; i--) {
      const pt = this.fluxParticles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.fluxParticles.splice(i, 1);
    }

    this.score += Math.round(dt * 30);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (
      (action === "ACTION_PRIMARY" ||
        action === "MOVE_UP" ||
        action === "CONFIRM") &&
      isPressed
    ) {
      this.togglePolarity();
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
  public getLevel(): number { return this.level; }

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

    // 1. Cyber Electromagnetic Nebula Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#08061C");
      bgGrad.addColorStop(0.5, "#0E0C28");
      bgGrad.addColorStop(1, "#050414");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#08061C");
    }

    // Holographic Magnetic Grid Matrix
    pr.drawGrid(8, 10, 60, "rgba(99, 102, 241, 0.05)", 0, (this.time * 80) % 60);

    // Glowing Arena Rails
    pr.drawRect(14, 56, w - 28, h - 72, "rgba(99, 102, 241, 0.2)", false);
    pr.drawRect(16, 58, w - 32, h - 76, "rgba(0, 240, 255, 0.1)", false);

    // 2. Real-Time Dynamic Magnetic Force Vortex Beams
    for (const p of this.poles) {
      const dx = p.pos.x - this.shipPos.x;
      const dy = p.pos.y - this.shipPos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 360) {
        const isAttracting = this.playerPolarity !== p.polarity;
        const lineAlpha = (1 - dist / 360);

        if (ctx2d) {
          ctx2d.save();
          if (isAttracting) {
            // Intense Glowing Suction Vortex Beam (Opposites Attract)
            ctx2d.strokeStyle = `rgba(52, 211, 153, ${lineAlpha * 0.7})`;
            ctx2d.lineWidth = 3.5 * lineAlpha + 1;
            ctx2d.beginPath();
            ctx2d.moveTo(this.shipPos.x, this.shipPos.y);
            ctx2d.lineTo(p.pos.x, p.pos.y);
            ctx2d.stroke();

            // Inner Core Light Beam
            ctx2d.strokeStyle = `rgba(255, 255, 255, ${lineAlpha * 0.9})`;
            ctx2d.lineWidth = 1.5;
            ctx2d.beginPath();
            ctx2d.moveTo(this.shipPos.x, this.shipPos.y);
            ctx2d.lineTo(p.pos.x, p.pos.y);
            ctx2d.stroke();
          } else {
            // Repulsion Arcs (Like Repels)
            ctx2d.strokeStyle = `rgba(239, 68, 68, ${lineAlpha * 0.6})`;
            ctx2d.lineWidth = 2.5;
            ctx2d.setLineDash([6, 6]);
            ctx2d.beginPath();
            ctx2d.moveTo(this.shipPos.x, this.shipPos.y);
            const midX = (this.shipPos.x + p.pos.x) / 2 + 30;
            const midY = (this.shipPos.y + p.pos.y) / 2;
            ctx2d.quadraticCurveTo(midX, midY, p.pos.x, p.pos.y);
            ctx2d.stroke();
          }
          ctx2d.restore();
        }
      }
    }

    // 3. Magnetic Reactor Poles
    for (const p of this.poles) {
      const isPos = p.polarity > 0;
      const primaryCol = isPos ? "#EF4444" : "#00F0FF";
      const glowCol = isPos ? "rgba(239, 68, 68, 0.28)" : "rgba(0, 240, 255, 0.28)";
      const pulse = Math.sin(p.pulseTimer) * 4;

      // Outer Electromagnetic Aura Dome
      pr.drawCircle(p.pos.x, p.pos.y, p.radius + 12 + pulse, glowCol, true);

      // Rotating Containment Ring Spikes
      pr.save();
      pr.translate(p.pos.x, p.pos.y);
      pr.rotate(p.spinAngle);
      for (let a = 0; a < 6; a++) {
        const ang = (a * Math.PI * 2) / 6;
        const rx = Math.cos(ang) * (p.radius + 6);
        const ry = Math.sin(ang) * (p.radius + 6);
        pr.drawCircle(rx, ry, 3.5, primaryCol, true);
      }
      pr.restore();

      // Core Reactor Sphere
      pr.drawCircle(p.pos.x, p.pos.y, p.radius, "#0F172A", true);
      pr.drawCircle(p.pos.x, p.pos.y, p.radius - 2, primaryCol, false);
      pr.drawCircle(p.pos.x, p.pos.y, p.radius - 5, isPos ? "#7F1D1D" : "#0C4A6E", true);

      // Illuminated Center Symbol
      pr.drawText(isPos ? "+" : "−", p.pos.x, p.pos.y + 7, {
        size: 22,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    }

    // 4. Flux Particles
    for (const pt of this.fluxParticles) {
      const alpha = pt.life / pt.maxLife;
      pr.drawCircle(pt.x, pt.y, 2.5 * alpha, pt.color, true);
    }

    // 5. High-Detail Polarity Spaceship
    const pCol = this.playerPolarity > 0 ? "#EF4444" : "#00F0FF";

    // Polarity Aura Dome
    const shipAuraPulse = Math.sin(this.time * 10) * 3;
    pr.drawCircle(
      this.shipPos.x,
      this.shipPos.y,
      22 + shipAuraPulse,
      this.playerPolarity > 0 ? "rgba(239, 68, 68, 0.25)" : "rgba(0, 240, 255, 0.25)",
      true
    );
    pr.drawCircle(this.shipPos.x, this.shipPos.y, 22 + shipAuraPulse, pCol, false);

    // Futuristic Spaceship Sprite
    drawSpaceshipSprite(
      pr,
      this.shipPos.x,
      this.shipPos.y,
      30,
      0,
      pCol
    );

    // Active Polarity Symbol Indicator Floating Above Ship
    pr.drawCircle(this.shipPos.x, this.shipPos.y - 22, 9, "#0F172A", true);
    pr.drawCircle(this.shipPos.x, this.shipPos.y - 22, 9, pCol, false);
    pr.drawText(this.playerPolarity > 0 ? "+" : "−", this.shipPos.x, this.shipPos.y - 17, {
      size: 13,
      color: pCol,
      align: "center",
      font: "monospace",
    });

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 6. Polarity Shift Flash Screen Tint
    if (this.polaritySwitchFlash > 0) {
      pr.drawRect(0, 0, w, h, `rgba(255, 255, 255, ${this.polaritySwitchFlash * 0.5})`, true);
    }

    // 7. Top Cyber HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, pCol, false);

    pr.drawText(`SCORE: ${this.score}`, 24, 28, { size: 14, color: "#FFD84D", font: "monospace" });
    pr.drawText(`LEVEL ${this.level} • PASSED: ${this.polesPassed}`, w / 2, 28, { size: 12, color: "#38BDF8", align: "center", font: "monospace" });
    pr.drawText(`POLARITY: [ ${this.playerPolarity > 0 ? "+ RED" : "− CYAN"} ]`, w - 24, 28, {
      size: 12,
      color: pCol,
      align: "right",
      font: "monospace",
    });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 320, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[CLICK / SPACE: TOGGLE POLARITY  •  A/D: STEER  •  R: RETRY]", 176, h - 20, {
      size: 7.5,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("MAGNETIC CRASH — RUN TERMINATED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
