import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { Vector2 } from "../../core/math/vector";

class Mass {
  pos: Vector2;
  vel: Vector2;
  pinned: boolean;
  constructor(x: number, y: number, pinned: boolean = false) {
    this.pos = new Vector2(x, y);
    this.vel = new Vector2(0, 0);
    this.pinned = pinned;
  }
}

class Spring {
  a: Mass;
  b: Mass;
  restLength: number;
  stiffness: number;
  constructor(a: Mass, b: Mass, restLength: number, stiffness: number = 50) {
    this.a = a;
    this.b = b;
    this.restLength = restLength;
    this.stiffness = stiffness;
  }
}

export class SpringMassGame implements GameInstance {
  private ctx!: GameContext;
  private masses: Mass[] = [];
  private springs: Spring[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(): void {
    this.masses = [];
    this.springs = [];
    const m1 = new Mass(300, 100, true);
    const m2 = new Mass(300, 200, false);
    this.masses.push(m1, m2);
    this.springs.push(new Spring(m1, m2, 100, 100));
  }

  public update(dt: number): void {
    const gravity = new Vector2(0, 200);
    
    // Spring forces
    for (const spring of this.springs) {
      const dx = spring.b.pos.x - spring.a.pos.x;
      const dy = spring.b.pos.y - spring.a.pos.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist === 0) continue;
      
      const extension = dist - spring.restLength;
      const force = (extension * spring.stiffness);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;
      
      if (!spring.a.pinned) {
        spring.a.vel.x += fx * dt;
        spring.a.vel.y += fy * dt;
      }
      if (!spring.b.pinned) {
        spring.b.vel.x -= fx * dt;
        spring.b.vel.y -= fy * dt;
      }
    }

    for (const mass of this.masses) {
      if (mass.pinned) continue;
      mass.vel.x += gravity.x * dt;
      mass.vel.y += gravity.y * dt;
      
      mass.vel.x *= 0.98; // damping
      mass.vel.y *= 0.98;
      
      mass.pos.x += mass.vel.x * dt;
      mass.pos.y += mass.vel.y * dt;
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#222");

    for (const spring of this.springs) {
      // tension color could be calculated here
      pr.drawLine(spring.a.pos.x, spring.a.pos.y, spring.b.pos.x, spring.b.pos.y, "#888", 2);
    }
    for (const mass of this.masses) {
      pr.drawCircle(mass.pos.x, mass.pos.y, 5, mass.pinned ? "#f00" : "#fff", true);
    }
  }

  public handleInput(action: string, isPressed: boolean): void {}
  public getScore(): number { return 0; }
  public getLevel(): number { return 1; }
  public pause(): void {}
  public resume(): void {}
  public destroy(): void {}
}
