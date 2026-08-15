import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

interface PipeCell {
  col: number;
  row: number;
  // Directions of open connections: [top, right, bottom, left]
  openings: [boolean, boolean, boolean, boolean];
  isFilled: boolean;
}

export class PipeConnectGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 6;
  private grid: PipeCell[][] = [];
  private cursor: GridCoord = { col: 2, row: 2 };
  private source: GridCoord = { col: 0, row: 0 };
  private sink: GridCoord = { col: 5, row: 5 };
  private moves: number = 0;
  private score: number = 0;
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
    this.generatePipes();
    this.checkFlow();
  }

  private generatePipes(): void {
    // Pipe shapes: straight (0,2 or 1,3), elbow (0,1; 1,2; 2,3; 3,0), t-junction
    const templates: [boolean, boolean, boolean, boolean][] = [
      [true, false, true, false], // straight
      [true, true, false, false],  // elbow
      [false, true, true, false],  // elbow
      [true, true, true, false],   // T-junction
      [true, true, true, true],    // Cross
    ];

    this.grid = Array.from({ length: this.size }, (_, r) =>
      Array.from({ length: this.size }, (_, c) => {
        const tmpl = templates[Math.floor(this.ctx.random.next() * templates.length)];
        const rot = Math.floor(this.ctx.random.next() * 4);
        let openings: [boolean, boolean, boolean, boolean] = [...tmpl];
        for (let i = 0; i < rot; i++) {
          openings = [openings[3], openings[0], openings[1], openings[2]];
        }
        return {
          col: c,
          row: r,
          openings,
          isFilled: false,
        };
      })
    );

    // Ensure source connects to right and sink connects from left
    this.grid[0][0].openings = [false, true, false, false];
    this.grid[5][5].openings = [false, false, false, true];
  }

  private rotatePipe(r: number, c: number): void {
    if (this.isWon || this.isPaused) return;
    const p = this.grid[r][c];
    p.openings = [p.openings[3], p.openings[0], p.openings[1], p.openings[2]];
    this.moves++;
    this.ctx.audio.playRotate();
    this.checkFlow();
  }

  private checkFlow(): void {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.grid[r][c].isFilled = false;
      }
    }

    const queue: GridCoord[] = [{ col: 0, row: 0 }];
    this.grid[0][0].isFilled = true;
    const visited = new Set<string>(["0,0"]);

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const curPipe = this.grid[cur.row][cur.col];

      // Check 4 directions
      const dirs = [
        { dr: -1, dc: 0, myIdx: 0, theirIdx: 2 }, // TOP
        { dr: 0, dc: 1, myIdx: 1, theirIdx: 3 },  // RIGHT
        { dr: 1, dc: 0, myIdx: 2, theirIdx: 0 },  // BOTTOM
        { dr: 0, dc: -1, myIdx: 3, theirIdx: 1 }, // LEFT
      ];

      for (const d of dirs) {
        if (!curPipe.openings[d.myIdx]) continue;
        const nr = cur.row + d.dr;
        const nc = cur.col + d.dc;

        if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
          const neighbor = this.grid[nr][nc];
          if (neighbor.openings[d.theirIdx]) {
            const key = `${nr},${nc}`;
            if (!visited.has(key)) {
              visited.add(key);
              neighbor.isFilled = true;
              queue.push({ col: nc, row: nr });
            }
          }
        }
      }
    }

    if (this.grid[this.sink.row][this.sink.col].isFilled && !this.isWon) {
      this.isWon = true;
      this.score = Math.max(500, 3000 - this.moves * 50);
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.isWon) return;

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
        this.ctx.audio.playMove();
        break;
      case "ACTION_PRIMARY":
      case "ROTATE":
      case "CONFIRM":
        this.rotatePipe(this.cursor.row, this.cursor.col);
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

    const cellSize = 84;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 12;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "rgba(0, 255, 102, 0.4)", false);

    pr.drawGrid(this.size, this.size, cellSize, "rgba(0, 255, 102, 0.08)", offX, offY);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const pipe = this.grid[r][c];
        const cx = offX + c * cellSize + cellSize / 2;
        const cy = offY + r * cellSize + cellSize / 2;

        const pipeColor = pipe.isFilled ? "#00F0FF" : "#1b3322";
        const pipeWidth = 10;

        // Center hub
        pr.drawCircle(cx, cy, pipeWidth / 2, pipeColor, true);

        // Draw active branches
        if (pipe.openings[0]) pr.drawLine(cx, cy, cx, cy - cellSize / 2, pipeColor, pipeWidth);
        if (pipe.openings[1]) pr.drawLine(cx, cy, cx + cellSize / 2, cy, pipeColor, pipeWidth);
        if (pipe.openings[2]) pr.drawLine(cx, cy, cx, cy + cellSize / 2, pipeColor, pipeWidth);
        if (pipe.openings[3]) pr.drawLine(cx, cy, cx - cellSize / 2, cy, pipeColor, pipeWidth);

        // Source and Sink Indicators
        if (r === 0 && c === 0) {
          pr.drawText("SOURCE", cx - 22, cy - 26, { size: 9, color: "#00FF66" });
        } else if (r === 5 && c === 5) {
          pr.drawText("SINK", cx - 14, cy + 34, { size: 9, color: "#FFB703" });
        }

        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(offX + c * cellSize, offY + r * cellSize, cellSize, cellSize, "#00FF66", false);
        }
      }
    }

    pr.drawText(`ROTATIONS: ${this.moves}  •  [SPACE TO ROTATE PIPE]`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("NETWORK CONNECTED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
