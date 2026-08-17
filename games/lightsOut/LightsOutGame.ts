import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { globalParticles } from "../../engine/particles/ParticleSystem";

export class LightsOutGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 5;
  private grid: boolean[][] = [];
  private cursor: GridCoord = { col: 2, row: 2 };
  private moves: number = 0;
  private score: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.isWon || this.isPaused) return;

      const target = e.target as HTMLElement;
      if (target && target.tagName === "CANVAS") {
        const rect = target.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 700 / rect.height;
        const clickX = (e.clientX - rect.left) * scaleX;
        const clickY = (e.clientY - rect.top) * scaleY;

        const cellSize = 84;
        const gap = 12;
        const boardWidth = this.size * cellSize + (this.size - 1) * gap;
        const offX = Math.floor((600 - boardWidth) / 2);
        const offY = Math.floor((700 - boardWidth) / 2) + 20;

        for (let r = 0; r < this.size; r++) {
          for (let c = 0; c < this.size; c++) {
            const cx = offX + c * (cellSize + gap);
            const cy = offY + r * (cellSize + gap);

            if (clickX >= cx && clickX <= cx + cellSize && clickY >= cy && clickY <= cy + cellSize) {
              this.cursor = { row: r, col: c };
              this.toggleCell(r, c, true);
              return;
            }
          }
        }
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 2 };
    this.moves = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.animTime = 0;
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(false));

    // Generate solvable state by simulating 8 random valid clicks
    const pressCount = 8;
    for (let i = 0; i < pressCount; i++) {
      const r = Math.floor(this.ctx.random.next() * this.size);
      const c = Math.floor(this.ctx.random.next() * this.size);
      this.toggleCell(r, c, false);
    }
  }

  private toggleCell(row: number, col: number, playSound: boolean = true): void {
    const coords = [
      { r: row, c: col },
      { r: row - 1, c: col },
      { r: row + 1, c: col },
      { r: row, c: col - 1 },
      { r: row, c: col + 1 },
    ];

    for (const { r, c } of coords) {
      if (r >= 0 && r < this.size && c >= 0 && c < this.size) {
        this.grid[r][c] = !this.grid[r][c];
      }
    }

    if (playSound) {
      this.moves++;
      this.ctx.audio?.playRotate?.();

      const cellSize = 84;
      const gap = 12;
      const boardWidth = this.size * cellSize + (this.size - 1) * gap;
      const offX = Math.floor((600 - boardWidth) / 2);
      const offY = Math.floor((700 - boardWidth) / 2) + 20;
      const cx = offX + col * (cellSize + gap) + cellSize / 2;
      const cy = offY + row * (cellSize + gap) + cellSize / 2;

      globalParticles.emitBurst(cx, cy, 14, ["#FFD84D", "#FFFFFF", "#F59E0B"], 50, 160);
      this.checkWin();
    }
  }

  private checkWin(): void {
    const anyOn = this.grid.some((row) => row.some((v) => v));
    if (!anyOn && !this.isWon) {
      this.isWon = true;
      this.score = Math.max(500, 3500 - this.moves * 110);
      this.ctx.session.setStatus("ready");
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 350, 45, ["#FFD84D", "#38BDF8", "#FFFFFF"], 80, 260);
      globalParticles.emitText("GRID DEACTIVATED!", 300, 130, "#FFD84D", 22);
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    this.animTime += dt;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio?.playMove?.();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.size - 1, this.cursor.row + 1);
        this.ctx.audio?.playMove?.();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio?.playMove?.();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.size - 1, this.cursor.col + 1);
        this.ctx.audio?.playMove?.();
        break;
      case "ACTION_PRIMARY":
      case "ROTATE":
      case "CONFIRM":
        if (!this.isWon) {
          this.toggleCell(this.cursor.row, this.cursor.col, true);
        }
        break;
      case "RESTART":
        this.reset();
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerDown && typeof window !== "undefined") {
      window.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Dark Tactile Slate Grid Background
    pr.clear("#080D1A");

    // Pixel Grid Texture
    pr.drawGrid(12, 14, 48, "rgba(56, 189, 248, 0.04)", 12, 12);

    // 2. Header HUD Cards (Pixel Arcade Style)
    pr.drawRect(20, 16, 210, 48, "#10192E", true);
    pr.drawRect(20, 16, 210, 48, "#1E2E4E", false);
    pr.drawText("LIGHTS OUT", 32, 45, {
      size: 20,
      color: "#FFD84D",
      font: "monospace",
    });

    const movesX = w - 170;
    pr.drawRect(movesX, 16, 150, 48, "#10192E", true);
    pr.drawRect(movesX, 16, 150, 48, "#1E2E4E", false);
    pr.drawText("MOVES:", movesX + 16, 44, { size: 13, color: "#94A3B8", font: "monospace" });
    pr.drawText(this.moves.toString(), movesX + 115, 45, { size: 20, color: "#38BDF8", align: "center", font: "monospace" });

    // 3. Matrix Board Geometry
    const cellSize = 84;
    const gap = 12;
    const boardWidth = this.size * cellSize + (this.size - 1) * gap;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 20;

    // Outer Pixel Chassis Housing
    pr.drawRect(offX - 10, offY - 10, boardWidth + 20, boardWidth + 20, "#0E1524", true);
    pr.drawRect(offX - 10, offY - 10, boardWidth + 20, boardWidth + 20, "#1E2A44", false);
    pr.drawRect(offX - 14, offY - 14, boardWidth + 28, boardWidth + 28, "#2E3F66", false);

    // 4. Render Pixel-Art Light Push-Buttons (Warm Amber & Slate Palette)
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const isOn = this.grid[r][c];
        const cx = offX + c * (cellSize + gap);
        const cy = offY + r * (cellSize + gap);

        if (isOn) {
          // Illuminated Warm Golden Amber Pixel Block
          pr.drawPixelBlock(cx, cy, cellSize, "#F59E0B", "#FEF08A", "#B45309");

          // Inner Glowing Core
          pr.drawRect(cx + 10, cy + 10, cellSize - 20, cellSize - 20, "#FBBF24", true);
          pr.drawRect(cx + 18, cy + 18, cellSize - 36, cellSize - 36, "#FEF08A", true);

          // Center Light Filament Pixel Cross
          const midX = cx + cellSize / 2;
          const midY = cy + cellSize / 2;
          pr.drawRect(midX - 6, midY - 6, 12, 12, "#FFFFFF", true);
          pr.drawRect(midX - 14, midY - 2, 28, 4, "#FFFFFF", true);
          pr.drawRect(midX - 2, midY - 14, 4, 28, "#FFFFFF", true);

          // Subtle Outer Glow Ring
          pr.drawRect(cx - 2, cy - 2, cellSize + 4, cellSize + 4, "rgba(251, 191, 36, 0.4)", false);
        } else {
          // Deactivated Stepped Dark Slate Pixel Block
          pr.drawPixelBlock(cx, cy, cellSize, "#151F33", "#223354", "#0A101C");

          // Inset Dim Cavity
          pr.drawRect(cx + 10, cy + 10, cellSize - 20, cellSize - 20, "#0E1524", true);
          pr.drawRect(cx + 10, cy + 10, cellSize - 20, cellSize - 20, "#1A253C", false);

          // Center Dim Filament Stud
          const midX = cx + cellSize / 2;
          const midY = cy + cellSize / 2;
          pr.drawRect(midX - 4, midY - 4, 8, 8, "#253556", true);
          pr.drawRect(midX - 1, midY - 1, 2, 2, "#475569", true);
        }

        // Animated Pixel Cursor Frame
        if (this.cursor.col === c && this.cursor.row === r) {
          const p = Math.sin(this.animTime * 8) > 0 ? 3 : 2;
          pr.drawRect(cx - p, cy - p, cellSize + p * 2, cellSize + p * 2, "#38BDF8", false);
          pr.drawRect(cx - p - 1, cy - p - 1, cellSize + p * 2 + 2, cellSize + p * 2 + 2, "#FFFFFF", false);
        }
      }
    }

    // 5. Particles
    globalParticles.render(pr);

    // 6. Sub-Board Instructions (Pixel Arcade Font)
    pr.drawText("DEACTIVATE ALL LIGHTS TO CLEAR MATRIX", w / 2, offY + boardWidth + 28, {
      size: 13,
      color: "#94A3B8",
      align: "center",
      font: "monospace",
    });

    pr.drawText("[ARROW KEYS / WASD / CLICK TO TOGGLE  •  R: RESET]", w / 2, offY + boardWidth + 50, {
      size: 11,
      color: "#64748B",
      align: "center",
      font: "monospace",
    });

    // 7. Victory Overlay
    if (this.isWon) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 13, 26, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#FFD84D", false);
      pr.drawText("GRID CLEARED — VICTORY!", w / 2, h / 2 - 12, {
        size: 22,
        color: "#FFD84D",
        align: "center",
        font: "monospace",
      });
      pr.drawText(`MOVES: ${this.moves}  •  PRESS [R] TO PLAY AGAIN`, w / 2, h / 2 + 18, {
        size: 12,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      });
    }
  }
}
