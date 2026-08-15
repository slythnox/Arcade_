import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Enemy {
  pos: Vector2;
  vel: Vector2;
  speed: number;
}

interface Bullet {
  pos: Vector2;
  vel: Vector2;
}

export class TwinStickArenaGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 350);
  private aimAngle: number = 0;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private spawnTimer: number = 0;
  private shootTimer: number = 0;
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
    this.playerPos = new Vector2(300, 350);
    this.aimAngle = 0;
    this.bullets = [];
    this.enemies = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.spawnTimer = 0;
    this.shootTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  private spawnEnemy(): void {
    const angle = this.ctx.random.next() * Math.PI * 2;
    const dist = 360;
    const x = 300 + Math.cos(angle) * dist;
    const y = 350 + Math.sin(angle) * dist;
    this.enemies.push({
      pos: new Vector2(x, y),
      vel: new Vector2(0, 0),
      speed: 120 + this.level * 15,
    });
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Move player in 8 directions
    const speed = 260;
    if (this.moveLeft) this.playerPos.x -= speed * dt;
    if (this.moveRight) this.playerPos.x += speed * dt;
    if (this.moveUp) this.playerPos.y -= speed * dt;
    if (this.moveDown) this.playerPos.y += speed * dt;

    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));
    this.playerPos.y = Math.max(60, Math.min(640, this.playerPos.y));

    // Auto rapid fire in aim direction
    this.shootTimer += dt;
    if (this.shootTimer >= 0.16) {
      this.shootTimer = 0;
      const bSpeed = 650;
      this.bullets.push({
        pos: new Vector2(this.playerPos.x, this.playerPos.y),
        vel: new Vector2(Math.cos(this.aimAngle) * bSpeed, Math.sin(this.aimAngle) * bSpeed),
      });
      this.ctx.audio.playLaser();
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      if (b.pos.x < 10 || b.pos.x > 590 || b.pos.y < 40 || b.pos.y > 660) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check hit enemies
      for (let j = this.enemies.length - 1; j >= 0; j--) {
        const e = this.enemies[j];
        if (Math.hypot(b.pos.x - e.pos.x, b.pos.y - e.pos.y) < 18) {
          this.enemies.splice(j, 1);
          this.bullets.splice(i, 1);
          this.score += 100;
          this.ctx.audio.playExplosion();
          break;
        }
      }
    }

    // Spawn & Move Enemies towards player
    this.spawnTimer += dt;
    if (this.spawnTimer > Math.max(0.3, 1.0 - this.level * 0.08)) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      const dx = this.playerPos.x - e.pos.x;
      const dy = this.playerPos.y - e.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 2) {
        e.pos.x += (dx / dist) * e.speed * dt;
        e.pos.y += (dy / dist) * e.speed * dt;
      }

      // Player collision
      if (dist < 22) {
        this.enemies.splice(i, 1);
        this.lives--;
        this.ctx.audio.playExplosion();
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
      }
    }

    if (this.score >= this.level * 2000) {
      this.level++;
      this.ctx.audio.playPowerUp();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed) {
      this.aimAngle += Math.PI / 4;
      this.ctx.audio.playMove();
    }
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

    // Draw Arena Grid Overlay
    pr.drawGrid(8, 9, 70, "rgba(0, 255, 102, 0.05)", 20, 40);

    // Draw Enemies
    for (const e of this.enemies) {
      pr.drawPixelBlock(e.pos.x - 10, e.pos.y - 10, 20, "#FF3366", "#FFFFFF", "#040604");
    }

    // Draw Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 3, "#00FF66", true);
    }

    // Draw Player & Aim Reticle
    pr.drawPixelBlock(this.playerPos.x - 14, this.playerPos.y - 14, 28, "#00F0FF", "#FFFFFF", "#047857");
    const rx = this.playerPos.x + Math.cos(this.aimAngle) * 32;
    const ry = this.playerPos.y + Math.sin(this.aimAngle) * 32;
    pr.drawCircle(rx, ry, 4, "#FFB703", true);

    pr.drawText(`SCORE: ${this.score}  •  LEVEL: ${this.level}  •  LIVES: ${this.lives}`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("ARENA OVERRUN — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
