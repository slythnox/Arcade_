import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { globalParticles } from "../../engine/particles/ParticleSystem";

export class SlidingPuzzleGame implements GameInstance {
  private ctx!: GameContext;
  private size: number = 4;
  private grid: number[][] = [];
  private emptyPos: GridCoord = { col: 3, row: 3 };
  private cursor: GridCoord = { col: 3, row: 3 };
  private moves: number = 0;
  private score: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  private inMenu: boolean = true;
  private gridSizes: number[] = [3, 4, 5];
  private selectedSizeIdx: number = 1;
  private bestMoves: Record<number, number> = { 3: Infinity, 4: Infinity, 5: Infinity };

  private animating: { fromR: number, fromC: number, toR: number, toC: number, val: number, progress: number } | null = null;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.inMenu = true;
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    if (this.inMenu) return;

    this.size = this.gridSizes[this.selectedSizeIdx];
    this.moves = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.cursor = { col: this.size - 1, row: this.size - 1 };
    this.animating = null;

    let count = 1;
    this.grid = Array.from({ length: this.size }, (_, r) =>
      Array.from({ length: this.size }, (_, c) => {
        if (r === this.size - 1 && c === this.size - 1) return 0;
        return count++;
      })
    );
    this.emptyPos = { col: this.size - 1, row: this.size - 1 };

