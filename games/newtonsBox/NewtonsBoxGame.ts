import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { GridCoord } from "../../core/types/geometry";

interface Box {
  col: number;
  row: number;
}

export class NewtonsBoxGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size: number = 8;
  private walls: boolean[][] = [];
  private goals: GridCoord[] = [];
  private boxes: Box[] = [];
  private playerPos: GridCoord = { col: 1, row: 1 };
  private moves: number = 0;
  private score: number = 0;
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
    this.isWon = false;
    this.isPaused = false;
    this.playerPos = { col: 1, row: 1 };

    // Walls (Outer ring + internal obstacles)
    this.walls = Array.from({ length: this.size }, (_, r) =>
      Array.from({ length: this.size }, (_, c) => {
        if (r === 0 || r === this.size - 1 || c === 0 || c === this.size - 1) return true;
        if ((r === 2 && c === 3) || (r === 5 && c === 4) || (r === 4 && c === 2)) return true;
        return false;
      })
    );

    this.goals = [
      { col: 6, row: 1 },
      { col: 6, row: 6 },
    ];

    this.boxes = [
      { col: 2, row: 2 },
      { col: 3, row: 5 },
    ];
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
      // Frictionless sliding: box slides all the way until wall or other box
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
        // Blocked box
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

    // Check win condition (all goals covered by boxes)
    const allGoalsCovered = this.goals.every((g) =>
      this.boxes.some((b) => b.col === g.col && b.row === g.row)
    );

    if (allGoalsCovered && !this.isWon) {
      this.isWon = true;
      this.score = Math.max(500, 3000 - this.moves * 50);
      this.ctx.session.setStatus("ready");
      this.ctx.audio.playVictory();
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
  public getLevel(): number { return 1; }

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

    pr.drawText(`MOVES: ${this.moves}  •  [PUSH SLIDING ICE BOXES TO TARGET PADS]`, w / 2, 28, {
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
