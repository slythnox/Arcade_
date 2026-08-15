import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Target {
  pos: Vector2;
  radius: number;
  hit: boolean;
}

interface ObstacleWall {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class RicochetGame implements GameInstance {
  private ctx!: GameContext;
  private gunPos: Vector2 = new Vector2(60, 350);
  private aimAngle: number = 0;
  private bulletPos: Vector2 | null = null;
  private bulletVel: Vector2 | null = null;
  private bulletBounces: number = 0;
  private maxBounces: number = 8;
  private targets: Target[] = [];
  private walls: ObstacleWall[] = [];
  private shotsRemaining: number = 5;
  private score: number = 0;
  private isWon: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.gunPos = new Vector2(60, 350);
    this.aimAngle = 0;
    this.bulletPos = null;
    this.bulletVel = null;
    this.shotsRemaining = 5;
    this.score = 0;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;

    this.targets = [
      { pos: new Vector2(500, 150), radius: 18, hit: false },
      { pos: new Vector2(500, 550), radius: 18, hit: false },
      { pos: new Vector2(300, 120), radius: 18, hit: false },
    ];

    this.walls = [
      { x: 240, y: 220, w: 20, h: 260 },
      { x: 380, y: 100, w: 20, h: 200 },
      { x: 380, y: 400, w: 20, h: 200 },
    ];
  }

  private fireBullet(): void {
    if (this.bulletPos !== null || this.isWon || this.gameOver || this.shotsRemaining <= 0) return;

    const speed = 700;
    this.bulletPos = new Vector2(this.gunPos.x, this.gunPos.y);
    this.bulletVel = new Vector2(Math.cos(this.aimAngle) * speed, Math.sin(this.aimAngle) * speed);
    this.bulletBounces = 0;
    this.shotsRemaining--;
    this.ctx.audio.playLaser();
  }

  public update(dt: number): void {
    if (this.isPaused || this.bulletPos === null || this.bulletVel === null) return;

    this.bulletPos.x += this.bulletVel.x * dt;
    this.bulletPos.y += this.bulletVel.y * dt;

    // Check Outer Wall Bounces
    let bounced = false;
    if (this.bulletPos.x <= 20) { this.bulletPos.x = 20; this.bulletVel.x *= -1; bounced = true; }
    if (this.bulletPos.x >= 580) { this.bulletPos.x = 580; this.bulletVel.x *= -1; bounced = true; }
    if (this.bulletPos.y <= 60) { this.bulletPos.y = 60; this.bulletVel.y *= -1; bounced = true; }
    if (this.bulletPos.y >= 650) { this.bulletPos.y = 650; this.bulletVel.y *= -1; bounced = true; }

    // Check Internal Obstacle Walls
    for (const w of this.walls) {
      if (
        this.bulletPos.x >= w.x &&
        this.bulletPos.x <= w.x + w.w &&
        this.bulletPos.y >= w.y &&
        this.bulletPos.y <= w.y + w.h
      ) {
        // Approximate normal reflection
        this.bulletVel.x *= -1;
        bounced = true;
      }
    }

    if (bounced) {
      this.bulletBounces++;
      this.ctx.audio.playMove();
      if (this.bulletBounces >= this.maxBounces) {
        this.bulletPos = null;
        this.bulletVel = null;
        this.checkEnd();
      }
    }

    // Check Target Hits
    if (this.bulletPos) {
      for (const t of this.targets) {
        if (!t.hit && Math.hypot(this.bulletPos.x - t.pos.x, this.bulletPos.y - t.pos.y) < t.radius + 6) {
          t.hit = true;
          this.score += 500;
          this.ctx.audio.playExplosion();
        }
      }
    }

    if (this.targets.every((t) => t.hit) && !this.isWon) {
      this.isWon = true;
      this.score += this.shotsRemaining * 500;
      this.bulletPos = null;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }
  }

  private checkEnd(): void {
    if (!this.targets.every((t) => t.hit) && this.shotsRemaining <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_UP") {
      this.aimAngle -= 0.08;
      this.ctx.audio.playMove();
    } else if (action === "MOVE_DOWN") {
      this.aimAngle += 0.08;
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      this.fireBullet();
    } else if (action === "RESTART") {
      this.reset();
    }
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

    // Draw Obstacle Walls
    for (const wall of this.walls) {
      pr.drawRect(wall.x, wall.y, wall.w, wall.h, "#00FF66", true);
    }

    // Draw Targets
    for (const t of this.targets) {
      const col = t.hit ? "#047857" : "#FF3366";
      pr.drawCircle(t.pos.x, t.pos.y, t.radius, col, true);
      pr.drawCircle(t.pos.x, t.pos.y, t.radius * 0.4, "#FFFFFF", true);
    }

    // Draw Gun & Aim Line
    const aimLen = 60;
    const ax = this.gunPos.x + Math.cos(this.aimAngle) * aimLen;
    const ay = this.gunPos.y + Math.sin(this.aimAngle) * aimLen;
    pr.drawLine(this.gunPos.x, this.gunPos.y, ax, ay, "#FFB703", 2);
    pr.drawCircle(this.gunPos.x, this.gunPos.y, 14, "#00F0FF", true);

    // Draw Bullet
    if (this.bulletPos) {
      pr.drawCircle(this.bulletPos.x, this.bulletPos.y, 6, "#FFFFFF", true);
    }

    pr.drawText(`SHOTS: ${this.shotsRemaining}  •  SCORE: ${this.score}  •  [↑ ↓ AIM, SPACE TO FIRE]`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("ALL TARGETS DESTROYED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("OUT OF SHOTS — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
