import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";

const TILE_SIZE = 40;

interface Entity {
  x: number;
  y: number;
  type: "player" | "slime" | "guard" | "boss";
  hp: number;
  dirX: number;
  dirY: number;
}

export class DungeonQuestGame implements GameInstance {
  private ctx!: GameContext;
  
  private player!: Entity;
  private enemies: Entity[] = [];
  
  private score: number = 0;
  private level: number = 1;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  
  private moveTimer: number = 0;
  private keys: number = 0;
  private hasBossKey: boolean = false;
  
  // Simple 10x10 room
  private roomMap: string[][] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  
  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.keys = 0;
    this.hasBossKey = false;
    
    this.player = { x: 5, y: 5, type: "player", hp: 6, dirX: 0, dirY: -1 };
    this.loadRoom();
  }
  
  private loadRoom(): void {
    this.roomMap = [];
    for (let y = 0; y < 10; y++) {
      const row: string[] = [];
      for (let x = 0; x < 10; x++) {
        if (x === 0 || x === 9 || y === 0 || y === 9) {
          if (x === 4 && y === 0) row.push("D"); // Door
          else row.push("#");
        } else {
          row.push(".");
        }
      }
      this.roomMap.push(row);
    }
    
    // Add some entities
    this.enemies = [
      { x: 2, y: 2, type: "slime", hp: 1, dirX: 0, dirY: 0 },
      { x: 7, y: 7, type: "guard", hp: 3, dirX: 0, dirY: 0 },
    ];
    this.roomMap[3][3] = "K"; // Key
  }
  
  public update(deltaTime: number): void {
    if (this.gameOver || this.isPaused) return;
    
    this.moveTimer -= deltaTime;
    
    // Move enemies occasionally
    if (this.ctx.random.nextFloat() < 0.05) {
      for (const enemy of this.enemies) {
        if (enemy.hp <= 0) continue;
        const dx = Math.floor(this.ctx.random.nextFloat() * 3) - 1;
        const dy = dx === 0 ? Math.floor(this.ctx.random.nextFloat() * 3) - 1 : 0;
        this.tryMove(enemy, dx, dy);
        
        // Attack player
        if (enemy.x === this.player.x && enemy.y === this.player.y) {
          this.player.hp -= (enemy.type === "guard" ? 2 : 1);
          if (this.player.hp <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      }
    }
  }
  
  private tryMove(ent: Entity, dx: number, dy: number): boolean {
    const nx = ent.x + dx;
    const ny = ent.y + dy;
    
    if (nx >= 0 && nx < 10 && ny >= 0 && ny < 10) {
      const tile = this.roomMap[ny][nx];
      if (tile === "#") return false;
      if (tile === "D") {
        if (ent.type === "player" && this.keys > 0) {
          this.keys--;
          this.roomMap[ny][nx] = "."; // unlock
          this.score += 100;
          return true;
        }
        return false;
      }
      
      ent.x = nx;
      ent.y = ny;
      if (dx !== 0 || dy !== 0) {
        ent.dirX = dx;
        ent.dirY = dy;
      }
      
      // Pickup logic
      if (ent.type === "player" && tile === "K") {
        this.keys++;
        this.roomMap[ny][nx] = ".";
      }
      
      return true;
    }
    return false;
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused || this.moveTimer > 0) return;
    
    let moved = false;
    if (action === "MOVE_UP") moved = this.tryMove(this.player, 0, -1);
    if (action === "MOVE_DOWN") moved = this.tryMove(this.player, 0, 1);
    if (action === "MOVE_LEFT") moved = this.tryMove(this.player, -1, 0);
    if (action === "MOVE_RIGHT") moved = this.tryMove(this.player, 1, 0);
    
    if (moved) {
      this.moveTimer = 0.15;
    }
    
    if (action === "ACTION_PRIMARY") {
      // Attack
      const ax = this.player.x + this.player.dirX;
      const ay = this.player.y + this.player.dirY;
      
      for (const enemy of this.enemies) {
        if (enemy.hp > 0 && enemy.x === ax && enemy.y === ay) {
          enemy.hp -= 1;
          if (enemy.hp <= 0) {
            this.score += 50;
          }
        }
      }
      this.moveTimer = 0.2;
    }
  }
  
  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  
  public render(renderer: Renderer): void {
    renderer.clear("#000000");
    
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    
    const offsetX = (w - 10 * TILE_SIZE) / 2;
    const offsetY = (h - 10 * TILE_SIZE) / 2;
    
    // Draw Map
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const tile = this.roomMap[y][x];
        const px = offsetX + x * TILE_SIZE;
        const py = offsetY + y * TILE_SIZE;
        
        if (tile === "#") {
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#555555", true);
        } else if (tile === ".") {
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#222222", true);
        } else if (tile === "D") {
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#8B4513", true);
        } else if (tile === "K") {
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#222222", true);
          renderer.drawCircle(px + TILE_SIZE/2, py + TILE_SIZE/2, 8, "#FFD700", true);
        }
      }
    }
    
    // Draw Enemies
    for (const enemy of this.enemies) {
      if (enemy.hp > 0) {
        const px = offsetX + enemy.x * TILE_SIZE;
        const py = offsetY + enemy.y * TILE_SIZE;
        renderer.drawCircle(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/2 - 4, enemy.type === "slime" ? "#00FF00" : "#FF0000", true);
      }
    }
    
    // Draw Player
    const px = offsetX + this.player.x * TILE_SIZE;
    const py = offsetY + this.player.y * TILE_SIZE;
    renderer.drawCircle(px + TILE_SIZE/2, py + TILE_SIZE/2, TILE_SIZE/2 - 2, "#0000FF", true);
    
    // Direction Indicator
    renderer.drawCircle(px + TILE_SIZE/2 + this.player.dirX * 10, py + TILE_SIZE/2 + this.player.dirY * 10, 4, "#FFFFFF", true);
    
    // HUD
    renderer.drawText(`HP: ${this.player.hp}/6`, 20, 30, { size: 20, color: "#FF0000" });
    renderer.drawText(`Keys: ${this.keys}`, w - 100, 30, { size: 20, color: "#FFD700" });
    
    if (this.gameOver) {
      renderer.drawText("GAME OVER", w/2, h/2, { size: 40, color: "#FF0000", align: "center" });
    }
  }
}
