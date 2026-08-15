import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Well {
  pos: Vector2;
  mass: number;
}

interface Comet {
  pos: Vector2;
  vel: Vector2;
  trail: Vector2[];
}

export class GravityWellGame implements GameInstance {
  private ctx!: GameContext;
  private wells: Well[] = [];
  private comets: Comet[] = [];
  private cursor: Vector2 = new Vector2(300, 350);
  private score: number = 0;
  private spawnTimer: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = new Vector2(300, 350);
    this.wells = [
      { pos: new Vector2(220, 350), mass: 65000 },
      { pos: new Vector2(380, 350), mass: 65000 },
    ];
    this.comets = [];
    this.score = 0;
    this.spawnTimer = 0;
    this.isPaused = false;
  }

  private spawnComet(): void {
    const angle = this.ctx.random.next() * Math.PI * 2;
    const dist = 320;
    const startX = 300 + Math.cos(angle) * dist;
    const startY = 350 + Math.sin(angle) * dist;

    // Perpendicular orbital velocity
    const speed = 120 + this.ctx.random.next() * 60;
    const tangent = angle + Math.PI / 2;

    this.comets.push({
      pos: new Vector2(startX, startY),
      vel: new Vector2(Math.cos(tangent) * speed, Math.sin(tangent) * speed),
      trail: [new Vector2(startX, startY)],
    });
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    // Move cursor
    const speed = 360;
    if (this.moveLeft) this.cursor.x -= speed * dt;
    if (this.moveRight) this.cursor.x += speed * dt;
    if (this.moveUp) this.cursor.y -= speed * dt;
    if (this.moveDown) this.cursor.y += speed * dt;

    this.cursor.x = Math.max(40, Math.min(560, this.cursor.x));
    this.cursor.y = Math.max(60, Math.min(640, this.cursor.y));

    // Spawn comets
    this.spawnTimer += dt;
    if (this.spawnTimer > 0.4 && this.comets.length < 35) {
      this.spawnTimer = 0;
      this.spawnComet();
    }

    // N-Body Gravity integration
    for (let i = this.comets.length - 1; i >= 0; i--) {
      const c = this.comets[i];

      for (const w of this.wells) {
        const dx = w.pos.x - c.pos.x;
        const dy = w.pos.y - c.pos.y;
        const dist = Math.max(20, Math.hypot(dx, dy));

        if (dist < 14) {
          // Absorbed into singularity
          this.comets.splice(i, 1);
          this.score += 250;
          this.ctx.audio.playExplosion();
          break;
        }

        const force = (w.mass / (dist * dist));
        c.vel.x += (dx / dist) * force * dt;
        c.vel.y += (dy / dist) * force * dt;
      }

      c.pos.x += c.vel.x * dt;
      c.pos.y += c.vel.y * dt;

      c.trail.push(new Vector2(c.pos.x, c.pos.y));
      if (c.trail.length > 25) c.trail.shift();

      if (c.pos.x < -100 || c.pos.x > 700 || c.pos.y < -100 || c.pos.y > 800) {
        this.comets.splice(i, 1);
      }
    }

    this.score += Math.round(this.comets.length * dt * 5);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed) {
      // Place / Move nearest gravity well to cursor
      if (this.wells.length < 3) {
        this.wells.push({ pos: new Vector2(this.cursor.x, this.cursor.y), mass: 65000 });
        this.ctx.audio.playPowerUp();
      } else {
        this.wells[0].pos = new Vector2(this.cursor.x, this.cursor.y);
        this.ctx.audio.playRotate();
      }
    }
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

    // Draw Gravity Wells & Accretion Discs
    for (const well of this.wells) {
      pr.drawCircle(well.pos.x, well.pos.y, 70, "rgba(0, 240, 255, 0.06)", true);
      pr.drawCircle(well.pos.x, well.pos.y, 35, "rgba(0, 240, 255, 0.15)", true);
      pr.drawCircle(well.pos.x, well.pos.y, 16, "#00F0FF", true);
      pr.drawCircle(well.pos.x, well.pos.y, 6, "#040604", true);
    }

    // Draw Comets & Orbital Trails
    for (const c of this.comets) {
      if (c.trail.length > 1) {
        for (let i = 0; i < c.trail.length - 1; i++) {
          pr.drawLine(c.trail[i].x, c.trail[i].y, c.trail[i + 1].x, c.trail[i + 1].y, "rgba(255, 183, 3, 0.3)", 1);
        }
      }
      pr.drawCircle(c.pos.x, c.pos.y, 4, "#FFB703", true);
    }

    // Draw Cursor
    pr.drawCircle(this.cursor.x, this.cursor.y, 10, "#00FF66", false);
    pr.drawLine(this.cursor.x - 14, this.cursor.y, this.cursor.x + 14, this.cursor.y, "#00FF66", 1);
    pr.drawLine(this.cursor.x, this.cursor.y - 14, this.cursor.x, this.cursor.y + 14, "#00FF66", 1);

    pr.drawText(
      `ORBITAL TRAPS: ${this.score}  •  COMETS: ${this.comets.length}  •  [SPACE TO PLACE GRAVITY WELL]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );
  }
}
