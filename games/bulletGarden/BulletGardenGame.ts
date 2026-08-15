import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface DanmakuBullet {
  pos: Vector2;
  vel: Vector2;
  color: string;
}

export class BulletGardenGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 580);
  private playerHitboxRadius: number = 4;
  private bullets: DanmakuBullet[] = [];
  private bossPos: Vector2 = new Vector2(300, 160);
  private bossAngle: number = 0;
  private patternTimer: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 580);
    this.bullets = [];
    this.bossAngle = 0;
    this.patternTimer = 0;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
  }

  private emitSpiralBlossom(): void {
    const arms = 6 + this.level;
    const speed = 160;
    const colors = ["#FF3366", "#00F0FF", "#FFB703", "#A855F7"];
    const col = colors[this.level % colors.length];

    for (let i = 0; i < arms; i++) {
      const angle = this.bossAngle + (i * 2 * Math.PI) / arms;
      this.bullets.push({
        pos: new Vector2(this.bossPos.x, this.bossPos.y),
        vel: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        color: col,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Precision focus movement (slow & precise)
    const speed = 190;
    if (this.moveLeft) this.playerPos.x -= speed * dt;
    if (this.moveRight) this.playerPos.x += speed * dt;
    if (this.moveUp) this.playerPos.y -= speed * dt;
    if (this.moveDown) this.playerPos.y += speed * dt;

    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));
    this.playerPos.y = Math.max(60, Math.min(650, this.playerPos.y));

    // Boss Danmaku Rotation
    this.bossAngle += 1.8 * dt;
    this.patternTimer += dt;
    if (this.patternTimer >= 0.12) {
      this.patternTimer = 0;
      this.emitSpiralBlossom();
    }

    // Update Danmaku Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      if (b.pos.x < 10 || b.pos.x > 590 || b.pos.y < 30 || b.pos.y > 670) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Micro-Hitbox collision with player
      if (Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y) < this.playerHitboxRadius + 3) {
        this.lives--;
        this.ctx.audio.playExplosion();
        this.bullets = [];
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
        break;
      }
    }

    this.score += Math.round(dt * 150);
    if (this.score >= this.level * 3000) {
      this.level++;
      this.ctx.audio.playPowerUp();
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
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Boss Core
    pr.drawCircle(this.bossPos.x, this.bossPos.y, 28, "#FF3366", true);
    pr.drawCircle(this.bossPos.x, this.bossPos.y, 10, "#FFFFFF", true);

    // Draw Danmaku Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 4, b.color, true);
    }

    // Draw Player Ship & Micro-Hitbox Dot
    pr.drawPixelBlock(this.playerPos.x - 12, this.playerPos.y - 12, 24, "#00FF66", "#FFFFFF", "#040604");
    pr.drawCircle(this.playerPos.x, this.playerPos.y, this.playerHitboxRadius, "#FF3366", true);

    pr.drawText(
      `SURVIVAL SCORE: ${this.score}  •  LEVEL: ${this.level}  •  LIVES: ${this.lives}`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("DANMAKU GRAZE FAILED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
