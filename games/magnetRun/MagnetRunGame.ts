import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
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
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

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
    this.gameOver = false;
    this.isPaused = false;
    this.poles = [];

    for (let i = 0; i < 5; i++) {
      this.poles.push({
        pos: new Vector2(100 + this.ctx.random.next() * 400, 100 + i * 110),
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

    if (this.moveLeft) this.shipVel.x -= 400 * dt;
    if (this.moveRight) this.shipVel.x += 400 * dt;

    // Apply magnetic Lorentz forces: like repels, opposite attracts
    for (const p of this.poles) {
      const dx = p.pos.x - this.shipPos.x;
      const dy = p.pos.y - this.shipPos.y;
      const dist = Math.max(30, Math.hypot(dx, dy));

      // Force = K / dist^2
      // If polarities match -> repel (-). If opposite -> attract (+)
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
    for (const p of this.poles) {
      p.pos.y += 120 * dt;
      if (p.pos.y > 670) {
        p.pos.y = 50;
        p.pos.x = 80 + this.ctx.random.next() * 440;
        p.polarity = this.ctx.random.next() < 0.5 ? 1 : -1;
        this.score += 150;
        this.ctx.audio.playMove();
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
  public getLevel(): number { return 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.drawRect(10, 10, w - 20, h - 20, "rgba(0, 255, 102, 0.4)", false);

    // Draw Magnetic Poles
    for (const p of this.poles) {
      const col = p.polarity > 0 ? "#FF3366" : "#00F0FF";
      const sign = p.polarity > 0 ? "+" : "−";
      pr.drawCircle(p.pos.x, p.pos.y, p.radius, col, true);
      pr.drawCircle(p.pos.x, p.pos.y, p.radius - 4, "#040604", true);
      pr.drawText(sign, p.pos.x, p.pos.y + 7, { size: 20, color: col, align: "center" });
    }

    // Draw Player Ship
    const pCol = this.playerPolarity > 0 ? "#FF3366" : "#00F0FF";
    const pSign = this.playerPolarity > 0 ? "+" : "−";
    pr.drawPixelBlock(this.shipPos.x - 14, this.shipPos.y - 14, 28, pCol, "#FFFFFF", "#040604");
    pr.drawText(pSign, this.shipPos.x, this.shipPos.y + 6, { size: 18, color: "#FFFFFF", align: "center" });

    pr.drawText(`SCORE: ${this.score}  •  [← → STEER, SPACE TO SWITCH POLARITY]`, w / 2, 28, {
      size: 11,
      color: "#00FF66",
      align: "center",
    });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4,6,4,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MAGNETIC CRASH — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
