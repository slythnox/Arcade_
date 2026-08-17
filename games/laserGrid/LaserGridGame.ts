import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { globalParticles } from "../../engine/particles/ParticleSystem";

export type ElementType =
  | "none"
  | "mirror_slash"       // / (Deflects East<->North, West<->South)
  | "mirror_backslash"   // \ (Deflects East<->South, West<->North)
  | "prism"              // Beam Splitter: Splits incoming beam into two 90-degree beams!
  | "filter_red"         // Changes beam to Red
  | "filter_blue"        // Changes beam to Blue
  | "filter_green"       // Changes beam to Green
  | "filter_yellow"      // Changes beam to Yellow
  | "portal_a"           // Enters A -> Exits B
  | "portal_b"           // Enters B -> Exits A
  | "target"             // Objective receiver node
  | "emitter"            // Laser cannon origin
  | "block";             // Absorptive obstacle

export type LaserColor = "cyan" | "red" | "blue" | "green" | "yellow" | "magenta" | "white";

interface LaserCell {
  col: number;
  row: number;
  type: ElementType;
  rotatable: boolean;
  color?: LaserColor;
  lit: boolean;
  litColor?: LaserColor;
}

interface EmitterDef {
  col: number;
  row: number;
  dirX: number;
  dirY: number;
  color: LaserColor;
}

interface TargetDef {
  col: number;
  row: number;
  reqColor: LaserColor;
}

interface PuzzleLevel {
  id: number;
  name: string;
  emitters: EmitterDef[];
  targets: TargetDef[];
  grid: {
    col: number;
    row: number;
    type: ElementType;
    rotatable?: boolean;
    color?: LaserColor;
  }[];
}

const PUZZLE_LEVELS: PuzzleLevel[] = [
  // Level 1: Refraction Basics
  {
    id: 1,
    name: "Refraction Basics",
    emitters: [{ col: 0, row: 1, dirX: 1, dirY: 0, color: "cyan" }],
    targets: [{ col: 4, row: 5, reqColor: "cyan" }],
    grid: [{ col: 4, row: 1, type: "mirror_slash", rotatable: true }], // Rotate to \
  },
  // Level 2: Corner Deflection
  {
    id: 2,
    name: "Corner Deflection",
    emitters: [{ col: 0, row: 0, dirX: 1, dirY: 0, color: "cyan" }],
    targets: [{ col: 1, row: 5, reqColor: "cyan" }],
    grid: [
      { col: 5, row: 0, type: "mirror_slash", rotatable: true },     // Rotate to \
      { col: 5, row: 5, type: "mirror_backslash", rotatable: true }, // Rotate to /
    ],
  },
  // Level 3: Optical Beam Splitter Prism (1 Beam -> 2 Targets)
  {
    id: 3,
    name: "Prism Splitting",
    emitters: [{ col: 0, row: 2, dirX: 1, dirY: 0, color: "cyan" }],
    targets: [
      { col: 5, row: 0, reqColor: "cyan" },
      { col: 5, row: 4, reqColor: "cyan" },
    ],
    grid: [
      { col: 2, row: 2, type: "prism", rotatable: false },
      { col: 2, row: 0, type: "mirror_backslash", rotatable: true }, // Rotate to /
      { col: 2, row: 4, type: "mirror_slash", rotatable: true },     // Rotate to \
    ],
  },
  // Level 4: Color Filtration (Red & Blue Targets)
  {
    id: 4,
    name: "Chromatic Filters",
    emitters: [{ col: 0, row: 2, dirX: 1, dirY: 0, color: "white" }],
    targets: [
      { col: 5, row: 0, reqColor: "red" },
      { col: 5, row: 4, reqColor: "blue" },
    ],
    grid: [
      { col: 2, row: 2, type: "prism", rotatable: false },
      { col: 2, row: 1, type: "filter_red", rotatable: false },
      { col: 2, row: 0, type: "mirror_backslash", rotatable: true }, // Rotate to /
      { col: 2, row: 3, type: "filter_blue", rotatable: false },
      { col: 2, row: 4, type: "mirror_slash", rotatable: true },     // Rotate to \
    ],
  },
  // Level 5: Quantum Portal Wormholes
  {
    id: 5,
    name: "Quantum Relays",
    emitters: [{ col: 0, row: 0, dirX: 1, dirY: 0, color: "cyan" }],
    targets: [{ col: 5, row: 5, reqColor: "cyan" }],
    grid: [
      { col: 3, row: 0, type: "portal_a", rotatable: false },
      { col: 1, row: 3, type: "portal_b", rotatable: false },
      { col: 5, row: 3, type: "mirror_slash", rotatable: true }, // Rotate to \
      { col: 4, row: 0, type: "block" },
      { col: 0, row: 3, type: "block" },
    ],
  },
  // Level 6: Dual Laser Matrix (Red & Green Routing)
  {
    id: 6,
    name: "Dual Laser Matrix",
    emitters: [
      { col: 0, row: 1, dirX: 1, dirY: 0, color: "red" },
      { col: 5, row: 4, dirX: -1, dirY: 0, color: "green" },
    ],
    targets: [
      { col: 3, row: 0, reqColor: "red" },
      { col: 2, row: 5, reqColor: "green" },
    ],
    grid: [
      { col: 3, row: 1, type: "mirror_backslash", rotatable: true }, // Rotate to /
      { col: 2, row: 4, type: "mirror_backslash", rotatable: true }, // Rotate to /
      { col: 3, row: 2, type: "block" },
      { col: 2, row: 3, type: "block" },
    ],
  },
  // Level 7: Prism Cascade Quad-Split
  {
    id: 7,
    name: "Prism Cascade",
    emitters: [{ col: 0, row: 2, dirX: 1, dirY: 0, color: "yellow" }],
    targets: [
      { col: 5, row: 0, reqColor: "yellow" },
      { col: 5, row: 4, reqColor: "yellow" },
    ],
    grid: [
      { col: 2, row: 2, type: "prism", rotatable: false },
      { col: 2, row: 0, type: "mirror_backslash", rotatable: true }, // Rotate to /
      { col: 2, row: 4, type: "mirror_slash", rotatable: true },     // Rotate to \
    ],
  },
  // Level 8: Grand Optical Championship Circuit
  {
    id: 8,
    name: "Championship Circuit",
    emitters: [{ col: 0, row: 1, dirX: 1, dirY: 0, color: "white" }],
    targets: [
      { col: 5, row: 0, reqColor: "red" },
      { col: 5, row: 4, reqColor: "blue" },
    ],
    grid: [
      { col: 2, row: 1, type: "prism", rotatable: false },
      { col: 2, row: 0, type: "mirror_backslash", rotatable: true }, // Rotate to /
      { col: 3, row: 0, type: "filter_red", rotatable: false },
      { col: 2, row: 3, type: "portal_a", rotatable: false },
      { col: 4, row: 2, type: "portal_b", rotatable: false },
      { col: 4, row: 3, type: "filter_blue", rotatable: false },
      { col: 4, row: 4, type: "mirror_slash", rotatable: true },     // Rotate to \
    ],
  },
];

