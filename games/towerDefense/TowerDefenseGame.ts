import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import type { GridCoord } from "../../core/types/geometry";

interface Creep {
  pos: Vector2;
  waypointIdx: number;
  health: number;
  maxHealth: number;
  speed: number;
}

interface Tower {
  col: number;
  row: number;
  range: number;
  damage: number;
  cooldown: number;
  timer: number;
}

interface Projectile {
  pos: Vector2;
  target: Creep;
  speed: number;
  damage: number;
}

export class TowerDefenseGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 8;
  private readonly rows: number = 8;
  private cursor: GridCoord = { col: 3, row: 3 };
  private towers: Tower[] = [];
  private creeps: Creep[] = [];
  private projectiles: Projectile[] = [];
  private waypoints: Vector2[] = [];
  private gold: number = 250;
  private lives: number = 10;
  private wave: number = 1;
  private spawnTimer: number = 0;
  private creepsRemainingInWave: number = 8;
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 3, row: 3 };
    this.towers = [];
    this.creeps = [];
    this.projectiles = [];
    this.gold = 250;
    this.lives = 10;
    this.wave = 1;
    this.creepsRemainingInWave = 8;
    this.spawnTimer = 0;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;

    // S-curve Path waypoints
    this.waypoints = [
      new Vector2(60, 150),
      new Vector2(480, 150),
      new Vector2(480, 360),
      new Vector2(120, 360),
      new Vector2(120, 560),
      new Vector2(540, 560),
    ];
  }

  private placeTower(): void {
    if (this.gold < 100 || this.gameOver || this.isPaused) return;
    const { col, row } = this.cursor;

    // Check if tower already exists
    if (this.towers.some((t) => t.col === col && t.row === row)) return;

    this.gold -= 100;
    this.towers.push({
      col,
      row,
      range: 140,
      damage: 25,
      cooldown: 0.6,
      timer: 0,
    });
    this.ctx.audio.playPowerUp();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Spawn Creeps
    if (this.creepsRemainingInWave > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer > 1.2) {
        this.spawnTimer = 0;
        this.creepsRemainingInWave--;
        this.creeps.push({
          pos: new Vector2(this.waypoints[0].x, this.waypoints[0].y),
          waypointIdx: 1,
          health: 60 + this.wave * 25,
          maxHealth: 60 + this.wave * 25,
          speed: 85 + this.wave * 5,
        });
      }
    } else if (this.creeps.length === 0) {
      // Wave clear
      this.wave++;
      this.creepsRemainingInWave = 8 + this.wave * 3;
      this.gold += 120;
      this.score += 500;
      this.ctx.audio.playVictory();
    }

    // Move Creeps along waypoints
    for (let i = this.creeps.length - 1; i >= 0; i--) {
      const c = this.creeps[i];
      const targetWp = this.waypoints[c.waypointIdx];
      const dx = targetWp.x - c.pos.x;
      const dy = targetWp.y - c.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 8) {
        c.waypointIdx++;
        if (c.waypointIdx >= this.waypoints.length) {
          // Creep reached base
          this.creeps.splice(i, 1);
          this.lives--;
          this.ctx.audio.playExplosion();
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
          continue;
        }
      } else {
        c.pos.x += (dx / dist) * c.speed * dt;
        c.pos.y += (dy / dist) * c.speed * dt;
      }
    }

    // Tower targeting & firing
    for (const t of this.towers) {
      const tx = 60 + t.col * 60 + 30;
      const ty = 100 + t.row * 60 + 30;

      t.timer += dt;
      if (t.timer >= t.cooldown) {
        // Find nearest creep in range
        let targetCreep: Creep | null = null;
        let minDist = t.range;

        for (const c of this.creeps) {
          const d = Math.hypot(c.pos.x - tx, c.pos.y - ty);
          if (d < minDist) {
            minDist = d;
            targetCreep = c;
          }
        }

        if (targetCreep) {
          t.timer = 0;
          this.projectiles.push({
            pos: new Vector2(tx, ty),
            target: targetCreep,
            speed: 480,
            damage: t.damage,
          });
          this.ctx.audio.playLaser();
        }
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      const dx = p.target.pos.x - p.pos.x;
      const dy = p.target.pos.y - p.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 12) {
        p.target.health -= p.damage;
        this.projectiles.splice(i, 1);
        if (p.target.health <= 0) {
          const cIdx = this.creeps.indexOf(p.target);
          if (cIdx !== -1) {
            this.creeps.splice(cIdx, 1);
            this.gold += 30;
            this.score += 100;
            this.ctx.audio.playExplosion();
          }
        }
      } else {
        p.pos.x += (dx / dist) * p.speed * dt;
        p.pos.y += (dy / dist) * p.speed * dt;
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_UP") this.cursor.row = Math.max(0, this.cursor.row - 1);
    if (action === "MOVE_DOWN") this.cursor.row = Math.min(this.rows - 1, this.cursor.row + 1);
    if (action === "MOVE_LEFT") this.cursor.col = Math.max(0, this.cursor.col - 1);
    if (action === "MOVE_RIGHT") this.cursor.col = Math.min(this.cols - 1, this.cursor.col + 1);
    if (action === "ACTION_PRIMARY" || action === "CONFIRM") this.placeTower();
    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.wave; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw S-Curve Path Waypoint Track
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      pr.drawLine(this.waypoints[i].x, this.waypoints[i].y, this.waypoints[i + 1].x, this.waypoints[i + 1].y, "#071a0d", 28);
      pr.drawLine(this.waypoints[i].x, this.waypoints[i].y, this.waypoints[i + 1].x, this.waypoints[i + 1].y, "rgba(0, 255, 102, 0.2)", 2);
    }

    // Draw Placement Grid (8x8)
    const cellSize = 60;
    const offX = 60;
    const offY = 100;
    pr.drawGrid(this.cols, this.rows, cellSize, "rgba(0, 255, 102, 0.08)", offX, offY);

    // Draw Towers
    for (const t of this.towers) {
      const tx = offX + t.col * cellSize + cellSize / 2;
      const ty = offY + t.row * cellSize + cellSize / 2;
      pr.drawCircle(tx, ty, t.range, "rgba(0, 240, 255, 0.05)", false);
      pr.drawPixelBlock(tx - 16, ty - 16, 32, "#00FF66", "#FFFFFF", "#047857");
      pr.drawCircle(tx, ty, 6, "#FFB703", true);
    }

    // Draw Creeps & Health Bars
    for (const c of this.creeps) {
      pr.drawCircle(c.pos.x, c.pos.y, 10, "#FF3366", true);
      pr.drawCircle(c.pos.x, c.pos.y, 4, "#FFFFFF", true);
      // Health bar
      const barW = 20;
      const hpFrac = c.health / c.maxHealth;
      pr.drawRect(c.pos.x - 10, c.pos.y - 16, barW, 3, "#040604", true);
      pr.drawRect(c.pos.x - 10, c.pos.y - 16, barW * hpFrac, 3, "#00FF66", true);
    }

    // Draw Projectiles
    for (const p of this.projectiles) {
      pr.drawCircle(p.pos.x, p.pos.y, 3, "#00F0FF", true);
    }

    // Draw Cursor
    const curX = offX + this.cursor.col * cellSize;
    const curY = offY + this.cursor.row * cellSize;
    pr.drawRect(curX, curY, cellSize, cellSize, "#00F0FF", false);

    pr.drawText(
      `GOLD: $${this.gold}  •  WAVE: ${this.wave}  •  LIVES: ${this.lives}  •  [SPACE: BUILD TOWER ($100)]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("BASE OVERRUN — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
