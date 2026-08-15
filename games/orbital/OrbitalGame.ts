import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Planet {
  pos: Vector2;
  mass: number;
  radius: number;
  color: string;
}

interface Satellite {
  pos: Vector2;
  vel: Vector2;
  trail: Vector2[];
  alive: boolean;
  score: number;
}

export class OrbitalGame implements GameInstance {
  private ctx!: GameContext;
  private planet!: Planet;
  private satellites: Satellite[] = [];
  private launchAngle: number = 0;
  private launchPower: number = 240;
  private score: number = 0;
  private orbitsCompleted: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.planet = {
      pos: new Vector2(300, 360),
      mass: 80000,
      radius: 40,
      color: "#00FF66",
    };
    this.satellites = [];
    this.launchAngle = -Math.PI / 2;
    this.launchPower = 240;
    this.score = 0;
    this.orbitsCompleted = 0;
    this.gameOver = false;
    this.isPaused = false;
  }

  private launchProbe(): void {
    if (this.isPaused || this.gameOver) return;
    if (this.satellites.length >= 3) return;

    const startPos = new Vector2(300, 600);
    const vel = new Vector2(
      Math.cos(this.launchAngle) * this.launchPower,
      Math.sin(this.launchAngle) * this.launchPower
    );

    this.satellites.push({
      pos: startPos,
      vel,
      trail: [new Vector2(startPos.x, startPos.y)],
      alive: true,
      score: 0,
    });
    this.ctx.audio.playLaser();
  }

  public update(dt: number): void {
    if (this.isPaused || this.gameOver) return;

    const G = 1;
    for (let i = this.satellites.length - 1; i >= 0; i--) {
      const s = this.satellites[i];
      if (!s.alive) continue;

      // Gravitational acceleration towards planet: a = G * M / r^2 in direction of planet
      const dx = this.planet.pos.x - s.pos.x;
      const dy = this.planet.pos.y - s.pos.y;
      const r = Math.hypot(dx, dy);

      if (r < this.planet.radius + 6) {
        // Crash
        s.alive = false;
        this.satellites.splice(i, 1);
        this.ctx.audio.playExplosion();
        continue;
      }

      if (s.pos.x < -100 || s.pos.x > 700 || s.pos.y < -100 || s.pos.y > 800) {
        // Lost to deep space
        s.alive = false;
        this.satellites.splice(i, 1);
        continue;
      }

      const force = (G * this.planet.mass) / (r * r);
      const ax = (dx / r) * force;
      const ay = (dy / r) * force;

      s.vel.x += ax * dt;
      s.vel.y += ay * dt;
      s.pos.x += s.vel.x * dt;
      s.pos.y += s.vel.y * dt;

      s.trail.push(new Vector2(s.pos.x, s.pos.y));
      if (s.trail.length > 50) s.trail.shift();

      s.score += dt * 100;
      this.score += Math.round(dt * 100);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.launchAngle -= 0.12;
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.launchAngle += 0.12;
      this.ctx.audio.playMove();
    } else if (action === "MOVE_UP") {
      this.launchPower = Math.min(420, this.launchPower + 20);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_DOWN") {
      this.launchPower = Math.max(120, this.launchPower - 20);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      this.launchProbe();
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

    // Draw Planet & Gravitational Aura
    pr.drawCircle(this.planet.pos.x, this.planet.pos.y, 140, "rgba(0, 255, 102, 0.04)", true);
    pr.drawCircle(this.planet.pos.x, this.planet.pos.y, 90, "rgba(0, 255, 102, 0.08)", true);
    pr.drawCircle(this.planet.pos.x, this.planet.pos.y, this.planet.radius, "#00FF66", true);
    pr.drawCircle(this.planet.pos.x, this.planet.pos.y, this.planet.radius - 8, "#047857", true);

    // Draw Launcher Pad
    pr.drawRect(270, 595, 60, 10, "#080e08", true);
    pr.drawRect(270, 595, 60, 10, "rgba(0, 255, 102, 0.5)", false);

    // Aim Line
    const aimX = 300 + Math.cos(this.launchAngle) * (this.launchPower * 0.35);
    const aimY = 600 + Math.sin(this.launchAngle) * (this.launchPower * 0.35);
    pr.drawLine(300, 600, aimX, aimY, "#FFB703", 2);

    // Draw Satellites & Orbital Trails
    for (const s of this.satellites) {
      if (s.trail.length > 1) {
        for (let i = 0; i < s.trail.length - 1; i++) {
          pr.drawLine(s.trail[i].x, s.trail[i].y, s.trail[i + 1].x, s.trail[i + 1].y, "rgba(0, 240, 255, 0.4)", 2);
        }
      }
      pr.drawCircle(s.pos.x, s.pos.y, 6, "#00F0FF", true);
      pr.drawCircle(s.pos.x, s.pos.y, 2, "#FFFFFF", true);
    }

    pr.drawText(`ORBITAL TIME SCORE: ${this.score}  •  [← → ANGLE, ↑ ↓ POWER, SPACE TO LAUNCH]`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });
  }
}
