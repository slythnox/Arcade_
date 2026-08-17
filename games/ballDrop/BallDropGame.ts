import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface FloorLayer {
  id: number;
  y: number;
  gapX: number;
  gapWidth: number;
  hasGem: boolean;
  themeColor: string;
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

interface BiomeTheme {
  name: string;
  minDepth: number;
  bgColor: string;
  bgGradTop: string;
  bgGradBot: string;
  platformColor: string;
  accentColor: string;
  glowColor: string;
}

const BIOMES: BiomeTheme[] = [
  {
    name: "CYBER NEON SHAFT",
    minDepth: 0,
    bgColor: "#040714",
    bgGradTop: "#081028",
    bgGradBot: "#040714",
    platformColor: "#1E293B",
    accentColor: "#00F0FF",
    glowColor: "rgba(0, 240, 255, 0.4)",
  },
  {
    name: "MOLTEN CORE DESCENT",
    minDepth: 500,
    bgColor: "#140404",
    bgGradTop: "#280A0A",
    bgGradBot: "#140404",
    platformColor: "#2D1212",
    accentColor: "#F97316",
    glowColor: "rgba(249, 115, 22, 0.4)",
  },
  {
    name: "BIOLUMINESCENT ABYSS",
    minDepth: 1000,
    bgColor: "#04140C",
    bgGradTop: "#062416",
    bgGradBot: "#04140C",
    platformColor: "#0F291E",
    accentColor: "#10B981",
    glowColor: "rgba(16, 185, 129, 0.4)",
  },
  {
    name: "COSMIC VOID DROP",
    minDepth: 1500,
    bgColor: "#0C0414",
    bgGradTop: "#1E0A30",
    bgGradBot: "#0C0414",
    platformColor: "#241236",
    accentColor: "#C084FC",
    glowColor: "rgba(192, 132, 252, 0.4)",
  },
];

export class BallDropGame implements GameInstance {
  private ctx!: GameContext;

  // Ball State
  private ballX: number = 300;
  private ballY: number = 220;
  private ballVx: number = 0;
  private ballVy: number = 0;
  private readonly ballRadius: number = 12;

  // Smooth, Balanced Scrolling Speed (Comfortable reaction time)
  private scrollSpeed: number = 115;
  private floors: FloorLayer[] = [];
  private particles: Particle[] = [];

  private score: number = 0;
  private depth: number = 0;
  private combo: number = 1;
  private currentBiomeIdx: number = 0;

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private screenShake: number = 0;

  // Ceiling hazard line
  private readonly ceilingSpikeY: number = 42;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.ballX = 300;
    this.ballY = 220;
    this.ballVx = 0;
    this.ballVy = 0;
    this.scrollSpeed = 115;
    this.score = 0;
    this.depth = 0;
    this.combo = 1;
    this.currentBiomeIdx = 0;

    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.screenShake = 0;
    this.floors = [];
    this.particles = [];

    // Spawn initial comfortable platforms
    for (let i = 0; i < 7; i++) {
      this.spawnFloor(280 + i * 110);
    }
  }

  private getCurrentBiome(): BiomeTheme {
    const cycleDepth = this.depth % 2000;
    for (let i = BIOMES.length - 1; i >= 0; i--) {
      if (cycleDepth >= BIOMES[i].minDepth) {
        return BIOMES[i];
      }
    }
    return BIOMES[0];
  }

  private spawnFloor(y: number): void {
    const biome = this.getCurrentBiome();
    // Generous, fair gap width (115px to 135px) for enjoyable control
    const gapWidth = 115 + Math.floor(Math.random() * 20);
    const gapX = 40 + Math.random() * (520 - gapWidth);

    this.floors.push({
      id: Math.random(),
      y,
      gapX,
      gapWidth,
      hasGem: Math.random() > 0.4,
      themeColor: biome.accentColor,
    });
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // Gentle, fair speed progression (115 px/s up to max 175 px/s)
    this.scrollSpeed = Math.min(175, 115 + Math.floor(this.depth / 100) * 4);
    const scrollDelta = this.scrollSpeed * dt;

    this.depth += scrollDelta * 0.12;
    this.score += Math.round(scrollDelta * 0.15);

    // Update Biome
    const biome = this.getCurrentBiome();

    // Responsive Air-Control Steering
    const steerForce = 460;
    if (this.moveLeft) {
      this.ballVx = -steerForce;
    } else if (this.moveRight) {
      this.ballVx = steerForce;
    } else {
      this.ballVx *= 0.84; // Smooth inertia damping
    }

    // Gravity & Velocity
    this.ballVy += 980 * dt;
    this.ballX += this.ballVx * dt;
    this.ballY += this.ballVy * dt;

    // Arena Horizontal Bounds
    this.ballX = Math.max(32, Math.min(568, this.ballX));

    // Scroll Platforms Upward
    for (const f of this.floors) {
      f.y -= scrollDelta;
    }

    // Ball-to-Floor Collisions
    let onFloor = false;
    for (const f of this.floors) {
      const isInsideY =
        this.ballY + this.ballRadius >= f.y &&
        this.ballY - this.ballRadius <= f.y + 14 &&
        this.ballVy >= 0;

      if (isInsideY) {
        // Check if player is falling cleanly through the gap
        if (this.ballX >= f.gapX && this.ballX <= f.gapX + f.gapWidth) {
          // Fall through gap with combo bonus!
          this.combo++;
          const comboPts = 50 * this.combo;
          this.score += comboPts;

          globalParticles.emitBurst(this.ballX, f.y, 4, [biome.accentColor, "#FFFFFF"], 20, 60);
          if (this.combo > 2) {
            globalParticles.emitText(`COMBO x${this.combo}! (+${comboPts})`, this.ballX, f.y - 16, biome.accentColor, 12);
          }
        } else {
          // Land comfortably on the platform
          this.ballY = f.y - this.ballRadius;
          this.ballVy = 0;
          this.combo = 1;
          onFloor = true;

          // Rolling Sparks
          if (Math.abs(this.ballVx) > 40 && Math.random() < 0.3) {
            this.particles.push({
              x: this.ballX,
              y: this.ballY + this.ballRadius,
              vx: -this.ballVx * 0.3 + (Math.random() - 0.5) * 40,
              vy: -20 - Math.random() * 30,
              life: 0.25,
              maxLife: 0.25,
              color: biome.accentColor,
            });
          }
          break;
        }
      }

      // Collectible Glowing Diamond in gap
      if (
        f.hasGem &&
        Math.abs(f.y - this.ballY) < 24 &&
        Math.abs(f.gapX + f.gapWidth / 2 - this.ballX) < 32
      ) {
        f.hasGem = false;
        this.score += 300;
        this.ctx.audio?.playCoin?.();
        globalParticles.emitBurst(this.ballX, this.ballY, 16, ["#FEF08A", "#F59E0B", "#FFFFFF"], 50, 160);
        globalParticles.emitText("+300 GEM!", this.ballX, this.ballY - 18, "#FEF08A", 13);
      }
    }

    // Ball rises with floor when standing
    if (onFloor) {
      this.ballY -= scrollDelta;
    }

    // Recycle Top Platforms & Spawn at Bottom
    this.floors = this.floors.filter((f) => f.y > -30);
    while (this.floors.length < 8) {
      const lowestY = Math.max(...this.floors.map((f) => f.y));
      this.spawnFloor(lowestY + 110);
    }

    // Particles Update
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    // Ceiling Crush Check (Fair Buffer)
    if (this.ballY - this.ballRadius <= this.ceilingSpikeY + 4) {
      this.gameOver = true;
      this.screenShake = 0.8;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio?.playExplosion?.();
      globalParticles.emitBurst(this.ballX, this.ceilingSpikeY, 35, ["#EF4444", "#F59E0B", "#FFFFFF"], 100, 300);
    } else if (this.ballY >= 680) {
      // Bottom Bounce Guard
      this.ballY = 680;
      this.ballVy = -260;
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
  public getLevel(): number { return Math.floor(this.depth / 250) + 1; }

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

    const biome = this.getCurrentBiome();

    // 1. Dynamic Biome Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, biome.bgGradTop);
      bgGrad.addColorStop(1, biome.bgGradBot);
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear(biome.bgColor);
    }

    // Parallax Speed Shaft Grid
    pr.drawGrid(8, 10, 60, "rgba(255, 255, 255, 0.03)", 0, (this.animTime * this.scrollSpeed * 0.5) % 60);

    // Left & Right Shaft Border Rails
    pr.drawRect(0, 0, 20, h, "#0F172A", true);
    pr.drawRect(w - 20, 0, 20, h, "#0F172A", true);
    pr.drawLine(20, 0, 20, h, biome.accentColor, 2);
    pr.drawLine(w - 20, 0, w - 20, h, biome.accentColor, 2);

    // 2. Ceiling Hazard Laser Spikes
    const isNearCeiling = this.ballY < 130;
    const spikeColor = isNearCeiling && Math.sin(this.animTime * 16) > 0 ? "#FFFFFF" : "#EF4444";

    pr.drawRect(20, 0, w - 40, this.ceilingSpikeY, "rgba(239, 68, 68, 0.2)", true);
    for (let sx = 20; sx < w - 20; sx += 20) {
      pr.drawLine(sx, 0, sx + 10, this.ceilingSpikeY, spikeColor, 3);
      pr.drawLine(sx + 10, this.ceilingSpikeY, sx + 20, 0, spikeColor, 3);
    }
    pr.drawLine(20, this.ceilingSpikeY, w - 20, this.ceilingSpikeY, "#EF4444", 2);

    // 3. Multi-Layer Platforms with Glowing Edges & Gap Arrows
    for (const f of this.floors) {
      // Left Platform Bar
      if (f.gapX > 20) {
        const lw = f.gapX - 20;
        pr.drawRect(20, f.y, lw, 14, biome.platformColor, true);
        pr.drawRect(20, f.y, lw, 3, biome.accentColor, true);
        pr.drawRect(20, f.y + 11, lw, 3, "rgba(0, 0, 0, 0.4)", true);
      }

      // Right Platform Bar
      const rightX = f.gapX + f.gapWidth;
      if (rightX < w - 20) {
        const rw = w - 20 - rightX;
        pr.drawRect(rightX, f.y, rw, 14, biome.platformColor, true);
        pr.drawRect(rightX, f.y, rw, 3, biome.accentColor, true);
        pr.drawRect(rightX, f.y + 11, rw, 3, "rgba(0, 0, 0, 0.4)", true);
      }

      // Gap Guide Marker (Subtle pulsing indicator)
      const gx = f.gapX + f.gapWidth / 2;
      const gapAlpha = (Math.sin(this.animTime * 6 + f.id) + 1) * 0.15 + 0.1;
      pr.drawLine(f.gapX, f.y, f.gapX + f.gapWidth, f.y, `rgba(255, 255, 255, ${gapAlpha})`, 1);

      // Collectible Floating Diamond
      if (f.hasGem) {
        const gemPulse = Math.sin(this.animTime * 6 + f.id) * 3;
        pr.drawCircle(gx, f.y + 7, 9 + gemPulse, "rgba(254, 240, 138, 0.25)", true);
        // Diamond Shape
        if (ctx2d) {
          ctx2d.fillStyle = "#FEF08A";
          ctx2d.beginPath();
          ctx2d.moveTo(gx, f.y + 7 - 7);
          ctx2d.lineTo(gx + 6, f.y + 7);
          ctx2d.lineTo(gx, f.y + 7 + 7);
          ctx2d.lineTo(gx - 6, f.y + 7);
          ctx2d.closePath();
          ctx2d.fill();

          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.beginPath();
          ctx2d.moveTo(gx - 2, f.y + 7 - 4);
          ctx2d.lineTo(gx + 2, f.y + 7 - 4);
          ctx2d.lineTo(gx, f.y + 7);
          ctx2d.closePath();
          ctx2d.fill();
        }
      }
    }

    // 4. Spark & Smoke Particles
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      pr.drawCircle(p.x, p.y, 2.5 * alpha, p.color, true);
    }

    // 5. 3D Chrome Metallic Pinball
    const bx = this.ballX;
    const by = this.ballY;

    // Ball Ambient Glow
    pr.drawCircle(bx, by, this.ballRadius + 4, biome.glowColor, true);

    // Ball Outer Chrome Sphere
    pr.drawCircle(bx, by, this.ballRadius, "#0F172A", true);
    pr.drawCircle(bx, by, this.ballRadius - 1, biome.accentColor, true);

    // 3D Glass / Metallic Specular Highlights
    pr.drawCircle(bx - 3, by - 3, this.ballRadius * 0.55, "#FFFFFF", true);
    pr.drawCircle(bx - 4, by - 4, 3, "#FFFFFF", true);

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 6. Top Cyber HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, biome.accentColor, false);

    pr.drawText(`DEPTH: ${Math.floor(this.depth)}M`, 24, 28, { size: 14, color: "#FFD84D", font: "monospace" });
    pr.drawText(`${biome.name}`, w / 2, 28, { size: 11, color: biome.accentColor, align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 24, 28, { size: 13, color: "#34D399", align: "right", font: "monospace" });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 30, 280, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[← / → or A / D: STEER BALL  •  R: RETRY]", 156, h - 17, {
      size: 8,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("CRUSHED BY CEILING — DROP TERMINATED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO DROP AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
