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

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
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
  private particles: Particle[] = [];
  private playerPos: GridCoord = { col: 1, row: 1 };
  private moves: number = 0;
  private score: number = 0;
  private level: number = 1;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.level = 1;
    this.score = 0;
    this.particles = [];
    this.loadLevel(this.level);
  }

  private loadLevel(lvl: number): void {
    const config = LEVEL_CONFIGS[(lvl - 1) % LEVEL_CONFIGS.length];
    this.moves = 0;
    this.isWon = false;
    this.isPaused = false;
    this.goals = config.goals.map((g) => ({ ...g }));
    this.boxes = config.boxes.map((b) => ({ ...b }));
    this.playerPos = { ...config.start };

    this.walls = Array.from({ length: this.size }, () => Array(this.size).fill(false));
    for (let i = 0; i < this.size; i++) {
      this.walls[0][i] = true;
      this.walls[this.size - 1][i] = true;
      this.walls[i][0] = true;
      this.walls[i][this.size - 1] = true;
    }
    for (const [r, c] of config.walls) {
      this.walls[r][c] = true;
    }
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 20 + this.ctx.random.next() * 70;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.35,
        color,
      });
    }
  }

  private move(dc: number, dr: number): void {
    if (this.isWon || this.isPaused) return;

    const nextC = this.playerPos.col + dc;
    const nextR = this.playerPos.row + dr;

    if (this.walls[nextR][nextC]) return;

    const boxIdx = this.boxes.findIndex((b) => b.col === nextC && b.row === nextR);
    if (boxIdx !== -1) {
      // Push box with frictionless Newton sliding until it hits wall or other box
      let boxC = nextC;
      let boxR = nextR;

      while (true) {
        const testC = boxC + dc;
        const testR = boxR + dr;

        if (this.walls[testR][testC] || this.boxes.some((b) => b.col === testC && b.row === testR)) {
          break;
        }

        boxC = testC;
        boxR = testR;
      }

      if (boxC === nextC && boxR === nextR) {
        return; // Blocked
      }

      this.boxes[boxIdx].col = boxC;
      this.boxes[boxIdx].row = boxR;

      const ox = 44 + boxC * 64 + 32;
      const oy = 90 + boxR * 64 + 32;
      this.addParticles(ox, oy, "#38BDF8", 8);
      this.ctx.audio.playRotate();
    }

    this.playerPos.col = nextC;
    this.playerPos.row = nextR;
    this.moves++;
    this.ctx.audio.playMove();

    this.checkWin();
  }

  private checkWin(): void {
    const allGoalsFilled = this.goals.every((g) =>
      this.boxes.some((b) => b.col === g.col && b.row === g.row)
    );

    if (allGoalsFilled && !this.isWon) {
      this.isWon = true;
      this.score += Math.max(100, 1000 - this.moves * 25);
      this.ctx.audio.playVictory();
      this.ctx.session.setStatus("ready");

      setTimeout(() => {
        if (this.level < LEVEL_CONFIGS.length) {
          this.level++;
          this.loadLevel(this.level);
        }
      }, 1500);
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") this.move(-1, 0);
    if (action === "MOVE_RIGHT") this.move(1, 0);
    if (action === "MOVE_UP") this.move(0, -1);
    if (action === "MOVE_DOWN") this.move(0, 1);
    if (action === "RESTART") this.loadLevel(this.level);
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 64;
    const boardWidth = this.size * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = 90;

    // 1. Frosted Ice Wall Frame
    pr.drawRect(offX - 10, offY - 10, boardWidth + 20, boardWidth + 20, "#0f172a", true);
    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardWidth + 12, "#38bdf8", false);

    // 2. Draw Ice Floor Tiles & Obstacles
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cx = offX + c * cellSize;
        const cy = offY + r * cellSize;

        if (this.walls[r][c]) {
          // Dark Stone Wall Block
          pr.drawPixelBlock(cx, cy, cellSize, "#1e293b", "#475569", "#0f172a");
        } else {
          // Frosted Ice Tile with Cyan Sheen
          pr.drawRect(cx, cy, cellSize, cellSize, (r + c) % 2 === 0 ? "#082f49" : "#0c4a6e", true);
          pr.drawRect(cx, cy, cellSize, cellSize, "rgba(56, 189, 248, 0.08)", false);
        }
      }
    }

    // 3. Draw Target Goals (Glowing Quantum Pressure Plates)
    for (const g of this.goals) {
      const gx = offX + g.col * cellSize + cellSize / 2;
      const gy = offY + g.row * cellSize + cellSize / 2;
      const isOccupied = this.boxes.some((b) => b.col === g.col && b.row === g.row);
      const col = isOccupied ? "#22C55E" : "#FFD84D";
      const pulse = Math.sin(this.animTime * 6 + gx) * 2;

      pr.drawCircle(gx, gy, 18 + pulse, isOccupied ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 216, 77, 0.2)", true);
      pr.drawCircle(gx, gy, 12, col, false);
      pr.drawCircle(gx, gy, 4, col, true);
    }

    // 4. Draw Momentum Sliding Blocks (Heavy Brass/Steel Crate with Rivets)
    for (const b of this.boxes) {
      const bx = offX + b.col * cellSize;
      const by = offY + b.row * cellSize;
      const onGoal = this.goals.some((g) => g.col === b.col && g.row === b.row);

      const baseCol = onGoal ? "#22C55E" : "#D97706";
      const highCol = onGoal ? "#86EFAC" : "#FDE68A";
      const shadCol = onGoal ? "#15803D" : "#78350F";

      pr.drawPixelBlock(bx + 6, by + 6, cellSize - 12, baseCol, highCol, shadCol);
      pr.drawCircle(bx + cellSize / 2, by + cellSize / 2, 6, highCol, true);
    }

    // 5. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 6. Draw Player (Quantum Ice Robot)
    const px = offX + this.playerPos.col * cellSize;
    const py = offY + this.playerPos.row * cellSize;
    pr.drawPixelBlock(px + 10, py + 10, cellSize - 20, "#00F0FF", "#E0F2FE", "#0284C7");
    pr.drawCircle(px + cellSize / 2, py + cellSize / 2, 6, "#FFFFFF", true);

    // 7. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`MOVES: ${this.moves}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`NEWTON'S BOX • LVL ${this.level}/${LEVEL_CONFIGS.length}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    // Bottom Controls Bar
    pr.drawRect(0, h - 45, w, 45, "#080e1c", true);
    pr.drawLine(0, h - 45, w, h - 45, "#1e293b", 1);
    pr.drawText("[ARROWS] Push Blocks on Frictionless Ice  •  [R] Reset Puzzle", 20, h - 18, { size: 11, color: "#94a3b8", font: "monospace" });

    if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22c55e", false);
      pr.drawText(`LEVEL ${this.level} SOLVED!`, w / 2, h / 2 - 10, { size: 20, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("SLIDING TO NEXT ICE SECTOR...", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
