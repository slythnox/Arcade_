import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { ValueNoise } from "../../core/math/noise";

interface ForestOrb {
  worldX: number;
  worldY: number;
  collected: boolean;
}

interface ForestObstacle {
  worldX: number;
  worldY: number;
  size: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class InfiniteForestGame implements GameInstance {
  private ctx!: GameContext;
  private noise!: ValueNoise;
  private scrollX = 0;
  private playerX = 140;
  private playerY = 400;
  private playerVy = 0;
  private isGrounded = true;
  private speed = 280;
  private score = 0;
  private level = 1;
  private distance = 0;
  private gameOver = false;
  private isPaused = false;
  private orbs: ForestOrb[] = [];
  private obstacles: ForestObstacle[] = [];
  private particles: Particle[] = [];
  private animTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.noise = new ValueNoise(seed || 1337);
    this.scrollX = 0;
    this.playerX = 140;
    this.playerY = 400;
    this.playerVy = 0;
    this.isGrounded = true;
    this.speed = 280;
    this.score = 0;
    this.level = 1;
    this.distance = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.orbs = [];
    this.obstacles = [];
    this.particles = [];

    // Pre-generate initial orbs & obstacles
    for (let x = 500; x < 4000; x += 160) {
      const groundY = this.getGroundHeight(x);
      if (this.ctx.random.next() > 0.4) {
        this.orbs.push({ worldX: x, worldY: groundY - 45 - this.ctx.random.next() * 50, collected: false });
      }
      if (this.ctx.random.next() > 0.65) {
        this.obstacles.push({ worldX: x + 80, worldY: groundY - 24, size: 24 });
      }
    }
  }

  private getGroundHeight(worldX: number): number {
    const n = this.noise.noise1D(worldX * 0.002);
    const n2 = this.noise.noise1D(worldX * 0.008) * 0.3;
    return 440 + (n + n2) * 110;
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
        life: 0.4,
        color,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    this.scrollX += this.speed * dt;
    this.distance += this.speed * dt;
    this.score = Math.floor(this.distance / 10);

    // Gravity & Ground physics
    this.playerVy += 1400 * dt;
    this.playerY += this.playerVy * dt;

    const currentGround = this.getGroundHeight(this.scrollX + this.playerX);
    if (this.playerY >= currentGround - 16) {
      this.playerY = currentGround - 16;
      this.playerVy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Check Orbs
    for (const orb of this.orbs) {
      if (orb.collected) continue;
      const screenX = orb.worldX - this.scrollX;
      if (Math.hypot(screenX - this.playerX, orb.worldY - this.playerY) < 28) {
        orb.collected = true;
        this.score += 250;
        this.addParticles(screenX, orb.worldY, "#FFD84D", 8);
        this.ctx.audio.playCoin();
      }
    }

    // Check Obstacles (Ancient Totems / Spikes)
    for (const obs of this.obstacles) {
      const screenX = obs.worldX - this.scrollX;
      if (Math.abs(screenX - this.playerX) < 18 && Math.abs(obs.worldY - this.playerY) < 22) {
        this.gameOver = true;
        this.addParticles(screenX, obs.worldY, "#EF4444", 20);
        this.ctx.audio.playExplosion();
        this.ctx.session.setStatus("game-over");
        break;
      }
    }

    // Spawn more orbs & obstacles ahead
    const maxWorldX = this.scrollX + 800;
    const lastOrbX = this.orbs.length > 0 ? this.orbs[this.orbs.length - 1].worldX : 0;
    if (lastOrbX < maxWorldX) {
      const nextX = lastOrbX + 160;
      const gY = this.getGroundHeight(nextX);
      if (this.ctx.random.next() > 0.4) {
        this.orbs.push({ worldX: nextX, worldY: gY - 45 - this.ctx.random.next() * 50, collected: false });
      }
      if (this.ctx.random.next() > 0.6) {
        this.obstacles.push({ worldX: nextX + 75, worldY: gY - 24, size: 24 });
      }
    }

    // Clean up old orbs
    this.orbs = this.orbs.filter((o) => o.worldX > this.scrollX - 200);
    this.obstacles = this.obstacles.filter((o) => o.worldX > this.scrollX - 200);

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
    if ((action === "ACTION_PRIMARY" || action === "MOVE_UP") && this.isGrounded) {
      this.playerVy = -580;
      this.isGrounded = false;
      this.ctx.audio.playMove();
    }
    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#050914");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Distant Mountain Silhouette (Parallax Factor 0.15)
    for (let x = 0; x < w; x += 4) {
      const mx = (x + this.scrollX * 0.15);
      const my = 260 + this.noise.noise1D(mx * 0.001) * 80;
      pr.drawRect(x, my, 4, h - my, "#0c152a", true);
    }

    // 2. Mid-Range Pine Forest Layer (Parallax Factor 0.4)
    for (let x = 0; x < w; x += 36) {
      const fx = x - ((this.scrollX * 0.4) % 36);
      const fy = 340 + this.noise.noise1D((x + this.scrollX * 0.4) * 0.003) * 60;
      // Pine tree triangle silhouette
      pr.drawRect(fx + 14, fy, 8, 80, "#064e3b", true);
      pr.drawCircle(fx + 18, fy - 16, 20, "#065f46", true);
    }

    // 3. Foreground Terrain (ValueNoise Heightmap)
    for (let x = 0; x < w; x += 4) {
      const wx = this.scrollX + x;
      const gy = this.getGroundHeight(wx);
      // Grassy top crust
      pr.drawRect(x, gy, 4, 10, "#22c55e", true);
      // Earth soil body
      pr.drawRect(x, gy + 10, 4, h - gy - 10, "#166534", true);
    }

    // 4. Draw Ancient Totem Obstacles
    for (const obs of this.obstacles) {
      const sx = obs.worldX - this.scrollX;
      if (sx < -40 || sx > w + 40) continue;
      pr.drawPixelBlock(sx - 12, obs.worldY - 20, 24, "#475569", "#94A3B8", "#1E293B");
      pr.drawRect(sx - 3, obs.worldY - 14, 6, 4, "#EF4444", true); // glowing red rune
    }

    // 5. Draw Magical Light Orbs
    for (const orb of this.orbs) {
      if (orb.collected) continue;
      const sx = orb.worldX - this.scrollX;
      if (sx < -40 || sx > w + 40) continue;
      const pulse = Math.sin(this.animTime * 6 + sx) * 3;
      pr.drawCircle(sx, orb.worldY, 10 + pulse, "rgba(255, 216, 77, 0.2)", true);
      pr.drawCircle(sx, orb.worldY, 6, "#FFD84D", true);
      pr.drawCircle(sx, orb.worldY, 2.5, "#FFFFFF", true);
    }

    // 6. Draw Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2.5, p.color, true);
    }

    // 7. Draw Player Character (Forest Spirit Runner with Animated Scarf)
    const px = this.playerX;
    const py = this.playerY;
    // Cloak Body
    pr.drawPixelBlock(px - 10, py - 16, 20, "#38BDF8", "#E0F2FE", "#0284C7");
    // Trailing Wind Scarf
    const scarfWave = Math.sin(this.animTime * 14) * 6;
    pr.drawLine(px - 8, py - 12, px - 26, py - 8 + scarfWave, "#F43F5E", 4);
    // Glowing Spirit Eyes
    pr.drawCircle(px + 4, py - 10, 2, "#FFFFFF", true);

    // 8. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`DISTANCE: ${Math.floor(this.distance / 10)}m`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`SPEED: ${Math.floor(this.speed)}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("FOREST SPIRIT FALTERED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] OR [SPACE] TO RUN AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
