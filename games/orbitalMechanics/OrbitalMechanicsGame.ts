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

export class OrbitalMechanicsGame implements GameInstance {
  private ctx!: GameContext;
  private probePos: Vector2 = new Vector2(100, 320);
  private probeVel: Vector2 = new Vector2(0, 0);
  private probeTrail: Vector2[] = [];
  private launchAngle: number = -Math.PI / 4;
  private launchSpeed: number = 320;
  private isFlying: boolean = false;
  private planets: Planet[] = [];
  private targetPos: Vector2 = new Vector2(500, 200);
  private targetRadius: number = 22;
  private score: number = 0;
  private level: number = 1;
  private isPaused: boolean = false;
  private levelCleared: boolean = false;
  private crashed: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initOrbitLevel();
  }

  private initOrbitLevel(): void {
    this.probePos = new Vector2(90, 480);
    this.probeVel = Vector2.zero();
    this.probeTrail = [];
    this.isFlying = false;
    this.levelCleared = false;
    this.crashed = false;
    this.launchAngle = -Math.PI / 3;

    // Set planets based on level
    this.planets = [
      {
        pos: new Vector2(280, 300),
        mass: 38000 + this.level * 5000,
        radius: 26,
        color: "#f59e0b",
      },
    ];

    if (this.level >= 2) {
      this.planets.push({
        pos: new Vector2(420, 420),
        mass: 28000,
        radius: 20,
        color: "#3b82f6",
      });
    }

    if (this.level >= 3) {
      this.planets.push({
        pos: new Vector2(190, 180),
        mass: 22000,
        radius: 16,
        color: "#8b5cf6",
      });
    }

    this.targetPos = new Vector2(500, 160 + ((this.level * 40) % 200));
  }

  public update(dt: number): void {
    if (this.isPaused || this.levelCleared || this.crashed) return;

    if (this.isFlying) {
      // 1. Gravitational Attraction from all planets: F = G * M / r^2
      for (const p of this.planets) {
        const delta = p.pos.sub(this.probePos);
        const distSq = Math.max(200, delta.sqrMagnitude());
        const dist = Math.sqrt(distSq);

        if (dist < p.radius + 6) {
          // Crash into planet
          this.crashed = true;
          this.ctx.audio?.playExplosion?.();
          return;
        }

        const forceMagnitude = p.mass / distSq;
        const forceDir = delta.normalize();
        const accel = forceDir.scale(forceMagnitude);

        this.probeVel = this.probeVel.add(accel.scale(dt));
      }

      // 2. Position update
      this.probePos = this.probePos.add(this.probeVel.scale(dt));

      // 3. Trail
      if (this.probeTrail.length === 0 || this.probePos.distance(this.probeTrail[this.probeTrail.length - 1]) > 8) {
        this.probeTrail.push(new Vector2(this.probePos.x, this.probePos.y));
        if (this.probeTrail.length > 80) this.probeTrail.shift();
      }

      // 4. Target Station Docking Check
      if (this.probePos.distance(this.targetPos) < this.targetRadius) {
        this.levelCleared = true;
        this.score += 2500 * this.level;
        this.ctx.audio?.playVictory?.();
        setTimeout(() => {
          this.level++;
          this.initOrbitLevel();
        }, 1000);
        return;
      }

      // Out of bounds check
      if (this.probePos.x < -100 || this.probePos.x > 700 || this.probePos.y < -100 || this.probePos.y > 700) {
        this.crashed = true;
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.crashed) {
      if (action === "ACTION_PRIMARY" || action === "RESTART") this.initOrbitLevel();
      return;
    }

    if (!this.isFlying) {
      if (action === "MOVE_LEFT") {
        this.launchAngle -= 0.06;
      } else if (action === "MOVE_RIGHT") {
        this.launchAngle += 0.06;
      } else if (action === "MOVE_UP") {
        this.launchSpeed = Math.min(600, this.launchSpeed + 20);
      } else if (action === "MOVE_DOWN") {
        this.launchSpeed = Math.max(150, this.launchSpeed - 20);
      } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
        this.probeVel = Vector2.fromAngle(this.launchAngle).scale(this.launchSpeed);
        this.isFlying = true;
        this.ctx.audio?.playRotate?.();
      }
    } else {
      if (action === "RESTART") {
        this.initOrbitLevel();
      }
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040711");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Render Target Space Station
    pr.drawCircle(this.targetPos.x, this.targetPos.y, this.targetRadius, "rgba(77, 232, 232, 0.2)", true);
    pr.drawCircle(this.targetPos.x, this.targetPos.y, this.targetRadius, "#4de8e8", false);
    pr.drawCircle(this.targetPos.x, this.targetPos.y, 4, "#ffd84d", true);

    // Render Planets and Gravitational Field Rings
    for (const p of this.planets) {
      pr.drawCircle(p.pos.x, p.pos.y, p.radius * 2.5, "rgba(255, 216, 77, 0.05)", true);
      pr.drawCircle(p.pos.x, p.pos.y, p.radius, p.color, true);
      pr.drawCircle(p.pos.x, p.pos.y, p.radius, "#ffffff", false);
    }

    // Render Probe Orbital Trail
    for (let i = 0; i < this.probeTrail.length; i++) {
      const pt = this.probeTrail[i];
      const alpha = (i + 1) / this.probeTrail.length;
      pr.drawCircle(pt.x, pt.y, 2, `rgba(77, 232, 232, ${alpha})`, true);
    }

    // Aiming Vector Line before launch
    if (!this.isFlying) {
      const aimDir = Vector2.fromAngle(this.launchAngle);
      const aimEnd = this.probePos.add(aimDir.scale(this.launchSpeed * 0.25));
      pr.drawLine(this.probePos.x, this.probePos.y, aimEnd.x, aimEnd.y, "#ffd84d", 2);
    }

    // Render Probe
    pr.drawCircle(this.probePos.x, this.probePos.y, 5, "#ffffff", true);
    pr.drawCircle(this.probePos.x, this.probePos.y, 5, "#4de8e8", false);

    // Header Status
    pr.drawText(
      `ORBITAL MECHANICS  •  LEVEL ${this.level}  •  ANGLE: ${Math.round((this.launchAngle * 180) / Math.PI)}°  •  SPEED: ${this.launchSpeed}`,
      w / 2,
      28,
      { size: 11, color: "#ffd84d", align: "center" }
    );
    pr.drawText(`[LEFT/RIGHT] ADJUST TRAJECTORY    [UP/DOWN] THRUST POWER    [SPACE/A] LAUNCH PROBE`, w / 2, 50, {
      size: 9,
      color: "#94a3b8",
      align: "center",
    });

    if (this.crashed) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(6, 11, 24, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#ff5c8a", false);
      pr.drawText("PROBE DESTROYED / LOST IN DEEP SPACE", w / 2, h / 2 - 10, { size: 16, color: "#ff5c8a", align: "center" });
      pr.drawText("PRESS SPACE TO RE-ATTEMPT ORBITAL INSERTION", w / 2, h / 2 + 18, { size: 11, color: "#e2e8f0", align: "center" });
    }
  }
}
