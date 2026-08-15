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

export class LiquidCellsGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols = 36;
  private readonly rows = 32;
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

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initLevel();
  }

  private initLevel(): void {
    this.targetFillCount = 0;
    this.targetRequired = 30 + this.level * 10;
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(EMPTY));

    // Outer boundary walls
    for (let r = 0; r < this.rows; r++) {
      this.grid[r][0] = WALL;
      this.grid[r][this.cols - 1] = WALL;
    }
    for (let c = 0; c < this.cols; c++) {
      this.grid[this.rows - 1][c] = WALL;
    }

    // Water Emitter Source at top
    this.grid[2][Math.floor(this.cols / 2)] = SOURCE;
    this.grid[2][Math.floor(this.cols / 2) - 1] = SOURCE;

    // Target beaker basin at bottom
    const targetX = 6 + (this.level * 7) % (this.cols - 14);
    for (let c = targetX; c < targetX + 8; c++) {
      this.grid[this.rows - 2][c] = TARGET;
      this.grid[this.rows - 3][c] = TARGET;
    }
    this.grid[this.rows - 3][targetX - 1] = WALL;
    this.grid[this.rows - 2][targetX - 1] = WALL;
    this.grid[this.rows - 3][targetX + 8] = WALL;
    this.grid[this.rows - 2][targetX + 8] = WALL;

    // Obstacle pegs based on level
    for (let i = 0; i < 4 + this.level * 2; i++) {
      const px = Math.floor(this.ctx.random.next() * (this.cols - 8)) + 4;
      const py = Math.floor(this.ctx.random.next() * (this.rows - 14)) + 6;
      this.grid[py][px] = WALL;
      this.grid[py][px + 1] = WALL;
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    this.simTimer += dt;
    if (this.simTimer >= 0.045) {
      this.simTimer = 0;
      this.stepFluid();
    }
  }

  private stepFluid(): void {
    // 1. Emit new water drops from SOURCE nodes
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === SOURCE) {
          if (this.grid[r + 1][c] === EMPTY) {
            this.grid[r + 1][c] = WATER;
          }
        }
      }
    }

    // 2. Simulate fluid downward gravity and horizontal pressure spreading
    const next = this.grid.map((row) => [...row]);

    for (let r = this.rows - 2; r >= 0; r--) {
      for (let c = 1; c < this.cols - 1; c++) {
        if (this.grid[r][c] === WATER) {
          // Flow Down
          if (next[r + 1][c] === EMPTY) {
            next[r + 1][c] = WATER;
            next[r][c] = EMPTY;
          } else if (next[r + 1][c] === TARGET) {
            // Reached target beaker!
            next[r][c] = EMPTY;
            this.targetFillCount++;
            this.score += 25;
            this.ctx.audio?.playCoin?.();
          } else {
            // Down-Left or Down-Right diagonal flow
            const leftOpen = next[r + 1][c - 1] === EMPTY;
            const rightOpen = next[r + 1][c + 1] === EMPTY;

            if (leftOpen && rightOpen) {
              const dir = this.ctx.random.next() < 0.5 ? -1 : 1;
              next[r + 1][c + dir] = WATER;
              next[r][c] = EMPTY;
            } else if (leftOpen) {
              next[r + 1][c - 1] = WATER;
              next[r][c] = EMPTY;
            } else if (rightOpen) {
              next[r + 1][c + 1] = WATER;
              next[r][c] = EMPTY;
            } else {
              // Horizontal hydrostatic pressure spread
              const hLeft = next[r][c - 1] === EMPTY;
              const hRight = next[r][c + 1] === EMPTY;
              if (hLeft && hRight) {
                const dir = this.ctx.random.next() < 0.5 ? -1 : 1;
                next[r][c + dir] = WATER;
                next[r][c] = EMPTY;
              } else if (hLeft) {
                next[r][c - 1] = WATER;
                next[r][c] = EMPTY;
              } else if (hRight) {
                next[r][c + 1] = WATER;
                next[r][c] = EMPTY;
              }
            }
          }
        }
      }
    }

    this.grid = next;

    // Check level clear
    if (this.targetFillCount >= this.targetRequired) {
      this.score += 1000 * this.level;
      this.level++;
      this.ctx.audio?.playVictory?.();
      this.initLevel();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") this.cursorX = Math.max(1, this.cursorX - 1);
    else if (action === "MOVE_RIGHT") this.cursorX = Math.min(this.cols - 2, this.cursorX + 1);
    else if (action === "MOVE_UP") this.cursorY = Math.max(1, this.cursorY - 1);
    else if (action === "MOVE_DOWN") this.cursorY = Math.min(this.rows - 2, this.cursorY + 1);
    else if (action === "ACTION_SECONDARY" || action === "ROTATE") {
      this.tool = this.tool === "wall" ? "water" : this.tool === "water" ? "erase" : "wall";
      this.ctx.audio?.playMove?.();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.tool === "wall") {
        if (this.grid[this.cursorY][this.cursorX] === EMPTY) {
          this.grid[this.cursorY][this.cursorX] = WALL;
          this.ctx.audio?.playHit?.();
        }
      } else if (this.tool === "water") {
        if (this.grid[this.cursorY][this.cursorX] === EMPTY) {
          this.grid[this.cursorY][this.cursorX] = WATER;
          this.ctx.audio?.playDrop?.();
        }
      } else if (this.tool === "erase") {
        if (this.grid[this.cursorY][this.cursorX] === WALL) {
          this.grid[this.cursorY][this.cursorX] = EMPTY;
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
    pr.clear("#040711");
    const w = renderer.getWidth();

    const cellSize = 14;
    const offX = Math.floor((w - this.cols * cellSize) / 2);
    const offY = 65;

    // Header Status
    pr.drawText(
      `LIQUID CELLS  •  LVL ${this.level}  •  BEAKER: [${this.targetFillCount}/${this.targetRequired}]  •  TOOL: [${this.tool.toUpperCase()}]`,
      w / 2,
      26,
      { size: 11, color: "#4de8e8", align: "center" }
    );

    pr.drawText(
      `[ARROWS] MOVE CURSOR    [A/SPACE] PLACE ${this.tool.toUpperCase()}    [B/Z] SWITCH TOOL`,
      w / 2,
      46,
      { size: 9, color: "#94a3b8", align: "center" }
    );

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = offX + c * cellSize;
        const y = offY + r * cellSize;
        const state = this.grid[r][c];

        if (state === WALL) {
          pr.drawRect(x, y, cellSize - 1, cellSize - 1, "#475569", true);
        } else if (state === WATER) {
          pr.drawRect(x, y, cellSize - 1, cellSize - 1, "#38bdf8", true);
        } else if (state === TARGET) {
          pr.drawRect(x, y, cellSize - 1, cellSize - 1, "rgba(255, 216, 77, 0.4)", true);
          pr.drawRect(x, y, cellSize - 1, cellSize - 1, "#ffd84d", false);
        } else if (state === SOURCE) {
          pr.drawRect(x, y, cellSize - 1, cellSize - 1, "#60a5fa", true);
        }
      }
    }

    // Cursor
    const cx = offX + this.cursorX * cellSize;
    const cy = offY + this.cursorY * cellSize;
    pr.drawRect(cx - 2, cy - 2, cellSize + 3, cellSize + 3, "#ffd84d", false);
  }
}
