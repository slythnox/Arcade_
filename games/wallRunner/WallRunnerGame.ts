import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface WallHazard {
  y: number;
  isLeft: boolean;
  type: "spike" | "shuriken";
  destroyed?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class WallRunnerGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 60;
  private playerY: number = 550;
  private playerVx: number = 0;
  private currentWall: "left" | "right" | "midair" = "left";
  private climbSpeed: number = 260;
  private hazards: WallHazard[] = [];
  private particles: Particle[] = [];
  private score: number = 0;
  private altitude: number = 0;
  private combo: number = 1;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 60;
    this.playerY = 550;
    this.playerVx = 0;
    this.currentWall = "left";
    this.climbSpeed = 260;
    this.score = 0;
    this.altitude = 0;
    this.combo = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.hazards = [];
    this.particles = [];

    for (let i = 0; i < 7; i++) {
      this.spawnHazard(400 - i * 95);
    }
  }

  private spawnHazard(y: number): void {
    const isLeft = this.ctx.random.next() < 0.5;
    const type = this.ctx.random.next() > 0.6 ? "shuriken" : "spike";
    this.hazards.push({ y, isLeft, type });
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

  private jump(): void {
    if (this.gameOver || this.isPaused) return;

    if (this.currentWall === "left") {
      this.currentWall = "midair";
      this.playerVx = 580;
      this.addParticles(this.playerX, this.playerY, "#38BDF8", 8);
      this.ctx.audio.playRotate();
    } else if (this.currentWall === "right") {
      this.currentWall = "midair";
      this.playerVx = -580;
      this.addParticles(this.playerX, this.playerY, "#38BDF8", 8);
      this.ctx.audio.playRotate();
    } else {
      // Air Katana Slash: destroy nearby shurikens
      for (const h of this.hazards) {
        if (!h.destroyed && Math.abs(h.y - this.playerY) < 36 && Math.abs((h.isLeft ? 60 : 540) - this.playerX) < 80) {
          h.destroyed = true;
          this.score += 250 * this.combo;
          this.combo++;
          this.addParticles(this.playerX, this.playerY, "#FFD84D", 12);
          this.ctx.audio.playHit();
        }
      }
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    this.climbSpeed = 260 + Math.min(240, this.altitude * 0.05);
    const scrollDelta = this.climbSpeed * dt;
    this.altitude += scrollDelta * 0.1;
    this.score += Math.floor(scrollDelta * 0.1);

    // Scroll hazards downward
    for (const h of this.hazards) {
      h.y += scrollDelta;
    }

    // Recycle fallen hazards
    this.hazards = this.hazards.filter((h) => h.y < 720);
    while (this.hazards.length < 8) {
      const topY = Math.min(...this.hazards.map((h) => h.y), 0);
      this.spawnHazard(topY - 95);
    }

    // Midair horizontal motion
    if (this.currentWall === "midair") {
      this.playerX += this.playerVx * dt;

      if (this.playerX <= 60) {
        this.playerX = 60;
        this.currentWall = "left";
        this.playerVx = 0;
        this.combo = Math.min(8, this.combo + 1);
        this.addParticles(this.playerX, this.playerY, "#FFFFFF", 6);
        this.ctx.audio.playMove();
      } else if (this.playerX >= 540) {
        this.playerX = 540;
        this.currentWall = "right";
        this.playerVx = 0;
        this.combo = Math.min(8, this.combo + 1);
        this.addParticles(this.playerX, this.playerY, "#FFFFFF", 6);
        this.ctx.audio.playMove();
      }
    } else {
      // Wall slide sparks
      if (this.ctx.random.next() > 0.6) {
        this.addParticles(this.playerX, this.playerY + 12, "#F59E0B", 1);
      }
    }

    // Check hazard collisions
    for (const h of this.hazards) {
      if (h.destroyed) continue;
      const hx = h.isLeft ? 60 : 540;
      if (Math.abs(h.y - this.playerY) < 22 && Math.abs(hx - this.playerX) < 26) {
        this.gameOver = true;
        this.addParticles(this.playerX, this.playerY, "#EF4444", 24);
        this.ctx.audio.playExplosion();
        this.ctx.session.setStatus("game-over");
        break;
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
    if (!isPressed) return;
    if (action === "ACTION_PRIMARY" || action === "MOVE_LEFT" || action === "MOVE_RIGHT" || action === "MOVE_UP") {
      this.jump();
    }
    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return Math.floor(this.altitude / 100) + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cyber Alley Speed Lines Backdrop
    for (let x = 80; x < 520; x += 60) {
      pr.drawLine(x, 0, x, h, "rgba(56, 189, 248, 0.03)", 1);
    }

    // 2. Left and Right Massive Concrete Walls
    pr.drawRect(0, 0, 48, h, "#1e293b", true);
    pr.drawLine(48, 0, 48, h, "#00F0FF", 2);

    pr.drawRect(552, 0, 48, h, "#1e293b", true);
    pr.drawLine(552, 0, 552, h, "#00F0FF", 2);

    // 3. Draw Hazards
    for (const haz of this.hazards) {
      if (haz.destroyed) continue;

      if (haz.type === "shuriken") {
        const sx = haz.isLeft ? 60 : 540;
        // Spinning Star
        const ang = this.animTime * 12;
        pr.drawCircle(sx, haz.y, 10, "#94A3B8", true);
        pr.drawLine(sx - Math.cos(ang) * 14, haz.y - Math.sin(ang) * 14, sx + Math.cos(ang) * 14, haz.y + Math.sin(ang) * 14, "#EF4444", 2);
        pr.drawLine(sx - Math.sin(ang) * 14, haz.y + Math.cos(ang) * 14, sx + Math.sin(ang) * 14, haz.y - Math.cos(ang) * 14, "#EF4444", 2);
      } else {
        // Red Energy Spikes
        if (haz.isLeft) {
          pr.drawLine(48, haz.y - 12, 70, haz.y, "#EF4444", 4);
          pr.drawLine(70, haz.y, 48, haz.y + 12, "#EF4444", 4);
        } else {
          pr.drawLine(552, haz.y - 12, 530, haz.y, "#EF4444", 4);
          pr.drawLine(530, haz.y, 552, haz.y + 12, "#EF4444", 4);
        }
      }
    }

    // 4. Particles
    for (const pt of this.particles) {
      pr.drawCircle(pt.x, pt.y, 2, pt.color, true);
    }

    // 5. Draw Cyber Ninja Runner
    const px = this.playerX;
    const py = this.playerY;
    pr.drawPixelBlock(px - 10, py - 14, 20, "#00F0FF", "#E0F2FE", "#0284C7");
    // Red Ninja Headband Ribbon
    const ribbonDir = this.currentWall === "left" ? -1 : 1;
    pr.drawLine(px, py - 18, px + ribbonDir * 16, py - 22, "#F43F5E", 3);

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`CLIMB: ${Math.floor(this.altitude)}m`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`COMBO: x${this.combo}`, w / 2, 32, { size: 13, color: "#38bdf8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("NINJA FELL — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO DASH AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
