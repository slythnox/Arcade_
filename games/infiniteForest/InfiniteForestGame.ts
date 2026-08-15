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

export class InfiniteForestGame implements GameInstance {
  private ctx!: GameContext;
  private noise!: ValueNoise;
  private scrollX = 0;
  private playerX = 120;
  private playerY = 300;
  private playerVy = 0;
  private isGrounded = true;
  private speed = 260;
  private score = 0;
  private level = 1;
  private distance = 0;
  private gameOver = false;
  private isPaused = false;
  private orbs: ForestOrb[] = [];
  private obstacles: ForestObstacle[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.noise = new ValueNoise(seed || 1337);
    this.scrollX = 0;
    this.playerX = 120;
    this.playerY = 300;
    this.playerVy = 0;
    this.isGrounded = true;
    this.speed = 260;
    this.score = 0;
    this.level = 1;
    this.distance = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.orbs = [];
    this.obstacles = [];

    // Pre-generate initial orbs & obstacles
    for (let x = 400; x < 3000; x += 150) {
      const terrainY = this.getTerrainHeight(x);
      if (this.ctx.random.next() < 0.6) {
        this.orbs.push({ worldX: x, worldY: terrainY - 30, collected: false });
      } else {
        this.obstacles.push({ worldX: x, worldY: terrainY, size: 20 });
      }
    }
  }

  private getTerrainHeight(worldX: number): number {
    // 1D Continuous Procedural Forest Hills
    const base = 420;
    const hill1 = this.noise.noise1D(worldX * 0.003) * 90;
    const hill2 = this.noise.noise1D(worldX * 0.01) * 35;
    return base + hill1 + hill2;
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.scrollX += this.speed * dt;
    this.distance = this.scrollX;
    this.score += Math.floor(this.speed * dt * 0.1);
    this.speed = 260 + (this.level - 1) * 20;
    this.level = Math.min(20, Math.floor(this.distance / 1500) + 1);

    const worldPlayerX = this.scrollX + this.playerX;
    const groundY = this.getTerrainHeight(worldPlayerX);

    // Physics
    this.playerY += this.playerVy * dt;
    if (!this.isGrounded) {
      this.playerVy += 980 * dt; // Gravity
      if (this.playerY >= groundY - 14) {
        this.playerY = groundY - 14;
        this.playerVy = 0;
        this.isGrounded = true;
      }
    } else {
      this.playerY = groundY - 14;
    }

    // Check Orbs
    for (const orb of this.orbs) {
      if (!orb.collected && Math.abs(orb.worldX - worldPlayerX) < 24 && Math.abs(orb.worldY - this.playerY) < 28) {
        orb.collected = true;
        this.score += 200;
        this.ctx.audio?.playCoin?.();
      }
    }

    // Check Obstacles
    for (const obs of this.obstacles) {
      if (Math.abs(obs.worldX - worldPlayerX) < 18 && Math.abs(obs.worldY - (this.playerY + 14)) < 20) {
        this.gameOver = true;
        this.ctx.audio?.playExplosion?.();
        return;
      }
    }

    // Generate upcoming terrain items
    const lastOrbX = this.orbs.length > 0 ? this.orbs[this.orbs.length - 1].worldX : 0;
    if (lastOrbX < worldPlayerX + 1200) {
      const nextX = lastOrbX + 160 + this.ctx.random.next() * 100;
      const terrainY = this.getTerrainHeight(nextX);
      if (this.ctx.random.next() < 0.6) {
        this.orbs.push({ worldX: nextX, worldY: terrainY - 35, collected: false });
      } else {
        this.obstacles.push({ worldX: nextX, worldY: terrainY, size: 22 });
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.gameOver) {
      if (action === "ACTION_PRIMARY" || action === "RESTART") this.reset();
      return;
    }

    if ((action === "MOVE_UP" || action === "ACTION_PRIMARY") && this.isGrounded) {
      this.playerVy = -480;
      this.isGrounded = false;
      this.ctx.audio?.playRotate?.();
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#030712");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Render Procedural Hills Ground
    for (let screenX = 0; screenX < w; screenX += 4) {
      const worldX = this.scrollX + screenX;
      const groundY = this.getTerrainHeight(worldX);
      pr.drawRect(screenX, groundY, 4, h - groundY, "#14532d", true);
      pr.drawRect(screenX, groundY, 4, 4, "#22c55e", true);
    }

    // Render Orbs
    for (const orb of this.orbs) {
      if (orb.collected) continue;
      const screenX = orb.worldX - this.scrollX;
      if (screenX >= -20 && screenX <= w + 20) {
        pr.drawCircle(screenX, orb.worldY, 6, "#ffd84d", true);
        pr.drawCircle(screenX, orb.worldY, 8, "rgba(255, 216, 77, 0.4)", false);
      }
    }

    // Render Obstacles (Rocks/Stumps)
    for (const obs of this.obstacles) {
      const screenX = obs.worldX - this.scrollX;
      if (screenX >= -20 && screenX <= w + 20) {
        pr.drawRect(screenX - 10, obs.worldY - obs.size, 20, obs.size, "#78350f", true);
        pr.drawRect(screenX - 10, obs.worldY - obs.size, 20, obs.size, "#ff5c8a", false);
      }
    }

    // Render Player
    pr.drawRect(this.playerX - 10, this.playerY - 14, 20, 28, "#4de8e8", true);
    pr.drawRect(this.playerX - 10, this.playerY - 14, 20, 28, "#ffffff", false);

    // Header HUD
    pr.drawText(`INFINITE FOREST  •  LVL ${this.level}  •  DIST: ${Math.floor(this.distance)}M`, w / 2, 30, {
      size: 12,
      color: "#63e66d",
      align: "center",
    });
    pr.drawText(`[UP / SPACE / A] JUMP ACROSS PROCEDURAL CANOPY AND COLLECT GLOWING EMBERS`, w / 2, 52, {
      size: 9,
      color: "#94a3b8",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(6, 11, 24, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#ff5c8a", false);
      pr.drawText("FOREST RUN ENDED", w / 2, h / 2 - 10, { size: 18, color: "#ff5c8a", align: "center" });
      pr.drawText("PRESS SPACE TO RESTART", w / 2, h / 2 + 18, { size: 11, color: "#e2e8f0", align: "center" });
    }
  }
}
