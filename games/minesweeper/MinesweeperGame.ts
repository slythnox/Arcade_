import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { MinesweeperBoard } from "./MinesweeperBoard";
import { revealCell, chordCell, toggleFlag } from "./MinesweeperLogic";

export class MinesweeperGame implements GameInstance {
  private ctx!: GameContext;
  private board: MinesweeperBoard;

  private cursor: GridCoord = { col: 4, row: 4 };
  private hoveredCell: GridCoord | null = null;
  private score: number = 0;
  private level: number = 1;
  private flagsPlaced: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private detonatedMine: GridCoord | null = null;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;
  private boundContextMenu?: (e: MouseEvent) => void;

  constructor() {
    this.board = new MinesweeperBoard(10, 10, 15);
  }

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachMouseHandlers();
  }

  private attachMouseHandlers(): void {
    const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
    if (!canvas) return;

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.isPaused) return;
      const coord = this.getGridCoordFromPointer(e, canvas);
      if (!coord) return;

      this.cursor = { ...coord };

      if (this.gameOver || this.isWon) {
        if (e.button === 0) {
          this.reset();
        }
        return;
      }

      if (e.button === 0) {
        // Left Click: Reveal or Chord
        const cell = this.board.grid[coord.row][coord.col];
        if (cell.isRevealed && cell.neighborMines > 0) {
          this.handleChord(coord);
        } else {
          this.handleReveal(coord);
        }
      } else if (e.button === 2) {
        // Right Click: Toggle Flag
        this.handleFlag(coord);
      }
    };

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      if (this.isPaused || this.gameOver || this.isWon) return;
      const coord = this.getGridCoordFromPointer(e, canvas);
      if (coord) {
        this.hoveredCell = coord;
        this.cursor = { ...coord };
      } else {
        this.hoveredCell = null;
      }
    };

    this.boundContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    canvas.addEventListener("pointerdown", this.boundPointerDown);
    canvas.addEventListener("pointermove", this.boundPointerMove);
    canvas.addEventListener("contextmenu", this.boundContextMenu);
  }

  private getGridCoordFromPointer(e: MouseEvent | PointerEvent, canvas: HTMLCanvasElement): GridCoord | null {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const canvasX = (e.clientX - rect.left) * scaleX;
    const canvasY = (e.clientY - rect.top) * scaleY;

    const cellSize = 54;
    const boardWidth = this.board.cols * cellSize;
    const boardHeight = this.board.rows * cellSize;
    const offX = Math.floor((canvas.width - boardWidth) / 2);
    const offY = Math.floor((canvas.height - boardHeight) / 2) + 12;

    const col = Math.floor((canvasX - offX) / cellSize);
    const row = Math.floor((canvasY - offY) / cellSize);

    if (col >= 0 && col < this.board.cols && row >= 0 && row < this.board.rows) {
      return { col, row };
    }
    return null;
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.board.reset();
    this.cursor = { col: 4, row: 4 };
    this.hoveredCell = null;
    this.score = 0;
    this.level = 1;
    this.flagsPlaced = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.detonatedMine = null;
  }

  public update(_deltaTime: number): void {}

  private handleReveal(coord: GridCoord = this.cursor): void {
    if (this.gameOver || this.isWon || this.isPaused) return;

    if (!this.board.isGenerated) {
      this.board.generate(coord, this.ctx.random);
    }

    const result = revealCell(this.board, coord);
    if (result.hitMine) {
      this.gameOver = true;
      this.detonatedMine = { ...coord };
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    } else {
      if (result.revealedCount > 0) {
        this.score += result.revealedCount * 50;
        this.ctx.audio.playMove();
      }
      if (result.isWon) {
        this.handleVictory();
      }
    }
  }

  private handleChord(coord: GridCoord): void {
    if (this.gameOver || this.isWon || this.isPaused) return;

    const result = chordCell(this.board, coord);
    if (result.hitMine) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    } else {
      if (result.revealedCount > 0) {
        this.score += result.revealedCount * 50;
        this.ctx.audio.playMove();
      }
      if (result.isWon) {
        this.handleVictory();
      }
    }
  }

  private handleFlag(coord: GridCoord = this.cursor): void {
    if (this.gameOver || this.isWon || this.isPaused) return;

    const isFlagged = toggleFlag(this.board, coord);
    this.flagsPlaced += isFlagged ? 1 : -1;
    this.ctx.audio.playRotate();
  }

  private handleVictory(): void {
    this.isWon = true;
    this.score += 2500;
    this.ctx.session.setStatus("ready");
    this.ctx.audio.playVictory();
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.board.rows - 1, this.cursor.row + 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.board.cols - 1, this.cursor.col + 1);
        this.ctx.audio.playMove();
        break;
      case "ACTION_PRIMARY": // Click / Reveal / Chord
        {
          const cell = this.board.grid[this.cursor.row][this.cursor.col];
          if (cell.isRevealed && cell.neighborMines > 0) {
            this.handleChord(this.cursor);
          } else {
            this.handleReveal(this.cursor);
          }
        }
        break;
      case "ACTION_SECONDARY": // Flag
        this.handleFlag(this.cursor);
        break;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public destroy(): void {
    const canvas = (this.ctx?.renderer as PixelRenderer)?.getContext?.()?.canvas;
    if (canvas) {
      if (this.boundPointerDown) canvas.removeEventListener("pointerdown", this.boundPointerDown);
      if (this.boundPointerMove) canvas.removeEventListener("pointermove", this.boundPointerMove);
      if (this.boundContextMenu) canvas.removeEventListener("contextmenu", this.boundContextMenu);
    }
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.level;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // High-visibility matrix filling the box
    const cellSize = 54;
    const boardWidth = this.board.cols * cellSize; // 540
    const boardHeight = this.board.rows * cellSize; // 540
    const offX = Math.floor((w - boardWidth) / 2); // 30
    const offY = Math.floor((h - boardHeight) / 2) + 12; // 92

    // Board container
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "rgba(0, 255, 102, 0.55)", false);

    const numberColors: Record<number, string> = {
      1: "#38BDF8", // Cyan / Blue
      2: "#4ADE80", // Emerald Green
      3: "#F87171", // Ruby Red
      4: "#818CF8", // Indigo
      5: "#FB923C", // Orange
      6: "#2DD4BF", // Teal
      7: "#E879F9", // Purple
      8: "#FFFFFF", // White
    };

    // Draw Grid Cells
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (cell.isRevealed) {
          // Revealed recessed tile
          pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "#080e1c", true);
          pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "#1a2a4a", false);

          if (cell.isMine) {
            // Detonated or revealed mine
            const isOrigin = this.detonatedMine && this.detonatedMine.col === c && this.detonatedMine.row === r;
            pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, isOrigin ? "#7F1D1D" : "#1e293b", true);
            // Spiked naval mine
            pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, cellSize / 3, isOrigin ? "#EF4444" : "#0F172A", true);
            pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, cellSize / 6, isOrigin ? "#FFFFFF" : "#64748B", true);
          } else if (cell.neighborMines > 0) {
            const col = numberColors[cell.neighborMines] || "#38BDF8";
            pr.drawText(
              cell.neighborMines.toString(),
              cx + cellSize / 2,
              cy + cellSize / 2 + 8,
              {
                size: 24,
                color: col,
                align: "center",
                font: "monospace",
              }
            );
          }
        } else {
          // Unrevealed 3D button
          if (this.gameOver && cell.isMine) {
            // Reveal unflagged mines on game over
            pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "#1e293b", true);
            pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, cellSize / 3, "#475569", true);
          } else {
            const isHovered = this.hoveredCell && this.hoveredCell.col === c && this.hoveredCell.row === r;
            pr.drawPixelBlock(
              cx + 1,
              cy + 1,
              cellSize - 2,
              isHovered ? "#334155" : "#1e293b",
              isHovered ? "#94A3B8" : "#475569",
              "#0F172A"
            );

            if (cell.isFlagged) {
              if (this.gameOver && !cell.isMine) {
                // False flag
                pr.drawText("✕", cx + cellSize / 2, cy + cellSize / 2 + 8, {
                  size: 24,
                  color: "#FF3366",
                  align: "center",
                  font: "monospace",
                });
              } else {
                // Active red flag
                pr.drawText("⚑", cx + cellSize / 2, cy + cellSize / 2 + 9, {
                  size: 26,
                  color: "#EF4444",
                  align: "center",
                  font: "monospace",
                });
              }
            }
          }
        }

        // Active Keyboard / Cursor Highlight
        if (this.cursor.col === c && this.cursor.row === r && !this.gameOver && !this.isWon) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#ffd84d", false);
          pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "rgba(255, 216, 77, 0.4)", false);
        }
      }
    }

    // Top status text
    const remainingMines = Math.max(0, this.board.totalMines - this.flagsPlaced);
    pr.drawText(
      `MINES: ${remainingMines}  •  FLAGGED: ${this.flagsPlaced}  •  [LEFT CLICK: REVEAL / CHORD  •  RIGHT CLICK: FLAG]`,
      w / 2,
      offY - 20,
      {
        size: 11,
        color: "#4de8e8",
        align: "center",
        font: "monospace",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#ffd84d", false);
      pr.drawText("FIELD CLEARED — VICTORY", w / 2, h / 2 - 10, {
        size: 24,
        color: "#ffd84d",
        align: "center",
        font: "monospace",
      });
      pr.drawText("CLICK ANYWHERE OR PRESS [R] TO PLAY AGAIN", w / 2, h / 2 + 18, {
        size: 12,
        color: "#cbd5e1",
        align: "center",
        font: "monospace",
      });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("DETONATION — GAME OVER", w / 2, h / 2 - 10, {
        size: 24,
        color: "#FF3366",
        align: "center",
        font: "monospace",
      });
      pr.drawText("CLICK ANYWHERE OR PRESS [R] TO RETRY", w / 2, h / 2 + 18, {
        size: 12,
        color: "#cbd5e1",
        align: "center",
        font: "monospace",
      });
    }
  }
}
