import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

enum Tile {
  EMPTY = 0,
  SOIL = 1,
  ROCK = 2,
}

interface Enemy {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  inflation: number;
  moveTimer: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class CaveHunterGame implements GameInstance {
  private ctx!: GameContext;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;

  private grid: Tile[][] = [];
  private readonly cols = 18;
  private readonly rows = 18;
  private readonly tileSize = 32;

  private playerX: number = 9;
  private playerY: number = 2;
  private playerFacing: "left" | "right" | "up" | "down" = "right";

  private enemies: Enemy[] = [];
  private particles: Particle[] = [];
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.isPaused = false;
    this.gameOver = false;
    this.isWon = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.particles = [];
    this.loadLevel();
  }

  private loadLevel(): void {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r === 0) row.push(Tile.EMPTY); // Sky surface
        else row.push(Tile.SOIL);
      }
      this.grid.push(row);
    }

    // Starting player tunnel
    this.playerX = 9;
    this.playerY = 1;
    this.grid[1][9] = Tile.EMPTY;
    this.grid[2][9] = Tile.EMPTY;

    // Scatter rocks
    for (let i = 0; i < 4; i++) {
      const rx = Math.floor(this.ctx.random.next() * (this.cols - 2)) + 1;
      const ry = Math.floor(this.ctx.random.next() * (this.rows - 6)) + 3;
      this.grid[ry][rx] = Tile.ROCK;
    }

    // Spawn enemies in pre-dug pockets
    this.enemies = [];
    const count = 3 + Math.min(4, this.level);
    for (let i = 0; i < count; i++) {
      const ex = Math.floor(this.ctx.random.next() * (this.cols - 4)) + 2;
      const ey = Math.floor(this.ctx.random.next() * (this.rows - 6)) + 4;
      this.grid[ey][ex] = Tile.EMPTY;
      this.grid[ey][Math.min(this.cols - 1, ex + 1)] = Tile.EMPTY;
      this.enemies.push({
        x: ex,
        y: ey,
        dirX: 1,
        dirY: 0,
        inflation: 0,
        moveTimer: 0,
      });
    }
  }

  private addParticles(x: number, y: number, color: string, count = 8): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 30 + this.ctx.random.next() * 90;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.4,
        color,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isWon || this.isPaused) return;
    this.animTime += dt;

    // Deflate enemies over time
    for (const e of this.enemies) {
      if (e.inflation > 0) {
        e.inflation = Math.max(0, e.inflation - dt * 0.8);
      } else {
        // Enemy AI movement
        e.moveTimer += dt;
        if (e.moveTimer >= 0.45) {
          e.moveTimer = 0;
          const dirs = [
            { x: 1, y: 0 },
            { x: -1, y: 0 },
            { x: 0, y: 1 },
            { x: 0, y: -1 },
          ];
          const d = dirs[Math.floor(this.ctx.random.next() * dirs.length)];
          const nx = e.x + d.x;
          const ny = e.y + d.y;

          if (nx >= 0 && nx < this.cols && ny >= 1 && ny < this.rows) {
            // Can move freely in dug tunnels or slowly burrow through soil
            if (this.grid[ny][nx] !== Tile.ROCK) {
              e.x = nx;
              e.y = ny;
            }
          }
        }
      }

      // Check collision with player
      if (e.inflation === 0 && e.x === this.playerX && e.y === this.playerY) {
        this.lives--;
        this.ctx.audio.playExplosion();
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        } else {
          this.playerX = 9;
          this.playerY = 1;
        }
      }
    }

    // Check level win
    if (this.enemies.length === 0) {
      this.isWon = true;
      this.score += 2500 * this.level;
      this.ctx.audio.playVictory();
      this.level++;
      setTimeout(() => this.loadLevel(), 1500);
    }

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
    if (!isPressed || this.gameOver || this.isPaused) {
      if (action === "RESTART" && isPressed) this.reset();
      return;
    }

    const tryMove = (dx: number, dy: number, facing: "left" | "right" | "up" | "down") => {
      this.playerFacing = facing;
      const nx = this.playerX + dx;
      const ny = this.playerY + dy;

      if (nx >= 0 && nx < this.cols && ny >= 1 && ny < this.rows) {
        if (this.grid[ny][nx] !== Tile.ROCK) {
          if (this.grid[ny][nx] === Tile.SOIL) {
            this.grid[ny][nx] = Tile.EMPTY;
            this.score += 20;
            const ox = 12 + nx * this.tileSize + 16;
            const oy = 64 + ny * this.tileSize + 16;
            this.addParticles(ox, oy, "#B45309", 4);
          }
          this.playerX = nx;
          this.playerY = ny;
          this.ctx.audio.playMove();
        }
      }
    };

    switch (action) {
      case "MOVE_LEFT": tryMove(-1, 0, "left"); break;
      case "MOVE_RIGHT": tryMove(1, 0, "right"); break;
      case "MOVE_UP": tryMove(0, -1, "up"); break;
      case "MOVE_DOWN": tryMove(0, 1, "down"); break;
      case "ACTION_PRIMARY":
        // Pump hose forward
        let hx = this.playerX;
        let hy = this.playerY;
        if (this.playerFacing === "left") hx--;
        if (this.playerFacing === "right") hx++;
        if (this.playerFacing === "up") hy--;
        if (this.playerFacing === "down") hy++;

        for (const e of this.enemies) {
          if (e.x === hx && e.y === hy) {
            e.inflation += 1.0;
            this.ctx.audio.playHit();
            const ox = 12 + e.x * this.tileSize + 16;
            const oy = 64 + e.y * this.tileSize + 16;
            this.addParticles(ox, oy, "#FFD84D", 6);

            if (e.inflation >= 3.0) {
              this.enemies = this.enemies.filter((en) => en !== e);
              this.score += 500;
              this.addParticles(ox, oy, "#EF4444", 16);
              this.ctx.audio.playExplosion();
            }
            break;
          }
        }
        break;
      case "RESTART":
        this.reset();
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const ox = 12;
    const oy = 64;

    // 1. Sky Surface Layer (Row 0)
    pr.drawRect(ox, oy, this.cols * this.tileSize, this.tileSize, "#0284C7", true);
    pr.drawCircle(ox + 40, oy + 16, 12, "#FEF08A", true); // Sun

    // 2. Underground Soil Strata Layers
    for (let r = 1; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = ox + c * this.tileSize;
        const y = oy + r * this.tileSize;
        const tile = this.grid[r][c];

        if (tile === Tile.SOIL) {
          // 4 Underground Strata Colors (Yellow-Orange, Orange, Rust, Deep Brown)
          let soilBase = "#d97706";
          let soilHigh = "#fde68a";
          let soilShad = "#78350f";

          if (r > 13) {
            soilBase = "#451a03";
            soilHigh = "#78350f";
            soilShad = "#1c0a00";
          } else if (r > 9) {
            soilBase = "#9a3412";
            soilHigh = "#fdba74";
            soilShad = "#431407";
          } else if (r > 5) {
            soilBase = "#b45309";
            soilHigh = "#fcd34d";
            soilShad = "#78350f";
          }

          pr.drawPixelBlock(x, y, this.tileSize, soilBase, soilHigh, soilShad);
        } else if (tile === Tile.ROCK) {
          // Bolder Rock
          pr.drawPixelBlock(x + 2, y + 2, this.tileSize - 4, "#64748B", "#94A3B8", "#1E293B");
          pr.drawCircle(x + this.tileSize / 2, y + this.tileSize / 2, 6, "#334155", true);
        } else {
          // Dug Out Tunnel
          pr.drawRect(x, y, this.tileSize, this.tileSize, "#080e1c", true);
        }
      }
    }

    // 3. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 4. Draw Enemies (Pooka Goggles Monster & Fygar Fire Dragon)
    for (let idx = 0; idx < this.enemies.length; idx++) {
      const e = this.enemies[idx];
      const ex = ox + e.x * this.tileSize + 16;
      const ey = oy + e.y * this.tileSize + 16;
      const sz = 12 + e.inflation * 6;
      const isFygar = idx % 2 === 1;

      if (isFygar) {
        // Fygar Green Fire Dragon
        pr.drawCircle(ex, ey, sz, e.inflation > 1.5 ? "#BBF7D0" : "#16A34A", true);
        // Wings & Spikes
        pr.drawRect(ex - sz, ey - 4, 4, 8, "#FACC15", true);
        pr.drawRect(ex + sz - 4, ey - 4, 4, 8, "#FACC15", true);
        pr.drawCircle(ex - 4, ey - 2, 2, "#FFFFFF", true);
        pr.drawCircle(ex + 4, ey - 2, 2, "#FFFFFF", true);
      } else {
        // Pooka Red Monster with Swimming Goggles
        pr.drawCircle(ex, ey, sz, e.inflation > 1.5 ? "#FCA5A5" : "#EF4444", true);
        // Yellow Swimming Goggles
        pr.drawRect(ex - 9, ey - 5, 18, 7, "#FEF08A", true);
        pr.drawCircle(ex - 4, ey - 1, 2, "#000000", true);
        pr.drawCircle(ex + 4, ey - 1, 2, "#000000", true);
        // Cute Orange Feet
        pr.drawRect(ex - 6, ey + sz - 2, 4, 3, "#F97316", true);
        pr.drawRect(ex + 2, ey + sz - 2, 4, 3, "#F97316", true);
      }
    }

    // 5. Draw Detailed Dig Dug Miner Player
    const px = ox + this.playerX * this.tileSize + 16;
    const py = oy + this.playerY * this.tileSize + 16;

    // Miner White Suit & Blue Helmet
    pr.drawPixelBlock(px - 10, py - 8, 20, "#F8FAFC", "#FFFFFF", "#94A3B8");
    pr.drawRect(px - 8, py - 14, 16, 7, "#0284C7", true); // Hard Hat
    pr.drawRect(px - 6, py - 12, 12, 4, "#38BDF8", true); // Visor

    // Miner drill / pump tool
    let hx = px;
    let hy = py;
    if (this.playerFacing === "left") hx -= 24;
    if (this.playerFacing === "right") hx += 24;
    if (this.playerFacing === "up") hy -= 24;
    if (this.playerFacing === "down") hy += 24;
    pr.drawLine(px, py, hx, hy, "#FACC15", 3);
    pr.drawCircle(hx, hy, 4, "#EF4444", true); // Hose nozzle

    // 6. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`CAVE HUNTER • LVL ${this.level}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 32, { size: 13, color: "#f43f5e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MINER SQUASHED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO DIG AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22C55E", false);
      pr.drawText(`SECTOR ${this.level - 1} CLEARED!`, w / 2, h / 2 - 10, { size: 20, color: "#22C55E", align: "center", font: "monospace" });
      pr.drawText("DIGGING DEEPER INTO CAVE...", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
