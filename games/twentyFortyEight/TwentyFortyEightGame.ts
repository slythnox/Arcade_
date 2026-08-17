import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface AnimatedTile {
  id: number;
  val: number;
  r: number;
  c: number;
  scaleAnim: number;
}

interface TileStyle {
  bgStart: string;
  bgEnd: string;
  text: string;
  glow: string;
  border: string;
}

// Colorful, Saturated Modern Color Scheme
const TILE_STYLES: Record<number, TileStyle> = {
  2: {
    bgStart: "#38BDF8", // Neon Cyan
    bgEnd: "#0284C7",
    text: "#FFFFFF",
    glow: "rgba(56, 189, 248, 0.55)",
    border: "#7DD3FC",
  },
  4: {
    bgStart: "#34D399", // Emerald Mint
    bgEnd: "#059669",
    text: "#FFFFFF",
    glow: "rgba(52, 211, 153, 0.6)",
    border: "#6EE7B7",
  },
  8: {
    bgStart: "#FBBF24", // Solar Amber
    bgEnd: "#D97706",
    text: "#FFFFFF",
    glow: "rgba(251, 191, 36, 0.65)",
    border: "#FDE68A",
  },
  16: {
    bgStart: "#FB7185", // Coral Neon
    bgEnd: "#E11D48",
    text: "#FFFFFF",
    glow: "rgba(251, 113, 133, 0.7)",
    border: "#FECDD3",
  },
  32: {
    bgStart: "#F43F5E", // Hot Ruby
    bgEnd: "#BE123C",
    text: "#FFFFFF",
    glow: "rgba(244, 63, 94, 0.75)",
    border: "#FDA4AF",
  },
  64: {
    bgStart: "#A855F7", // Electric Purple
    bgEnd: "#7E22CE",
    text: "#FFFFFF",
    glow: "rgba(168, 85, 247, 0.8)",
    border: "#D8B4FE",
  },
  128: {
    bgStart: "#818CF8", // Royal Indigo
    bgEnd: "#4338CA",
    text: "#FFFFFF",
    glow: "rgba(129, 140, 248, 0.85)",
    border: "#C7D2FE",
  },
  256: {
    bgStart: "#EC4899", // Neon Hot Pink
    bgEnd: "#BE185D",
    text: "#FFFFFF",
    glow: "rgba(236, 72, 153, 0.9)",
    border: "#FBCFE8",
  },
  512: {
    bgStart: "#A3E635", // Electric Lime
    bgEnd: "#65A30D",
    text: "#0F172A",
    glow: "rgba(163, 230, 53, 0.9)",
    border: "#D9F99D",
  },
  1024: {
    bgStart: "#FACC15", // Ultra Gold
    bgEnd: "#CA8A04",
    text: "#FFFFFF",
    glow: "rgba(250, 204, 21, 0.95)",
    border: "#FEF08A",
  },
  2048: {
    bgStart: "#FFE600", // Prismatic Golden Crown
    bgEnd: "#FF007F",
    text: "#FFFFFF",
    glow: "rgba(255, 230, 0, 1.0)",
    border: "#FFFFFF",
  },
  4096: {
    bgStart: "#00F0FF", // Cosmic Cyan
    bgEnd: "#7000FF",
    text: "#FFFFFF",
    glow: "rgba(0, 240, 255, 1.0)",
    border: "#FFFFFF",
  },
};

