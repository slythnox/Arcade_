import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

export class TwentyFortyEightGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 4;
  private grid: number[][] = [];
  private score: number = 0;
  private bestScore: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
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
    this.isWon = false;
    this.isPaused = false;
    this.spawnTile();
    this.spawnTile();
  }

  private spawnTile(): void {
    const emptyCells: { r: number; c: number }[] = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) emptyCells.push({ r, c });
      }
    }
    if (emptyCells.length > 0) {
      const cell = emptyCells[Math.floor(this.ctx.random.next() * emptyCells.length)];
      this.grid[cell.r][cell.c] = this.ctx.random.next() < 0.9 ? 2 : 4;
    }
  }

  private slide(row: number[]): { row: number[]; scoreGained: number; moved: boolean } {
    let arr = row.filter((v) => v !== 0);
    let scoreGained = 0;
    let moved = false;

    for (let i = 0; i < arr.length - 1; i++) {
      if (arr[i] === arr[i + 1]) {
        arr[i] *= 2;
        scoreGained += arr[i];
        if (arr[i] === 2048) this.isWon = true;
        arr[i + 1] = 0;
      }
    }

    arr = arr.filter((v) => v !== 0);
    while (arr.length < this.size) {
      arr.push(0);
    }

    for (let i = 0; i < this.size; i++) {
      if (arr[i] !== row[i]) moved = true;
    }

    return { row: arr, scoreGained, moved };
  }

  private move(dir: "UP" | "DOWN" | "LEFT" | "RIGHT"): void {
    if (this.gameOver || this.isPaused) return;
    let anyMoved = false;
    let addedScore = 0;

    if (dir === "LEFT" || dir === "RIGHT") {
      for (let r = 0; r < this.size; r++) {
        const original = [...this.grid[r]];
        if (dir === "RIGHT") original.reverse();
        const res = this.slide(original);
        if (dir === "RIGHT") res.row.reverse();
        this.grid[r] = res.row;
        if (res.moved) anyMoved = true;
        addedScore += res.scoreGained;
      }
    } else {
      for (let c = 0; c < this.size; c++) {
        const original = [this.grid[0][c], this.grid[1][c], this.grid[2][c], this.grid[3][c]];
        if (dir === "DOWN") original.reverse();
        const res = this.slide(original);
        if (dir === "DOWN") res.row.reverse();
        for (let r = 0; r < this.size; r++) {
          this.grid[r][c] = res.row[r];
        }
        if (res.moved) anyMoved = true;
        addedScore += res.scoreGained;
      }
    }

    if (anyMoved) {
      this.score += addedScore;
      this.ctx.audio.playMove();
      if (addedScore > 0) {
        globalParticles.emitBurst(300, 350, 16, ["#FFB703", "#FF5C8A", "#00FF66", "#ffffff"], 70, 220);
        globalParticles.emitText(`+${addedScore}`, 300, 150, "#FFB703", 20);
      }
      this.spawnTile();
      this.checkGameOver();
    }
  }

  private checkGameOver(): void {
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === 0) return;
        if (r < this.size - 1 && this.grid[r][c] === this.grid[r + 1][c]) return;
        if (c < this.size - 1 && this.grid[r][c] === this.grid[r][c + 1]) return;
      }
    }
    this.gameOver = true;
    this.ctx.session.setStatus("game-over");
    this.ctx.audio.playExplosion();
  }

  public update(dt: number): void {
    globalParticles.update(dt);
  }

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

    const cellSize = 110;
    const gap = 12;
    const boardWidth = this.size * cellSize + (this.size - 1) * gap;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 10;

    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "#080e08", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardWidth + 16, "rgba(0, 255, 102, 0.4)", false);

    const tileColors: Record<number, { bg: string; text: string }> = {
      2: { bg: "#0f2316", text: "#A3B3A3" },
      4: { bg: "#143320", text: "#00FF66" },
      8: { bg: "#1f4a2e", text: "#00F0FF" },
      16: { bg: "#2a663e", text: "#FFFFFF" },
      32: { bg: "#00FF66", text: "#030604" },
      64: { bg: "#FFB703", text: "#030604" },
      128: { bg: "#F97316", text: "#FFFFFF" },
      256: { bg: "#FF3366", text: "#FFFFFF" },
      512: { bg: "#A855F7", text: "#FFFFFF" },
      1024: { bg: "#00F0FF", text: "#030604" },
      2048: { bg: "#FFFFFF", text: "#00FF66" },
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
          const style = tileColors[val] || { bg: "#FF3366", text: "#FFFFFF" };
          pr.drawPixelBlock(cx, cy, cellSize, style.bg, "#FFFFFF", "rgba(0,0,0,0.5)");
          pr.drawText(val.toString(), cx + cellSize / 2, cy + cellSize / 2 + 10, {
            size: val >= 1024 ? 26 : val >= 128 ? 32 : 36,
            color: style.text,
            align: "center",
          });
        }
      }
    }

    // Render Particles & Text Popups
    globalParticles.render(pr);

    pr.drawText(`SCORE: ${this.score}  •  [← ↑ → ↓ TO SLIDE]`, w / 2, 28, {
      size: 13,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("NO MORE MOVES — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
