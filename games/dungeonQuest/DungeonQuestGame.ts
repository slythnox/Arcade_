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
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    
    // Classic Zelda Dungeon Floor (Dark Slate / Brown)
    renderer.clear("#000000");
    
    const offsetY = 72; // Space for NES Top Inventory Header
    const offsetX = (w - 10 * TILE_SIZE) / 2;
    
    // Draw Map
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 10; x++) {
        const tile = this.roomMap[y][x];
        const px = offsetX + x * TILE_SIZE;
        const py = offsetY + y * TILE_SIZE;
        
        if (tile === "#") {
          // NES Dungeon Stone Wall
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#008080", true);
          renderer.drawRect(px + 2, py + 2, TILE_SIZE - 4, TILE_SIZE - 4, "#005555", true);
        } else if (tile === ".") {
          // Dungeon Floor
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#1e293b", true);
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#0f172a", false);
        } else if (tile === "D") {
          // Locked Wooden Door
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#78350f", true);
          renderer.drawRect(px + 12, py + 12, 8, 8, "#ffd84d", true);
        } else if (tile === "K") {
          // Golden Triforce Key
          renderer.drawRect(px, py, TILE_SIZE, TILE_SIZE, "#1e293b", true);
          renderer.drawCircle(px + TILE_SIZE/2, py + TILE_SIZE/2 - 4, 6, "#ffd84d", true);
          renderer.drawRect(px + TILE_SIZE/2 - 2, py + TILE_SIZE/2, 4, 10, "#ffd84d", true);
        }
      }
    }
    
    // Draw Enemies (Octorok red octopuses & Slimes)
    for (const enemy of this.enemies) {
      if (enemy.hp > 0) {
        const ePx = offsetX + enemy.x * TILE_SIZE;
        const ePy = offsetY + enemy.y * TILE_SIZE;
        if (enemy.type === "slime") {
          renderer.drawCircle(ePx + TILE_SIZE/2, ePy + TILE_SIZE/2 + 4, 12, "#22c55e", true);
          renderer.drawCircle(ePx + TILE_SIZE/2 - 4, ePy + TILE_SIZE/2 + 2, 2, "#ffffff", true);
          renderer.drawCircle(ePx + TILE_SIZE/2 + 4, ePy + TILE_SIZE/2 + 2, 2, "#ffffff", true);
        } else {
          // Red Octorok
          renderer.drawCircle(ePx + TILE_SIZE/2, ePy + TILE_SIZE/2, 14, "#dc2626", true);
          renderer.drawCircle(ePx + TILE_SIZE/2, ePy + TILE_SIZE/2, 6, "#7f1d1d", true);
        }
      }
    }
    
    // Draw Player (Link - Green Tunic & Cap)
    const pPx = offsetX + this.player.x * TILE_SIZE;
    const pPy = offsetY + this.player.y * TILE_SIZE;
    // Green Tunic
    renderer.drawRect(pPx + 6, pPy + 10, 20, 20, "#16a34a", true);
    // Blonde Hair & Cap
    renderer.drawRect(pPx + 4, pPy + 2, 24, 10, "#15803d", true);
    renderer.drawRect(pPx + 8, pPy + 6, 16, 6, "#facc15", true);
    // Face
    renderer.drawRect(pPx + 8, pPy + 10, 16, 8, "#fce0a8", true);
    // Shield
    if (this.player.dirX > 0) {
      renderer.drawRect(pPx + 22, pPy + 12, 6, 14, "#3b82f6", true);
    } else {
      renderer.drawRect(pPx + 4, pPy + 12, 6, 14, "#3b82f6", true);
    }

    // NES Top Inventory Header Bar (Legend of Zelda style)
    renderer.drawRect(0, 0, w, 64, "#000000", true);
    renderer.drawRect(0, 62, w, 2, "#16a34a", true);

    // Minimap Box
    renderer.drawRect(16, 10, 60, 44, "#000000", true);
    renderer.drawRect(16, 10, 60, 44, "#16a34a", false);
    renderer.drawRect(16 + (this.level % 3) * 16 + 4, 10 + Math.floor((this.level - 1) / 3) * 12 + 4, 12, 8, "#63e66d", true);

    // Items Slots: B (Bomb) & A (Sword)
    renderer.drawRect(110, 12, 28, 40, "#1e293b", true);
    renderer.drawText(`B`, 120, 24, { color: "#38bdf8", size: 10 });
    renderer.drawText(`💣`, 116, 44, { size: 12 });

    renderer.drawRect(148, 12, 28, 40, "#1e293b", true);
    renderer.drawText(`A`, 158, 24, { color: "#facc15", size: 10 });
    renderer.drawText(`🗡️`, 154, 44, { size: 12 });

    // Rupees & Keys
    renderer.drawText(`💎x050`, 200, 30, { color: "#63e66d", size: 14 });
    renderer.drawText(`🗝️x0${this.keys}`, 200, 48, { color: "#ffd84d", size: 14 });

    // -LIFE- Hearts Container
    renderer.drawText(`-LIFE-`, w - 140, 24, { color: "#ef4444", size: 12 });
    const fullHearts = Math.floor(this.player.hp / 2);
    let heartStr = "";
    for (let hIdx = 0; hIdx < 3; hIdx++) {
      heartStr += hIdx < fullHearts ? "♥ " : "♡ ";
    }
    renderer.drawText(heartStr, w - 140, 48, { color: "#ef4444", size: 18 });

    if (this.gameOver) {
      renderer.drawRect(0, 0, w, h, "rgba(0,0,0,0.85)", true);
      renderer.drawText("GAME OVER", w/2, h/2 - 10, { size: 44, color: "#ef4444", align: "center" });
      renderer.drawText("Press R to Restart", w/2, h/2 + 30, { size: 16, color: "#ffffff", align: "center" });
    }
  }
}
