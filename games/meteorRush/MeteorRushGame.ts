import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Meteor {
  pos: Vector2;
  vel: Vector2;
  radius: number;
}

interface ShieldTurret {
  angle: number;
}

export class MeteorRushGame implements GameInstance {
  private ctx!: GameContext;
  private planetPos: Vector2 = new Vector2(300, 360);
  private planetRadius: number = 55;
  private turretAngle: number = 0;
  private meteors: Meteor[] = [];
  private bullets: { pos: Vector2; vel: Vector2 }[] = [];
  private planetHealth: number = 100;
  private spawnTimer: number = 0;
  private score: number = 0;
  private level: number = 1;
  private rotateLeft: boolean = false;
  private rotateRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.turretAngle = 0;
    this.meteors = [];
    this.bullets = [];
    this.planetHealth = 100;
    this.spawnTimer = 0;
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
  }

  private spawnMeteor(): void {
    const angle = this.ctx.random.next() * Math.PI * 2;
    const dist = 380;
    const startX = this.planetPos.x + Math.cos(angle) * dist;
    const startY = this.planetPos.y + Math.sin(angle) * dist;

    const speed = 70 + this.ctx.random.next() * 50 + this.level * 10;
    const toPlanetAngle = Math.atan2(this.planetPos.y - startY, this.planetPos.x - startX);

    this.meteors.push({
      pos: new Vector2(startX, startY),
      vel: new Vector2(Math.cos(toPlanetAngle) * speed, Math.sin(toPlanetAngle) * speed),
      radius: 16,
    });
  }

  private fireTurret(): void {
    if (this.gameOver || this.isPaused) return;

    const bSpeed = 600;
    const startX = this.planetPos.x + Math.cos(this.turretAngle) * (this.planetRadius + 14);
    const startY = this.planetPos.y + Math.sin(this.turretAngle) * (this.planetRadius + 14);

    this.bullets.push({
      pos: new Vector2(startX, startY),
      vel: new Vector2(Math.cos(this.turretAngle) * bSpeed, Math.sin(this.turretAngle) * bSpeed),
    });
    this.ctx.audio.playLaser();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    if (this.rotateLeft) this.turretAngle -= 3.8 * dt;
    if (this.rotateRight) this.turretAngle += 3.8 * dt;

    // Spawn Meteors
    this.spawnTimer += dt;
    if (this.spawnTimer > Math.max(0.4, 1.2 - this.level * 0.08)) {
      this.spawnTimer = 0;
      this.spawnMeteor();
    }

    // Update Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      if (Math.hypot(b.pos.x - this.planetPos.x, b.pos.y - this.planetPos.y) > 420) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check bullet hit meteor
      for (let j = this.meteors.length - 1; j >= 0; j--) {
        const m = this.meteors[j];
        if (Math.hypot(b.pos.x - m.pos.x, b.pos.y - m.pos.y) < m.radius + 6) {
          this.meteors.splice(j, 1);
          this.bullets.splice(i, 1);
          this.score += 150;
          this.ctx.audio.playExplosion();
          break;
        }
      }
    }

    // Update Meteors
    for (let i = this.meteors.length - 1; i >= 0; i--) {
      const m = this.meteors[i];
      m.pos.x += m.vel.x * dt;
      m.pos.y += m.vel.y * dt;

      // Planet Impact
      if (Math.hypot(m.pos.x - this.planetPos.x, m.pos.y - this.planetPos.y) < this.planetRadius + m.radius) {
        this.meteors.splice(i, 1);
        this.planetHealth -= 20;
        this.ctx.audio.playExplosion();

        if (this.planetHealth <= 0) {
          this.planetHealth = 0;
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
      }
    }

    if (this.score >= this.level * 2500) {
      this.level++;
      this.ctx.audio.playPowerUp();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.rotateLeft = isPressed;
    if (action === "MOVE_RIGHT") this.rotateRight = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed) this.fireTurret();
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Planet
    pr.drawCircle(this.planetPos.x, this.planetPos.y, this.planetRadius, "#00FF66", true);
    pr.drawCircle(this.planetPos.x, this.planetPos.y, this.planetRadius - 8, "#047857", true);

    // Draw Rotating Turret Cannon
    const tx = this.planetPos.x + Math.cos(this.turretAngle) * (this.planetRadius + 18);
    const ty = this.planetPos.y + Math.sin(this.turretAngle) * (this.planetRadius + 18);
    pr.drawLine(this.planetPos.x, this.planetPos.y, tx, ty, "#FFFFFF", 6);
    pr.drawCircle(tx, ty, 6, "#FFB703", true);

    // Draw Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.pos.x, b.pos.y, 4, "#00F0FF", true);
    }

    // Draw Meteors
    for (const m of this.meteors) {
      pr.drawCircle(m.pos.x, m.pos.y, m.radius, "#FF3366", true);
      pr.drawCircle(m.pos.x, m.pos.y, m.radius * 0.4, "#FFFFFF", true);
    }

    pr.drawText(
      `SCORE: ${this.score}  •  PLANET SHIELD: ${this.planetHealth}%  •  [← → ROTATE, SPACE TO FIRE]`,
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
      pr.drawText("PLANET ANNIHILATED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
