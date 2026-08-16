import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

const EMPTY = 0;
const TREE = 1;
const BURNING = 2;
const BURNT = 3;
const WATER = 4;
const FIREBREAK = 5;

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class FireSpreadGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols = 38;
  private readonly rows = 36;
  private grid: number[][] = [];
  private cursorX = 19;
  private cursorY = 18;
  private tool: "water" | "firebreak" | "tree" = "water";
  private spreadTimer = 0;
  private readonly spreadInterval = 0.16;
  private windDir: "N" | "S" | "E" | "W" = "E";
  private score = 0;
  private level = 1;
  private isPaused = false;
  private firesActive = 0;
  private initialTrees = 0;
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
    this.initForest();
  }

  private initForest(): void {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => (this.ctx.random.next() < 0.75 ? TREE : EMPTY))
    );

    this.initialTrees = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === TREE) this.initialTrees++;
      }
    }

    // Ignite 2 initial sparks
    for (let i = 0; i < 2 + this.level; i++) {
      const rx = Math.floor(this.ctx.random.next() * (this.cols - 10)) + 5;
      const ry = Math.floor(this.ctx.random.next() * (this.rows - 10)) + 5;
      this.grid[ry][rx] = BURNING;
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
        life: 0.35,
        color,
      });
    }
  }

  private useTool(): void {
    const r = this.cursorY;
    const c = this.cursorX;
    if (r < 0 || r >= this.rows || c < 0 || c >= this.cols) return;

    const ox = 24 + c * 14 + 7;
    const oy = 68 + r * 14 + 7;

    if (this.tool === "water") {
      // Extinguish 3x3 area
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
            if (this.grid[nr][nc] === BURNING) {
              this.grid[nr][nc] = WATER;
              this.score += 50;
            }
          }
        }
      }
      this.addParticles(ox, oy, "#38BDF8", 12);
      this.ctx.audio.playDrop();
    } else if (this.tool === "firebreak") {
      this.grid[r][c] = FIREBREAK;
      this.addParticles(ox, oy, "#B45309", 6);
      this.ctx.audio.playHit();
    } else if (this.tool === "tree") {
      this.grid[r][c] = TREE;
      this.addParticles(ox, oy, "#22C55E", 6);
      this.ctx.audio.playMove();
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;

    this.spreadTimer += dt;
    if (this.spreadTimer >= this.spreadInterval) {
      this.spreadTimer = 0;
      this.stepFire();
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

  private stepFire(): void {
    const next = this.grid.map((row) => [...row]);
    this.firesActive = 0;

    const windMod = {
      N: { dr: -1, dc: 0 },
      S: { dr: 1, dc: 0 },
      E: { dr: 0, dc: 1 },
      W: { dr: 0, dc: -1 },
    }[this.windDir];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === BURNING) {
          next[r][c] = BURNT;
          this.firesActive++;

          // Ignite neighbors
          const dirs = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
          ];

          for (const [dr, dc] of dirs) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              if (this.grid[nr][nc] === TREE) {
                let chance = 0.45;
                if (dr === windMod.dr && dc === windMod.dc) chance += 0.35;
                if (this.ctx.random.next() < chance) {
                  next[nr][nc] = BURNING;
                }
              }
            }
          }
        }
      }
    }

    this.grid = next;

    // Victory if all fires extinguished
    if (this.firesActive === 0) {
      let savedTrees = 0;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c] === TREE) savedTrees++;
        }
      }
      const savedPct = Math.floor((savedTrees / Math.max(1, this.initialTrees)) * 100);
      this.score += savedPct * 100 * this.level;
      this.ctx.audio.playVictory();
      this.level++;
      setTimeout(() => this.initForest(), 1200);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") this.cursorX = Math.max(0, this.cursorX - 1);
    if (action === "MOVE_RIGHT") this.cursorX = Math.min(this.cols - 1, this.cursorX + 1);
    if (action === "MOVE_UP") this.cursorY = Math.max(0, this.cursorY - 1);
    if (action === "MOVE_DOWN") this.cursorY = Math.min(this.rows - 1, this.cursorY + 1);

    if (action === "ACTION_PRIMARY") this.useTool();

    if (action === "ACTION_SECONDARY" || action === "ROTATE") {
      if (this.tool === "water") this.tool = "firebreak";
      else if (this.tool === "firebreak") this.tool = "tree";
      else this.tool = "water";
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

    const offX = 24;
    const offY = 68;
    const cs = 14;

    // 1. Draw Forest Cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * cs;
        const cy = offY + r * cs;

        if (val === TREE) {
          pr.drawRect(cx + 1, cy + 1, cs - 2, cs - 2, "#15803d", true);
          pr.drawCircle(cx + 7, cy + 6, 4, "#22c55e", true);
        } else if (val === BURNING) {
          const flamePulse = Math.sin(this.animTime * 12 + r + c) > 0;
          pr.drawRect(cx + 1, cy + 1, cs - 2, cs - 2, flamePulse ? "#ef4444" : "#f59e0b", true);
          pr.drawCircle(cx + 7, cy + 7, 3, "#ffd84d", true);
        } else if (val === BURNT) {
          pr.drawRect(cx + 2, cy + 2, cs - 4, cs - 4, "#1e293b", true);
        } else if (val === WATER) {
          pr.drawRect(cx + 1, cy + 1, cs - 2, cs - 2, "#0284c7", true);
          pr.drawCircle(cx + 7, cy + 7, 3, "#38bdf8", true);
        } else if (val === FIREBREAK) {
          pr.drawRect(cx + 1, cy + 1, cs - 2, cs - 2, "#78350f", true);
        } else {
          // Empty soil
          pr.drawRect(cx + 2, cy + 2, cs - 4, cs - 4, "#0b1324", true);
        }
      }
    }

    // 2. Particles (Smoke & Embers)
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 3. Draw Reticle Cursor Box
    const rx = offX + this.cursorX * cs;
    const ry = offY + this.cursorY * cs;
    pr.drawRect(rx - 14, ry - 14, cs + 28, cs + 28, "rgba(56, 189, 248, 0.3)", false);
    pr.drawRect(rx, ry, cs, cs, "#ffd84d", false);

    // 4. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`SECTOR ${this.level} • FIRES: ${this.firesActive}`, w / 2, 32, { size: 13, color: "#f43f5e", align: "center", font: "monospace" });
    pr.drawText(`WIND: ${this.windDir} ▶`, w - 20, 32, { size: 13, color: "#38bdf8", align: "right", font: "monospace" });

    // 5. Bottom Toolbar
    pr.drawRect(0, h - 50, w, 50, "#080e1c", true);
    pr.drawLine(0, h - 50, w, h - 50, "#1e293b", 1);
    pr.drawText(
      `ACTIVE TOOL: [${this.tool.toUpperCase()}]  •  [SPACE] Deploy  •  [Z/SHIFT] Cycle Tool`,
      w / 2,
      h - 20,
      { size: 11, color: "#94a3b8", align: "center", font: "monospace" }
    );
  }
}