    const shuffleSteps = this.size * this.size * 5;
    for (let i = 0; i < shuffleSteps; i++) {
      const neighbors: GridCoord[] = [];
      const { col, row } = this.emptyPos;
      if (row > 0) neighbors.push({ col, row: row - 1 });
      if (row < this.size - 1) neighbors.push({ col, row: row + 1 });
      if (col > 0) neighbors.push({ col: col - 1, row });
      if (col < this.size - 1) neighbors.push({ col: col + 1, row });

      const pick = neighbors[Math.floor(this.ctx.random.next() * neighbors.length)];
      this.grid[this.emptyPos.row][this.emptyPos.col] = this.grid[pick.row][pick.col];
      this.grid[pick.row][pick.col] = 0;
      this.emptyPos = pick;
    }
  }

  private trySlide(coord: GridCoord): void {
    if (this.animating) return; // wait for animation
    const dRow = Math.abs(coord.row - this.emptyPos.row);
    const dCol = Math.abs(coord.col - this.emptyPos.col);

    if (dRow + dCol === 1) {
      const val = this.grid[coord.row][coord.col];
      this.animating = {
        fromR: coord.row, fromC: coord.col,
        toR: this.emptyPos.row, toC: this.emptyPos.col,
        val: val,
        progress: 0
      };
      
      this.grid[this.emptyPos.row][this.emptyPos.col] = val;
      this.grid[coord.row][coord.col] = 0;
      this.emptyPos = { ...coord };
      this.moves++;
      this.ctx.audio.playMove();
    } else {
      this.ctx.audio.playLaser();
    }
  }

  private checkWin(): void {
    let expected = 1;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (r === this.size - 1 && c === this.size - 1) {
          if (this.grid[r][c] !== 0) return;
        } else {
          if (this.grid[r][c] !== expected++) return;
        }
      }
    }

    this.isWon = true;
    if (this.moves < this.bestMoves[this.size]) {
      this.bestMoves[this.size] = this.moves;
    }
    this.score = Math.max(500, 3000 - this.moves * 25);
    this.ctx.session.setStatus("ready");
    this.ctx.audio.playVictory();
    
    globalParticles.emitBurst(300, 350, 40, ["#FFB703", "#00FF66", "#00F0FF", "#FF3366"], 100, 300);
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.animating) {
      this.animating.progress += dt * 8;
      if (this.animating.progress >= 1) {
        this.animating = null;
        this.checkWin();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.inMenu) {
      if (action === "MOVE_LEFT") {
        this.selectedSizeIdx = Math.max(0, this.selectedSizeIdx - 1);
        this.ctx.audio.playMove();
      } else if (action === "MOVE_RIGHT") {
        this.selectedSizeIdx = Math.min(this.gridSizes.length - 1, this.selectedSizeIdx + 1);
        this.ctx.audio.playMove();
      } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
        this.inMenu = false;
        this.reset();
        this.ctx.audio.playPowerUp();
      }
      return;
    }

    if (this.isWon) {
      if (action === "RESTART") {
        this.inMenu = true;
        this.ctx.session.setStatus("running");
      }
      return;
    }

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
        this.ctx.audio.playMove();
        break;
      case "ACTION_PRIMARY":
      case "CONFIRM":
        this.trySlide(this.cursor);
        break;
      case "RESTART":
        this.inMenu = true;
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.size; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    pr.clear("#0a0a14");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    if (this.inMenu) {
      pr.drawText("SLIDING PUZZLE", w / 2, 200, { size: 48, color: "#fff", align: "center", shadowBlur: 10, shadowColor: "#00F0FF" });
      pr.drawText("SELECT GRID SIZE", w / 2, 300, { size: 20, color: "#aaa", align: "center" });

      for (let i = 0; i < this.gridSizes.length; i++) {
        const size = this.gridSizes[i];
        const isSelected = i === this.selectedSizeIdx;
        const x = w / 2 - 120 + i * 120;
        const y = 380;
        
        pr.drawRect(x - 40, y - 40, 80, 80, isSelected ? "#00F0FF" : "#222", true);
        if (isSelected) pr.drawRect(x - 42, y - 42, 84, 84, "#fff", false);
        
        pr.drawText(`${size}x${size}`, x, y + 10, { size: 24, color: isSelected ? "#000" : "#fff", align: "center" });
        
        const best = this.bestMoves[size];
        if (best !== Infinity) {
          pr.drawText(`BEST: ${best}`, x, y + 60, { size: 12, color: "#00FF66", align: "center" });
        }
      }
      
      pr.drawText("PRESS SPACE TO START", w / 2, 550, { size: 24, color: "#00FF66", align: "center" });
      return;
    }

    const availableWidth = 480;
    const cellSize = availableWidth / this.size;
    const boardWidth = availableWidth;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 20;

    // Board background
    pr.drawRect(offX - 10, offY - 10, boardWidth + 20, boardWidth + 20, "#1a1a2e", true);
    pr.drawRect(offX - 10, offY - 10, boardWidth + 20, boardWidth + 20, "#00F0FF", false);

    // Draw grid
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        // Skip rendering the animated tile from grid
        if (this.animating && r === this.animating.toR && c === this.animating.toC) continue;
        
        const val = this.grid[r][c];
        if (val === 0) continue;

        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        this.drawTile(pr, rawCtx, val, cx, cy, cellSize);
      }
    }

    // Render animated tile
    if (this.animating) {
      const { fromR, fromC, toR, toC, val, progress } = this.animating;
      // easeInOut effect
      const p = progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      
      const startX = offX + fromC * cellSize;
      const startY = offY + fromR * cellSize;
      const endX = offX + toC * cellSize;
      const endY = offY + toR * cellSize;
      
      const cx = startX + (endX - startX) * p;
      const cy = startY + (endY - startY) * p;
      
      this.drawTile(pr, rawCtx, val, cx, cy, cellSize);
    }

    // Cursor
    if (!this.isWon) {
      pr.drawRect(offX + this.cursor.col * cellSize, offY + this.cursor.row * cellSize, cellSize, cellSize, "rgba(0, 240, 255, 0.5)", false);
      pr.drawRect(offX + this.cursor.col * cellSize + 2, offY + this.cursor.row * cellSize + 2, cellSize - 4, cellSize - 4, "#00F0FF", false);
    }

    globalParticles.render(pr);

    pr.drawText(`MOVES: ${this.moves}`, 30, 40, { size: 20, color: "#fff" });
    const best = this.bestMoves[this.size];
    if (best !== Infinity) {
      pr.drawText(`BEST: ${best}`, w - 120, 40, { size: 20, color: "#00FF66" });
    }

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(26,26,46,0.9)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("PUZZLE SOLVED!", w / 2, h / 2 - 10, { size: 36, color: "#00FF66", align: "center", shadowBlur: 10, shadowColor: "#00FF66" });
      pr.drawText("PRESS R TO CONTINUE", w / 2, h / 2 + 25, { size: 16, color: "#fff", align: "center" });
    } else {
      pr.drawText("ARROWS TO MOVE, SPACE TO SLIDE", w / 2, h - 30, { size: 14, color: "#888", align: "center" });
    }
  }

  private drawTile(pr: PixelRenderer, rawCtx: CanvasRenderingContext2D, val: number, cx: number, cy: number, cellSize: number) {
    const isCorrect = val === Math.floor((val - 1) / this.size) * this.size + (val - 1) % this.size + 1;
    const padding = 2;
    const size = cellSize - padding * 2;
    const x = cx + padding;
    const y = cy + padding;
    
    const bg = isCorrect ? "#00b34a" : "#2a2a40";
    const light = isCorrect ? "#00ff66" : "#3e3e5c";
    const dark = isCorrect ? "#00662a" : "#151520";
    
    pr.drawPixelBlock(x, y, size, bg, light, dark);
    
    pr.drawText(val.toString(), x + size / 2, y + size / 2 + size * 0.15, {
      size: size * 0.4,
      color: "#fff",
      align: "center",
      font: "bold"
    });
  }
}