export class TwentyFortyEightGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 4;
  private grid: number[][] = [];
  private tiles: AnimatedTile[] = [];
  private nextTileId: number = 1;

  private score: number = 0;
  private bestScore: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    this.tiles = [];
    this.score = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.animTime = 0;

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
      const val = this.ctx.random.next() < 0.9 ? 2 : 4;
      this.grid[cell.r][cell.c] = val;

      this.tiles.push({
        id: this.nextTileId++,
        val,
        r: cell.r,
        c: cell.c,
        scaleAnim: 0.1,
      });
    }
  }

  private move(dir: "UP" | "DOWN" | "LEFT" | "RIGHT"): void {
    if (this.gameOver || this.isPaused) return;

    let moved = false;
    let scoreGained = 0;

    const newGrid: number[][] = Array.from({ length: this.size }, () => Array(this.size).fill(0));
    const mergedGrid: boolean[][] = Array.from({ length: this.size }, () => Array(this.size).fill(false));

    const dr = dir === "UP" ? -1 : dir === "DOWN" ? 1 : 0;
    const dc = dir === "LEFT" ? -1 : dir === "RIGHT" ? 1 : 0;

    const rIndices = dir === "DOWN" ? [3, 2, 1, 0] : [0, 1, 2, 3];
    const cIndices = dir === "RIGHT" ? [3, 2, 1, 0] : [0, 1, 2, 3];

    for (const r of rIndices) {
      for (const c of cIndices) {
        const val = this.grid[r][c];
        if (val === 0) continue;

        let currR = r;
        let currC = c;

        while (true) {
          const nextR = currR + dr;
          const nextC = currC + dc;

          if (nextR < 0 || nextR >= this.size || nextC < 0 || nextC >= this.size) break;

          if (newGrid[nextR][nextC] === 0) {
            currR = nextR;
            currC = nextC;
          } else if (newGrid[nextR][nextC] === val && !mergedGrid[nextR][nextC]) {
            currR = nextR;
            currC = nextC;
            break;
          } else {
            break;
          }
        }

        if (currR !== r || currC !== c) {
          moved = true;
        }

        if (newGrid[currR][currC] === val && !mergedGrid[currR][currC] && (currR !== r || currC !== c)) {
          const mergedVal = val * 2;
          newGrid[currR][currC] = mergedVal;
          mergedGrid[currR][currC] = true;
          scoreGained += mergedVal;

          if (mergedVal === 2048 && !this.isWon) {
            this.isWon = true;
            this.ctx.audio?.playVictory?.();
            globalParticles.emitBurst(300, 350, 50, ["#FFE600", "#FF007F", "#00F0FF", "#FFFFFF"], 100, 320);
          }
        } else {
          newGrid[currR][currC] = val;
        }
      }
    }

    if (moved) {
      this.grid = newGrid;
      this.score += scoreGained;
      if (this.score > this.bestScore) this.bestScore = this.score;

      this.ctx.audio?.playMove?.();

      if (scoreGained > 0) {
        this.ctx.audio?.playCoin?.();
        const style = TILE_STYLES[scoreGained] || { border: "#00F0FF" };
        globalParticles.emitBurst(300, 360, 20, [style.border, "#FFD700", "#FFFFFF"], 60, 200);
        globalParticles.emitText(`+${scoreGained}`, 300, 160, "#FFD700", 22);
      }

      this.rebuildTiles();
      this.spawnTile();
      this.checkGameOver();
    }
  }

  private rebuildTiles(): void {
    this.tiles = [];
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const val = this.grid[r][c];
        if (val > 0) {
          this.tiles.push({
            id: this.nextTileId++,
            val,
            r,
            c,
            scaleAnim: 1.0,
          });
        }
      }
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
    this.ctx.audio?.playExplosion?.();
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    this.animTime += dt;

    for (const t of this.tiles) {
      if (t.scaleAnim < 1.0) {
        t.scaleAnim = Math.min(1.0, t.scaleAnim + dt * 6.5);
      }
    }
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
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Vibrant Cosmic Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#0F172A");   // Deep Navy Slate
      bgGrad.addColorStop(0.5, "#1E1B4B"); // Deep Indigo Purple
      bgGrad.addColorStop(1, "#090D16");   // Midnight
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);

      // Ambient Colored Glow Orbs
      const orbGrad = ctx2d.createRadialGradient(w / 2, 200, 20, w / 2, 200, 320);
      orbGrad.addColorStop(0, "rgba(99, 102, 241, 0.15)");
      orbGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx2d.fillStyle = orbGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#0F172A");
    }

    // 2. Vibrant Header: Glowing Title & Neon Glass Score Cards
    pr.drawText("2048", 56, 42, {
      size: 52,
      color: "#38BDF8",
      font: "system-ui, -apple-system, sans-serif",
    });

    if (ctx2d) {
      // Score Card
      const scoreX = w - 215;
      ctx2d.save();
      ctx2d.fillStyle = "rgba(30, 41, 59, 0.85)";
      ctx2d.strokeStyle = "#38BDF8";
      ctx2d.lineWidth = 1.5;
      ctx2d.shadowColor = "rgba(56, 189, 248, 0.4)";
      ctx2d.shadowBlur = 10;
      ctx2d.beginPath();
      ctx2d.roundRect(scoreX, 16, 92, 56, 8);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();

      pr.drawText("SCORE", scoreX + 46, 32, { size: 11, color: "#94A3B8", align: "center", font: "monospace" });
      pr.drawText(this.score.toString(), scoreX + 46, 56, { size: 21, color: "#38BDF8", align: "center" });

      // Best Card
      const bestX = w - 110;
      ctx2d.save();
      ctx2d.fillStyle = "rgba(30, 41, 59, 0.85)";
      ctx2d.strokeStyle = "#FBBF24";
      ctx2d.lineWidth = 1.5;
      ctx2d.shadowColor = "rgba(251, 191, 36, 0.4)";
      ctx2d.shadowBlur = 10;
      ctx2d.beginPath();
      ctx2d.roundRect(bestX, 16, 92, 56, 8);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();

      pr.drawText("BEST", bestX + 46, 32, { size: 11, color: "#94A3B8", align: "center", font: "monospace" });
      pr.drawText(this.bestScore.toString(), bestX + 46, 56, { size: 21, color: "#FBBF24", align: "center" });
    }

    // 3. Matrix Board Geometry
    const cellSize = 108;
    const gap = 14;
    const boardWidth = this.size * cellSize + (this.size + 1) * gap;
    const offX = (w - boardWidth) / 2;
    const offY = 96;

    // Vibrant Glass Board Base
    if (ctx2d) {
      ctx2d.save();
      ctx2d.fillStyle = "rgba(15, 23, 42, 0.9)";
      ctx2d.strokeStyle = "rgba(99, 102, 241, 0.4)";
      ctx2d.lineWidth = 2;
      ctx2d.shadowColor = "rgba(99, 102, 241, 0.25)";
      ctx2d.shadowBlur = 24;
      ctx2d.beginPath();
      ctx2d.roundRect(offX, offY, boardWidth, boardWidth, 14);
      ctx2d.fill();
      ctx2d.stroke();
      ctx2d.restore();
    }

    // Empty Cell Slots (Recessed Dark Blue Glass)
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cx = offX + gap + c * (cellSize + gap);
        const cy = offY + gap + r * (cellSize + gap);

        if (ctx2d) {
          ctx2d.fillStyle = "rgba(30, 41, 59, 0.55)";
          ctx2d.beginPath();
          ctx2d.roundRect(cx, cy, cellSize, cellSize, 10);
          ctx2d.fill();

          ctx2d.strokeStyle = "rgba(51, 65, 85, 0.5)";
          ctx2d.lineWidth = 1.5;
          ctx2d.stroke();
        }
      }
    }

    // 4. Render Active Colorful Tiles with Vivid Neon Halos & Gradient Fill
    for (const t of this.tiles) {
      const cx = offX + gap + t.c * (cellSize + gap);
      const cy = offY + gap + t.r * (cellSize + gap);
      const style = TILE_STYLES[t.val] || {
        bgStart: "#EC4899",
        bgEnd: "#8B5CF6",
        text: "#FFFFFF",
        glow: "rgba(236, 72, 153, 0.8)",
        border: "#F472B6",
      };

      const scale = t.scaleAnim;
      const drawSize = cellSize * scale;
      const drawX = cx + (cellSize - drawSize) / 2;
      const drawY = cy + (cellSize - drawSize) / 2;

      if (ctx2d) {
        ctx2d.save();

        // Neon Glow Halo
        ctx2d.shadowColor = style.glow;
        ctx2d.shadowBlur = t.val >= 1024 ? 26 : 16;
        ctx2d.shadowOffsetY = 2;

        // Vivid Linear Gradient
        const tileGrad = ctx2d.createLinearGradient(drawX, drawY, drawX, drawY + drawSize);
        tileGrad.addColorStop(0, style.bgStart);
        tileGrad.addColorStop(1, style.bgEnd);
        ctx2d.fillStyle = tileGrad;

        ctx2d.beginPath();
        ctx2d.roundRect(drawX, drawY, drawSize, drawSize, 10 * scale);
        ctx2d.fill();

        // Glowing Border Rim
        ctx2d.strokeStyle = style.border;
        ctx2d.lineWidth = 2.5 * scale;
        ctx2d.stroke();

        // Animated Sheen for 2048 Tile
        if (t.val >= 2048) {
          const glintPos = ((this.animTime * 0.7) % 1.5) - 0.25;
          const glintGrad = ctx2d.createLinearGradient(
            drawX + glintPos * drawSize - 20,
            drawY,
            drawX + glintPos * drawSize + 20,
            drawY + drawSize
          );
          glintGrad.addColorStop(0, "rgba(255, 255, 255, 0)");
          glintGrad.addColorStop(0.5, "rgba(255, 255, 255, 0.6)");
          glintGrad.addColorStop(1, "rgba(255, 255, 255, 0)");

          ctx2d.fillStyle = glintGrad;
          ctx2d.beginPath();
          ctx2d.roundRect(drawX, drawY, drawSize, drawSize, 10 * scale);
          ctx2d.fill();
        }

        ctx2d.restore();
      }

      // Crisp Number Typography
      let fontSize = 46;
      if (t.val >= 100 && t.val < 1000) fontSize = 38;
      if (t.val >= 1000 && t.val < 10000) fontSize = 30;
      if (t.val >= 10000) fontSize = 24;

      fontSize = Math.round(fontSize * scale);

      pr.drawText(t.val.toString(), cx + cellSize / 2, cy + cellSize / 2 + fontSize / 3.2, {
        size: fontSize,
        color: style.text,
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
    }

    // 5. Render Particle Sparks & Text Popups
    globalParticles.render(pr);

    // 6. Sub-board Instructions
    pr.drawText("Join the matching colors to reach the 2048 tile!", offX, offY + boardWidth + 34, {
      size: 15.5,
      color: "#94A3B8",
      font: "system-ui, -apple-system, sans-serif",
    });

    pr.drawText("HOW TO PLAY: Use Arrow Keys or WASD to slide matching tiles.", offX, offY + boardWidth + 60, {
      size: 13,
      color: "#64748B",
      font: "monospace",
    });

    // 7. Victory / Game Over Overlay
    if (this.gameOver || this.isWon) {
      if (ctx2d) {
        ctx2d.save();
        ctx2d.fillStyle = this.isWon ? "rgba(15, 23, 42, 0.92)" : "rgba(15, 23, 42, 0.92)";
        ctx2d.strokeStyle = this.isWon ? "#FBBF24" : "#EF4444";
        ctx2d.lineWidth = 2;
        ctx2d.beginPath();
        ctx2d.roundRect(offX, offY, boardWidth, boardWidth, 14);
        ctx2d.fill();
        ctx2d.stroke();
        ctx2d.restore();
      }

      const msg = this.isWon ? "YOU WIN!" : "GAME OVER!";
      const c = this.isWon ? "#FBBF24" : "#EF4444";

      pr.drawText(msg, offX + boardWidth / 2, offY + boardWidth / 2 - 24, {
        size: 52,
        color: c,
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });

      pr.drawText("PRESS [R] TO PLAY AGAIN", offX + boardWidth / 2, offY + boardWidth / 2 + 32, {
        size: 16,
        color: "#94A3B8",
        align: "center",
        font: "monospace",
      });
    }
  }
}
