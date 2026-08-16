import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class MatchThreeGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 8;
  private readonly rows: number = 8;
  private grid: number[][] = [];
  private readonly gemColors: string[] = ["#FF3366", "#22C55E", "#00F0FF", "#FFB703", "#A855F7"];
  private cursor: GridCoord = { col: 3, row: 3 };
  private selectedCell: GridCoord | null = null;
  private score: number = 0;
  private movesRemaining: number = 25;
  private targetScore: number = 5000;
  private combo: number = 0;
  private gameOver: boolean = false;
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
    this.cursor = { col: 3, row: 3 };
    this.selectedCell = null;
    this.score = 0;
    this.movesRemaining = 25;
    this.combo = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.particles = [];
    this.initBoard();
  }

  private initBoard(): void {
    do {
      this.grid = Array.from({ length: this.rows }, () =>
        Array.from({ length: this.cols }, () => Math.floor(this.ctx.random.next() * this.gemColors.length))
      );
    } while (this.findMatches().length > 0);
  }

  private addParticles(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 40 + this.ctx.random.next() * 110;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.45,
        color,
      });
    }
  }

  private findMatches(): GridCoord[] {
    const matchedCoords: Set<string> = new Set();

    // Horizontal matches
    for (let r = 0; r < this.rows; r++) {
      let len = 1;
      for (let c = 1; c < this.cols; c++) {
        if (this.grid[r][c] !== -1 && this.grid[r][c] === this.grid[r][c - 1]) {
          len++;
        } else {
          if (len >= 3) {
            for (let i = 0; i < len; i++) matchedCoords.add(`${r},${c - 1 - i}`);
          }
          len = 1;
        }
      }
      if (len >= 3) {
        for (let i = 0; i < len; i++) matchedCoords.add(`${r},${this.cols - 1 - i}`);
      }
    }

    // Vertical matches
    for (let c = 0; c < this.cols; c++) {
      let len = 1;
      for (let r = 1; r < this.rows; r++) {
        if (this.grid[r][c] !== -1 && this.grid[r][c] === this.grid[r - 1][c]) {
          len++;
        } else {
          if (len >= 3) {
            for (let i = 0; i < len; i++) matchedCoords.add(`${r - 1 - i},${c}`);
          }
          len = 1;
        }
      }
      if (len >= 3) {
        for (let i = 0; i < len; i++) matchedCoords.add(`${this.rows - 1 - i},${c}`);
      }
    }

    return Array.from(matchedCoords).map((coord) => {
      const [row, col] = coord.split(",").map(Number);
      return { row, col };
    });
  }

  private trySwap(c1: GridCoord, c2: GridCoord): void {
    const d = Math.abs(c1.col - c2.col) + Math.abs(c1.row - c2.row);
    if (d !== 1) {
      this.selectedCell = null;
      return;
    }

    const temp = this.grid[c1.row][c1.col];
    this.grid[c1.row][c1.col] = this.grid[c2.row][c2.col];
    this.grid[c2.row][c2.col] = temp;

    const matches = this.findMatches();
    if (matches.length > 0) {
      this.movesRemaining--;
      this.combo = 1;
      this.ctx.audio.playRotate();
      this.resolveCascades();
    } else {
      // Revert invalid swap
      this.grid[c2.row][c2.col] = this.grid[c1.row][c1.col];
      this.grid[c1.row][c1.col] = temp;
      this.ctx.audio.playHit();
    }

    this.selectedCell = null;
  }

  private resolveCascades(): void {
    let matches = this.findMatches();
    while (matches.length > 0) {
      // Clear matched gems & spawn particles
      for (const m of matches) {
        const val = this.grid[m.row][m.col];
        if (val !== -1) {
          const ox = 44 + m.col * 64 + 32;
          const oy = 90 + m.row * 64 + 32;
          this.addParticles(ox, oy, this.gemColors[val], 8);
          this.grid[m.row][m.col] = -1;
        }
      }

      this.score += matches.length * 100 * this.combo;
      this.ctx.audio.playCoin();
      this.combo++;

      // Drop gems down
      for (let c = 0; c < this.cols; c++) {
        let emptyRow = this.rows - 1;
        for (let r = this.rows - 1; r >= 0; r--) {
          if (this.grid[r][c] !== -1) {
            if (emptyRow !== r) {
              this.grid[emptyRow][c] = this.grid[r][c];
              this.grid[r][c] = -1;
            }
            emptyRow--;
          }
        }

        // Fill remaining top spaces with new gems
        for (let r = emptyRow; r >= 0; r--) {
          this.grid[r][c] = Math.floor(this.ctx.random.next() * this.gemColors.length);
        }
      }

      matches = this.findMatches();
    }

    if (this.score >= this.targetScore) {
      this.isWon = true;
      this.ctx.audio.playVictory();
      this.ctx.session.setStatus("ready");
    } else if (this.movesRemaining <= 0) {
      this.gameOver = true;
      this.ctx.audio.playGameOver();
      this.ctx.session.setStatus("game-over");
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isWon || this.isPaused) {
      if (action === "RESTART" && isPressed) this.reset();
      return;
    }

    switch (action) {
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.cols - 1, this.cursor.col + 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.rows - 1, this.cursor.row + 1);
        this.ctx.audio.playMove();
        break;
      case "ACTION_PRIMARY":
      case "ROTATE":
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
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 64;
    const boardWidth = this.cols * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 90;

    // 1. Crystal Grid Frame
    pr.drawRect(offX - 10, offY - 10, boardWidth + 20, boardWidth + 20, "#1e293b", true);
    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardWidth + 12, "#334155", false);

    // 2. Draw Tiles & Gemstones
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;
        const midX = cx + cellSize / 2;
        const midY = cy + cellSize / 2;

        // Tile Backplate
        pr.drawRect(cx, cy, cellSize, cellSize, (r + c) % 2 === 0 ? "#0c1527" : "#09101e", true);
        pr.drawRect(cx, cy, cellSize, cellSize, "rgba(255,255,255,0.03)", false);

        if (val !== -1) {
          const col = this.gemColors[val];
          // 3D Gem Shapes
          if (val === 0) {
            // Ruby Rhombus / Diamond
            pr.drawPixelBlock(midX - 16, midY - 16, 32, col, "#FDA4AF", "#BE123C");
          } else if (val === 1) {
            // Emerald Circle Gem
            pr.drawCircle(midX, midY, 18, col, true);
            pr.drawCircle(midX - 4, midY - 4, 12, "#86EFAC", true);
            pr.drawCircle(midX - 5, midY - 5, 4, "#FFFFFF", true);
          } else if (val === 2) {
            // Sapphire Square Crystal
            pr.drawPixelBlock(midX - 16, midY - 16, 32, col, "#BAE6FD", "#0369A1");
            pr.drawCircle(midX, midY, 6, "#FFFFFF", true);
          } else if (val === 3) {
            // Topaz Star Gem
            pr.drawCircle(midX, midY, 18, col, true);
            pr.drawCircle(midX, midY, 8, "#FEF08A", true);
            pr.drawCircle(midX - 3, midY - 3, 3, "#FFFFFF", true);
          } else {
            // Amethyst Hexagon
            pr.drawPixelBlock(midX - 16, midY - 16, 32, col, "#E9D5FF", "#6B21A8");
          }
        }
      }
    }

    // 3. Selection Pulse Ring
    if (this.selectedCell) {
      const sx = offX + this.selectedCell.col * cellSize;
      const sy = offY + this.selectedCell.row * cellSize;
      pr.drawRect(sx + 2, sy + 2, cellSize - 4, cellSize - 4, "#00F0FF", false);
      pr.drawRect(sx + 3, sy + 3, cellSize - 6, cellSize - 6, "rgba(0, 240, 255, 0.2)", true);
    }

    // 4. Cursor Box
    const curX = offX + this.cursor.col * cellSize;
    const curY = offY + this.cursor.row * cellSize;
    pr.drawRect(curX + 2, curY + 2, cellSize - 4, cellSize - 4, "#ffd84d", false);

    // 5. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2.5, p.color, true);
    }

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`MOVES: ${this.movesRemaining}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}/${this.targetScore}`, w / 2, 32, { size: 13, color: "#38bdf8", align: "center", font: "monospace" });
    const scorePct = Math.min(1, this.score / this.targetScore);
    pr.drawRect(w - 120, 24, 100, 8, "#1e293b", true);
    pr.drawRect(w - 120, 24, 100 * scorePct, 8, "#22c55e", true);

    // Bottom Controls Bar
    pr.drawRect(0, h - 45, w, 45, "#080e1c", true);
    pr.drawLine(0, h - 45, w, h - 45, "#1e293b", 1);
    pr.drawText("[ARROWS] Move  •  [SPACE / Z] Select & Swap Adjacent  •  [R] Reset", 20, h - 18, { size: 11, color: "#94a3b8", font: "monospace" });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22c55e", false);
      pr.drawText("TARGET SCORE REACHED — VICTORY!", w / 2, h / 2 - 10, { size: 20, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY NEXT BOARD", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#ef4444", false);
      pr.drawText("OUT OF MOVES — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#ef4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO TRY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
