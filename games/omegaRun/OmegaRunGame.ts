import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawRunnerBehindSprite } from "./runnerSprite";

type ObstacleType = "barrier" | "jump_bar" | "barrel" | "crystal";

interface Obstacle {
  lane: number;
  z: number;
  type: ObstacleType;
  passed?: boolean;
}

export class OmegaRunGame implements GameInstance {
  private ctx!: GameContext;
  private lane = 1; // 0: Left, 1: Center, 2: Right
  private targetLane = 1;
  private playerX = 300;
  private playerY = 0;
  private playerVy = 0;
  private isSliding = false;
  private slideTimer = 0;
  private speed = 420;
  private score = 0;
  private level = 1;
  private distance = 0;
  private coins = 0;
  private gameOver = false;
  private isPaused = false;
  private obstacles: Obstacle[] = [];
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
    this.slideTimer = 0;
    this.speed = 420;
    this.score = 0;
    this.level = 1;
    this.distance = 0;
    this.coins = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.obstacles = [];
    this.spawnTimer = 0;
    this.animTime = 0;
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    this.distance += this.speed * dt;
    this.score += Math.floor(this.speed * dt * 0.12);
    this.speed = 420 + (this.level - 1) * 35;
    this.level = Math.min(20, Math.floor(this.distance / 1000) + 1);

    // Smooth horizontal lane transition (3 lanes)
    const laneTargets = [180, 300, 420];
    const targetX = laneTargets[this.targetLane];
    this.playerX += (targetX - this.playerX) * 16 * dt;
    this.lane = this.targetLane;

