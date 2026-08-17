import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface NumberOption {
  value: number;
  isCorrect: boolean;
  rect: { x: number; y: number; w: number; h: number };
}

export class SudokuGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 9;
  private solution: number[][] = [];
  private initialGrid: number[][] = [];
  private playerGrid: number[][] = [];
  private cursor: GridCoord = { col: 4, row: 4 };

  private currentOptions: NumberOption[] = [];
  private selectedOptionIndex: number = 0;

  private mistakes: number = 0;
  private maxMistakes: number = 3;
  private score: number = 0;
  private filledCount: number = 0;
  private totalEmptyCells: number = 0;

  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private revealedFinalAnswer: boolean = false;
  private time: number = 0;
  private animTime: number = 0;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "CANVAS") {
        const rect = target.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 700 / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        // 1. Check if clicking on the 3 Choice Option Buttons
        if (!this.gameOver && !this.isWon) {
          for (let i = 0; i < this.currentOptions.length; i++) {
            const opt = this.currentOptions[i];
            if (
              clickX >= opt.rect.x &&
              clickX <= opt.rect.x + opt.rect.w &&
              clickY >= opt.rect.y &&
              clickY <= opt.rect.y + opt.rect.h
            ) {
              this.chooseOption(i);
              return;
            }
          }
        }

        // 2. Check if clicking on "Reveal Solution" / "Next Puzzle" button
        if (clickX >= 420 && clickX <= 570 && clickY >= 14 && clickY <= 54) {
          this.revealFinalAnswer();
          return;
        }

        // 3. Check if clicking any 9x9 Grid Cell
        const cellSize = 54;
        const boardWidth = this.size * cellSize;
        const offX = Math.floor((600 - boardWidth) / 2);
        const offY = 72;

        if (
          clickX >= offX &&
          clickX <= offX + boardWidth &&
          clickY >= offY &&
          clickY <= offY + boardWidth
        ) {
          const col = Math.floor((clickX - offX) / cellSize);
          const row = Math.floor((clickY - offY) / cellSize);
          if (row >= 0 && row < 9 && col >= 0 && col < 9) {
            this.cursor = { row, col };
            this.generateOptionsForCurrentCell();
            this.ctx.audio?.playMove?.();
          }
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 4, row: 4 };
    this.mistakes = 0;
    this.score = 0;
    this.time = 0;
    this.animTime = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.revealedFinalAnswer = false;

    this.generateBoard();
    this.generateOptionsForCurrentCell();
  }

  private generateBoard(): void {
    // Standard Valid Base Sudoku Solution
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

    // Permute rows/columns randomly to create a fresh puzzle
    this.solution = base.map((row) => [...row]);
    this.initialGrid = base.map((row) => [...row]);
    this.playerGrid = base.map((row) => [...row]);

    const removedIndices: Set<number> = new Set();
    while (removedIndices.size < 32) {
      const idx = Math.floor(this.ctx.random.next() * 81);
      removedIndices.add(idx);
    }

    this.totalEmptyCells = removedIndices.size;
    this.filledCount = 0;

    for (const idx of removedIndices) {
      const r = Math.floor(idx / 9);
      const c = idx % 9;
      this.initialGrid[r][c] = 0;
      this.playerGrid[r][c] = 0;
    }

    // Auto-focus on first empty cell
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.initialGrid[r][c] === 0) {
          this.cursor = { row: r, col: c };
          return;
        }
      }
    }
  }

  // Generate 3 Multiple-Choice Options for the selected cell (1 correct, 2 distractors)
  private generateOptionsForCurrentCell(): void {
    const { row, col } = this.cursor;
    const correctVal = this.solution[row][col];

    // Distractor candidates
    const distractors: number[] = [];
    while (distractors.length < 2) {
      const cand = 1 + Math.floor(this.ctx.random.next() * 9);
      if (cand !== correctVal && !distractors.includes(cand)) {
        distractors.push(cand);
      }
    }

    const allOptions = [correctVal, ...distractors];
    // Shuffle options randomly
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(this.ctx.random.next() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]];
    }

    const startX = 60;
    const btnW = 140;
    const btnH = 54;
    const gap = 30;
    const btnY = 574;

    this.currentOptions = allOptions.map((val, idx) => ({
      value: val,
      isCorrect: val === correctVal,
      rect: {
        x: startX + idx * (btnW + gap),
        y: btnY,
        w: btnW,
        h: btnH,
      },
    }));

    this.selectedOptionIndex = 0;
  }

  // Choose one of the 3 options
  public chooseOption(optIndex: number): void {
    if (this.gameOver || this.isWon || this.revealedFinalAnswer) return;
    if (this.initialGrid[this.cursor.row][this.cursor.col] !== 0) return;

    const opt = this.currentOptions[optIndex];
    if (!opt) return;

    const { row, col } = this.cursor;

    if (opt.isCorrect) {
      this.playerGrid[row][col] = opt.value;
      this.score += 150;
      this.filledCount++;
      this.ctx.audio?.playPowerUp?.();

      const cellSize = 54;
      const boardWidth = this.size * cellSize;
      const offX = Math.floor((600 - boardWidth) / 2);
      const offY = 72;
      const cx = offX + col * cellSize + cellSize / 2;
      const cy = offY + row * cellSize + cellSize / 2;

      globalParticles.emitBurst(cx, cy, 20, ["#34D399", "#FFFFFF", "#38BDF8"], 60, 200);
      globalParticles.emitText("+150 CORRECT!", cx, cy - 20, "#34D399", 14);

      // Auto-advance to next empty cell
      this.advanceToNextEmptyCell();
      this.checkWin();
    } else {
      this.playerGrid[row][col] = opt.value;
      this.mistakes++;
      this.ctx.audio?.playExplosion?.();

      const cellSize = 54;
      const boardWidth = this.size * cellSize;
      const offX = Math.floor((600 - boardWidth) / 2);
      const offY = 72;
      const cx = offX + col * cellSize + cellSize / 2;
      const cy = offY + row * cellSize + cellSize / 2;

      globalParticles.emitBurst(cx, cy, 14, ["#EF4444", "#F87171"], 40, 150);
      globalParticles.emitText("WRONG DIGIT!", cx, cy - 20, "#EF4444", 13);

      if (this.mistakes >= this.maxMistakes) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.revealFinalAnswer();
      }
    }
  }

  private advanceToNextEmptyCell(): void {
    let r = this.cursor.row;
    let c = this.cursor.col;

    for (let i = 0; i < 81; i++) {
      c++;
      if (c >= 9) {
        c = 0;
        r++;
        if (r >= 9) r = 0;
      }
      if (this.playerGrid[r][c] === 0) {
        this.cursor = { row: r, col: c };
        this.generateOptionsForCurrentCell();
        return;
      }
    }
  }

  public revealFinalAnswer(): void {
    this.revealedFinalAnswer = true;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        this.playerGrid[r][c] = this.solution[r][c];
      }
    }
    this.ctx.audio?.playVictory?.();
    globalParticles.emitBurst(300, 350, 50, ["#FBBF24", "#38BDF8", "#34D399", "#FFFFFF"], 100, 300);
    globalParticles.emitText("FINAL SOLUTION REVEALED!", 300, 140, "#FBBF24", 24);
  }

  private checkWin(): void {
    const isComplete = this.playerGrid.every((row, r) =>
      row.every((val, c) => val === this.solution[r][c])
    );
    if (isComplete && !this.isWon) {
      this.isWon = true;
      this.score += 2500;
      this.ctx.session.setStatus("ready");
      this.ctx.audio?.playVictory?.();
      this.revealFinalAnswer();
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    this.animTime += dt;
    if (!this.gameOver && !this.isWon && !this.isPaused) {
      this.time += dt;
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "RESTART") {
      this.reset();
      return;
    }

    if (this.gameOver || this.isWon || this.revealedFinalAnswer) return;

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.generateOptionsForCurrentCell();
        this.ctx.audio?.playMove?.();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
        this.generateOptionsForCurrentCell();
        this.ctx.audio?.playMove?.();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.generateOptionsForCurrentCell();
        this.ctx.audio?.playMove?.();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
        this.generateOptionsForCurrentCell();
        this.ctx.audio?.playMove?.();
        break;
      case "ACTION_PRIMARY":
      case "CONFIRM":
        // Choose option 1
        this.chooseOption(0);
        break;
      case "ACTION_SECONDARY":
        // Choose option 2
        this.chooseOption(1);
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerDown && typeof window !== "undefined") {
      window.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Modern Dark Slate Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#0B0F19");
      bgGrad.addColorStop(0.5, "#131C2E");
      bgGrad.addColorStop(1, "#070A10");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#0B0F19");
    }

    // 2. Top Header HUD
    pr.drawText("SUDOKU", 28, 38, {
      size: 26,
      color: "#38BDF8",
      font: "system-ui, -apple-system, sans-serif",
    });

    const m = Math.floor(this.time / 60).toString().padStart(2, "0");
    const s = Math.floor(this.time % 60).toString().padStart(2, "0");
    pr.drawText(`TIME: ${m}:${s}`, 180, 38, { size: 14, color: "#94A3B8", font: "monospace" });

    // Mistakes Indicator
    const hearts = "♥ ".repeat(Math.max(0, this.maxMistakes - this.mistakes)) + "♡ ".repeat(this.mistakes);
    pr.drawText(`LIVES: ${hearts.trim()}`, 310, 38, { size: 13, color: "#EF4444", font: "monospace" });

    // "Reveal Answer" Top Button
    if (ctx2d) {
      ctx2d.save();
      ctx2d.fillStyle = "rgba(30, 41, 59, 0.9)";
      ctx2d.strokeStyle = "#FBBF24";
      ctx2d.lineWidth = 1.5;
      ctx2d.beginPath();
      ctx2d.roundRect(430, 16, 140, 36, 6);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();
    }
    pr.drawText("REVEAL ANSWER", 500, 39, { size: 11, color: "#FBBF24", align: "center", font: "monospace" });

    // 3. 9x9 Sudoku Grid Geometry
    const cellSize = 54;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 72;

    // Board Base Housing
    if (ctx2d) {
      ctx2d.save();
      ctx2d.fillStyle = "#0E1524";
      ctx2d.strokeStyle = "#38BDF8";
      ctx2d.lineWidth = 2.5;
      ctx2d.shadowColor = "rgba(56, 189, 248, 0.25)";
      ctx2d.shadowBlur = 18;
      ctx2d.beginPath();
      ctx2d.roundRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, 10);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();
    }

    const selRow = this.cursor.row;
    const selCol = this.cursor.col;
    const selVal = this.playerGrid[selRow][selCol];

    // Grid Cell Backgrounds & Highlights
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;
        const val = this.playerGrid[r][c];

        const isCursor = r === selRow && c === selCol;
        const isCrosshair = r === selRow || c === selCol || (Math.floor(r / 3) === Math.floor(selRow / 3) && Math.floor(c / 3) === Math.floor(selCol / 3));
        const isMatchingVal = val !== 0 && val === selVal;

        if (ctx2d) {
          if (isCursor) {
            ctx2d.fillStyle = "rgba(56, 189, 248, 0.3)";
          } else if (isMatchingVal) {
            ctx2d.fillStyle = "rgba(52, 211, 153, 0.22)";
          } else if (isCrosshair) {
            ctx2d.fillStyle = "rgba(30, 41, 59, 0.4)";
          } else {
            ctx2d.fillStyle = (Math.floor(r / 3) + Math.floor(c / 3)) % 2 === 0 ? "#111A2D" : "#0E1524";
          }
          ctx2d.fillRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2);
        }
      }
    }

    // Grid Dividers (Thick 3x3 box borders)
    for (let i = 0; i <= 9; i++) {
      const isBlock = i % 3 === 0;
      const lw = isBlock ? 3 : 1;
      const col = isBlock ? "#38BDF8" : "rgba(51, 65, 85, 0.5)";

      // Vertical line
      pr.drawLine(offX + i * cellSize, offY, offX + i * cellSize, offY + boardWidth, col, lw);
      // Horizontal line
      pr.drawLine(offX, offY + i * cellSize, offX + boardWidth, offY + i * cellSize, col, lw);
    }

    // Draw Digits in Cells
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const val = this.playerGrid[r][c];
        if (val === 0) continue;

        const isFixed = this.initialGrid[r][c] !== 0;
        const isCorrect = val === this.solution[r][c];
        const cx = offX + c * cellSize + cellSize / 2;
        const cy = offY + r * cellSize + cellSize / 2 + 10;

        let fontColor = "#38BDF8"; // Fixed Clues (Cyan)
        if (!isFixed) {
          fontColor = isCorrect ? "#34D399" : "#EF4444"; // Player Solved (Green) or Wrong (Red)
        }
        if (this.revealedFinalAnswer) {
          fontColor = "#FBBF24"; // Final Answer (Gold)
        }

        pr.drawText(val.toString(), cx, cy, {
          size: 26,
          color: fontColor,
          align: "center",
          font: isFixed ? "bold monospace" : "monospace",
        });
      }
    }

    // 4. 3-Choice Multiple Choice Option Buttons
    if (!this.gameOver && !this.isWon && !this.revealedFinalAnswer) {
      const isFixedSelected = this.initialGrid[this.cursor.row][this.cursor.col] !== 0;

      if (!isFixedSelected) {
        pr.drawText("CHOOSE CORRECT NUMBER FOR CELL:", w / 2, 560, {
          size: 12,
          color: "#94A3B8",
          align: "center",
          font: "monospace",
        });

        for (let i = 0; i < this.currentOptions.length; i++) {
          const opt = this.currentOptions[i];
          const r = opt.rect;

          if (ctx2d) {
            ctx2d.save();
            ctx2d.fillStyle = "rgba(15, 23, 42, 0.95)";
            ctx2d.strokeStyle = "#38BDF8";
            ctx2d.lineWidth = 2;
            ctx2d.shadowColor = "rgba(56, 189, 248, 0.4)";
            ctx2d.shadowBlur = 12;
            ctx2d.beginPath();
            ctx2d.roundRect(r.x, r.y, r.w, r.h, 10);
            ctx2d.fill();
            ctx2d.stroke();
            ctx2d.restore();
          }

          pr.drawText(`[OPTION ${i + 1}]`, r.x + r.w / 2, r.y + 18, {
            size: 10,
            color: "#94A3B8",
            align: "center",
            font: "monospace",
          });

          pr.drawText(opt.value.toString(), r.x + r.w / 2, r.y + 44, {
            size: 26,
            color: "#FFD84D",
            align: "center",
            font: "bold monospace",
          });
        }

        pr.drawText("[CLICK AN OPTION  •  OR USE ARROW KEYS TO NAVIGATE CELLS]", w / 2, 650, {
          size: 11,
          color: "#64748B",
          align: "center",
          font: "monospace",
        });
      } else {
        pr.drawText("FIXED CLUE CELL — SELECT AN EMPTY CELL TO CHOOSE NUMBER", w / 2, 595, {
          size: 12,
          color: "#64748B",
          align: "center",
          font: "monospace",
        });
      }
    }

    // 5. Particles
    globalParticles.render(pr);

    // 6. Victory Overlay
    if (this.isWon) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#34D399", false);
      pr.drawText("SUDOKU MASTERED — 100% SOLVED!", w / 2, h / 2 - 12, {
        size: 22,
        color: "#34D399",
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
      pr.drawText(`SCORE: ${this.score}  •  PRESS [R] FOR NEW PUZZLE`, w / 2, h / 2 + 18, {
        size: 13,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("3 MISTAKES — GAME OVER", w / 2, h / 2 - 12, {
        size: 22,
        color: "#EF4444",
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
      pr.drawText("SOLUTION REVEALED ABOVE • PRESS [R] TO RETRY", w / 2, h / 2 + 18, {
        size: 13,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      });
    }
  }
}