interface LaserSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: LaserColor;
}

export class LaserGridGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 6;
  private readonly rows: number = 6;
  private grid: LaserCell[][] = [];

  private emitters: EmitterDef[] = [];
  private targets: { col: number; row: number; reqColor: LaserColor; lit: boolean }[] = [];
  private laserSegments: LaserSegment[] = [];

  private cursor: GridCoord = { col: 2, row: 2 };
  private level: number = 1;
  private score: number = 0;
  private moves: number = 0;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

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

      const cellSize = 80;
      const boardW = this.cols * cellSize;
      const boardH = this.rows * cellSize;
      const offX = Math.floor((canvas.width - boardW) / 2);
      const offY = Math.floor((canvas.height - boardH) / 2) + 20;

      const col = Math.floor((canvasX - offX) / cellSize);
      const row = Math.floor((canvasY - offY) / cellSize);

      if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
        this.cursor = { col, row };
        this.interactCell(col, row);
      }
    };

    canvas.addEventListener("pointerdown", this.boundPointerDown);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.level = 1;
    this.score = 0;
    this.moves = 0;
    this.gameOver = false;
    this.isWon = false;
    this.isPaused = false;
    this.animTime = 0;
    this.loadLevel(this.level);
  }

  private loadLevel(lvl: number): void {
    const lIdx = (lvl - 1) % PUZZLE_LEVELS.length;
    const def = PUZZLE_LEVELS[lIdx];

    this.emitters = def.emitters.map((e) => ({ ...e }));
    this.targets = def.targets.map((t) => ({ ...t, lit: false }));

    // Initialize 6x6 grid
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const rowCells: LaserCell[] = [];
      for (let c = 0; c < this.cols; c++) {
        rowCells.push({
          col: c,
          row: r,
          type: "none",
          rotatable: false,
          lit: false,
        });
      }
      this.grid.push(rowCells);
    }

    // Set Emitters
    for (const em of this.emitters) {
      this.grid[em.row][em.col].type = "emitter";
      this.grid[em.row][em.col].color = em.color;
    }

    // Set Targets
    for (const tgt of this.targets) {
      this.grid[tgt.row][tgt.col].type = "target";
      this.grid[tgt.row][tgt.col].color = tgt.reqColor;
    }

    // Populate level elements
    for (const item of def.grid) {
      this.grid[item.row][item.col].type = item.type;
      this.grid[item.row][item.col].rotatable = !!item.rotatable;
      this.grid[item.row][item.col].color = item.color;
    }

    this.recalculateLasers();
  }

  private interactCell(col: number, row: number): void {
    const cell = this.grid[row][col];
    if (!cell.rotatable) return;

    if (cell.type === "mirror_slash") {
      cell.type = "mirror_backslash";
      this.moves++;
      this.ctx.audio?.playRotate?.();
      this.recalculateLasers();
    } else if (cell.type === "mirror_backslash") {
      cell.type = "mirror_slash";
      this.moves++;
      this.ctx.audio?.playRotate?.();
      this.recalculateLasers();
    }
  }

  private recalculateLasers(): void {
    this.laserSegments = [];
    for (const t of this.targets) t.lit = false;
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].lit = false;
      }
    }

    const cellSize = 80;
    const offX = Math.floor((600 - this.cols * cellSize) / 2);
    const offY = Math.floor((700 - this.rows * cellSize) / 2) + 20;

    interface Ray {
      col: number;
      row: number;
      dirX: number;
      dirY: number;
      color: LaserColor;
      steps: number;
    }

    const rayQueue: Ray[] = [];
    for (const em of this.emitters) {
      rayQueue.push({
        col: em.col,
        row: em.row,
        dirX: em.dirX,
        dirY: em.dirY,
        color: em.color,
        steps: 0,
      });
    }

    const visitedRays = new Set<string>();

    while (rayQueue.length > 0) {
      const ray = rayQueue.shift()!;
      if (ray.steps > 40) continue;

      const stateKey = `${ray.col},${ray.row},${ray.dirX},${ray.dirY},${ray.color}`;
      if (visitedRays.has(stateKey)) continue;
      visitedRays.add(stateKey);

      let curCol = ray.col;
      let curRow = ray.row;
      let dirX = ray.dirX;
      let dirY = ray.dirY;
      let color = ray.color;

      let startX = offX + curCol * cellSize + cellSize / 2;
      let startY = offY + curRow * cellSize + cellSize / 2;

      while (ray.steps < 40) {
        ray.steps++;
        curCol += dirX;
        curRow += dirY;

        if (curCol < 0 || curCol >= this.cols || curRow < 0 || curRow >= this.rows) {
          const endX = offX + curCol * cellSize + cellSize / 2;
          const endY = offY + curRow * cellSize + cellSize / 2;
          this.laserSegments.push({ x1: startX, y1: startY, x2: endX, y2: endY, color });
          break;
        }

        const cell = this.grid[curRow][curCol];
        cell.lit = true;
        cell.litColor = color;
        const cellCenterX = offX + curCol * cellSize + cellSize / 2;
        const cellCenterY = offY + curRow * cellSize + cellSize / 2;

        this.laserSegments.push({ x1: startX, y1: startY, x2: cellCenterX, y2: cellCenterY, color });
        startX = cellCenterX;
        startY = cellCenterY;

        if (cell.type === "mirror_slash") {
          const temp = dirX;
          dirX = -dirY;
          dirY = -temp;
        } else if (cell.type === "mirror_backslash") {
          const temp = dirX;
          dirX = dirY;
          dirY = temp;
        } else if (cell.type === "prism") {
          const branch1DirX = -dirY;
          const branch1DirY = dirX;
          const branch2DirX = dirY;
          const branch2DirY = -dirX;

          rayQueue.push({ col: curCol, row: curRow, dirX: branch1DirX, dirY: branch1DirY, color, steps: ray.steps });
          rayQueue.push({ col: curCol, row: curRow, dirX: branch2DirX, dirY: branch2DirY, color, steps: ray.steps });
          break;
        } else if (cell.type === "filter_red") {
          color = "red";
        } else if (cell.type === "filter_blue") {
          color = "blue";
        } else if (cell.type === "filter_green") {
          color = "green";
        } else if (cell.type === "filter_yellow") {
          color = "yellow";
        } else if (cell.type === "portal_a") {
          for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
              if (this.grid[r][c].type === "portal_b") {
                rayQueue.push({ col: c, row: r, dirX, dirY, color, steps: ray.steps });
                break;
              }
            }
          }
          break;
        } else if (cell.type === "portal_b") {
          for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
              if (this.grid[r][c].type === "portal_a") {
                rayQueue.push({ col: c, row: r, dirX, dirY, color, steps: ray.steps });
                break;
              }
            }
          }
          break;
        } else if (cell.type === "target") {
          const tgt = this.targets.find((t) => t.col === curCol && t.row === curRow);
          if (tgt && (tgt.reqColor === "white" || tgt.reqColor === color)) {
            tgt.lit = true;
          }
        } else if (cell.type === "block" || cell.type === "emitter") {
          break;
        }
      }
    }

    if (this.targets.length > 0 && this.targets.every((t) => t.lit)) {
      this.handleLevelClear();
    }
  }

  private handleLevelClear(): void {
    if (this.isWon) return;
    this.isWon = true;
    const bonus = Math.max(100, 1000 - this.moves * 50);
    this.score += bonus * this.level;
    this.ctx.audio?.playVictory?.();
    globalParticles.emitBurst(300, 360, 36, ["#00F0FF", "#FDE047", "#10B981", "#FFFFFF"], 100, 320);

    setTimeout(() => {
      if (this.level < PUZZLE_LEVELS.length) {
        this.level++;
        this.isWon = false;
        this.moves = 0;
        this.loadLevel(this.level);
      } else {
        this.level = 1;
        this.isWon = false;
        this.loadLevel(1);
      }
    }, 2000);
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.isPaused) return;
    this.animTime += dt;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.cursor.col = (this.cursor.col - 1 + this.cols) % this.cols;
      this.ctx.audio?.playRotate?.();
    } else if (action === "MOVE_RIGHT") {
      this.cursor.col = (this.cursor.col + 1) % this.cols;
      this.ctx.audio?.playRotate?.();
    } else if (action === "MOVE_UP") {
      this.cursor.row = (this.cursor.row - 1 + this.rows) % this.rows;
      this.ctx.audio?.playRotate?.();
    } else if (action === "MOVE_DOWN") {
      this.cursor.row = (this.cursor.row + 1) % this.rows;
      this.ctx.audio?.playRotate?.();
    } else if (action === "ACTION_PRIMARY" || action === "ROTATE") {
      this.interactCell(this.cursor.col, this.cursor.row);
    } else if (action === "RESTART") {
      this.reset();
    }
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
  public getLives(): number { return 3; }

  private getColorHex(c: LaserColor): string {
    switch (c) {
      case "red": return "#EF4444";
      case "blue": return "#3B82F6";
      case "green": return "#10B981";
      case "yellow": return "#FACC15";
      case "magenta": return "#EC4899";
      case "white": return "#FFFFFF";
      default: return "#00F0FF";
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = pr.getWidth();
    const h = pr.getHeight();

    const cellSize = 80;
    const boardW = this.cols * cellSize;
    const boardH = this.rows * cellSize;
    const offX = Math.floor((w - boardW) / 2);
    const offY = Math.floor((h - boardH) / 2) + 20;

    const currentDef = PUZZLE_LEVELS[(this.level - 1) % PUZZLE_LEVELS.length];

    // 1. Grid Background & Tiles
    pr.drawRect(offX - 8, offY - 8, boardW + 16, boardH + 16, "#0F172A", true);
    pr.drawRect(offX - 8, offY - 8, boardW + 16, boardH + 16, "#334155", false);

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#1E293B", true);
        pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#334155", false);

        if (this.cursor.col === c && this.cursor.row === r) {
          const pulse = Math.sin(this.animTime * 8) * 2;
          pr.drawRect(cx + 1 - pulse, cy + 1 - pulse, cellSize - 2 + pulse * 2, cellSize - 2 + pulse * 2, "#00F0FF", false);
        }

        const midX = cx + cellSize / 2;
        const midY = cy + cellSize / 2;

        if (cell.type === "emitter") {
          const colHex = this.getColorHex(cell.color || "cyan");
          pr.drawCircle(midX, midY, 20, "#0F172A", true);
          pr.drawCircle(midX, midY, 14, colHex, true);
          pr.drawCircle(midX, midY, 8, "#FFFFFF", true);
        } else if (cell.type === "target") {
          const reqHex = this.getColorHex(cell.color || "cyan");
          pr.drawCircle(midX, midY, 22, "#0F172A", true);
          pr.drawCircle(midX, midY, 18, reqHex, false);
          if (cell.lit) {
            pr.drawCircle(midX, midY, 14, reqHex, true);
            pr.drawCircle(midX, midY, 7, "#FFFFFF", true);
          } else {
            pr.drawCircle(midX, midY, 6, "#475569", true);
          }
        } else if (cell.type === "mirror_slash") {
          pr.drawCircle(midX, midY, 24, "#0F172A", true);
          pr.drawLine(cx + 12, cy + cellSize - 12, cx + cellSize - 12, cy + 12, "#E2E8F0", 5);
          pr.drawLine(cx + 12, cy + cellSize - 12, cx + cellSize - 12, cy + 12, "#00F0FF", 2);
          if (cell.rotatable) {
            pr.drawCircle(midX, midY, 4, "#FACC15", true);
          }
        } else if (cell.type === "mirror_backslash") {
          pr.drawCircle(midX, midY, 24, "#0F172A", true);
          pr.drawLine(cx + 12, cy + 12, cx + cellSize - 12, cy + cellSize - 12, "#E2E8F0", 5);
          pr.drawLine(cx + 12, cy + 12, cx + cellSize - 12, cy + cellSize - 12, "#00F0FF", 2);
          if (cell.rotatable) {
            pr.drawCircle(midX, midY, 4, "#FACC15", true);
          }
        } else if (cell.type === "prism") {
          pr.drawCircle(midX, midY, 22, "rgba(255,255,255,0.15)", true);
          pr.drawCircle(midX, midY, 14, "#A855F7", true);
          pr.drawCircle(midX, midY, 6, "#FFFFFF", true);
        } else if (cell.type.startsWith("filter_")) {
          const filterCol = cell.type.replace("filter_", "") as LaserColor;
          const colHex = this.getColorHex(filterCol);
          pr.drawRect(cx + 16, cy + 16, cellSize - 32, cellSize - 32, colHex, true);
          pr.drawRect(cx + 16, cy + 16, cellSize - 32, cellSize - 32, "#FFFFFF", false);
        } else if (cell.type === "portal_a" || cell.type === "portal_b") {
          const portalColor = cell.type === "portal_a" ? "#F97316" : "#3B82F6";
          const spin = Math.sin(this.animTime * 6) * 4;
          pr.drawCircle(midX, midY, 18 + spin, portalColor, true);
          pr.drawCircle(midX, midY, 10, "#0F172A", true);
          pr.drawCircle(midX, midY, 4, "#FFFFFF", true);
        } else if (cell.type === "block") {
          pr.drawRect(cx + 8, cy + 8, cellSize - 16, cellSize - 16, "#475569", true);
          pr.drawLine(cx + 8, cy + 8, cx + cellSize - 8, cy + cellSize - 8, "#1E293B", 2);
          pr.drawLine(cx + cellSize - 8, cy + 8, cx + 8, cy + cellSize - 8, "#1E293B", 2);
        }
      }
    }

    // 2. Draw Laser Beams
    for (const seg of this.laserSegments) {
      const colHex = this.getColorHex(seg.color);
      pr.drawLine(seg.x1, seg.y1, seg.x2, seg.y2, colHex, 7);
      pr.drawLine(seg.x1, seg.y1, seg.x2, seg.y2, "#FFFFFF", 2);
    }

    // 3. Render Particles
    globalParticles.render(pr);

    // 4. Top Header HUD
    pr.drawRect(12, 12, w - 24, 40, "rgba(15, 23, 42, 0.9)", true);
    pr.drawRect(12, 12, w - 24, 40, "#334155", false);

    pr.drawText(`SCORE: ${this.score}`, 24, 28, { size: 12, color: "#FDE047", font: "monospace" });
    pr.drawText(`STAGE ${this.level}: ${currentDef.name.toUpperCase()}`, w / 2, 28, { size: 12, color: "#00F0FF", align: "center", font: "monospace" });
    pr.drawText(`MOVES: ${this.moves}`, w - 24, 28, { size: 12, color: "#94A3B8", align: "right", font: "monospace" });

    // Controls Legend Footer
    pr.drawRect(16, h - 26, w - 32, 18, "rgba(15, 23, 42, 0.85)", true);
    pr.drawText(
      "[CLICK / WASD + SPACE: ROTATE MIRRORS  •  R: RESTART PUZZLE]",
      w / 2,
      h - 13,
      {
        size: 9,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      }
    );

    // Level Clear Overlay
    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(15, 23, 42, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#10B981", false);
      pr.drawText("CIRCUIT COMPLETE — TARGETS ENERGIZED!", w / 2, h / 2 - 10, { size: 18, color: "#10B981", align: "center", font: "monospace" });
      pr.drawText("ADVANCING TO NEXT OPTICAL SECTOR...", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
