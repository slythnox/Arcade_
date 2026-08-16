import type { GameInstance } from '../types';
import type { GameContext } from '../../engine/GameContext';
import type { Renderer } from '../../engine/rendering/Renderer';
import type { PixelRenderer } from '../../engine/rendering/PixelRenderer';
import type { GameAction } from '../../core/types/game';

interface Platform { x: number; y: number; w: number; h: number; }
interface Ring { x: number; y: number; collected: boolean; }
interface Hazard { x: number; y: number; w: number; h: number; }

export class VelocityRushGame implements GameInstance {
  private ctx!: GameContext;
  
  private score = 0;
  private level = 1;
  private lives = 3;
  private gameOver = false;
  private isPaused = false;
  private won = false;
  
  private pX = 150;
  private pY = 400;
  private vX = 0;
  private vY = 0;
  private cameraX = 0;
  private pW = 16;
  private pH = 24;
  private isGrounded = false;
  private frameCount = 0;
  
  private moveLeft = false;
  private moveRight = false;
  private moveJump = false;
  
  private gravity = 1400;
  private jumpVel = -680;
  
  private platforms: Platform[] = [];
  private rings: Ring[] = [];
  private hazards: Hazard[] = [];
  private levelEndX = 4500;
  private timeInLevel = 0;
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }
  
  public reset(seed?: number): void {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.won = false;
    this.isPaused = false;
    this.loadLevel(this.level);
  }
  
  private loadLevel(lv: number) {
    this.pX = 150;
    this.pY = 400;
    this.vX = 0;
    this.vY = 0;
    this.cameraX = 0;
    this.platforms = [];
    this.rings = [];
    this.hazards = [];
    this.timeInLevel = 0;
    this.levelEndX = 4500 + (lv - 1) * 1000;
    
    // Generate basic ground
    this.platforms.push({ x: 0, y: 580, w: this.levelEndX + 500, h: 120 });
    
    // Generate some platforms and rings
    for (let i = 0; i < 10 + lv * 5; i++) {
      let px = 400 + i * 300 + (Math.random() * 100);
      let py = 350 + (Math.random() * 150);
      this.platforms.push({ x: px, y: py, w: 100 + Math.random() * 100, h: 20 });
      this.rings.push({ x: px + 50, y: py - 40, collected: false });
      if (Math.random() < 0.3 * lv) {
        this.hazards.push({ x: px + 20, y: py - 20, w: 20, h: 20 });
      }
    }
  }
  
  public update(dt: number): void {
    if (this.gameOver || this.isPaused || this.won) return;
    this.frameCount += dt * 10;
    this.timeInLevel += dt;
    
    if (this.moveLeft) this.vX -= 2000 * dt;
    if (this.moveRight) this.vX += 2000 * dt;
    
    this.vY += this.gravity * dt;
    
    if (this.isGrounded) {
      this.vX *= 0.88;
    } else {
      this.vX *= 0.985;
    }
    
    if (this.moveJump && this.isGrounded) {
      this.vY = this.jumpVel;
      this.isGrounded = false;
      this.ctx.audio.playMove();
    }
    
    this.pX += this.vX * dt;
    this.pY += this.vY * dt;
    
    if (this.pX < 0) { this.pX = 0; this.vX = 0; }
    
    this.isGrounded = false;
    for (const p of this.platforms) {
      if (this.pX + this.pW > p.x && this.pX < p.x + p.w &&
          this.pY + this.pH > p.y && this.pY < p.y + p.h) {
        if (this.vY > 0 && this.pY + this.pH - this.vY * dt <= p.y + 5) {
          this.pY = p.y - this.pH;
          this.vY = 0;
          this.isGrounded = true;
        } else if (this.vY < 0 && this.pY - this.vY * dt >= p.y + p.h - 5) {
          this.pY = p.y + p.h;
          this.vY = 0;
        } else if (this.vX > 0) {
          this.pX = p.x - this.pW;
          this.vX = 0;
        } else if (this.vX < 0) {
          this.pX = p.x + p.w;
          this.vX = 0;
        }
      }
    }
    
    for (const r of this.rings) {
      if (!r.collected && Math.hypot(this.pX + this.pW/2 - r.x, this.pY + this.pH/2 - r.y) < 25) {
        r.collected = true;
        this.score += 10;
        this.ctx.audio.playCoin();
      }
    }
    
    for (const h of this.hazards) {
      if (this.pX + this.pW > h.x && this.pX < h.x + h.w &&
          this.pY + this.pH > h.y && this.pY < h.y + h.h) {
        this.die();
        return;
      }
    }
    
    if (this.pY > 800) {
      this.die();
      return;
    }
    
    if (this.pX >= this.levelEndX) {
      this.score += Math.max(0, 500 - Math.floor(this.timeInLevel) * 10);
      this.level++;
      if (this.level > 5) {
        this.won = true;
        this.ctx.audio.playVictory();
      } else {
        this.ctx.audio.playPowerUp();
        this.loadLevel(this.level);
      }
    }
    
    const targetCamX = this.pX - 150;
    this.cameraX += (targetCamX - this.cameraX) * 5 * dt;
    if (this.cameraX < 0) this.cameraX = 0;
  }
  
  private die(): void {
    this.lives--;
    this.ctx.audio.playHit();
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.audio.playGameOver();
      this.ctx.session.setStatus("game-over");
    } else {
      this.loadLevel(this.level);
    }
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "ACTION_PRIMARY" || action === "MOVE_UP") this.moveJump = isPressed;
    if (action === "RESTART" && isPressed) this.reset();
  }
  
  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }
  
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    
    const grad = rawCtx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, "#1A237E");
    grad.addColorStop(1, "#64B5F6");
    rawCtx.fillStyle = grad;
    rawCtx.fillRect(0, 0, w, h);
    
    pr.save();
    pr.translate(-Math.floor(this.cameraX), 0);
    
    for (const p of this.platforms) {
      pr.drawPixelRect(p.x, p.y, p.w, p.h, "#4CAF50", "#81C784", "#388E3C");
    }
    
    for (const r of this.rings) {
      if (!r.collected) {
        pr.drawCircle(r.x, r.y, 10, "#FFD700", true);
        pr.drawCircle(r.x, r.y, 6, "#FFF59D", true);
      }
    }
    
    for (const h of this.hazards) {
      rawCtx.beginPath();
      rawCtx.moveTo(h.x + h.w/2, h.y);
      rawCtx.lineTo(h.x, h.y + h.h);
      rawCtx.lineTo(h.x + h.w, h.y + h.h);
      rawCtx.closePath();
      rawCtx.fillStyle = "#F44336";
      rawCtx.fill();
    }
    
    for (let cx = 0; cx < 5; cx++) {
      for (let cy = 0; cy < 10; cy++) {
        pr.drawRect(this.levelEndX + cx * 20, 380 + cy * 20, 20, 20, (cx + cy) % 2 === 0 ? "#FFF" : "#000", true);
      }
    }
    
    const legOffset = Math.sin(this.frameCount) * 5;
    pr.drawRect(this.pX, this.pY, this.pW, this.pH, "#2196F3", true);
    if (!this.isGrounded) {
      pr.drawRect(this.pX + 2, this.pY + this.pH, 4, 6, "#1976D2", true);
      pr.drawRect(this.pX + 10, this.pY + this.pH, 4, 6, "#1976D2", true);
    } else if (Math.abs(this.vX) > 10) {
      pr.drawRect(this.pX + 2, this.pY + this.pH + legOffset, 4, 6, "#1976D2", true);
      pr.drawRect(this.pX + 10, this.pY + this.pH - legOffset, 4, 6, "#1976D2", true);
    } else {
      pr.drawRect(this.pX + 2, this.pY + this.pH, 4, 6, "#1976D2", true);
      pr.drawRect(this.pX + 10, this.pY + this.pH, 4, 6, "#1976D2", true);
    }
    pr.drawRect(this.pX + 2, this.pY - 8, 12, 10, "#FFCDD2", true);
    
    pr.restore();
    
    pr.drawText(`SCORE: ${this.score}   LIVES: ${this.lives}   LEVEL: ${this.level}`, 10, 20, { size: 16, color: "#FFF" });
    const speedBar = Math.min(200, Math.abs(this.vX) / 10);
    pr.drawRect(10, 30, 200, 10, "#333", true);
    pr.drawRect(10, 30, speedBar, 10, "#00FF00", true);
    
    if (this.timeInLevel < 3 && this.level === 1) {
      pr.drawText("ARROW KEYS MOVE, SPACE JUMP", w/2, h/2, { size: 20, color: "#FFF", align: "center" });
    }
    
    if (this.gameOver) {
      pr.drawText("GAME OVER", w/2, h/2, { size: 40, color: "#F00", align: "center" });
    } else if (this.won) {
      pr.drawText("YOU WIN!", w/2, h/2, { size: 40, color: "#0F0", align: "center" });
    }
  }
}
