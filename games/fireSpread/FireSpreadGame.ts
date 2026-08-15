import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

const EMPTY = 0;
const TREE = 1;
const BURNING = 2;
const BURNT = 3;
const WATER = 4;
const FIREBREAK = 5;

export class FireSpreadGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols = 40;
  private readonly rows = 30;
  private grid: number[][] = [];
  private cursorX = 20;
  private cursorY = 15;
  private tool: "water" | "firebreak" | "tree" = "water";
  private spreadTimer = 0;
  private readonly spreadInterval = 0.18; // Seconds per CA step
  private windDir: "N" | "S" | "E" | "W" = "E";
  private score = 0;
  private level = 1;
  private isPaused = false;
  private firesActive = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initForest();
  }

  private initForest(): void {
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => (this.ctx.random.next() < 0.72 ? TREE : EMPTY))
    );

    // Ignite 2-3 initial fire sparks
    const sparkCount = 2 + Math.min(4, this.level);
    for (let i = 0; i < sparkCount; i++) {
      const rx = Math.floor(this.ctx.random.next() * (this.cols - 10)) + 5;
      const ry = Math.floor(this.ctx.random.next() * (this.rows - 10)) + 5;
      this.grid[ry][rx] = BURNING;
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    this.spreadTimer += dt;
    if (this.spreadTimer >= this.spreadInterval) {
      this.spreadTimer = 0;
      this.stepFire();
    }
  }

  private stepFire(): void {
    const next: number[][] = this.grid.map((row) => [...row]);
    let activeFires = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === BURNING) {
          activeFires++;
          // Burning tree turns into burnt ash
          next[r][c] = BURNT;

          // Propagate to 8 neighbors
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              const nr = r + dr;
              const nc = c + dc;

              if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
                if (this.grid[nr][nc] === TREE) {
                  let chance = 0.35;
                  // Wind directional bias
                  if (this.windDir === "E" && dc > 0) chance += 0.3;
                  if (this.windDir === "W" && dc < 0) chance += 0.3;
                  if (this.windDir === "S" && dr > 0) chance += 0.3;
                  if (this.windDir === "N" && dr < 0) chance += 0.3;

                  if (this.ctx.random.next() < chance) {
                    next[nr][nc] = BURNING;
                  }
                }
              }
            }
          }
        }
      }
    }

    this.grid = next;
    this.firesActive = activeFires;

    if (activeFires === 0) {
      // Level cleared: count saved trees
      let savedTrees = 0;
      for (let r = 0; r < this.rows; r++) {
        for (let c = 0; c < this.cols; c++) {
          if (this.grid[r][c] === TREE) savedTrees++;
        }
      }
      this.score += savedTrees * 10 * this.level;
      this.level++;
      this.ctx.audio?.playVictory?.();
      this.initForest();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.cursorX = Math.max(0, this.cursorX - 1);
    } else if (action === "MOVE_RIGHT") {
      this.cursorX = Math.min(this.cols - 1, this.cursorX + 1);
    } else if (action === "MOVE_UP") {
      this.cursorY = Math.max(0, this.cursorY - 1);
    } else if (action === "MOVE_DOWN") {
      this.cursorY = Math.min(this.rows - 1, this.cursorY + 1);
    } else if (action === "ACTION_SECONDARY" || action === "ROTATE") {
      // Cycle tool: Water -> Firebreak -> Tree
      this.tool = this.tool === "water" ? "firebreak" : this.tool === "firebreak" ? "tree" : "water";
      this.ctx.audio?.playMove?.();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      // Apply tool at cursor
      if (this.tool === "water") {
        // Extinguish 3x3 radius
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const nr = this.cursorY + dr;
            const nc = this.cursorX + dc;
            if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
              if (this.grid[nr][nc] === BURNING) {
                this.grid[nr][nc] = TREE;
                this.score += 50;
              }
            }
          }
        }
        this.ctx.audio?.playLineClear?.();
      } else if (this.tool === "firebreak") {
        if (this.grid[this.cursorY][this.cursorX] !== BURNING) {
          this.grid[this.cursorY][this.cursorX] = FIREBREAK;
          this.ctx.audio?.playHit?.();
        }
      } else if (this.tool === "tree") {
        if (this.grid[this.cursorY][this.cursorX] === EMPTY || this.grid[this.cursorY][this.cursorX] === BURNT) {
          this.grid[this.cursorY][this.cursorX] = TREE;
          this.ctx.audio?.playMove?.();
        }
      }
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#050914");
    const w = renderer.getWidth();

    const cellSize = 14;
    const offX = Math.floor((w - this.cols * cellSize) / 2);
    const offY = 70;

    // Header Info
    pr.drawText(`FIRE SPREAD  •  LVL ${this.level}  •  WIND: [${this.windDir}]  •  TOOL: [${this.tool.toUpperCase()}]`, w / 2, 28, {
      size: 11,
      color: "#ffd84d",
      align: "center",
    });

    pr.drawText(`[ARROWS] CURSOR   [A/SPACE] USE TOOL   [B/Z] CYCLE TOOL (WATER / BREAK / TREE)`, w / 2, 48, {
      size: 9,
      color: "#94a3b8",
      align: "center",
    });

    // Draw Grid
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = offX + c * cellSize;
        const y = offY + r * cellSize;
        const state = this.grid[r][c];

        let color = "#0a1324";
        if (state === TREE) color = "#16a34a";
        else if (state === BURNING) color = (r + c) % 2 === 0 ? "#ef4444" : "#f59e0b";
        else if (state === BURNT) color = "#334155";
        else if (state === FIREBREAK) color = "#78350f";

        pr.drawRect(x, y, cellSize - 1, cellSize - 1, color, true);
      }
    }

    // Draw Cursor Box
    const cx = offX + this.cursorX * cellSize;
    const cy = offY + this.cursorY * cellSize;
    pr.drawRect(cx - 2, cy - 2, cellSize + 3, cellSize + 3, "#4de8e8", false);
  }
}
