import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

export class SudokuGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 9;
  private solution: number[][] = [];
  private initialGrid: number[][] = [];
  private playerGrid: number[][] = [];
  private cursor: GridCoord = { col: 4, row: 4 };
  private mistakes: number = 0;
  private maxMistakes: number = 3;
  private score: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  private editMode: boolean = false;
  private draftNumber: number = 0;
  private time: number = 0;
  private particles: {x:number, y:number, vx:number, vy:number, color:string}[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 4, row: 4 };
    this.mistakes = 0;
    this.score = 0;
    this.time = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.editMode = false;
    this.particles = [];
    this.generateBoard();
  }

  private generateBoard(): void {
    const base = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ];

    this.solution = base.map((row) => [...row]);
    this.initialGrid = base.map((row) => [...row]);
    this.playerGrid = base.map((row) => [...row]);

    const removedIndices: Set<number> = new Set();
    while (removedIndices.size < 36) {
      const idx = Math.floor(this.ctx.random.next() * 81);
      removedIndices.add(idx);
    }

    for (const idx of removedIndices) {
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      this.initialGrid[r][c] = 0;
      this.playerGrid[r][c] = 0;
    }
  }

  private inputDigit(d: number): void {
    if (this.gameOver || this.isWon || this.isPaused) return;
    const { row, col } = this.cursor;

    if (this.initialGrid[row][col] !== 0) {
      this.ctx.audio.playLaser();
      return;
    }

    if (d === 0) {
      this.playerGrid[row][col] = 0;
      this.ctx.audio.playMove();
      return;
    }

    if (this.solution[row][col] === d) {
      this.playerGrid[row][col] = d;
      this.score += 100;
      this.ctx.audio.playPowerUp();
      this.checkWin();
    } else {
      this.playerGrid[row][col] = d; // Set it anyway to show error
      this.mistakes++;
      this.ctx.audio.playExplosion();
      if (this.mistakes >= this.maxMistakes) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      }
    }
  }

  private checkWin(): void {
    const isComplete = this.playerGrid.every((row, r) =>
      row.every((val, c) => val === this.solution[r][c])
    );
    if (isComplete && !this.isWon) {
      this.isWon = true;
      this.score += 2500;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
      
      // Spawn confetti
      const colors = ["#FF3366", "#00FF66", "#00F0FF", "#FFB703", "#A855F7"];
      for (let i = 0; i < 150; i++) {
        this.particles.push({
          x: 300, y: 350,
          vx: (this.ctx.random.next() - 0.5) * 600,
          vy: (this.ctx.random.next() - 0.5) * 600,
          color: colors[Math.floor(this.ctx.random.next() * colors.length)]
        });
      }
    }
  }

  public update(dt: number): void {
    if (!this.gameOver && !this.isWon && !this.isPaused) {
      this.time += dt;
    }
    for (let p of this.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 500 * dt; // gravity
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "RESTART") {
      this.reset();
      return;
    }

    if (this.gameOver || this.isWon) return;

    if (this.editMode) {
      if (action === "MOVE_RIGHT" || action === "MOVE_UP") {
        this.draftNumber++;
        if (this.draftNumber > 9) this.draftNumber = 0;
        this.ctx.audio.playMove();
      } else if (action === "MOVE_LEFT" || action === "MOVE_DOWN") {
        this.draftNumber--;
        if (this.draftNumber < 0) this.draftNumber = 9;
        this.ctx.audio.playMove();
      } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
        this.editMode = false;
        if (this.draftNumber !== this.playerGrid[this.cursor.row][this.cursor.col]) {
          this.inputDigit(this.draftNumber);
        }
      } else if (action === "ACTION_SECONDARY" || action === "BACK") {
        this.editMode = false;
      }
      return;
    }

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
      case "CONFIRM":
        if (this.initialGrid[this.cursor.row][this.cursor.col] === 0) {
          this.editMode = true;
          this.draftNumber = this.playerGrid[this.cursor.row][this.cursor.col] || 1;
          this.ctx.audio.playMove();
        }
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
    const rawCtx = pr.getContext();
    pr.clear("#f5f5f5");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 60;
    const boardWidth = this.size * cellSize;
    const offX = 30;
    const offY = 80;

    const selectedVal = this.playerGrid[this.cursor.row][this.cursor.col];

    // Background
    pr.drawRect(offX, offY, boardWidth, boardWidth, "#ffffff", true);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.playerGrid[r][c];
        const isSelected = (r === this.cursor.row && c === this.cursor.col);
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;
        
        // Highlight logic
        if (isSelected) {
          pr.drawRect(cx, cy, cellSize, cellSize, this.editMode ? "#aae8ff" : "#cceeff", true);
        } else if (val !== 0 && val === selectedVal && !this.editMode) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#e6f7ff", true);
        }
      }
    }

    // Grid Lines
    for (let i = 0; i <= this.size; i++) {
      const thick = (i % 3 === 0);
      const color = thick ? "#333333" : "#cccccc";
      const lw = thick ? 3 : 1;
      
      // Vertical
      rawCtx.beginPath();
      rawCtx.moveTo(offX + i * cellSize, offY);
      rawCtx.lineTo(offX + i * cellSize, offY + boardWidth);
      rawCtx.lineWidth = lw;
      rawCtx.strokeStyle = color;
      rawCtx.stroke();
      
      // Horizontal
      rawCtx.beginPath();
      rawCtx.moveTo(offX, offY + i * cellSize);
      rawCtx.lineTo(offX + boardWidth, offY + i * cellSize);
      rawCtx.lineWidth = lw;
      rawCtx.strokeStyle = color;
      rawCtx.stroke();
    }

    // Draw Digits
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.playerGrid[r][c];
        const isFixed = this.initialGrid[r][c] !== 0;
        const isSelected = (r === this.cursor.row && c === this.cursor.col);
        const isWrong = !isFixed && val !== 0 && val !== this.solution[r][c];
        
        const cx = offX + c * cellSize + cellSize / 2;
        const cy = offY + r * cellSize + cellSize / 2 + 10; // offset for text baseline

        if (this.editMode && isSelected) {
          if (this.draftNumber !== 0) {
            pr.drawText(this.draftNumber.toString(), cx, cy, {
              size: 32, color: "#0077ff", align: "center", font: "monospace"
            });
          }
        } else if (val !== 0) {
          let tColor = isFixed ? "#000000" : "#444444";
          if (isWrong) tColor = "#e60000";
          
          rawCtx.font = `${isFixed ? "bold" : "normal"} 32px monospace`;
          rawCtx.fillStyle = tColor;
          rawCtx.textAlign = "center";
          rawCtx.fillText(val.toString(), cx, cy);
        }
      }
    }

    // Timer and Header
    const m = Math.floor(this.time / 60).toString().padStart(2, '0');
    const s = Math.floor(this.time % 60).toString().padStart(2, '0');
    pr.drawText(`TIME: ${m}:${s}`, w - 20, 40, { size: 18, color: "#333", align: "right" });
    pr.drawText("SUDOKU", 30, 40, { size: 28, color: "#333", align: "left" });

    pr.drawText(`MISTAKES: ${this.mistakes}/${this.maxMistakes}`, 30, h - 30, { size: 16, color: "#333", align: "left" });
    if (this.editMode) {
      pr.drawText("EDIT MODE: LEFT/RIGHT TO CHANGE, SPACE TO CONFIRM", w/2, h - 30, { size: 14, color: "#0077ff", align: "center" });
    } else {
      pr.drawText("SPACE TO EDIT CELL", w - 30, h - 30, { size: 14, color: "#555", align: "right" });
    }

    if (this.isWon) {
      for (const p of this.particles) {
        pr.drawRect(p.x, p.y, 6, 6, p.color, true);
      }
      pr.drawRect(0, h / 2 - 60, w, 120, "rgba(255,255,255,0.9)", true);
      pr.drawText("SOLVED!", w / 2, h / 2, { size: 48, color: "#00aa00", align: "center" });
      pr.drawText("PRESS RESTART", w / 2, h / 2 + 40, { size: 16, color: "#333", align: "center" });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 60, w, 120, "rgba(255,255,255,0.9)", true);
      pr.drawText("GAME OVER", w / 2, h / 2, { size: 48, color: "#cc0000", align: "center" });
      pr.drawText("PRESS RESTART", w / 2, h / 2 + 40, { size: 16, color: "#333", align: "center" });
    }
  }
}
