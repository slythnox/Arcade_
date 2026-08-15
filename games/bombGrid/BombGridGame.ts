import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";

export class BombGridGame implements GameInstance {
  private ctx!: GameContext;
  
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  private player = { x: 1, y: 1, maxBombs: 1, blastRange: 2 };
  
  // 0=empty, 1=solid, 2=crate
  private grid: number[][] = [];
  
  private bombs: { x: number, y: number, timer: number, range: number }[] = [];
  private blasts: { x: number, y: number, timer: number }[] = [];
  private enemies: { x: number, y: number, dir: number, timer: number }[] = [];
  
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
    this.player = { x: 1, y: 1, maxBombs: 1, blastRange: 2 };
    this.loadLevel();
  }
  
  private loadLevel(): void {
    this.grid = [];
    this.bombs = [];
    this.blasts = [];
    this.enemies = [];
    this.player.x = 1;
    this.player.y = 1;
    
    // Generate 15x13 grid
    for (let y = 0; y < 13; y++) {
      const row = [];
      for (let x = 0; x < 15; x++) {
        if (x === 0 || x === 14 || y === 0 || y === 12) {
          row.push(1); // Border
        } else if (x % 2 === 0 && y % 2 === 0) {
          row.push(1); // Pillar
        } else {
          // crates
          if (x < 3 && y < 3) row.push(0); // Safe zone
          else row.push(Math.random() < 0.5 ? 2 : 0);
        }
      }
      this.grid.push(row);
    }
    
    // Spawn enemies
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

    // Update bombs
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.timer -= dt;
      if (b.timer <= 0) {
        this.detonate(b.x, b.y, b.range);
        this.bombs.splice(i, 1);
      }
    }
    
    // Update blasts
    for (let i = this.blasts.length - 1; i >= 0; i--) {
      this.blasts[i].timer -= dt;
      if (this.blasts[i].timer <= 0) {
        this.blasts.splice(i, 1);
      }
    }
    
    // Check player blast collision
    for (const bl of this.blasts) {
      if (bl.x === this.player.x && bl.y === this.player.y) {
        this.die();
        break;
      }
    }
    
    // Update enemies
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
      
      // Enemy touched player
      if (e.x === this.player.x && e.y === this.player.y) {
        this.die();
      }
      
      // Enemy in blast
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
      this.loadLevel();
    }
  }
  
  private hasBomb(x: number, y: number): boolean {
    return this.bombs.some(b => b.x === x && b.y === y);
  }
  
  private detonate(cx: number, cy: number, range: number): void {
    this.blasts.push({ x: cx, y: cy, timer: 0.5 });
    
    const dirs = [[0,-1], [1,0], [0,1], [-1,0]];
    for (const d of dirs) {
      for (let i = 1; i <= range; i++) {
        const nx = cx + d[0] * i;
        const ny = cy + d[1] * i;
        
        if (this.grid[ny][nx] === 1) break; // Solid wall
        
        this.blasts.push({ x: nx, y: ny, timer: 0.5 });
        
        if (this.grid[ny][nx] === 2) {
          this.grid[ny][nx] = 0; // Destroy crate
          this.score += 10;
          // Random powerup chance omitted for simplicity or can be added
          break;
        }
      }
    }
  }
  
  private die(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      this.player.x = 1;
      this.player.y = 1;
      this.bombs = [];
      this.blasts = [];
    }
  }

  public render(renderer: Renderer): void {
    renderer.clear("#224422");
    const cellSize = 32;
    const offsetX = (renderer.getWidth() - 15 * cellSize) / 2;
    const offsetY = (renderer.getHeight() - 13 * cellSize) / 2;
    
    // Draw Grid
    for (let y = 0; y < 13; y++) {
      for (let x = 0; x < 15; x++) {
        const type = this.grid[y][x];
        const px = offsetX + x * cellSize;
        const py = offsetY + y * cellSize;
        
        if (type === 1) {
          renderer.drawRect(px, py, cellSize, cellSize, "#555555"); // Solid
        } else if (type === 2) {
          renderer.drawRect(px, py, cellSize, cellSize, "#8B4513"); // Crate
          // Crate X detail
          renderer.drawLine(px, py, px+cellSize, py+cellSize, "#654321");
          renderer.drawLine(px+cellSize, py, px, py+cellSize, "#654321");
        } else {
          renderer.drawRect(px, py, cellSize, cellSize, "#2A522A"); // Floor
        }
      }
    }
    
    // Draw Bombs
    for (const b of this.bombs) {
      const px = offsetX + b.x * cellSize + cellSize/2;
      const py = offsetY + b.y * cellSize + cellSize/2;
      renderer.drawCircle(px, py, cellSize/2 - 4, "#111111");
      // Fuse
      renderer.drawCircle(px, py - cellSize/2 + 4, 3, b.timer % 0.2 < 0.1 ? "#FF0000" : "#FFFF00");
    }
    
    // Draw Blasts
    for (const bl of this.blasts) {
      const px = offsetX + bl.x * cellSize;
      const py = offsetY + bl.y * cellSize;
      renderer.drawRect(px + 4, py + 4, cellSize - 8, cellSize - 8, "#FFAA00");
      renderer.drawRect(px + 8, py + 8, cellSize - 16, cellSize - 16, "#FFFF00");
    }
    
    // Draw Enemies
    for (const e of this.enemies) {
      const px = offsetX + e.x * cellSize + 4;
      const py = offsetY + e.y * cellSize + 4;
      renderer.drawRect(px, py, cellSize - 8, cellSize - 8, "#FF3333");
    }
    
    // Draw Player
    const ppx = offsetX + this.player.x * cellSize + 4;
    const ppy = offsetY + this.player.y * cellSize + 4;
    renderer.drawRect(ppx, ppy, cellSize - 8, cellSize - 8, "#FFFFFF");
    
    // UI
    renderer.drawText(`SCORE: ${this.score}`, 10, 20, {color: "#FFF", size: 16});
    renderer.drawText(`LIVES: ${this.lives}`, renderer.getWidth() - 80, 20, {color: "#FFF", size: 16});
    
    if (this.gameOver) {
      renderer.drawText("GAME OVER", renderer.getWidth()/2, renderer.getHeight()/2, {color: "#F00", size: 32, align: "center"});
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    let nx = this.player.x;
    let ny = this.player.y;

    if (action === "MOVE_UP") ny--;
    else if (action === "MOVE_DOWN") ny++;
    else if (action === "MOVE_LEFT") nx--;
    else if (action === "MOVE_RIGHT") nx++;
    
    if (nx !== this.player.x || ny !== this.player.y) {
      if (this.grid[ny][nx] === 0 && !this.hasBomb(nx, ny)) {
        this.player.x = nx;
        this.player.y = ny;
      }
    }
    
    if (action === "ACTION_PRIMARY") {
      if (this.bombs.length < this.player.maxBombs && !this.hasBomb(this.player.x, this.player.y)) {
        this.bombs.push({ x: this.player.x, y: this.player.y, timer: 3.0, range: this.player.blastRange });
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
