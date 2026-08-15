import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";
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
      1: "#00F0FF", // Cyan
      2: "#00FF66", // Green
      3: "#FFB703", // Yellow
      4: "#F97316", // Orange
      5: "#FF3366", // Coral
      6: "#A855F7", // Purple
      7: "#EC4899", // Pink
      8: "#FFFFFF",
    };

    // Draw Grid Cells
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (cell.isRevealed) {
          // Revealed tile
          pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "#080e08", true);
          pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "rgba(0, 255, 102, 0.15)", false);

          if (cell.isMine) {
            // Detonated or revealed mine
            const isOrigin = this.detonatedMine && this.detonatedMine.col === c && this.detonatedMine.row === r;
            pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, isOrigin ? "#7F1D1D" : "#1A2E1A", true);
            pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, cellSize / 3, isOrigin ? "#FF3366" : "#A3B3A3", true);
            pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, cellSize / 6, "#FFFFFF", true);
          } else if (cell.neighborMines > 0) {
            const col = numberColors[cell.neighborMines] || "#00FF66";
            pr.drawText(
              cell.neighborMines.toString(),
              cx + cellSize / 2,
              cy + cellSize / 2 + 8,
              {
                size: 24,
                color: col,
                align: "center",
              }
            );
          }
        } else {
          // Unrevealed button
          if (this.gameOver && cell.isMine) {
            // Reveal unflagged mines on game over
            pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "#111811", true);
            pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, cellSize / 3, "#64748B", true);
          } else {
            const isHovered = this.hoveredCell && this.hoveredCell.col === c && this.hoveredCell.row === r;
            const highlightColor = isHovered ? "rgba(0, 255, 102, 0.55)" : "rgba(0, 255, 102, 0.3)";
            pr.drawPixelBlock(cx + 1, cy + 1, cellSize - 2, isHovered ? "#162516" : "#0f170f", highlightColor, "#040604");

            if (cell.isFlagged) {
              if (this.gameOver && !cell.isMine) {
                // False flag on game over
                pr.drawText("✕", cx + cellSize / 2, cy + cellSize / 2 + 8, {
                  size: 24,
                  color: "#FF3366",
                  align: "center",
                });
              } else {
                // Active flag marker
                pr.drawText("⚑", cx + cellSize / 2, cy + cellSize / 2 + 9, {
                  size: 26,
                  color: this.isWon ? "#00FF66" : "#FFB703",
                  align: "center",
                });
              }
            }
          }
        }

        // Active Keyboard / Cursor Highlight
        if (this.cursor.col === c && this.cursor.row === r && !this.gameOver && !this.isWon) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#00FF66", false);
          pr.drawRect(cx + 1, cy + 1, cellSize - 2, cellSize - 2, "rgba(0, 255, 102, 0.5)", false);
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
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4, 6, 4, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("FIELD CLEARED — VICTORY", w / 2, h / 2 - 10, {
        size: 24,
        color: "#00FF66",
        align: "center",
      });
      pr.drawText("CLICK ANYWHERE OR PRESS R TO PLAY AGAIN", w / 2, h / 2 + 18, {
        size: 12,
        color: "#F0F4F0",
        align: "center",
      });
    } else if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4, 6, 4, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("DETONATION — GAME OVER", w / 2, h / 2 - 10, {
        size: 24,
        color: "#FF3366",
        align: "center",
      });
      pr.drawText("CLICK ANYWHERE OR PRESS R TO RETRY", w / 2, h / 2 + 18, {
        size: 12,
        color: "#F0F4F0",
        align: "center",
      });
    }
  }
}
