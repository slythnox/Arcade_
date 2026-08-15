import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class ReversiGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private board: number[][] = []; // 0 = empty, 1 = player (green/black), 2 = AI (amber/white)
  private cursor: GridCoord = { col: 3, row: 3 };
  private turn: "player" | "ai" = "player";
  private winner: number | "draw" | null = null;
  private score: number = 0;
  private isPaused: boolean = false;

  private readonly dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 3, row: 3 };
    this.turn = "player";
    this.winner = null;
    this.score = 0;
    this.isPaused = false;
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));

    // Standard starting 4 center discs
    this.board[3][3] = 2;
    this.board[3][4] = 1;
    this.board[4][3] = 1;
    this.board[4][4] = 2;
  }

  private getFlippableDiscs(r: number, c: number, player: number): GridCoord[] {
    if (this.board[r][c] !== 0) return [];
    const opponent = player === 1 ? 2 : 1;
    const toFlip: GridCoord[] = [];

    for (const [dr, dc] of this.dirs) {
      let curR = r + dr;
      let curC = c + dc;
      const path: GridCoord[] = [];

      while (curR >= 0 && curR < this.size && curC >= 0 && curC < this.size && this.board[curR][curC] === opponent) {
        path.push({ row: curR, col: curC });
        curR += dr;
        curC += dc;
      }

      if (curR >= 0 && curR < this.size && curC >= 0 && curC < this.size && this.board[curR][curC] === player && path.length > 0) {
        toFlip.push(...path);
      }
    }

    return toFlip;
  }

  private makeMove(r: number, c: number, player: number): boolean {
    const flippable = this.getFlippableDiscs(r, c, player);
    if (flippable.length === 0) return false;

    this.board[r][c] = player;
    for (const f of flippable) {
      this.board[f.row][f.col] = player;
    }
    this.ctx.audio.playMove();
    return true;
  }

  private triggerAIMove(): void {
    if (this.winner !== null) return;

    // Evaluate all valid moves for AI (player 2) with corner weights
    const validMoves: { r: number; c: number; flips: number; weight: number }[] = [];
    const weights = [
      [100, -20, 10, 5, 5, 10, -20, 100],
      [-20, -50, -2, -2, -2, -2, -50, -20],
      [10, -2, -1, -1, -1, -1, -2, 10],
      [5, -2, -1, 0, 0, -1, -2, 5],
      [5, -2, -1, 0, 0, -1, -2, 5],
      [10, -2, -1, -1, -1, -1, -2, 10],
      [-20, -50, -2, -2, -2, -2, -50, -20],
      [100, -20, 10, 5, 5, 10, -20, 100],
    ];

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const flips = this.getFlippableDiscs(r, c, 2);
        if (flips.length > 0) {
          validMoves.push({ r, c, flips: flips.length, weight: weights[r][c] + flips.length * 2 });
        }
      }
    }

    if (validMoves.length > 0) {
      validMoves.sort((a, b) => b.weight - a.weight);
      const best = validMoves[0];
      this.makeMove(best.r, best.c, 2);
    }

    this.checkGameEnd();
    this.turn = "player";
  }

  private checkGameEnd(): void {
    let p1Count = 0;
    let p2Count = 0;
    let anyValid = false;

    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.board[r][c] === 1) p1Count++;
        if (this.board[r][c] === 2) p2Count++;
        if (this.getFlippableDiscs(r, c, 1).length > 0 || this.getFlippableDiscs(r, c, 2).length > 0) {
          anyValid = true;
        }
      }
    }

    this.score = p1Count * 100;

    if (!anyValid || p1Count + p2Count === 64) {
      if (p1Count > p2Count) {
        this.winner = 1;
        this.score += 2500;
        this.ctx.session.setStatus("ready");
        this.ctx.audio.playVictory();
      } else if (p2Count > p1Count) {
        this.winner = 2;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      } else {
        this.winner = "draw";
      }
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.winner !== null) return;

    if (action === "MOVE_UP") {
      this.cursor.row = Math.max(0, this.cursor.row - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_DOWN") {
      this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_LEFT") {
      this.cursor.col = Math.max(0, this.cursor.col - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.turn === "player") {
        const moved = this.makeMove(this.cursor.row, this.cursor.col, 1);
        if (moved) {
          this.checkGameEnd();
          if (this.winner === null) {
            this.turn = "ai";
            setTimeout(() => this.triggerAIMove(), 300);
          }
        }
      }
    } else if (action === "RESTART") {
      this.reset();
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

    const cellSize = 62;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 110;

    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "rgba(0, 255, 102, 0.4)", false);

    let p1Count = 0;
    let p2Count = 0;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.board[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        pr.drawRect(cx, cy, cellSize, cellSize, "#07130a", true);
        pr.drawRect(cx, cy, cellSize, cellSize, "rgba(0, 255, 102, 0.15)", false);

        if (val === 1) {
          p1Count++;
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 22, "#00FF66", true);
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 8, "#FFFFFF", true);
        } else if (val === 2) {
          p2Count++;
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 22, "#FFB703", true);
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 8, "#FFFFFF", true);
        }

        // Highlight valid moves
        if (this.turn === "player" && this.getFlippableDiscs(r, c, 1).length > 0) {
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 6, "rgba(0, 240, 255, 0.4)", true);
        }

        // Cursor
        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#00F0FF", false);
        }
      }
    }

    pr.drawText(
      `REVERSI  •  YOU (GREEN): ${p1Count}  •  AI (AMBER): ${p2Count}  •  [SPACE TO PLACE DISC]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.winner === 1) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText(`REVERSI VICTORY — ${p1Count} TO ${p2Count}`, w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.winner === 2) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText(`REVERSI DEFEAT — ${p2Count} TO ${p1Count}`, w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
