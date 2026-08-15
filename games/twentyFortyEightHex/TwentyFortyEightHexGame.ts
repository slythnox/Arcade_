import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

export class TwentyFortyEightHexGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 5;
  private grid: number[][] = [];
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.spawnTile();
    this.spawnTile();
  }

  private spawnTile(): void {
    const empties: { r: number; c: number }[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) empties.push({ r, c });
      }
    }
    if (empties.length > 0) {
      const pick = empties[Math.floor(this.ctx.random.next() * empties.length)];
      this.grid[pick.r][pick.c] = this.ctx.random.next() < 0.85 ? 2 : 4;
    }
  }

  private slideRow(row: number[]): { row: number[]; score: number; moved: boolean } {
    let arr = row.filter((v) => v !== 0);
    let score = 0;
    let moved = false;

    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        score += arr[i];
        arr[i + 1] = 0;
      }
    }

    arr = arr.filter((v) => v !== 0);
    while (arr.length < this.size) arr.push(0);

    for (let i = 0; i < this.size; i++) {
      if (arr[i] !== row[i]) moved = true;
    }
    return { row: arr, score, moved };
  }

  private move(dir: "UP" | "DOWN" | "LEFT" | "RIGHT"): void {
    if (this.gameOver || this.isPaused) return;
    let anyMoved = false;
    let addedScore = 0;

    if (dir === "LEFT" || dir === "RIGHT") {
      for (let r = 0; r < this.size; r++) {
        const orig = [...this.grid[r]];
        if (dir === "RIGHT") orig.reverse();
        const res = this.slideRow(orig);
        if (dir === "RIGHT") res.row.reverse();
        this.grid[r] = res.row;
        if (res.moved) anyMoved = true;
        addedScore += res.score;
      }
    } else {
      for (let c = 0; c < this.size; c++) {
        const orig = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c], this.grid[4][c]];
        if (dir === "DOWN") orig.reverse();
        const res = this.slideRow(orig);
        if (dir === "DOWN") res.row.reverse();
        for (let r = 0; r < this.size; r++) {
          this.grid[r][c] = res.row[r];
        }
        if (res.moved) anyMoved = true;
        addedScore += res.score;
      }
    }

    if (anyMoved) {
      this.score += addedScore;
      this.ctx.audio.playMove();
      this.spawnTile();
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    if (action === "MOVE_LEFT") this.move("LEFT");
    if (action === "MOVE_RIGHT") this.move("RIGHT");
    if (action === "MOVE_UP") this.move("UP");
    if (action === "MOVE_DOWN") this.move("DOWN");
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

    const cellSize = 88;
    const gap = 8;
    const boardWidth = this.size * cellSize + (this.size - 1) * gap;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 12;

    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardWidth + 12, "#080e08", true);
    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardWidth + 12, "rgba(0, 255, 102, 0.4)", false);

    const colors: Record<number, string> = {
      2: "#0f2316",
      4: "#143320",
      8: "#1f4a2e",
      16: "#2a663e",
      32: "#00FF66",
      64: "#FFB703",
      128: "#F97316",
      256: "#FF3366",
      512: "#A855F7",
      1024: "#00F0FF",
      2048: "#FFFFFF",
    };

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const cx = offX + c * (cellSize + gap);
        const cy = offY + r * (cellSize + gap);

        if (val === 0) {
          pr.drawRect(cx, cy, cellSize, cellSize, "#060a06", true);
          pr.drawRect(cx, cy, cellSize, cellSize, "rgba(0, 255, 102, 0.1)", false);
        } else {
          const bg = colors[val] || "#FF3366";
          pr.drawPixelBlock(cx, cy, cellSize, bg, "#FFFFFF", "rgba(0,0,0,0.5)");
          pr.drawText(val.toString(), cx + cellSize / 2, cy + cellSize / 2 + 8, {
            size: val >= 1000 ? 22 : 28,
            color: val >= 32 ? "#030604" : "#FFFFFF",
            align: "center",
          });
        }
      }
    }

    pr.drawText(`SCORE: ${this.score}  •  [HEXADECIMAL MATRIX 2048]`, w / 2, 28, {
      size: 13,
      color: "#00FF66",
      align: "center",
    });
  }
}
