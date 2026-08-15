import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface CaveSegment {
  x: number;
  topY: number;
  bottomY: number;
}

export class CaveEscapeGame implements GameInstance {
  private ctx!: GameContext;
  private shipPos: Vector2 = new Vector2(140, 350);
  private shipVy: number = 0;
  private isThrusting: boolean = false;
  private caveSegments: CaveSegment[] = [];
  private segmentWidth: number = 20;
  private scrollSpeed: number = 280;
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.shipPos = new Vector2(140, 350);
    this.shipVy = 0;
    this.isThrusting = false;
    this.scrollSpeed = 280;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.caveSegments = [];

    let curTop = 120;
    let curBottom = 580;
    for (let x = 0; x < 660; x += this.segmentWidth) {
      this.caveSegments.push({
        x,
        topY: curTop,
        bottomY: curBottom,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Helicopter thrust vs gravity
    if (this.isThrusting) {
      this.shipVy -= 900 * dt;
    } else {
      this.shipVy += 750 * dt;
    }

    this.shipPos.y += this.shipVy * dt;

    // Scroll cave segments
    for (const seg of this.caveSegments) {
      seg.x -= this.scrollSpeed * dt;
    }

    // Generate continuous undulating cave
    if (this.caveSegments[0].x < -this.segmentWidth) {
      this.caveSegments.shift();
      const last = this.caveSegments[this.caveSegments.length - 1];

      const gap = Math.max(160, 260 - this.score * 0.005);
      const delta = (this.ctx.random.next() - 0.5) * 45;
      let newTop = Math.max(60, Math.min(420, last.topY + delta));
      let newBottom = newTop + gap;
      if (newBottom > 640) {
        newBottom = 640;
        newTop = newBottom - gap;
      }

      this.caveSegments.push({
        x: last.x + this.segmentWidth,
        topY: newTop,
        bottomY: newBottom,
      });
    }

    // Check Terrain Collision
    const curSegment = this.caveSegments.find(
      (s) => this.shipPos.x >= s.x && this.shipPos.x <= s.x + this.segmentWidth
    );

    if (curSegment) {
      if (this.shipPos.y - 10 <= curSegment.topY || this.shipPos.y + 10 >= curSegment.bottomY) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      }
    }

    this.score += Math.round(dt * 60);
    this.scrollSpeed += dt * 3;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY") this.isThrusting = isPressed;
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Cave Ceiling and Floor Terrain
    for (const seg of this.caveSegments) {
      // Top ceiling
      pr.drawRect(seg.x, 10, this.segmentWidth + 1, seg.topY - 10, "#080e08", true);
      pr.drawLine(seg.x, seg.topY, seg.x + this.segmentWidth, seg.topY, "#00FF66", 2);

      // Bottom floor
      pr.drawRect(seg.x, seg.bottomY, this.segmentWidth + 1, h - 10 - seg.bottomY, "#080e08", true);
      pr.drawLine(seg.x, seg.bottomY, seg.x + this.segmentWidth, seg.bottomY, "#00FF66", 2);
    }

    // Draw Helicopter Ship
    pr.drawPixelBlock(this.shipPos.x - 14, this.shipPos.y - 10, 28, "#00F0FF", "#FFFFFF", "#040604");
    if (this.isThrusting) {
      pr.drawCircle(this.shipPos.x - 16, this.shipPos.y, 4, "#FFB703", true);
    }

    pr.drawText(`CAVE DISTANCE: ${this.score}  •  [HOLD SPACE TO THRUST UP]`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("TERRAIN CRASH — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
