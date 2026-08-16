import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import type { GridCoord } from "../../core/types/geometry";

type TowerType = "gatling" | "cannon" | "tesla";

interface Creep {
  pos: Vector2;
  waypointIdx: number;
  health: number;
  maxHealth: number;
  speed: number;
  type: "scout" | "grunt" | "boss";
}

interface Tower {
  col: number;
  row: number;
  type: TowerType;
  range: number;
  damage: number;
  cooldown: number;
  timer: number;
  targetPos?: Vector2;
}

interface Projectile {
  pos: Vector2;
  target: Creep;
  speed: number;
  damage: number;
  type: TowerType;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class TowerDefenseGame implements GameInstance {
  private ctx!: GameContext;
  private readonly cols: number = 8;
  private readonly rows: number = 8;
  private cursor: GridCoord = { col: 3, row: 3 };
  private selectedTowerType: TowerType = "gatling";
  private towers: Tower[] = [];
  private creeps: Creep[] = [];
  private projectiles: Projectile[] = [];
  private particles: Particle[] = [];
  private waypoints: Vector2[] = [];
  private gold: number = 300;
  private lives: number = 10;
  private wave: number = 1;
  private spawnTimer: number = 0;
  private creepsRemainingInWave: number = 8;
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = { col: 3, row: 3 };
    this.selectedTowerType = "gatling";
    this.towers = [];
    this.creeps = [];
    this.projectiles = [];
    this.particles = [];
    this.gold = 300;
    this.lives = 10;
    this.wave = 1;
    this.creepsRemainingInWave = 8;
    this.spawnTimer = 0;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;

    // Define snake waypoint path across 8x8 grid (cellSize = 64)
    // Grid origin: offX = 44, offY = 80
    const ox = 44 + 32;
    const oy = 80 + 32;
    const cs = 64;

    this.waypoints = [
      new Vector2(ox + 0 * cs, oy + 1 * cs),
      new Vector2(ox + 6 * cs, oy + 1 * cs),
      new Vector2(ox + 6 * cs, oy + 3 * cs),
      new Vector2(ox + 1 * cs, oy + 3 * cs),
      new Vector2(ox + 1 * cs, oy + 5 * cs),
      new Vector2(ox + 6 * cs, oy + 5 * cs),
      new Vector2(ox + 6 * cs, oy + 7 * cs),
      new Vector2(ox + 7 * cs, oy + 7 * cs),
    ];
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
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

  private isPathCell(col: number, row: number): boolean {
    if (row === 1 && col <= 6) return true;
    if (col === 6 && row >= 1 && row <= 3) return true;
    if (row === 3 && col >= 1 && col <= 6) return true;
    if (col === 1 && row >= 3 && row <= 5) return true;
    if (row === 5 && col >= 1 && col <= 6) return true;
    if (col === 6 && row >= 5 && row <= 7) return true;
    if (row === 7 && col >= 6) return true;
    return false;
  }

  private buildTower(): void {
    if (this.isPathCell(this.cursor.col, this.cursor.row)) return;
    if (this.towers.some((t) => t.col === this.cursor.col && t.row === this.cursor.row)) return;

    const costs = { gatling: 100, cannon: 175, tesla: 250 };
    const cost = costs[this.selectedTowerType];
    if (this.gold < cost) return;

    this.gold -= cost;
    let range = 120;
    let damage = 1;
    let cooldown = 0.35;

    if (this.selectedTowerType === "cannon") {
      range = 150;
      damage = 3.5;
      cooldown = 0.9;
    } else if (this.selectedTowerType === "tesla") {
      range = 100;
      damage = 0.8;
      cooldown = 0.12;
    }

    this.towers.push({
      col: this.cursor.col,
      row: this.cursor.row,
      type: this.selectedTowerType,
      range,
      damage,
      cooldown,
      timer: 0,
    });
    this.ctx.audio.playRotate();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    // Spawn Creeps
    if (this.creepsRemainingInWave > 0) {
      this.spawnTimer += dt;
      if (this.spawnTimer >= 1.2) {
        this.spawnTimer = 0;
        this.creepsRemainingInWave--;

        const isBoss = this.creepsRemainingInWave === 0 && this.wave % 3 === 0;
        const isScout = this.creepsRemainingInWave % 2 === 0;

        let maxHealth = (6 + this.wave * 4);
        let speed = 75 + this.wave * 4;
        let type: "scout" | "grunt" | "boss" = "grunt";

        if (isBoss) {
          type = "boss";
          maxHealth *= 3.5;
          speed *= 0.65;
        } else if (isScout) {
          type = "scout";
          maxHealth *= 0.6;
          speed *= 1.4;
        }

        this.creeps.push({
          pos: new Vector2(this.waypoints[0].x, this.waypoints[0].y),
          waypointIdx: 0,
          health: maxHealth,
          maxHealth,
          speed,
          type,
        });
      }
    }

    // Update Towers & Attack Creeps
    for (const t of this.towers) {
      t.timer -= dt;
      const tx = 44 + 32 + t.col * 64;
      const ty = 80 + 32 + t.row * 64;

      // Find first creep in range
      let target: Creep | null = null;
      for (const c of this.creeps) {
        if (Math.hypot(c.pos.x - tx, c.pos.y - ty) <= t.range) {
          target = c;
          t.targetPos = new Vector2(c.pos.x, c.pos.y);
          break;
        }
      }

      if (target && t.timer <= 0) {
        t.timer = t.cooldown;
        this.projectiles.push({
          pos: new Vector2(tx, ty),
          target,
          speed: t.type === "tesla" ? 900 : 450,
          damage: t.damage,
          type: t.type,
        });
        if (t.type === "tesla") this.ctx.audio.playLaser();
        else if (t.type === "cannon") this.ctx.audio.playDrop();
        else this.ctx.audio.playMove();
      }
    }

    // Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      if (!this.creeps.includes(p.target)) {
        this.projectiles.splice(i, 1);
        continue;
      }

      const dx = p.target.pos.x - p.pos.x;
      const dy = p.target.pos.y - p.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 14) {
        this.projectiles.splice(i, 1);
        p.target.health -= p.damage;
        this.addParticles(p.pos.x, p.pos.y, p.type === "cannon" ? "#F59E0B" : "#38BDF8", 4);

        if (p.target.health <= 0) {
          const idx = this.creeps.indexOf(p.target);
          if (idx !== -1) {
            const c = this.creeps[idx];
            this.creeps.splice(idx, 1);
            const reward = c.type === "boss" ? 120 : (c.type === "scout" ? 25 : 40);
            this.gold += reward;
            this.score += reward * 10;
            this.addParticles(c.pos.x, c.pos.y, "#22C55E", 10);
            this.ctx.audio.playCoin();
          }
        }
      } else {
        p.pos.x += (dx / dist) * p.speed * dt;
        p.pos.y += (dy / dist) * p.speed * dt;
      }
    }

    // Update Creep Waypoint Navigation
    for (let i = this.creeps.length - 1; i >= 0; i--) {
      const c = this.creeps[i];
      const targetWp = this.waypoints[c.waypointIdx + 1];

      if (!targetWp) {
        // Reached end of path
        this.creeps.splice(i, 1);
        this.lives--;
        this.ctx.audio.playExplosion();
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
        continue;
      }

      const dx = targetWp.x - c.pos.x;
      const dy = targetWp.y - c.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist < 6) {
        c.waypointIdx++;
      } else {
        c.pos.x += (dx / dist) * c.speed * dt;
        c.pos.y += (dy / dist) * c.speed * dt;
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }

    // Wave Advancement
    if (this.creepsRemainingInWave === 0 && this.creeps.length === 0) {
      this.wave++;
      this.creepsRemainingInWave = 8 + this.wave * 2;
      this.gold += 150;
      this.ctx.audio.playVictory();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;

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
        this.buildTower();
        break;
      case "ACTION_SECONDARY":
      case "ROTATE":
        // Cycle tower selection
        if (this.selectedTowerType === "gatling") this.selectedTowerType = "cannon";
        else if (this.selectedTowerType === "cannon") this.selectedTowerType = "tesla";
        else this.selectedTowerType = "gatling";
        this.ctx.audio.playRotate();
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
  public getLevel(): number { return this.wave; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const offX = 44;
    const offY = 80;
    const cs = 64;

    // 1. Draw Grid Tiles & Stone Road Waypoint Path
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = offX + c * cs;
        const y = offY + r * cs;

        if (this.isPathCell(c, r)) {
          // Stone Road Tile
          pr.drawRect(x, y, cs, cs, "#1e293b", true);
          pr.drawRect(x + 2, y + 2, cs - 4, cs - 4, "#0f172a", false);
        } else {
          // Grass / Building Ground Tile
          pr.drawRect(x, y, cs, cs, (r + c) % 2 === 0 ? "#064e3b" : "#047857", true);
          pr.drawRect(x, y, cs, cs, "rgba(255,255,255,0.03)", false);
        }
      }
    }

    // 2. Draw Waypoint Line Chevrons
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const p1 = this.waypoints[i];
      const p2 = this.waypoints[i + 1];
      pr.drawLine(p1.x, p1.y, p2.x, p2.y, "rgba(56, 189, 248, 0.25)", 3);
    }

    // 3. Draw Towers
    for (const t of this.towers) {
      const tx = offX + t.col * cs;
      const ty = offY + t.row * cs;

      if (t.type === "tesla") {
        pr.drawPixelBlock(tx + 8, ty + 8, cs - 16, "#38BDF8", "#E0F2FE", "#0284C7");
        pr.drawCircle(tx + 32, ty + 32, 10, "#00F0FF", true);
      } else if (t.type === "cannon") {
        pr.drawPixelBlock(tx + 8, ty + 8, cs - 16, "#F59E0B", "#FEF3C7", "#B45309");
        pr.drawCircle(tx + 32, ty + 32, 12, "#1E293B", true);
      } else {
        pr.drawPixelBlock(tx + 8, ty + 8, cs - 16, "#22C55E", "#DCFCE7", "#15803D");
        pr.drawRect(tx + 28, ty + 18, 8, 28, "#1E293B", true);
      }

      // Turret Barrel Angle if targeting
      if (t.targetPos) {
        const ang = Math.atan2(t.targetPos.y - (ty + 32), t.targetPos.x - (tx + 32));
        pr.drawLine(tx + 32, ty + 32, tx + 32 + Math.cos(ang) * 20, ty + 32 + Math.sin(ang) * 20, "#1E293B", 4);
      }
    }

    // 4. Draw Selected Range Circle around Cursor
    const curX = offX + this.cursor.col * cs + 32;
    const curY = offY + this.cursor.row * cs + 32;
    const ranges = { gatling: 120, cannon: 150, tesla: 100 };
    pr.drawCircle(curX, curY, ranges[this.selectedTowerType], "rgba(255, 216, 77, 0.2)", false);

    // Cursor Box
    pr.drawRect(offX + this.cursor.col * cs + 2, offY + this.cursor.row * cs + 2, cs - 4, cs - 4, "#ffd84d", false);

    // 5. Draw Creeps
    for (const c of this.creeps) {
      if (c.type === "boss") {
        pr.drawPixelBlock(c.pos.x - 16, c.pos.y - 16, 32, "#EF4444", "#FCA5A5", "#991B1B");
      } else if (c.type === "scout") {
        pr.drawPixelBlock(c.pos.x - 8, c.pos.y - 8, 16, "#F59E0B", "#FDE68A", "#B45309");
      } else {
        pr.drawPixelBlock(c.pos.x - 11, c.pos.y - 11, 22, "#A855F7", "#F3E8FF", "#6B21A8");
      }

      // Health bar above creep
      const barW = c.type === "boss" ? 32 : 20;
      const hpPct = Math.max(0, c.health / c.maxHealth);
      pr.drawRect(c.pos.x - barW / 2, c.pos.y - (c.type === "boss" ? 24 : 16), barW, 4, "#1e293b", true);
      pr.drawRect(c.pos.x - barW / 2, c.pos.y - (c.type === "boss" ? 24 : 16), barW * hpPct, 4, "#22c55e", true);
    }

    // 6. Draw Projectiles
    for (const p of this.projectiles) {
      const col = p.type === "tesla" ? "#00F0FF" : (p.type === "cannon" ? "#FFB703" : "#FFFFFF");
      pr.drawCircle(p.pos.x, p.pos.y, p.type === "cannon" ? 4.5 : 3, col, true);
    }

    // 7. Particles
    for (const pt of this.particles) {
      pr.drawCircle(pt.x, pt.y, 2, pt.color, true);
    }

    // 8. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`GOLD: $${this.gold}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`WAVE ${this.wave} • SCORE: ${this.score}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 32, { size: 13, color: "#f43f5e", align: "right", font: "monospace" });

    // 9. Bottom Tower Selection Toolbar
    pr.drawRect(0, h - 56, w, 56, "#080e1c", true);
    pr.drawLine(0, h - 56, w, h - 56, "#1e293b", 1);
    pr.drawText(
      `[SPACE] Build ${this.selectedTowerType.toUpperCase()} ($${ranges[this.selectedTowerType] === 120 ? 100 : ranges[this.selectedTowerType] === 150 ? 175 : 250})  •  [Z/SHIFT] Cycle Turret`,
      w / 2,
      h - 22,
      { size: 11, color: "#94a3b8", align: "center", font: "monospace" }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("BASE COMPROMISED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
