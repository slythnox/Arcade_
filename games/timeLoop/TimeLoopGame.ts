import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface FrameState {
  x: number;
  y: number;
}

export class TimeLoopGame implements GameInstance {
  private ctx!: GameContext;
  private playerX = 60;
  private playerY = 460;
  private playerVx = 0;
  private playerVy = 0;
  private isGrounded = true;

  // Ghosts history
  private currentRecording: FrameState[] = [];
  private ghostRecordings: FrameState[][] = [];
  private playbackFrame = 0;
  private maxGhosts = 3;

  private loopTimer = 8.0; // 8 seconds per loop
  private loopDuration = 8.0;

  // Level Puzzle Elements
  private switch1 = false;
  private switch2 = false;
  private doorOpen = false;
  private exitX = 520;
  private exitY = 440;

  private score = 0;
  private level = 1;
  private isPaused = false;
  private levelCleared = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initLevel();
  }

  private initLevel(): void {
    this.playerX = 60;
    this.playerY = 460;
    this.playerVx = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.currentRecording = [];
    this.ghostRecordings = [];
    this.playbackFrame = 0;
    this.loopTimer = this.loopDuration;
    this.switch1 = false;
    this.switch2 = false;
    this.doorOpen = false;
    this.levelCleared = false;
  }

  private rewindLoop(): void {
    if (this.currentRecording.length > 0) {
      if (this.ghostRecordings.length >= this.maxGhosts) {
        this.ghostRecordings.shift();
      }
      this.ghostRecordings.push([...this.currentRecording]);
    }
    this.currentRecording = [];
    this.playerX = 60;
    this.playerY = 460;
    this.playerVx = 0;
    this.playerVy = 0;
    this.playbackFrame = 0;
    this.loopTimer = this.loopDuration;
    this.ctx.audio?.playRotate?.();
  }

  public update(dt: number): void {
    if (this.isPaused || this.levelCleared) return;

    this.loopTimer -= dt;
    if (this.loopTimer <= 0) {
      this.rewindLoop();
      return;
    }

    // Player Physics
    this.playerX += this.playerVx * dt;
    this.playerY += this.playerVy * dt;

    if (!this.isGrounded) {
      this.playerVy += 900 * dt; // Gravity
      if (this.playerY >= 460) {
        this.playerY = 460;
        this.playerVy = 0;
        this.isGrounded = true;
      }
    }

    // Boundaries
    this.playerX = Math.max(30, Math.min(560, this.playerX));

    // Record player position
    this.currentRecording.push({ x: this.playerX, y: this.playerY });

    // Evaluate switches: switch 1 at x=180, switch 2 at x=340
    let s1 = false;
    let s2 = false;

    // Check player
    if (Math.abs(this.playerX - 180) < 22 && this.playerY >= 450) s1 = true;
    if (Math.abs(this.playerX - 340) < 22 && this.playerY >= 450) s2 = true;

    // Check ghosts
    for (const ghost of this.ghostRecordings) {
      const gPos = ghost[this.playbackFrame];
      if (gPos) {
        if (Math.abs(gPos.x - 180) < 22 && gPos.y >= 450) s1 = true;
        if (Math.abs(gPos.x - 340) < 22 && gPos.y >= 450) s2 = true;
      }
    }

    this.switch1 = s1;
    this.switch2 = s2;
    this.doorOpen = this.switch1 && this.switch2;

    this.playbackFrame++;

    // Check level exit
    if (this.doorOpen && Math.abs(this.playerX - this.exitX) < 28 && Math.abs(this.playerY - this.exitY) < 30) {
      this.levelCleared = true;
      this.score += 2000 * this.level;
      this.ctx.audio?.playVictory?.();
      setTimeout(() => {
        this.level++;
        this.initLevel();
      }, 800);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.playerVx = isPressed ? -240 : 0;
    } else if (action === "MOVE_RIGHT") {
      this.playerVx = isPressed ? 240 : 0;
    } else if ((action === "MOVE_UP" || action === "ACTION_PRIMARY") && isPressed) {
      if (this.isGrounded) {
        this.playerVy = -420;
        this.isGrounded = false;
        this.ctx.audio?.playMove?.();
      }
    } else if (action === "ACTION_SECONDARY" && isPressed) {
      // Manual Rewind Trigger
      this.rewindLoop();
    } else if (action === "RESTART" && isPressed) {
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
    pr.clear("#050914");
    const w = renderer.getWidth();

    // Floor Platform
    pr.drawRect(20, 480, 560, 40, "#1e293b", true);
    pr.drawRect(20, 480, 560, 40, "#475569", false);

    // Switches (Pressure plates)
    pr.drawRect(165, this.switch1 ? 478 : 472, 30, this.switch1 ? 2 : 8, this.switch1 ? "#4de8e8" : "#ff5c8a", true);
    pr.drawRect(325, this.switch2 ? 478 : 472, 30, this.switch2 ? 2 : 8, this.switch2 ? "#4de8e8" : "#ff5c8a", true);

    // Door Barrier
    if (!this.doorOpen) {
      pr.drawRect(460, 360, 14, 120, "#ff5c8a", true);
      pr.drawRect(460, 360, 14, 120, "#ffffff", false);
    }

    // Exit Portal
    pr.drawRect(this.exitX - 16, this.exitY - 30, 32, 70, this.doorOpen ? "#ffd84d" : "#334155", true);
    pr.drawRect(this.exitX - 16, this.exitY - 30, 32, 70, this.doorOpen ? "#ffffff" : "#475569", false);

    // Render Past Ghosts (Translucent cyan)
    for (const ghost of this.ghostRecordings) {
      const gPos = ghost[this.playbackFrame];
      if (gPos) {
        pr.drawRect(gPos.x - 10, gPos.y - 20, 20, 20, "rgba(77, 232, 232, 0.45)", true);
        pr.drawRect(gPos.x - 10, gPos.y - 20, 20, 20, "#4de8e8", false);
      }
    }

    // Render Current Player
    pr.drawRect(this.playerX - 10, this.playerY - 20, 20, 20, "#ffd84d", true);
    pr.drawRect(this.playerX - 10, this.playerY - 20, 20, 20, "#ffffff", false);

    // Header HUD
    pr.drawText(
      `TIME LOOP  •  STAGE ${this.level}  •  LOOP TIME: ${this.loopTimer.toFixed(1)}S  •  GHOSTS: [${this.ghostRecordings.length}/${this.maxGhosts}]`,
      w / 2,
      28,
      { size: 11, color: "#ffd84d", align: "center" }
    );
    pr.drawText(`[ARROWS] MOVE/JUMP    [B/Z] REWIND LOOP    COOPERATE WITH PAST GHOSTS TO OPEN AIRLOCK`, w / 2, 50, {
      size: 9,
      color: "#94a3b8",
      align: "center",
    });
  }
}
