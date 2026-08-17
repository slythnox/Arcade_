import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface MazeCell {
  visited: boolean;
  topWall: boolean;
  rightWall: boolean;
  bottomWall: boolean;
  leftWall: boolean;
}

interface Gem {
  r: number;
  c: number;
  collected: boolean;
}

interface MazeBiome {
  name: string;
  wallColor: string;
  wallHighlight: string;
  wallShadow: string;
  floorColor: string;
  floorTileColor: string;
  trailColor: string;
  gemColor: string;
  portalColor: string;
}

const BIOMES: MazeBiome[] = [
  {
    name: "ANCIENT STONE TEMPLE",
    wallColor: "#334155",
    wallHighlight: "#64748B",
    wallShadow: "#1E293B",
    floorColor: "#0F172A",
    floorTileColor: "rgba(56, 189, 248, 0.05)",
    trailColor: "rgba(56, 189, 248, 0.4)",
    gemColor: "#38BDF8",
    portalColor: "#FBBF24",
  },
  {
    name: "CYBERPUNK NEON MATRIX",
    wallColor: "#4C1D95",
    wallHighlight: "#8B5CF6",
    wallShadow: "#2E1065",
    floorColor: "#090514",
    floorTileColor: "rgba(168, 85, 247, 0.06)",
    trailColor: "rgba(236, 72, 153, 0.4)",
    gemColor: "#F43F5E",
    portalColor: "#00F0FF",
  },
  {
    name: "MOLTEN VOLCANIC CRYPT",
    wallColor: "#7C2D12",
    wallHighlight: "#EA580C",
    wallShadow: "#431407",
    floorColor: "#180A05",
    floorTileColor: "rgba(249, 115, 22, 0.06)",
    trailColor: "rgba(251, 191, 36, 0.4)",
    gemColor: "#F59E0B",
    portalColor: "#EF4444",
  },
  {
    name: "BIOLUMINESCENT CRYSTAL VOID",
    wallColor: "#064E3B",
    wallHighlight: "#10B981",
    wallShadow: "#022C22",
    floorColor: "#04140E",
    floorTileColor: "rgba(52, 211, 153, 0.06)",
    trailColor: "rgba(52, 211, 153, 0.4)",
    gemColor: "#34D399",
    portalColor: "#A7F3D0",
  },
];

export class MazeRunnerGame implements GameInstance {
  private ctx!: GameContext;
  private cols: number = 15;
  private rows: number = 17;
  private maze: MazeCell[][] = [];
  private playerPos: GridCoord = { col: 0, row: 0 };
  private playerRenderPos: { x: number; y: number } = { x: 0, y: 0 };
  private goalPos: GridCoord = { col: 14, row: 16 };
  private gems: Gem[] = [];
  private breadcrumbs: Set<string> = new Set();

