import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

type GateType = "WIRE" | "AND" | "OR" | "NOT" | "XOR" | "POWER" | "LAMP";

interface CircuitNode {
  type: GateType;
  powered: boolean;
}

export class NeonCircuitGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 6;
  private grid: CircuitNode[][] = [];
  private cursor: GridCoord = { col: 2, row: 2 };
  private score: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 2 };
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => ({ type: "WIRE", powered: false }))
    );

    // Power Inputs on Left
    this.grid[1][0] = { type: "POWER", powered: true };
    this.grid[4][0] = { type: "POWER", powered: true };

    // Target Lamps on Right
    this.grid[2][5] = { type: "LAMP", powered: false };
    this.grid[3][5] = { type: "LAMP", powered: false };

    // Logic Gates
    this.grid[1][2] = { type: "AND", powered: false };
    this.grid[4][2] = { type: "NOT", powered: false };
    this.grid[2][4] = { type: "OR", powered: false };
    this.grid[3][4] = { type: "XOR", powered: false };

    this.propagateSignals();
  }

  private cycleGateType(): void {
    const { row, col } = this.cursor;
    const node = this.grid[row][col];
    if (node.type === "POWER" || node.type === "LAMP") return;

    const sequence: GateType[] = ["WIRE", "AND", "OR", "NOT", "XOR"];
    const curIdx = sequence.indexOf(node.type);
    node.type = sequence[(curIdx + 1) % sequence.length];
    this.ctx.audio.playRotate();
    this.propagateSignals();
  }

  private propagateSignals(): void {
    // Reset power
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c].type !== "POWER") {
          this.grid[r][c].powered = false;
        }
      }
    }

    // Propagate from left to right across the 6 columns
    for (let c = 1; c < this.size; c++) {
      for (let r = 0; r < this.size; r++) {
        const node = this.grid[r][c];
        const left = this.grid[r][c - 1]?.powered || false;
        const top = r > 0 ? this.grid[r - 1][c]?.powered || false : false;
        const bottom = r < this.size - 1 ? this.grid[r + 1][c]?.powered || false : false;

        if (node.type === "WIRE") {
          node.powered = left || top || bottom;
        } else if (node.type === "NOT") {
          node.powered = !left;
        } else if (node.type === "AND") {
          node.powered = left && (top || bottom);
        } else if (node.type === "OR") {
          node.powered = left || top || bottom;
        } else if (node.type === "XOR") {
          node.powered = (left || top) && !(left && top);
        } else if (node.type === "LAMP") {
          node.powered = left;
        }
      }
    }

    const lampsLit = this.grid.some((row) => row.some((n) => n.type === "LAMP" && n.powered));
    if (lampsLit && !this.isWon) {
      this.isWon = true;
      this.score = 3000;
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_UP") this.cursor.row = Math.max(0, this.cursor.row - 1);
    if (action === "MOVE_DOWN") this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
    if (action === "MOVE_LEFT") this.cursor.col = Math.max(0, this.cursor.col - 1);
    if (action === "MOVE_RIGHT") this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
    if (action === "ACTION_PRIMARY" || action === "CONFIRM" || action === "ROTATE") this.cycleGateType();
    if (action === "RESTART") this.reset();
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
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 120;

    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "rgba(0, 255, 102, 0.4)", false);

    pr.drawGrid(this.size, this.size, cellSize, "rgba(0, 255, 102, 0.08)", offX, offY);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const node = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        const pCol = node.powered ? "#00FF66" : "#1a2e20";
        const txtCol = node.powered ? "#FFFFFF" : "rgba(255,255,255,0.4)";

        if (node.type === "POWER") {
          pr.drawPixelBlock(cx + 8, cy + 8, cellSize - 16, "#FFB703", "#FFFFFF", "#040604");
          pr.drawText("PWR", cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 11, color: "#040604", align: "center" });
        } else if (node.type === "LAMP") {
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 22, node.powered ? "#00F0FF" : "#081820", true);
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 22, "#00F0FF", false);
          pr.drawText("LAMP", cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 9, color: node.powered ? "#040604" : "#00F0FF", align: "center" });
        } else if (node.type === "WIRE") {
          pr.drawRect(cx + cellSize / 2 - 4, cy + cellSize / 2 - 4, 8, 8, pCol, true);
        } else {
          // Gate
          pr.drawPixelBlock(cx + 8, cy + 8, cellSize - 16, pCol, "#FFFFFF", "#040604");
          pr.drawText(node.type, cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 10, color: txtCol, align: "center" });
        }

        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#00F0FF", false);
        }
      }
    }

    pr.drawText(
      `NEON CIRCUIT  •  [SPACE TO CYCLE GATE: WIRE, AND, OR, NOT, XOR]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("NEON LAMPS ILLUMINATED — VICTORY", w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
