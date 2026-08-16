import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";

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
  type: number;
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
  private playerHp: number = 100;
  private paused: boolean = false;
  private gameOver: boolean = false;
  
  private muzzleFlash = 0;
  private swayTimer = 0;
  private shootCooldown = 0;
  private ammo = 99;
  
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
    this.playerHp = 100;
    this.ammo = 99;
    this.gameOver = false;
    this.muzzleFlash = 0;
    this.shootCooldown = 0;
    
    this.enemies = [
      { x: 3.5, y: 3.5, type: 0, active: true, hp: 10 },
      { x: 10.5, y: 10.5, type: 1, active: true, hp: 20 },
      { x: 14.5, y: 14.5, type: 2, active: true, hp: 50 },
    ];
  }
  
  public update(deltaTime: number): void {
    if (this.paused || this.gameOver) return;
    
    if (this.muzzleFlash > 0) this.muzzleFlash -= deltaTime;
    if (this.shootCooldown > 0) this.shootCooldown -= deltaTime;
    
    const isMoving = this.movingForward || this.movingBackward || this.turningLeft || this.turningRight;
    if (isMoving) {
        this.swayTimer += deltaTime;
    } else {
        this.swayTimer = 0;
    }
    
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
    
    // Enemy movement toward player
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = this.posX - e.x; 
      const dy = this.posY - e.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      if (dist > 1.5) { 
          e.x += dx/dist * 1.5 * deltaTime; 
          e.y += dy/dist * 1.5 * deltaTime; 
      }
      if (dist < 0.8) { 
          this.playerHp -= 20 * deltaTime; 
          this.ctx.audio.playHit();
      }
    }
    
    if (this.playerHp <= 0) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
    }
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "RESTART" && isPressed) this.reset();
    if (this.gameOver) return;
    
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
        if (isPressed && !this.isShooting && this.shootCooldown <= 0 && this.ammo > 0) {
          this.shoot();
        }
        this.isShooting = isPressed;
        break;
    }
  }
  
  private shoot(): void {
    this.shootCooldown = 0.3;
    this.muzzleFlash = 0.15;
    this.ammo--;
    this.ctx.audio.playLaser();
    
    for (const e of this.enemies) {
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
            this.ctx.audio.playExplosion();
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
      
      const deltaDistX = (rayDirX === 0) ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = (rayDirY === 0) ? 1e30 : Math.abs(1 / rayDirY);
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
    
    let allEnemiesDead = true;
    let enemyNear = false;
    for (let i = 0; i < sortedEnemies.length; i++) {
      const sprite = sortedEnemies[i];
      if (!sprite.active) continue;
      allEnemiesDead = false;
      
      const distToEnemy = Math.sqrt((sprite.x-this.posX)**2 + (sprite.y-this.posY)**2);
      if (distToEnemy < 8) enemyNear = true;
      
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
            renderer.drawRect(stripe, drawStartY, 1, drawEndY - drawStartY, "#FF2200", true);
          }
        }
      }
    }
    
    // Enemy Indicator
    if (enemyNear) {
        renderer.drawCircle(w/2, 40, 10, "#FF0000", true);
    }
    
    // Gun Barrel Sprite with Sway and Flash
    const gunX = w / 2 - 16;
    const swayOffset = Math.sin(this.swayTimer * 2) * 3;
    const gunY = h - 100 + swayOffset;
    renderer.drawRect(gunX + 12, gunY, 8, 30, "#555555", true);
    renderer.drawRect(gunX + 10, gunY + 20, 12, 35, "#222222", true);
    renderer.drawRect(gunX + 6, gunY + 45, 20, 25, "#885522", true);
    
    if (this.muzzleFlash > 0) {
        renderer.drawRect(w/2 - 4, gunY - 20, 8, 20, "#FFFF00", true);
    }

    // Crosshair in Viewport
    renderer.drawRect(w / 2 - 6, h / 2 - 1, 12, 2, "#00FF00", true);
    renderer.drawRect(w / 2 - 1, h / 2 - 6, 2, 12, "#00FF00", true);

    // Bottom Status Bar HUD
    const hudY = h - 48;
    renderer.drawRect(0, hudY, w, 48, "#0000a8", true);
    renderer.drawRect(0, hudY, w, 3, "#5555ff", true);
    
    // Status Bar Labels & Stats
    renderer.drawText(`LEVEL`, 20, hudY + 14, { color: "#aaaaaa", size: 10 });
    renderer.drawText(`${this.level}`, 20, hudY + 34, { color: "#ffffff", size: 16 });

    renderer.drawText(`SCORE`, 80, hudY + 14, { color: "#aaaaaa", size: 10 });
    renderer.drawText(`${String(this.score).padStart(6, '0')}`, 80, hudY + 34, { color: "#ffd84d", size: 16 });

    // Center Face Box
    const faceBoxX = w / 2 - 20;
    renderer.drawRect(faceBoxX, hudY + 6, 40, 36, "#000055", true);
    renderer.drawRect(faceBoxX, hudY + 6, 40, 36, "#5555ff", false);
    renderer.drawRect(faceBoxX + 10, hudY + 12, 20, 22, "#ffccaa", true);
    renderer.drawRect(faceBoxX + 8, hudY + 10, 24, 6, "#cc9933", true);
    const lookOffset = Math.floor(Math.sin(this.posX * 2) * 2);
    renderer.drawRect(faceBoxX + 13 + lookOffset, hudY + 18, 3, 3, "#0000ff", true);
    renderer.drawRect(faceBoxX + 23 + lookOffset, hudY + 18, 3, 3, "#0000ff", true);
    renderer.drawRect(faceBoxX + 16, hudY + 26, 8, 2, "#aa3333", true);

    renderer.drawText(`HEALTH`, w - 160, hudY + 14, { color: "#aaaaaa", size: 10 });
    const hpColor = this.playerHp > 50 ? "#63e66d" : (this.playerHp > 25 ? "#ffd84d" : "#ff5c8a");
    // HP Bar
    renderer.drawRect(w - 160, hudY + 22, 60, 16, "#333333", true);
    renderer.drawRect(w - 160, hudY + 22, Math.max(0, this.playerHp / 100 * 60), 16, hpColor, true);

    renderer.drawText(`AMMO`, w - 70, hudY + 14, { color: "#aaaaaa", size: 10 });
    renderer.drawText(`${this.ammo}`, w - 70, hudY + 34, { color: "#ffffff", size: 16 });

    if (this.gameOver) {
        renderer.drawRect(0, h/2 - 40, w, 80, "rgba(0,0,0,0.8)", true);
        renderer.drawText("GAME OVER", w/2, h/2 + 10, { color: "#FF0000", size: 40, align: "center" });
    } else if (allEnemiesDead) {
        renderer.drawText("VICTORY!", w/2, h/2, { color: "#00FF00", size: 40, align: "center" });
    }
  }
  
  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
}
