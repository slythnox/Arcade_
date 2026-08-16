import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

const TILE_COLORS: Record<number, {bg: string, text: string}> = {
  2:    {bg: '#eee4da', text: '#776e65'},
  4:    {bg: '#ede0c8', text: '#776e65'},
  8:    {bg: '#f2b179', text: '#ffffff'},
  16:   {bg: '#f59563', text: '#ffffff'},
  32:   {bg: '#f67c5f', text: '#ffffff'},
  64:   {bg: '#f65e3b', text: '#ffffff'},
  128:  {bg: '#edcf72', text: '#ffffff'},
  256:  {bg: '#edcc61', text: '#ffffff'},
  512:  {bg: '#edc850', text: '#ffffff'},
  1024: {bg: '#edc53f', text: '#ffffff'},
  2048: {bg: '#edc22e', text: '#ffffff'},
};

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
      if (this.score > this.bestScore) this.bestScore = this.score;
      this.ctx.audio.playMove();
      if (addedScore > 0) {
        globalParticles.emitBurst(300, 350, 16, ["#f2b179", "#f59563", "#edc22e", "#ffffff"], 70, 220);
        globalParticles.emitText(`+${addedScore}`, 300, 150, "#edc22e", 20);
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
    const rawCtx = pr.getContext();
    pr.clear("#faf8ef");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Top Header
    pr.drawText("2048", 56, 50, { size: 48, color: "#776e65" });
    
    rawCtx.fillStyle = "#bbada0";
    rawCtx.beginPath();
    rawCtx.roundRect(w - 220, 20, 90, 50, 5);
    rawCtx.fill();
    pr.drawText("SCORE", w - 175, 40, { size: 12, color: "#eee4da", align: "center" });
    pr.drawText(this.score.toString(), w - 175, 60, { size: 20, color: "#ffffff", align: "center" });

    rawCtx.beginPath();
    rawCtx.roundRect(w - 110, 20, 90, 50, 5);
    rawCtx.fill();
    pr.drawText("BEST", w - 65, 40, { size: 12, color: "#eee4da", align: "center" });
    pr.drawText(this.bestScore.toString(), w - 65, 60, { size: 20, color: "#ffffff", align: "center" });

    const cellSize = 110;
    const gap = 12;
    const boardWidth = this.size * cellSize + (this.size + 1) * gap;
    const offX = 56;
    const offY = 106;

    // Board Background
    rawCtx.fillStyle = "#bbada0";
    rawCtx.beginPath();
    rawCtx.roundRect(offX, offY, boardWidth, boardWidth, 10);
    rawCtx.fill();

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        const cx = offX + gap + c * (cellSize + gap);
        const cy = offY + gap + r * (cellSize + gap);

        rawCtx.beginPath();
        rawCtx.roundRect(cx, cy, cellSize, cellSize, 8);
        if (val === 0) {
          rawCtx.fillStyle = "rgba(238, 228, 218, 0.35)";
          rawCtx.fill();
        } else {
          const style = TILE_COLORS[val] || { bg: "#3c3a32", text: "#f9f6f2" };
          rawCtx.fillStyle = style.bg;
          rawCtx.fill();
          
          let fontSize = 48;
          if (val >= 100 && val < 1000) fontSize = 40;
          if (val >= 1000) fontSize = 32;
          
          pr.drawText(val.toString(), cx + cellSize / 2, cy + cellSize / 2 + (fontSize/3), {
            size: fontSize,
            color: style.text,
            align: "center",
          });
        }
      }
    }

    // Render Particles & Text Popups
    globalParticles.render(pr);

    pr.drawText("Join the numbers and get to the 2048 tile!", 56, offY + boardWidth + 30, {
      size: 16,
      color: "#776e65",
    });
    pr.drawText("HOW TO PLAY: Use Arrow Keys to move tiles.", 56, offY + boardWidth + 55, {
      size: 14,
      color: "#776e65",
    });

    if (this.gameOver || this.isWon) {
      rawCtx.fillStyle = "rgba(238, 228, 218, 0.73)";
      rawCtx.beginPath();
      rawCtx.roundRect(offX, offY, boardWidth, boardWidth, 10);
      rawCtx.fill();
      
      const msg = this.isWon ? "You win!" : "Game over!";
      const c = this.isWon ? "#f67c5f" : "#776e65";
      pr.drawText(msg, offX + boardWidth/2, offY + boardWidth/2 - 20, { size: 48, color: c, align: "center" });
      pr.drawText("PRESS RESTART", offX + boardWidth/2, offY + boardWidth/2 + 30, { size: 24, color: "#776e65", align: "center" });
    }
  }
}
