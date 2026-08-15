import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

enum Tile {
  EMPTY = 0,
  SOIL = 1,
  ROCK = 2
}

interface Enemy {
  x: number;
  y: number;
  dirX: number;
  dirY: number;
  inflation: number;
  moveTimer: number;
}

export class CaveHunterGame implements GameInstance {
  private ctx!: GameContext;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  
  private grid: Tile[][] = [];
  private cols = 20;
  private rows = 14;
  private tileSize = 32;
  
  private playerX: number = 0;
  private playerY: number = 0;
  private playerMoveTimer: number = 0;
  
  private enemies: Enemy[] = [];
  
  private rockFallTimers: Map<string, number> = new Map();
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  
  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.isPaused = false;
    this.gameOver = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.loadLevel();
  }
  
  private loadLevel(): void {
    this.grid = [];
    for (let r = 0; r < this.rows; r++) {
      this.grid[r] = [];
      for (let c = 0; c < this.cols; c++) {
        if (r < 2) this.grid[r][c] = Tile.EMPTY;
        else this.grid[r][c] = (this.ctx.random.nextFloat() < 0.1) ? Tile.ROCK : Tile.SOIL;
      }
    }
    
    this.playerX = 10;
    this.playerY = 1;
    
    this.enemies = [];
    const numEnemies = 3 + this.level;
    for (let i = 0; i < numEnemies; i++) {
      const ex = Math.floor(this.ctx.random.nextFloat() * this.cols);
      const ey = 3 + Math.floor(this.ctx.random.nextFloat() * (this.rows - 3));
      this.grid[ey][ex] = Tile.EMPTY; // Clear spawn
      this.enemies.push({
        x: ex, y: ey, dirX: 1, dirY: 0, inflation: 0, moveTimer: 0
      });
    }
  }
  
  public update(deltaTime: number): void {
    if (this.isPaused || this.gameOver) return;
    
    // Deflate enemies
    for (const e of this.enemies) {
      if (e.inflation > 0) {
        e.inflation -= deltaTime * 0.5;
        if (e.inflation < 0) e.inflation = 0;
      } else {
        // Move enemy
        e.moveTimer += deltaTime;
        if (e.moveTimer > 0.5) {
          e.moveTimer = 0;
          // Simple wandering through empty tiles
          const dirs = [{x:1,y:0}, {x:-1,y:0}, {x:0,y:1}, {x:0,y:-1}];
          this.ctx.random.shuffle(dirs);
          for (const d of dirs) {
            const nx = e.x + d.x;
            const ny = e.y + d.y;
            if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows && this.grid[ny][nx] === Tile.EMPTY) {
              e.x = nx;
              e.y = ny;
              break;
            }
          }
        }
      }
    }
    
    // Player - Enemy collision
    for (const e of this.enemies) {
      if (e.x === this.playerX && e.y === this.playerY && e.inflation === 0) {
        this.die();
        return;
      }
    }
    
    // Rock falling
    for (let r = this.rows - 2; r >= 0; r--) {
      for (let c = 0; c < this.cols; c++) {
        if (this.grid[r][c] === Tile.ROCK) {
          if (this.grid[r+1][c] === Tile.EMPTY) {
            const key = `${c},${r}`;
            let t = this.rockFallTimers.get(key) || 0;
            t += deltaTime;
            if (t > 0.5) {
              this.grid[r][c] = Tile.EMPTY;
              this.grid[r+1][c] = Tile.ROCK;
              this.rockFallTimers.delete(key);
              
              // Crush check
              if (this.playerX === c && this.playerY === r+1) {
                this.die();
                return;
              }
              for (let i = this.enemies.length - 1; i >= 0; i--) {
                const e = this.enemies[i];
                if (e.x === c && e.y === r+1) {
                  this.enemies.splice(i, 1);
                  this.score += 1000;
                }
              }
              
            } else {
              this.rockFallTimers.set(key, t);
            }
          }
        }
      }
    }
    
    if (this.enemies.length === 0) {
      this.level++;
      this.loadLevel();
    }
  }
  
  private die(): void {
    this.lives--;
    this.ctx.audio.playGameOver();
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      this.playerX = 10;
      this.playerY = 1;
    }
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;
    
    const tryMove = (dx: number, dy: number) => {
      const nx = this.playerX + dx;
      const ny = this.playerY + dy;
      if (nx >= 0 && nx < this.cols && ny >= 0 && ny < this.rows) {
        if (this.grid[ny][nx] !== Tile.ROCK) {
          this.grid[ny][nx] = Tile.EMPTY;
          this.playerX = nx;
          this.playerY = ny;
          this.ctx.audio.playMove();
        }
      }
    };
    
    switch (action) {
      case "MOVE_LEFT": tryMove(-1, 0); break;
      case "MOVE_RIGHT": tryMove(1, 0); break;
      case "MOVE_UP": tryMove(0, -1); break;
      case "MOVE_DOWN": tryMove(0, 1); break;
      case "ACTION_PRIMARY":
        // Inflate enemy in adjacent cell
        for (const e of this.enemies) {
          const dist = Math.abs(e.x - this.playerX) + Math.abs(e.y - this.playerY);
          if (dist === 1) {
            e.inflation += 1.0;
            this.ctx.audio.playRotate();
            if (e.inflation >= 3) {
              this.enemies = this.enemies.filter(en => en !== e);
              this.score += 400;
              this.ctx.audio.playLineClear();
            }
            break;
          }
        }
        break;
    }
  }
  
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#000");
    
    const ox = (pr.getWidth() - this.cols * this.tileSize) / 2;
    const oy = (pr.getHeight() - this.rows * this.tileSize) / 2 + 20;
    
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const x = ox + c * this.tileSize;
        const y = oy + r * this.tileSize;
        if (this.grid[r][c] === Tile.SOIL) {
          pr.drawPixelBlock(x, y, this.tileSize, "#8B4513", "#A0522D", "#5C2E0B");
        } else if (this.grid[r][c] === Tile.ROCK) {
          pr.drawPixelBlock(x, y, this.tileSize, "#696969", "#808080", "#404040");
        }
      }
    }
    
    // Player
    pr.drawPixelBlock(ox + this.playerX * this.tileSize + 4, oy + this.playerY * this.tileSize + 4, 24, "#0F0", "#5F5", "#050");
    
    // Enemies
    for (const e of this.enemies) {
      let color = "#F00";
      if (e.inflation > 1) color = "#F55";
      if (e.inflation > 2) color = "#FAA";
      pr.drawPixelBlock(ox + e.x * this.tileSize + 4, oy + e.y * this.tileSize + 4, 24 + e.inflation*2, color);
    }
    
    pr.drawText(`Score: ${this.score}`, 10, 20, { size: 16, color: "#FFF" });
    pr.drawText(`Lives: ${this.lives}`, pr.getWidth() - 100, 20, { size: 16, color: "#FFF" });
    pr.drawText(`Level: ${this.level}`, pr.getWidth() / 2, 20, { size: 16, color: "#FFF", align: "center" });
    
    if (this.gameOver) {
      pr.drawText("GAME OVER", pr.getWidth() / 2, pr.getHeight() / 2, { size: 32, color: "#F00", align: "center" });
    }
  }
  
  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }
}
