import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface Barrel {
  x: number;
  y: number;
  floor: number;
  dir: number;
  active: boolean;
}

export class DonkeyClimbGame implements GameInstance {
  private ctx!: GameContext;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  
  private playerX: number = 100;
  private playerY: number = 500;
  private playerVY: number = 0;
  private isJumping: boolean = false;
  private playerFloor: number = 0;
  
  private barrels: Barrel[] = [];
  private barrelSpawnTimer: number = 0;
  
  // 4 floors, y coords
  private floors = [500, 400, 300, 200];
  
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
    this.resetLevel();
  }
  
  private resetLevel(): void {
    this.playerX = 100;
    this.playerFloor = 0;
    this.playerY = this.floors[0];
    this.playerVY = 0;
    this.isJumping = false;
    this.barrels = [];
    this.barrelSpawnTimer = 0;
  }
  
  public update(deltaTime: number): void {
    if (this.isPaused || this.gameOver) return;
    
    // Player jump physics
    if (this.isJumping) {
      this.playerVY += 1200 * deltaTime;
      this.playerY += this.playerVY * deltaTime;
      const groundY = this.floors[this.playerFloor];
      if (this.playerY >= groundY) {
        this.playerY = groundY;
        this.isJumping = false;
        this.playerVY = 0;
      }
    }
    
    // Barrels
    this.barrelSpawnTimer += deltaTime;
    const spawnRate = Math.max(1.0, 3.0 - this.level * 0.2);
    if (this.barrelSpawnTimer > spawnRate) {
      this.barrelSpawnTimer = 0;
      this.barrels.push({
        x: 150,
        y: this.floors[3],
        floor: 3,
        dir: 1,
        active: true
      });
    }
    
    const barrelSpeed = 100 + this.level * 10;
    
    for (let b of this.barrels) {
      if (!b.active) continue;
      
      b.x += b.dir * barrelSpeed * deltaTime;
      
      // Roll off edge
      if (b.dir === 1 && b.x > 700) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floors[b.floor];
          b.dir = -1;
        } else {
          b.active = false;
        }
      } else if (b.dir === -1 && b.x < 100) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floors[b.floor];
          b.dir = 1;
        } else {
          b.active = false;
        }
      }
      
      // Collision
      if (Math.abs(b.x - this.playerX) < 20 && Math.abs(b.y - this.playerY) < 20) {
        this.die();
        return;
      }
      
      // Jump bonus
      if (this.isJumping && Math.abs(b.x - this.playerX) < 20 && this.playerY < b.y - 20) {
        this.score += 100;
        this.ctx.audio.playRotate(); // jump over sound
      }
    }
    
    this.barrels = this.barrels.filter(b => b.active);
    
    // Win condition
    if (this.playerFloor === 3 && this.playerX < 200) {
      this.score += 1000;
      this.level++;
      this.ctx.audio.playLineClear();
      this.resetLevel();
    }
  }
  
  private die(): void {
    this.lives--;
    this.ctx.audio.playGameOver();
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      this.resetLevel();
    }
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;
    
    switch (action) {
      case "MOVE_LEFT":
        if (!this.isJumping) {
          this.playerX -= 15;
          if (this.playerX < 100) this.playerX = 100;
          this.ctx.audio.playMove();
        }
        break;
      case "MOVE_RIGHT":
        if (!this.isJumping) {
          this.playerX += 15;
          if (this.playerX > 700) this.playerX = 700;
          this.ctx.audio.playMove();
        }
        break;
      case "MOVE_UP":
        // simple ladder logic
        if (!this.isJumping) {
          if (this.playerX > 600 && this.playerX < 650 && this.playerFloor % 2 === 0 && this.playerFloor < 3) {
            this.playerFloor++;
            this.playerY = this.floors[this.playerFloor];
          } else if (this.playerX > 150 && this.playerX < 200 && this.playerFloor % 2 === 1 && this.playerFloor < 3) {
            this.playerFloor++;
            this.playerY = this.floors[this.playerFloor];
          }
        }
        break;
      case "MOVE_DOWN":
        if (!this.isJumping && this.playerFloor > 0) {
          if (this.playerX > 600 && this.playerX < 650 && (this.playerFloor - 1) % 2 === 0) {
            this.playerFloor--;
            this.playerY = this.floors[this.playerFloor];
          } else if (this.playerX > 150 && this.playerX < 200 && (this.playerFloor - 1) % 2 === 1) {
            this.playerFloor--;
            this.playerY = this.floors[this.playerFloor];
          }
        }
        break;
      case "ACTION_PRIMARY":
        if (!this.isJumping) {
          this.isJumping = true;
          this.playerVY = -400;
          this.ctx.audio.playRotate();
        }
        break;
    }
  }
  
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#000");
    
    // Draw Girders
    for (let i = 0; i < 4; i++) {
      pr.drawRect(80, this.floors[i] + 16, 640, 16, "#4682B4", true);
    }
    
    // Draw Ladders
    pr.drawRect(620, this.floors[1] + 16, 20, 100, "#DAA520", false);
    pr.drawRect(170, this.floors[2] + 16, 20, 100, "#DAA520", false);
    pr.drawRect(620, this.floors[3] + 16, 20, 100, "#DAA520", false);
    
    // Draw Ape
    pr.drawPixelBlock(100, this.floors[3] - 40, 40, "#8B4513", "#A0522D", "#5C2E0B");
    
    // Draw Player
    pr.drawPixelBlock(this.playerX, this.playerY - 16, 16, "#FF4500", "#FF6347", "#8B0000");
    
    // Draw Barrels
    for (let b of this.barrels) {
      pr.drawPixelBlock(b.x, b.y - 12, 12, "#CD853F", "#DEB887", "#8B4513");
    }
    
    // HUD
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
