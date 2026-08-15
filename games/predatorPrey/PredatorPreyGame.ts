import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

class Boid {
  pos: Vector2;
  vel: Vector2;
  acc: Vector2;
  maxSpeed: number;
  maxForce: number;
  isPredator: boolean;
  deadTimer: number = 0;

  constructor(x: number, y: number, isPredator: boolean) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(Math.random() * 2 - 1, Math.random() * 2 - 1).normalize();
    this.acc = new Vector2(0, 0);
    this.isPredator = isPredator;
    this.maxSpeed = isPredator ? 2.8 : 2.0;
    this.maxForce = 0.1;
  }

  update() {
    if (this.deadTimer > 0) {
      this.deadTimer--;
      if (this.deadTimer === 0) {
        this.pos = new Vector2(Math.random() * 800, Math.random() * 600);
      }
      return;
    }
    this.vel.addMut(this.acc);
    if (this.vel.sqrMagnitude() > this.maxSpeed * this.maxSpeed) {
      this.vel.normalizeMut().scaleMut(this.maxSpeed);
    }
    this.pos.addMut(this.vel);
    this.acc.set(0, 0);
    this.wrap();
  }

  applyForce(force: Vector2) {
    this.acc.addMut(force);
  }

  wrap() {
    if (this.pos.x < 0) this.pos.x = 800;
    if (this.pos.y < 0) this.pos.y = 600;
    if (this.pos.x > 800) this.pos.x = 0;
    if (this.pos.y > 600) this.pos.y = 0;
  }
}

export class PredatorPreyGame implements GameInstance {
  private ctx!: GameContext;
  private prey: Boid[] = [];
  private predators: Boid[] = [];
  private isPaused = false;
  private score = 0;
  private survivalTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.prey = [];
    this.predators = [];
    this.score = 0;
    this.survivalTime = 0;

    for (let i = 0; i < 30; i++) {
      this.prey.push(new Boid(this.ctx.random.nextFloat() * 800, this.ctx.random.nextFloat() * 600, false));
    }
    for (let i = 0; i < 3; i++) {
      this.predators.push(new Boid(this.ctx.random.nextFloat() * 800, this.ctx.random.nextFloat() * 600, true));
    }
  }

  public update(deltaTime: number): void {
    if (this.isPaused) return;
    this.survivalTime += deltaTime;
    this.score = Math.floor(this.survivalTime * 10);

    for (const p of this.prey) {
      if (p.deadTimer > 0) {
        p.update();
        continue;
      }
      const sep = new Vector2(0, 0);
      const align = new Vector2(0, 0);
      const coh = new Vector2(0, 0);
      let countSep = 0;
      let countAlign = 0;
      let countCoh = 0;

      for (const other of this.prey) {
        if (p === other || other.deadTimer > 0) continue;
        const d = p.pos.distance(other.pos);
        if (d > 0 && d < 25) {
          const diff = p.pos.sub(other.pos).normalize().scale(1 / d);
          sep.addMut(diff);
          countSep++;
        }
        if (d > 0 && d < 80) {
          align.addMut(other.vel);
          countAlign++;
          coh.addMut(other.pos);
          countCoh++;
        }
      }

      if (countSep > 0) {
        sep.scaleMut(1 / countSep).normalizeMut().scaleMut(p.maxSpeed).subMut(p.vel);
        if (sep.sqrMagnitude() > p.maxForce * p.maxForce) sep.normalizeMut().scaleMut(p.maxForce);
        sep.scaleMut(1.5);
        p.applyForce(sep);
      }
      if (countAlign > 0) {
        align.scaleMut(1 / countAlign).normalizeMut().scaleMut(p.maxSpeed).subMut(p.vel);
        if (align.sqrMagnitude() > p.maxForce * p.maxForce) align.normalizeMut().scaleMut(p.maxForce);
        p.applyForce(align);
      }
      if (countCoh > 0) {
        coh.scaleMut(1 / countCoh);
        const desired = coh.sub(p.pos).normalize().scale(p.maxSpeed);
        const steer = desired.sub(p.vel);
        if (steer.sqrMagnitude() > p.maxForce * p.maxForce) steer.normalizeMut().scaleMut(p.maxForce);
        steer.scaleMut(0.8);
        p.applyForce(steer);
      }

      // Flee predators
      for (const pred of this.predators) {
        if (p.pos.distance(pred.pos) < 80) {
          const steer = p.pos.sub(pred.pos).normalize().scale(p.maxSpeed).sub(p.vel);
          if (steer.sqrMagnitude() > p.maxForce * p.maxForce) steer.normalizeMut().scaleMut(p.maxForce);
          steer.scaleMut(2.0);
          p.applyForce(steer);
        }
      }
      p.update();
    }

    for (const pred of this.predators) {
      const closePrey = this.prey
        .filter((p) => p.deadTimer === 0)
        .map((p) => ({ p, d: pred.pos.distance(p.pos) }))
        .sort((a, b) => a.d - b.d)
        .slice(0, 5);

      if (closePrey.length > 0) {
        const center = new Vector2(0, 0);
        for (const item of closePrey) {
          center.addMut(item.p.pos);
          if (item.d < 15) {
            item.p.deadTimer = 180;
          }
        }
        center.scaleMut(1 / closePrey.length);
        const steer = center.sub(pred.pos).normalize().scale(pred.maxSpeed).sub(pred.vel);
        if (steer.sqrMagnitude() > pred.maxForce * pred.maxForce) steer.normalizeMut().scaleMut(pred.maxForce);
        pred.applyForce(steer);
      }
      pred.update();
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#04060c");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    for (const p of this.prey) {
      if (p.deadTimer > 0) continue;
      pr.drawRect(p.pos.x - 2, p.pos.y - 2, 4, 4, "#63e66d", true);
    }

    for (const pred of this.predators) {
      pr.drawRect(pred.pos.x - 4, pred.pos.y - 4, 8, 8, "#ff5c8a", true);
    }

    // HUD
    pr.drawRect(0, h - 50, w, 50, "#080e1c", true);
    const aliveCount = this.prey.filter((p) => p.deadTimer === 0).length;
    pr.drawText(`PREDATOR-PREY | Active Prey: ${aliveCount}/30 | Predators: 3 | Score: ${this.score}`, 16, h - 30, {
      color: "#ffd84d",
      size: 11,
    });
    pr.drawText("[R] Restart Ecosystem", 16, h - 12, { color: "#4de8e8", size: 9 });
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    if (action === "RESTART") this.reset();
  }

  public pause(): void {
    this.isPaused = true;
  }
  public resume(): void {
    this.isPaused = false;
  }
  public destroy(): void {}
  public getScore(): number {
    return this.score;
  }
  public getLevel(): number {
    return 1;
  }
}
