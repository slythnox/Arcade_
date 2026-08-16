import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface Marble {
  color: string;
  colorIdx: number;
  t: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  colorIdx: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class MarbleRushGame implements GameInstance {
  private ctx!: GameContext;
  private score = 0;
  private level = 1;
  private lives = 3;
  private gameOver = false;
  private isWon = false;
  private isPaused = false;
  private aimAngle = -Math.PI / 2;
  private aimDir = 0;
  private marbles: Marble[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private path: { x: number; y: number }[] = [];
  private readonly colors = ["#EF4444", "#3B82F6", "#22C55E", "#EAB308", "#A855F7", "#F97316"];
  private currentColors: string[] = [];
  private nextColorIdx = 0;
  private animTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.particles = [];
    this.initLevel();
  }

  private initLevel(): void {
    // Generate curved spiral track fitting 600x700
    this.path = [];
    const cx = 300;
    const cy = 350;
    const steps = 80;

    for (let i = 0; i <= steps; i++) {
      const p = i / steps;
      // Inward spiral path
      const angle = p * Math.PI * 5;
      const r = 260 * (1 - p * 0.7);
      this.path.push({
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
      });
    }

    const colorCount = Math.min(4 + Math.floor(this.level / 3), 6);
    this.currentColors = this.colors.slice(0, colorCount);
    this.marbles = [];

    const chainLen = 16 + this.level * 3;
    for (let i = 0; i < chainLen; i++) {
      const cIdx = Math.floor(this.ctx.random.next() * colorCount);
      this.marbles.push({
        color: this.currentColors[cIdx],
        colorIdx: cIdx,
        t: (chainLen - 1 - i) * 0.014,
      });
    }

    this.nextColorIdx = Math.floor(this.ctx.random.next() * colorCount);
    this.projectiles = [];
  }

  private addParticles(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 40 + this.ctx.random.next() * 100;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.45,
        color,
      });
    }
  }

  private getPathPoint(t: number): { x: number; y: number } {
    if (t <= 0) return this.path[0];
    if (t >= 1) return this.path[this.path.length - 1];

    const p = t * (this.path.length - 1);
    const i = Math.floor(p);
    const f = p - i;
    const p1 = this.path[i];
    const p2 = this.path[Math.min(i + 1, this.path.length - 1)];

    return { x: p1.x + (p2.x - p1.x) * f, y: p1.y + (p2.y - p1.y) * f };
  }

  public update(dt: number): void {
    if (this.gameOver || this.isWon || this.isPaused) return;
    this.animTime += dt;

    if (this.aimDir !== 0) this.aimAngle += this.aimDir * 3.5 * dt;

    // Marble chain speed
    const speed = 0.018 + this.level * 0.0025;
    for (const m of this.marbles) m.t += speed * dt;

    // Check if marbles reached golden pit at center
    if (this.marbles.length > 0 && this.marbles[0].t >= 1) {
      this.lives--;
      this.ctx.audio.playExplosion();
      if (this.lives <= 0) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      } else {
        this.initLevel();
      }
      return;
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      let hit = false;
      for (let j = 0; j < this.marbles.length; j++) {
        const mp = this.getPathPoint(this.marbles[j].t);
        const dx = p.x - mp.x;
        const dy = p.y - mp.y;

        if (Math.hypot(dx, dy) < 22) {
          // Insert marble into chain
          this.marbles.splice(j, 0, {
            color: p.color,
            colorIdx: p.colorIdx,
            t: Math.max(0, this.marbles[j].t - 0.005),
          });
          this.projectiles.splice(i, 1);
          this.addParticles(p.x, p.y, p.color, 6);
          this.ctx.audio.playHit();
          this.checkMatches(j);
          hit = true;
          break;
        }
      }

      if (!hit && (p.x < 0 || p.x > 600 || p.y < 0 || p.y > 700)) {
        this.projectiles.splice(i, 1);
      }
    }

    // Check level victory
    if (this.marbles.length === 0) {
      this.level++;
      this.score += 2000 * this.level;
      this.ctx.audio.playVictory();
      this.initLevel();
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

  private checkMatches(idx: number): void {
    if (idx < 0 || idx >= this.marbles.length) return;
    let s = idx;
    let e = idx;
    const c = this.marbles[idx].color;

    while (s > 0 && this.marbles[s - 1].color === c) s--;
    while (e < this.marbles.length - 1 && this.marbles[e + 1].color === c) e++;

    const count = e - s + 1;
    if (count >= 3) {
      const removed = this.marbles.splice(s, count);
      this.score += count * 150;
      this.ctx.audio.playCoin();
      for (const m of removed) {
        const pt = this.getPathPoint(m.t);
        this.addParticles(pt.x, pt.y, m.color, 10);
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.aimDir = isPressed ? -1 : 0;
    if (action === "MOVE_RIGHT") this.aimDir = isPressed ? 1 : 0;

    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver) {
      const spd = 620;
      this.projectiles.push({
        x: 300,
        y: 350,
        vx: Math.cos(this.aimAngle) * spd,
        vy: Math.sin(this.aimAngle) * spd,
        color: this.currentColors[this.nextColorIdx],
        colorIdx: this.nextColorIdx,
      });
      this.nextColorIdx = Math.floor(this.ctx.random.next() * this.currentColors.length);
      this.ctx.audio.playLaser();
    }

    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Ancient Stone Path Groove (Draw Outer Canal & Track)
    for (let i = 0; i < this.path.length - 1; i++) {
      pr.drawLine(this.path[i].x, this.path[i].y, this.path[i + 1].x, this.path[i + 1].y, "#1e293b", 26);
      pr.drawLine(this.path[i].x, this.path[i].y, this.path[i + 1].x, this.path[i + 1].y, "#0f172a", 16);
    }

    // Golden Pit Skull at End
    const endPt = this.path[this.path.length - 1];
    pr.drawCircle(endPt.x, endPt.y, 22, "#78350f", true);
    pr.drawCircle(endPt.x, endPt.y, 16, "#d97706", true);
    pr.drawCircle(endPt.x, endPt.y, 8, "#000000", true);

    // 2. Draw 3D Glass Marbles along track
    for (const m of this.marbles) {
      const pt = this.getPathPoint(m.t);
      // Outer drop shadow
      pr.drawCircle(pt.x + 2, pt.y + 2, 11, "rgba(0,0,0,0.3)", true);
      // Sphere body
      pr.drawCircle(pt.x, pt.y, 11, m.color, true);
      // 3D Glass Specular Highlight
      pr.drawCircle(pt.x - 3, pt.y - 3, 5, "#FFFFFF", true);
    }

    // 3. Draw Projectiles
    for (const p of this.projectiles) {
      pr.drawCircle(p.x, p.y, 10, p.color, true);
      pr.drawCircle(p.x - 3, p.y - 3, 4, "#FFFFFF", true);
    }

    // 4. Particles
    for (const pt of this.particles) {
      pr.drawCircle(pt.x, pt.y, 2.5, pt.color, true);
    }

    // 5. Center Dragon/Frog Turret
    pr.drawCircle(300, 350, 28, "#1e293b", true);
    pr.drawCircle(300, 350, 24, "#065f46", true);
    // Next loaded marble in mouth
    const loadedCol = this.currentColors[this.nextColorIdx] || "#EF4444";
    pr.drawCircle(300, 350, 11, loadedCol, true);
    pr.drawCircle(297, 347, 4, "#FFFFFF", true);

    // Turret Cannon Aim Pointer
    const ax = 300 + Math.cos(this.aimAngle) * 44;
    const ay = 350 + Math.sin(this.aimAngle) * 44;
    pr.drawLine(300, 350, ax, ay, "#FCD34D", 3);
    pr.drawCircle(ax, ay, 4, "#EF4444", true);

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`MARBLE RUSH • LVL ${this.level}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 32, { size: 13, color: "#f43f5e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MARBLE PIT OVERFLOW — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
