import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

type MachineType = "none" | "ore_patch" | "miner" | "smelter" | "fabricator";

interface Tile {
  type: MachineType;
  level: number;
}

export class ResourceMinerGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 6;
  private grid: Tile[][] = [];
  private cursor: GridCoord = { col: 2, row: 2 };
  private ironOre: number = 0;
  private ironPlates: number = 0;
  private circuits: number = 0;
  private score: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private simTimer: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 2 };
    this.ironOre = 0;
    this.ironPlates = 0;
    this.circuits = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.simTimer = 0;

    this.grid = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => ({ type: "none", level: 1 }))
    );

    // Initial Ore patches
    this.grid[1][1].type = "ore_patch";
    this.grid[4][4].type = "ore_patch";
  }

  private buildMachine(): void {
    if (this.isWon || this.isPaused) return;
    const { row, col } = this.cursor;
    const tile = this.grid[row][col];

    if (tile.type === "ore_patch") {
      tile.type = "miner";
      this.ctx.audio.playPowerUp();
    } else if (tile.type === "none") {
      if (this.ironOre >= 5 && !this.grid.some((r) => r.some((c) => c.type === "smelter"))) {
        this.ironOre -= 5;
        tile.type = "smelter";
        this.ctx.audio.playPowerUp();
      } else if (this.ironPlates >= 5) {
        this.ironPlates -= 5;
        tile.type = "fabricator";
        this.ctx.audio.playPowerUp();
      }
    }
  }

  public update(dt: number): void {
    if (this.isWon || this.isPaused) return;

    this.simTimer += dt;
    if (this.simTimer >= 1.0) {
      this.simTimer = 0;

      // Run production ticks
      for (let r = 0; r < this.size; r++) {
        for (let c = 0; c < this.size; c++) {
          const t = this.grid[r][c];
          if (t.type === "miner") {
            this.ironOre += 2;
          } else if (t.type === "smelter" && this.ironOre >= 2) {
            this.ironOre -= 2;
            this.ironPlates += 1;
          } else if (t.type === "fabricator" && this.ironPlates >= 2) {
            this.ironPlates -= 2;
            this.circuits += 1;
            this.score += 250;
          }
        }
      }

      if (this.circuits >= 20 && !this.isWon) {
        this.isWon = true;
        this.score += 5000;
        this.ctx.session.setStatus("ready");
        this.ctx.audio.playVictory();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_UP") this.cursor.row = Math.max(0, this.cursor.row - 1);
    if (action === "MOVE_DOWN") this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
    if (action === "MOVE_LEFT") this.cursor.col = Math.max(0, this.cursor.col - 1);
    if (action === "MOVE_RIGHT") this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
    if (action === "ACTION_PRIMARY" || action === "CONFIRM") this.buildMachine();
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

    pr.drawGrid(this.size, this.size, cellSize, "rgba(0, 255, 102, 0.1)", offX, offY);

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const t = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (t.type === "ore_patch") {
          pr.drawCircle(cx + cellSize / 2, cy + cellSize / 2, 22, "#FFB703", true);
          pr.drawText("ORE", cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 11, color: "#040604", align: "center" });
        } else if (t.type === "miner") {
          pr.drawPixelBlock(cx + 8, cy + 8, cellSize - 16, "#FFB703", "#FFFFFF", "#040604");
          pr.drawText("MINER", cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 10, color: "#040604", align: "center" });
        } else if (t.type === "smelter") {
          pr.drawPixelBlock(cx + 8, cy + 8, cellSize - 16, "#FF3366", "#FFFFFF", "#040604");
          pr.drawText("SMELT", cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 10, color: "#FFFFFF", align: "center" });
        } else if (t.type === "fabricator") {
          pr.drawPixelBlock(cx + 8, cy + 8, cellSize - 16, "#00F0FF", "#FFFFFF", "#040604");
          pr.drawText("FAB", cx + cellSize / 2, cy + cellSize / 2 + 5, { size: 10, color: "#040604", align: "center" });
        }

        if (this.cursor.row === r && this.cursor.col === c) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#00FF66", false);
        }
      }
    }

    pr.drawText(
      `ORE: ${this.ironOre}  •  PLATES: ${this.ironPlates}  •  CIRCUITS: ${this.circuits}/20`,
      w / 2,
      28,
      {
        size: 12,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("PRODUCTION TARGET MET — VICTORY", w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
