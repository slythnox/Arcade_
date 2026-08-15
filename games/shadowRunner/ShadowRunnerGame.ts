import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Checkpoint {
  x: number;
  y: number;
}

export class ShadowRunnerGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(100, 550);
  private playerVel: Vector2 = new Vector2(0, 0);
  private ghostRecording: Vector2[] = [];
  private bestGhost: Vector2[] = [];
  private ghostFrame: number = 0;
  private checkpoints: Checkpoint[] = [];
  private currentCheckpoint: number = 0;
  private lapTimer: number = 0;
  private bestLap: number | null = null;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(100, 550);
    this.playerVel = new Vector2(0, 0);
    this.ghostRecording = [];
    this.ghostFrame = 0;
    this.currentCheckpoint = 0;
    this.lapTimer = 0;
    this.isWon = false;
    this.isPaused = false;

    this.checkpoints = [
      { x: 100, y: 550 },
      { x: 500, y: 550 },
      { x: 500, y: 200 },
      { x: 100, y: 200 },
    ];
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    this.lapTimer += dt;

    // Movement
    const speed = 320;
    if (this.moveLeft) this.playerVel.x = -speed;
    else if (this.moveRight) this.playerVel.x = speed;
    else this.playerVel.x *= 0.85;

    // Vertical steering
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    this.playerPos.x = Math.max(40, Math.min(560, this.playerPos.x));
    this.playerPos.y = Math.max(100, Math.min(600, this.playerPos.y));

    // Record ghost frame
    this.ghostRecording.push(new Vector2(this.playerPos.x, this.playerPos.y));

    // Checkpoint navigation
    const targetCp = this.checkpoints[this.currentCheckpoint];
    if (Math.hypot(this.playerPos.x - targetCp.x, this.playerPos.y - targetCp.y) < 40) {
      this.currentCheckpoint = (this.currentCheckpoint + 1) % this.checkpoints.length;
      this.ctx.audio.playPowerUp();

      // Completed Lap
      if (this.currentCheckpoint === 0) {
        if (this.bestLap === null || this.lapTimer < this.bestLap) {
          this.bestLap = this.lapTimer;
          this.bestGhost = [...this.ghostRecording];
          this.ctx.audio.playVictory();
        }
        this.lapTimer = 0;
        this.ghostRecording = [];
      }
    }

    // Advance best ghost replay playback
    if (this.bestGhost.length > 0) {
      this.ghostFrame = (this.ghostFrame + 1) % this.bestGhost.length;
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP" && isPressed) this.playerPos.y -= 70;
    if (action === "MOVE_DOWN" && isPressed) this.playerPos.y += 70;
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.bestLap ? Math.round(10000 / this.bestLap) : 0; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Track Circuit Outline
    pr.drawLine(100, 550, 500, 550, "rgba(0, 255, 102, 0.2)", 6);
    pr.drawLine(500, 550, 500, 200, "rgba(0, 255, 102, 0.2)", 6);
    pr.drawLine(500, 200, 100, 200, "rgba(0, 255, 102, 0.2)", 6);
    pr.drawLine(100, 200, 100, 550, "rgba(0, 255, 102, 0.2)", 6);

    // Draw Checkpoints
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const isNext = i === this.currentCheckpoint;
      pr.drawCircle(cp.x, cp.y, isNext ? 22 : 12, isNext ? "#FFB703" : "rgba(0, 255, 102, 0.3)", true);
    }

    // Draw Best Ghost Replay
    if (this.bestGhost.length > 0 && this.bestGhost[this.ghostFrame]) {
      const gPos = this.bestGhost[this.ghostFrame];
      pr.drawPixelBlock(gPos.x - 12, gPos.y - 12, 24, "rgba(255, 255, 255, 0.3)", "rgba(255,255,255,0.6)", "#040604");
    }

    // Draw Player
    pr.drawPixelBlock(this.playerPos.x - 14, this.playerPos.y - 14, 28, "#00F0FF", "#FFFFFF", "#040604");

    const bestText = this.bestLap ? `${this.bestLap.toFixed(2)}s` : "--:--";
    pr.drawText(
      `LAP TIME: ${this.lapTimer.toFixed(2)}s  •  BEST GHOST: ${bestText}  •  [RACE AGAINST YOUR OWN SHADOW]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );
  }
}
