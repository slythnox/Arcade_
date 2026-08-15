import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { CanvasRenderer } from "../../engine/rendering/CanvasRenderer";
import type { GameAction } from "../../core/types/game";

class Vector2 {
  constructor(public x: number, public y: number) {}
  add(v: Vector2) { return new Vector2(this.x + v.x, this.y + v.y); }
  sub(v: Vector2) { return new Vector2(this.x - v.x, this.y - v.y); }
  mul(s: number) { return new Vector2(this.x * s, this.y * s); }
  mag() { return Math.sqrt(this.x * this.x + this.y * this.y); }
  norm() {
    const m = this.mag();
    if (m === 0) return new Vector2(0, 0);
    return new Vector2(this.x / m, this.y / m);
  }
  dot(v: Vector2) { return this.x * v.x + this.y * v.y; }
  dist(v: Vector2) { return this.sub(v).mag(); }
}

interface Peg {
  pos: Vector2;
  radius: number;
  isOrange: boolean;
  hit: boolean;
}

export class PegBlastGame implements GameInstance {
  private ctx!: GameContext;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private maxLevel: number = 15;
  
  private pegs: Peg[] = [];
  private ballsLeft: number = 10;
  
  private aimAngle: number = Math.PI / 2;
  
  private ballActive: boolean = false;
  private ballPos: Vector2 = new Vector2(0,0);
  private ballVel: Vector2 = new Vector2(0,0);
  private ballRadius: number = 6;
  
