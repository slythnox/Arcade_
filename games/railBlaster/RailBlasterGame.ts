import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Target {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  timer: number;
  maxTimer: number;
}

export class RailBlasterGame implements GameInstance {
  private ctx!: GameContext;
  private reticlePos: Vector2 = new Vector2(300, 350);
  private targets: Target[] = [];
  private spawnTimer: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private score: number = 0;
  private combo: number = 0;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.reticlePos = new Vector2(300, 350);
    this.targets = [];
    this.spawnTimer = 0;
    this.score = 0;
    this.combo = 0;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
  }

  private spawnTarget(): void {
    const x = 80 + this.ctx.random.next() * 440;
    const y = 100 + this.ctx.random.next() * 480;
    this.targets.push({
      pos: new Vector2(x, y),
      vel: new Vector2((this.ctx.random.next() - 0.5) * 80, (this.ctx.random.next() - 0.5) * 80),
      radius: 26,
      timer: 2.2,
      maxTimer: 2.2,
    });
  }

  private shoot(): void {
    if (this.gameOver || this.isPaused) return;

    let hit = false;
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      if (Math.hypot(this.reticlePos.x - t.pos.x, this.reticlePos.y - t.pos.y) < t.radius) {
        this.targets.splice(i, 1);
        this.combo++;
        this.score += 200 * this.combo;
        this.ctx.audio.playExplosion();
        hit = true;
        break;
      }
    }

    if (!hit) {
      this.combo = 0;
      this.ctx.audio.playLaser();
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Move reticle
    const speed = 460;
    if (this.moveLeft) this.reticlePos.x -= speed * dt;
    if (this.moveRight) this.reticlePos.x += speed * dt;
    if (this.moveUp) this.reticlePos.y -= speed * dt;
    if (this.moveDown) this.reticlePos.y += speed * dt;

    this.reticlePos.x = Math.max(30, Math.min(570, this.reticlePos.x));
    this.reticlePos.y = Math.max(60, Math.min(640, this.reticlePos.y));

    // Spawn Targets
    this.spawnTimer += dt;
    if (this.spawnTimer > 0.8) {
      this.spawnTimer = 0;
      if (this.targets.length < 5) this.spawnTarget();
    }

    // Update Targets & Expire Countdown
    for (let i = this.targets.length - 1; i >= 0; i--) {
      const t = this.targets[i];
      t.pos.x += t.vel.x * dt;
      t.pos.y += t.vel.y * dt;
      t.timer -= dt;

      if (t.timer <= 0) {
        // Target detonates on player
        this.targets.splice(i, 1);
        this.lives--;
        this.combo = 0;
        this.ctx.audio.playExplosion();

        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
      }
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
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Targets
    for (const t of this.targets) {
      const frac = t.timer / t.maxTimer;
      const col = frac < 0.3 ? "#FF3366" : frac < 0.6 ? "#FFB703" : "#00FF66";
      pr.drawCircle(t.pos.x, t.pos.y, t.radius, col, false);
      pr.drawCircle(t.pos.x, t.pos.y, t.radius * frac, col, true);
    }

    // Draw Crosshair Reticle
    const rx = this.reticlePos.x;
    const ry = this.reticlePos.y;
    pr.drawCircle(rx, ry, 18, "#00F0FF", false);
    pr.drawLine(rx - 26, ry, rx + 26, ry, "#00F0FF", 2);
    pr.drawLine(rx, ry - 26, rx, ry + 26, "#00F0FF", 2);
    pr.drawCircle(rx, ry, 3, "#FFFFFF", true);

    pr.drawText(
      `SCORE: ${this.score}  •  COMBO: ${this.combo}X  •  LIVES: ${this.lives}  •  [SPACE TO BLAST]`,
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
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("TARGET DETONATIONS — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
