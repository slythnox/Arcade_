import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

interface CaveSegment {
  x: number;
  topY: number;
  bottomY: number;
}

interface Crystal {
  id: number;
  x: number;
  y: number;
  collected: boolean;
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

interface CaveBiome {
  name: string;
  minDist: number;
  bgGradTop: string;
  bgGradMid: string;
  bgGradBot: string;
  rockColor: string;
  lineColor: string;
  crystalColor: string;
}

const CAVE_BIOMES: CaveBiome[] = [
  {
    name: "BIOLUMINESCENT CYAN ABYSS",
    minDist: 0,
    bgGradTop: "#050614",
    bgGradMid: "#0B0F2A",
    bgGradBot: "#040512",
    rockColor: "#0F172A",
    lineColor: "#00F0FF",
    crystalColor: "#00F0FF",
  },
  {
    name: "MOLTEN MAGMA CHASM",
    minDist: 1500,
    bgGradTop: "#1A0606",
    bgGradMid: "#2D0D0D",
    bgGradBot: "#140404",
    rockColor: "#261313",
    lineColor: "#EF4444",
    crystalColor: "#F59E0B",
  },
  {
    name: "TOXIC EMERALD GROTTO",
    minDist: 3000,
    bgGradTop: "#04140A",
    bgGradMid: "#0A2818",
    bgGradBot: "#031008",
    rockColor: "#0F2618",
    lineColor: "#10B981",
    crystalColor: "#34D399",
  },
  {
    name: "COSMIC CRYSTAL VOID",
    minDist: 4500,
    bgGradTop: "#120520",
    bgGradMid: "#220B38",
    bgGradBot: "#0D0417",
    rockColor: "#1E1130",
    lineColor: "#C084FC",
    crystalColor: "#E879F9",
  },
];

export class CaveEscapeGame implements GameInstance {
  private ctx!: GameContext;

  private shipPos: Vector2 = new Vector2(140, 350);
  private shipVy: number = 0;
  private isThrusting: boolean = false;

  private caveSegments: CaveSegment[] = [];
  private crystals: Crystal[] = [];
  private particles: Particle[] = [];
  private readonly segmentWidth: number = 18;

