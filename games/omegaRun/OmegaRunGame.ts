import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface Obstacle {
  lane: number;
  z: number;
  type: "barrier" | "jump_bar" | "crystal";
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class OmegaRunGame implements GameInstance {
  private ctx!: GameContext;
  private lane = 1;
  private targetLane = 1;
  private playerX = 300;
  private playerY = 0;
  private playerVy = 0;
  private isSliding = false;
  private slideTimer = 0;
  private speed = 400;
  private score = 0;
  private level = 1;
  private distance = 0;
  private gameOver = false;
  private isPaused = false;
  private obstacles: Obstacle[] = [];
  private particles: Particle[] = [];
  private spawnTimer = 0;
  private animTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.lane = 1;
    this.targetLane = 1;
    this.playerX = 300;
    this.playerY = 0;
    this.playerVy = 0;
    this.isSliding = false;
    this.speed = 380;
    this.score = 0;
    this.level = 1;
    this.distance = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.obstacles = [];
    this.particles = [];
    this.spawnTimer = 0;
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
        life: 0.4,
        color,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    this.distance += this.speed * dt;
    this.score += Math.floor(this.speed * dt * 0.1);
    this.speed = 380 + (this.level - 1) * 35;
    this.level = Math.min(20, Math.floor(this.distance / 1200) + 1);

    // Smooth horizontal lane transition
    const laneTargets = [180, 300, 420];
    const targetX = laneTargets[this.targetLane];
    this.playerX += (targetX - this.playerX) * 14 * dt;
    this.lane = this.targetLane;

    // Jump Physics
    if (this.playerY > 0 || this.playerVy !== 0) {
      this.playerY += this.playerVy * dt;
      this.playerVy -= 1400 * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
      }
    }

    // Slide timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Spawn Obstacles
    this.spawnTimer += dt;
    const interval = Math.max(0.65, 1.4 - this.level * 0.05);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      const types: ("barrier" | "jump_bar" | "crystal")[] = ["barrier", "jump_bar", "crystal"];
      const roll = this.ctx.random.next();
      const type = roll < 0.4 ? "barrier" : roll < 0.7 ? "jump_bar" : "crystal";
      const l = Math.floor(this.ctx.random.next() * 3);
      this.obstacles.push({ lane: l, z: 900, type });
    }

    // Update Obstacles down perspective track
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= this.speed * dt;

      // Check collision near player (z around 100)
      if (obs.z < 130 && obs.z > 50) {
        if (obs.lane === this.lane) {
          if (obs.type === "crystal") {
            this.score += 500;
            this.obstacles.splice(i, 1);
            this.addParticles(this.playerX, 580 - this.playerY, "#FFD84D", 12);
            this.ctx.audio.playCoin();
            continue;
          } else if (obs.type === "barrier") {
            if (!this.isSliding) {
              this.gameOver = true;
              this.addParticles(this.playerX, 580, "#EF4444", 24);
              this.ctx.audio.playExplosion();
              this.ctx.session.setStatus("game-over");
            }
          } else if (obs.type === "jump_bar") {
            if (this.playerY < 24) {
              this.gameOver = true;
              this.addParticles(this.playerX, 580, "#EF4444", 24);
              this.ctx.audio.playExplosion();
              this.ctx.session.setStatus("game-over");
            }
          }
        }
      }

      if (obs.z < 0) {
        this.obstacles.splice(i, 1);
      }
    }

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

    switch (action) {
      case "MOVE_LEFT":
        if (this.targetLane > 0) {
          this.targetLane--;
          this.ctx.audio.playMove();
        }
        break;
      case "MOVE_RIGHT":
        if (this.targetLane < 2) {
          this.targetLane++;
          this.ctx.audio.playMove();
        }
        break;
      case "MOVE_UP":
      case "ACTION_PRIMARY":
        if (this.playerY === 0 && !this.isSliding) {
          this.playerVy = 620;
          this.ctx.audio.playRotate();
        }
        break;
      case "MOVE_DOWN":
      case "ACTION_SECONDARY":
        if (!this.isSliding) {
          this.isSliding = true;
          this.slideTimer = 0.45;
          if (this.playerY > 0) this.playerVy = -800; // fast drop
          this.ctx.audio.playHit();
        }
        break;
      case "RESTART":
        this.reset();
        break;
    }
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

    // 1. Horizon & Cyber Wireframe Sun
    pr.drawCircle(300, 200, 48, "#FF0055", true);
    pr.drawCircle(300, 200, 48, "#FFB703", false);

    // 2. 3D Perspective Road Track
    // Horizon line at y = 240, Base road at y = 640
    const horizonY = 240;
    const baseY = 640;
    const roadTopW = 60;
    const roadBotW = 440;

    // Draw Road Asphalt
    pr.drawLine(300 - roadTopW / 2, horizonY, 300 - roadBotW / 2, baseY, "#00F0FF", 3);
    pr.drawLine(300 + roadTopW / 2, horizonY, 300 + roadBotW / 2, baseY, "#00F0FF", 3);

    // Lane Dividers
    const leftTop = 300 - roadTopW / 6;
    const leftBot = 300 - roadBotW / 6;
    const rightTop = 300 + roadTopW / 6;
    const rightBot = 300 + roadBotW / 6;
    pr.drawLine(leftTop, horizonY, leftBot, baseY, "rgba(0, 240, 255, 0.3)", 1.5);
    pr.drawLine(rightTop, horizonY, rightBot, baseY, "rgba(0, 240, 255, 0.3)", 1.5);

    // Horizontal Perspective Strips
    for (let i = 0; i < 8; i++) {
      const p = (i * 0.125 + (this.distance * 0.003) % 0.125);
      const y = horizonY + (baseY - horizonY) * (p * p);
      const rw = roadTopW + (roadBotW - roadTopW) * p;
      pr.drawLine(300 - rw / 2, y, 300 + rw / 2, y, "rgba(255, 0, 85, 0.2)", 1);
    }

    // 3. Draw 3D Perspective Obstacles
    for (const obs of this.obstacles) {
      const p = 1 - obs.z / 900;
      if (p <= 0 || p >= 1) continue;

      const y = horizonY + (baseY - horizonY) * (p * p);
      const rw = roadTopW + (roadBotW - roadTopW) * p;
      const laneOffsets = [-rw / 3, 0, rw / 3];
      const ox = 300 + laneOffsets[obs.lane];
      const sz = Math.max(8, 44 * p);

      if (obs.type === "crystal") {
        pr.drawCircle(ox, y - sz / 2, sz / 2, "#FFD84D", true);
        pr.drawCircle(ox, y - sz / 2, sz / 4, "#FFFFFF", true);
      } else if (obs.type === "jump_bar") {
        // Low laser fence
        pr.drawRect(ox - sz / 2, y - 8, sz, 8, "#38BDF8", true);
        pr.drawLine(ox - sz / 2, y - 10, ox + sz / 2, y - 10, "#FFFFFF", 2);
      } else {
        // High barrier
        pr.drawPixelBlock(ox - sz / 2, y - sz, sz, "#EF4444", "#FCA5A5", "#991B1B");
      }
    }

    // 4. Particles
    for (const pt of this.particles) {
      pr.drawCircle(pt.x, pt.y, 2.5, pt.color, true);
    }

    // 5. Draw Cyber Runner Car
    const px = this.playerX;
    const py = 580 - this.playerY;
    const carH = this.isSliding ? 14 : 26;

    // Chassis
    pr.drawPixelBlock(px - 22, py - carH, 44, "#00F0FF", "#E0F2FE", "#0284C7");
    // Neon Red Tail Lights
    pr.drawRect(px - 18, py - 6, 8, 4, "#EF4444", true);
    pr.drawRect(px + 10, py - 6, 8, 4, "#EF4444", true);

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`DIST: ${Math.floor(this.distance / 10)}m`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`OMEGA RUN • LVL ${this.level}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("CRASH DETECTED — RUN TERMINATED", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
