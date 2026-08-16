import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

export class ConnectFourGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 7;
  private readonly rows: number = 6;
  private grid: number[][] = []; // 0 = empty, 1 = player, 2 = AI
  private hoverCol: number = 3;
  private turn: "player" | "ai" = "player";
  private winner: number | "draw" | null = null;
  private winCells: {r: number, c: number}[] = [];
  
  private p1Wins: number = 0;
  private aiWins: number = 0;
  private score: number = 0;
  private isPaused: boolean = false;
  private time: number = 0;

  private dropping: {col: number, fromRow: number, toRow: number, progress: number, player: number} | null = null;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.grid = Array.from({ length: this.rows }, () => Array(this.cols).fill(0));
    this.hoverCol = 3;
    this.turn = "player";
    this.winner = null;
    this.winCells = [];
    this.dropping = null;
    this.isPaused = false;
  }

  private dropPieceLogic(col: number, player: number): number {
    for (let r = this.rows - 1; r >= 0; r--) {
      if (this.grid[r][col] === 0) {
        return r;
      }
    }
    return -1;
  }

  private dropPiece(col: number, player: number): boolean {
    const toRow = this.dropPieceLogic(col, player);
    if (toRow !== -1) {
      this.grid[toRow][col] = player;
      return true;
    }
    return false;
  }

  private checkWinFull(p: number, testGrid = this.grid): {r:number,c:number}[] | null {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (testGrid[r][c] !== p) continue;
        if (c <= this.cols - 4 && testGrid[r][c + 1] === p && testGrid[r][c + 2] === p && testGrid[r][c + 3] === p) return [{r,c}, {r,c:c+1}, {r,c:c+2}, {r,c:c+3}];
        if (r <= this.rows - 4 && testGrid[r + 1][c] === p && testGrid[r + 2][c] === p && testGrid[r + 3][c] === p) return [{r,c}, {r:r+1,c}, {r:r+2,c}, {r:r+3,c}];
        if (r <= this.rows - 4 && c <= this.cols - 4 && testGrid[r + 1][c + 1] === p && testGrid[r + 2][c + 2] === p && testGrid[r + 3][c + 3] === p) return [{r,c}, {r:r+1,c:c+1}, {r:r+2,c:c+2}, {r:r+3,c:c+3}];
        if (r <= this.rows - 4 && c >= 3 && testGrid[r + 1][c - 1] === p && testGrid[r + 2][c - 2] === p && testGrid[r + 3][c - 3] === p) return [{r,c}, {r:r+1,c:c-1}, {r:r+2,c:c-2}, {r:r+3,c:c-3}];
      }
    }
    return null;
  }

  // Improved evaluate function
  private evaluateBoard(player: number): number {
    let score = 0;
    const opp = player === 1 ? 2 : 1;

    // Center column preference
    let centerCount = 0;
    for (let r = 0; r < this.rows; r++) {
      if (this.grid[r][3] === player) centerCount++;
    }
    score += centerCount * 3;

    // We can evaluate windows of 4
    const evaluateWindow = (window: number[]) => {
      let score = 0;
      let pCount = window.filter(c => c === player).length;
      let emptyCount = window.filter(c => c === 0).length;
      let oppCount = window.filter(c => c === opp).length;

      if (pCount === 4) score += 1000000;
      else if (pCount === 3 && emptyCount === 1) score += 100;
      else if (pCount === 2 && emptyCount === 2) score += 10;

      if (oppCount === 3 && emptyCount === 1) score -= 1000;
      
      return score;
    };

    // Horizontal
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        let window = [this.grid[r][c], this.grid[r][c+1], this.grid[r][c+2], this.grid[r][c+3]];
        score += evaluateWindow(window);
      }
    }
    // Vertical
    for (let c = 0; c < this.cols; c++) {
      for (let r = 0; r < this.rows - 3; r++) {
        let window = [this.grid[r][c], this.grid[r+1][c], this.grid[r+2][c], this.grid[r+3][c]];
        score += evaluateWindow(window);
      }
    }
    // Diag
    for (let r = 0; r < this.rows - 3; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        let window = [this.grid[r][c], this.grid[r+1][c+1], this.grid[r+2][c+2], this.grid[r+3][c+3]];
        score += evaluateWindow(window);
      }
    }
    // Anti-Diag
    for (let r = 0; r < this.rows - 3; r++) {
      for (let c = 0; c < this.cols - 3; c++) {
        let window = [this.grid[r+3][c], this.grid[r+2][c+1], this.grid[r+1][c+2], this.grid[r][c+3]];
        score += evaluateWindow(window);
      }
    }

    return score;
  }

  private triggerAIMove(): void {
    let bestScore = -Infinity;
    let bestCol = -1;
    
    // Depth 3 Minimax (adjusting to avoid slow execution while providing good challenge)
    for (let c = 0; c < this.cols; c++) {
      let r = this.dropPieceLogic(c, 2);
      if (r !== -1) {
        this.grid[r][c] = 2;
        if (this.checkWinFull(2)) { // Immediate win
          bestCol = c;
          this.grid[r][c] = 0;
          break;
        }
        let score = this.minimax(3, false, -Infinity, Infinity);
        this.grid[r][c] = 0;
        
        if (score > bestScore) {
          bestScore = score;
          bestCol = c;
        } else if (score === bestScore && Math.random() < 0.5) {
          bestCol = c;
        }
      }
    }

    // Fallback if somehow -1 (e.g. board full but not caught)
    if (bestCol === -1) {
      for (let c = 0; c < this.cols; c++) if (this.grid[0][c] === 0) bestCol = c;
    }

    if (bestCol !== -1) {
      const toRow = this.dropPieceLogic(bestCol, 2);
      this.dropping = { col: bestCol, fromRow: -1, toRow, progress: 0, player: 2 };
      this.ctx.audio.playMove();
      this.turn = "player"; // Let player wait while dropping visually
    }
  }

  private minimax(depth: number, isMaximizing: boolean, alpha: number, beta: number): number {
    if (this.checkWinFull(2)) return 1000000;
    if (this.checkWinFull(1)) return -1000000;
    
    let isFull = true;
    for (let c = 0; c < this.cols; c++) if (this.grid[0][c] === 0) isFull = false;
    if (isFull) return 0;

    if (depth === 0) return this.evaluateBoard(2);

    if (isMaximizing) {
      let value = -Infinity;
      for (let c = 0; c < this.cols; c++) {
        let r = this.dropPieceLogic(c, 2);
        if (r !== -1) {
          this.grid[r][c] = 2;
          value = Math.max(value, this.minimax(depth - 1, false, alpha, beta));
          this.grid[r][c] = 0;
          alpha = Math.max(alpha, value);
          if (alpha >= beta) break;
        }
      }
      return value;
    } else {
      let value = Infinity;
      for (let c = 0; c < this.cols; c++) {
        let r = this.dropPieceLogic(c, 1);
        if (r !== -1) {
          this.grid[r][c] = 1;
          value = Math.min(value, this.minimax(depth - 1, true, alpha, beta));
          this.grid[r][c] = 0;
          beta = Math.min(beta, value);
          if (alpha >= beta) break;
        }
      }
      return value;
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.time += dt;

    if (this.dropping) {
      this.dropping.progress += dt * 8; // Drop speed
      if (this.dropping.progress >= 1.0) {
        // Finalize drop
        this.grid[this.dropping.toRow][this.dropping.col] = this.dropping.player;
        this.ctx.audio.playDrop();
        
        const win = this.checkWinFull(this.dropping.player);
        if (win) {
          this.winner = this.dropping.player;
          this.winCells = win;
          if (this.winner === 1) {
            this.score += 2500;
            this.p1Wins++;
            this.ctx.audio.playVictory();
          } else {
            this.aiWins++;
            this.ctx.audio.playExplosion();
          }
          this.ctx.session.setStatus("game-over");
        } else {
          // Check draw
          let full = true;
          for (let c = 0; c < this.cols; c++) if (this.grid[0][c] === 0) full = false;
          if (full) {
            this.winner = "draw";
            this.ctx.session.setStatus("game-over");
          } else if (this.dropping.player === 1) {
            this.turn = "ai";
            setTimeout(() => this.triggerAIMove(), 250);
          }
        }
        this.dropping = null;
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "RESTART" && this.winner !== null) {
      this.reset();
      return;
    }

    if (this.winner !== null || this.dropping !== null || this.turn !== "player") return;

    if (action === "MOVE_LEFT") {
      this.hoverCol = Math.max(0, this.hoverCol - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.hoverCol = Math.min(this.cols - 1, this.hoverCol + 1);
      this.ctx.audio.playMove();
    } else if (action === "ACTION_PRIMARY" || action === "MOVE_DOWN") {
      const toRow = this.dropPieceLogic(this.hoverCol, 1);
      if (toRow !== -1) {
        this.dropping = { col: this.hoverCol, fromRow: -1, toRow, progress: 0, player: 1 };
        this.ctx.audio.playMove();
      }
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
    pr.clear("#000000"); // Dark background
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 75;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 160;

    // HUD
    pr.drawText(`CONNECT FOUR`, w / 2, 40, { size: 32, color: "#FFFFFF", align: "center" });
    pr.drawText(`P1 WINS: ${this.p1Wins}`, 50, 90, { size: 18, color: "#f44336" });
    pr.drawText(`AI WINS: ${this.aiWins}`, w - 50, 90, { size: 18, color: "#ffeb3b", align: "right" });
    pr.drawText(`SCORE: ${this.score}`, w / 2, 90, { size: 18, color: "#FFFFFF", align: "center" });

    // Hover Preview
    if (this.winner === null && this.turn === "player" && !this.dropping) {
      const px = offX + this.hoverCol * cellSize + cellSize / 2;
      pr.drawCircle(px, offY - 40, 30, "#f44336", true); // Player red
    }

    // Board Background
    rawCtx.fillStyle = '#1a237e'; // Dark blue board
    rawCtx.fillRect(offX - 10, offY - 10, boardWidth + 20, boardHeight + 20);

    // Draw Pieces & Holes
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        let val = this.grid[r][c];
        
        // If this exact slot is where dropping piece is going, it is visually empty right now
        if (this.dropping && this.dropping.col === c && this.dropping.toRow === r) {
          val = 0;
        }

        const cx = offX + c * cellSize + cellSize / 2;
        const cy = offY + r * cellSize + cellSize / 2;

        if (val === 0) {
          pr.drawCircle(cx, cy, 32, "#000000", true); // Hole
        } else {
          const color = val === 1 ? "#f44336" : "#ffeb3b";
          const isWin = this.winCells.some(wc => wc.r === r && wc.c === c);
          
          if (isWin) {
            rawCtx.shadowColor = color;
            rawCtx.shadowBlur = 15 + Math.sin(this.time * 5) * 5;
          }
          pr.drawCircle(cx, cy, 32, color, true);
          // Inner shadow/depth
          pr.drawCircle(cx, cy, 24, val === 1 ? "#d32f2f" : "#fbc02d", true);
          if (isWin) {
            rawCtx.shadowBlur = 0; // reset
          }
        }
      }
    }

    // Draw Dropping Piece
    if (this.dropping) {
      const startY = offY - 40;
      const targetY = offY + this.dropping.toRow * cellSize + cellSize / 2;
      const currentY = startY + (targetY - startY) * this.dropping.progress;
      const cx = offX + this.dropping.col * cellSize + cellSize / 2;
      
      const color = this.dropping.player === 1 ? "#f44336" : "#ffeb3b";
      const innerColor = this.dropping.player === 1 ? "#d32f2f" : "#fbc02d";
      
      // Draw over board (partially clipping logic would be ideal but rendering above is fine)
      pr.drawCircle(cx, currentY, 32, color, true);
      pr.drawCircle(cx, currentY, 24, innerColor, true);
    }

    // Board front overlay (to make pieces look inside holes)
    rawCtx.globalCompositeOperation = 'destination-out';
    // Punch holes in an overlay? Simple rendering is ok as is, pieces over holes.
    rawCtx.globalCompositeOperation = 'source-over';

    if (this.winner) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(0,0,0,0.85)", true);
      if (this.winner === "draw") {
        pr.drawText("DRAW", w / 2, h / 2 - 10, { size: 32, color: "#FFF", align: "center" });
      } else {
        const tColor = this.winner === 1 ? "#f44336" : "#ffeb3b";
        const tText = this.winner === 1 ? "PLAYER WINS!" : "AI WINS!";
        pr.drawText(tText, w / 2, h / 2 - 10, { size: 36, color: tColor, align: "center" });
      }
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 25, { size: 16, color: "#FFF", align: "center" });
    }
  }
}
