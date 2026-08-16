import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface CaveSegment {
  x: number;
  topY: number;
  bottomY: number;
}

interface Crystal {
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
  color: string;
}

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
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
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
    this.gameOver = false;
    this.isPaused = false;
    this.caveSegments = [];
    this.crystals = [];
    this.particles = [];

    let curTop = 100;
    let curBottom = 600;
    for (let x = 0; x < 680; x += this.segmentWidth) {
      this.caveSegments.push({
        x,
        topY: curTop,
        bottomY: curBottom,
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

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    // Thruster physics
    if (this.isThrusting) {
      this.shipVy -= 950 * dt;
      // Spawn thruster particles
      this.addParticles(this.shipPos.x - 14, this.shipPos.y + 8, "#FFB703", 2);
    } else {
      this.shipVy += 800 * dt;
    }

    this.shipVy *= 0.98; // Drag
    this.shipPos.y += this.shipVy * dt;

    // Scroll cave
    this.scrollSpeed = 280 + Math.min(220, this.distance * 0.04);
    const deltaX = this.scrollSpeed * dt;
    this.distance += deltaX;
    this.score += Math.floor(deltaX * 0.1);
    this.level = Math.floor(this.distance / 1500) + 1;

    for (const seg of this.caveSegments) {
      seg.x -= deltaX;
    }

    // Scroll crystals
    for (const c of this.crystals) {
      c.x -= deltaX;
      if (!c.collected && Math.hypot(c.x - this.shipPos.x, c.y - this.shipPos.y) < 24) {
        c.collected = true;
        this.score += 250;
        this.addParticles(c.x, c.y, "#00F0FF", 10);
        this.ctx.audio.playCoin();
      }
    }
    this.crystals = this.crystals.filter((c) => c.x > -40);

    // Recycle cave segments
    while (this.caveSegments[0]?.x < -this.segmentWidth) {
      this.caveSegments.shift();
      const last = this.caveSegments[this.caveSegments.length - 1];
      const gap = Math.max(160, 360 - this.level * 15);
      const shift = (this.ctx.random.next() - 0.5) * 45;
      const newMid = Math.max(160, Math.min(540, (last.topY + last.bottomY) / 2 + shift));

      const newTop = Math.max(40, newMid - gap / 2);
      const newBottom = Math.min(660, newMid + gap / 2);

      const nextX = last.x + this.segmentWidth;
      this.caveSegments.push({
        x: nextX,
        topY: newTop,
        bottomY: newBottom,
      });

      // Chance to spawn energon crystal
      if (this.ctx.random.next() > 0.6) {
        this.crystals.push({
          x: nextX,
          y: newMid + (this.ctx.random.next() - 0.5) * (gap * 0.5),
          collected: false,
        });
      }
    }

    // Collision check against ceiling & floor
    const activeSeg = this.caveSegments.find(
      (s) => this.shipPos.x >= s.x && this.shipPos.x < s.x + this.segmentWidth
    );

    if (activeSeg) {
      if (this.shipPos.y - 12 <= activeSeg.topY || this.shipPos.y + 12 >= activeSeg.bottomY) {
        this.gameOver = true;
        this.addParticles(this.shipPos.x, this.shipPos.y, "#EF4444", 24);
        this.ctx.audio.playExplosion();
        this.ctx.session.setStatus("game-over");
      }
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
    if (action === "ACTION_PRIMARY" || action === "MOVE_UP") {
      this.isThrusting = isPressed;
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Draw Cave Rock Stalactites (Top) and Stalagmites (Bottom)
    for (let i = 0; i < this.caveSegments.length - 1; i++) {
      const s1 = this.caveSegments[i];
      const s2 = this.caveSegments[i + 1];

      // Top Ceiling Rock
      pr.drawRect(s1.x, 0, s2.x - s1.x + 1, s1.topY, "#1e293b", true);
      pr.drawLine(s1.x, s1.topY, s2.x, s2.topY, "#38bdf8", 2);

      // Bottom Floor Rock
      pr.drawRect(s1.x, s1.bottomY, s2.x - s1.x + 1, h - s1.bottomY, "#1e293b", true);
      pr.drawLine(s1.x, s1.bottomY, s2.x, s2.bottomY, "#38bdf8", 2);
    }

    // 2. Draw Crystals
    for (const c of this.crystals) {
      if (c.collected) continue;
      const pulse = Math.sin(this.animTime * 6 + c.x) * 2;
      pr.drawCircle(c.x, c.y, 8 + pulse, "rgba(0, 240, 255, 0.2)", true);
      pr.drawCircle(c.x, c.y, 5, "#00F0FF", true);
      pr.drawCircle(c.x, c.y, 2, "#FFFFFF", true);
    }

    // 3. Particles
    for (const pt of this.particles) {
      pr.drawCircle(pt.x, pt.y, 2, pt.color, true);
    }

    // 4. Draw Escape Pod Vessel
    const sx = this.shipPos.x;
    const sy = this.shipPos.y;
    // Cockpit & Hull
    pr.drawPixelBlock(sx - 14, sy - 10, 28, "#00F0FF", "#E0F2FE", "#0284C7");
    // Visor Window
    pr.drawRect(sx + 2, sy - 6, 8, 8, "#FFD84D", true);
    // VTOL Thruster Nozzle
    pr.drawRect(sx - 16, sy + 2, 6, 6, "#475569", true);

    // 5. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`DIST: ${Math.floor(this.distance / 10)}m`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`CAVE ESCAPE • LVL ${this.level}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("HULL CRUSHED — ESCAPE FAILED", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] OR [SPACE] TO FLY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