  private moves: number = 0;
  private score: number = 0;
  private level: number = 1;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private playerFacing: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.level = 1;
    this.score = 0;
    this.startLevel(this.level);
  }

  private startLevel(lvl: number): void {
    this.level = lvl;
    // Spacious generous dimensions matching original full screen proportions
    this.cols = Math.min(19, 15 + Math.floor((lvl - 1) * 2));
    this.rows = Math.min(21, 17 + Math.floor((lvl - 1) * 2));

    this.playerPos = { col: 0, row: 0 };
    this.playerRenderPos = { x: 0, y: 0 };
    this.goalPos = { col: this.cols - 1, row: this.rows - 1 };
    this.breadcrumbs = new Set(["0,0"]);
    this.moves = 0;
    this.isWon = false;
    this.isPaused = false;
    this.animTime = 0;

    this.generateMazeDFS();
    this.spawnGems();

    const biome = BIOMES[(this.level - 1) % BIOMES.length];
    globalParticles.emitText(`LEVEL ${this.level}: ${biome.name}`, 300, 320, biome.gemColor, 20);
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

  private spawnGems(): void {
    this.gems = [];
    const gemCount = Math.floor(4 + this.level * 2);

    for (let i = 0; i < gemCount; i++) {
      const r = Math.floor(this.ctx.random.next() * this.rows);
      const c = Math.floor(this.ctx.random.next() * this.cols);

      if ((r !== 0 || c !== 0) && (r !== this.goalPos.row || c !== this.goalPos.col)) {
        if (!this.gems.some((g) => g.r === r && g.c === c)) {
          this.gems.push({ r, c, collected: false });
        }
      }
    }
  }

  private tryMove(dCol: number, dRow: number): void {
    const cur = this.maze[this.playerPos.row][this.playerPos.col];

    if (dRow === -1 && !cur.topWall) {
      this.playerPos.row--;
      this.playerFacing = -Math.PI / 2;
    } else if (dRow === 1 && !cur.bottomWall) {
      this.playerPos.row++;
      this.playerFacing = Math.PI / 2;
    } else if (dCol === -1 && !cur.leftWall) {
      this.playerPos.col--;
      this.playerFacing = Math.PI;
    } else if (dCol === 1 && !cur.rightWall) {
      this.playerPos.col++;
      this.playerFacing = 0;
    } else {
      this.ctx.audio?.playLaser?.();
      return;
    }

    this.moves++;
    this.breadcrumbs.add(`${this.playerPos.row},${this.playerPos.col}`);
    this.ctx.audio?.playMove?.();

    for (const g of this.gems) {
      if (!g.collected && g.r === this.playerPos.row && g.c === this.playerPos.col) {
        g.collected = true;
        this.score += 250;
        this.ctx.audio?.playCoin?.();
        const biome = BIOMES[(this.level - 1) % BIOMES.length];
        globalParticles.emitBurst(300, 350, 16, [biome.gemColor, "#FFFFFF", "#FFD700"], 50, 180);
        globalParticles.emitText("+250 GEM", 300, 160, biome.gemColor, 18);
      }
    }

    if (this.playerPos.col === this.goalPos.col && this.playerPos.row === this.goalPos.row && !this.isWon) {
      this.isWon = true;
      const levelScore = Math.max(500, 2500 - this.moves * 8) * this.level;
      this.score += levelScore;
      this.ctx.session.setStatus("ready");
      this.ctx.audio?.playVictory?.();

      const biome = BIOMES[(this.level - 1) % BIOMES.length];
      globalParticles.emitBurst(300, 350, 45, [biome.portalColor, biome.gemColor, "#FFFFFF"], 80, 260);
      globalParticles.emitText(`MAZE ${this.level} CLEARED! +${levelScore}`, 300, 130, biome.portalColor, 22);
    }
  }

  public nextLevel(): void {
    this.startLevel(this.level + 1);
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    this.animTime += dt;

    this.playerRenderPos.x += (this.playerPos.col - this.playerRenderPos.x) * Math.min(1, dt * 18);
    this.playerRenderPos.y += (this.playerPos.row - this.playerRenderPos.y) * Math.min(1, dt * 18);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.isWon) {
      if (action === "ACTION_PRIMARY" || action === "CONFIRM" || action === "MOVE_RIGHT" || action === "MOVE_DOWN") {
        this.nextLevel();
      } else if (action === "RESTART") {
        this.reset();
      }
      return;
    }

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
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const biome = BIOMES[(this.level - 1) % BIOMES.length];

    // 1. Vibrant Biome Floor Background
    pr.clear(biome.floorColor);

    // Large Spacious Board Geometry (Maximizing screen view)
    const availableW = w - 40;
    const availableH = h - 100;
    const cellSize = Math.floor(Math.min(availableW / this.cols, availableH / this.rows));
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2) + 16;

    // Floor Slabs
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const fx = offX + c * cellSize;
        const fy = offY + r * cellSize;
        pr.drawRect(fx, fy, cellSize, cellSize, biome.floorTileColor, false);
      }
    }

    // Outer Fortress Border
    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardHeight + 12, biome.wallShadow, true);
    pr.drawRect(offX - 6, offY - 6, boardWidth + 12, boardHeight + 12, biome.wallHighlight, false);

    // 2. Render Glowing Footstep Breadcrumbs
    for (const b of this.breadcrumbs) {
      const [r, c] = b.split(",").map(Number);
      const bx = offX + c * cellSize + cellSize / 2;
      const by = offY + r * cellSize + cellSize / 2;
      pr.drawCircle(bx, by, Math.max(3, cellSize * 0.14), biome.trailColor, true);
    }

    // 3. Render Collectible Gems
    for (const g of this.gems) {
      if (g.collected) continue;
      const gx = offX + g.c * cellSize + cellSize / 2;
      const gy = offY + g.r * cellSize + cellSize / 2;
      const pulse = Math.sin(this.animTime * 6 + g.r) * 2;

      pr.drawCircle(gx, gy, Math.max(5, cellSize * 0.24) + pulse, biome.gemColor, true);
      pr.drawCircle(gx, gy, Math.max(2.5, cellSize * 0.12), "#FFFFFF", true);
    }

    // 4. Render Whirling Cosmic Exit Portal
    const goalX = offX + this.goalPos.col * cellSize + cellSize / 2;
    const goalY = offY + this.goalPos.row * cellSize + cellSize / 2;
    const portalPulse = Math.sin(this.animTime * 8) * 3;

    if (ctx2d) {
      ctx2d.save();
      ctx2d.shadowColor = biome.portalColor;
      ctx2d.shadowBlur = 18;
      ctx2d.beginPath();
      ctx2d.arc(goalX, goalY, Math.max(9, cellSize * 0.38) + portalPulse, 0, Math.PI * 2);
      ctx2d.fillStyle = biome.portalColor;
      ctx2d.fill();

      ctx2d.fillStyle = "#FFFFFF";
      ctx2d.beginPath();
      ctx2d.arc(goalX, goalY, Math.max(4.5, cellSize * 0.18), 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();
    } else {
      pr.drawCircle(goalX, goalY, cellSize * 0.35 + portalPulse, biome.portalColor, true);
    }

    // 5. Render High-Detail 3D Beveled Maze Walls
    const wallThick = Math.max(3, Math.floor(cellSize * 0.12));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const cell = this.maze[r][c];
        const x1 = offX + c * cellSize;
        const y1 = offY + r * cellSize;
        const x2 = x1 + cellSize;
        const y2 = y1 + cellSize;

        if (cell.topWall) {
          pr.drawLine(x1, y1, x2, y1, biome.wallColor, wallThick);
          pr.drawLine(x1, y1 - 1, x2, y1 - 1, biome.wallHighlight, 1.5);
        }
        if (cell.leftWall) {
          pr.drawLine(x1, y1, x1, y2, biome.wallColor, wallThick);
          pr.drawLine(x1 - 1, y1, x1 - 1, y2, biome.wallHighlight, 1.5);
        }
        if (cell.rightWall) {
          pr.drawLine(x2, y1, x2, y2, biome.wallColor, wallThick);
          pr.drawLine(x2 + 1, y1, x2 + 1, y2, biome.wallShadow, 1.5);
        }
        if (cell.bottomWall) {
          pr.drawLine(x1, y2, x2, y2, biome.wallColor, wallThick);
          pr.drawLine(x1, y2 + 1, x2, y2 + 1, biome.wallShadow, 1.5);
        }
      }
    }

    // 6. Render Pixel Explorer Adventurer Sprite
    const px = offX + this.playerRenderPos.x * cellSize + cellSize / 2;
    const py = offY + this.playerRenderPos.y * cellSize + cellSize / 2;
    const pSize = Math.max(9, cellSize * 0.36);

    if (ctx2d) {
      ctx2d.save();
      ctx2d.shadowColor = "#38BDF8";
      ctx2d.shadowBlur = 14;
      ctx2d.fillStyle = "#38BDF8";
      ctx2d.beginPath();
      ctx2d.arc(px, py, pSize, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.fillStyle = "#FFFFFF";
      ctx2d.beginPath();
      ctx2d.arc(px + Math.cos(this.playerFacing) * 3, py + Math.sin(this.playerFacing) * 3, pSize * 0.45, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();
    } else {
      pr.drawCircle(px, py, pSize, "#38BDF8", true);
      pr.drawCircle(px, py, pSize * 0.4, "#FFFFFF", true);
    }

    // 7. Particle Bursts
    globalParticles.render(pr);

    // 8. Top Tactical HUD
    pr.drawRect(16, 10, w - 32, 40, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(16, 10, w - 32, 40, biome.wallHighlight, false);

    pr.drawText(`LEVEL ${this.level} • ${biome.name}`, 28, 25, { size: 12, color: biome.gemColor, font: "monospace" });
    pr.drawText(`MOVES: ${this.moves}`, w / 2, 25, { size: 12, color: "#94A3B8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 28, 25, { size: 13, color: "#FBBF24", align: "right", font: "monospace" });

    // Sub-Board Controls
    pr.drawText("[ARROW KEYS / WASD: NAVIGATE LABYRINTH  •  COLLECT GEMS  •  REACH PORTAL]", w / 2, offY + boardHeight + 22, {
      size: 9,
      color: "#64748B",
      align: "center",
      font: "monospace",
    });

    // 9. Victory Overlay with Next Level Prompt
    if (this.isWon) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, biome.portalColor, false);
      pr.drawText(`MAZE ${this.level} CONQUERED!`, w / 2, h / 2 - 12, {
        size: 20,
        color: biome.portalColor,
        align: "center",
        font: "monospace",
      });
      pr.drawText("PRESS [SPACE / ENTER] FOR NEXT MAZE", w / 2, h / 2 + 18, {
        size: 13,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    }
  }
}
