import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

export type LaneType =
  | "grass"
  | "road"
  | "highway"
  | "river"
  | "railroad"
  | "desert"
  | "snow"
  | "cyber";

interface Obstacle {
  x: number;
  speed: number;
  width: number;
  type: "car" | "truck" | "log" | "lilypad" | "train" | "iceberg" | "hovercar";
  color: string;
}

interface TerrainLane {
  laneIndex: number; // Row index (increasing as player moves forward)
  type: LaneType;
  obstacles: Obstacle[];
  hasCoins: boolean;
  coinX: number;
  trainWarningTimer: number; // For railroad warning lights
}

export class RoadHopperGame implements GameInstance {
  private ctx!: GameContext;

  private score: number = 0;
  private coins: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  // Player position (Grid units: x: 0..10, y: 0..infinity forward)
  private playerX: number = 5;
  private playerY: number = 0;
  private targetX: number = 5;
  private targetY: number = 0;
  private jumpProgress: number = 0; // 0..1 during hop
  private jumpDirection: "up" | "down" | "left" | "right" = "up";
  private maxReachedY: number = 0;

  // Smooth Scrolling Camera
  private cameraY: number = 0; // Tracks smooth world Y

  // Dynamic Procedural Terrain Lanes
  private lanes: TerrainLane[] = [];
  private highestGeneratedLane: number = 0;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.coins = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;

    this.playerX = 5;
    this.playerY = 0;
    this.targetX = 5;
    this.targetY = 0;
    this.jumpProgress = 0;
    this.maxReachedY = 0;
    this.cameraY = 0;

    this.lanes = [];
    this.highestGeneratedLane = -4; // Generate from -4 up to 20

