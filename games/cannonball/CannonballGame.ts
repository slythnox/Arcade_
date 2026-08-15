import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface ParabolicBall {
  pos: Vector2;
  vel: Vector2;
  trail: Vector2[];
}

export class CannonballGame implements GameInstance {
  private ctx!: GameContext;
  private cannonPos: Vector2 = new Vector2(60, 580);
  private angleDeg: number = 45;
  private power: number = 600;
  private wind: number = 0;
  private targetX: number = 480;
  private targetWidth: number = 60;
  private ball: ParabolicBall | null = null;
  private shots: number = 5;
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
    this.angleDeg = 45;
    this.power = 600;
    this.wind = (this.ctx.random.next() - 0.5) * 80;
    this.targetX = 360 + this.ctx.random.next() * 180;
    this.ball = null;
    this.shots = 5;
    this.score = 0;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;
  }

  private fire(): void {
    if (this.ball !== null || this.isWon || this.gameOver || this.shots <= 0) return;

    const rad = (this.angleDeg * Math.PI) / 180;
    this.ball = {
      pos: new Vector2(this.cannonPos.x, this.cannonPos.y),
      vel: new Vector2(Math.cos(rad) * this.power, -Math.sin(rad) * this.power),
      trail: [new Vector2(this.cannonPos.x, this.cannonPos.y)],
    };
    this.shots--;
    this.ctx.audio.playExplosion();
  }

  public update(dt: number): void {
    if (this.isPaused || this.ball === null) return;

    // Apply gravity & wind
    const g = 800;
    this.ball.vel.x += this.wind * dt;
    this.ball.vel.y += g * dt;

    this.ball.pos.x += this.ball.vel.x * dt;
    this.ball.pos.y += this.ball.vel.y * dt;

    this.ball.trail.push(new Vector2(this.ball.pos.x, this.ball.pos.y));
    if (this.ball.trail.length > 60) this.ball.trail.shift();

    // Check Ground Impact (Y >= 580)
    if (this.ball.pos.y >= 580) {
      const hitX = this.ball.pos.x;
      this.ball = null;

      if (hitX >= this.targetX && hitX <= this.targetX + this.targetWidth) {
        // Direct Hit!
        this.score += 1000 + this.shots * 250;
        this.isWon = true;
        this.ctx.session.setStatus("ready");
        this.ctx.audio.playVictory();
      } else {
        // Miss
        this.ctx.audio.playExplosion();
        if (this.shots <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        } else {
          // Reroll wind
          this.wind = (this.ctx.random.next() - 0.5) * 120;
        }
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.angleDeg = Math.min(85, this.angleDeg + 2);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.angleDeg = Math.max(10, this.angleDeg - 2);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_UP") {
      this.power = Math.min(850, this.power + 20);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_DOWN") {
      this.power = Math.max(300, this.power - 20);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      this.fire();
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

    // Ground Floor
    pr.drawRect(10, 580, w - 20, 90, "#080e08", true);
    pr.drawLine(10, 580, w - 10, 580, "#00FF66", 2);

    // Target Pad
    pr.drawRect(this.targetX, 574, this.targetWidth, 12, "#FF3366", true);
    pr.drawRect(this.targetX + 15, 574, this.targetWidth - 30, 12, "#FFFFFF", true);

    // Draw Parabolic Trail
    if (this.ball && this.ball.trail.length > 1) {
      for (let i = 0; i < this.ball.trail.length - 1; i++) {
        pr.drawLine(this.ball.trail[i].x, this.ball.trail[i].y, this.ball.trail[i + 1].x, this.ball.trail[i + 1].y, "rgba(255, 183, 3, 0.4)", 2);
      }
    }

    // Draw Cannon Barrel
    const rad = (this.angleDeg * Math.PI) / 180;
    const barrelLen = 32;
    const bx = this.cannonPos.x + Math.cos(rad) * barrelLen;
    const by = this.cannonPos.y - Math.sin(rad) * barrelLen;
    pr.drawLine(this.cannonPos.x, this.cannonPos.y, bx, by, "#00FF66", 8);
    pr.drawCircle(this.cannonPos.x, this.cannonPos.y, 14, "#047857", true);

    // Draw Ball
    if (this.ball) {
      pr.drawCircle(this.ball.pos.x, this.ball.pos.y, 7, "#00F0FF", true);
    }

    // Top HUD
    const windDir = this.wind >= 0 ? `+${Math.round(this.wind)} m/s →` : `${Math.round(this.wind)} m/s ←`;
    pr.drawText(
      `ANGLE: ${this.angleDeg}°  •  VELOCITY: ${this.power}  •  WIND: ${windDir}  •  SHOTS: ${this.shots}`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("DIRECT ARTILLERY HIT — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("OUT OF AMMUNITION — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
