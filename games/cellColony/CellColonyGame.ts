import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

export class CellColonyGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 120;
  private readonly rows: number = 140;
  private grid: boolean[][] = [];
  private ageGrid: Uint8Array = new Uint8Array();
  private cursor: GridCoord = { col: 60, row: 70 };
  private isRunning: boolean = true;
  private generation: number = 0;
  private aliveCount: number = 0;
  private simTimer: number = 0;
  private simSpeed: number = 1;
  private score: number = 0;
  private isPaused: boolean = false;
  private presetIndex: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.ageGrid = new Uint8Array(this.cols * this.rows);
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: Math.floor(this.cols / 2), row: Math.floor(this.rows / 2) };
    this.isRunning = true;
    this.generation = 0;
    this.simTimer = 0;
    this.score = 0;
    this.isPaused = false;
    this.simSpeed = 1;
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    this.ageGrid.fill(0);
    this.spawnPreset("glider", this.cursor.col, this.cursor.row);
  }

  private spawnPreset(name: string, cx: number, cy: number): void {
    let pattern: number[][] = [];
    if (name === "glider") {
      pattern = [[0, -1], [1, 0], [-1, 1], [0, 1], [1, 1]];
    } else if (name === "blinker") {
      pattern = [[-1, 0], [0, 0], [1, 0]];
    } else if (name === "r-pentomino") {
      pattern = [[0, -1], [1, -1], [-1, 0], [0, 0], [0, 1]];
    } else if (name === "pulsar") {
      const p = [2, 3, 4, 8, 9, 10];
      for (const i of p) {
        pattern.push([i - 6, -6], [i - 6, -1], [i - 6, 1], [i - 6, 6]);
        pattern.push([-6, i - 6], [-1, i - 6], [1, i - 6], [6, i - 6]);
      }
    } else if (name === "gosper") {
      pattern = [
        [-17, -2], [-16, -2], [-17, -1], [-16, -1],
        [-7, -2], [-7, -1], [-7, 0], [-6, -3], [-6, 1], [-5, -4], [-5, 2], [-4, -4], [-4, 2],
        [-3, -1], [-2, -3], [-2, 1], [-1, -2], [-1, -1], [-1, 0], [0, -1],
        [3, -4], [3, -3], [3, -2], [4, -4], [4, -3], [4, -2], [5, -5], [5, -1],
        [7, -6], [7, -5], [7, -1], [7, 0], [17, -4], [18, -4], [17, -3], [18, -3]
      ];
    }
    
    for (const [dx, dy] of pattern) {
      const c = (cx + dx + this.cols) % this.cols;
      const r = (cy + dy + this.rows) % this.rows;
      this.grid[r][c] = true;
      this.ageGrid[r * this.cols + c] = 1;
    }
    this.updateAliveCount();
  }

  private updateAliveCount(): void {
    let count = 0;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) count++;
      }
    }
    this.aliveCount = count;
  }

  private stepGeneration(): void {
    const nextGrid: boolean[][] = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    let count = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let neighbors = 0;
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const nr = (r + dr + this.rows) % this.rows;
            const nc = (c + dc + this.cols) % this.cols;
            if (this.grid[nr][nc]) neighbors++;
          }
        }

        const isAlive = this.grid[r][c];
        const ageIdx = r * this.cols + c;
        if (isAlive && (neighbors === 2 || neighbors === 3)) {
          nextGrid[r][c] = true;
          this.ageGrid[ageIdx] = Math.min(255, this.ageGrid[ageIdx] + 1);
          count++;
        } else if (!isAlive && neighbors === 3) {
          nextGrid[r][c] = true;
          this.ageGrid[ageIdx] = 1;
          count++;
        } else {
          this.ageGrid[ageIdx] = 0;
        }
      }
    }

    this.grid = nextGrid;
    this.aliveCount = count;
    this.generation++;
    this.score += Math.round(count * 0.5);
  }

  private toggleCell(): void {
    const { row, col } = this.cursor;
    this.grid[row][col] = !this.grid[row][col];
    this.ageGrid[row * this.cols + col] = this.grid[row][col] ? 1 : 0;
    this.updateAliveCount();
    this.ctx.audio.playMove();
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    if (this.isRunning) {
      this.simTimer += dt * this.simSpeed;
      if (this.simTimer >= 0.1) {
        this.simTimer = 0;
        this.stepGeneration();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_UP") {
      if (this.isRunning) this.simSpeed = Math.min(8, this.simSpeed * 2);
      else this.cursor.row = (this.cursor.row - 1 + this.rows) % this.rows;
    }
    if (action === "MOVE_DOWN") {
      if (this.isRunning) this.simSpeed = Math.max(0.25, this.simSpeed / 2);
      else this.cursor.row = (this.cursor.row + 1) % this.rows;
    }
    if (action === "MOVE_LEFT") {
      if (!this.isRunning) this.cursor.col = (this.cursor.col - 1 + this.cols) % this.cols;
    }
    if (action === "MOVE_RIGHT") {
      if (!this.isRunning) this.cursor.col = (this.cursor.col + 1) % this.cols;
    }
    if (action === "ACTION_PRIMARY") this.toggleCell();
    if (action === "ROTATE") {
      const presets = ["glider", "blinker", "r-pentomino", "gosper", "pulsar"];
      this.presetIndex = (this.presetIndex + 1) % presets.length;
      this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
      this.ageGrid.fill(0);
      this.spawnPreset(presets[this.presetIndex], this.cursor.col, this.cursor.row);
      this.ctx.audio.playRotate();
    }
    if (action === "CONFIRM") {
      this.isRunning = !this.isRunning;
      this.ctx.audio.playRotate();
    }
    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.generation; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    pr.clear("#040604");
    
    const w = renderer.getWidth();
    const cellSize = 5;
    const offX = 0;
    const offY = 0;

    // Draw Live Cells
    rawCtx.shadowBlur = 6;
    rawCtx.shadowColor = '#00ff88';
    
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          const cx = offX + c * cellSize;
          const cy = offY + r * cellSize;
          const age = this.ageGrid[r * this.cols + c];
          const l = Math.min(70, 30 + age * 8);
          pr.drawRect(cx, cy, cellSize - 1, cellSize - 1, `hsl(140, ${60 + age * 5}%, ${l}%)`, true);
        }
      }
    }
    rawCtx.shadowBlur = 0;

    // Draw Cursor
    if (!this.isRunning) {
      const curX = offX + this.cursor.col * cellSize;
      const curY = offY + this.cursor.row * cellSize;
      pr.drawRect(curX - 1, curY - 1, cellSize + 1, cellSize + 1, "#00F0FF", false);
    }

    // HUD Background
    pr.drawRect(0, 0, w, 40, "rgba(4, 6, 4, 0.85)", true);
    pr.drawLine(0, 40, w, 40, "#00ff88", 2);

    const statusText = this.isRunning ? `SIMULATING (x${this.simSpeed})` : "PAUSED (EDIT MODE)";
    pr.drawText(
      `Gen: ${this.generation}  |  Alive: ${this.aliveCount}  |  ${statusText}`,
      w / 2,
      16,
      { size: 12, color: "#00FF66", align: "center", font: "monospace" }
    );
    pr.drawText(
      `[SPACE: TOGGLE] [ENTER: RUN/PAUSE] [Z: PRESET] [UP/DOWN: SPEED]`,
      w / 2,
      32,
      { size: 10, color: "#00AA44", align: "center", font: "monospace" }
    );
  }
}
