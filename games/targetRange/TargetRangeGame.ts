import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface TargetBullseye {
  pos: Vector2;
  radius: number;
  timer: number;
  maxTimer: number;
}

export class TargetRangeGame implements GameInstance {
  private ctx!: GameContext;
  private cursor: Vector2 = new Vector2(300, 350);
  private targets: TargetBullseye[] = [];
  private score: number = 0;
  private hits: number = 0;
  private misses: number = 0;
  private timeLeft: number = 45;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private spawnTimer: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.cursor = new Vector2(300, 350);
    this.targets = [];
    this.score = 0;
    this.hits = 0;
    this.misses = 0;
    this.timeLeft = 45;
    this.spawnTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.spawnTarget();
    this.spawnTarget();
  }

  private spawnTarget(): void {
    this.targets.push({
      pos: new Vector2(100 + this.ctx.random.next() * 400, 100 + this.ctx.random.next() * 500),
      radius: 30,
      timer: 2.0,
      maxTimer: 2.0,
    });
  }

  private shoot(): void {
    if (this.gameOver || this.isPaused) return;

    let hitIdx = -1;
    let minD = 999;
    for (let i = 0; i < this.targets.length; i++) {
      const d = Math.hypot(this.cursor.x - this.targets[i].pos.x, this.cursor.y - this.targets[i].pos.y);
      if (d < this.targets[i].radius && d < minD) {
        minD = d;
        hitIdx = i;
      }
    }

    if (hitIdx !== -1) {
      const t = this.targets[hitIdx];
      // Accuracy score
      const accFraction = 1 - minD / t.radius;
      const pts = Math.round(100 + accFraction * 400);
      this.score += pts;
      this.hits++;
      this.ctx.audio.playVictory();
      this.targets.splice(hitIdx, 1);
      this.spawnTarget();
    } else {
      this.misses++;
      this.ctx.audio.playLaser();
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    this.timeLeft -= dt;
    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playPowerUp();
      return;
    }

    // Move crosshair
    const speed = 520;
    if (this.moveLeft) this.cursor.x -= speed * dt;
    if (this.moveRight) this.cursor.x += speed * dt;
    if (this.moveUp) this.cursor.y -= speed * dt;
    if (this.moveDown) this.cursor.y += speed * dt;

    this.cursor.x = Math.max(30, Math.min(570, this.cursor.x));
    this.cursor.y = Math.max(60, Math.min(640, this.cursor.y));

    // Update Targets Countdown
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.timer -= dt;
      if (t.timer <= 0) {
        this.targets.splice(i, 1);
        this.misses++;
        this.spawnTarget();
      }
    }

    this.spawnTimer += dt;
    if (this.spawnTimer > 1.4 && this.targets.length < 4) {
      this.spawnTimer = 0;
      this.spawnTarget();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "ACTION_PRIMARY" && isPressed) this.shoot();
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Bullseye Targets
    for (const t of this.targets) {
      const frac = t.timer / t.maxTimer;
      pr.drawCircle(t.pos.x, t.pos.y, t.radius, "#FF3366", true);
      pr.drawCircle(t.pos.x, t.pos.y, t.radius * 0.7, "#FFFFFF", true);
      pr.drawCircle(t.pos.x, t.pos.y, t.radius * 0.35, "#FF3366", true);
      pr.drawCircle(t.pos.x, t.pos.y, 4, "#FFB703", true);

      // Countdown Arc Ring
      pr.drawCircle(t.pos.x, t.pos.y, t.radius + 6, "rgba(0, 240, 255, 0.4)", false);
    }

    // Draw Crosshair Reticle
    const rx = this.cursor.x;
    const ry = this.cursor.y;
    pr.drawCircle(rx, ry, 14, "#00FF66", false);
    pr.drawLine(rx - 22, ry, rx + 22, ry, "#00FF66", 2);
    pr.drawLine(rx, ry - 22, rx, ry + 22, "#00FF66", 2);

    const totalShots = this.hits + this.misses;
    const acc = totalShots > 0 ? Math.round((this.hits / totalShots) * 100) : 100;

    pr.drawText(
      `TIME: ${Math.ceil(this.timeLeft)}s  •  SCORE: ${this.score}  •  ACCURACY: ${acc}%  •  [SPACE TO SHOOT]`,
      w / 2,
      28,
      {
        size: 11,
        color: "#00FF66",
        align: "center",
      }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#00FF66", false);
      pr.drawText(`RANGE TRIAL FINISHED — SCORE: ${this.score}`, w / 2, h / 2 - 10, { size: 20, color: "#00FF66", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
