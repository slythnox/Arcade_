import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

export class KingdomGridGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private territory: number[][] = []; // 0 = neutral, 1 = Player, 2 = AI
  private cursor: GridCoord = { col: 3, row: 3 };
  private turn: "player" | "ai" = "player";
  private energyPlayer: number = 10;
  private energyAI: number = 10;
  private score: number = 0;
  private winner: number | null = null;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 3, row: 3 };
    this.turn = "player";
    this.energyPlayer = 10;
    this.energyAI = 10;
    this.score = 0;
    this.winner = null;
    this.isPaused = false;
    this.territory = Array.from({ length: this.size }, () => Array(this.size).fill(0));

    // Starting castles
    this.territory[7][0] = 1;
    this.territory[0][7] = 2;
  }

  private claimCell(r: number, c: number, player: number): boolean {
    if (this.territory[r][c] === player) return false;

    // Check if cell is adjacent to existing player territory
    const neighbors = [
      { r: r - 1, c },
      { r: r + 1, c },
      { r, c: c - 1 },
      { r, c: c + 1 },
    ];

    const isConnected = neighbors.some(
      (n) => n.r >= 0 && n.r < this.size && n.c >= 0 && n.c < this.size && this.territory[n.r][n.c] === player
    );

    if (!isConnected) return false;

    const cost = this.territory[r][c] === 0 ? 2 : 4; // Cost 2 to claim neutral, 4 to conquer enemy
    if (player === 1 && this.energyPlayer < cost) return false;
    if (player === 2 && this.energyAI < cost) return false;

    if (player === 1) this.energyPlayer -= cost;
    else this.energyAI -= cost;

    this.territory[r][c] = player;
    this.ctx.audio.playMove();
    return true;
  }

  private triggerAIMove(): void {
    if (this.winner !== null) return;

    // AI claims best adjacent cell towards center / player
    let bestMove: GridCoord | null = null;
    let bestVal = -999;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.territory[r][c] !== 2) {
          const cost = this.territory[r][c] === 0 ? 2 : 4;
          if (this.energyAI >= cost) {
            // Check connectivity
            const isConn = [
              { r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }
            ].some((n) => n.r >= 0 && n.r < 8 && n.c >= 0 && n.c < 8 && this.territory[n.r][n.c] === 2);

            if (isConn) {
              const val = 10 - (r + (7 - c)); // Move towards bottom-left player castle
              if (val > bestVal) {
                bestVal = val;
                bestMove = { row: r, col: c };
              }
            }
          }
        }
      }
    }

    if (bestMove) {
      this.claimCell(bestMove.row, bestMove.col, 2);
    }

    // Income generation per turn based on territory size
    let p1Count = 0;
    let p2Count = 0;
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (this.territory[r][c] === 1) p1Count++;
        if (this.territory[r][c] === 2) p2Count++;
      }
    }

    this.energyPlayer = Math.min(30, this.energyPlayer + Math.max(2, Math.floor(p1Count / 3)));
    this.energyAI = Math.min(30, this.energyAI + Math.max(2, Math.floor(p2Count / 3)));

    this.score = p1Count * 100;

    // Check Victory (Domination > 32 cells)
    if (p1Count >= 33) {
      this.winner = 1;
      this.score += 5000;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    } else if (p2Count >= 33) {
      this.winner = 2;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    }

    this.turn = "player";
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.winner !== null) return;

    if (action === "MOVE_UP") this.cursor.row = Math.max(0, this.cursor.row - 1);
    if (action === "MOVE_DOWN") this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
    if (action === "MOVE_LEFT") this.cursor.col = Math.max(0, this.cursor.col - 1);
    if (action === "MOVE_RIGHT") this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
    if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.turn === "player") {
        const success = this.claimCell(this.cursor.row, this.cursor.col, 1);
        if (success) {
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
        const val = this.territory[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (val === 1) {
          p1Count++;
          pr.drawRect(cx, cy, cellSize, cellSize, "#00FF66", true);
          pr.drawRect(cx, cy, cellSize, cellSize, "#047857", false);
        } else if (val === 2) {
          p2Count++;
          pr.drawRect(cx, cy, cellSize, cellSize, "#FF3366", true);
          pr.drawRect(cx, cy, cellSize, cellSize, "#991B1B", false);
        } else {
          pr.drawRect(cx, cy, cellSize, cellSize, "#060a06", true);
          pr.drawRect(cx, cy, cellSize, cellSize, "rgba(0, 255, 102, 0.1)", false);
        }

        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#00F0FF", false);
        }
      }
    }

    pr.drawText(
      `KINGDOM GRID  •  YOU: ${p1Count} (EN: ${this.energyPlayer})  •  AI: ${p2Count}  •  [SPACE TO CLAIM]`,
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
      pr.drawText("TERRITORY DOMINATED — VICTORY", w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