    // Jump Physics
    if (this.playerY > 0 || this.playerVy !== 0) {
      this.playerY += this.playerVy * dt;
      this.playerVy -= 1600 * dt;
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
        globalParticles.emitBurst(this.playerX, 600, 6, ["#F97316", "#FED7AA"], 30, 100);
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
    const interval = Math.max(0.55, 1.3 - this.level * 0.05);
    if (this.spawnTimer >= interval) {
      this.spawnTimer = 0;
      const roll = this.ctx.random.next();
      let type: ObstacleType = "barrier";
      if (roll < 0.35) type = "barrier";
      else if (roll < 0.6) type = "jump_bar";
      else if (roll < 0.8) type = "barrel";
      else type = "crystal";

      const l = Math.floor(this.ctx.random.next() * 3);
      this.obstacles.push({ lane: l, z: 950, type });
    }

    // Update Obstacles along perspective highway
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= this.speed * dt;

      // Collision Check when obstacle reaches player depth (z approx 80 to 20)
      if (obs.z <= 90 && obs.z >= 10 && !obs.passed) {
        if (obs.lane === this.targetLane) {
          if (obs.type === "crystal") {
            // Collectible Crystal Gem
            obs.passed = true;
            this.coins++;
            this.score += 250 * this.level;
            this.ctx.audio?.playCoin?.();
            globalParticles.emitBurst(this.playerX, 560 - this.playerY, 14, ["#FFD84D", "#FFFFFF", "#F59E0B"], 60, 200);
            globalParticles.emitText("+250", this.playerX, 520, "#FFD84D", 14);
            this.obstacles.splice(i, 1);
            continue;
          } else if (obs.type === "jump_bar") {
            // High Laser Crossbar: Must SLIDE under or jump over high
            if (!this.isSliding && this.playerY < 35) {
              this.handleCrash();
            }
          } else if (obs.type === "barrier") {
            // High Solid Roadblock: Must JUMP over or dodge lane
            if (this.playerY < 55) {
              this.handleCrash();
            }
          } else if (obs.type === "barrel") {
            // Spiked Ground Barrel: Must JUMP over
            if (this.playerY < 40) {
              this.handleCrash();
            }
          }
        }
      }

      if (obs.z < -50) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  private handleCrash(): void {
    if (this.gameOver) return;
    this.gameOver = true;
    this.ctx.session.setStatus("game-over");
    this.ctx.audio?.playExplosion?.();
    globalParticles.emitBurst(this.playerX, 580 - this.playerY, 28, ["#EA580C", "#EF4444", "#FDBA74", "#FFFFFF"], 90, 300);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) {
      if (action === "RESTART" && isPressed) this.reset();
      return;
    }

    switch (action) {
      case "MOVE_LEFT":
        if (this.targetLane > 0) {
          this.targetLane--;
          this.ctx.audio?.playMove?.();
        }
        break;
      case "MOVE_RIGHT":
        if (this.targetLane < 2) {
          this.targetLane++;
          this.ctx.audio?.playMove?.();
        }
        break;
      case "MOVE_UP":
      case "ACTION_PRIMARY":
        // Jump Hurdle
        if (this.playerY === 0 && !this.isSliding) {
          this.playerVy = 620;
          this.ctx.audio?.playJump?.();
          globalParticles.emitBurst(this.playerX, 600, 8, ["#EA580C", "#FFFFFF"], 40, 140);
        }
        break;
      case "MOVE_DOWN":
      case "ACTION_SECONDARY":
        // Slide / Duck
        if (!this.isSliding) {
          this.isSliding = true;
          this.slideTimer = 0.5;
          if (this.playerY > 0) this.playerVy = -900; // fast slam down
          this.ctx.audio?.playRotate?.();
          globalParticles.emitBurst(this.playerX, 600, 6, ["#93C5FD", "#FFFFFF"], 30, 120);
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
    pr.clear("#18092B"); // Deep Violet Twilight

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Pixelated Synthwave Sunset Sky
    const skyBands = [
      { y: 0, h: 60, col: "#1E0B36" },
      { y: 60, h: 50, col: "#3B0764" },
      { y: 110, h: 45, col: "#701A75" },
      { y: 155, h: 40, col: "#9D174D" },
      { y: 195, h: 35, col: "#BE185D" },
      { y: 230, h: 30, col: "#EA580C" },
      { y: 260, h: 20, col: "#F97316" },
    ];
    for (const band of skyBands) {
      pr.drawRect(0, band.y, w, band.h, band.col, true);
    }

    // Giant Pixel Sunset Sun on Horizon (with horizontal scanline slice bands)
    const sunX = 300;
    const sunY = 220;
    const sunR = 56;
    pr.drawCircle(sunX, sunY, sunR, "#FDE047", true);
    pr.drawCircle(sunX, sunY, sunR, "#F59E0B", false);
    // Sun Horizon Cut Slices
    for (let sy = sunY - sunR + 14; sy < sunY + sunR; sy += 12) {
      pr.drawRect(sunX - sunR - 4, sy, (sunR + 4) * 2, 4, "#701A75", true);
    }

    // Distant Mountain Ridges & City Horizon
    pr.drawRect(40, 240, 120, 40, "#1E0B36", true);
    pr.drawRect(180, 230, 80, 50, "#1E0B36", true);
    pr.drawRect(340, 235, 110, 45, "#1E0B36", true);
    pr.drawRect(470, 245, 100, 35, "#1E0B36", true);

    // 2. 3D Perspective Road Track
    const horizonY = 270;
    const baseY = 660;
    const roadTopW = 70;
    const roadBotW = 460;

    // Road Ground Base (Dark Asphalt Highway)
    pr.drawRect(0, horizonY, w, h - horizonY, "#090314", true);

    // Highway Curbs (Neon Cyan & Magenta)
    pr.drawLine(300 - roadTopW / 2, horizonY, 300 - roadBotW / 2, baseY, "#00F0FF", 3);
    pr.drawLine(300 + roadTopW / 2, horizonY, 300 + roadBotW / 2, baseY, "#00F0FF", 3);

    // Lane Dividers
    const leftTop = 300 - roadTopW / 6;
    const leftBot = 300 - roadBotW / 6;
    const rightTop = 300 + roadTopW / 6;
    const rightBot = 300 + roadBotW / 6;
    pr.drawLine(leftTop, horizonY, leftBot, baseY, "rgba(234, 88, 12, 0.4)", 2);
    pr.drawLine(rightTop, horizonY, rightBot, baseY, "rgba(234, 88, 12, 0.4)", 2);

    // Perspective Highway Speed Lines
    for (let i = 0; i < 9; i++) {
      const p = (i * 0.111 + (this.distance * 0.003) % 0.111);
      const y = horizonY + (baseY - horizonY) * (p * p);
      const rw = roadTopW + (roadBotW - roadTopW) * p;
      pr.drawLine(300 - rw / 2, y, 300 + rw / 2, y, "rgba(253, 224, 71, 0.25)", 1.5);
    }

    // 3. Draw 3D Perspective Obstacles (Sorted from back to front)
    const sortedObs = [...this.obstacles].sort((a, b) => b.z - a.z);

    for (const obs of sortedObs) {
      const p = 1 - obs.z / 950;
      if (p <= 0 || p >= 1) continue;

      const y = horizonY + (baseY - horizonY) * (p * p);
      const rw = roadTopW + (roadBotW - roadTopW) * p;
      const laneOffsets = [-rw / 3, 0, rw / 3];
      const ox = 300 + laneOffsets[obs.lane];
      const sz = Math.max(10, 48 * p);

      if (obs.type === "crystal") {
        // Glowing Gold Diamond Gem
        pr.drawCircle(ox, y - sz * 0.8, sz * 0.5, "#FFD84D", true);
        pr.drawCircle(ox, y - sz * 0.8, sz * 0.25, "#FFFFFF", true);
        pr.drawCircle(ox, y - sz * 0.8, sz * 0.6, "rgba(254, 240, 138, 0.4)", false);
      } else if (obs.type === "jump_bar") {
        // High Neon Laser Crossbar (Slide Under!)
        const barW = rw / 3.2;
        pr.drawRect(ox - barW / 2, y - sz * 1.2, barW, 6 * p + 2, "#38BDF8", true);
        pr.drawRect(ox - barW / 2, y - sz * 1.2 + 2, barW, 2, "#FFFFFF", true);
        // Vertical support posts
        pr.drawRect(ox - barW / 2, y - sz * 1.2, 4 * p, sz * 1.2, "#0284C7", true);
        pr.drawRect(ox + barW / 2 - 4 * p, y - sz * 1.2, 4 * p, sz * 1.2, "#0284C7", true);
      } else if (obs.type === "barrier") {
        // Traffic Construction Roadblock (Red & White Stripes)
        const bW = rw / 3.4;
        const bH = sz * 0.9;
        pr.drawPixelBlock(ox - bW / 2, y - bH, bW, "#DC2626", "#F87171", "#7F1D1D");
        // White Warning Chevrons
        pr.drawRect(ox - bW * 0.3, y - bH + 4, bW * 0.2, bH - 8, "#FFFFFF", true);
        pr.drawRect(ox + bW * 0.1, y - bH + 4, bW * 0.2, bH - 8, "#FFFFFF", true);
        // Flashing Hazard Light
        pr.drawCircle(ox, y - bH - 4, 3 * p + 2, "#F59E0B", true);
      } else {
        // Spiked Ground Barrel / Rolling Tire Hazard
        pr.drawCircle(ox, y - sz * 0.4, sz * 0.4, "#B45309", true);
        pr.drawCircle(ox, y - sz * 0.4, sz * 0.25, "#F59E0B", true);
        pr.drawCircle(ox, y - sz * 0.4, sz * 0.4, "#000000", false);
      }
    }

    // 4. Render Global Particle Bursts
    globalParticles.render(pr);

    // 5. Draw Athletic Runner Character from Behind POV (Matching User Image)
    const px = this.playerX;
    const py = 600 - this.playerY;
    const isJumping = this.playerY > 0;

    drawRunnerBehindSprite(
      pr,
      px,
      py,
      1.15,
      this.animTime,
      isJumping,
      this.isSliding
    );

    // 6. Top Retro Synthwave HUD
    pr.drawRect(0, 0, w, 52, "#0F051D", true);
    pr.drawLine(0, 52, w, 52, "#3B0764", 1.5);

    pr.drawText(`DIST: ${Math.floor(this.distance / 10)}m`, 20, 30, { size: 12, color: "#FFD84D", font: "monospace" });
    pr.drawText(`OMEGA RUN • LVL ${this.level}`, w / 2, 30, { size: 13, color: "#F97316", align: "center", font: "monospace" });
    pr.drawText(`GEMS: ${this.coins}  •  SCORE: ${this.score}`, w - 20, 30, { size: 12, color: "#38BDF8", align: "right", font: "monospace" });

    // Controls Legend Footer
    pr.drawRect(16, h - 26, w - 32, 18, "rgba(15, 5, 29, 0.85)", true);
    pr.drawText(
      "[← → : SWITCH LANES  •  ↑/SPACE: JUMP  •  ↓: SLIDE UNDER BARS]",
      w / 2,
      h - 13,
      {
        size: 9,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      }
    );

    // Crash Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(15, 5, 29, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#DC2626", false);
      pr.drawText("CRASH DETECTED — RUN OVER", w / 2, h / 2 - 10, { size: 22, color: "#DC2626", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] OR [SPACE] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
