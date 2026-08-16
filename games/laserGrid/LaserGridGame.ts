import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { globalParticles } from "../../engine/particles/ParticleSystem";

type MirrorType = "none" | "slash" | "backslash" | "target" | "emitter" | "block";

interface LaserCell {
  col: number;
  row: number;
  type: MirrorType;
  illuminated: boolean;
}

interface LevelDef {
  emitter: { col: number; row: number; dirX: number; dirY: number };
  targets: { col: number; row: number }[];
  mirrors: { col: number; row: number; initialType: "slash" | "backslash" }[];
  blocks?: { col: number; row: number }[];
}

const LEVELS: LevelDef[] = [
  // Level 1: 1 Target, 1 Mirror (Starts MISALIGNED as slash so beam misses target until player clicks to rotate!)
  {
    emitter: { col: 0, row: 1, dirX: 1, dirY: 0 },
    targets: [{ col: 4, row: 5 }],
    mirrors: [{ col: 4, row: 1, initialType: "slash" }], // Needed: backslash
  },
  // Level 2: 1 Target, 2 Mirrors (Both start misaligned)
  {
    emitter: { col: 0, row: 0, dirX: 1, dirY: 0 },
    targets: [{ col: 1, row: 5 }],
    mirrors: [
      { col: 5, row: 0, initialType: "backslash" }, // Needed: slash
      { col: 5, row: 5, initialType: "slash" },     // Needed: backslash
    ],
  },
  // Level 3: 2 Targets, 3 Mirrors
  {
    emitter: { col: 0, row: 1, dirX: 1, dirY: 0 },
    targets: [{ col: 2, row: 1 }, { col: 5, row: 4 }],
    mirrors: [
      { col: 4, row: 1, initialType: "backslash" },
      { col: 4, row: 4, initialType: "slash" },
      { col: 1, row: 4, initialType: "backslash" },
    ],
  },
  // Level 4: 2 Targets, 4 Mirrors zig-zag
  {
    emitter: { col: 0, row: 2, dirX: 1, dirY: 0 },
    targets: [{ col: 5, row: 0 }, { col: 0, row: 4 }],
    mirrors: [
      { col: 3, row: 2, initialType: "slash" },
      { col: 3, row: 0, initialType: "backslash" },
      { col: 3, row: 4, initialType: "slash" },
      { col: 5, row: 2, initialType: "backslash" },
    ],
  },
  // Level 5: Obstacle Blocks
  {
    emitter: { col: 0, row: 0, dirX: 1, dirY: 0 },
    targets: [{ col: 5, row: 5 }, { col: 2, row: 3 }],
    mirrors: [
      { col: 4, row: 0, initialType: "slash" },
      { col: 4, row: 3, initialType: "backslash" },
      { col: 1, row: 3, initialType: "slash" },
      { col: 1, row: 5, initialType: "backslash" },
    ],
    blocks: [{ col: 2, row: 0 }, { col: 3, row: 5 }],
  },
  // Level 6: 3 Targets
  {
    emitter: { col: 0, row: 1, dirX: 1, dirY: 0 },
    targets: [{ col: 2, row: 1 }, { col: 4, row: 3 }, { col: 1, row: 5 }],
    mirrors: [
      { col: 5, row: 1, initialType: "backslash" },
      { col: 5, row: 3, initialType: "slash" },
      { col: 3, row: 3, initialType: "backslash" },
      { col: 3, row: 5, initialType: "slash" },
    ],
  },
  // Level 7: Reflexive Loop
  {
    emitter: { col: 0, row: 2, dirX: 1, dirY: 0 },
    targets: [{ col: 4, row: 1 }, { col: 4, row: 5 }, { col: 1, row: 4 }],
    mirrors: [
      { col: 5, row: 2, initialType: "backslash" },
      { col: 5, row: 1, initialType: "slash" },
      { col: 2, row: 1, initialType: "backslash" },
      { col: 2, row: 5, initialType: "slash" },
      { col: 5, row: 5, initialType: "backslash" },
    ],
  },
  // Level 8: Master Circuit
  {
    emitter: { col: 0, row: 0, dirX: 1, dirY: 0 },
    targets: [{ col: 5, row: 1 }, { col: 2, row: 4 }, { col: 0, row: 5 }],
    mirrors: [
      { col: 3, row: 0, initialType: "slash" },
      { col: 3, row: 1, initialType: "backslash" },
      { col: 5, row: 4, initialType: "slash" },
      { col: 2, row: 5, initialType: "backslash" },
      { col: 4, row: 5, initialType: "slash" },
    ],
    blocks: [{ col: 1, row: 1 }, { col: 4, row: 2 }],
  },
];

export class LaserGridGame implements GameInstance {
  private ctx!: GameContext;
  private cols: number = 6;
  private rows: number = 6;
  private grid: LaserCell[][] = [];

  private emitter = { col: 0, row: 0, dirX: 1, dirY: 0 };
  private targets: { col: number; row: number; lit: boolean }[] = [];
  private laserSegments: { x1: number; y1: number; x2: number; y2: number }[] = [];