    // Initial safe zone and starting terrain
    for (let l = -4; l <= 20; l++) {
      this.generateLane(l);
    }
  }

  private generateLane(index: number): void {
    let type: LaneType = "grass";

    if (index <= 1) {
      type = "grass"; // Safe start zone
    } else {
      // Procedural biome cycling based on forward distance
      const biomePhase = Math.floor(index / 10) % 5;
      const roll = this.ctx.random.next();

      if (biomePhase === 0) {
        // Temperate Meadow & Highway
        type = roll < 0.25 ? "grass" : roll < 0.65 ? "road" : roll < 0.85 ? "river" : "railroad";
      } else if (biomePhase === 1) {
        // Desert Dunes & Express Highway
        type = roll < 0.2 ? "desert" : roll < 0.6 ? "highway" : roll < 0.85 ? "river" : "railroad";
      } else if (biomePhase === 2) {
        // Glacier Tundra & Freezing River Rapids
        type = roll < 0.25 ? "snow" : roll < 0.65 ? "river" : roll < 0.85 ? "road" : "railroad";
      } else if (biomePhase === 3) {
        // Rapid Multi-River Delta
        type = roll < 0.15 ? "grass" : roll < 0.65 ? "river" : roll < 0.85 ? "highway" : "railroad";
      } else {
        // Cyber City Expressway
        type = roll < 0.2 ? "cyber" : roll < 0.6 ? "highway" : roll < 0.85 ? "railroad" : "river";
      }
    }

    const obstacles: Obstacle[] = [];
    const baseSpeed = (1.4 + this.ctx.random.next() * 1.8 + this.level * 0.15) * (this.ctx.random.next() > 0.5 ? 1 : -1);

    if (type === "road" || type === "highway" || type === "cyber") {
      const isTruck = this.ctx.random.next() > 0.6;
      const obsType = type === "cyber" ? "hovercar" : isTruck ? "truck" : "car";
      const w = isTruck ? 2.4 : 1.5;
      const col = type === "cyber" ? "#00F0FF" : isTruck ? "#3B82F6" : ["#EF4444", "#F59E0B", "#10B981", "#EC4899"][Math.floor(this.ctx.random.next() * 4)];

      // 2 to 3 vehicles spaced across lane
      obstacles.push({ x: this.ctx.random.next() * 3, speed: baseSpeed, width: w, type: obsType, color: col });
      obstacles.push({ x: 5 + this.ctx.random.next() * 3, speed: baseSpeed, width: w, type: obsType, color: col });
    } else if (type === "river") {
      const isIce = index % 20 > 15;
      const obsType = isIce ? "iceberg" : this.ctx.random.next() > 0.3 ? "log" : "lilypad";
      const logLen = obsType === "lilypad" ? 1.0 : isIce ? 1.8 : 2.5;
      const col = isIce ? "#38BDF8" : obsType === "lilypad" ? "#10B981" : "#78350F";

      obstacles.push({ x: this.ctx.random.next() * 2, speed: baseSpeed * 0.85, width: logLen, type: obsType, color: col });
      obstacles.push({ x: 4.5 + this.ctx.random.next() * 2, speed: baseSpeed * 0.85, width: logLen, type: obsType, color: col });
      obstacles.push({ x: 8.5 + this.ctx.random.next() * 2, speed: baseSpeed * 0.85, width: logLen, type: obsType, color: col });
    } else if (type === "railroad") {
      // High-speed express trains that rush past periodically
      const trainSpeed = (baseSpeed > 0 ? 1 : -1) * (5.5 + this.level * 0.4);
      obstacles.push({ x: -15, speed: trainSpeed, width: 6.0, type: "train", color: "#DC2626" });
    }

    const hasCoins = this.ctx.random.next() < 0.35 && type !== "river";
    const coinX = Math.floor(this.ctx.random.next() * 9) + 1;

    this.lanes.push({
      laneIndex: index,
      type,
      obstacles,
      hasCoins,
      coinX,
      trainWarningTimer: 0,
    });

    this.highestGeneratedLane = Math.max(this.highestGeneratedLane, index);
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;

    // 1. Smooth Camera Tracking following player forward
    const targetCamY = this.playerY - 3;
    this.cameraY += (targetCamY - this.cameraY) * 6 * dt;

    // 2. Procedurally generate forward lanes as camera advances
    while (this.highestGeneratedLane < this.playerY + 16) {
      this.generateLane(this.highestGeneratedLane + 1);
    }

    // Cull old lanes far behind camera to preserve memory
    if (this.lanes.length > 40) {
      this.lanes = this.lanes.filter((l) => l.laneIndex >= this.playerY - 8);
    }

    // 3. Smooth Player Hop Interpolation
    if (this.jumpProgress > 0) {
      this.jumpProgress = Math.max(0, this.jumpProgress - dt * 9);
      if (this.jumpProgress === 0) {
        this.playerX = this.targetX;
        this.playerY = this.targetY;
        globalParticles.emitBurst((this.playerX + 0.5) * 50 + 25, 540, 4, ["#10B981", "#FFFFFF"], 20, 80);
      }
    }

    // 4. Update Obstacles and Collisions
    const currentLane = this.lanes.find((l) => l.laneIndex === this.playerY);
    let onFloatingPlatform = false;
    let platformDriftSpeed = 0;

    for (const lane of this.lanes) {
      // Railroad warning flash when train approaches
      if (lane.type === "railroad") {
        for (const obs of lane.obstacles) {
          if (obs.type === "train") {
            const approaching = (obs.speed > 0 && obs.x > -8 && obs.x < 11) || (obs.speed < 0 && obs.x < 19 && obs.x > 0);
            if (approaching) lane.trainWarningTimer = 1.0;
            else if (lane.trainWarningTimer > 0) lane.trainWarningTimer -= dt;
          }
        }
      }

      for (const obs of lane.obstacles) {
        obs.x += obs.speed * dt;

        // Wrap around screen boundaries
        if (obs.speed > 0 && obs.x > 14) obs.x = -obs.width - 2;
        if (obs.speed < 0 && obs.x < -obs.width - 2) obs.x = 14;

        // Check Collision with Player on this lane
        if (lane.laneIndex === this.playerY && this.jumpProgress === 0) {
          const isIntersecting = this.playerX >= obs.x - 0.35 && this.playerX <= obs.x + obs.width - 0.45;

          if (isIntersecting) {
            if (obs.type === "log" || obs.type === "lilypad" || obs.type === "iceberg") {
              onFloatingPlatform = true;
              platformDriftSpeed = obs.speed;
            } else {
              // Hit by vehicle or train!
              this.handlePlayerDeath("SQUASHED BY TRAFFIC");
              return;
            }
          }
        }
      }

      // Coin Collection
      if (lane.hasCoins && lane.laneIndex === this.playerY && Math.abs(this.playerX - lane.coinX) < 0.6) {
        lane.hasCoins = false;
        this.coins++;
        this.score += 150;
        this.ctx.audio?.playCoin?.();
        globalParticles.emitBurst((lane.coinX + 0.5) * 50 + 25, 400, 12, ["#FFD84D", "#FFFFFF", "#F59E0B"], 50, 160);
        globalParticles.emitText("+150", (lane.coinX + 0.5) * 50 + 25, 380, "#FFD84D", 14);
      }
    }

    // River Drowning Check
    if (currentLane && currentLane.type === "river" && this.jumpProgress === 0) {
      if (!onFloatingPlatform) {
        this.handlePlayerDeath("DROWNED IN RIVER RAPIDS");
        return;
      } else {
        // Drift with the log / lilypad
        this.playerX += platformDriftSpeed * dt;
        this.targetX = this.playerX;

        // River boundary drowning
        if (this.playerX < -0.5 || this.playerX > 11.5) {
          this.handlePlayerDeath("SWEPT AWAY OFF-SCREEN");
          return;
        }
      }
    }
  }

  private handlePlayerDeath(cause: string): void {
    this.lives--;
    this.ctx.audio?.playExplosion?.();
    globalParticles.emitBurst((this.playerX + 0.5) * 50 + 25, 520, 26, ["#10B981", "#EF4444", "#FFFFFF"], 80, 260);

    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      // Respawn at safe start on current distance
      this.targetY = Math.max(0, this.playerY - 2);
      this.playerY = this.targetY;
      this.playerX = 5;
      this.targetX = 5;
      this.jumpProgress = 0;
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) {
      if (action === "RESTART" && isPressed) this.reset();
      return;
    }

    if (this.jumpProgress > 0.4) return; // Prevent input spam during mid-air leap

    switch (action) {
      case "MOVE_UP":
      case "ACTION_PRIMARY":
        this.jumpDirection = "up";
        this.targetY = this.playerY + 1;
        this.jumpProgress = 1.0;
        this.ctx.audio?.playJump?.();

        if (this.targetY > this.maxReachedY) {
          this.maxReachedY = this.targetY;
          this.score += 25 * this.level;
          this.level = Math.min(20, Math.floor(this.maxReachedY / 15) + 1);
        }
        break;

      case "MOVE_DOWN":
        if (this.playerY > Math.max(0, Math.floor(this.cameraY) - 1)) {
          this.jumpDirection = "down";
          this.targetY = this.playerY - 1;
          this.jumpProgress = 1.0;
          this.ctx.audio?.playJump?.();
        }
        break;

      case "MOVE_LEFT":
        if (this.playerX > 0) {
          this.jumpDirection = "left";
          this.targetX = Math.max(0, this.playerX - 1);
          this.jumpProgress = 1.0;
          this.ctx.audio?.playJump?.();
        }
        break;

      case "MOVE_RIGHT":
        if (this.playerX < 10) {
          this.jumpDirection = "right";
          this.targetX = Math.min(10, this.playerX + 1);
          this.jumpProgress = 1.0;
          this.ctx.audio?.playJump?.();
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
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = pr.getWidth();
    const h = pr.getHeight();

    const laneH = 46;
    const laneW = w;
    const gridCols = 11;
    const cellW = laneW / gridCols; // Approx 54px per grid cell

    // Viewport camera origin
    const originScreenY = h - 120;

    // 1. Draw Procedural Scrolling Terrain Lanes
    for (const lane of this.lanes) {
      const screenY = originScreenY - (lane.laneIndex - this.cameraY) * laneH;
      if (screenY < -laneH || screenY > h + laneH) continue;

      // Draw Base Lane Terrain
      switch (lane.type) {
        case "grass":
          pr.drawRect(0, screenY, w, laneH, "#15803D", true);
          pr.drawRect(0, screenY + laneH - 3, w, 3, "#166534", true);
          // Little flower / grass blades
          for (let gx = 10; gx < w; gx += 45) {
            pr.drawCircle(gx, screenY + 12, 2.5, "#86EFAC", true);
          }
          break;

        case "road":
          pr.drawRect(0, screenY, w, laneH, "#1E293B", true);
          pr.drawRect(0, screenY, w, 2, "#475569", true);
          pr.drawRect(0, screenY + laneH - 2, w, 2, "#475569", true);
          // White Dashed Center Line
          for (let dx = 15; dx < w; dx += 40) {
            pr.drawRect(dx, screenY + laneH / 2 - 1, 20, 2, "#F8FAFC", true);
          }
          break;

        case "highway":
          pr.drawRect(0, screenY, w, laneH, "#0F172A", true);
          pr.drawRect(0, screenY, w, 3, "#EF4444", true); // Red Curb
          pr.drawRect(0, screenY + laneH - 3, w, 3, "#EF4444", true);
          // Double Yellow Speed Strips
          for (let dx = 20; dx < w; dx += 45) {
            pr.drawRect(dx, screenY + laneH / 2 - 2, 24, 2, "#FACC15", true);
            pr.drawRect(dx, screenY + laneH / 2 + 2, 24, 2, "#FACC15", true);
          }
          break;

        case "river":
          pr.drawRect(0, screenY, w, laneH, "#0284C7", true);
          pr.drawRect(0, screenY + laneH - 3, w, 3, "#0369A1", true);
          // Water Flow Waves
          for (let rx = 10; rx < w; rx += 50) {
            const waveOffset = Math.sin(this.animTime * 4 + rx) * 3;
            pr.drawLine(rx, screenY + 14 + waveOffset, rx + 24, screenY + 14 + waveOffset, "rgba(255,255,255,0.3)", 2);
          }
          break;

        case "railroad":
          pr.drawRect(0, screenY, w, laneH, "#78716C", true); // Gravel Ballast
          // Wooden Ties
          for (let rx = 12; rx < w; rx += 28) {
            pr.drawRect(rx, screenY + 4, 8, laneH - 8, "#44403C", true);
          }
          // Steel Tracks
          pr.drawRect(0, screenY + 10, w, 3, "#E2E8F0", true);
          pr.drawRect(0, screenY + laneH - 13, w, 3, "#E2E8F0", true);

          // Railroad Flashing Warning Light
          if (lane.trainWarningTimer > 0) {
            const flash = Math.sin(this.animTime * 20) > 0;
            pr.drawCircle(25, screenY + 8, 5, flash ? "#EF4444" : "#7F1D1D", true);
            pr.drawCircle(w - 25, screenY + 8, 5, flash ? "#EF4444" : "#7F1D1D", true);
          }
          break;

        case "desert":
          pr.drawRect(0, screenY, w, laneH, "#D97706", true);
          pr.drawRect(0, screenY + laneH - 3, w, 3, "#B45309", true);
          for (let sx = 20; sx < w; sx += 60) {
            pr.drawCircle(sx, screenY + 14, 3, "#FEF3C7", true);
          }
          break;

        case "snow":
          pr.drawRect(0, screenY, w, laneH, "#E0F2FE", true);
          pr.drawRect(0, screenY + laneH - 3, w, 3, "#BAE6FD", true);
          for (let fx = 15; fx < w; fx += 40) {
            pr.drawCircle(fx, screenY + 10, 2, "#FFFFFF", true);
          }
          break;

        case "cyber":
          pr.drawRect(0, screenY, w, laneH, "#0B1021", true);
          pr.drawRect(0, screenY, w, 2, "#00F0FF", true);
          pr.drawRect(0, screenY + laneH - 2, w, 2, "#A855F7", true);
          for (let cx = 10; cx < w; cx += 35) {
            pr.drawRect(cx, screenY + laneH / 2, 16, 2, "rgba(0,240,255,0.4)", true);
          }
          break;
      }

      // Draw Floating Coins
      if (lane.hasCoins) {
        const coinScreenX = lane.coinX * cellW + cellW / 2;
        const pulse = Math.sin(this.animTime * 6) * 2;
        pr.drawCircle(coinScreenX, screenY + laneH / 2, 7 + pulse, "#F59E0B", true);
        pr.drawCircle(coinScreenX, screenY + laneH / 2, 5 + pulse, "#FDE047", true);
        pr.drawCircle(coinScreenX, screenY + laneH / 2, 2, "#FFFFFF", true);
      }

      // Draw Obstacles (Vehicles, Logs, Lilypads, Trains)
      for (const obs of lane.obstacles) {
        const obsScreenX = obs.x * cellW;
        const obsScreenW = obs.width * cellW;

        if (obs.type === "car") {
          // Pixel Sports Car
          pr.drawPixelBlock(obsScreenX, screenY + 8, obsScreenW, obs.color, "#FFFFFF", "#0F172A");
          // Windshield & Wheels
          pr.drawRect(obsScreenX + 6, screenY + 12, obsScreenW - 12, 12, "#0F172A", true);
          pr.drawRect(obsScreenX + 4, screenY + laneH - 12, 8, 4, "#000000", true);
          pr.drawRect(obsScreenX + obsScreenW - 12, screenY + laneH - 12, 8, 4, "#000000", true);
          // Headlights
          const headX = obs.speed > 0 ? obsScreenX + obsScreenW - 4 : obsScreenX;
          pr.drawCircle(headX, screenY + 12, 3, "#FEF08A", true);
        } else if (obs.type === "truck") {
          // Heavy Cargo Truck
          pr.drawRect(obsScreenX, screenY + 6, obsScreenW, laneH - 12, obs.color, true);
          pr.drawRect(obsScreenX + 4, screenY + 10, obsScreenW - 8, laneH - 20, "#1E293B", true);
          // Cabin
          const cabX = obs.speed > 0 ? obsScreenX + obsScreenW - 18 : obsScreenX;
          pr.drawRect(cabX, screenY + 8, 18, laneH - 16, "#FFFFFF", true);
        } else if (obs.type === "train") {
          // High-Speed Express Bullet Train
          pr.drawRect(obsScreenX, screenY + 6, obsScreenW, laneH - 12, "#DC2626", true);
          pr.drawRect(obsScreenX, screenY + 14, obsScreenW, 6, "#FFFFFF", true); // White Stripe
          // Glowing Train Headlight
          const trainHeadX = obs.speed > 0 ? obsScreenX + obsScreenW : obsScreenX;
          pr.drawCircle(trainHeadX, screenY + laneH / 2, 6, "#FEF08A", true);
          pr.drawCircle(trainHeadX, screenY + laneH / 2, 12, "rgba(254, 240, 138, 0.2)", true);
        } else if (obs.type === "log") {
          // Floating Timber Log
          pr.drawRect(obsScreenX, screenY + 10, obsScreenW, laneH - 20, obs.color, true);
          pr.drawCircle(obsScreenX, screenY + laneH / 2, (laneH - 20) / 2, "#92400E", true);
          pr.drawCircle(obsScreenX + obsScreenW, screenY + laneH / 2, (laneH - 20) / 2, "#78350F", true);
          // Bark Grooves
          pr.drawLine(obsScreenX + 8, screenY + 16, obsScreenX + obsScreenW - 8, screenY + 16, "#451A03", 2);
        } else if (obs.type === "lilypad") {
          // Floating Green Lilypad
          pr.drawCircle(obsScreenX + obsScreenW / 2, screenY + laneH / 2, obsScreenW / 2, "#10B981", true);
          pr.drawCircle(obsScreenX + obsScreenW / 2, screenY + laneH / 2, obsScreenW / 3, "#34D399", true);
        } else if (obs.type === "hovercar") {
          // Cyber Hovercraft
          pr.drawPixelBlock(obsScreenX, screenY + 8, obsScreenW, "#00F0FF", "#E0F2FE", "#0284C7");
          pr.drawCircle(obsScreenX + obsScreenW / 2, screenY + laneH / 2, 4, "#A855F7", true);
        } else {
          // Iceberg
          pr.drawCircle(obsScreenX + obsScreenW / 2, screenY + laneH / 2, obsScreenW / 2, "#38BDF8", true);
          pr.drawCircle(obsScreenX + obsScreenW / 2 - 2, screenY + laneH / 2 - 2, obsScreenW / 3, "#FFFFFF", true);
        }
      }
    }

    // 2. Draw Squash-and-Stretch Animated Frog Player
    const curX = this.playerX + (this.targetX - this.playerX) * (1 - this.jumpProgress);
    const curY = this.playerY + (this.targetY - this.playerY) * (1 - this.jumpProgress);

    const px = curX * cellW + cellW / 2;
    const py = originScreenY - (curY - this.cameraY) * laneH + laneH / 2;

    // Aerial Leap Arch (Jump Height)
    const jumpArch = Math.sin(this.jumpProgress * Math.PI) * 16;
    const renderY = py - jumpArch;

    // Squash & Stretch calculation
    const isJumping = this.jumpProgress > 0;
    const scaleX = isJumping ? 0.85 : 1.15;
    const scaleY = isJumping ? 1.25 : 0.85;

    pr.save();
    pr.translate(px, renderY);
    pr.scale(scaleX, scaleY);

    // Frog Shadow (Grounded)
    pr.drawCircle(0, jumpArch + 12, 10, "rgba(0,0,0,0.3)", true);

    // Emerald Green Frog Body
    pr.drawCircle(0, 0, 12, "#10B981", true);
    pr.drawCircle(0, -2, 8, "#34D399", true); // Highlight back

    // Frog Big Round Eyes
    pr.drawCircle(-8, -10, 5, "#10B981", true);
    pr.drawCircle(8, -10, 5, "#10B981", true);
    pr.drawCircle(-8, -11, 3.5, "#FFFFFF", true);
    pr.drawCircle(8, -11, 3.5, "#FFFFFF", true);
    pr.drawCircle(-8, -11, 1.5, "#000000", true);
    pr.drawCircle(8, -11, 1.5, "#000000", true);

    // Webbed Frog Legs in Hop Pose
    if (isJumping) {
      // Extended jumping hind legs
      pr.drawRect(-14, 4, 6, 12, "#059669", true);
      pr.drawRect(8, 4, 6, 12, "#059669", true);
    } else {
      // Tucked crouched hind legs
      pr.drawCircle(-12, 4, 6, "#059669", true);
      pr.drawCircle(12, 4, 6, "#059669", true);
    }

    pr.restore();

    // 3. Render Global Particles
    globalParticles.render(pr);

    // 4. Top Retro Arcade HUD
    pr.drawRect(12, 12, w - 24, 38, "rgba(8, 14, 28, 0.9)", true);
    pr.drawRect(12, 12, w - 24, 38, "#1E293B", false);

    pr.drawText(`DIST: ${this.maxReachedY}m`, 24, 28, { size: 12, color: "#ffd84d", font: "monospace" });
    pr.drawText(`ROAD HOPPER • SECTOR ${this.level}`, w / 2, 28, { size: 13, color: "#10B981", align: "center", font: "monospace" });
    pr.drawText(`COINS: ${this.coins}  •  SCORE: ${this.score}`, w - 24, 28, { size: 12, color: "#38BDF8", align: "right", font: "monospace" });

    // Controls Legend Footer
    pr.drawRect(16, h - 26, w - 32, 18, "rgba(8, 14, 28, 0.85)", true);
    pr.drawText(
      "[ARROWS / WASD / SPACE: HOP FORWARD & NAVIGATE ENDLESS TERRAIN]",
      w / 2,
      h - 13,
      {
        size: 9,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      }
    );

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#EF4444", false);
      pr.drawText("ROAD HOP OVERRUN — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] OR [SPACE] TO HOP AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
