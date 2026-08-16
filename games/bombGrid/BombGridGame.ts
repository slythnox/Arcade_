import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

export class BombGridGame implements GameInstance {
  private ctx!: GameContext;
  
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private time: number = 0;
  
  private player = { x: 1, y: 1, maxBombs: 1, blastRange: 2, dir: 2 }; // 0=up,1=right,2=down,3=left
  
  private grid: number[][] = [];
  
  private bombs: { x: number, y: number, timer: number, range: number }[] = [];
  private blasts: { x: number, y: number, timer: number }[] = [];
  private enemies: { x: number, y: number, dir: number, timer: number }[] = [];
  private explosions: { x: number, y: number, timer: number }[] = [];
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.time = 0;
    this.player = { x: 1, y: 1, maxBombs: 1, blastRange: 2, dir: 2 };
    this.loadLevel();
  }
  
  private loadLevel(): void {
    this.grid = [];
    this.bombs = [];
    this.blasts = [];
    this.enemies = [];
    this.explosions = [];
    this.player.x = 1;
    this.player.y = 1;
    
    for (let y = 0; y < 13; y++) {
      const row = [];
      for (let x = 0; x < 15; x++) {
        if (x === 0 || x === 14 || y === 0 || y === 12) {
          row.push(1);
        } else if (x % 2 === 0 && y % 2 === 0) {
          row.push(1);
        } else {
          if (x < 3 && y < 3) row.push(0);
          else row.push(Math.random() < 0.5 ? 2 : 0);
        }
      }
      this.grid.push(row);
    }
    
    const enemyCount = 2 + this.level;
    for (let i = 0; i < enemyCount; i++) {
      let ex = 0, ey = 0;
      do {
        ex = Math.floor(Math.random() * 13) + 1;
        ey = Math.floor(Math.random() * 11) + 1;
      } while (this.grid[ey][ex] !== 0 || (ex < 4 && ey < 4));
      
      this.enemies.push({ x: ex, y: ey, dir: Math.floor(Math.random() * 4), timer: 0 });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.time += dt;

    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.timer -= dt;
      if (b.timer <= 0) {
        this.ctx.audio?.playExplosion?.();
        this.detonate(b.x, b.y, b.range);
        this.bombs.splice(i, 1);
      }
    }
    
    for (let i = this.blasts.length - 1; i >= 0; i--) {
      this.blasts[i].timer -= dt;
      if (this.blasts[i].timer <= 0) {
        this.blasts.splice(i, 1);
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      this.explosions[i].timer -= dt;
      if (this.explosions[i].timer <= 0) {
        this.explosions.splice(i, 1);
      }
    }
    
    for (const bl of this.blasts) {
      if (bl.x === this.player.x && bl.y === this.player.y) {
        this.die();
        break;
      }
    }
    
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.timer += dt;
      if (e.timer >= 0.5) {
        e.timer = 0;
        
        const dirs = [[0,-1], [1,0], [0,1], [-1,0]];
        const d = dirs[e.dir];
        const nx = e.x + d[0];
        const ny = e.y + d[1];
        
        if (this.grid[ny][nx] !== 0 || this.hasBomb(nx, ny)) {
          e.dir = Math.floor(Math.random() * 4);
        } else {
          e.x = nx;
          e.y = ny;
        }
      }
      
      if (e.x === this.player.x && e.y === this.player.y) {
        this.die();
      }
      
      for (const bl of this.blasts) {
        if (bl.x === e.x && bl.y === e.y) {
          this.score += 100;
          this.enemies.splice(i, 1);
          break;
        }
      }
    }
    
    if (this.enemies.length === 0) {
      this.level++;
      this.ctx.audio?.playVictory?.();
      this.loadLevel();
    }
  }
  
  private hasBomb(x: number, y: number): boolean {
    return this.bombs.some(b => b.x === x && b.y === y);
  }
  
  private detonate(cx: number, cy: number, range: number): void {
    this.blasts.push({ x: cx, y: cy, timer: 0.5 });
    this.explosions.push({ x: cx, y: cy, timer: 0.5 });
    
    const dirs = [[0,-1], [1,0], [0,1], [-1,0]];
    for (const d of dirs) {
      for (let i = 1; i <= range; i++) {
        const nx = cx + d[0] * i;
        const ny = cy + d[1] * i;
        
        if (this.grid[ny][nx] === 1) break;
        
        this.blasts.push({ x: nx, y: ny, timer: 0.5 });
        this.explosions.push({ x: nx, y: ny, timer: 0.5 });
        
        if (this.grid[ny][nx] === 2) {
          this.grid[ny][nx] = 0;
          this.score += 10;
          break;
        }
      }
    }
  }
  
  private die(): void {
    this.lives--;
    this.ctx.audio?.playHit?.();
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio?.playGameOver?.();
    } else {
      this.player.x = 1;
      this.player.y = 1;
      this.bombs = [];
      this.blasts = [];
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    pr.clear("#1a1a1a");
    const cellSize = 38;
    const offsetX = (renderer.getWidth() - 15 * cellSize) / 2;
    const offsetY = (renderer.getHeight() - 13 * cellSize) / 2 + 10;
    
    for (let y = 0; y < 13; y++) {
      for (let x = 0; x < 15; x++) {
        const type = this.grid[y][x];
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;
        
        if (type === 0) {
          const isDark = (x + y) % 2 === 0;
          pr.drawRect(px, py, cellSize, cellSize, isDark ? "#333333" : "#3d3d3d", true);
        } else if (type === 1) {
          pr.drawPixelRect(px, py, cellSize, cellSize, "#555555", "#888888", "#222222");
        } else if (type === 2) {
          pr.drawPixelRect(px, py, cellSize, cellSize, "#8B4513", "#A0522D", "#5C2E0B");
          pr.drawLine(px + 4, py + 4, px + cellSize - 4, py + cellSize - 4, "#5C2E0B", 2);
          pr.drawLine(px + cellSize - 4, py + 4, px + 4, py + cellSize - 4, "#5C2E0B", 2);
        }
      }
    }
    
    for (const b of this.bombs) {
      const cx = offsetX + b.x * cellSize + cellSize / 2;
      const cy = offsetY + b.y * cellSize + cellSize / 2;
      
      const pulse = b.timer < 1.0 ? Math.sin(this.time * 20) * 0.5 + 0.5 : 0;
      if (pulse > 0) {
        pr.drawCircle(cx, cy, cellSize/2, `rgba(255, 0, 0, ${pulse * 0.5})`, true);
      }
      
      pr.drawCircle(cx, cy, cellSize / 2 - 4, "#222222", true);
      pr.drawCircle(cx, cy, cellSize / 2 - 4, "#444444", false);
      pr.drawLine(cx - 4, cy - 4, cx + 4, cy + 4, "#fff", 2);
      pr.drawLine(cx + 4, cy - 4, cx - 4, cy + 4, "#fff", 2);
      
      rawCtx.beginPath();
      rawCtx.arc(cx, cy, cellSize / 2, -Math.PI / 2, -Math.PI / 2 + (b.timer / 3.0) * Math.PI * 2);
      rawCtx.strokeStyle = b.timer < 1.0 ? "#FF0000" : "#FFAA00";
      rawCtx.lineWidth = 3;
      rawCtx.stroke();
    }
    
    for (const ex of this.explosions) {
      const cx = offsetX + ex.x * cellSize + cellSize / 2;
      const cy = offsetY + ex.y * cellSize + cellSize / 2;
      const scale = (0.5 - ex.timer) * 2;
      pr.drawCircle(cx, cy, (cellSize / 2) * scale, `rgba(255, 200, 0, ${ex.timer * 2})`, true);
      pr.drawRect(cx - cellSize/2 * scale, cy - 4, cellSize * scale, 8, "#FFF", true);
      pr.drawRect(cx - 4, cy - cellSize/2 * scale, 8, cellSize * scale, "#FFF", true);
    }
    
    for (const e of this.enemies) {
      const cx = offsetX + e.x * cellSize + cellSize / 2;
      const cy = offsetY + e.y * cellSize + cellSize / 2;
      const bounce = Math.abs(Math.sin(this.time * 10)) * 4;
      pr.drawCircle(cx, cy - bounce, cellSize / 2 - 6, "#FF3333", true);
      pr.drawCircle(cx - 4, cy - bounce - 2, 3, "#FFF", true);
      pr.drawCircle(cx + 4, cy - bounce - 2, 3, "#FFF", true);
      pr.drawCircle(cx - 4, cy - bounce - 2, 1, "#000", true);
      pr.drawCircle(cx + 4, cy - bounce - 2, 1, "#000", true);
    }
    
    const pcx = offsetX + this.player.x * cellSize + cellSize / 2;
    const pcy = offsetY + this.player.y * cellSize + cellSize / 2;
    pr.drawRect(pcx - 8, pcy - 4, 16, 12, "#3b82f6", true);
    pr.drawCircle(pcx, pcy - 10, 7, "#fca5a5", true);
    
    pr.drawRect(0, 0, renderer.getWidth(), 40, "#111", true);
    pr.drawText(`♥ ${this.lives}   ★ SCORE: ${this.score}   🚩 LVL: ${this.level}`, renderer.getWidth() / 2, 25, {
      color: "#FFF", size: 16, align: "center", font: "monospace"
    });
    
    if (this.gameOver) {
      pr.drawRect(0, renderer.getHeight()/2 - 40, renderer.getWidth(), 80, "rgba(0,0,0,0.8)", true);
      pr.drawText("GAME OVER", renderer.getWidth()/2, renderer.getHeight()/2 + 10, {color: "#F00", size: 32, align: "center"});
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    let nx = this.player.x;
    let ny = this.player.y;

    if (action === "MOVE_UP") { ny--; this.player.dir = 0; }
    else if (action === "MOVE_DOWN") { ny++; this.player.dir = 2; }
    else if (action === "MOVE_LEFT") { nx--; this.player.dir = 3; }
    else if (action === "MOVE_RIGHT") { nx++; this.player.dir = 1; }
    
    if (nx !== this.player.x || ny !== this.player.y) {
      if (this.grid[ny][nx] === 0 && !this.hasBomb(nx, ny)) {
        this.player.x = nx;
        this.player.y = ny;
        this.ctx.audio?.playMove?.();
      }
    }
    
    if (action === "ACTION_PRIMARY") {
      if (this.bombs.length < this.player.maxBombs && !this.hasBomb(this.player.x, this.player.y)) {
        this.bombs.push({ x: this.player.x, y: this.player.y, timer: 3.0, range: this.player.blastRange });
        this.ctx.audio?.playDrop?.();
      }
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }
}