  private cursor: GridCoord = { col: 2, row: 2 };
  private level: number = 1;
  private score: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  constructor() {}

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachMouseHandlers();
  }

  private attachMouseHandlers(): void {
    const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
    if (!canvas) return;

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.isPaused || this.gameOver || this.isWon) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const canvasX = (e.clientX - rect.left) * scaleX;
      const canvasY = (e.clientY - rect.top) * scaleY;

      const cellSize = 88;
      const boardWidth = this.cols * cellSize;
      const boardHeight = this.rows * cellSize;
      const offX = Math.floor((canvas.width - boardWidth) / 2);
      const offY = Math.floor((canvas.height - boardHeight) / 2) + 16;

      const col = Math.floor((canvasX - offX) / cellSize);
      const row = Math.floor((canvasY - offY) / cellSize);

      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        this.cursor = { col, row };
        this.rotateMirror(col, row);
      }
    };

    canvas.addEventListener("pointerdown", this.boundPointerDown);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.level = 1;
    this.score = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.loadLevel(this.level);
  }

  private loadLevel(lvl: number): void {
    const lIdx = (lvl - 1) % LEVELS.length;
    const def = LEVELS[lIdx];

    this.emitter = { ...def.emitter };
    this.targets = def.targets.map((t) => ({ col: t.col, row: t.row, lit: false }));

    // Initialize grid cells
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const rowCells: LaserCell[] = [];
      for (let c = 0; c < this.cols; c++) {
        rowCells.push({ col: c, row: r, type: "none", illuminated: false });
      }
      this.grid.push(rowCells);
    }

    // Set emitter
    this.grid[this.emitter.row][this.emitter.col].type = "emitter";

    // Set targets
    for (const t of this.targets) {
      this.grid[t.row][t.col].type = "target";
    }

    // Set obstacle blocks
    if (def.blocks) {
      for (const b of def.blocks) {
        this.grid[b.row][b.col].type = "block";
      }
    }

    // Set mirrors with initial MISALIGNED types
    for (const m of def.mirrors) {
      this.grid[m.row][m.col].type = m.initialType;
    }

    this.recalculateLaser();
  }

  private rotateMirror(col: number, row: number): void {
    const cell = this.grid[row][col];
    if (cell.type === "slash") {
      cell.type = "backslash";
      this.ctx.audio?.playRotate?.();
      this.recalculateLaser();
    } else if (cell.type === "backslash") {
      cell.type = "slash";
      this.ctx.audio?.playRotate?.();
      this.recalculateLaser();
    }
  }

  private recalculateLaser(): void {
    this.laserSegments = [];
    for (const t of this.targets) t.lit = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].illuminated = false;
      }
    }

    const cellSize = 88;
    const offX = Math.floor((600 - this.cols * cellSize) / 2);
    const offY = Math.floor((700 - this.rows * cellSize) / 2) + 16;

    let curCol = this.emitter.col;
    let curRow = this.emitter.row;
    let dirX = this.emitter.dirX;
    let dirY = this.emitter.dirY;

    let startX = offX + curCol * cellSize + cellSize / 2;
    let startY = offY + curRow * cellSize + cellSize / 2;

    let steps = 0;
    const maxSteps = 30;

    while (steps < maxSteps) {
      steps++;
      curCol += dirX;
      curRow += dirY;

      if (curCol < 0 || curCol >= this.cols || curRow < 0 || curRow >= this.rows) {
        const endX = offX + curCol * cellSize + cellSize / 2;
        const endY = offY + curRow * cellSize + cellSize / 2;
        this.laserSegments.push({ x1: startX, y1: startY, x2: endX, y2: endY });
        break;
      }

      const cell = this.grid[curRow][curCol];
      cell.illuminated = true;
      const cellCenterX = offX + curCol * cellSize + cellSize / 2;
      const cellCenterY = offY + curRow * cellSize + cellSize / 2;

      this.laserSegments.push({ x1: startX, y1: startY, x2: cellCenterX, y2: cellCenterY });
      startX = cellCenterX;
      startY = cellCenterY;

      if (cell.type === "slash") {
        // Reflect: /
        const temp = dirX;
        dirX = -dirY;
        dirY = -temp;
      } else if (cell.type === "backslash") {
        // Reflect: \
        const temp = dirX;
        dirX = dirY;
        dirY = temp;
      } else if (cell.type === "target") {
        const tgt = this.targets.find((t) => t.col === curCol && t.row === curRow);
        if (tgt) tgt.lit = true;
      } else if (cell.type === "block" || cell.type === "emitter") {
        break;
      }
    }

    // Check level victory
    if (this.targets.every((t) => t.lit)) {
      this.score += 500 * this.level;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 350, 24, ["#00F0FF", "#ffd84d", "#10B981"], 80, 280);

      setTimeout(() => {
        if (this.level < LEVELS.length) {
          this.level++;
          this.loadLevel(this.level);
        } else {
          this.isWon = true;
          this.ctx.session.setStatus("game-over");
        }
      }, 700);
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused || this.isWon) return;

    if (action === "MOVE_UP") this.cursor.row = Math.max(0, this.cursor.row - 1);
    if (action === "MOVE_DOWN") this.cursor.row = Math.min(this.rows - 1, this.cursor.row + 1);
    if (action === "MOVE_LEFT") this.cursor.col = Math.max(0, this.cursor.col - 1);
    if (action === "MOVE_RIGHT") this.cursor.col = Math.min(this.cols - 1, this.cursor.col + 1);

    if (action === "ACTION_PRIMARY") {
      this.rotateMirror(this.cursor.col, this.cursor.row);
    }
    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerDown) {
      const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
      canvas?.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 88;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2) + 16;

    // Outer cyber chamber border
    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardHeight + 12, "#1e293b", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#0f172a", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#00F0FF", false);

    // Subtle optical grid
    pr.drawGrid(this.cols, this.rows, cellSize, "rgba(0, 240, 255, 0.08)", offX, offY);

    // 1. Draw Grid Cells & Components
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;
        const centerCellX = cx + cellSize / 2;
        const centerCellY = cy + cellSize / 2;

        if (cell.type === "emitter") {
          // Cyan Laser Emitter Cannon
          pr.drawPixelBlock(cx + 14, cy + 14, cellSize - 28, "#0284C7", "#38BDF8", "#0369A1");
          pr.drawCircle(centerCellX, centerCellY, 12, "#00F0FF", true);
          pr.drawCircle(centerCellX, centerCellY, 6, "#FFFFFF", true);
        } else if (cell.type === "target") {
          const tgt = this.targets.find((t) => t.col === c && t.row === r);
          const isLit = tgt?.lit;
          pr.drawCircle(centerCellX, centerCellY, 20, isLit ? "#22C55E" : "#DC2626", false);
          pr.drawCircle(centerCellX, centerCellY, 12, isLit ? "#4ADE80" : "#F87171", true);
          pr.drawCircle(centerCellX, centerCellY, 4, "#FFFFFF", true);
        } else if (cell.type === "block") {
          // Titanium Obstacle
          pr.drawPixelBlock(cx + 6, cy + 6, cellSize - 12, "#334155", "#64748B", "#0F172A");
          pr.drawRect(cx + 12, cy + 12, cellSize - 24, cellSize - 24, "#1E293B", true);
        } else if (cell.type === "slash" || cell.type === "backslash") {
          // Rotatable Optical Prism Mirror
          pr.drawRect(cx + 8, cy + 8, cellSize - 16, cellSize - 16, "#080e1c", true);
          pr.drawRect(cx + 8, cy + 8, cellSize - 16, cellSize - 16, "#1e293b", false);

          const pad = 18;
          if (cell.type === "slash") {
            // Diagonal /
            pr.drawLine(cx + cellSize - pad, cy + pad, cx + pad, cy + cellSize - pad, "#ffd84d", 4);
            pr.drawLine(cx + cellSize - pad, cy + pad, cx + pad, cy + cellSize - pad, "#FFFFFF", 2);
          } else {
            // Diagonal \
            pr.drawLine(cx + pad, cy + pad, cx + cellSize - pad, cy + cellSize - pad, "#ffd84d", 4);
            pr.drawLine(cx + pad, cy + pad, cx + cellSize - pad, cy + cellSize - pad, "#FFFFFF", 2);
          }
        }

        // Active Cursor
        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#00F0FF", false);
          pr.drawRect(cx + 4, cy + 4, cellSize - 8, cellSize - 8, "rgba(0, 240, 255, 0.2)", false);
        }
      }
    }

    // 2. Draw Glowing Laser Beams
    for (const seg of this.laserSegments) {
      pr.drawLine(seg.x1, seg.y1, seg.x2, seg.y2, "rgba(0, 240, 255, 0.4)", 6);
      pr.drawLine(seg.x1, seg.y1, seg.x2, seg.y2, "#00F0FF", 3);
      pr.drawLine(seg.x1, seg.y1, seg.x2, seg.y2, "#FFFFFF", 1);
    }

    // Render Particles & Text Popups
    globalParticles.render(pr);

    // Top HUD
    pr.drawRect(12, 12, w - 24, 28, "rgba(8, 14, 28, 0.8)", true);
    pr.drawRect(12, 12, w - 24, 28, "#1e293b", false);
    pr.drawText(
      `LEVEL: ${this.level}/${LEVELS.length}  •  SCORE: ${this.score}  •  [CLICK MIRROR OR PRESS SPACE TO ROTATE]`,
      w / 2,
      30,
      {
        size: 11,
        color: "#00F0FF",
        align: "center",
        font: "monospace",
      }
    );

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#ffd84d", false);
      pr.drawText("ALL OPTICAL PUZZLES SOLVED!", w / 2, h / 2 - 10, { size: 22, color: "#ffd84d", align: "center", font: "monospace" });
      pr.drawText("CLICK TO REPLAY FROM LEVEL 1", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
