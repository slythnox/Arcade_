import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

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
  mirrors: { col: number; row: number; type: "slash" | "backslash" }[];
  blocks?: { col: number; row: number }[];
}

const LEVELS: LevelDef[] = [
  // Level 1: 1 Target, 1 Mirror
  {
    emitter: { col: 0, row: 1, dirX: 1, dirY: 0 },
    targets: [{ col: 4, row: 5 }],
    mirrors: [{ col: 4, row: 1, type: "backslash" }],
  },
  // Level 2: 1 Target, 2 Mirrors
  {
    emitter: { col: 0, row: 0, dirX: 1, dirY: 0 },
    targets: [{ col: 1, row: 5 }],
    mirrors: [
      { col: 5, row: 0, type: "slash" },
      { col: 5, row: 5, type: "backslash" },
    ],
  },
  // Level 3: 2 Targets, 3 Mirrors
  {
    emitter: { col: 0, row: 1, dirX: 1, dirY: 0 },
    targets: [{ col: 2, row: 1 }, [{ col: 5, row: 4 }][0]],
    mirrors: [
      { col: 4, row: 1, type: "slash" },
      { col: 4, row: 4, type: "backslash" },
      { col: 1, row: 4, type: "slash" },
    ],
  },
  // Level 4: 2 Targets, 4 Mirrors zig-zag
  {
    emitter: { col: 0, row: 2, dirX: 1, dirY: 0 },
    targets: [{ col: 5, row: 0 }, { col: 0, row: 4 }],
    mirrors: [
      { col: 3, row: 2, type: "backslash" },
      { col: 3, row: 0, type: "slash" },
      { col: 3, row: 4, type: "backslash" },
      { col: 5, row: 2, type: "slash" },
    ],
  },
  // Level 5: Obstacle Blocks
  {
    emitter: { col: 0, row: 0, dirX: 1, dirY: 0 },
    targets: [{ col: 5, row: 5 }, { col: 2, row: 3 }],
    mirrors: [
      { col: 4, row: 0, type: "backslash" },
      { col: 4, row: 3, type: "slash" },
      { col: 1, row: 3, type: "backslash" },
      { col: 1, row: 5, type: "slash" },
    ],
    blocks: [{ col: 2, row: 0 }, { col: 3, row: 5 }],
  },
  // Level 6: 3 Targets
  {
    emitter: { col: 0, row: 1, dirX: 1, dirY: 0 },
    targets: [{ col: 2, row: 1 }, { col: 4, row: 3 }, { col: 1, row: 5 }],
    mirrors: [
      { col: 5, row: 1, type: "slash" },
      { col: 5, row: 3, type: "backslash" },
      { col: 3, row: 3, type: "slash" },
      { col: 3, row: 5, type: "backslash" },
    ],
  },
  // Level 7: Reflexive Loop
  {
    emitter: { col: 0, row: 2, dirX: 1, dirY: 0 },
    targets: [{ col: 4, row: 1 }, { col: 4, row: 5 }, { col: 1, row: 4 }],
    mirrors: [
      { col: 5, row: 2, type: "slash" },
      { col: 5, row: 1, type: "backslash" },
      { col: 2, row: 1, type: "slash" },
      { col: 2, row: 5, type: "backslash" },
      { col: 5, row: 5, type: "slash" },
    ],
  },
  // Level 8: Master Circuit
  {
    emitter: { col: 0, row: 0, dirX: 1, dirY: 0 },
    targets: [{ col: 5, row: 1 }, { col: 2, row: 4 }, { col: 0, row: 5 }],
    mirrors: [
      { col: 4, row: 0, type: "slash" },
      { col: 4, row: 2, type: "backslash" },
      { col: 5, row: 2, type: "slash" },
      { col: 5, row: 4, type: "backslash" },
      { col: 1, row: 4, type: "slash" },
      { col: 1, row: 5, type: "backslash" },
    ],
    blocks: [{ col: 2, row: 2 }, { col: 3, row: 3 }],
  },
];

