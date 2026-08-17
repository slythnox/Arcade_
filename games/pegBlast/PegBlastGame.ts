import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
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

interface Popup {
  x: number;
  y: number;
  text: string;
  life: number;
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
  private bucketY: number = 650; // Modified for 700 canvas height
  private bucketWidth: number = 100;
  private bucketHeight: number = 40;
  private bucketDir: number = 1;
  private bucketSpeed: number = 150;

  private ballTrail: {x: number, y: number}[] = [];
  private popups: Popup[] = [];
  private time: number = 0;
  private stars: {x: number, y: number}[] = [];
  
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
    this.time = 0;
    this.stars = [];
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: this.ctx.random.next() * 600,
        y: this.ctx.random.next() * 700
      });
    }
    this.loadLevel();
  }
  
  private loadLevel(): void {
    this.pegs = [];
    this.ballActive = false;
    this.ballTrail = [];
    this.popups = [];
    this.aimAngle = Math.PI / 2;
    
    const cols = 10 + this.level;
    const rows = 5 + Math.floor(this.level / 2);
    
    const orangesToPlace = 10 + this.level;
    
    const positions: Vector2[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = 50 + c * (500 / cols) + (r % 2) * 15;
        const y = 150 + r * 45;
        if (x < 550) {
          positions.push(new Vector2(x, y));
        }
      }
    }
    
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
    this.time += deltaTime;

    for (let i = this.popups.length - 1; i >= 0; i--) {
      this.popups[i].life -= deltaTime;
      this.popups[i].y -= deltaTime * 30;
      if (this.popups[i].life <= 0) {
        this.popups.splice(i, 1);
      }
    }
    
    // Update bucket (Canvas is 600 wide)
    this.bucketX += this.bucketDir * this.bucketSpeed * deltaTime;
    if (this.bucketX < 0) {
      this.bucketX = 0;
      this.bucketDir = 1;
    }
    if (this.bucketX > 600 - this.bucketWidth) {
      this.bucketX = 600 - this.bucketWidth;
      this.bucketDir = -1;
    }
    
    if (this.ballActive) {
      this.ballTrail.push({ x: this.ballPos.x, y: this.ballPos.y });
      if (this.ballTrail.length > 8) {
        this.ballTrail.shift();
      }

      // Gravity
      this.ballVel.y += 480 * deltaTime;
      this.ballPos = this.ballPos.add(this.ballVel.mul(deltaTime));
      
      // Wall collision
      if (this.ballPos.x - this.ballRadius < 0) {
        this.ballPos.x = this.ballRadius;
        this.ballVel.x *= -0.8;
      } else if (this.ballPos.x + this.ballRadius > 600) {
        this.ballPos.x = 600 - this.ballRadius;
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
        this.popups.push({ x: this.ballPos.x, y: this.ballPos.y, text: "FREE BALL!", life: 1.5 });
        this.endBall();
      } else if (this.ballPos.y > 700) {
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
            let pts = 10;
            if (peg.isOrange) {
              pts = 100;
            }
            this.score += pts;
            this.popups.push({ x: peg.pos.x, y: peg.pos.y, text: `+${pts}`, life: 0.8 });
            this.ctx.audio.playDrop();
          }
        }
      }
    }
  }
  
  private endBall(): void {
    this.ballActive = false;
    this.ballTrail = [];
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
          this.ballPos = new Vector2(300, 50);
          this.ballVel = new Vector2(Math.cos(this.aimAngle), Math.sin(this.aimAngle)).mul(600);
          this.ctx.audio.playMove();
        }
        break;
    }
  }
  
  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Background
    pr.clear("#050918");
    for (const star of this.stars) {
      pr.drawRect(star.x, star.y, 2, 2, "#FFFFFF", true);
    }
    
    // Trajectory dots
    if (!this.ballActive) {
      let simX = 300;
      let simY = 50;
      const simVx = Math.cos(this.aimAngle) * 600;
      let simVy = Math.sin(this.aimAngle) * 600;
      const stepDt = 0.03;
      
      for (let i = 0; i < 20; i++) {
        simVy += 480 * stepDt;
        simX += simVx * stepDt;
        simY += simVy * stepDt;
        if (simX < 0 || simX > 600 || simY > 700) break;
        
        const size = Math.max(1, 4 - i * 0.15);
        pr.drawCircle(simX, simY, size, `rgba(255, 255, 255, ${0.8 - i*0.03})`, true);
      }
    }
    
    // Cannon
    rawCtx.save();
    rawCtx.translate(300, 50);
    rawCtx.rotate(this.aimAngle - Math.PI/2);
    pr.drawRect(-12, 0, 24, 40, "#555", true);
    pr.drawRect(-10, 0, 20, 40, "#777", true);
    pr.drawCircle(0, 0, 20, "#444", true);
    pr.drawCircle(0, 0, 15, "#666", true);
    rawCtx.restore();
    
    // Bucket (Trapezoid container)
    rawCtx.save();
    rawCtx.fillStyle = "#228822";
    rawCtx.beginPath();
    rawCtx.moveTo(this.bucketX, this.bucketY);
    rawCtx.lineTo(this.bucketX + this.bucketWidth, this.bucketY);
    rawCtx.lineTo(this.bucketX + this.bucketWidth - 10, this.bucketY + this.bucketHeight);
    rawCtx.lineTo(this.bucketX + 10, this.bucketY + this.bucketHeight);
    rawCtx.closePath();
    rawCtx.fill();
    rawCtx.strokeStyle = "#44FF44";
    rawCtx.lineWidth = 3;
    rawCtx.stroke();
    rawCtx.restore();
    
    // Pegs with glow
    for (const peg of this.pegs) {
      rawCtx.save();
      rawCtx.shadowBlur = 8;
      rawCtx.shadowColor = peg.isOrange ? '#FF6B00' : '#0077FF';
      if (peg.isOrange) {
        pr.drawCircle(peg.pos.x, peg.pos.y, peg.radius + (peg.hit ? 4 : 0), peg.hit ? "#FFC" : "#FF6B00", true);
      } else {
        pr.drawCircle(peg.pos.x, peg.pos.y, peg.radius + (peg.hit ? 4 : 0), peg.hit ? "#CFF" : "#0077FF", true);
      }
      rawCtx.restore();
    }
    
    // Ball & trail
    if (this.ballActive) {
      for (let i = 0; i < this.ballTrail.length; i++) {
        const t = this.ballTrail[i];
        const alpha = (i + 1) / this.ballTrail.length;
        pr.drawCircle(t.x, t.y, this.ballRadius * alpha, `rgba(255, 255, 0, ${alpha * 0.5})`, true);
      }
      pr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius, "#FFFF00", true);
    }
    
    // Popups
    for (const p of this.popups) {
      rawCtx.save();
      rawCtx.globalAlpha = p.life;
      pr.drawText(p.text, p.x, p.y, { size: 16, color: "#FFF", align: "center", shadowBlur: 4, shadowColor: "#000" });
      rawCtx.restore();
    }
    
    // HUD
    pr.drawText(`Score: ${this.score}`, 10, 20, { size: 16, color: "#FFF" });
    pr.drawText(`Level: ${this.level}`, 10, 40, { size: 16, color: "#FFF" });
    pr.drawText(`Balls: ${this.ballsLeft}`, w - 80, 20, { size: 16, color: "#FFF" });
    
    if (this.gameOver) {
      pr.drawRect(0, h/2 - 40, w, 80, "rgba(0,0,0,0.8)", true);
      pr.drawText("GAME OVER", w / 2, h / 2, { size: 32, color: "#F00", align: "center" });
    }
  }
  
  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.ballsLeft; }
}