  private scrollSpeed: number = 280;
  private distance: number = 0;
  private score: number = 0;
  private level: number = 1;
  private lastBiomeIndex: number = 0;

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
    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        this.isThrusting = true;
      }
    };

    this.boundPointerUp = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        this.isThrusting = false;
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
      window.addEventListener("pointerup", this.boundPointerUp);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.shipPos = new Vector2(140, 350);
    this.shipVy = 0;
    this.isThrusting = false;
    this.scrollSpeed = 280;
    this.distance = 0;
    this.score = 0;
    this.level = 1;
    this.lastBiomeIndex = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.screenShake = 0;

    this.caveSegments = [];
    this.crystals = [];
    this.particles = [];

    const curTop = 110;
    const curBottom = 590;
    for (let x = 0; x < 680; x += this.segmentWidth) {
      this.caveSegments.push({
        x,
        topY: curTop,
        bottomY: curBottom,
      });
    }
  }

  private getCurrentBiome(): CaveBiome {
    const cycleDist = (this.distance * 0.1) % 6000;
    for (let i = CAVE_BIOMES.length - 1; i >= 0; i--) {
      if (cycleDist >= CAVE_BIOMES[i].minDist) {
        return CAVE_BIOMES[i];
      }
    }
    return CAVE_BIOMES[0];
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // Thruster flight physics
    if (this.isThrusting) {
      this.shipVy -= 960 * dt;
      // Plasma exhaust particles
      if (Math.random() < 0.8) {
        this.particles.push({
          x: this.shipPos.x - 16,
          y: this.shipPos.y + (Math.random() - 0.5) * 6,
          vx: -180 - Math.random() * 80,
          vy: (Math.random() - 0.5) * 40,
          life: 0.25,
          maxLife: 0.25,
          color: Math.random() < 0.5 ? "#00F0FF" : "#FEF08A",
        });
      }
    } else {
      this.shipVy += 820 * dt; // Smooth downward gravity
    }

    this.shipVy *= 0.975; // Aerodynamic drag
    this.shipPos.y += this.shipVy * dt;

    // Scroll cave horizontally in endless loop
    this.scrollSpeed = 280 + Math.min(200, (this.distance * 0.1) % 1500 * 0.1);
    const deltaX = this.scrollSpeed * dt;
    this.distance += deltaX;
    this.score += Math.floor(deltaX * 0.12);
    this.level = Math.floor(this.distance / 15000) + 1;

    // Biome Change Announcements
    const currentBiomeIdx = Math.floor(((this.distance * 0.1) % 6000) / 1500);
    if (currentBiomeIdx !== this.lastBiomeIndex) {
      this.lastBiomeIndex = currentBiomeIdx;
      const b = CAVE_BIOMES[currentBiomeIdx];
      this.screenShake = 0.4;
      this.ctx.audio?.playPowerUp?.();
      globalParticles.emitText(`⚡ ENTERING ${b.name}!`, 300, 300, b.lineColor, 18);
    }

    for (const seg of this.caveSegments) {
      seg.x -= deltaX;
    }

    // Scroll and collect crystals
    for (const c of this.crystals) {
      c.x -= deltaX;
      if (!c.collected && Math.hypot(c.x - this.shipPos.x, c.y - this.shipPos.y) < 28) {
        c.collected = true;
        this.score += 300;
        this.ctx.audio?.playCoin?.();
        globalParticles.emitBurst(c.x, c.y, 16, ["#00F0FF", "#FEF08A", "#FFFFFF"], 60, 180);
        globalParticles.emitText("+300", c.x, c.y - 16, "#00F0FF", 13);
      }
    }
    this.crystals = this.crystals.filter((c) => c.x > -40);

    // Continuous Endless Cave Generation
    while (this.caveSegments[0]?.x < -this.segmentWidth) {
      this.caveSegments.shift();
      const last = this.caveSegments[this.caveSegments.length - 1];

      // Harmonic undulating wave for organic, fair cavern paths
      const wave = Math.sin(this.distance * 0.003) * 120 + Math.sin(this.distance * 0.008) * 60;
      const gap = 240; // Generous, exhilarating flight gap
      const newMid = Math.max(160, Math.min(540, 350 + wave + (Math.random() - 0.5) * 30));

      const newTop = Math.max(40, newMid - gap / 2);
      const newBottom = Math.min(660, newMid + gap / 2);

      const nextX = last.x + this.segmentWidth;
      this.caveSegments.push({
        x: nextX,
        topY: newTop,
        bottomY: newBottom,
      });

      // Spawn energon crystals in cavern path
      if (Math.random() > 0.55) {
        this.crystals.push({
          id: Math.random(),
          x: nextX,
          y: newMid + (Math.random() - 0.5) * (gap * 0.4),
          collected: false,
        });
      }
    }

    // Collision check against ceiling & floor rock surfaces
    const activeSeg = this.caveSegments.find(
      (s) => this.shipPos.x >= s.x && this.shipPos.x < s.x + this.segmentWidth
    );

    if (activeSeg) {
      if (this.shipPos.y - 12 <= activeSeg.topY || this.shipPos.y + 12 >= activeSeg.bottomY) {
        this.gameOver = true;
        this.screenShake = 0.8;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(this.shipPos.x, this.shipPos.y, 45, ["#EF4444", "#F59E0B", "#FFFFFF"], 120, 360);
      }
    }

    // Boundary containment
    if (this.shipPos.y < 30 || this.shipPos.y > 670) {
      this.gameOver = true;
      this.screenShake = 0.8;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio?.playExplosion?.();
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
    if (action === "ACTION_PRIMARY" || action === "MOVE_UP" || action === "CONFIRM") {
      this.isThrusting = isPressed;
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (typeof window !== "undefined") {
      if (this.boundPointerDown) window.removeEventListener("pointerdown", this.boundPointerDown);
      if (this.boundPointerUp) window.removeEventListener("pointerup", this.boundPointerUp);
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

    const biome = this.getCurrentBiome();

    // 1. Dynamic Endless Cavern Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, biome.bgGradTop);
      bgGrad.addColorStop(0.5, biome.bgGradMid);
      bgGrad.addColorStop(1, biome.bgGradBot);
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#050614");
    }

    // Parallax Cavern Matrix Grid
    pr.drawGrid(8, 10, 60, "rgba(255, 255, 255, 0.03)", -(this.distance * 0.3) % 60, 0);

    // 2. High-Detail Cavern Rock Formations
    for (let i = 0; i < this.caveSegments.length - 1; i++) {
      const s1 = this.caveSegments[i];
      const s2 = this.caveSegments[i + 1];

      // Top Ceiling Rock
      pr.drawRect(s1.x, 0, s2.x - s1.x + 1, s1.topY, biome.rockColor, true);
      pr.drawLine(s1.x, s1.topY, s2.x, s2.topY, biome.lineColor, 2.5);
      pr.drawLine(s1.x, s1.topY - 3, s2.x, s2.topY - 3, "rgba(255, 255, 255, 0.2)", 1);

      // Bottom Floor Rock
      pr.drawRect(s1.x, s1.bottomY, s2.x - s1.x + 1, h - s1.bottomY, biome.rockColor, true);
      pr.drawLine(s1.x, s1.bottomY, s2.x, s2.bottomY, biome.lineColor, 2.5);
      pr.drawLine(s1.x, s1.bottomY + 3, s2.x, s2.bottomY + 3, "rgba(255, 255, 255, 0.2)", 1);
    }

    // 3. Glowing Energon Crystals
    for (const c of this.crystals) {
      if (c.collected) continue;
      const pulse = Math.sin(this.animTime * 6 + c.id) * 3;
      pr.drawCircle(c.x, c.y, 10 + pulse, "rgba(255, 255, 255, 0.2)", true);
      pr.drawCircle(c.x, c.y, 6, biome.crystalColor, true);
      pr.drawCircle(c.x, c.y, 3, "#FFFFFF", true);
    }

    // 4. Exhaust Particles
    for (const pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      pr.drawCircle(pt.x, pt.y, 2.5 * alpha, pt.color, true);
    }

    // 5. Interceptor Spaceship Sprite
    const sx = this.shipPos.x;
    const sy = this.shipPos.y;

    const pitchAngle = -Math.PI / 2 + Math.max(-0.4, Math.min(0.4, this.shipVy * 0.0006));

    // Render Clean Spaceship
    drawSpaceshipSprite(
      pr,
      sx,
      sy,
      28,
      pitchAngle,
      "#00F0FF"
    );

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 6. Top Cyber HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, biome.lineColor, false);

    pr.drawText(`DISTANCE: ${Math.floor(this.distance / 10)}M`, 24, 28, { size: 14, color: "#FFD84D", font: "monospace" });
    pr.drawText(`${biome.name}`, w / 2, 28, { size: 11, color: biome.lineColor, align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 24, 28, { size: 13, color: "#34D399", align: "right", font: "monospace" });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 320, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[HOLD SPACE / CLICK: THRUST UP  •  RELEASE: GLIDE  •  R: RETRY]", 176, h - 20, {
      size: 7.2,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("HULL CRUSHED — ESCAPE FAILED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO FLY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
