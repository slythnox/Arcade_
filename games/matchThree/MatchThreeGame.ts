import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

export class MatchThreeGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 8;
  private readonly rows: number = 8;
  private grid: number[][] = [];
  private readonly gemColors: string[] = ["#FF3366", "#00FF66", "#00F0FF", "#FFB703", "#A855F7"];
  private cursor: GridCoord = { col: 3, row: 3 };
  private selectedCell: GridCoord | null = null;
  private score: number = 0;
  private movesRemaining: number = 25;
  private targetScore: number = 5000;
  private combo: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 3, row: 3 };
    this.selectedCell = null;
    this.score = 0;
    this.movesRemaining = 25;
    this.combo = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.initBoard();
  }

  private initBoard(): void {
    do {
      this.grid = Array.from({ length: this.rows }, () =>
        Array.from({ length: this.cols }, () => Math.floor(this.ctx.random.next() * this.gemColors.length))
      );
    } while (this.findMatches().length > 0);
  }

  private findMatches(): GridCoord[] {
    const matchedCoords: Set<string> = new Set();

    // Horizontal runs >= 3
    for (let r = 0; r < this.rows; r++) {
      let matchLen = 1;
      for (let c = 1; c < this.cols; c++) {
        if (this.grid[r][c] !== -1 && this.grid[r][c] === this.grid[r][c - 1]) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            for (let i = c - matchLen; i < c; i++) matchedCoords.add(`${r},${i}`);
          }
          matchLen = 1;
        }
      }
      if (matchLen >= 3) {
        for (let i = this.cols - matchLen; i < this.cols; i++) matchedCoords.add(`${r},${i}`);
      }
    }

    // Vertical runs >= 3
    for (let c = 0; c < this.cols; c++) {
      let matchLen = 1;
      for (let r = 1; r < this.rows; r++) {
        if (this.grid[r][c] !== -1 && this.grid[r][c] === this.grid[r - 1][c]) {
          matchLen++;
        } else {
          if (matchLen >= 3) {
            for (let i = r - matchLen; i < r; i++) matchedCoords.add(`${i},${c}`);
          }
          matchLen = 1;
        }
      }
      if (matchLen >= 3) {
        for (let i = this.rows - matchLen; i < this.rows; i++) matchedCoords.add(`${i},${c}`);
      }
    }

    return Array.from(matchedCoords).map((k) => {
      const [r, c] = k.split(",").map(Number);
      return { row: r, col: c };
    });
  }

  private processCascades(): void {
    let cascadeMatches = this.findMatches();
    this.combo = 0;

    while (cascadeMatches.length > 0) {
      this.combo++;
      const matchScore = cascadeMatches.length * 100 * this.combo;
      this.score += matchScore;
      this.ctx.audio.playExplosion();

      // Clear matched gems
      for (const { row, col } of cascadeMatches) {
        this.grid[row][col] = -1;
      }

      // Drop gems down
      for (let c = 0; c < this.cols; c++) {
        let writeRow = this.rows - 1;
        for (let r = this.rows - 1; r >= 0; r--) {
          if (this.grid[r][c] !== -1) {
            this.grid[writeRow][c] = this.grid[r][c];
            if (writeRow !== r) this.grid[r][c] = -1;
            writeRow--;
          }
        }
        // Fill top empty cells with new gems
        for (let r = writeRow; r >= 0; r--) {
          this.grid[r][c] = Math.floor(this.ctx.random.next() * this.gemColors.length);
        }
      }

      cascadeMatches = this.findMatches();
    }

    if (this.score >= this.targetScore) {
      this.isWon = true;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    } else if (this.movesRemaining <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    }
  }

  private trySwap(c1: GridCoord, c2: GridCoord): void {
    const dist = Math.abs(c1.row - c2.row) + Math.abs(c1.col - c2.col);
    if (dist !== 1) {
      this.selectedCell = c2;
      this.ctx.audio.playMove();
      return;
    }

    // Swap
    const tmp = this.grid[c1.row][c1.col];
    this.grid[c1.row][c1.col] = this.grid[c2.row][c2.col];
    this.grid[c2.row][c2.col] = tmp;

    const matches = this.findMatches();
    if (matches.length > 0) {
      this.movesRemaining--;
      this.selectedCell = null;
      this.processCascades();
    } else {
      // Revert illegal swap
      this.grid[c2.row][c2.col] = this.grid[c1.row][c1.col];
      this.grid[c1.row][c1.col] = tmp;
      this.selectedCell = null;
      this.ctx.audio.playLaser();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.gameOver || this.isWon) return;

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
        if (!this.selectedCell) {
          this.selectedCell = { ...this.cursor };
          this.ctx.audio.playMove();
        } else {
          this.trySwap(this.selectedCell, this.cursor);
        }
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

    const cellSize = 64;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2) + 10;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "rgba(0, 255, 102, 0.4)", false);

    pr.drawGrid(this.cols, this.rows, cellSize, "rgba(0, 255, 102, 0.1)", offX, offY);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (val !== -1) {
          const col = this.gemColors[val];
          pr.drawPixelBlock(cx + 8, cy + 8, cellSize - 16, col, "#FFFFFF", "rgba(0,0,0,0.5)");
        }
      }
    }

    // Draw Selected Gem Pulse
    if (this.selectedCell) {
      const sx = offX + this.selectedCell.col * cellSize;
      const sy = offY + this.selectedCell.row * cellSize;
      pr.drawRect(sx + 2, sy + 2, cellSize - 4, cellSize - 4, "#00F0FF", false);
    }

    // Draw Cursor
    const curX = offX + this.cursor.col * cellSize;
    const curY = offY + this.cursor.row * cellSize;
    pr.drawRect(curX, curY, cellSize, cellSize, "#00FF66", false);

    pr.drawText(
      `SCORE: ${this.score} / ${this.targetScore}  •  MOVES: ${this.movesRemaining}  •  [SPACE TO SELECT/SWAP]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("TARGET REACHED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("OUT OF MOVES — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
