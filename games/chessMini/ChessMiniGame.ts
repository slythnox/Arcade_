import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

type PieceType = "K" | "Q" | "R" | "B" | "N" | "P";

interface ChessPiece {
  type: PieceType;
  color: "white" | "black";
}

export class ChessMiniGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 5;
  private readonly rows: number = 6;
  private board: (ChessPiece | null)[][] = [];
  private cursor: GridCoord = { col: 2, row: 4 };
  private selectedSquare: GridCoord | null = null;
  private turn: "white" | "black" = "white";
  private winner: "white" | "black" | null = null;
  private score: number = 0;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 4 };
    this.selectedSquare = null;
    this.turn = "white";
    this.winner = null;
    this.score = 0;
    this.isPaused = false;
    this.board = Array.from({ length: this.rows }, () => Array(this.cols).fill(null));

    // Black back rank: R, N, B, Q, K
    const order: PieceType[] = ["R", "N", "B", "Q", "K"];
    for (let c = 0; c < 5; c++) {
      this.board[0][c] = { type: order[c], color: "black" };
      this.board[1][c] = { type: "P", color: "black" };
      this.board[4][c] = { type: "P", color: "white" };
      this.board[5][c] = { type: order[c], color: "white" };
    }
  }

  private getLegalMoves(r: number, c: number): GridCoord[] {
    const piece = this.board[r][c];
    if (!piece) return [];
    const moves: GridCoord[] = [];
    const isWhite = piece.color === "white";

    const addIfValid = (nr: number, nc: number) => {
      if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
        const dest = this.board[nr][nc];
        if (!dest || dest.color !== piece.color) {
          moves.push({ row: nr, col: nc });
        }
      }
    };

    if (piece.type === "P") {
      const fwd = isWhite ? -1 : 1;
      // Step 1 forward
      if (r + fwd >= 0 && r + fwd < this.rows && this.board[r + fwd][c] === null) {
        moves.push({ row: r + fwd, col: c });
      }
      // Diagonal captures
      for (const dc of [-1, 1]) {
        const nr = r + fwd;
        const nc = c + dc;
        if (nr >= 0 && nr < this.rows && nc >= 0 && nc < this.cols) {
          if (this.board[nr][nc] && this.board[nr][nc]!.color !== piece.color) {
            moves.push({ row: nr, col: nc });
          }
        }
      }
    } else if (piece.type === "N") {
      const knightOffsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2],
        [1, -2], [1, 2], [2, -1], [2, 1],
      ];
      for (const [dr, dc] of knightOffsets) addIfValid(r + dr, c + dc);
    } else if (piece.type === "B" || piece.type === "R" || piece.type === "Q") {
      const dirs = piece.type === "B"
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : piece.type === "R"
        ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
        : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]];

      for (const [dr, dc] of dirs) {
        let cr = r + dr;
        let cc = c + dc;
        while (cr >= 0 && cr < this.rows && cc >= 0 && cc < this.cols) {
          const dest = this.board[cr][cc];
          if (!dest) {
            moves.push({ row: cr, col: cc });
          } else {
            if (dest.color !== piece.color) moves.push({ row: cr, col: cc });
            break;
          }
          cr += dr;
          cc += dc;
        }
      }
    } else if (piece.type === "K") {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr !== 0 || dc !== 0) addIfValid(r + dr, c + dc);
        }
      }
    }

    return moves;
  }

  private makeMove(from: GridCoord, to: GridCoord): boolean {
    const piece = this.board[from.row][from.col];
    if (!piece || piece.color !== this.turn) return false;

    const legals = this.getLegalMoves(from.row, from.col);
    if (!legals.some((l) => l.row === to.row && l.col === to.col)) return false;

    const dest = this.board[to.row][to.col];
    if (dest?.type === "K") {
      this.winner = piece.color;
    }

    this.board[to.row][to.col] = piece;
    this.board[from.row][from.col] = null;

    // Pawn Promotion
    if (piece.type === "P" && ((piece.color === "white" && to.row === 0) || (piece.color === "black" && to.row === 5))) {
      piece.type = "Q";
    }

    if (dest) {
      this.score += 200;
      this.ctx.audio.playExplosion();
    } else {
      this.ctx.audio.playMove();
    }

    if (this.winner) {
      if (this.winner === "white") {
        this.score += 5000;
        this.ctx.session.setStatus("ready");
        this.ctx.audio.playVictory();
      } else {
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      }
    }

    return true;
  }

  private triggerAIMove(): void {
    if (this.winner !== null) return;

    // Collect all black legal moves
    const allMoves: { from: GridCoord; to: GridCoord; score: number }[] = [];
    const values: Record<PieceType, number> = { P: 100, N: 300, B: 320, R: 500, Q: 900, K: 10000 };

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.board[r][c]?.color === "black") {
          const legals = this.getLegalMoves(r, c);
          for (const l of legals) {
            const captured = this.board[l.row][l.col];
            const moveScore = captured ? values[captured.type] : 0;
            allMoves.push({ from: { row: r, col: c }, to: l, score: moveScore });
          }
        }
      }
    }

    if (allMoves.length > 0) {
      allMoves.sort((a, b) => b.score - a.score);
      const chosen = allMoves[0];
      this.makeMove(chosen.from, chosen.to);
    }

    this.turn = "white";
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.winner !== null) return;

    if (action === "MOVE_UP") {
      this.cursor.row = Math.max(0, this.cursor.row - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_DOWN") {
      this.cursor.row = Math.min(this.rows - 1, this.cursor.row + 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_LEFT") {
      this.cursor.col = Math.max(0, this.cursor.col - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.cursor.col = Math.min(this.cols - 1, this.cursor.col + 1);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.turn === "white") {
        if (!this.selectedSquare) {
          if (this.board[this.cursor.row][this.cursor.col]?.color === "white") {
            this.selectedSquare = { ...this.cursor };
            this.ctx.audio.playMove();
          }
        } else {
          const moved = this.makeMove(this.selectedSquare, this.cursor);
          this.selectedSquare = null;
          if (moved && this.winner === null) {
            this.turn = "black";
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

    const cellSize = 80;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 100;

    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardHeight + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardHeight + 16, "rgba(0, 255, 102, 0.4)", false);

    const legals = this.selectedSquare
      ? this.getLegalMoves(this.selectedSquare.row, this.selectedSquare.col)
      : [];

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const isDark = (r + c) % 2 === 1;
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        pr.drawRect(cx, cy, cellSize, cellSize, isDark ? "#0e1e12" : "#050906", true);

        // Highlight legal move targets
        if (legals.some((l) => l.row === r && l.col === c)) {
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 8, "rgba(0, 240, 255, 0.5)", true);
        }

        // Draw Piece
        const piece = this.board[r][c];
        if (piece) {
          const pCol = piece.color === "white" ? "#00FF66" : "#FF3366";
          pr.drawText(piece.type, cx + cellSize / 2, cy + cellSize / 2 + 10, {
            size: 32,
            color: pCol,
            align: "center",
          });
        }

        // Selection / Cursor
        if (this.selectedSquare && this.selectedSquare.row === r && this.selectedSquare.col === c) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#00F0FF", false);
        }
        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#FFFFFF", false);
        }
      }
    }

    pr.drawText(
      `CHESS MINI 5x6  •  SCORE: ${this.score}  •  TURN: ${this.turn.toUpperCase()}`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.winner === "white") {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("CHECKMATE — WHITE WINS", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.winner === "black") {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("CHECKMATE — BLACK WINS", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