export class LaserGridGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 6;
  private readonly rows: number = 6;
  private grid: LaserCell[][] = [];
  private cursor: GridCoord = { col: 2, row: 2 };
  private laserPath: GridCoord[] = [];
  private score: number = 0;
  private level: number = 1;
  private moves: number = 0;
  private targetsTotal: number = 0;
  private targetsHit: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private winTimer: number = 0;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 2, row: 2 };
    this.moves = 0;
    this.score = 0;
    this.level = 1;
    this.isWon = false;
    this.isPaused = false;
    this.winTimer = 0;
    this.loadLevel(this.level - 1);
  }

  private loadLevel(levelIndex: number): void {
    const idx = Math.max(0, Math.min(LEVELS.length - 1, levelIndex));
    const def = LEVELS[idx];

    this.grid = Array.from({ length: this.rows }, (_, r) =>
      Array.from({ length: this.cols }, (_, c) => ({
        col: c,
        row: r,
        type: "none",
        illuminated: false,
      }))
    );

    // Emitter
    this.grid[def.emitter.row][def.emitter.col].type = "emitter";

    // Targets
    for (const t of def.targets) {
      this.grid[t.row][t.col].type = "target";
    }
    this.targetsTotal = def.targets.length;

    // Mirrors (randomized initial orientation to create actual puzzle)
    for (const m of def.mirrors) {
      const initialType = this.ctx.random.next() > 0.5 ? "slash" : "backslash";
      this.grid[m.row][m.col].type = initialType;
    }

    // Blocks
    if (def.blocks) {
      for (const b of def.blocks) {
        this.grid[b.row][b.col].type = "block";
      }
    }

    this.isWon = false;
    this.winTimer = 0;
    this.traceLaser();
  }

  private traceLaser(): void {
    this.laserPath = [];
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        this.grid[r][c].illuminated = false;
      }
    }

    const idx = Math.max(0, Math.min(LEVELS.length - 1, this.level - 1));
    const def = LEVELS[idx];

    let curX = def.emitter.col;
    let curY = def.emitter.row;
    let dirX = def.emitter.dirX;
    let dirY = def.emitter.dirY;

    this.targetsHit = 0;
    this.laserPath.push({ col: curX, row: curY });
    this.grid[curY][curX].illuminated = true;

    let steps = 0;
    const hitTargets = new Set<string>();

    while (steps < 40) {
      steps++;
      curX += dirX;
      curY += dirY;

      if (curX < 0 || curX >= this.cols || curY < 0 || curY >= this.rows) {
        break;
      }

      this.laserPath.push({ col: curX, row: curY });
      const cell = this.grid[curY][curX];
      cell.illuminated = true;

      if (cell.type === "block") {
        break; // Absorbed by block
      } else if (cell.type === "slash") {
        // Reflection on '/': (dx, dy) -> (-dy, -dx)
        const oldDx = dirX;
        dirX = -dirY;
        dirY = -oldDx;
      } else if (cell.type === "backslash") {
        // Reflection on '\': (dx, dy) -> (dy, dx)
        const oldDx = dirX;
        dirX = dirY;
        dirY = oldDx;
      } else if (cell.type === "target") {
        const key = `${curX},${curY}`;
        if (!hitTargets.has(key)) {
          hitTargets.add(key);
          this.targetsHit++;
        }
      }
    }

    if (this.targetsHit >= this.targetsTotal && !this.isWon) {
      this.isWon = true;
      this.score += Math.max(100, 1000 - this.moves * 50);
      this.ctx.audio.playVictory();
    }
  }

  private rotateCurrentMirror(): void {
    const cell = this.grid[this.cursor.row][this.cursor.col];
    if (cell.type === "slash") {
      cell.type = "backslash";
      this.moves++;
      this.ctx.audio.playRotate();
      this.traceLaser();
    } else if (cell.type === "backslash") {
      cell.type = "slash";
      this.moves++;
      this.ctx.audio.playRotate();
      this.traceLaser();
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;

    if (this.isWon) {
      this.winTimer += dt;
      if (this.winTimer > 1.8) {
        if (this.level < LEVELS.length) {
          this.level++;
          this.loadLevel(this.level - 1);
        }
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    switch (action) {
      case "MOVE_UP":
        this.cursor.row = Math.max(0, this.cursor.row - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_DOWN":
        this.cursor.row = Math.min(this.rows - 1, this.cursor.row + 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_LEFT":
        this.cursor.col = Math.max(0, this.cursor.col - 1);
        this.ctx.audio.playMove();
        break;
      case "MOVE_RIGHT":
        this.cursor.col = Math.min(this.cols - 1, this.cursor.col + 1);
        this.ctx.audio.playMove();
        break;
      case "ACTION_PRIMARY":
      case "ROTATE":
        this.rotateCurrentMirror();
        break;
      case "RESTART":
        this.loadLevel(this.level - 1);
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040711");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 80;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2) - 10;

    // Outer Bezel
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardHeight + 16, "#0c152a", true);
    pr.drawRect(offX - 8, offY - 8, boardWidth + 16, boardHeight + 16, "#1e3a6a", false);

    // Inner Grid
    pr.drawGrid(this.cols, this.rows, cellSize, "rgba(0, 240, 255, 0.08)", offX, offY);

    // Draw Laser Beams with glowing neon overlay
    if (this.laserPath.length > 1) {
      for (let i = 0; i < this.laserPath.length - 1; i++) {
        const p1 = this.laserPath[i];
        const p2 = this.laserPath[i + 1];
        const x1 = offX + p1.col * cellSize + cellSize / 2;
        const y1 = offY + p1.row * cellSize + cellSize / 2;
        const x2 = offX + p2.col * cellSize + cellSize / 2;
        const y2 = offY + p2.row * cellSize + cellSize / 2;
        
        // Outer cyan glow
        pr.drawLine(x1, y1, x2, y2, "rgba(0, 240, 255, 0.35)", 7);
        // Inner intense beam
        pr.drawLine(x1, y1, x2, y2, "#FFFFFF", 2);
      }
    }

    // Draw Cells
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.grid[r][c];
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;
        const centerX = cx + cellSize / 2;
        const centerY = cy + cellSize / 2;

        if (cell.type === "emitter") {
          pr.drawPixelBlock(cx + 10, cy + 10, cellSize - 20, "#0284c7", "#38bdf8", "#0369a1");
          pr.drawText("▶", centerX, centerY + 5, { size: 18, color: "#FFFFFF", align: "center" });
        } else if (cell.type === "slash") {
          // Mirror '/'
          pr.drawLine(cx + 12, cy + cellSize - 12, cx + cellSize - 12, cy + 12, "#38bdf8", 4);
          pr.drawCircle(centerX, centerY, 4, "#ffd84d", true);
        } else if (cell.type === "backslash") {
          // Mirror '\'
          pr.drawLine(cx + 12, cy + 12, cx + cellSize - 12, cy + cellSize - 12, "#38bdf8", 4);
          pr.drawCircle(centerX, centerY, 4, "#ffd84d", true);
        } else if (cell.type === "target") {
          const isHit = cell.illuminated;
          const targetCol = isHit ? "#22c55e" : "#ef4444";
          const pulse = Math.sin(this.animTime * 6) * 3;
          pr.drawCircle(centerX, centerY, 20 + (isHit ? pulse : 0), targetCol, false);
          pr.drawCircle(centerX, centerY, 8, isHit ? "#86efac" : "#fca5a5", true);
        } else if (cell.type === "block") {
          pr.drawPixelBlock(cx + 6, cy + 6, cellSize - 12, "#1e293b", "#475569", "#0f172a");
        }

        // Selection Cursor
        if (this.cursor.col === c && this.cursor.row === r) {
          pr.drawRect(cx + 2, cy + 2, cellSize - 4, cellSize - 4, "#ffd84d", false);
          pr.drawRect(cx + 3, cy + 3, cellSize - 6, cellSize - 6, "rgba(255, 216, 77, 0.2)", true);
        }
      }
    }

    // Top HUD
    pr.drawRect(0, 0, w, 50, "#080e1c", true);
    pr.drawLine(0, 50, w, 50, "#1e293b", 1);
    pr.drawText(`LASER GRID | LEVEL ${this.level}/${LEVELS.length} | MOVES: ${this.moves} | TARGETS: ${this.targetsHit}/${this.targetsTotal}`, 20, 32, {
      size: 13,
      color: "#ffd84d",
      font: "monospace",
    });

    // Bottom Controls Bar
    pr.drawRect(0, h - 45, w, 45, "#080e1c", true);
    pr.drawLine(0, h - 45, w, h - 45, "#1e293b", 1);
    pr.drawText(`[ARROWS] Move Cursor  [SPACE / Z] Rotate Mirror  [R] Reset Level`, 20, h - 18, {
      size: 11,
      color: "#94a3b8",
      font: "monospace",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 40, w, 80, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 40, w, 80, "#22c55e", false);
      pr.drawText(`LEVEL ${this.level} SYNCHRONIZED!`, w / 2, h / 2 - 8, { size: 22, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText(`Advancing to next circuit...`, w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
