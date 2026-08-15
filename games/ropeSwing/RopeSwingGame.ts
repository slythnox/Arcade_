import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface AnchorPoint {
  x: number;
  y: number;
}

export class RopeSwingGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(100, 300);
  private playerVel: Vector2 = new Vector2(240, 0);
  private anchors: AnchorPoint[] = [];
  private attachedAnchor: AnchorPoint | null = null;
  private ropeLength: number = 0;
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(100, 300);
    this.playerVel = new Vector2(240, 0);
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.attachedAnchor = null;
    this.anchors = [];

    for (let i = 0; i < 6; i++) {
      this.anchors.push({
        x: 180 + i * 220,
        y: 120 + (i % 2) * 60,
      });
    }
  }

  private toggleRope(): void {
    if (this.gameOver || this.isPaused) return;

    if (this.attachedAnchor) {
      // Release rope with angular momentum
      this.attachedAnchor = null;
      this.ctx.audio.playLaser();
    } else {
      // Find nearest anchor ahead of player
      let bestAnchor: AnchorPoint | null = null;
      let minDist = 280;

      for (const a of this.anchors) {
        const d = Math.hypot(a.x - this.playerPos.x, a.y - this.playerPos.y);
        if (d < minDist && a.x > this.playerPos.x - 40) {
          minDist = d;
          bestAnchor = a;
        }
      }

      if (bestAnchor) {
        this.attachedAnchor = bestAnchor;
        this.ropeLength = minDist;
        this.ctx.audio.playPowerUp();
      }
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Apply gravity
    this.playerVel.y += 980 * dt;

    if (this.attachedAnchor) {
      // Constrained pendulum mechanics
      const dx = this.playerPos.x - this.attachedAnchor.x;
      const dy = this.playerPos.y - this.attachedAnchor.y;
      const currentDist = Math.hypot(dx, dy);

      if (currentDist >= this.ropeLength) {
        // Enforce rope length constraint
        const nx = dx / currentDist;
        const ny = dy / currentDist;

        // Position correction
        this.playerPos.x = this.attachedAnchor.x + nx * this.ropeLength;
        this.playerPos.y = this.attachedAnchor.y + ny * this.ropeLength;

        // Remove radial velocity component: v = v - (v . n) n
        const radialVel = this.playerVel.x * nx + this.playerVel.y * ny;
        if (radialVel > 0) {
          this.playerVel.x -= radialVel * nx;
          this.playerVel.y -= radialVel * ny;
        }
      }
    }

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Scroll camera world
    if (this.playerPos.x > 320) {
      const shift = this.playerPos.x - 320;
      this.playerPos.x = 320;
      this.score += Math.round(shift);

      for (const a of this.anchors) {
        a.x -= shift;
      }

      // Recycle anchors
      if (this.anchors[0].x < -100) {
        this.anchors.shift();
        const lastX = this.anchors[this.anchors.length - 1].x;
        this.anchors.push({
          x: lastX + 220,
          y: 120 + this.ctx.random.next() * 100,
        });
      }
    }

    // Floor crash / ceiling hit
    if (this.playerPos.y >= 640 || this.playerPos.y <= 40) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY" && isPressed) this.toggleRope();
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

    // Hazard spikes on bottom
    pr.drawRect(10, 640, w - 20, 20, "#FF3366", true);

    // Draw Anchors
    for (const a of this.anchors) {
      pr.drawCircle(a.x, a.y, 10, "#00FF66", true);
      pr.drawCircle(a.x, a.y, 4, "#FFFFFF", true);
    }

    // Draw Active Rope
    if (this.attachedAnchor) {
      pr.drawLine(this.attachedAnchor.x, this.attachedAnchor.y, this.playerPos.x, this.playerPos.y, "#00F0FF", 2);
    }

    // Draw Player
    pr.drawCircle(this.playerPos.x, this.playerPos.y, 12, "#FFB703", true);
    pr.drawCircle(this.playerPos.x, this.playerPos.y, 4, "#FFFFFF", true);

    pr.drawText(`DISTANCE: ${this.score}  •  [SPACE TO ATTACH / RELEASE ROPE]`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("FELL INTO ABYSS — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
