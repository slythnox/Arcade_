import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class CellColonyGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 30;
  private readonly rows: number = 32;
  private grid: boolean[][] = [];
  private cursor: GridCoord = { col: 15, row: 16 };
  private isRunning: boolean = true;
  private generation: number = 0;
  private aliveCount: number = 0;
  private simTimer: number = 0;
  private score: number = 0;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 15, row: 16 };
    this.isRunning = true;
    this.generation = 0;
    this.simTimer = 0;
    this.score = 0;
    this.isPaused = false;
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => this.ctx.random.next() < 0.22)
    );
  }

  private stepGeneration(): void {
    const nextGrid: boolean[][] = Array.from({ length: this.rows }, () => Array(this.cols).fill(false));
    let count = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        // Count Moore 8-neighbors with toroidal wrap
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
        if (isAlive && (neighbors === 2 || neighbors === 3)) {
          nextGrid[r][c] = true;
          count++;
        } else if (!isAlive && neighbors === 3) {
          nextGrid[r][c] = true;
          count++;
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
    this.ctx.audio.playMove();
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    if (this.isRunning) {
      this.simTimer += dt;
      if (this.simTimer >= 0.1) {
        this.simTimer = 0;
        this.stepGeneration();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_UP") this.cursor.row = (this.cursor.row - 1 + this.rows) % this.rows;
    if (action === "MOVE_DOWN") this.cursor.row = (this.cursor.row + 1) % this.rows;
    if (action === "MOVE_LEFT") this.cursor.col = (this.cursor.col - 1 + this.cols) % this.cols;
    if (action === "MOVE_RIGHT") this.cursor.col = (this.cursor.col + 1) % this.cols;
    if (action === "ACTION_PRIMARY") this.toggleCell();
    if (action === "ROTATE" || action === "CONFIRM") {
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
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 18;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 70;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "rgba(0, 255, 102, 0.4)", false);

    // Draw Live Cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c]) {
          const cx = offX + c * cellSize;
          const cy = offY + r * cellSize;
          pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "#00FF66", true);
        }
      }
    }

    // Draw Cursor
    const curX = offX + this.cursor.col * cellSize;
    const curY = offY + this.cursor.row * cellSize;
    pr.drawRect(curX, curY, cellSize, cellSize, "#00F0FF", false);

    const statusText = this.isRunning ? "SIMULATING (60Hz)" : "PAUSED (EDIT MODE)";
    pr.drawText(
      `GEN: ${this.generation}  •  POPULATION: ${this.aliveCount}  •  ${statusText}  •  [SPACE: TOGGLE, ENTER: RUN/PAUSE]`,
      w / 2,
      28,
      {
        size: 10,
        color: "#00FF66",
        align: "center",
      }
    );
  }
}
