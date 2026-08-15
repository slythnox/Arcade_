import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

interface Box {
  col: number;
  row: number;
}

const LEVEL_CONFIGS = [
  {
    walls: [[2,3], [5,4], [4,2]],
    goals: [{ col: 6, row: 1 }, { col: 6, row: 6 }],
    boxes: [{ col: 2, row: 2 }, { col: 3, row: 5 }],
    start: { col: 1, row: 1 },
  },
  {
    walls: [[2,2], [2,5], [5,2], [5,5]],
    goals: [{ col: 1, row: 6 }, { col: 6, row: 1 }],
    boxes: [{ col: 3, row: 3 }, { col: 4, row: 4 }],
    start: { col: 1, row: 1 },
  },
  {
    walls: [[3,1], [3,6], [4,3], [4,4]],
    goals: [{ col: 6, row: 2 }, { col: 6, row: 5 }],
    boxes: [{ col: 2, row: 3 }, { col: 2, row: 4 }],
    start: { col: 1, row: 2 },
  },
  {
    walls: [[1,4], [6,3], [3,5], [4,2]],
    goals: [{ col: 5, row: 1 }, { col: 5, row: 6 }, { col: 1, row: 5 }],
    boxes: [{ col: 2, row: 2 }, { col: 3, row: 3 }, { col: 4, row: 4 }],
    start: { col: 1, row: 1 },
  },
  {
    walls: [[2,4], [3,2], [5,3], [4,5]],
    goals: [{ col: 6, row: 1 }, { col: 6, row: 3 }, { col: 6, row: 6 }],
    boxes: [{ col: 2, row: 2 }, { col: 3, row: 4 }, { col: 2, row: 5 }],
    start: { col: 1, row: 1 },
  },
];

export class NewtonsBoxGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private walls: boolean[][] = [];
  private goals: GridCoord[] = [];
  private boxes: Box[] = [];
  private playerPos: GridCoord = { col: 1, row: 1 };
  private moves: number = 0;
  private score: number = 0;
  private level: number = 1;
  private isWon: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.moves = 0;
    this.score = 0;
    this.level = 1;
    this.isWon = false;
    this.isPaused = false;
    this.loadLevel(this.level - 1);
  }

  private loadLevel(idx: number): void {
    const config = LEVEL_CONFIGS[idx % LEVEL_CONFIGS.length];
    this.playerPos = { ...config.start };
    this.goals = config.goals.map(g => ({ ...g }));
    this.boxes = config.boxes.map(b => ({ ...b }));

    const wallSet = new Set(config.walls.map(([r, c]) => `${r},${c}`));
    this.walls = Array.from({ length: this.size }, (_, r) =>
      Array.from({ length: this.size }, (_, c) => {
        if (r === 0 || r === this.size - 1 || c === 0 || c === this.size - 1) return true;
        return wallSet.has(`${r},${c}`);
      })
    );
  }

  private tryMove(dCol: number, dRow: number): void {
    if (this.isWon || this.isPaused) return;

    const newPlayerCol = this.playerPos.col + dCol;
    const newPlayerRow = this.playerPos.row + dRow;

    if (this.walls[newPlayerRow][newPlayerCol]) {
      this.ctx.audio.playLaser();
      return;
    }

    // Check if pushing a box
    const boxIdx = this.boxes.findIndex((b) => b.col === newPlayerCol && b.row === newPlayerRow);
    if (boxIdx !== -1) {
      const box = this.boxes[boxIdx];
      let curCol = box.col;
      let curRow = box.row;

      while (true) {
        const nextCol = curCol + dCol;
        const nextRow = curRow + dRow;

        if (this.walls[nextRow][nextCol]) break;
        if (this.boxes.some((b, i) => i !== boxIdx && b.col === nextCol && b.row === nextRow)) break;

        curCol = nextCol;
        curRow = nextRow;
      }

      if (curCol === box.col && curRow === box.row) {
        this.ctx.audio.playLaser();
        return;
      }

      box.col = curCol;
      box.row = curRow;
      this.ctx.audio.playPowerUp();
    }

    this.playerPos.col = newPlayerCol;
    this.playerPos.row = newPlayerRow;
    this.moves++;
    this.ctx.audio.playMove();

    // Check win condition
    const allGoalsCovered = this.goals.every((g) =>
      this.boxes.some((b) => b.col === g.col && b.row === g.row)
    );

    if (allGoalsCovered && !this.isWon) {
      this.score += Math.max(500, 3000 - this.moves * 50);
      this.ctx.audio.playVictory();

      if (this.level < LEVEL_CONFIGS.length) {
        this.level++;
        this.loadLevel(this.level - 1);
      } else {
        this.isWon = true;
        this.ctx.session.setStatus("ready");
      }
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused || this.isWon) return;

    if (action === "MOVE_UP") this.tryMove(0, -1);
    if (action === "MOVE_DOWN") this.tryMove(0, 1);
    if (action === "MOVE_LEFT") this.tryMove(-1, 0);
    if (action === "MOVE_RIGHT") this.tryMove(1, 0);
    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 66;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardWidth) / 2) + 10;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardWidth + 8, "rgba(0, 255, 102, 0.4)", false);

    pr.drawGrid(this.size, this.size, cellSize, "rgba(0, 255, 102, 0.1)", offX, offY);

    // Draw Goals
    for (const g of this.goals) {
      const gx = offX + g.col * cellSize + cellSize / 2;
      const gy = offY + g.row * cellSize + cellSize / 2;
      pr.drawCircle(gx, gy, 18, "rgba(255, 183, 3, 0.3)", true);
      pr.drawCircle(gx, gy, 8, "#FFB703", true);
    }

    // Draw Walls
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.walls[r][c]) {
          const cx = offX + c * cellSize;
          const cy = offY + r * cellSize;
          pr.drawPixelBlock(cx + 2, cy + 2, cellSize - 4, "#00FF66", "#FFFFFF", "#047857");
        }
      }
    }

    // Draw Sliding Boxes
    for (const b of this.boxes) {
      const bx = offX + b.col * cellSize;
      const by = offY + b.row * cellSize;
      const isOverGoal = this.goals.some((g) => g.col === b.col && g.row === b.row);
      const bCol = isOverGoal ? "#00FF66" : "#00F0FF";
      pr.drawPixelBlock(bx + 6, by + 6, cellSize - 12, bCol, "#FFFFFF", "rgba(0,0,0,0.5)");
    }

    // Draw Player
    const px = offX + this.playerPos.col * cellSize + cellSize / 2;
    const py = offY + this.playerPos.row * cellSize + cellSize / 2;
    pr.drawCircle(px, py, 14, "#FF3366", true);
    pr.drawCircle(px, py, 5, "#FFFFFF", true);

    pr.drawText(`STAGE ${this.level}/${LEVEL_CONFIGS.length}  •  MOVES: ${this.moves}  •  [PUSH ICE BOXES TO TARGET PADS]`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("TARGETS ACTIVATED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
