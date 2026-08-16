import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
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
  
  private time = 0;

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
    this.time = 0;
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
    this.time += dt;

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
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    renderer.clear("#000000");
    const cellSize = 56;
    const offsetX = (renderer.getWidth() - 11 * cellSize) / 2;
    const offsetY = (renderer.getHeight() - 9 * cellSize) / 2;
    
    // Row 9 (start): green safe zone
    renderer.drawRect(offsetX, offsetY + 8 * cellSize, 11 * cellSize, cellSize, "#4CAF50", true);
    
    // Row 6-8 and 3-4 (road)
    renderer.drawRect(offsetX, offsetY + 5 * cellSize, 11 * cellSize, 3 * cellSize, "#333333", true);
    for (let l = 0; l < 2; l++) {
        for (let d = 0; d < 11; d++) {
            renderer.drawRect(offsetX + d * cellSize + 10, offsetY + (6 + l) * cellSize - 2, 36, 4, "#EEEEEE", true);
        }
    }
    
    // Row 5 (safe median)
    renderer.drawRect(offsetX, offsetY + 4 * cellSize, 11 * cellSize, cellSize, "#4CAF50", true);
    renderer.drawRect(offsetX, offsetY + 4 * cellSize + 10, 11 * cellSize, cellSize - 20, "#388E3C", true);
    
    // Row 1-2 (river)
    renderer.drawRect(offsetX, offsetY + 2 * cellSize, 11 * cellSize, 2 * cellSize, "#2196F3", true);
    rawCtx.fillStyle = "#64B5F6";
    for(let i=0; i<8; i++) {
        const rippleY = offsetY + 2 * cellSize + i * 14;
        const shiftX = Math.sin(this.time * 2 + i * 0.5) * 8;
        rawCtx.fillRect(offsetX + shiftX, rippleY, 11 * cellSize, 2);
    }
    
    // Row 0 (goal area background)
    renderer.drawRect(offsetX, offsetY + cellSize, 11 * cellSize, cellSize, "#2E7D32", true);
    
    // Draw goals
    for(let i=0; i<5; i++) {
      const gx = offsetX + (1 + i * 2) * cellSize;
      renderer.drawCircle(gx + cellSize/2, offsetY + cellSize + cellSize/2, cellSize/2 - 4, "#003300", true);
      if (this.goals[i]) {
          renderer.drawCircle(gx + cellSize/2, offsetY + cellSize + cellSize/2, cellSize/2 - 6, "#4CAF50", true);
      }
    }
    
    // Draw Obstacles
    for (const obs of this.obstacles) {
      if (obs.isLog) {
          renderer.drawRect(offsetX + obs.x * cellSize, offsetY + obs.y * cellSize + 8, obs.size * cellSize - 4, cellSize - 16, "#795548", true);
          renderer.drawRect(offsetX + obs.x * cellSize, offsetY + obs.y * cellSize + 12, obs.size * cellSize - 4, 2, "#5D4037", true);
          renderer.drawRect(offsetX + obs.x * cellSize, offsetY + obs.y * cellSize + 22, obs.size * cellSize - 4, 2, "#5D4037", true);
          renderer.drawRect(offsetX + obs.x * cellSize, offsetY + obs.y * cellSize + 32, obs.size * cellSize - 4, 2, "#5D4037", true);
      } else {
          // Car
          renderer.drawRect(offsetX + obs.x * cellSize + 2, offsetY + obs.y * cellSize + 10, obs.size * cellSize - 8, cellSize - 20, "#F44336", true);
          const dirOffset = obs.speed > 0 ? obs.size * cellSize - 24 : 8;
          renderer.drawRect(offsetX + obs.x * cellSize + dirOffset, offsetY + obs.y * cellSize + 14, 16, cellSize - 28, "#B71C1C", true); // Windshield
          // Wheels
          renderer.drawCircle(offsetX + obs.x * cellSize + 12, offsetY + obs.y * cellSize + 8, 4, "#000", true);
          renderer.drawCircle(offsetX + obs.x * cellSize + 12, offsetY + obs.y * cellSize + cellSize - 8, 4, "#000", true);
          renderer.drawCircle(offsetX + obs.x * cellSize + obs.size * cellSize - 16, offsetY + obs.y * cellSize + 8, 4, "#000", true);
          renderer.drawCircle(offsetX + obs.x * cellSize + obs.size * cellSize - 16, offsetY + obs.y * cellSize + cellSize - 8, 4, "#000", true);
      }
    }
    
    // Draw Player
    const px = offsetX + this.player.x * cellSize + cellSize/2;
    const py = offsetY + this.player.y * cellSize + cellSize/2;
    renderer.drawCircle(px, py, 16, "#8BC34A", true);
    renderer.drawCircle(px - 6, py - 12, 4, "#8BC34A", true); // left eye
    renderer.drawCircle(px + 6, py - 12, 4, "#8BC34A", true); // right eye
    renderer.drawRect(px - 18, py - 4, 8, 12, "#8BC34A", true); // left leg
    renderer.drawRect(px + 10, py - 4, 8, 12, "#8BC34A", true); // right leg
    
    // HUD
    renderer.drawRect(0, 0, renderer.getWidth(), 44, "#222222", true);
    renderer.drawText(`SCORE: ${this.score}`, 20, 26, {color: "#FFF", size: 16});
    renderer.drawText(`LEVEL: ${this.level}`, renderer.getWidth() / 2, 26, {color: "#FFF", size: 16, align: "center"});
    renderer.drawText(`LIVES:`, renderer.getWidth() - 140, 26, {color: "#FFF", size: 16});
    for (let i = 0; i < this.lives; i++) {
        renderer.drawCircle(renderer.getWidth() - 80 + i * 14, 20, 5, "#8BC34A", true);
    }
    
    if (this.gameOver) {
      renderer.drawRect(0, renderer.getHeight()/2 - 40, renderer.getWidth(), 80, "rgba(0,0,0,0.8)", true);
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
