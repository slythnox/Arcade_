import type { Renderer } from "../rendering/Renderer";

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  alpha: number;
  gravity?: number;
}

export interface FloatingText {
  text: string;
  x: number;
  y: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  vy: number;
}

/**
 * Universal Particle & FX Engine for ARCADE_.
 * Emits vibrant spark bursts, trail flares, and floating score popups across games.
 */
export class ParticleSystem {
  private particles: Particle[] = [];
  private floatingTexts: FloatingText[] = [];

  public emitBurst(
    x: number,
    y: number,
    count: number = 16,
    colors: string[] = ["#FFD700", "#FF5C8A", "#00F0FF", "#ffffff"],
    speedMin: number = 40,
    speedMax: number = 180,
    gravity: number = 0
  ): void {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const life = 0.3 + Math.random() * 0.5;
      const color = colors[Math.floor(Math.random() * colors.length)];

      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        size: 2 + Math.random() * 3,
        life,
        maxLife: life,
        alpha: 1.0,
        gravity,
      });
    }
  }

  public emitText(
    text: string,
    x: number,
    y: number,
    color: string = "#FFD700",
    size: number = 16
  ): void {
    this.floatingTexts.push({
      text,
      x,
      y,
      color,
      size,
      life: 0.8,
      maxLife: 0.8,
      vy: -40,
    });
  }

  public update(dt: number): void {
    // Update particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= dt;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.gravity) {
        p.vy += p.gravity * dt;
      }
      p.alpha = Math.max(0, p.life / p.maxLife);
    }

    // Update floating texts
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.life -= dt;
      if (ft.life <= 0) {
        this.floatingTexts.splice(i, 1);
        continue;
      }
      ft.y += ft.vy * dt;
    }
  }

  public render(renderer: Renderer): void {
    const ctx = (renderer as any).getContext ? (renderer as any).getContext() : null;

    // Render particles
    for (const p of this.particles) {
      if (ctx && typeof ctx.save === "function") {
        ctx.save();
        ctx.globalAlpha = p.alpha;
        renderer.drawCircle(p.x, p.y, p.size, p.color, true);
        ctx.restore();
      } else {
        renderer.drawCircle(p.x, p.y, p.size, p.color, true);
      }
    }

    // Render floating score text popups
    for (const ft of this.floatingTexts) {
      const alpha = Math.max(0, ft.life / ft.maxLife);
      if (ctx && typeof ctx.save === "function") {
        ctx.save();
        ctx.globalAlpha = alpha;
        renderer.drawText(ft.text, ft.x, ft.y, {
          color: ft.color,
          size: ft.size,
          align: "center",
          font: "var(--font-mono)",
        });
        ctx.restore();
      } else {
        renderer.drawText(ft.text, ft.x, ft.y, {
          color: ft.color,
          size: ft.size,
          align: "center",
        });
      }
    }
  }

  public clear(): void {
    this.particles = [];
    this.floatingTexts = [];
  }
}

export const globalParticles = new ParticleSystem();
