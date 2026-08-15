import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

export class BossReactorGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 600);
  private bossPos: Vector2 = new Vector2(300, 180);
  private bossHealth: number = 100;
  private maxHealth: number = 100;
  private bossAngle: number = 0;
  private phase: number = 1;
  private bullets: { pos: Vector2; vel: Vector2; fromPlayer: boolean }[] = [];
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private shootTimer: number = 0;
  private attackTimer: number = 0;
  private score: number = 0;
  private lives: number = 3;
  private isWon: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 600);
    this.bossPos = new Vector2(300, 180);
    this.bossHealth = 100;
    this.maxHealth = 100;
    this.bossAngle = 0;
    this.phase = 1;
    this.bullets = [];
    this.shootTimer = 0;
    this.attackTimer = 0;
    this.score = 0;
    this.lives = 3;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;
  }

  public update(dt: number): void {
    if (this.isWon || this.gameOver || this.isPaused) return;

    if (this.moveLeft) this.playerPos.x -= 340 * dt;
    if (this.moveRight) this.playerPos.x += 340 * dt;
    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));

    // Boss motion
    this.bossPos.x = 300 + Math.sin(this.bossAngle) * 160;
    this.bossAngle += 1.6 * dt;

    // Boss Attack Patterns
    this.attackTimer += dt;
    if (this.attackTimer >= (this.phase === 1 ? 0.8 : 0.45)) {
      this.attackTimer = 0;
      const count = this.phase === 1 ? 3 : 5;
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * 0.25;
        this.bullets.push({
          pos: new Vector2(this.bossPos.x, this.bossPos.y + 30),
          vel: new Vector2(Math.sin(spread) * 320, Math.cos(spread) * 320),
          fromPlayer: false,
        });
      }
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      if (b.pos.x < 10 || b.pos.x > 590 || b.pos.y < 30 || b.pos.y > 670) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        // Hit Boss
        if (Math.hypot(b.pos.x - this.bossPos.x, b.pos.y - this.bossPos.y) < 45) {
          this.bullets.splice(i, 1);
          this.bossHealth -= 4;
          this.score += 200;
          this.ctx.audio.playExplosion();

          if (this.bossHealth <= 50 && this.phase === 1) {
            this.phase = 2;
            this.ctx.audio.playPowerUp();
          }

          if (this.bossHealth <= 0) {
            this.bossHealth = 0;
            this.isWon = true;
            this.score += 5000;
            this.ctx.session.setStatus("ready");
            this.ctx.audio.playVictory();
          }
        }
      } else {
        // Hit Player
        if (Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y) < 18) {
          this.bullets.splice(i, 1);
          this.lives--;
          this.ctx.audio.playExplosion();
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed && !this.isWon && !this.gameOver && !this.isPaused) {
      this.bullets.push({
        pos: new Vector2(this.playerPos.x, this.playerPos.y - 15),
        vel: new Vector2(0, -650),
        fromPlayer: true,
      });
      this.ctx.audio.playLaser();
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.phase; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Boss Health Bar
    pr.drawRect(100, 48, 400, 12, "#080e08", true);
    const healthWidth = (this.bossHealth / this.maxHealth) * 400;
    pr.drawRect(100, 48, healthWidth, 12, this.phase === 1 ? "#FFB703" : "#FF3366", true);
    pr.drawRect(100, 48, 400, 12, "#FFFFFF", false);

    // Draw Boss Core & Shield Rings
    const bCol = this.phase === 1 ? "#FFB703" : "#FF3366";
    pr.drawCircle(this.bossPos.x, this.bossPos.y, 44, "rgba(255, 51, 102, 0.15)", true);
    pr.drawCircle(this.bossPos.x, this.bossPos.y, 34, bCol, true);
    pr.drawCircle(this.bossPos.x, this.bossPos.y, 14, "#FFFFFF", true);

    // Draw Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 4, b.fromPlayer ? "#00FF66" : "#FF3366", true);
    }

    // Draw Player Ship
    pr.drawPixelBlock(this.playerPos.x - 16, this.playerPos.y - 12, 32, "#00F0FF", "#FFFFFF", "#040604");

    pr.drawText(`SCORE: ${this.score}  •  PHASE: ${this.phase}  •  LIVES: ${this.lives}`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("BOSS REACTOR MELTDOWN — VICTORY", w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("SHIP DESTROYED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
