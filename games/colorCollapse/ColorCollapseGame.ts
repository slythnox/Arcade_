import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

export class ColorCollapseGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 10;
  private readonly rows: number = 12;
  private grid: number[][] = [];
  private readonly colors: string[] = ["#FF3366", "#00FF66", "#00F0FF", "#FFB703"];
  private cursor: GridCoord = { col: 4, row: 6 };
  private score: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 4, row: 6 };
    this.score = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.grid = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => Math.floor(this.ctx.random.next() * this.colors.length))
    );
  }

  private getCluster(origin: GridCoord): GridCoord[] {
    const color = this.grid[origin.row][origin.col];
    if (color === -1) return [];

    const visited = new Set<string>();
    const cluster: GridCoord[] = [];
    const queue: GridCoord[] = [origin];
    visited.add(`${origin.row},${origin.col}`);

    while (queue.length > 0) {
      const { row, col } = queue.shift()!;
      cluster.push({ row, col });

      const neighbors = [
        { row: row - 1, col },
        { row: row + 1, col },
        { row, col: col - 1 },
        { row, col: col + 1 },
      ];

      for (const n of neighbors) {
        if (n.row >= 0 && n.row < this.rows && n.col >= 0 && n.col < this.cols) {
          const key = `${n.row},${n.col}`;
          if (!visited.has(key) && this.grid[n.row][n.col] === color) {
            visited.add(key);
            queue.push(n);
          }
        }
      }
    }

    return cluster;
  }

  private collapseCluster(): void {
    if (this.gameOver || this.isWon || this.isPaused) return;

    const cluster = this.getCluster(this.cursor);
    if (cluster.length < 2) {
      this.ctx.audio.playLaser();
      return;
    }

    // Clear cluster
    for (const { row, col } of cluster) {
      this.grid[row][col] = -1;
    }

    // Score = N * (N - 1) * 10
    const points = cluster.length * (cluster.length - 1) * 10;
    this.score += points;
    this.ctx.audio.playExplosion();

    // 1. Gravity cascade down
    for (let c = 0; c < this.cols; c++) {
      let writeRow = this.rows - 1;
      for (let r = this.rows - 1; r >= 0; r--) {
        if (this.grid[r][c] !== -1) {
          this.grid[writeRow][c] = this.grid[r][c];
          if (writeRow !== r) this.grid[r][c] = -1;
          writeRow--;
        }
      }
    }

    // 2. Shift empty columns left
    let writeCol = 0;
    for (let c = 0; c < this.cols; c++) {
      const colHasBlocks = this.grid.some((row) => row[c] !== -1);
      if (colHasBlocks) {
        if (writeCol !== c) {
          for (let r = 0; r < this.rows; r++) {
            this.grid[r][writeCol] = this.grid[r][c];
            this.grid[r][c] = -1;
          }
        }
        writeCol++;
      }
    }

    this.checkGameEnd();
  }

  private checkGameEnd(): void {
    let hasValidCluster = false;
    let totalBlocks = 0;

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== -1) {
          totalBlocks++;
          const cl = this.getCluster({ row: r, col: c });
          if (cl.length >= 2) {
            hasValidCluster = true;
            break;
          }
        }
      }
      if (hasValidCluster) break;
    }

    if (totalBlocks === 0) {
      this.isWon = true;
      this.score += 2000;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    } else if (!hasValidCluster) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
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
      case "CONFIRM":
        this.collapseCluster();
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
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 50;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2) + 12;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "rgba(0, 255, 102, 0.4)", false);

    const activeCluster = this.getCluster(this.cursor);
    const clusterKeys = new Set(activeCluster.map((c) => `${c.row},${c.col}`));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (val !== -1) {
          const col = this.colors[val];
          const isHighlighted = clusterKeys.has(`${r},${c}`) && activeCluster.length >= 2;
          pr.drawPixelBlock(cx + 2, cy + 2, cellSize - 4, col, isHighlighted ? "#FFFFFF" : "rgba(255,255,255,0.3)", "#040604");
        }
      }
    }

    // Draw Cursor
    const curX = offX + this.cursor.col * cellSize;
    const curY = offY + this.cursor.row * cellSize;
    pr.drawRect(curX, curY, cellSize, cellSize, "#FFFFFF", false);

    pr.drawText(`SCORE: ${this.score}  •  CLUSTER: ${activeCluster.length}  •  [SPACE TO COLLAPSE]`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("BOARD CLEARED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("NO MATCHING CLUSTERS — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
