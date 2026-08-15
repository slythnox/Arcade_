import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";

export class StarFormationGame implements GameInstance {
  private ctx!: GameContext;
  
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  
  private player = { x: 300, y: 500, vx: 0, cooldown: 0 };
  private bullets: { x: number, y: number, vy: number, isEnemy: boolean }[] = [];
  
  private enemies: { x: number, y: number, startX: number, startY: number, row: number, hp: number, isDiving: boolean, time: number }[] = [];
  private formationDx: number = 1;
  private formationX: number = 0;
  private formationY: number = 0;
  
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
    this.spawnWave();
  }
  
  private spawnWave(): void {
    this.enemies = [];
    this.bullets = [];
    this.formationX = 50;
    this.formationY = 50;
    this.formationDx = 1 + this.level * 0.2;
    this.player.x = 300;
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 10; col++) {
        this.enemies.push({
          startX: col * 40,
          startY: row * 40,
          x: col * 40 + this.formationX,
          y: row * 40 + this.formationY,
          row: row,
          hp: row === 0 ? 3 : 1, // Boss row takes 3 hits
          isDiving: false,
          time: 0
        });
      }
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Player move
    this.player.x += this.player.vx * 300 * dt;
    if (this.player.x < 20) this.player.x = 20;
    if (this.player.x > 580) this.player.x = 580;
    
    if (this.player.cooldown > 0) this.player.cooldown -= dt;
    
    // Bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * dt;
      if (b.y < -10 || b.y > 610) {
        this.bullets.splice(i, 1);
        continue;
      }
      
      // Collision
      if (!b.isEnemy) {
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          if (Math.abs(b.x - e.x) < 15 && Math.abs(b.y - e.y) < 15) {
            e.hp--;
            this.bullets.splice(i, 1);
            if (e.hp <= 0) {
              this.score += (e.row === 0) ? 150 : (50 - e.row * 10);
              this.enemies.splice(j, 1);
            }
            break;
          }
        }
      } else {
        if (Math.abs(b.x - this.player.x) < 15 && Math.abs(b.y - this.player.y) < 15) {
          this.bullets.splice(i, 1);
          this.die();
        }
      }
    }
    
    // Formation move
    this.formationX += this.formationDx * 60 * dt;
    let hitEdge = false;
    if (this.formationX > 200 || this.formationX < 20) hitEdge = true;
    
    if (hitEdge) {
      this.formationDx *= -1;
      this.formationY += 20;
    }
    
    let isAllDead = true;
    for (let j = this.enemies.length - 1; j >= 0; j--) {
      const e = this.enemies[j];
      isAllDead = false;
      
      if (!e.isDiving) {
        e.x = e.startX + this.formationX;
        e.y = e.startY + this.formationY;
        
        // Random dive
        if (Math.random() < 0.001 * this.level) {
          e.isDiving = true;
          e.time = 0;
        }
      } else {
        e.time += dt;
        e.y += 150 * dt;
        e.x += Math.sin(e.time * 5) * 100 * dt;
        
        if (e.y > 600) {
          e.isDiving = false; // Reset to formation
        }
      }
      
      // Enemy shoot
      if (Math.random() < 0.002) {
        this.bullets.push({ x: e.x, y: e.y + 10, vy: 300, isEnemy: true });
        if (e.row === 0) {
          // Boss double shot
          this.bullets.push({ x: e.x - 10, y: e.y + 10, vy: 300, isEnemy: true });
          this.bullets.push({ x: e.x + 10, y: e.y + 10, vy: 300, isEnemy: true });
        }
      }
      
      // Player collision
      if (Math.abs(e.x - this.player.x) < 20 && Math.abs(e.y - this.player.y) < 20) {
        this.die();
      }
    }
    
    if (isAllDead) {
      this.level++;
      this.spawnWave();
    }
  }
  
  private die(): void {
    this.lives--;
    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      this.player.x = 300;
      this.bullets = [];
    }
  }

  public render(renderer: Renderer): void {
    renderer.clear("#000022");
    
    // Draw enemies
    for (const e of this.enemies) {
      const color = e.row === 0 ? "#FF00FF" : e.row < 3 ? "#00FFFF" : "#00FF00";
      renderer.drawRect(e.x - 12, e.y - 12, 24, 24, color);
    }
    
    // Draw bullets
    for (const b of this.bullets) {
      renderer.drawRect(b.x - 2, b.y - 4, 4, 8, b.isEnemy ? "#FF0000" : "#FFFF00");
    }
    
    // Draw player
    renderer.drawRect(this.player.x - 15, this.player.y - 10, 30, 20, "#FFFFFF");
    renderer.drawRect(this.player.x - 5, this.player.y - 20, 10, 10, "#FFFFFF");
    
    // UI
    renderer.drawText(`SCORE: ${this.score}`, 10, 20, {color: "#FFF", size: 16});
    renderer.drawText(`LIVES: ${this.lives}`, renderer.getWidth() - 80, 20, {color: "#FFF", size: 16});
    
    if (this.gameOver) {
      renderer.drawText("GAME OVER", renderer.getWidth()/2, renderer.getHeight()/2, {color: "#F00", size: 32, align: "center"});
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (this.gameOver || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.player.vx = isPressed ? -1 : 0;
    } else if (action === "MOVE_RIGHT") {
      this.player.vx = isPressed ? 1 : 0;
    } else if (action === "ACTION_PRIMARY" && isPressed) {
      if (this.player.cooldown <= 0) {
        this.bullets.push({ x: this.player.x, y: this.player.y - 25, vy: -600, isEnemy: false });
        this.player.cooldown = 0.2;
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
