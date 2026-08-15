import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Ladder {
  x: number;
  topY: number;
  bottomY: number;
}

interface Barrel {
  pos: Vector2;
  dir: number;
  tier: number;
}

export class LadderClimbGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(80, 600);
  private playerVx: number = 0;
  private isClimbing: boolean = false;
  private ladders: Ladder[] = [];
  private barrels: Barrel[] = [];
  private barrelTimer: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private score: number = 0;
  private isWon: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  // 4 Tiers of platforms at Y = 620, 480, 340, 200
  private tiers: number[] = [620, 480, 340, 200];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(80, 600);
    this.playerVx = 0;
    this.isClimbing = false;
    this.barrels = [];
    this.barrelTimer = 0;
    this.score = 0;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;

    this.ladders = [
      { x: 500, topY: 480, bottomY: 620 },
      { x: 140, topY: 340, bottomY: 480 },
      { x: 460, topY: 200, bottomY: 340 },
    ];
  }

  private spawnBarrel(): void {
    this.barrels.push({
      pos: new Vector2(100, 180),
      dir: 1,
      tier: 3,
    });
  }

  public update(dt: number): void {
    if (this.isWon || this.gameOver || this.isPaused) return;

    // Check if on a ladder
    const nearLadder = this.ladders.find(
      (l) => Math.abs(this.playerPos.x - l.x) < 16 && this.playerPos.y >= l.topY - 10 && this.playerPos.y <= l.bottomY + 10
    );

    if (nearLadder && (this.moveUp || this.moveDown)) {
      this.isClimbing = true;
      this.playerPos.x = nearLadder.x;
      if (this.moveUp) this.playerPos.y -= 140 * dt;
      if (this.moveDown) this.playerPos.y += 140 * dt;
    } else {
      this.isClimbing = false;
    }

    if (!this.isClimbing) {
      if (this.moveLeft) this.playerPos.x -= 200 * dt;
      if (this.moveRight) this.playerPos.x += 200 * dt;

      // Snap to nearest platform below
      const currentTier = this.tiers.find((t) => this.playerPos.y <= t && this.playerPos.y >= t - 30);
      if (currentTier) {
        this.playerPos.y = currentTier - 18;
      }
    }

    this.playerPos.x = Math.max(40, Math.min(560, this.playerPos.x));

    // Win condition (reach top tier platform)
    if (this.playerPos.y <= 210 && this.playerPos.x > 80 && this.playerPos.x < 240 && !this.isWon) {
      this.isWon = true;
      this.score += 3000;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }

    // Spawn Barrels from top tier
    this.barrelTimer += dt;
    if (this.barrelTimer > 2.8) {
      this.barrelTimer = 0;
      this.spawnBarrel();
    }

    // Update Barrels rolling down zigzag tiers
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];
      b.pos.x += b.dir * 180 * dt;

      // Drop down at tier ends
      if (b.tier === 3 && b.pos.x > 540) {
        b.tier = 2;
        b.dir = -1;
        b.pos.y = 320;
      } else if (b.tier === 2 && b.pos.x < 60) {
        b.tier = 1;
        b.dir = 1;
        b.pos.y = 460;
      } else if (b.tier === 1 && b.pos.x > 540) {
        b.tier = 0;
        b.dir = -1;
        b.pos.y = 600;
      } else if (b.tier === 0 && b.pos.x < 40) {
        this.barrels.splice(i, 1);
        this.score += 100;
        continue;
      }

      // Check collision with player
      if (Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y) < 22) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
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

    // Draw Platform Tiers
    for (const t of this.tiers) {
      pr.drawRect(20, t, w - 40, 10, "#00FF66", true);
    }

    // Draw Ladders
    for (const l of this.ladders) {
      pr.drawLine(l.x - 10, l.topY, l.x - 10, l.bottomY, "#FFB703", 2);
      pr.drawLine(l.x + 10, l.topY, l.x + 10, l.bottomY, "#FFB703", 2);
      for (let y = l.topY + 12; y < l.bottomY; y += 16) {
        pr.drawLine(l.x - 10, y, l.x + 10, y, "#FFB703", 2);
      }
    }

    // Goal at Top
    pr.drawPixelBlock(100, 160, 32, "#FF3366", "#FFFFFF", "#040604");
    pr.drawText("GOAL", 116, 150, { size: 10, color: "#FF3366", align: "center" });

    // Draw Barrels
    for (const b of this.barrels) {
      pr.drawCircle(b.pos.x, b.pos.y, 12, "#FFB703", true);
      pr.drawCircle(b.pos.x, b.pos.y, 4, "#040604", true);
    }

    // Draw Player
    pr.drawPixelBlock(this.playerPos.x - 12, this.playerPos.y - 12, 24, "#00F0FF", "#FFFFFF", "#040604");

    pr.drawText(`SCORE: ${this.score}  •  [ARROW KEYS TO RUN & CLIMB LADDERS]`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("SUMMIT REACHED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("BARREL COLLISION — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
