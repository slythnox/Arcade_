import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface MagnetPole {
  pos: Vector2;
  polarity: number; // 1 = positive (red/amber), -1 = negative (blue/cyan)
  radius: number;
}

export class MagnetRunGame implements GameInstance {
  private ctx!: GameContext;
  private shipPos: Vector2 = new Vector2(300, 560);
  private shipVel: Vector2 = new Vector2(0, 0);
  private playerPolarity: number = 1;
  private poles: MagnetPole[] = [];
  private score: number = 0;
  private level: number = 1;
  private polesPassed: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private levelUpFlash: number = 0;
  private particles: {x: number, y: number, speed: number}[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.shipPos = new Vector2(300, 560);
    this.shipVel = new Vector2(0, 0);
    this.playerPolarity = 1;
    this.score = 0;
    this.level = 1;
    this.polesPassed = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.levelUpFlash = 0;
    this.poles = [];
    this.particles = [];

    for (let i = 0; i < 50; i++) {
        this.particles.push({x: Math.random() * 600, y: Math.random() * 700, speed: Math.random() * 50 + 20});
    }

    this.spawnPoles();
  }
  
  private spawnPoles(): void {
      this.poles = [];
      const numPoles = 4 + this.level;
      for (let i = 0; i < numPoles; i++) {
        this.poles.push({
          pos: new Vector2(100 + this.ctx.random.next() * 400, 100 + i * (110 - this.level * 5)),
          polarity: this.ctx.random.next() < 0.5 ? 1 : -1,
          radius: 24,
        });
      }
  }

  private togglePolarity(): void {
    if (this.gameOver || this.isPaused) return;
    this.playerPolarity *= -1;
    this.ctx.audio.playRotate();
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    
    if (this.levelUpFlash > 0) this.levelUpFlash -= dt;

    if (this.moveLeft) this.shipVel.x -= 400 * dt;
    if (this.moveRight) this.shipVel.x += 400 * dt;
    
    for (let pt of this.particles) {
        pt.y += pt.speed * dt;
        if (pt.y > 700) {
            pt.y = 0;
            pt.x = Math.random() * 600;
        }
    }

    // Apply magnetic Lorentz forces
    for (const p of this.poles) {
      const dx = p.pos.x - this.shipPos.x;
      const dy = p.pos.y - this.shipPos.y;
      const dist = Math.max(30, Math.hypot(dx, dy));

      const interaction = -this.playerPolarity * p.polarity;
      const force = (45000 / (dist * dist)) * interaction;

      this.shipVel.x += (dx / dist) * force * dt;
      this.shipVel.y += (dy / dist) * force * dt;

      // Direct pole collision (Crash)
      if (dist < p.radius + 10) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playExplosion();
      }
    }

    // Drag
    this.shipVel.x *= 0.96;
    this.shipVel.y *= 0.96;

    this.shipPos.x += this.shipVel.x * dt;
    this.shipPos.y += this.shipVel.y * dt;

    // Boundaries
    this.shipPos.x = Math.max(30, Math.min(570, this.shipPos.x));
    this.shipPos.y = Math.max(80, Math.min(620, this.shipPos.y));

    // Scroll poles downward
    const scrollSpeed = 120 + this.level * 20;
    for (const p of this.poles) {
      p.pos.y += scrollSpeed * dt;
      if (p.pos.y > 670) {
        p.pos.y = 50 - Math.random() * 50;
        p.pos.x = 80 + this.ctx.random.next() * 440;
        p.polarity = this.ctx.random.next() < 0.5 ? 1 : -1;
        this.score += 150;
        this.polesPassed++;
        this.ctx.audio.playMove();
        
        if (this.polesPassed % 10 === 0 && this.level < 5) {
            this.level++;
            this.levelUpFlash = 0.5;
            this.ctx.audio.playPowerUp();
        }
      }
    }

    this.score += Math.round(dt * 20);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed) this.togglePolarity();
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    
    // Draw Particles
    rawCtx.fillStyle = "#334433";
    for (let pt of this.particles) {
        rawCtx.fillRect(pt.x, pt.y, 2, 2);
    }

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Magnetic Poles with field lines
    for (const p of this.poles) {
      const col = p.polarity > 0 ? "#FF3366" : "#00F0FF";
      
      // Field lines
      rawCtx.strokeStyle = p.polarity > 0 ? "rgba(255, 51, 102, 0.3)" : "rgba(0, 240, 255, 0.3)";
      rawCtx.lineWidth = 1;
      rawCtx.beginPath();
      for (let a = 0; a < 8; a++) {
          const ang = (a * Math.PI) / 4;
          rawCtx.moveTo(p.pos.x + Math.cos(ang) * p.radius, p.pos.y + Math.sin(ang) * p.radius);
          rawCtx.lineTo(p.pos.x + Math.cos(ang) * (p.radius + 30), p.pos.y + Math.sin(ang) * (p.radius + 30));
      }
      rawCtx.stroke();

      const sign = p.polarity > 0 ? "+" : "−";
      pr.drawCircle(p.pos.x, p.pos.y, p.radius, col, true);
      pr.drawCircle(p.pos.x, p.pos.y, p.radius - 4, "#040604", true);
      pr.drawText(sign, p.pos.x, p.pos.y + 7, { size: 20, color: col, align: "center" });
    }

    // Draw Player Ship (Arrow shape)
    const pCol = this.playerPolarity > 0 ? "#FF3366" : "#00F0FF";
    const pSign = this.playerPolarity > 0 ? "+" : "−";
    
    rawCtx.fillStyle = pCol;
    rawCtx.beginPath();
    rawCtx.moveTo(this.shipPos.x, this.shipPos.y - 18); // top
    rawCtx.lineTo(this.shipPos.x + 14, this.shipPos.y + 14); // right
    rawCtx.lineTo(this.shipPos.x, this.shipPos.y + 6); // bottom indent
    rawCtx.lineTo(this.shipPos.x - 14, this.shipPos.y + 14); // left
    rawCtx.closePath();
    rawCtx.fill();
    
    pr.drawText(pSign, this.shipPos.x, this.shipPos.y + 24, { size: 18, color: "#FFFFFF", align: "center" });

    // HUD
    pr.drawText(`LVL ${this.level}`, 30, 40, { size: 16, color: "#FFFFFF" });
    pr.drawText(`SCORE: ${this.score}`, w / 2, 30, {
      size: 14,
      color: "#00FF66",
      align: "center",
    });
    pr.drawText(`POLARITY: ${pSign}`, w - 100, 40, { size: 16, color: pCol });

    if (this.levelUpFlash > 0) {
        pr.drawRect(0, 0, w, h, `rgba(255, 255, 255, ${this.levelUpFlash})`, true);
    }

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MAGNETIC CRASH — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
