import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

interface Piece {
  player: number; // 1 = player, 2 = AI
  isKing: boolean;
}

export class CheckersGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private board: (Piece | null)[][] = [];
  private cursor: GridCoord = { col: 2, row: 5 };
  private selectedPiece: GridCoord | null = null;
  private turn: "player" | "ai" = "player";
  private score: number = 0;
  private winner: number | null = null;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 5 };
    this.selectedPiece = null;
    this.turn = "player";
    this.score = 0;
    this.winner = null;
    this.isPaused = false;
    this.board = Array.from({ length: this.size }, () => Array(this.size).fill(null));

    // Place AI pieces (top 3 rows on dark squares)
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < this.size; c++) {
        if ((r + c) % 2 === 1) {
          this.board[r][c] = { player: 2, isKing: false };
        }
      }
    }

    // Place Player pieces (bottom 3 rows on dark squares)
    for (let r = 5; r < 8; r++) {
      for (let c = 0; c < this.size; c++) {
        if ((r + c) % 2 === 1) {
          this.board[r][c] = { player: 1, isKing: false };
        }
      }
    }
  }

  private tryMove(from: GridCoord, to: GridCoord): boolean {
    const piece = this.board[from.row][from.col];
    if (!piece || piece.player !== 1) return false;
    if (this.board[to.row][to.col] !== null) return false;
    if ((to.row + to.col) % 2 !== 1) return false; // Dark squares only

    const dRow = to.row - from.row;
    const dCol = to.col - from.col;

    // Normal single step forward (Player moves up: dRow === -1, or king either)
    if (Math.abs(dCol) === 1) {
      if ((dRow === -1) || (piece.isKing && Math.abs(dRow) === 1)) {
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
        if (to.row === 0) piece.isKing = true;
        this.ctx.audio.playMove();
        return true;
      }
    }

    // Jump capture (dRow === -2, dCol === +/-2)
    if (Math.abs(dCol) === 2 && (dRow === -2 || (piece.isKing && Math.abs(dRow) === 2))) {
      const midR = from.row + dRow / 2;
      const midC = from.col + dCol / 2;
      const midPiece = this.board[midR][midC];

      if (midPiece && midPiece.player === 2) {
        // Capture
        this.board[midR][midC] = null;
        this.board[to.row][to.col] = piece;
        this.board[from.row][from.col] = null;
        if (to.row === 0) piece.isKing = true;
        this.score += 200;
        this.ctx.audio.playExplosion();
        return true;
      }
    }

    return false;
  }

  private triggerAIMove(): void {
    if (this.winner !== null) return;

    // Find all AI pieces
    const aiPieces: GridCoord[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c]?.player === 2) aiPieces.push({ col: c, row: r });
      }
    }

    if (aiPieces.length === 0) {
      this.winner = 1;
      this.score += 3000;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
      return;
    }

    // Check jump moves first
    let moved = false;
    for (const p of aiPieces) {
      const piece = this.board[p.row][p.col]!;
      const dirs = piece.isKing
        ? [[2, 2], [2, -2], [-2, 2], [-2, -2]]
        : [[2, 2], [2, -2]];

      for (const [dr, dc] of dirs) {
        const tr = p.row + dr;
        const tc = p.col + dc;
        const mr = p.row + dr / 2;
        const mc = p.col + dc / 2;

        if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && this.board[tr][tc] === null) {
          if (this.board[mr][mc]?.player === 1) {
            this.board[mr][mc] = null;
            this.board[tr][tc] = piece;
            this.board[p.row][p.col] = null;
            if (tr === 7) piece.isKing = true;
            this.ctx.audio.playExplosion();
            moved = true;
            break;
          }
        }
      }
      if (moved) break;
    }

    // Otherwise standard step forward
    if (!moved) {
      for (const p of aiPieces) {
        const piece = this.board[p.row][p.col]!;
        const dirs = piece.isKing
          ? [[1, 1], [1, -1], [-1, 1], [-1, -1]]
          : [[1, 1], [1, -1]];

        for (const [dr, dc] of dirs) {
          const tr = p.row + dr;
          const tc = p.col + dc;
          if (tr >= 0 && tr < 8 && tc >= 0 && tc < 8 && this.board[tr][tc] === null) {
            this.board[tr][tc] = piece;
            this.board[p.row][p.col] = null;
            if (tr === 7) piece.isKing = true;
            this.ctx.audio.playMove();
            moved = true;
            break;
          }
        }
        if (moved) break;
      }
    }

    this.turn = "player";
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
        if (!this.selectedPiece) {
          if (this.board[this.cursor.row][this.cursor.col]?.player === 1) {
            this.selectedPiece = { ...this.cursor };
            this.ctx.audio.playMove();
          }
        } else {
          const moved = this.tryMove(this.selectedPiece, this.cursor);
          this.selectedPiece = null;
          if (moved) {
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

    // Draw Checkerboard Squares
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const isDark = (r + c) % 2 === 1;
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        pr.drawRect(cx, cy, cellSize, cellSize, isDark ? "#0f2316" : "#040604", true);

        // Draw Pieces
        const piece = this.board[r][c];
        if (piece) {
          const pCol = piece.player === 1 ? "#00FF66" : "#FF3366";
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 22, pCol, true);
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 8, "#FFFFFF", true);
          if (piece.isKing) {
            pr.drawText("★", cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 14, color: "#030604", align: "center" });
          }
        }

        // Selection / Cursor
        if (this.selectedPiece && this.selectedPiece.row === r && this.selectedPiece.col === c) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#00F0FF", false);
        }
        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#FFFFFF", false);
        }
      }
    }

    pr.drawText(
      `CHECKERS  •  SCORE: ${this.score}  •  TURN: ${this.turn.toUpperCase()}  •  [SPACE TO SELECT/MOVE]`,
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
      pr.drawText("CHECKERS VICTORY — AI ELIMINATED", w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
