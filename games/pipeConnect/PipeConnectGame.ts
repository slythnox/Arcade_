import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

interface PipeCell {
  col: number;
  row: number;
  openings: [boolean, boolean, boolean, boolean]; // [top, right, bottom, left]
  isFilled: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
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
  private level: number = 1;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private particles: Particle[] = [];
  private animTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 2 };
    this.moves = 0;
    this.score = 0;
    this.level = 1;
    this.isWon = false;
    this.isPaused = false;
    this.particles = [];
    this.generatePipes();
    this.checkFlow();
  }

  private generatePipes(): void {
    const templates: [boolean, boolean, boolean, boolean][] = [
      [true, false, true, false],
      [true, true, false, false],
      [false, true, true, false],
      [true, true, true, false],
      [true, true, true, true],
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

    // Guarantee source and sink initial openings
    this.grid[this.source.row][this.source.col].openings[1] = true;
    this.grid[this.sink.row][this.sink.col].openings[3] = true;
  }

  private checkFlow(): void {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        this.grid[r][c].isFilled = false;
      }
    }

    const queue: GridCoord[] = [{ col: this.source.col, row: this.source.row }];
    const visited = new Set<string>();
    visited.add(`${this.source.col},${this.source.row}`);
    this.grid[this.source.row][this.source.col].isFilled = true;

    while (queue.length > 0) {
      const cur = queue.shift()!;
      const cell = this.grid[cur.row][cur.col];

      // Top
      if (cell.openings[0] && cur.row > 0) {
        const next = this.grid[cur.row - 1][cur.col];
        if (next.openings[2] && !visited.has(`${cur.col},${cur.row - 1}`)) {
          visited.add(`${cur.col},${cur.row - 1}`);
          next.isFilled = true;
          queue.push({ col: cur.col, row: cur.row - 1 });
        }
      }
      // Right
      if (cell.openings[1] && cur.col < this.size - 1) {
        const next = this.grid[cur.row][cur.col + 1];
        if (next.openings[3] && !visited.has(`${cur.col + 1},${cur.row}`)) {
          visited.add(`${cur.col + 1},${cur.row}`);
          next.isFilled = true;
          queue.push({ col: cur.col + 1, row: cur.row });
        }
      }
      // Bottom
      if (cell.openings[2] && cur.row < this.size - 1) {
        const next = this.grid[cur.row + 1][cur.col];
        if (next.openings[0] && !visited.has(`${cur.col},${cur.row + 1}`)) {
          visited.add(`${cur.col},${cur.row + 1}`);
          next.isFilled = true;
          queue.push({ col: cur.col, row: cur.row + 1 });
        }
      }
      // Left
      if (cell.openings[3] && cur.col > 0) {
        const next = this.grid[cur.row][cur.col - 1];
        if (next.openings[1] && !visited.has(`${cur.col - 1},${cur.row}`)) {
          visited.add(`${cur.col - 1},${cur.row}`);
          next.isFilled = true;
          queue.push({ col: cur.col - 1, row: cur.row });
        }
      }
    }

    if (this.grid[this.sink.row][this.sink.col].isFilled && !this.isWon) {
      this.isWon = true;
      this.score += Math.max(100, 2000 - this.moves * 50);
      this.ctx.audio.playVictory();
      this.ctx.session.setStatus("ready");
    }
  }

  private rotatePipe(): void {
    const cell = this.grid[this.cursor.row][this.cursor.col];
    const op = cell.openings;
    cell.openings = [op[3], op[0], op[1], op[2]];
    this.moves++;
    this.ctx.audio.playRotate();
    this.checkFlow();
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_UP") this.cursor.row = Math.max(0, this.cursor.row - 1);
    if (action === "MOVE_DOWN") this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
    if (action === "MOVE_LEFT") this.cursor.col = Math.max(0, this.cursor.col - 1);
    if (action === "MOVE_RIGHT") this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);

    if (action === "ACTION_PRIMARY" || action === "ROTATE") {
      this.rotatePipe();
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

    const cellSize = 80;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 110;

    // 1. Industrial Steel Frame Bezel
    pr.drawRect(offX - 12, offY - 12, boardWidth + 24, boardWidth + 24, "#1e293b", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "#334155", false);

    // 2. Draw Pipe Grid
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cell = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;
        const midX = cx + cellSize / 2;
        const midY = cy + cellSize / 2;

        // Tile base backplate
        pr.drawRect(cx, cy, cellSize, cellSize, (r + c) % 2 === 0 ? "#0c1527" : "#09101e", true);
        pr.drawRect(cx, cy, cellSize, cellSize, "rgba(255, 255, 255, 0.03)", false);

        // Pipe Metal Body
        const pipeCol = cell.isFilled ? "#0284c7" : "#d97706";
        const waterCol = cell.isFilled ? "#38bdf8" : "#78350f";

        // Center hub
        pr.drawCircle(midX, midY, 14, pipeCol, true);
        if (cell.isFilled) pr.drawCircle(midX, midY, 8, waterCol, true);

        // Openings: Top, Right, Bottom, Left
        if (cell.openings[0]) {
          pr.drawRect(midX - 10, cy, 20, cellSize / 2, pipeCol, true);
          if (cell.isFilled) pr.drawRect(midX - 5, cy, 10, cellSize / 2, waterCol, true);
        }
        if (cell.openings[1]) {
          pr.drawRect(midX, midY - 10, cellSize / 2, 20, pipeCol, true);
          if (cell.isFilled) pr.drawRect(midX, midY - 5, cellSize / 2, 10, waterCol, true);
        }
        if (cell.openings[2]) {
          pr.drawRect(midX - 10, midY, 20, cellSize / 2, pipeCol, true);
          if (cell.isFilled) pr.drawRect(midX - 5, midY, 10, cellSize / 2, waterCol, true);
        }
        if (cell.openings[3]) {
          pr.drawRect(cx, midY - 10, cellSize / 2, 20, pipeCol, true);
          if (cell.isFilled) pr.drawRect(cx, midY - 5, cellSize / 2, 10, waterCol, true);
        }

        // Source / Sink Indicators
        if (r === this.source.row && c === this.source.col) {
          pr.drawText("IN", cx + 8, cy + 18, { size: 10, color: "#22c55e", font: "monospace" });
        }
        if (r === this.sink.row && c === this.sink.col) {
          pr.drawText("OUT", cx + 8, cy + 18, { size: 10, color: "#ef4444", font: "monospace" });
        }

        // Cursor
        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#ffd84d", false);
          pr.drawRect(cx + 3, cy + 3, cellSize - 6, cellSize - 6, "rgba(255, 216, 77, 0.2)", true);
        }
      }
    }

    // Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`MOVES: ${this.moves}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`PIPE CONNECT • SCORE: ${this.score}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(this.isWon ? "CIRCUIT COMPLETE" : "FLOW RESTRICTED", w - 20, 32, { size: 13, color: this.isWon ? "#22c55e" : "#f43f5e", align: "right", font: "monospace" });

    // Bottom Controls Bar
    pr.drawRect(0, h - 45, w, 45, "#080e1c", true);
    pr.drawLine(0, h - 45, w, h - 45, "#1e293b", 1);
    pr.drawText("[ARROWS] Move Cursor  •  [SPACE / Z] Rotate Segment  •  [R] Reset", 20, h - 18, { size: 11, color: "#94a3b8", font: "monospace" });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22c55e", false);
      pr.drawText("HYDRAULIC CIRCUIT CONNECTED!", w / 2, h / 2 - 10, { size: 20, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY NEXT PUZZLE", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
