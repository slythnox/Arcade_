import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

type MirrorType = "none" | "slash" | "backslash" | "target" | "emitter";

interface LaserCell {
  col: number;
  row: number;
  type: MirrorType;
  illuminated: boolean;
}

export class LaserGridGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 6;
  private readonly rows: number = 6;
  private grid: LaserCell[][] = [];
  private cursor: GridCoord = { col: 2, row: 2 };
  private laserPath: GridCoord[] = [];
  private score: number = 0;
  private level: number = 1;
  private moves: number = 0;
  private targetsTotal: number = 0;
  private targetsHit: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 2 };
    this.moves = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.generatePuzzle();
    this.traceLaser();
  }

  private generatePuzzle(): void {
    this.grid = Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) => ({
        col: c,
        row: r,
        type: "none",
        illuminated: false,
      }))
    );

    // Emitter at (0, 1) pointing right
    this.grid[1][0].type = "emitter";

    // Place mirrors and targets
    this.grid[1][4].type = "slash";
    this.grid[4][4].type = "backslash";
    this.grid[4][1].type = "slash";
    this.grid[2][1].type = "target";
    this.grid[5][4].type = "target";

    // Random noise mirrors
    this.grid[3][3].type = "slash";
    this.grid[0][2].type = "backslash";

    this.targetsTotal = 2;
  }

  private traceLaser(): void {
    this.laserPath = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].illuminated = false;
      }
    }

    let curX = 0;
    let curY = 1;
    let dirX = 1;
    let dirY = 0;

    this.targetsHit = 0;
    this.laserPath.push({ col: curX, row: curY });

    let steps = 0;
    while (steps < 40) {
      steps++;
      curX += dirX;
      curY += dirY;

      if (curX < 0 || curX >= this.cols || curY < 0 || curY >= this.rows) {
        break;
      }

      this.laserPath.push({ col: curX, row: curY });
      const cell = this.grid[curY][curX];
      cell.illuminated = true;

      if (cell.type === "slash") {
        // Reflection on '/': (dx, dy) -> (-dy, -dx)
        const oldDx = dirX;
        dirX = -dirY;
        dirY = -oldDx;
      } else if (cell.type === "backslash") {
        // Reflection on '\': (dx, dy) -> (dy, dx)
        const oldDx = dirX;
        dirX = dirY;
        dirY = oldDx;
      } else if (cell.type === "target") {
        this.targetsHit++;
      }
    }

    if (this.targetsHit >= this.targetsTotal && !this.isWon) {
      this.isWon = true;
      this.score += Math.max(100, 2000 - this.moves * 100);
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }
  }

  private rotateCurrentMirror(): void {
    const cell = this.grid[this.cursor.row][this.cursor.col];
    if (cell.type === "slash") {
      cell.type = "backslash";
      this.moves++;
      this.ctx.audio.playRotate();
      this.traceLaser();
    } else if (cell.type === "backslash") {
      cell.type = "slash";
      this.moves++;
      this.ctx.audio.playRotate();
      this.traceLaser();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.rows - 1, this.cursor.row + 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.cols - 1, this.cursor.col + 1);
        this.ctx.audio.playMove();
        break;
      case "ACTION_PRIMARY":
      case "ROTATE":
        this.rotateCurrentMirror();
        break;
      case "RESTART":
        this.reset();
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 80;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2) + 10;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "rgba(0, 255, 102, 0.5)", false);

    // Draw Grid Lines
    pr.drawGrid(this.cols, this.rows, cellSize, "rgba(0, 255, 102, 0.1)", offX, offY);

    // Draw Laser Beams
    if (this.laserPath.length > 1) {
      for (let i = 0; i < this.laserPath.length - 1; i++) {
        const p1 = this.laserPath[i];
        const p2 = this.laserPath[i + 1];
        const x1 = offX + p1.col * cellSize + cellSize / 2;
        const y1 = offY + p1.row * cellSize + cellSize / 2;
        const x2 = offX + p2.col * cellSize + cellSize / 2;
        const y2 = offY + p2.row * cellSize + cellSize / 2;
        pr.drawLine(x1, y1, x2, y2, "#00F0FF", 3);
      }
    }

    // Draw Cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (cell.type === "emitter") {
          pr.drawPixelBlock(cx + 8, cy + 8, cellSize - 16, "#00F0FF", "#FFFFFF", "#040604");
          pr.drawText("▶", cx + cellSize / 2, cy + cellSize / 2 + 6, { size: 16, color: "#FFFFFF", align: "center" });
        } else if (cell.type === "slash") {
          pr.drawLine(cx + 12, cy + cellSize - 12, cx + cellSize - 12, cy + 12, "#FFB703", 4);
        } else if (cell.type === "backslash") {
          pr.drawLine(cx + 12, cy + 12, cx + cellSize - 12, cy + cellSize - 12, "#FFB703", 4);
        } else if (cell.type === "target") {
          const tCol = cell.illuminated ? "#00FF66" : "#FF3366";
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 20, tCol, true);
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 8, "#FFFFFF", true);
        }

        // Cursor
        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#00FF66", false);
        }
      }
    }

    pr.drawText(`MOVES: ${this.moves}  •  TARGETS HIT: ${this.targetsHit} / ${this.targetsTotal}`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("CIRCUIT SYNCHRONIZED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
