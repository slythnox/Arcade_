import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

interface Swooper {
  x: number;
  y: number;
  homeX: number;
  homeY: number;
  state: "home" | "dive" | "return";
  t: number;
  alive: boolean;
}

export class AlienSwarmGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 300;
  private movingLeft: boolean = false;
  private movingRight: boolean = false;
  private aliens: Swooper[] = [];
  private bullets: { x: number; y: number; vy: number; fromPlayer: boolean }[] = [];
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private globalTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 300;
    this.bullets = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.globalTime = 0;
    this.spawnSwarm();
  }

  private spawnSwarm(): void {
    this.aliens = [];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 7; c++) {
        const hx = 90 + c * 68;
        const hy = 80 + r * 46;
        this.aliens.push({
          x: hx,
          y: hy,
          homeX: hx,
          homeY: hy,
          state: "home",
          t: 0,
          alive: true,
        });
      }
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.globalTime += dt;

    if (this.movingLeft) this.playerX = Math.max(30, this.playerX - 360 * dt);
    if (this.movingRight) this.playerX = Math.min(570, this.playerX + 360 * dt);

    // Update aliens
    let diveCount = this.aliens.filter((a) => a.state === "dive").length;
    for (const a of this.aliens) {
      if (!a.alive) continue;

      if (a.state === "home") {
        // Breathing oscillation
        a.x = a.homeX + Math.sin(this.globalTime * 2.5 + a.homeY) * 20;
        a.y = a.homeY + Math.cos(this.globalTime * 1.5) * 6;

        // Chance to dive
        if (diveCount < 2 + this.level && this.ctx.random.next() < 0.005) {
          a.state = "dive";
          a.t = 0;
          diveCount++;
        }
      } else if (a.state === "dive") {
        a.t += dt * 1.6;
        // Bezier swoop dive towards player
        a.y += 180 * dt;
        a.x += Math.sin(a.t * 3.5) * 160 * dt;

        // Alien fires at peak
        if (this.ctx.random.next() < 0.02) {
          this.bullets.push({ x: a.x, y: a.y, vy: 260, fromPlayer: false });
        }

        if (a.y > 670) {
          a.y = 20;
          a.state = "return";
        }
      } else if (a.state === "return") {
        const dx = a.homeX - a.x;
        const dy = a.homeY - a.y;
        a.x += dx * 4 * dt;
        a.y += dy * 4 * dt;
        if (Math.hypot(dx, dy) < 8) {
          a.state = "home";
        }
      }
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y += b.vy * dt;
      if (b.y < 20 || b.y > 680) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.fromPlayer) {
        for (const a of this.aliens) {
          if (a.alive && Math.abs(b.x - a.x) < 20 && Math.abs(b.y - a.y) < 18) {
            a.alive = false;
            this.bullets.splice(i, 1);
            this.score += a.state === "dive" ? 300 : 100;
            this.ctx.audio.playExplosion();
            break;
          }
        }
      } else {
        if (Math.abs(b.x - this.playerX) < 22 && Math.abs(b.y - 620) < 16) {
          this.bullets.splice(i, 1);
          this.lives--;
          this.ctx.audio.playExplosion();
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      }
    }

    if (this.aliens.every((a) => !a.alive)) {
      this.level++;
      this.score += 1500;
      this.ctx.audio.playPowerUp();
      this.spawnSwarm();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.movingLeft = isPressed;
    if (action === "MOVE_RIGHT") this.movingRight = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed && !this.gameOver && !this.isPaused) {
      if (this.bullets.filter((b) => b.fromPlayer).length < 2) {
        this.bullets.push({ x: this.playerX, y: 605, vy: -580, fromPlayer: true });
        this.ctx.audio.playLaser();
      }
    }
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
    pr.clear("#040605");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Aliens
    for (const a of this.aliens) {
      if (!a.alive) continue;
      const col = a.state === "dive" ? "#FF3366" : "#FFB703";
      pr.drawPixelBlock(a.x - 14, a.y - 12, 28, col, "#FFFFFF", "#040604");
    }

    // Draw Bullets
    for (const b of this.bullets) {
      pr.drawRect(b.x - 2, b.y - 6, 4, 12, b.fromPlayer ? "#00FF66" : "#FF3366", true);
    }

    // Draw Player
    pr.drawPixelBlock(this.playerX - 20, 615, 40, "#00FF66", "#FFFFFF", "#047857");
    pr.drawRect(this.playerX - 4, 602, 8, 14, "#00FF66", true);

    pr.drawText(`SCORE: ${this.score}  •  LEVEL: ${this.level}  •  LIVES: ${this.lives}`, w / 2, 28, {
      size: 12,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("SWARM BREACH — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
