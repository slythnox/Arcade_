import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";

interface MazeCell {
  visited: boolean;
  topWall: boolean;
  rightWall: boolean;
  bottomWall: boolean;
  leftWall: boolean;
}

export class MazeRunnerGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 15;
  private readonly rows: number = 17;
  private maze: MazeCell[][] = [];
  private playerPos: GridCoord = { col: 0, row: 0 };
  private goalPos: GridCoord = { col: 14, row: 16 };
  private breadcrumbs: Set<string> = new Set();
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
    this.playerPos = { col: 0, row: 0 };
    this.goalPos = { col: this.cols - 1, row: this.rows - 1 };
    this.breadcrumbs = new Set(["0,0"]);
    this.moves = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.generateMazeDFS();
  }

  private generateMazeDFS(): void {
    this.maze = Array.from({ length: this.rows }, () =>
      Array.from({ length: this.cols }, () => ({
        visited: false,
        topWall: true,
        rightWall: true,
        bottomWall: true,
        leftWall: true,
      }))
    );

    const stack: GridCoord[] = [{ col: 0, row: 0 }];
    this.maze[0][0].visited = true;

    while (stack.length > 0) {
      const cur = stack[stack.length - 1];
      const neighbors: { coord: GridCoord; dir: "TOP" | "RIGHT" | "BOTTOM" | "LEFT" }[] = [];

      if (cur.row > 0 && !this.maze[cur.row - 1][cur.col].visited) {
        neighbors.push({ coord: { col: cur.col, row: cur.row - 1 }, dir: "TOP" });
      }
      if (cur.col < this.cols - 1 && !this.maze[cur.row][cur.col + 1].visited) {
        neighbors.push({ coord: { col: cur.col + 1, row: cur.row }, dir: "RIGHT" });
      }
      if (cur.row < this.rows - 1 && !this.maze[cur.row + 1][cur.col].visited) {
        neighbors.push({ coord: { col: cur.col, row: cur.row + 1 }, dir: "BOTTOM" });
      }
      if (cur.col > 0 && !this.maze[cur.row][cur.col - 1].visited) {
        neighbors.push({ coord: { col: cur.col - 1, row: cur.row }, dir: "LEFT" });
      }

      if (neighbors.length > 0) {
        const next = neighbors[Math.floor(this.ctx.random.next() * neighbors.length)];
        // Knock down walls
        if (next.dir === "TOP") {
          this.maze[cur.row][cur.col].topWall = false;
          this.maze[next.coord.row][next.coord.col].bottomWall = false;
        } else if (next.dir === "RIGHT") {
          this.maze[cur.row][cur.col].rightWall = false;
          this.maze[next.coord.row][next.coord.col].leftWall = false;
        } else if (next.dir === "BOTTOM") {
          this.maze[cur.row][cur.col].bottomWall = false;
          this.maze[next.coord.row][next.coord.col].topWall = false;
        } else if (next.dir === "LEFT") {
          this.maze[cur.row][cur.col].leftWall = false;
          this.maze[next.coord.row][next.coord.col].rightWall = false;
        }

        this.maze[next.coord.row][next.coord.col].visited = true;
        stack.push(next.coord);
      } else {
        stack.pop();
      }
    }
  }

  private tryMove(dCol: number, dRow: number): void {
    const cur = this.maze[this.playerPos.row][this.playerPos.col];

    if (dRow === -1 && !cur.topWall) {
      this.playerPos.row--;
    } else if (dRow === 1 && !cur.bottomWall) {
      this.playerPos.row++;
    } else if (dCol === -1 && !cur.leftWall) {
      this.playerPos.col--;
    } else if (dCol === 1 && !cur.rightWall) {
      this.playerPos.col++;
    } else {
      this.ctx.audio.playLaser();
      return;
    }

    this.moves++;
    this.breadcrumbs.add(`${this.playerPos.row},${this.playerPos.col}`);
    this.ctx.audio.playMove();

    if (this.playerPos.col === this.goalPos.col && this.playerPos.row === this.goalPos.row && !this.isWon) {
      this.isWon = true;
      this.score = Math.max(500, 3000 - this.moves * 10);
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
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 36;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2) + 12;

    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#080e08", true);
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "rgba(0, 255, 102, 0.4)", false);

    // Draw Breadcrumbs
    for (const b of this.breadcrumbs) {
      const [r, c] = b.split(",").map(Number);
      const bx = offX + c * cellSize + cellSize / 2;
      const by = offY + r * cellSize + cellSize / 2;
      pr.drawCircle(bx, by, 3, "rgba(0, 255, 102, 0.3)", true);
    }

    // Draw Maze Walls
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.maze[r][c];
        const x1 = offX + c * cellSize;
        const y1 = offY + r * cellSize;
        const x2 = x1 + cellSize;
        const y2 = y1 + cellSize;

        if (cell.topWall) pr.drawLine(x1, y1, x2, y1, "#00FF66", 2);
        if (cell.rightWall) pr.drawLine(x2, y1, x2, y2, "#00FF66", 2);
        if (cell.bottomWall) pr.drawLine(x1, y2, x2, y2, "#00FF66", 2);
        if (cell.leftWall) pr.drawLine(x1, y1, x1, y2, "#00FF66", 2);
      }
    }

    // Draw Goal
    const gx = offX + this.goalPos.col * cellSize + cellSize / 2;
    const gy = offY + this.goalPos.row * cellSize + cellSize / 2;
    pr.drawCircle(gx, gy, 12, "#FFB703", true);
    pr.drawCircle(gx, gy, 5, "#FFFFFF", true);

    // Draw Player
    const px = offX + this.playerPos.col * cellSize + cellSize / 2;
    const py = offY + this.playerPos.row * cellSize + cellSize / 2;
    pr.drawCircle(px, py, 10, "#00F0FF", true);

    pr.drawText(`MOVES: ${this.moves}  •  [NAVIGATE WITH ARROW KEYS TO REACH GOAL]`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText("MAZE CONQUERED — VICTORY", w / 2, h / 2 - 10, { size: 22, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO GENERATE NEXT MAZE", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
