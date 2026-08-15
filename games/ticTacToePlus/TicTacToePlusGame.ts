import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class TicTacToePlusGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 3;
  // 3x3 master board containing 3x3 sub-boards: [masterR][masterC][subR][subC]
  private subBoards: number[][][][] = [];
  private masterBoard: number[][] = [];
  private activeMaster: GridCoord | null = null; // null = any sub-board allowed
  private cursorMaster: GridCoord = { col: 1, row: 1 };
  private cursorSub: GridCoord = { col: 1, row: 1 };
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
    this.subBoards = Array.from({ length: 3 }, () =>
      Array.from({ length: 3 }, () =>
        Array.from({ length: 3 }, () => Array(3).fill(0))
      )
    );
    this.masterBoard = Array.from({ length: 3 }, () => Array(3).fill(0));
    this.activeMaster = null;
    this.cursorMaster = { col: 1, row: 1 };
    this.cursorSub = { col: 1, row: 1 };
    this.turn = "player";
    this.winner = null;
    this.score = 0;
    this.isPaused = false;
  }

  private check3x3Win(b: number[][]): number {
    // Rows & Cols
    for (let i = 0; i < 3; i++) {
      if (b[i][0] !== 0 && b[i][0] === b[i][1] && b[i][1] === b[i][2]) return b[i][0];
      if (b[0][i] !== 0 && b[0][i] === b[1][i] && b[1][i] === b[2][i]) return b[0][i];
    }
    // Diagonals
    if (b[0][0] !== 0 && b[0][0] === b[1][1] && b[1][1] === b[2][2]) return b[0][0];
    if (b[0][2] !== 0 && b[0][2] === b[1][1] && b[1][1] === b[2][0]) return b[0][2];
    return 0;
  }

  private playMove(mR: number, mC: number, sR: number, sC: number, player: number): boolean {
    if (this.masterBoard[mR][mC] !== 0) return false;
    if (this.subBoards[mR][mC][sR][sC] !== 0) return false;
    if (this.activeMaster !== null && (this.activeMaster.row !== mR || this.activeMaster.col !== mC)) return false;

    this.subBoards[mR][mC][sR][sC] = player;
    this.ctx.audio.playMove();

    // Check if sub-board won
    const subWin = this.check3x3Win(this.subBoards[mR][mC]);
    if (subWin !== 0) {
      this.masterBoard[mR][mC] = subWin;
      this.ctx.audio.playPowerUp();

      // Check if master board won
      const masterWin = this.check3x3Win(this.masterBoard);
      if (masterWin !== 0) {
        this.winner = masterWin;
        if (masterWin === 1) {
          this.score = 3000;
          this.ctx.session.setStatus("ready");
          this.ctx.audio.playVictory();
        } else {
          this.ctx.session.setStatus("game-over");
          this.ctx.audio.playExplosion();
        }
        return true;
      }
    }

    // Set next active master board to (sR, sC)
    if (this.masterBoard[sR][sC] === 0) {
      this.activeMaster = { row: sR, col: sC };
    } else {
      this.activeMaster = null; // Free choice if target sub-board is already completed
    }

    return true;
  }

  private triggerAIMove(): void {
    if (this.winner !== null) return;

    // Determine legal sub-boards
    const legalMasters: GridCoord[] = [];
    if (this.activeMaster !== null && this.masterBoard[this.activeMaster.row][this.activeMaster.col] === 0) {
      legalMasters.push(this.activeMaster);
    } else {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (this.masterBoard[r][c] === 0) legalMasters.push({ row: r, col: c });
        }
      }
    }

    if (legalMasters.length === 0) return;

    const chosenMaster = legalMasters[Math.floor(this.ctx.random.next() * legalMasters.length)];
    const emptySubs: GridCoord[] = [];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        if (this.subBoards[chosenMaster.row][chosenMaster.col][r][c] === 0) {
          emptySubs.push({ row: r, col: c });
        }
      }
    }

    if (emptySubs.length > 0) {
      const chosenSub = emptySubs[Math.floor(this.ctx.random.next() * emptySubs.length)];
      this.playMove(chosenMaster.row, chosenMaster.col, chosenSub.row, chosenSub.col, 2);
      this.turn = "player";
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.winner !== null) return;

    if (action === "MOVE_LEFT") {
      this.cursorSub.col = Math.max(0, this.cursorSub.col - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_RIGHT") {
      this.cursorSub.col = Math.min(2, this.cursorSub.col + 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_UP") {
      this.cursorSub.row = Math.max(0, this.cursorSub.row - 1);
      this.ctx.audio.playMove();
    } else if (action === "MOVE_DOWN") {
      this.cursorSub.row = Math.min(2, this.cursorSub.row + 1);
      this.ctx.audio.playMove();
    } else if (action === "ROTATE") {
      // Cycle active master board
      this.cursorMaster.col = (this.cursorMaster.col + 1) % 3;
      if (this.cursorMaster.col === 0) this.cursorMaster.row = (this.cursorMaster.row + 1) % 3;
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.turn === "player") {
        const targetMaster = this.activeMaster || this.cursorMaster;
        const success = this.playMove(targetMaster.row, targetMaster.col, this.cursorSub.row, this.cursorSub.col, 1);
        if (success && this.winner === null) {
          this.turn = "ai";
          setTimeout(() => this.triggerAIMove(), 300);
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

    const subSize = 54;
    const masterGap = 16;
    const totalBoardSize = 3 * (3 * subSize) + 2 * masterGap;
    const offX = Math.floor((w - totalBoardSize) / 2);
    const offY = 110;

    pr.drawRect(offX - 8, offY - 8, totalBoardSize + 16, totalBoardSize + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, totalBoardSize + 16, totalBoardSize + 16, "rgba(0, 255, 102, 0.4)", false);

    for (let mR = 0; mR < 3; mR++) {
      for (let mC = 0; mC < 3; mC++) {
        const mx = offX + mC * (3 * subSize + masterGap);
        const my = offY + mR * (3 * subSize + masterGap);

        // Highlight Active Sub-board
        const isActive = this.activeMaster === null || (this.activeMaster.row === mR && this.activeMaster.col === mC);
        pr.drawRect(mx - 2, my - 2, 3 * subSize + 4, 3 * subSize + 4, isActive ? "rgba(0, 255, 102, 0.15)" : "#030503", true);
        pr.drawRect(mx - 2, my - 2, 3 * subSize + 4, 3 * subSize + 4, isActive ? "#00FF66" : "rgba(0,255,102,0.2)", false);

        // Draw Master Cell if Won
        if (this.masterBoard[mR][mC] !== 0) {
          const mWinner = this.masterBoard[mR][mC];
          const mCol = mWinner === 1 ? "#00FF66" : "#FF3366";
          pr.drawText(mWinner === 1 ? "X" : "O", mx + (3 * subSize) / 2, my + (3 * subSize) / 2 + 20, {
            size: 64,
            color: mCol,
            align: "center",
          });
        } else {
          // Draw 3x3 Small Sub-Board
          for (let sR = 0; sR < 3; sR++) {
            for (let sC = 0; sC < 3; sC++) {
              const val = this.subBoards[mR][mC][sR][sC];
              const sx = mx + sC * subSize;
              const sy = my + sR * subSize;

              pr.drawRect(sx, sy, subSize, subSize, "rgba(0, 255, 102, 0.05)", false);

              if (val === 1) {
                pr.drawText("X", sx + subSize / 2, sy + subSize / 2 + 6, { size: 20, color: "#00FF66", align: "center" });
              } else if (val === 2) {
                pr.drawText("O", sx + subSize / 2, sy + subSize / 2 + 6, { size: 20, color: "#FF3366", align: "center" });
              }
            }
          }
        }
      }
    }

    pr.drawText(
      `ULTIMATE TIC-TAC-TOE  •  TURN: ${this.turn.toUpperCase()}  •  [ARROWS MOVE, SPACE TO PLAY]`,
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
      pr.drawText("PLAYER ULTIMATE VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    } else if (this.winner === 2) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("AI ULTIMATE VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
