import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";

export class RoadHopperGame implements GameInstance {
  private ctx!: GameContext;
  
  private score: number = 0;
  private level: number = 1;
  private lives: number = 5;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  private player = { x: 5, y: 8 };
  
  // 9 lanes: 8(Start), 7,6,5(Road), 4(Safe), 3,2(River), 1(Goal)
  private obstacles: { y: number, x: number, speed: number, size: number, isLog: boolean }[] = [];
  private goals: boolean[] = [false, false, false, false, false];
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    this.score = 0;
    this.level = 1;
    this.lives = 5;
    this.gameOver = false;
    this.isPaused = false;
    this.resetLevel();
  }
  
  private resetLevel(): void {
    this.player = { x: 5, y: 8 };
    this.goals = [false, false, false, false, false];
    this.spawnObstacles();
  }
  
  private resetPlayer(): void {
    this.player = { x: 5, y: 8 };
  }
  
  private spawnObstacles(): void {
    this.obstacles = [];
    const spd = 2 + this.level * 0.5;
    
    // Cars
    this.obstacles.push({ y: 7, x: 0, speed: spd, size: 2, isLog: false });
    this.obstacles.push({ y: 7, x: 6, speed: spd, size: 2, isLog: false });
    this.obstacles.push({ y: 6, x: 3, speed: -spd * 1.2, size: 1, isLog: false });
    this.obstacles.push({ y: 6, x: 8, speed: -spd * 1.2, size: 1, isLog: false });
    this.obstacles.push({ y: 5, x: 2, speed: spd * 1.5, size: 1.5, isLog: false });
    
    // Logs
    const logLen = Math.max(1.5, 3 - this.level * 0.2);
    this.obstacles.push({ y: 3, x: 0, speed: spd, size: logLen, isLog: true });
    this.obstacles.push({ y: 3, x: 5, speed: spd, size: logLen, isLog: true });
    this.obstacles.push({ y: 2, x: 2, speed: -spd * 0.8, size: logLen + 1, isLog: true });
    this.obstacles.push({ y: 2, x: 7, speed: -spd * 0.8, size: logLen + 1, isLog: true });
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    let onLog = false;
    let logSpeed = 0;

    for (const obs of this.obstacles) {
      obs.x += obs.speed * dt;
      if (obs.x > 11 && obs.speed > 0) obs.x = -obs.size;
      if (obs.x < -obs.size && obs.speed < 0) obs.x = 11;
      
      if (this.player.y === obs.y) {
        if (this.player.x >= obs.x && this.player.x < obs.x + obs.size) {
          if (obs.isLog) {
            onLog = true;
            logSpeed = obs.speed;
          } else {
            this.die();
            return;
          }
        }
      }
    }
    
    if (this.player.y === 2 || this.player.y === 3) {
      if (!onLog) {
        this.die(); // fell in river
        return;
      }
      this.player.x += logSpeed * dt;
      if (this.player.x < 0 || this.player.x > 10) {
        this.die();
        return;
      }
    }
  }
  
  private die(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      this.resetPlayer();
    }
  }

  public render(renderer: Renderer): void {
    renderer.clear("#000000");
    const cellSize = 32;
    const offsetX = (renderer.getWidth() - 11 * cellSize) / 2;
    const offsetY = (renderer.getHeight() - 9 * cellSize) / 2;
    
    // Draw Lanes
    renderer.drawRect(offsetX, offsetY + 8 * cellSize, 11 * cellSize, cellSize, "#4CAF50"); // Start
    renderer.drawRect(offsetX, offsetY + 5 * cellSize, 11 * cellSize, 3 * cellSize, "#333333"); // Road
    renderer.drawRect(offsetX, offsetY + 4 * cellSize, 11 * cellSize, cellSize, "#4CAF50"); // Safe
    renderer.drawRect(offsetX, offsetY + 2 * cellSize, 11 * cellSize, 2 * cellSize, "#2196F3"); // River
    renderer.drawRect(offsetX, offsetY + 1 * cellSize, 11 * cellSize, cellSize, "#2E7D32"); // Goal area
    
    // Draw goals
    for(let i=0; i<5; i++) {
      const gx = offsetX + (1 + i * 2) * cellSize;
      renderer.drawRect(gx, offsetY + cellSize, cellSize, cellSize, this.goals[i] ? "#FFFF00" : "#004400");
    }
    
    // Draw Obstacles
    for (const obs of this.obstacles) {
      const color = obs.isLog ? "#795548" : "#F44336";
      renderer.drawRect(offsetX + obs.x * cellSize, offsetY + obs.y * cellSize, obs.size * cellSize - 2, cellSize - 2, color);
    }
    
    // Draw Player
    renderer.drawRect(offsetX + this.player.x * cellSize + 4, offsetY + this.player.y * cellSize + 4, cellSize - 8, cellSize - 8, "#8BC34A");
    
    // UI
    renderer.drawText(`SCORE: ${this.score}`, 10, 20, {color: "#FFF", size: 16});
    renderer.drawText(`LIVES: ${this.lives}`, renderer.getWidth() - 80, 20, {color: "#FFF", size: 16});
    
    if (this.gameOver) {
      renderer.drawText("GAME OVER", renderer.getWidth()/2, renderer.getHeight()/2, {color: "#F00", size: 32, align: "center"});
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    const prevY = this.player.y;

    switch (action) {
      case "MOVE_UP":
        this.player.y--;
        if (this.player.y < 1) this.player.y = 1;
        break;
      case "MOVE_DOWN":
        this.player.y++;
        if (this.player.y > 8) this.player.y = 8;
        break;
      case "MOVE_LEFT":
        this.player.x--;
        if (this.player.x < 0) this.player.x = 0;
        break;
      case "MOVE_RIGHT":
        this.player.x++;
        if (this.player.x > 10) this.player.x = 10;
        break;
    }
    
    if (this.player.y === 1 && prevY !== 1) {
      // Check goal
      const gx = Math.floor(this.player.x);
      let goalIdx = -1;
      for (let i=0; i<5; i++) {
        if (gx === 1 + i*2 || gx === 2 + i*2) {
          goalIdx = i;
          break;
        }
      }
      if (goalIdx >= 0 && !this.goals[goalIdx]) {
        this.goals[goalIdx] = true;
        this.score += 200;
        this.resetPlayer();
        
        if (this.goals.every(g => g)) {
          this.level++;
          this.resetLevel();
        }
      } else {
        this.die(); // Missed goal
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
