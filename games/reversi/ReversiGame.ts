import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

interface FlippingDisc {
  row: number;
  col: number;
  fromPlayer: number;
  toPlayer: number;
  progress: number;
}

export class ReversiGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private board: number[][] = []; // 0 = empty, 1 = Black/Cyan, 2 = White/Amber
  private cursor: GridCoord = { col: 3, row: 3 };
  private turn: "player" | "ai" = "player";
  private winner: number | "draw" | null = null;
  private score: number = 0;
  private isPaused: boolean = false;
  private flippingDiscs: FlippingDisc[] = [];
  private aiThinkingTimer: number = 0;

  private readonly dirs = [
    [-1, -1], [-1, 0], [-1, 1],
    [0, -1],           [0, 1],
    [1, -1],  [1, 0],  [1, 1],
  ];

  // Corner and positional board evaluation matrix for Minimax AI
  private readonly posWeights = [
    [100, -20,  10,   5,   5,  10, -20, 100],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [ 10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
    [  5,  -2,  -1,   0,   0,  -1,  -2,   5],
    [  5,  -2,  -1,   0,   0,  -1,  -2,   5],
    [ 10,  -2,  -1,  -1,  -1,  -1,  -2,  10],
    [-20, -50,  -2,  -2,  -2,  -2, -50, -20],
    [100, -20,  10,   5,   5,  10, -20, 100],
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
    this.flippingDiscs = [];
    this.aiThinkingTimer = 0;
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

  private hasLegalMoves(player: number): boolean {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.getFlippableDiscs(r, c, player).length > 0) return true;
      }
    }
    return false;
  }

  private placeDisc(r: number, c: number, player: number): boolean {
    const flippable = this.getFlippableDiscs(r, c, player);
    if (flippable.length === 0) return false;

    this.board[r][c] = player;
    for (const pos of flippable) {
      const from = this.board[pos.row][pos.col];
      this.board[pos.row][pos.col] = player;
      this.flippingDiscs.push({
        row: pos.row,
        col: pos.col,
        fromPlayer: from,
        toPlayer: player,
        progress: 0,
      });
    }

    this.ctx.audio.playRotate();
    return true;
  }

  private makeAIMove(): void {
    let bestScore = -Infinity;
    let bestMove: GridCoord | null = null;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const flippable = this.getFlippableDiscs(r, c, 2);
        if (flippable.length > 0) {
          const moveScore = this.posWeights[r][c] + flippable.length * 10;
          if (moveScore > bestScore) {
            bestScore = moveScore;
            bestMove = { row: r, col: c };
          }
        }
      }
    }

    if (bestMove) {
      this.placeDisc(bestMove.row, bestMove.col, 2);
    }

    // Check next turn
    if (this.hasLegalMoves(1)) {
      this.turn = "player";
    } else if (this.hasLegalMoves(2)) {
      this.turn = "ai";
    } else {
      this.checkEndGame();
    }
  }

  private checkEndGame(): void {
    let p1 = 0;
    let p2 = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.board[r][c] === 1) p1++;
        if (this.board[r][c] === 2) p2++;
      }
    }

    this.score = p1 * 100;
    if (p1 > p2) {
      this.winner = 1;
      this.ctx.audio.playVictory();
      this.ctx.session.setStatus("ready");
    } else if (p2 > p1) {
      this.winner = 2;
      this.ctx.audio.playGameOver();
      this.ctx.session.setStatus("game-over");
    } else {
      this.winner = "draw";
      this.ctx.session.setStatus("ready");
    }
  }

  public update(dt: number): void {
    if (this.isPaused || this.winner !== null) return;

    // Update Flipping Discs Animation
    for (let i = this.flippingDiscs.length - 1; i >= 0; i--) {
      const fd = this.flippingDiscs[i];
      fd.progress += dt * 6;
      if (fd.progress >= 1) {
        this.flippingDiscs.splice(i, 1);
      }
    }

    // AI Turn Delay for natural rhythm
    if (this.turn === "ai") {
      this.aiThinkingTimer += dt;
      if (this.aiThinkingTimer >= 0.5) {
        this.aiThinkingTimer = 0;
        this.makeAIMove();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") this.cursor.col = Math.max(0, this.cursor.col - 1);
    if (action === "MOVE_RIGHT") this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
    if (action === "MOVE_UP") this.cursor.row = Math.max(0, this.cursor.row - 1);
    if (action === "MOVE_DOWN") this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);

    if (action === "ACTION_PRIMARY" && this.turn === "player" && this.winner === null) {
      if (this.placeDisc(this.cursor.row, this.cursor.col, 1)) {
        if (this.hasLegalMoves(2)) {
          this.turn = "ai";
          this.aiThinkingTimer = 0;
        } else if (!this.hasLegalMoves(1)) {
          this.checkEndGame();
        }
      }
    }

    if (action === "RESTART") this.reset();
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

    const cellSize = 62;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 110;

    // 1. Mahogany Wood Border Frame
    pr.drawRect(offX - 12, offY - 12, boardWidth + 24, boardWidth + 24, "#451a03", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "#78350f", true);

    let p1Count = 0;
    let p2Count = 0;

    // 2. Draw Felt Board & Discs
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.board[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        // Dark Emerald Green Baize Felt
        pr.drawRect(cx, cy, cellSize, cellSize, (r + c) % 2 === 0 ? "#064e3b" : "#047857", true);
        pr.drawRect(cx, cy, cellSize, cellSize, "rgba(0,0,0,0.25)", false);

        if (val === 1) p1Count++;
        if (val === 2) p2Count++;

        // Draw Discs with 3D Bevel & Specular Highlights
        if (val === 1) {
          // Obsidian Black Disc with cyan specular rim
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 24, "#0f172a", true);
          pr.drawCircle(cx + cellSize / 2 - 4, cy + cellSize / 2 - 4, 18, "#1e293b", true);
          pr.drawCircle(cx + cellSize / 2 - 6, cy + cellSize / 2 - 6, 6, "#38bdf8", true);
        } else if (val === 2) {
          // Ivory Pearl White Disc with gold sheen
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 24, "#cbd5e1", true);
          pr.drawCircle(cx + cellSize / 2 - 4, cy + cellSize / 2 - 4, 18, "#f8fafc", true);
          pr.drawCircle(cx + cellSize / 2 - 6, cy + cellSize / 2 - 6, 6, "#fde047", true);
        }

        // 3. Highlight Legal Moves for Active Player
        if (this.turn === "player" && this.getFlippableDiscs(r, c, 1).length > 0) {
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 6, "rgba(56, 189, 248, 0.5)", true);
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 6, "#38bdf8", false);
        }

        // 4. Cursor Box
        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#ffd84d", false);
          pr.drawRect(cx + 3, cy + 3, cellSize - 6, cellSize - 6, "rgba(255, 216, 77, 0.2)", true);
        }
      }
    }

    // Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`PLAYER (BLACK): ${p1Count}`, 24, 32, { size: 13, color: "#38bdf8", font: "monospace" });
    pr.drawText(this.turn === "player" ? "YOUR TURN" : "AI THINKING...", w / 2, 32, { size: 13, color: "#ffd84d", align: "center", font: "monospace" });
    pr.drawText(`AI (WHITE): ${p2Count}`, w - 24, 32, { size: 13, color: "#fde047", align: "right", font: "monospace" });

    // Bottom Controls Bar
    pr.drawRect(0, h - 45, w, 45, "#080e1c", true);
    pr.drawLine(0, h - 45, w, h - 45, "#1e293b", 1);
    pr.drawText("[ARROWS] Move  •  [SPACE] Place Disc  •  [R] Reset Board", 24, h - 18, { size: 11, color: "#94a3b8", font: "monospace" });

    // Overlay Game End
    if (this.winner !== null) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      const isWin = this.winner === 1;
      pr.drawRect(0, h / 2 - 45, w, 90, isWin ? "#22c55e" : "#ef4444", false);
      pr.drawText(
        this.winner === "draw" ? "STALEMATE DRAW!" : (isWin ? `VICTORY! (${p1Count} TO ${p2Count})` : `DEFEAT! (${p2Count} TO ${p1Count})`),
        w / 2,
        h / 2 - 10,
        { size: 22, color: isWin ? "#22c55e" : "#ef4444", align: "center", font: "monospace" }
      );
      pr.drawText("PRESS [R] TO PLAY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
