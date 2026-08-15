import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Particle {
  pos: Vector2;
  vel: Vector2;
  color: string;
  life: number;
}

export class ParticleLabGame implements GameInstance {
  private ctx!: GameContext;
  private emitterPos: Vector2 = new Vector2(300, 350);
  private particles: Particle[] = [];
  private gravityWell: Vector2 = new Vector2(300, 350);
  private wellActive: boolean = true;
  private wellPolarity: number = 1; // 1 = attract, -1 = repel
  private particleCount: number = 0;
  private score: number = 0;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.emitterPos = new Vector2(300, 350);
    this.gravityWell = new Vector2(300, 350);
    this.particles = [];
    this.wellActive = true;
    this.wellPolarity = 1;
    this.particleCount = 0;
    this.score = 0;
    this.isPaused = false;
  }

  private emitBurst(): void {
    const colors = ["#00FF66", "#00F0FF", "#FFB703", "#FF3366", "#A855F7"];
    for (let i = 0; i < 40; i++) {
      const angle = this.ctx.random.next() * Math.PI * 2;
      const speed = 60 + this.ctx.random.next() * 180;
      this.particles.push({
        pos: new Vector2(this.emitterPos.x, this.emitterPos.y),
        vel: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        color: colors[Math.floor(this.ctx.random.next() * colors.length)],
        life: 5.0,
      });
    }
    this.ctx.audio.playLaser();
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    // Continuous emitter stream
    if (this.particles.length < 300) {
      const angle = this.ctx.random.next() * Math.PI * 2;
      const speed = 40 + this.ctx.random.next() * 80;
      this.particles.push({
        pos: new Vector2(this.emitterPos.x, this.emitterPos.y),
        vel: new Vector2(Math.cos(angle) * speed, Math.sin(angle) * speed),
        color: "#00FF66",
        life: 4.5,
      });
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;

      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }

      // Gravitational Well Force
      if (this.wellActive) {
        const dx = this.gravityWell.x - p.pos.x;
        const dy = this.gravityWell.y - p.pos.y;
        const dist = Math.max(25, Math.hypot(dx, dy));
        const force = (35000 / (dist * dist)) * this.wellPolarity;

        p.vel.x += (dx / dist) * force * dt;
        p.vel.y += (dy / dist) * force * dt;
      }

      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;

      // Bounce on boundary walls
      if (p.pos.x < 20) { p.pos.x = 20; p.vel.x *= -0.85; }
      if (p.pos.x > 580) { p.pos.x = 580; p.vel.x *= -0.85; }
      if (p.pos.y < 50) { p.pos.y = 50; p.vel.y *= -0.85; }
      if (p.pos.y > 660) { p.pos.y = 660; p.vel.y *= -0.85; }
    }

    this.score = this.particles.length * 10;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.gravityWell.x = Math.max(40, this.gravityWell.x - 30);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.gravityWell.x = Math.min(560, this.gravityWell.x + 30);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_UP") {
      this.gravityWell.y = Math.max(60, this.gravityWell.y - 30);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_DOWN") {
      this.gravityWell.y = Math.min(640, this.gravityWell.y + 30);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY") {
      this.wellPolarity *= -1;
      this.ctx.audio.playRotate();
    } else if (action === "CONFIRM" || action === "ROTATE") {
      this.emitBurst();
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

    // Draw Gravity Well
    const wellCol = this.wellPolarity > 0 ? "#00F0FF" : "#FF3366";
    pr.drawCircle(this.gravityWell.x, this.gravityWell.y, 60, this.wellPolarity > 0 ? "rgba(0, 240, 255, 0.08)" : "rgba(255, 51, 102, 0.08)", true);
    pr.drawCircle(this.gravityWell.x, this.gravityWell.y, 14, wellCol, true);
    pr.drawCircle(this.gravityWell.x, this.gravityWell.y, 4, "#FFFFFF", true);

    // Draw Particles
    for (const p of this.particles) {
      pr.drawCircle(p.pos.x, p.pos.y, 2, p.color, true);
    }

    const modeText = this.wellPolarity > 0 ? "ATTRACT (+)" : "REPEL (-)";
    pr.drawText(
      `PARTICLES: ${this.particles.length}  •  MODE: ${modeText}  •  [SPACE TO INVERT, ENTER TO BURST]`,
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
