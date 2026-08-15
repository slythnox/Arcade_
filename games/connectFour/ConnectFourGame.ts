import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

export class ConnectFourGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 7;
  private readonly rows: number = 6;
  private grid: number[][] = []; // 0 = empty, 1 = player, 2 = AI
  private currentCol: number = 3;
  private turn: "player" | "ai" = "player";
  private winner: number | "draw" | null = null;
  private score: number = 0;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.currentCol = 3;
    this.turn = "player";
    this.winner = null;
    this.score = 0;
    this.isPaused = false;
  }

  private dropPiece(col: number, player: number): boolean {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) {
        this.grid[r][col] = player;
        return true;
      }
    }
    return false;
  }

  private checkWin(p: number): boolean {
    // Horizontal, Vertical, Diagonal 4-in-a-row
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] !== p) continue;

        // Horizontal right
        if (c <= this.cols - 4 && this.grid[r][c + 1] === p && this.grid[r][c + 2] === p && this.grid[r][c + 3] === p) return true;
        // Vertical down
        if (r <= this.rows - 4 && this.grid[r + 1][c] === p && this.grid[r + 2][c] === p && this.grid[r + 3][c] === p) return true;
        // Diagonal down-right
        if (r <= this.rows - 4 && c <= this.cols - 4 && this.grid[r + 1][c + 1] === p && this.grid[r + 2][c + 2] === p && this.grid[r + 3][c + 3] === p) return true;
        // Diagonal down-left
        if (r <= this.rows - 4 && c >= 3 && this.grid[r + 1][c - 1] === p && this.grid[r + 2][c - 2] === p && this.grid[r + 3][c - 3] === p) return true;
      }
    }
    return false;
  }

  private triggerAIMove(): void {
    // Minimax / heuristic: Check if AI can win next, else block player win, else pick center
    let bestCol = -1;

    // 1. Can AI win?
    for (let c = 0; c < this.cols; c++) {
      if (this.dropPiece(c, 2)) {
        if (this.checkWin(2)) {
          bestCol = c;
          this.undoDrop(c);
          break;
        }
        this.undoDrop(c);
      }
    }

    // 2. Can player win? Block it!
    if (bestCol === -1) {
      for (let c = 0; c < this.cols; c++) {
        if (this.dropPiece(c, 1)) {
          if (this.checkWin(1)) {
            bestCol = c;
            this.undoDrop(c);
            break;
          }
          this.undoDrop(c);
        }
      }
    }

    // 3. Pick preferential center column
    if (bestCol === -1) {
      const preferred = [3, 2, 4, 1, 5, 0, 6];
      for (const c of preferred) {
        if (this.grid[0][c] === 0) {
          bestCol = c;
          break;
        }
      }
    }

    if (bestCol !== -1) {
      this.dropPiece(bestCol, 2);
      this.ctx.audio.playMove();

      if (this.checkWin(2)) {
        this.winner = 2;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      } else {
        this.turn = "player";
      }
    }
  }

  private undoDrop(col: number): void {
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][col] !== 0) {
        this.grid[r][col] = 0;
        break;
      }
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.winner !== null) return;

    if (action === "MOVE_LEFT") {
      this.currentCol = Math.max(0, this.currentCol - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.currentCol = Math.min(this.cols - 1, this.currentCol + 1);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "MOVE_DOWN") {
      if (this.turn === "player") {
        const success = this.dropPiece(this.currentCol, 1);
        if (success) {
          this.ctx.audio.playMove();
          if (this.checkWin(1)) {
            this.winner = 1;
            this.score = 2500;
            this.ctx.session.setStatus("ready");
            this.ctx.audio.playVictory();
          } else {
            this.turn = "ai";
            setTimeout(() => this.triggerAIMove(), 250);
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

    const cellSize = 68;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 140;

    // Drop Preview Indicator
    if (this.winner === null && this.turn === "player") {
      const px = offX + this.currentCol * cellSize + cellSize / 2;
      pr.drawCircle(px, 90, 24, "#00FF66", true);
      pr.drawCircle(px, 90, 8, "#FFFFFF", true);
    }

    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardHeight + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardHeight + 16, "rgba(0, 255, 102, 0.4)", false);

    // Draw Grid Slots
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * cellSize + cellSize / 2;
        const cy = offY + r * cellSize + cellSize / 2;

        if (val === 0) {
          pr.drawCircle(cx, cy, 26, "#030604", true);
          pr.drawCircle(cx, cy, 26, "rgba(0, 255, 102, 0.2)", false);
        } else if (val === 1) {
          pr.drawCircle(cx, cy, 26, "#00FF66", true);
          pr.drawCircle(cx, cy, 10, "#FFFFFF", true);
        } else if (val === 2) {
          pr.drawCircle(cx, cy, 26, "#FF3366", true);
          pr.drawCircle(cx, cy, 10, "#FFFFFF", true);
        }
      }
    }

    pr.drawText(
      `CONNECT FOUR  •  TURN: ${this.turn.toUpperCase()}  •  [← → MOVE, SPACE/↓ DROP]`,
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
      pr.drawText("PLAYER CONNECT FOUR — VICTORY", w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.winner === 2) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("AI CONNECT FOUR — DEFEAT", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
