import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface Obstacle {
  lane: number;
  x: number;
  speed: number;
  size: number;
  isLog: boolean;
  color: string;
}

export class RoadHopperGame implements GameInstance {
  private ctx!: GameContext;

  private score: number = 0;
  private level: number = 1;
  private lives: number = 4;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  private player = { x: 5, y: 13, targetX: 5, targetY: 13, jumpT: 0 };
  private totalLanes: number = 14;
  private maxProgressY: number = 13;
  private obstacles: Obstacle[] = [];
  private time: number = 0;
  private loopCount: number = 0;

  // 14 Lane Biomes:
  // 13: Start Grass
  // 12, 11, 10: Highway Traffic (Cars, Vans, Semis)
  // 9: Median Rest Strip
  // 8, 7, 6: Rapid River (Floating Logs & Lily Pads)
  // 5: Desert Road Median
  // 4, 3: High-speed Railroad (Cargo Express & Maglevs)
  // 2: Cyber City Parkway
  // 1: Checkpoint / Gateway to Next Endless Sector
  // 0: Victory Portal (Seamlessly loops player back to 13 with +Level & +Speed)

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.lives = 4;
    this.gameOver = false;
    this.isPaused = false;
    this.time = 0;
    this.loopCount = 0;
    this.resetPlayer();
    this.spawnObstacles();
  }

  private resetPlayer(): void {
    this.player = { x: 5, y: 13, targetX: 5, targetY: 13, jumpT: 0 };
    this.maxProgressY = 13;
  }

  private spawnObstacles(): void {
    this.obstacles = [];
    const spd = 2.2 + this.level * 0.4;

    // Highway Lanes (12, 11, 10)
    this.obstacles.push({ lane: 12, x: 0, speed: spd * 1.1, size: 2.2, isLog: false, color: "#EF4444" });
    this.obstacles.push({ lane: 12, x: 6, speed: spd * 1.1, size: 2.2, isLog: false, color: "#EF4444" });
    this.obstacles.push({ lane: 11, x: 2, speed: -spd * 1.4, size: 1.6, isLog: false, color: "#F59E0B" });
    this.obstacles.push({ lane: 11, x: 8, speed: -spd * 1.4, size: 1.6, isLog: false, color: "#F59E0B" });
    this.obstacles.push({ lane: 10, x: 1, speed: spd * 1.8, size: 1.4, isLog: false, color: "#00F0FF" });
    this.obstacles.push({ lane: 10, x: 6, speed: spd * 1.8, size: 1.4, isLog: false, color: "#00F0FF" });

    // River Lanes (8, 7, 6)
    const logLen = Math.max(2.0, 3.2 - this.level * 0.15);
    this.obstacles.push({ lane: 8, x: 0, speed: spd * 0.9, size: logLen, isLog: true, color: "#92400E" });
    this.obstacles.push({ lane: 8, x: 6, speed: spd * 0.9, size: logLen, isLog: true, color: "#92400E" });
    this.obstacles.push({ lane: 7, x: 2, speed: -spd * 1.2, size: logLen + 0.5, isLog: true, color: "#78350F" });
    this.obstacles.push({ lane: 7, x: 7, speed: -spd * 1.2, size: logLen + 0.5, isLog: true, color: "#78350F" });
    this.obstacles.push({ lane: 6, x: 1, speed: spd * 1.4, size: logLen, isLog: true, color: "#92400E" });
    this.obstacles.push({ lane: 6, x: 7, speed: spd * 1.4, size: logLen, isLog: true, color: "#92400E" });

    // High-speed Railroad Lanes (4, 3)
    this.obstacles.push({ lane: 4, x: 0, speed: spd * 2.2, size: 3.5, isLog: false, color: "#A855F7" });
    this.obstacles.push({ lane: 3, x: 4, speed: -spd * 2.5, size: 4.0, isLog: false, color: "#EC4899" });

    // Cyber Expressway Lane (2)
    this.obstacles.push({ lane: 2, x: 2, speed: spd * 2.0, size: 1.8, isLog: false, color: "#ffd84d" });
    this.obstacles.push({ lane: 2, x: 8, speed: spd * 2.0, size: 1.8, isLog: false, color: "#ffd84d" });
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;
    this.time += dt;

    let onLog = false;
    let logSpeed = 0;

    for (const obs of this.obstacles) {
      obs.x += obs.speed * dt;
      if (obs.x > 12 && obs.speed > 0) obs.x = -obs.size;
      if (obs.x < -obs.size && obs.speed < 0) obs.x = 12;

      if (this.player.y === obs.lane) {
        if (this.player.x >= obs.x - 0.3 && this.player.x <= obs.x + obs.size - 0.2) {
          if (obs.isLog) {
            onLog = true;
            logSpeed = obs.speed;
          } else {
            this.die();
            return;
          }
        }
      }
    }

    // River drowning check (lanes 6, 7, 8)
    if (this.player.y >= 6 && this.player.y <= 8) {
      if (!onLog) {
        this.die();
        return;
      }
      this.player.x += logSpeed * dt;
      if (this.player.x < -0.5 || this.player.x > 11.5) {
        this.die();
        return;
      }
    }

    // Smooth hop animation
    if (this.player.jumpT > 0) {
      this.player.jumpT = Math.max(0, this.player.jumpT - dt * 6);
    }

    // Seamless loop check: Reaching lane 0 triggers endless loop back to lane 13
    if (this.player.y <= 0) {
      this.loopCount++;
      this.level++;
      this.score += 2000 * this.level;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 100, 24, ["#10B981", "#ffd84d", "#00F0FF"], 80, 280);
      globalParticles.emitText(`SECTOR ${this.loopCount + 1} CLEARED!`, 300, 80, "#ffd84d", 18);

      // Loop player seamlessly back to starting grass
      this.player.y = 13;
      this.player.targetY = 13;
      this.maxProgressY = 13;
      this.spawnObstacles();
    }
  }

  private die(): void {
    this.lives--;
    this.ctx.audio?.playGameOver?.();
    const cellSize = 42;
    const offX = 30;
    const offY = 60;
    globalParticles.emitBurst(
      offX + this.player.x * cellSize + cellSize / 2,
      offY + this.player.y * cellSize + cellSize / 2,
      20,
      ["#22C55E", "#EF4444", "#FFFFFF"],
      70,
      260
    );

    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      this.resetPlayer();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    let moved = false;
    if (action === "MOVE_UP" && this.player.y > 0) {
      this.player.y--;
      this.player.jumpT = 1;
      moved = true;
      if (this.player.y < this.maxProgressY) {
        this.maxProgressY = this.player.y;
        this.score += 20 * this.level;
      }
    } else if (action === "MOVE_DOWN" && this.player.y < 13) {
      this.player.y++;
      this.player.jumpT = 1;
      moved = true;
    } else if (action === "MOVE_LEFT" && this.player.x > 0) {
      this.player.x = Math.max(0, Math.floor(this.player.x) - 1);
      this.player.jumpT = 1;
      moved = true;
    } else if (action === "MOVE_RIGHT" && this.player.x < 10) {
      this.player.x = Math.min(10, Math.floor(this.player.x) + 1);
      this.player.jumpT = 1;
      moved = true;
    }

    if (moved) {
      this.ctx.audio?.playHit?.();
    }

    if (action === "RESTART") this.reset();
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

    const cellSize = 42;
    const offX = Math.floor((w - 11 * cellSize) / 2);
    const offY = 50;

    // Stage border
    pr.drawRect(offX - 4, offY - 4, 11 * cellSize + 8, this.totalLanes * cellSize + 8, "#1e293b", false);

    // 1. Draw Multi-Biome Terrain Backgrounds
    for (let lane = 0; lane < this.totalLanes; lane++) {
      const ly = offY + lane * cellSize;

      if (lane === 0) {
        // Sector Goal Gateway
        pr.drawRect(offX, ly, 11 * cellSize, cellSize, "#065F46", true);
        pr.drawRect(offX, ly, 11 * cellSize, cellSize, "#10B981", false);
        pr.drawText("★ NEXT SECTOR PORTAL ★", w / 2, ly + cellSize / 2 + 4, { size: 12, color: "#A7F3D0", align: "center", font: "monospace" });
      } else if (lane === 1 || lane === 5 || lane === 9 || lane === 13) {
        // Safe Grassy Median
        const grassCol = lane === 5 ? "#78350F" : "#14532D";
        pr.drawRect(offX, ly, 11 * cellSize, cellSize, grassCol, true);
        // Grass tufts
        for (let gx = offX + 10; gx < offX + 11 * cellSize; gx += 30) {
          pr.drawRect(gx, ly + 8, 3, 6, "#22C55E", true);
          pr.drawRect(gx + 4, ly + 6, 3, 8, "#4ADE80", true);
        }
      } else if (lane >= 6 && lane <= 8) {
        // Rushing Blue River
        pr.drawRect(offX, ly, 11 * cellSize, cellSize, "#0C4A6E", true);
        // Water current ripples
        const rippleShift = Math.sin(this.time * 4 + lane) * 12;
        for (let rx = offX + 15; rx < offX + 11 * cellSize; rx += 45) {
          pr.drawRect(rx + rippleShift, ly + cellSize / 2, 16, 2, "#38BDF8", true);
        }
      } else if (lane >= 3 && lane <= 4) {
        // High-Speed Train Railroad
        pr.drawRect(offX, ly, 11 * cellSize, cellSize, "#1E293B", true);
        // Steel Rails & Ties
        pr.drawRect(offX, ly + 8, 11 * cellSize, 3, "#94A3B8", true);
        pr.drawRect(offX, ly + cellSize - 11, 11 * cellSize, 3, "#94A3B8", true);
        for (let tx = offX + 8; tx < offX + 11 * cellSize; tx += 20) {
          pr.drawRect(tx, ly + 4, 4, cellSize - 8, "#475569", true);
        }
      } else {
        // Asphalt Highway (Lanes 10, 11, 12 and 2)
        pr.drawRect(offX, ly, 11 * cellSize, cellSize, "#0F172A", true);
        // Dashed lane dividers
        for (let dx = offX + 10; dx < offX + 11 * cellSize; dx += 32) {
          pr.drawRect(dx, ly + cellSize - 2, 16, 2, "#FDE047", true);
        }
      }
    }

    // 2. Draw Moving Obstacles (Logs, Cars, Trains)
    for (const obs of this.obstacles) {
      const ox = offX + obs.x * cellSize;
      const oy = offY + obs.lane * cellSize;
      const oWidth = obs.size * cellSize;

      if (obs.isLog) {
        // Textured Floating Timber Log
        pr.drawPixelRect(ox, oy + 6, oWidth, cellSize - 12, "#78350F", "#A16207", "#451A03");
        pr.drawCircle(ox + 6, oy + cellSize / 2, 6, "#D97706", true);
        pr.drawCircle(ox + oWidth - 6, oy + cellSize / 2, 6, "#D97706", true);
      } else if (obs.lane >= 3 && obs.lane <= 4) {
        // High-speed Express Train Car
        pr.drawPixelRect(ox, oy + 4, oWidth, cellSize - 8, obs.color, "#FFFFFF", "#0F172A");
        // Train Windows
        for (let wx = ox + 8; wx < ox + oWidth - 8; wx += 16) {
          pr.drawRect(wx, oy + 10, 8, 8, "#38BDF8", true);
        }
      } else {
        // Sports Car with Headlights
        pr.drawPixelRect(ox, oy + 6, oWidth, cellSize - 12, obs.color, "#FFFFFF", "#0F172A");
        // Windshield & Headlights
        pr.drawRect(ox + (obs.speed > 0 ? oWidth - 10 : 4), oy + 10, 6, cellSize - 20, "#E0F2FE", true);
        const headX = obs.speed > 0 ? ox + oWidth - 2 : ox;
        pr.drawRect(headX, oy + 9, 3, 4, "#FEF08A", true);
        pr.drawRect(headX, oy + cellSize - 13, 3, 4, "#FEF08A", true);
      }
    }

    // 3. Draw Player Frog with Squash-and-Stretch Jump Animation
    const px = offX + this.player.x * cellSize + cellSize / 2;
    const py = offY + this.player.y * cellSize + cellSize / 2;
    const jumpOffset = Math.sin(this.player.jumpT * Math.PI) * 10;

    // Frog Body (Green/Lime)
    pr.drawPixelBlock(px - 14, py - 14 - jumpOffset, 28, "#22C55E", "#86EFAC", "#15803D");
    // Big Animated Frog Eyes
    pr.drawCircle(px - 8, py - 14 - jumpOffset, 5, "#FFFFFF", true);
    pr.drawCircle(px + 8, py - 14 - jumpOffset, 5, "#FFFFFF", true);
    pr.drawCircle(px - 8, py - 14 - jumpOffset, 2, "#000000", true);
    pr.drawCircle(px + 8, py - 14 - jumpOffset, 2, "#000000", true);

    // Render Particles & Popups
    globalParticles.render(pr);

    // Top HUD
    pr.drawRect(12, 12, w - 24, 28, "rgba(8, 14, 28, 0.8)", true);
    pr.drawRect(12, 12, w - 24, 28, "#1e293b", false);
    pr.drawText(
      `SCORE: ${this.score}  •  SECTOR: ${this.level}  •  LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`,
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
      pr.drawText("ROAD RUN OVER — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
