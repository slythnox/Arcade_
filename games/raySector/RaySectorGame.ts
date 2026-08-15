import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { GameAction } from "../../core/types/game";

const MAP: number[][] = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,1,2,1,1,1,2,1,1,1,2,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,1,2,1,1,1,2,1,1,1,2,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,0,0,2,0,0,0,2,0,0,0,2,0,0,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,1,2,1,1,1,2,1,1,1,2,1,1,1,1,1],
  [1,0,0,0,1,0,0,0,1,0,0,0,1,0,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

interface Enemy {
  x: number;
  y: number;
  type: number; // 0=guard, 1=soldier, 2=boss
  active: boolean;
  hp: number;
}

export class RaySectorGame implements GameInstance {
  private ctx!: GameContext;
  private posX: number = 1.5;
  private posY: number = 1.5;
  private dirX: number = 1;
  private dirY: number = 0;
  private planeX: number = 0;
  private planeY: number = 0.66;
  
  private moveSpeed = 3.0;
  private rotSpeed = 2.0;
  
  private movingForward = false;
  private movingBackward = false;
  private turningLeft = false;
  private turningRight = false;
  private isShooting = false;
  
  private enemies: Enemy[] = [];
  
  private level: number = 1;
  private score: number = 0;
  private lives: number = 3;
  private paused: boolean = false;
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  
  public reset(seed?: number): void {
    this.posX = 1.5;
    this.posY = 1.5;
    this.dirX = 1;
    this.dirY = 0;
    this.planeX = 0;
    this.planeY = 0.66;
    this.level = 1;
    this.score = 0;
    this.lives = 3;
    
    this.enemies = [
      { x: 3.5, y: 3.5, type: 0, active: true, hp: 10 },
      { x: 10.5, y: 10.5, type: 1, active: true, hp: 20 },
      { x: 14.5, y: 14.5, type: 2, active: true, hp: 50 },
    ];
  }
  
  public update(deltaTime: number): void {
    if (this.paused) return;
    
    if (this.movingForward) {
      if (MAP[Math.floor(this.posY)][Math.floor(this.posX + this.dirX * this.moveSpeed * deltaTime)] === 0) {
        this.posX += this.dirX * this.moveSpeed * deltaTime;
      }
      if (MAP[Math.floor(this.posY + this.dirY * this.moveSpeed * deltaTime)][Math.floor(this.posX)] === 0) {
        this.posY += this.dirY * this.moveSpeed * deltaTime;
      }
    }
    if (this.movingBackward) {
      if (MAP[Math.floor(this.posY)][Math.floor(this.posX - this.dirX * this.moveSpeed * deltaTime)] === 0) {
        this.posX -= this.dirX * this.moveSpeed * deltaTime;
      }
      if (MAP[Math.floor(this.posY - this.dirY * this.moveSpeed * deltaTime)][Math.floor(this.posX)] === 0) {
        this.posY -= this.dirY * this.moveSpeed * deltaTime;
      }
    }
    
    if (this.turningLeft) {
      const oldDirX = this.dirX;
      this.dirX = this.dirX * Math.cos(this.rotSpeed * deltaTime) - this.dirY * Math.sin(this.rotSpeed * deltaTime);
      this.dirY = oldDirX * Math.sin(this.rotSpeed * deltaTime) + this.dirY * Math.cos(this.rotSpeed * deltaTime);
      const oldPlaneX = this.planeX;
      this.planeX = this.planeX * Math.cos(this.rotSpeed * deltaTime) - this.planeY * Math.sin(this.rotSpeed * deltaTime);
      this.planeY = oldPlaneX * Math.sin(this.rotSpeed * deltaTime) + this.planeY * Math.cos(this.rotSpeed * deltaTime);
    }
    if (this.turningRight) {
      const oldDirX = this.dirX;
      this.dirX = this.dirX * Math.cos(-this.rotSpeed * deltaTime) - this.dirY * Math.sin(-this.rotSpeed * deltaTime);
      this.dirY = oldDirX * Math.sin(-this.rotSpeed * deltaTime) + this.dirY * Math.cos(-this.rotSpeed * deltaTime);
      const oldPlaneX = this.planeX;
      this.planeX = this.planeX * Math.cos(-this.rotSpeed * deltaTime) - this.planeY * Math.sin(-this.rotSpeed * deltaTime);
      this.planeY = oldPlaneX * Math.sin(-this.rotSpeed * deltaTime) + this.planeY * Math.cos(-this.rotSpeed * deltaTime);
    }
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    switch (action) {
      case "MOVE_UP":
        this.movingForward = isPressed;
        break;
      case "MOVE_DOWN":
        this.movingBackward = isPressed;
        break;
      case "MOVE_LEFT":
        this.turningLeft = isPressed;
        break;
      case "MOVE_RIGHT":
        this.turningRight = isPressed;
        break;
      case "ACTION_PRIMARY":
        if (isPressed && !this.isShooting) {
          this.shoot();
        }
        this.isShooting = isPressed;
        break;
    }
  }
  
  private shoot(): void {
    for (let e of this.enemies) {
      if (!e.active) continue;
      const dx = e.x - this.posX;
      const dy = e.y - this.posY;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist < 5.0) {
        const dot = (dx/dist)*this.dirX + (dy/dist)*this.dirY;
        if (dot > 0.95) {
          e.hp -= 10;
          if (e.hp <= 0) {
            e.active = false;
            this.score += 100;
          }
          break;
        }
      }
    }
  }
  
  public render(renderer: Renderer): void {
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    
    // Ceiling & Floor
    renderer.drawRect(0, 0, w, h/2, "#333333", true);
    renderer.drawRect(0, h/2, w, h/2, "#555555", true);
    
    // Z-Buffer
    const zBuffer: number[] = new Array(w).fill(0);
    
    for (let x = 0; x < w; x++) {
      const cameraX = 2 * x / w - 1;
      const rayDirX = this.dirX + this.planeX * cameraX;
      const rayDirY = this.dirY + this.planeY * cameraX;
      
      let mapX = Math.floor(this.posX);
      let mapY = Math.floor(this.posY);
      
      let sideDistX;
      let sideDistY;
      
      let deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
      let deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);
      let perpWallDist;
      
      let stepX;
      let stepY;
      let hit = 0;
      let side = 0; // 0=NS, 1=EW
      
      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (this.posX - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - this.posX) * deltaDistX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (this.posY - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - this.posY) * deltaDistY;
      }
      
      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        if (MAP[mapY] && MAP[mapY][mapX] > 0) {
          hit = MAP[mapY][mapX];
        }
      }
      
      if (side === 0) perpWallDist = (mapX - this.posX + (1 - stepX) / 2) / rayDirX;
      else perpWallDist = (mapY - this.posY + (1 - stepY) / 2) / rayDirY;
      
      zBuffer[x] = perpWallDist;
      
      const lineHeight = Math.floor(h / perpWallDist);
      let drawStart = -lineHeight / 2 + h / 2;
      if (drawStart < 0) drawStart = 0;
      let drawEnd = lineHeight / 2 + h / 2;
      if (drawEnd >= h) drawEnd = h - 1;
      
      let color = (hit === 1) ? "rgba(100, 100, 180, 1)" : "rgba(200, 150, 50, 1)";
      if (side === 1) {
        color = (hit === 1) ? "rgba(70, 70, 126, 1)" : "rgba(140, 105, 35, 1)";
      }
      
      renderer.drawRect(x, drawStart, 1, drawEnd - drawStart, color, true);
    }
    
    const sortedEnemies = [...this.enemies].sort((a,b) => {
      return ((b.x-this.posX)**2 + (b.y-this.posY)**2) - ((a.x-this.posX)**2 + (a.y-this.posY)**2);
    });
    
    for (let i = 0; i < sortedEnemies.length; i++) {
      const sprite = sortedEnemies[i];
      if (!sprite.active) continue;
      
      const spriteX = sprite.x - this.posX;
      const spriteY = sprite.y - this.posY;
      
      const invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
      const transformX = invDet * (this.dirY * spriteX - this.dirX * spriteY);
      const transformY = invDet * (-this.planeY * spriteX + this.planeX * spriteY);
      
      const spriteScreenX = Math.floor((w / 2) * (1 + transformX / transformY));
      const spriteHeight = Math.abs(Math.floor(h / transformY));
      
      let drawStartY = -spriteHeight / 2 + h / 2;
      if (drawStartY < 0) drawStartY = 0;
      let drawEndY = spriteHeight / 2 + h / 2;
      if (drawEndY >= h) drawEndY = h - 1;
      
      const spriteWidth = Math.abs(Math.floor(h / transformY));
      let drawStartX = -spriteWidth / 2 + spriteScreenX;
      if (drawStartX < 0) drawStartX = 0;
      let drawEndX = spriteWidth / 2 + spriteScreenX;
      if (drawEndX >= w) drawEndX = w - 1;
      
      if (transformY > 0) {
        for (let stripe = Math.floor(drawStartX); stripe < drawEndX; stripe++) {
          if (transformY < zBuffer[stripe]) {
            renderer.drawRect(stripe, drawStartY, 1, drawEndY - drawStartY, "#FF0000", true);
          }
        }
      }
    }
    
    renderer.drawRect(w/2 - 20, h - 60, 40, 60, "#888888", true);
    renderer.drawText(`Score: ${this.score}`, 10, 20);
  }
  
  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
}
