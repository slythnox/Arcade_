import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

export class TicTacToePlusGame implements GameInstance {
  private ctx!: GameContext;

  // 3x3 macro board of 3x3 sub-boards
  // 0 = empty, 1 = Player (X, Cyan), 2 = AI (O, Pink)
  private subBoards: number[][][][] = [];
  private masterBoard: number[][] = [];
  private activeMaster: { row: number; col: number } | null = null; // null = any sub-board allowed

  // Global 9x9 cursor position (0-8) for intuitive keyboard navigation
  private cursorRow: number = 4;
  private cursorCol: number = 4;

  private turn: "player" | "ai" = "player";
  private winner: number | "draw" | null = null;
  private score: number = 0;
  private isPaused: boolean = false;
  private animTimer: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);

    this.subBoards = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => Array(3).fill(0))
      )
    );
    this.masterBoard = Array.from({ length: 3 }, () => Array(3).fill(0));
    this.activeMaster = null;
    this.cursorRow = 4;
    this.cursorCol = 4;
    this.turn = "player";
    this.winner = null;
    this.score = 0;
    this.isPaused = false;
    this.animTimer = 0;
  }

  private check3x3Win(b: number[][]): number {
    // Rows & Columns
    for (let i = 0; i < 3; i++) {
      if (b[i][0] !== 0 && b[i][0] === b[i][1] && b[i][1] === b[i][2]) return b[i][0];
      if (b[0][i] !== 0 && b[0][i] === b[1][i] && b[1][i] === b[2][i]) return b[0][i];
    }
    // Diagonals
    if (b[0][0] !== 0 && b[0][0] === b[1][1] && b[1][1] === b[2][2]) return b[0][0];
    if (b[0][2] !== 0 && b[0][2] === b[1][1] && b[1][1] === b[2][0]) return b[0][2];
    return 0;
  }

  private isSubBoardFull(mR: number, mC: number): boolean {
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.subBoards[mR][mC][r][c] === 0) return false;
      }
    }
    return true;
  }

  public playMove(mR: number, mC: number, sR: number, sC: number, player: number): boolean {
    if (this.winner !== null) return false;
    if (this.masterBoard[mR][mC] !== 0) return false;
    if (this.subBoards[mR][mC][sR][sC] !== 0) return false;

    // Check if move is within active sub-board constraint
    if (
      this.activeMaster !== null &&
      (this.activeMaster.row !== mR || this.activeMaster.col !== mC)
    ) {
      return false;
    }

    this.subBoards[mR][mC][sR][sC] = player;
    this.ctx.audio?.playMove?.();

    // Check if sub-board is won
    const subWin = this.check3x3Win(this.subBoards[mR][mC]);
    if (subWin !== 0) {
      this.masterBoard[mR][mC] = subWin;
      this.ctx.audio?.playRotate?.();

      if (player === 1) this.score += 500;

      // Check if macro board is won
      const masterWin = this.check3x3Win(this.masterBoard);
      if (masterWin !== 0) {
        this.winner = masterWin;
        if (masterWin === 1) {
          this.score += 3000;
          this.ctx.audio?.playVictory?.();
        } else {
          this.ctx.audio?.playGameOver?.();
        }
        return true;
      }
    }

    // Next active master board is targeted to (sR, sC)
    if (this.masterBoard[sR][sC] === 0 && !this.isSubBoardFull(sR, sC)) {
      this.activeMaster = { row: sR, col: sC };
    } else {
      this.activeMaster = null; // Free choice if target sub-board is already claimed or full
    }

    return true;
  }

  private triggerAIMove(): void {
    if (this.winner !== null) return;

    // Determine legal sub-boards
    const legalMasters: { row: number; col: number }[] = [];
    if (
      this.activeMaster !== null &&
      this.masterBoard[this.activeMaster.row][this.activeMaster.col] === 0 &&
      !this.isSubBoardFull(this.activeMaster.row, this.activeMaster.col)
    ) {
      legalMasters.push(this.activeMaster);
    } else {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (this.masterBoard[r][c] === 0 && !this.isSubBoardFull(r, c)) {
            legalMasters.push({ row: r, col: c });
          }
        }
      }
    }

    if (legalMasters.length === 0) {
      this.winner = "draw";
      return;
    }

    // AI Heuristic Evaluation
    let bestMove: { mR: number; mC: number; sR: number; sC: number } | null = null;
    let bestScore = -Infinity;

    for (const master of legalMasters) {
      for (let sR = 0; sR < 3; sR++) {
        for (let sC = 0; sC < 3; sC++) {
          if (this.subBoards[master.row][master.col][sR][sC] === 0) {
            let moveScore = 0;

            // 1. Winning move in this sub-board
            this.subBoards[master.row][master.col][sR][sC] = 2;
            if (this.check3x3Win(this.subBoards[master.row][master.col]) === 2) {
              moveScore += 100;
            }
            // 2. Center priority
            if (sR === 1 && sC === 1) moveScore += 15;
            // 3. Corners priority
            if ((sR === 0 || sR === 2) && (sC === 0 || sC === 2)) moveScore += 10;

            // 4. Block player win
            this.subBoards[master.row][master.col][sR][sC] = 1;
            if (this.check3x3Win(this.subBoards[master.row][master.col]) === 1) {
              moveScore += 80;
            }
            this.subBoards[master.row][master.col][sR][sC] = 0;

            moveScore += this.ctx.random.next() * 5;

            if (moveScore > bestScore) {
              bestScore = moveScore;
              bestMove = { mR: master.row, mC: master.col, sR, sC };
            }
          }
        }
      }
    }

    if (bestMove) {
      this.playMove(bestMove.mR, bestMove.mC, bestMove.sR, bestMove.sC, 2);
      this.turn = "player";
    }
  }

  public update(dt: number): void {
    this.animTimer += dt;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.winner !== null) {
      if (action === "ACTION_PRIMARY" || action === "RESTART") this.reset();
      return;
    }

    if (action === "MOVE_LEFT") {
      this.cursorCol = (this.cursorCol - 1 + 9) % 9;
      this.ctx.audio?.playMove?.();
    } else if (action === "MOVE_RIGHT") {
      this.cursorCol = (this.cursorCol + 1) % 9;
      this.ctx.audio?.playMove?.();
    } else if (action === "MOVE_UP") {
      this.cursorRow = (this.cursorRow - 1 + 9) % 9;
      this.ctx.audio?.playMove?.();
    } else if (action === "MOVE_DOWN") {
      this.cursorRow = (this.cursorRow + 1) % 9;
      this.ctx.audio?.playMove?.();
    } else if (action === "ACTION_PRIMARY" || action === "ACTION_SECONDARY") {
      if (this.turn === "player") {
        const mR = Math.floor(this.cursorRow / 3);
        const mC = Math.floor(this.cursorCol / 3);
        const sR = this.cursorRow % 3;
        const sC = this.cursorCol % 3;

        const success = this.playMove(mR, mC, sR, sC, 1);
        if (success && this.winner === null) {
          this.turn = "ai";
          setTimeout(() => this.triggerAIMove(), 320);
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
    pr.clear("#050914");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const subCellSize = 52;
    const subGridSize = 3 * subCellSize; // 156px
    const masterGap = 16;
    const totalBoardSize = 3 * subGridSize + 2 * masterGap; // 500px
    const offX = Math.floor((w - totalBoardSize) / 2);
    const offY = 85;

    // Header Status Bar
    pr.drawText(
      `ULTIMATE TIC-TAC-TOE  •  TURN: ${this.turn === "player" ? "YOU (X)" : "AI (O)"}`,
      w / 2,
      32,
      {
        size: 13,
        color: this.turn === "player" ? "#4de8e8" : "#ff5c8a",
        align: "center",
      }
    );

    pr.drawText(
      "[ARROWS] NAVIGATE GRID    [SPACE/A] PLACE MARKER",
      w / 2,
      56,
      {
        size: 10,
        color: "#94a3b8",
        align: "center",
      }
    );

    // Board Backdrop Container
    pr.drawRect(offX - 8, offY - 8, totalBoardSize + 16, totalBoardSize + 16, "#080e1c", true);
    pr.drawRect(offX - 8, offY - 8, totalBoardSize + 16, totalBoardSize + 16, "#1a2b4c", false);

    // Draw 3x3 Master Boards
    for (let mR = 0; mR < 3; mR++) {
      for (let mC = 0; mC < 3; mC++) {
        const mx = offX + mC * (subGridSize + masterGap);
        const my = offY + mR * (subGridSize + masterGap);

        const isLegalMaster =
          this.winner === null &&
          this.masterBoard[mR][mC] === 0 &&
          (this.activeMaster === null || (this.activeMaster.row === mR && this.activeMaster.col === mC));

        // Sub-board background
        let subBg = "#0b1426";
        let subBorder = "#1e355c";

        if (isLegalMaster) {
          subBg = "rgba(77, 232, 232, 0.08)";
          subBorder = "#4de8e8";
        } else if (this.masterBoard[mR][mC] !== 0) {
          subBg = this.masterBoard[mR][mC] === 1 ? "rgba(77, 232, 232, 0.15)" : "rgba(255, 92, 138, 0.15)";
          subBorder = this.masterBoard[mR][mC] === 1 ? "#4de8e8" : "#ff5c8a";
        }

        pr.drawRect(mx - 2, my - 2, subGridSize + 4, subGridSize + 4, subBg, true);
        pr.drawRect(mx - 2, my - 2, subGridSize + 4, subGridSize + 4, subBorder, false);

        // If macro cell is won, draw big X or O
        if (this.masterBoard[mR][mC] !== 0) {
          const mWin = this.masterBoard[mR][mC];
          const mColor = mWin === 1 ? "#4de8e8" : "#ff5c8a";
          pr.drawText(mWin === 1 ? "X" : "O", mx + subGridSize / 2, my + subGridSize / 2 + 22, {
            size: 64,
            color: mColor,
            align: "center",
          });
        } else {
          // Draw individual 3x3 cells
          for (let sR = 0; sR < 3; sR++) {
            for (let sC = 0; sC < 3; sC++) {
              const cx = mx + sC * subCellSize;
              const cy = my + sR * subCellSize;
              const val = this.subBoards[mR][mC][sR][sC];

              // Cell border grid
              pr.drawRect(cx, cy, subCellSize, subCellSize, "#162544", false);

              // Render cell value
              if (val === 1) {
                pr.drawText("X", cx + subCellSize / 2, cy + subCellSize / 2 + 8, {
                  size: 22,
                  color: "#4de8e8",
                  align: "center",
                });
              } else if (val === 2) {
                pr.drawText("O", cx + subCellSize / 2, cy + subCellSize / 2 + 8, {
                  size: 22,
                  color: "#ff5c8a",
                  align: "center",
                });
              }

              // Highlight cursor cell
              const globalR = mR * 3 + sR;
              const globalC = mC * 3 + sC;
              if (this.cursorRow === globalR && this.cursorCol === globalC && this.winner === null) {
                const pulse = Math.abs(Math.sin(this.animTimer * 5));
                const cursorCol = this.turn === "player" ? "#ffd84d" : "#94a3b8";
                pr.drawRect(cx + 2, cy + 2, subCellSize - 4, subCellSize - 4, `rgba(255, 216, 77, ${0.15 + pulse * 0.2})`, true);
                pr.drawRect(cx + 2, cy + 2, subCellSize - 4, subCellSize - 4, cursorCol, false);
              }
            }
          }
        }
      }
    }

    // Winner Banner
    if (this.winner !== null) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(6, 11, 24, 0.96)", true);
      const winColor = this.winner === 1 ? "#4de8e8" : this.winner === 2 ? "#ff5c8a" : "#ffd84d";
      pr.drawRect(0, h / 2 - 50, w, 100, winColor, false);

      const title = this.winner === 1 ? "VICTORY! MACRO GRID WON" : this.winner === 2 ? "AI CLAIMED THE BOARD" : "TACTICAL DRAW";
      pr.drawText(title, w / 2, h / 2 - 10, { size: 20, color: winColor, align: "center" });
      pr.drawText("PRESS SPACE OR RESTART TO PLAY AGAIN", w / 2, h / 2 + 20, { size: 11, color: "#e2e8f0", align: "center" });
    }
  }
}