  private bucketX: number = 0;
  private bucketY: number = 550;
  private bucketWidth: number = 80;
  private bucketHeight: number = 30;
  private bucketDir: number = 1;
  private bucketSpeed: number = 150;
  
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
    this.ballsLeft = 10;
    this.loadLevel();
  }
  
  private loadLevel(): void {
    this.pegs = [];
    this.ballActive = false;
    this.aimAngle = Math.PI / 2;
    
    // Generate a simple pattern based on level
    const cols = 10 + this.level;
    const rows = 5 + Math.floor(this.level / 2);
    
    const orangesToPlace = 10 + this.level;
    
    const positions: Vector2[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 100 + c * 50 + (r % 2) * 25;
        const y = 100 + r * 45;
        if (x < 700) {
          positions.push(new Vector2(x, y));
        }
      }
    }
    
    // randomly pick oranges
    const shuffled = this.ctx.random.shuffle(positions);
    
    for (let i = 0; i < shuffled.length; i++) {
      this.pegs.push({
        pos: shuffled[i],
        radius: 10,
        isOrange: i < orangesToPlace,
        hit: false
      });
    }
  }
  
  public update(deltaTime: number): void {
    if (this.isPaused || this.gameOver) return;
    
    // Update bucket
    this.bucketX += this.bucketDir * this.bucketSpeed * deltaTime;
    if (this.bucketX < 0) {
      this.bucketX = 0;
      this.bucketDir = 1;
    }
    if (this.bucketX > 800 - this.bucketWidth) {
      this.bucketX = 800 - this.bucketWidth;
      this.bucketDir = -1;
    }
    
    if (this.ballActive) {
      // Gravity
      this.ballVel.y += 480 * deltaTime;
      this.ballPos = this.ballPos.add(this.ballVel.mul(deltaTime));
      
      // Wall collision
      if (this.ballPos.x - this.ballRadius < 0) {
        this.ballPos.x = this.ballRadius;
        this.ballVel.x *= -0.8;
      } else if (this.ballPos.x + this.ballRadius > 800) {
        this.ballPos.x = 800 - this.ballRadius;
        this.ballVel.x *= -0.8;
      }
      
      if (this.ballPos.y - this.ballRadius < 0) {
        this.ballPos.y = this.ballRadius;
        this.ballVel.y *= -0.8;
      }
      
      // Bucket collision
      if (
        this.ballPos.y + this.ballRadius > this.bucketY &&
        this.ballPos.y - this.ballRadius < this.bucketY + this.bucketHeight &&
        this.ballPos.x > this.bucketX &&
        this.ballPos.x < this.bucketX + this.bucketWidth
      ) {
        this.score += 500;
        this.ballsLeft++;
        this.ctx.audio.playLineClear();
        this.endBall();
      } else if (this.ballPos.y > 600) {
        this.endBall();
      }
      
      // Peg collisions
      for (const peg of this.pegs) {
        if (!peg.hit) {
          const dist = this.ballPos.dist(peg.pos);
          if (dist < this.ballRadius + peg.radius) {
            // Reflect
            const n = this.ballPos.sub(peg.pos).norm();
            const vDotN = this.ballVel.dot(n);
            this.ballVel = this.ballVel.sub(n.mul(2 * vDotN)).mul(0.8);
            
            // Push out to avoid sticking
            this.ballPos = peg.pos.add(n.mul(this.ballRadius + peg.radius));
            
            peg.hit = true;
            if (peg.isOrange) {
              this.score += 100;
            } else {
              this.score += 10;
            }
            this.ctx.audio.playDrop();
          }
        }
      }
    }
  }
  
  private endBall(): void {
    this.ballActive = false;
    // Remove hit pegs
    const remainingOrange = this.pegs.filter(p => p.isOrange && !p.hit).length;
    this.pegs = this.pegs.filter(p => !p.hit);
    
    if (remainingOrange === 0) {
      this.level++;
      if (this.level > this.maxLevel) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      } else {
        this.loadLevel();
      }
    } else if (this.ballsLeft <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playGameOver();
    }
  }
  
  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;
    
    switch (action) {
      case "MOVE_LEFT":
        if (!this.ballActive) {
          this.aimAngle -= 0.1;
          if (this.aimAngle < Math.PI / 8) this.aimAngle = Math.PI / 8;
        }
        break;
      case "MOVE_RIGHT":
        if (!this.ballActive) {
          this.aimAngle += 0.1;
          if (this.aimAngle > 7 * Math.PI / 8) this.aimAngle = 7 * Math.PI / 8;
        }
        break;
      case "ACTION_PRIMARY":
        if (!this.ballActive && this.ballsLeft > 0) {
          this.ballActive = true;
          this.ballsLeft--;
          this.ballPos = new Vector2(400, 30);
          this.ballVel = new Vector2(Math.cos(this.aimAngle), Math.sin(this.aimAngle)).mul(600);
          this.ctx.audio.playMove();
        }
        break;
    }
  }
  
  public render(renderer: Renderer): void {
    const cr = renderer as CanvasRenderer;
    cr.clear("#001a33");
    
    const w = cr.getWidth();
    const h = cr.getHeight();
    
    // Launcher
    cr.drawRect(390, 0, 20, 30, "#666", true);
    if (!this.ballActive) {
      const endX = 400 + Math.cos(this.aimAngle) * 50;
      const endY = 30 + Math.sin(this.aimAngle) * 50;
      cr.drawLine(400, 30, endX, endY, "#FFF", 2);
    }
    
    // Bucket
    cr.drawRect(this.bucketX, this.bucketY, this.bucketWidth, this.bucketHeight, "#0F0", true);
    
    // Pegs
    for (const peg of this.pegs) {
      if (peg.isOrange) {
        cr.drawCircle(peg.pos.x, peg.pos.y, peg.radius + (peg.hit ? 4 : 0), peg.hit ? "#FFC" : "#FF6600", true);
      } else {
        cr.drawCircle(peg.pos.x, peg.pos.y, peg.radius + (peg.hit ? 4 : 0), peg.hit ? "#CFF" : "#0066FF", true);
      }
    }
    
    // Ball
    if (this.ballActive) {
      cr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius, "#FF0", true);
    }
    
    // HUD
    cr.drawText(`Score: ${this.score}`, 10, 20, { size: 16, color: "#FFF" });
    cr.drawText(`Level: ${this.level}`, 10, 40, { size: 16, color: "#FFF" });
    cr.drawText(`Balls: ${this.ballsLeft}`, w - 100, 20, { size: 16, color: "#FFF" });
    
    if (this.gameOver) {
      cr.drawText("GAME OVER", w / 2, h / 2, { size: 32, color: "#F00", align: "center" });
    }
  }
  
  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.ballsLeft; }
}
