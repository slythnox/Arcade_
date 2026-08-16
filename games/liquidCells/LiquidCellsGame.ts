import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

const EMPTY = 0;
const WALL = 1;
const WATER = 2;
const TARGET = 3;
const SOURCE = 4;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class LiquidCellsGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols = 36;
  private readonly rows = 34;
  private grid: number[][] = [];
  private cursorX = 18;
  private cursorY = 16;
  private tool: "wall" | "water" | "erase" = "wall";
  private simTimer = 0;
  private score = 0;
  private level = 1;
  private isPaused = false;
  private targetFillCount = 0;
  private targetRequired = 40;
  private particles: Particle[] = [];
  private animTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.particles = [];
    this.initLevel();
  }

  private initLevel(): void {
    this.targetFillCount = 0;
    this.targetRequired = 30 + this.level * 10;
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(EMPTY));

    // Boundary walls
    for (let r = 0; r < this.rows; r++) {
      this.grid[r][0] = WALL;
      this.grid[r][this.cols - 1] = WALL;
    }
    for (let c = 0; c < this.cols; c++) {
      this.grid[this.rows - 1][c] = WALL;
    }

    // Water Emitter Source at top
    const mid = Math.floor(this.cols / 2);
    this.grid[2][mid] = SOURCE;
    this.grid[2][mid - 1] = SOURCE;

    // Target beaker basin at bottom
    const targetX = 5 + (this.level * 8) % (this.cols - 14);
    for (let c = targetX; c < targetX + 8; c++) {
      this.grid[this.rows - 2][c] = TARGET;
    }
  }

  private addParticles(x: number, y: number, color: string, count = 4): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 20 + this.ctx.random.next() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.3,
        color,
      });
    }
  }

  private useTool(): void {
    const r = this.cursorY;
    const c = this.cursorX;
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;

    const ox = 34 + c * 15 + 7;
    const oy = 66 + r * 15 + 7;

    if (this.tool === "wall") {
      this.grid[r][c] = WALL;
      this.addParticles(ox, oy, "#94A3B8", 4);
      this.ctx.audio.playHit();
    } else if (this.tool === "water") {
      this.grid[r][c] = WATER;
      this.addParticles(ox, oy, "#38BDF8", 6);
      this.ctx.audio.playDrop();
    } else if (this.tool === "erase") {
      if (this.grid[r][c] === WALL || this.grid[r][c] === WATER) {
        this.grid[r][c] = EMPTY;
        this.addParticles(ox, oy, "#EF4444", 4);
        this.ctx.audio.playMove();
      }
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;

    this.simTimer += dt;
    if (this.simTimer >= 0.05) {
      this.simTimer = 0;
      this.stepFluid();
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  private stepFluid(): void {
    const mid = Math.floor(this.cols / 2);
    if (this.ctx.random.next() < 0.6) {
      this.grid[3][mid] = WATER;
    }

    // Step water particles downward & sideways
    for (let r = this.rows - 2; r >= 0; r--) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.grid[r][c] === WATER) {
          // Check below
          if (this.grid[r + 1][c] === EMPTY) {
            this.grid[r + 1][c] = WATER;
            this.grid[r][c] = EMPTY;
          } else if (this.grid[r + 1][c] === TARGET) {
            // Collected into target basin!
            this.grid[r][c] = EMPTY;
            this.targetFillCount++;
            this.score += 25;
            this.ctx.audio.playCoin();

            if (this.targetFillCount >= this.targetRequired) {
              this.score += 1500 * this.level;
              this.ctx.audio.playVictory();
              this.level++;
              this.initLevel();
              return;
            }
          } else {
            // Try diagonal slide down-left or down-right
            const leftFirst = this.ctx.random.next() > 0.5;
            const c1 = leftFirst ? c - 1 : c + 1;
            const c2 = leftFirst ? c + 1 : c - 1;

            if (this.grid[r + 1][c1] === EMPTY) {
              this.grid[r + 1][c1] = WATER;
              this.grid[r][c] = EMPTY;
            } else if (this.grid[r + 1][c2] === EMPTY) {
              this.grid[r + 1][c2] = WATER;
              this.grid[r][c] = EMPTY;
            } else if (this.grid[r][c1] === EMPTY) {
              this.grid[r][c1] = WATER;
              this.grid[r][c] = EMPTY;
            } else if (this.grid[r][c2] === EMPTY) {
              this.grid[r][c2] = WATER;
              this.grid[r][c] = EMPTY;
            }
          }
        }
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") this.cursorX = Math.max(1, this.cursorX - 1);
    if (action === "MOVE_RIGHT") this.cursorX = Math.min(this.cols - 2, this.cursorX + 1);
    if (action === "MOVE_UP") this.cursorY = Math.max(1, this.cursorY - 1);
    if (action === "MOVE_DOWN") this.cursorY = Math.min(this.rows - 2, this.cursorY + 1);

    if (action === "ACTION_PRIMARY") this.useTool();

    if (action === "ACTION_SECONDARY" || action === "ROTATE") {
      if (this.tool === "wall") this.tool = "water";
      else if (this.tool === "water") this.tool = "erase";
      else this.tool = "wall";
      this.ctx.audio.playRotate();
    }

    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const offX = 34;
    const offY = 66;
    const cs = 15;

    // 1. Fluid Container Grid
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * cs;
        const cy = offY + r * cs;

        if (val === WALL) {
          pr.drawPixelBlock(cx, cy, cs, "#334155", "#64748B", "#0F172A");
        } else if (val === WATER) {
          pr.drawRect(cx + 1, cy + 1, cs - 2, cs - 2, "#0284c7", true);
          pr.drawCircle(cx + cs / 2, cy + cs / 2, 3, "#38bdf8", true);
        } else if (val === TARGET) {
          const pulse = Math.sin(this.animTime * 6) * 2;
          pr.drawRect(cx, cy, cs, cs, "#166534", true);
          pr.drawCircle(cx + cs / 2, cy + cs / 2, 4 + pulse, "#22c55e", true);
        } else if (val === SOURCE) {
          pr.drawPixelBlock(cx, cy, cs, "#0284C7", "#38BDF8", "#0369A1");
        } else {
          pr.drawRect(cx, cy, cs, cs, "rgba(255, 255, 255, 0.015)", false);
        }
      }
    }

    // 2. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 3. Cursor Reticle
    const rx = offX + this.cursorX * cs;
    const ry = offY + this.cursorY * cs;
    pr.drawRect(rx - 2, ry - 2, cs + 4, cs + 4, "#ffd84d", false);

    // 4. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`LEVEL ${this.level} • BASIN: ${this.targetFillCount}/${this.targetRequired}`, w / 2, 32, { size: 13, color: "#38bdf8", align: "center", font: "monospace" });

    // Fill Gauge
    const fillPct = Math.min(1, this.targetFillCount / this.targetRequired);
    pr.drawRect(w - 120, 24, 100, 8, "#1e293b", true);
    pr.drawRect(w - 120, 24, 100 * fillPct, 8, "#22c55e", true);

    // 5. Bottom Toolbar
    pr.drawRect(0, h - 50, w, 50, "#080e1c", true);
    pr.drawLine(0, h - 50, w, h - 50, "#1e293b", 1);
    pr.drawText(
      `TOOL: [${this.tool.toUpperCase()}]  •  [SPACE] Apply  •  [Z/SHIFT] Cycle Tool`,
      w / 2,
      h - 20,
      { size: 11, color: "#94a3b8", align: "center", font: "monospace" }
    );
  }
}
