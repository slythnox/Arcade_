import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface ICBMMissile {
  start: Vector2;
  current: Vector2;
  target: Vector2;
  speed: number;
}

interface FlakExplosion {
  pos: Vector2;
  radius: number;
  maxRadius: number;
  expanding: boolean;
}

export class MissileCommandGame implements GameInstance {
  private ctx!: GameContext;
  private crosshair: Vector2 = new Vector2(300, 350);
  private missiles: ICBMMissile[] = [];
  private explosions: FlakExplosion[] = [];
  private cities: { x: number; alive: boolean }[] = [];
  private ammo: number = 30;
  private spawnTimer: number = 0;
  private score: number = 0;
  private level: number = 1;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.crosshair = new Vector2(300, 350);
    this.missiles = [];
    this.explosions = [];
    this.cities = [
      { x: 120, alive: true },
      { x: 220, alive: true },
      { x: 380, alive: true },
      { x: 480, alive: true },
    ];
    this.ammo = 30;
    this.score = 0;
    this.level = 1;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  private launchAntiAir(): void {
    if (this.gameOver || this.isPaused || this.ammo <= 0) return;

    this.ammo--;
    this.explosions.push({
      pos: new Vector2(this.crosshair.x, this.crosshair.y),
      radius: 2,
      maxRadius: 36,
      expanding: true,
    });
    this.ctx.audio.playExplosion();
  }

  private spawnICBM(): void {
    const startX = 30 + this.ctx.random.next() * 540;
    const aliveCities = this.cities.filter((c) => c.alive);
    const targetX = aliveCities.length > 0
      ? aliveCities[Math.floor(this.ctx.random.next() * aliveCities.length)].x
      : 300;

    this.missiles.push({
      start: new Vector2(startX, 40),
      current: new Vector2(startX, 40),
      target: new Vector2(targetX, 630),
      speed: 65 + this.level * 15,
    });
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Crosshair movement
    const speed = 480;
    if (this.moveLeft) this.crosshair.x -= speed * dt;
    if (this.moveRight) this.crosshair.x += speed * dt;
    if (this.moveUp) this.crosshair.y -= speed * dt;
    if (this.moveDown) this.crosshair.y += speed * dt;

    this.crosshair.x = Math.max(30, Math.min(570, this.crosshair.x));
    this.crosshair.y = Math.max(60, Math.min(620, this.crosshair.y));

    // Spawn ICBMs
    this.spawnTimer += dt;
    if (this.spawnTimer > Math.max(0.6, 1.8 - this.level * 0.15)) {
      this.spawnTimer = 0;
      this.spawnICBM();
    }

    // Update Explosions
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      if (exp.expanding) {
        exp.radius += 70 * dt;
        if (exp.radius >= exp.maxRadius) exp.expanding = false;
      } else {
        exp.radius -= 35 * dt;
        if (exp.radius <= 0) {
          this.explosions.splice(i, 1);
        }
      }
    }

    // Update Missiles & Check Interception with Flak
    for (let i = this.missiles.length - 1; i >= 0; i--) {
      const m = this.missiles[i];
      const dx = m.target.x - m.start.x;
      const dy = m.target.y - m.start.y;
      const totalDist = Math.hypot(dx, dy);

      const step = (m.speed * dt) / totalDist;
      m.current.x += dx * step;
      m.current.y += dy * step;

      // Check hit by flak explosion
      let intercepted = false;
      for (const exp of this.explosions) {
        if (Math.hypot(m.current.x - exp.pos.x, m.current.y - exp.pos.y) < exp.radius) {
          this.missiles.splice(i, 1);
          this.score += 200;
          this.ctx.audio.playExplosion();
          intercepted = true;
          break;
        }
      }

      if (intercepted) continue;

      // Ground Impact
      if (m.current.y >= 620) {
        this.missiles.splice(i, 1);
        this.ctx.audio.playExplosion();

        // Check if city hit
        for (const city of this.cities) {
          if (city.alive && Math.abs(m.current.x - city.x) < 30) {
            city.alive = false;
            break;
          }
        }

        if (this.cities.every((c) => !c.alive)) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
      }
    }

    if (this.score >= this.level * 3000) {
      this.level++;
      this.ammo += 15;
      this.ctx.audio.playPowerUp();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed) this.launchAntiAir();
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

    // Ground line
    pr.drawRect(10, 630, w - 20, 40, "#080e08", true);
    pr.drawLine(10, 630, w - 10, 630, "#00FF66", 2);

    // Draw Cities
    for (const c of this.cities) {
      if (c.alive) {
        pr.drawPixelBlock(c.x - 18, 608, 36, "#00F0FF", "#FFFFFF", "#047857");
      } else {
        pr.drawPixelBlock(c.x - 18, 624, 36, "#334155", "#64748B", "#040604");
      }
    }

    // Draw Missile Streaks
    for (const m of this.missiles) {
      pr.drawLine(m.start.x, m.start.y, m.current.x, m.current.y, "#FF3366", 2);
      pr.drawCircle(m.current.x, m.current.y, 3, "#FFFFFF", true);
    }

    // Draw Flak Explosions
    for (const exp of this.explosions) {
      pr.drawCircle(exp.pos.x, exp.pos.y, exp.radius, "rgba(255, 183, 3, 0.3)", true);
      pr.drawCircle(exp.pos.x, exp.pos.y, exp.radius * 0.7, "#FFB703", true);
      pr.drawCircle(exp.pos.x, exp.pos.y, exp.radius * 0.3, "#FFFFFF", true);
    }

    // Draw Crosshair
    const rx = this.crosshair.x;
    const ry = this.crosshair.y;
    pr.drawCircle(rx, ry, 12, "#00FF66", false);
    pr.drawLine(rx - 16, ry, rx + 16, ry, "#00FF66", 1);
    pr.drawLine(rx, ry - 16, rx, ry + 16, "#00FF66", 1);

    pr.drawText(
      `AMMO: ${this.ammo}  •  SCORE: ${this.score}  •  LEVEL: ${this.level}  •  [SPACE TO DETONATE FLAK]`,
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
      pr.drawText("ALL CITIES DESTROYED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
