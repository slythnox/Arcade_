import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface Obstacle {
  lane: number; // 0, 1, 2
  z: number; // Distance down the track (0 to 1000)
  type: "barrier" | "jump_bar" | "crystal";
}

export class OmegaRunGame implements GameInstance {
  private ctx!: GameContext;
  private lane = 1; // 0 = Left, 1 = Center, 2 = Right
  private playerY = 0; // Vertical jump height
  private playerVy = 0;
  private isSliding = false;
  private slideTimer = 0;
  private speed = 400; // Track velocity
  private score = 0;
  private level = 1;
  private distance = 0;
  private gameOver = false;
  private isPaused = false;
  private obstacles: Obstacle[] = [];
  private spawnTimer = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.lane = 1;
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
    this.spawnTimer = 0;
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.distance += this.speed * dt;
    this.score += Math.floor(this.speed * dt * 0.1);
    this.speed = 380 + (this.level - 1) * 35;
    this.level = Math.min(20, Math.floor(this.distance / 1200) + 1);

    // Jump Physics
    if (this.playerY > 0 || this.playerVy !== 0) {
      this.playerY += this.playerVy * dt;
      this.playerVy -= 900 * dt; // Gravity
      if (this.playerY <= 0) {
        this.playerY = 0;
        this.playerVy = 0;
      }
    }

    // Slide Timer
    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) {
        this.isSliding = false;
      }
    }

    // Spawn Obstacles
    this.spawnTimer += dt;
    if (this.spawnTimer >= Math.max(0.65, 1.4 - this.level * 0.05)) {
      this.spawnTimer = 0;
      const lane = Math.floor(this.ctx.random.next() * 3);
      const rand = this.ctx.random.next();
      const type: Obstacle["type"] = rand < 0.35 ? "barrier" : rand < 0.65 ? "jump_bar" : "crystal";
      this.obstacles.push({ lane, z: 900, type });
    }

    // Update Obstacles position
    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i];
      obs.z -= this.speed * dt;

      // Collision Check when obstacle reaches player (z between 40 and 90)
      if (obs.z >= 40 && obs.z <= 90 && obs.lane === this.lane) {
        if (obs.type === "crystal") {
          this.score += 250;
          this.ctx.audio?.playCoin?.();
          this.obstacles.splice(i, 1);
          continue;
        } else if (obs.type === "barrier") {
          this.gameOver = true;
          this.ctx.audio?.playExplosion?.();
          return;
        } else if (obs.type === "jump_bar") {
          if (this.playerY < 25) {
            this.gameOver = true;
            this.ctx.audio?.playExplosion?.();
            return;
          }
        }
      }

      if (obs.z < 0) {
        this.obstacles.splice(i, 1);
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.gameOver) {
      if (action === "ACTION_PRIMARY" || action === "RESTART") this.reset();
      return;
    }

    if (action === "MOVE_LEFT") {
      if (this.lane > 0) {
        this.lane--;
        this.ctx.audio?.playMove?.();
      }
    } else if (action === "MOVE_RIGHT") {
      if (this.lane < 2) {
        this.lane++;
        this.ctx.audio?.playMove?.();
      }
    } else if (action === "MOVE_UP" || action === "ACTION_PRIMARY") {
      // Jump
      if (this.playerY === 0) {
        this.playerVy = 460;
        this.ctx.audio?.playRotate?.();
      }
    } else if (action === "MOVE_DOWN" || action === "ACTION_SECONDARY") {
      // Slide
      this.isSliding = true;
      this.slideTimer = 0.55;
      if (this.playerY > 0) this.playerVy = -600; // Fast drop
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
    pr.clear("#040711");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Perspective 3-Lane Track geometry
    const horizonY = 120;
    const bottomY = 560;
    const laneWidthBottom = 130;
    const laneWidthTop = 32;

    // Draw 3-Lane Grid Lines
    for (let l = 0; l <= 3; l++) {
      const xTop = w / 2 + (l - 1.5) * laneWidthTop;
      const xBottom = w / 2 + (l - 1.5) * laneWidthBottom;
      pr.drawLine(xTop, horizonY, xBottom, bottomY, "#1e355c", 2);
    }

    // Draw Perspective Obstacles
    for (const obs of this.obstacles) {
      const progress = 1 - obs.z / 900; // 0 = at horizon, 1 = at player
      const y = horizonY + progress * (bottomY - horizonY);
      const laneW = laneWidthTop + progress * (laneWidthBottom - laneWidthTop);
      const centerX = w / 2 + (obs.lane - 1) * laneW;
      const size = Math.max(8, Math.floor(progress * 42));

      if (obs.type === "crystal") {
        pr.drawRect(centerX - size / 2, y - size, size, size, "#ffd84d", true);
        pr.drawRect(centerX - size / 2, y - size, size, size, "#ffffff", false);
      } else if (obs.type === "jump_bar") {
        pr.drawRect(centerX - laneW * 0.45, y - size * 0.4, laneW * 0.9, size * 0.4, "#4de8e8", true);
      } else {
        // Barrier
        pr.drawRect(centerX - size / 2, y - size, size, size, "#ff5c8a", true);
        pr.drawRect(centerX - size / 2, y - size, size, size, "#ffffff", false);
      }
    }

    // Draw Player Ship / Runner
    const playerX = w / 2 + (this.lane - 1) * laneWidthBottom;
    const playerScreenY = bottomY - 30 - this.playerY;

    if (this.isSliding) {
      pr.drawRect(playerX - 22, playerScreenY + 12, 44, 16, "#4de8e8", true);
    } else {
      // Runner Body
      pr.drawRect(playerX - 16, playerScreenY - 24, 32, 40, "#4de8e8", true);
      pr.drawRect(playerX - 10, playerScreenY - 34, 20, 14, "#ffd84d", true);
    }

    // HUD Header
    pr.drawText(`OMEGA RUN  •  LVL ${this.level}  •  DIST: ${Math.floor(this.distance)}M`, w / 2, 34, {
      size: 13,
      color: "#ffd84d",
      align: "center",
    });
    pr.drawText(`[LEFT/RIGHT] SWITCH LANE    [UP/A] JUMP    [DOWN/B] SLIDE`, w / 2, 58, {
      size: 10,
      color: "#94a3b8",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(6, 11, 24, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#ff5c8a", false);
      pr.drawText("RUN TERMINATED", w / 2, h / 2 - 10, { size: 22, color: "#ff5c8a", align: "center" });
      pr.drawText("PRESS SPACE TO RESTART", w / 2, h / 2 + 20, { size: 11, color: "#e2e8f0", align: "center" });
    }
  }
}
