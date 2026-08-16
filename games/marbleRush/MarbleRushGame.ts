import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface Marble {
  color: string;
  glow: string;
  colorIdx: number;
  dist: number; // distance in pixels along track
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glow: string;
  colorIdx: number;
}

export class MarbleRushGame implements GameInstance {
  private ctx!: GameContext;
  private score = 0;
  private level = 1;
  private lives = 3;
  private combo = 0;
  private gameOver = false;
  private isWon = false;
  private isPaused = false;

  private aimAngle = -Math.PI / 2;
  private aimDir = 0;
  private marbles: Marble[] = [];
  private projectiles: Projectile[] = [];
  private pathPoints: { x: number; y: number }[] = [];
  private totalPathLength = 0;
  private readonly marbleRadius = 13;
  private readonly marbleDiameter = 26;

  private readonly marblePalette = [
    { color: "#EF4444", glow: "#FCA5A5" }, // Ruby Red
    { color: "#3B82F6", glow: "#93C5FD" }, // Sapphire Blue
    { color: "#10B981", glow: "#6EE7B7" }, // Emerald Green
    { color: "#F59E0B", glow: "#FDE047" }, // Amber Gold
    { color: "#A855F7", glow: "#E9D5FF" }, // Amethyst Purple
  ];

  private currentColors: typeof this.marblePalette = [];
  private nextColorIdx = 0;
  private animTime = 0;
  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initPath();
    this.reset();
    this.attachMouseAim();
  }

  private initPath(): void {
    this.pathPoints = [];
    const cx = 300;
    const cy = 350;
    const steps = 180;

    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      const angle = p * Math.PI * 4.8;
      const r = 260 * (1 - p * 0.72);
      this.pathPoints.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    }

    // Compute total length
    this.totalPathLength = 0;
    for (let i = 1; i < this.pathPoints.length; i++) {
      this.totalPathLength += Math.hypot(
        this.pathPoints[i].x - this.pathPoints[i - 1].x,
        this.pathPoints[i].y - this.pathPoints[i - 1].y
      );
    }
  }

  private attachMouseAim(): void {
    const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
    if (!canvas) return;

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.aimAngle = Math.atan2(my - 350, mx - 300);
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.isPaused || this.gameOver || this.isWon) return;
      this.shootMarble();
    };

    canvas.addEventListener("pointermove", this.boundPointerMove);
    canvas.addEventListener("pointerdown", this.boundPointerDown);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.combo = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.initLevel();
  }

  private initLevel(): void {
    const colorCount = Math.min(3 + Math.floor((this.level - 1) / 2), this.marblePalette.length);
    this.currentColors = this.marblePalette.slice(0, colorCount);
    this.marbles = [];
    this.projectiles = [];
    this.combo = 0;

    const chainLen = 16 + this.level * 3;
    for (let i = 0; i < chainLen; i++) {
      const cIdx = Math.floor(this.ctx.random.next() * colorCount);
      this.marbles.push({
        color: this.currentColors[cIdx].color,
        glow: this.currentColors[cIdx].glow,
        colorIdx: cIdx,
        dist: (chainLen - 1 - i) * this.marbleDiameter,
      });
    }

    this.nextColorIdx = Math.floor(this.ctx.random.next() * colorCount);
  }

  private getPointAtDist(dist: number): { x: number; y: number } {
    const p = Math.max(0, Math.min(1, dist / this.totalPathLength));
    const idxFloat = p * (this.pathPoints.length - 1);
    const i = Math.floor(idxFloat);
    const f = idxFloat - i;
    const p1 = this.pathPoints[i];
    const p2 = this.pathPoints[Math.min(i + 1, this.pathPoints.length - 1)];
    return { x: p1.x + (p2.x - p1.x) * f, y: p1.y + (p2.y - p1.y) * f };
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isWon || this.isPaused) return;
    this.animTime += dt;

    if (this.aimDir !== 0) {
      this.aimAngle += this.aimDir * 3.6 * dt;
    }

    // Advance marble train smoothly
    const trainSpeed = 34 + this.level * 6;
    for (let i = 0; i < this.marbles.length; i++) {
      this.marbles[i].dist += trainSpeed * dt;
    }

    // Keep strict continuous bead distance
    for (let i = 1; i < this.marbles.length; i++) {
      const expectedDist = this.marbles[i - 1].dist - this.marbleDiameter;
      if (this.marbles[i].dist > expectedDist) {
        this.marbles[i].dist = expectedDist;
      }
    }

    // Check if front marble reached golden central hole
    if (this.marbles.length > 0 && this.marbles[0].dist >= this.totalPathLength) {
      this.lives--;
      this.ctx.audio?.playExplosion?.();
      globalParticles.emitBurst(300, 350, 30, ["#EF4444", "#F59E0B", "#ffd84d"], 90, 300);

      if (this.lives <= 0) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      } else {
        this.initLevel();
      }
      return;
    }

    // Update projectiles & check collision with marbles
    const spd = 650;
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      let hit = false;
      for (let j = 0; j < this.marbles.length; j++) {
        const pt = this.getPointAtDist(this.marbles[j].dist);
        if (Math.hypot(p.x - pt.x, p.y - pt.y) < this.marbleDiameter) {
          // Insert marble into chain cleanly
          const insertDist = this.marbles[j].dist;
          this.marbles.splice(j, 0, {
            color: p.color,
            glow: p.glow,
            colorIdx: p.colorIdx,
            dist: insertDist,
          });

          // Spread subsequent marbles back by 1 diameter
          for (let k = j + 1; k < this.marbles.length; k++) {
            this.marbles[k].dist -= this.marbleDiameter;
          }

          this.projectiles.splice(i, 1);
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(pt.x, pt.y, 8, [p.color, "#FFFFFF"], 40, 160);

          // Check matches and cascading collapse
          this.resolveChainMatches(j);
          hit = true;
          break;
        }
      }

      if (!hit && (p.x < 0 || p.x > 600 || p.y < 0 || p.y > 700)) {
        this.projectiles.splice(i, 1);
      }
    }

    // Level Clear Check
    if (this.marbles.length === 0) {
      this.level++;
      this.score += 3000 * this.level;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 350, 35, ["#ffd84d", "#00F0FF", "#10B981"], 90, 320);
      this.initLevel();
    }
  }

  private resolveChainMatches(startIdx: number): void {
    if (startIdx < 0 || startIdx >= this.marbles.length) return;

    let s = startIdx;
    let e = startIdx;
    const c = this.marbles[startIdx].color;

    while (s > 0 && this.marbles[s - 1].color === c) s--;
    while (e < this.marbles.length - 1 && this.marbles[e + 1].color === c) e++;

    const count = e - s + 1;
    if (count >= 3) {
      this.combo++;
      const pts = count * 200 * this.combo;
      this.score += pts;
      this.ctx.audio?.playCoin?.();

      for (let i = s; i <= e; i++) {
        const pt = this.getPointAtDist(this.marbles[i].dist);
        globalParticles.emitBurst(pt.x, pt.y, 14, [c, "#FFFFFF", "#ffd84d"], 60, 220);
        globalParticles.emitText(`+${pts}`, pt.x, pt.y - 10, "#ffd84d", 14);
      }

      // Remove matched group
      this.marbles.splice(s, count);

      // Check cascade magnetic collapse on remaining gap
      if (s > 0 && s < this.marbles.length) {
        if (this.marbles[s - 1].color === this.marbles[s].color) {
          // Cascade combo!
          this.ctx.audio?.playPowerUp?.();
          setTimeout(() => this.resolveChainMatches(s), 180);
        }
      }
    } else {
      this.combo = 0;
    }
  }

  private shootMarble(): void {
    const spd = 650;
    const activeColorObj = this.currentColors[this.nextColorIdx];
    this.projectiles.push({
      x: 300,
      y: 350,
      vx: Math.cos(this.aimAngle) * spd,
      vy: Math.sin(this.aimAngle) * spd,
      color: activeColorObj.color,
      glow: activeColorObj.glow,
      colorIdx: this.nextColorIdx,
    });
    this.nextColorIdx = Math.floor(this.ctx.random.next() * this.currentColors.length);
    this.ctx.audio?.playLaser?.();
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.aimDir = isPressed ? -1 : 0;
    if (action === "MOVE_RIGHT") this.aimDir = isPressed ? 1 : 0;
    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isWon) {
      this.shootMarble();
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerMove && this.boundPointerDown) {
      const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
      canvas?.removeEventListener("pointermove", this.boundPointerMove);
      canvas?.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = pr.getWidth();
    const h = pr.getHeight();

    // 1. Draw Stone Carved Spiral Canal Track
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const p1 = this.pathPoints[i];
      const p2 = this.pathPoints[i + 1];
      pr.drawLine(p1.x, p1.y, p2.x, p2.y, "#1E293B", 28);
      pr.drawLine(p1.x, p1.y, p2.x, p2.y, "#0F172A", 22);
    }

    // 2. Central Golden Destination Vortex Hole
    const endPt = this.pathPoints[this.pathPoints.length - 1];
    pr.drawCircle(endPt.x, endPt.y, 22, "#B45309", true);
    pr.drawCircle(endPt.x, endPt.y, 16, "#F59E0B", true);
    pr.drawCircle(endPt.x, endPt.y, 8, "#000000", true);

    // 3. Draw 3D Faceted Glass Marbles
    for (const m of this.marbles) {
      const pt = this.getPointAtDist(m.dist);
      pr.drawCircle(pt.x, pt.y, this.marbleRadius, m.color, true);
      pr.drawCircle(pt.x, pt.y, this.marbleRadius, "#0F172A", false);
      // Specular shine glint
      pr.drawCircle(pt.x - 4, pt.y - 4, 3.5, m.glow, true);
      pr.drawCircle(pt.x - 3, pt.y - 3, 1.5, "#FFFFFF", true);
    }

    // 4. Draw Projectile Marbles
    for (const p of this.projectiles) {
      pr.drawCircle(p.x, p.y, this.marbleRadius, p.color, true);
      pr.drawCircle(p.x - 3, p.y - 3, 3, "#FFFFFF", true);
    }

    // 5. Draw Central Dragon Turret (Aims with Mouse & Keyboard)
    pr.save();
    pr.translate(300, 350);
    pr.rotate(this.aimAngle);

    // Stone Pedestal
    pr.drawCircle(0, 0, 26, "#334155", true);
    pr.drawCircle(0, 0, 22, "#475569", true);

    // Dragon Mouth Cannon & Loaded Marble
    pr.drawRect(8, -6, 20, 12, "#1E293B", true);
    const loadedCol = this.currentColors[this.nextColorIdx];
    pr.drawCircle(14, 0, 9, loadedCol.color, true);
    pr.drawCircle(12, -2, 2.5, "#FFFFFF", true);

    // Aim Laser Sight
    pr.drawLine(24, 0, 80, 0, "rgba(0, 240, 255, 0.4)", 1);

    pr.restore();

    // Render Particles & Score Popups
    globalParticles.render(pr);

    // Top HUD
    pr.drawRect(12, 12, w - 24, 28, "rgba(8, 14, 28, 0.8)", true);
    pr.drawRect(12, 12, w - 24, 28, "#1e293b", false);
    pr.drawText(
      `SCORE: ${this.score}  •  LEVEL: ${this.level}  •  COMBO: ${this.combo}X  •  LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`,
      w / 2,
      30,
      {
        size: 11,
        color: "#00F0FF",
        align: "center",
        font: "monospace",
      }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MARBLES BREACHED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("CLICK OR PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
