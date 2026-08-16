import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

export class StarFormationGame implements GameInstance {
  private ctx!: GameContext;
  
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  private player = { x: 300, y: 600, vx: 0, cooldown: 0 };
  private bullets: { x: number, y: number, vy: number, isEnemy: boolean }[] = [];
  private enemies: { x: number, y: number, startX: number, startY: number, row: number, hp: number, isDiving: boolean, time: number }[] = [];
  
  private stars: {x: number, y: number, speed: number, size: number}[] = [];
  private particles: {x: number, y: number, vx: number, vy: number, life: number, color: string}[] = [];
  
  private formationDx: number = 1;
  private formationX: number = 0;
  private formationY: number = 0;
  private time: number = 0;
  
  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.time = 0;
    
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        speed: 0.5 + Math.random() * 1.5,
        size: 1 + Math.random() * 2
      });
    }
    this.particles = [];
    this.spawnWave();
  }
  
  private spawnWave(): void {
    this.enemies = [];
    this.bullets = [];
    this.formationX = 50;
    this.formationY = 80;
    this.formationDx = 1 + this.level * 0.2;
    this.player.x = 300;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        this.enemies.push({
          startX: col * 45,
          startY: row * 40,
          x: col * 45 + this.formationX,
          y: row * 40 + this.formationY,
          row: row,
          hp: row === 0 ? 3 : 1, // Boss row takes 3 hits
          isDiving: false,
          time: 0
        });
      }
    }
  }

  private spawnExplosion(x: number, y: number, color: string): void {
    this.ctx.audio.playExplosion();
    for (let i = 0; i < 15; i++) {
      const ang = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x, y,
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        life: 0.3 + Math.random() * 0.5,
        color: color
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.time += dt;

    for (const s of this.stars) {
      s.y += s.speed * dt * 60;
      if (s.y > 700) {
        s.y = 0;
        s.x = Math.random() * 600;
      }
    }

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }

    this.player.x += this.player.vx * 350 * dt;
    if (this.player.x < 20) this.player.x = 20;
    if (this.player.x > 580) this.player.x = 580;
    
    if (this.player.cooldown > 0) this.player.cooldown -= dt;
    
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * dt;
      if (b.y < -10 || b.y > 710) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      if (!b.isEnemy) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.abs(b.x - e.x) < 20 && Math.abs(b.y - e.y) < 20) {
            e.hp--;
            this.bullets.splice(i, 1);
            if (e.hp <= 0) {
              this.score += (e.row === 0) ? 150 : (50 - e.row * 10);
              this.spawnExplosion(e.x, e.y, e.row === 0 ? "#FF00FF" : (e.row < 3 ? "#00FFFF" : "#00FF00"));
              this.enemies.splice(j, 1);
            } else {
              this.ctx.audio.playHit();
            }
            break;
          }
        }
      } else {
        if (Math.abs(b.x - this.player.x) < 12 && Math.abs(b.y - this.player.y) < 12) {
          this.bullets.splice(i, 1);
          this.die();
        }
      }
    }
    
    this.formationX += this.formationDx * 50 * dt;
    let hitEdge = false;
    if (this.formationX > 150 || this.formationX < 20) hitEdge = true;
    
    if (hitEdge) {
      this.formationDx *= -1;
      this.formationY += 10;
    }
    
    let isAllDead = true;
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      isAllDead = false;
      
      if (!e.isDiving) {
        const offsetY = Math.sin(this.time * 2 + e.startX * 0.05) * 5;
        e.x = e.startX + this.formationX;
        e.y = e.startY + this.formationY + offsetY;
        
        if (Math.random() < 0.0005 * this.level) {
          e.isDiving = true;
          e.time = 0;
        }
      } else {
        e.time += dt;
        e.y += 180 * dt;
        e.x += Math.sin(e.time * 5) * 120 * dt;
        
        if (e.y > 720) {
          e.isDiving = false;
          e.y = e.startY + this.formationY - 50;
        }
      }
      
      if (Math.random() < 0.001) {
        this.bullets.push({ x: e.x, y: e.y + 10, vy: 350, isEnemy: true });
        this.ctx.audio.playLaser();
        if (e.row === 0) {
          this.bullets.push({ x: e.x - 12, y: e.y + 10, vy: 350, isEnemy: true });
          this.bullets.push({ x: e.x + 12, y: e.y + 10, vy: 350, isEnemy: true });
        }
      }
      
      if (Math.abs(e.x - this.player.x) < 20 && Math.abs(e.y - this.player.y) < 20) {
        this.die();
      }
    }
    
    if (isAllDead) {
      this.level++;
      this.ctx.audio.playVictory();
      this.spawnWave();
    }
  }
  
  private die(): void {
    this.spawnExplosion(this.player.x, this.player.y, "#4de8e8");
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playGameOver();
    } else {
      this.player.x = 300;
      this.bullets = [];
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    renderer.clear("#000810");
    
    // Background Stars
    for (const s of this.stars) {
      const col = Math.floor(100 + s.size * 50);
      renderer.drawRect(s.x, s.y, s.size, s.size, `rgb(${col},${col},${col})`);
    }

    // Particles
    for (const p of this.particles) {
      rawCtx.globalAlpha = p.life;
      renderer.drawCircle(p.x, p.y, 2, p.color, true);
      rawCtx.globalAlpha = 1.0;
    }
    
    // Draw enemies
    for (const e of this.enemies) {
      rawCtx.save();
      rawCtx.translate(e.x, e.y);
      if (e.row === 0) {
        // Boss
        rawCtx.fillStyle = "#FF00FF";
        rawCtx.fillRect(-15, -5, 30, 10);
        rawCtx.fillRect(-5, -15, 10, 30);
        renderer.drawCircle(0, 0, 8, "#FFFFFF", true);
      } else if (e.row < 3) {
        // Middle diamond
        rawCtx.fillStyle = "#00FFFF";
        rawCtx.beginPath();
        rawCtx.moveTo(0, -12); rawCtx.lineTo(12, 0); rawCtx.lineTo(0, 12); rawCtx.lineTo(-12, 0);
        rawCtx.fill();
      } else {
        // Bottom X-wing style
        rawCtx.fillStyle = "#00FF00";
        rawCtx.fillRect(-10, -10, 20, 6);
        rawCtx.fillRect(-10, 4, 20, 6);
        rawCtx.fillRect(-4, -6, 8, 12);
      }
      rawCtx.restore();
    }
    
    // Draw bullets
    for (const b of this.bullets) {
      if (b.isEnemy) {
        renderer.drawCircle(b.x, b.y, 4, "#ff8000", true);
      } else {
        renderer.drawRect(b.x - 1, b.y - 8, 2, 16, "#00FFFF", true);
      }
    }
    
    // Draw player ship
    if (!this.gameOver || this.lives > 0) {
      const px = this.player.x;
      const py = this.player.y;
      
      // Ship shape
      rawCtx.beginPath();
      rawCtx.moveTo(px, py - 16);
      rawCtx.lineTo(px - 12, py + 12);
      rawCtx.lineTo(px - 4, py + 8);
      rawCtx.lineTo(px, py + 12);
      rawCtx.lineTo(px + 4, py + 8);
      rawCtx.lineTo(px + 12, py + 12);
      rawCtx.closePath();
      rawCtx.fillStyle = '#4de8e8';
      rawCtx.fill();
      
      // Engine glow
      rawCtx.beginPath();
      rawCtx.arc(px, py + 10, 3 + Math.sin(this.time * 15) * 1.5, 0, Math.PI * 2);
      rawCtx.fillStyle = '#ff6030';
      rawCtx.fill();
    }
    
    // HUD
    renderer.drawText(`SCORE: ${this.score}`, 20, 30, {color: "#FFF", size: 18});
    
    // Draw life icons
    for (let i = 0; i < this.lives; i++) {
      const lx = renderer.getWidth() - 30 - i * 25;
      const ly = 25;
      rawCtx.beginPath();
      rawCtx.moveTo(lx, ly - 8);
      rawCtx.lineTo(lx - 6, ly + 6);
      rawCtx.lineTo(lx - 2, ly + 4);
      rawCtx.lineTo(lx, ly + 6);
      rawCtx.lineTo(lx + 2, ly + 4);
      rawCtx.lineTo(lx + 6, ly + 6);
      rawCtx.fillStyle = '#4de8e8';
      rawCtx.fill();
    }
    
    if (this.gameOver) {
      renderer.drawText("GAME OVER", renderer.getWidth()/2, renderer.getHeight()/2, {color: "#F00", size: 40, align: "center"});
      renderer.drawText("PRESS R TO RESTART", renderer.getWidth()/2, renderer.getHeight()/2 + 40, {color: "#FFF", size: 16, align: "center"});
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (this.gameOver || this.isPaused) {
      if (action === "RESTART" && isPressed && this.gameOver) this.reset();
      return;
    }

    if (action === "MOVE_LEFT") {
      this.player.vx = isPressed ? -1 : 0;
    } else if (action === "MOVE_RIGHT") {
      this.player.vx = isPressed ? 1 : 0;
    } else if (action === "ACTION_PRIMARY" && isPressed) {
      if (this.player.cooldown <= 0) {
        this.bullets.push({ x: this.player.x, y: this.player.y - 20, vy: -700, isEnemy: false });
        this.player.cooldown = 0.2;
        this.ctx.audio.playLaser();
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
