import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  isCue: boolean;
  potted: boolean;
  points: number;
  number: number;
}

export class PoolSimulatorGame implements GameInstance {
  private ctx!: GameContext;
  private balls: Ball[] = [];
  private cueAngle: number = 0;
  private power: number = 0;
  private maxPower: number = 1000;
  private powerDir: number = 1;
  private isAiming: boolean = true;
  private score: number = 0;
  private level: number = 1;
  private isPaused: boolean = false;

  private tableOuterX = 30;
  private tableOuterY = 60;
  private tableOuterW = 540;
  private tableOuterH = 380;

  private tableX = 50;
  private tableY = 80;
  private tableW = 500;
  private tableH = 340;

  private pockets: Vector2[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initTable();
  }

  private initTable(): void {
    this.pockets = [
      new Vector2(this.tableX, this.tableY),
      new Vector2(this.tableX + this.tableW / 2, this.tableY - 5),
      new Vector2(this.tableX + this.tableW, this.tableY),
      new Vector2(this.tableX, this.tableY + this.tableH),
      new Vector2(this.tableX + this.tableW / 2, this.tableY + this.tableH + 5),
      new Vector2(this.tableX + this.tableW, this.tableY + this.tableH),
    ];

    this.balls = [];

    this.balls.push({
      pos: new Vector2(this.tableX + this.tableW * 0.25, this.tableY + this.tableH / 2),
      vel: Vector2.zero(),
      radius: 9,
      color: "#FFFFFF",
      isCue: true,
      potted: false,
      points: 0,
      number: 0,
    });

    const targetColors = ["#ffd84d", "#ff5c8a", "#4de8e8", "#a879ff", "#ff9f43", "#63e66d", "#ef4444", "#111111"];
    const startX = this.tableX + this.tableW * 0.7;
    const startY = this.tableY + this.tableH / 2;

    let ballIndex = 1;
    for (let col = 0; col < 5; col++) {
      for (let row = 0; row <= col; row++) {
        const bx = startX + col * 16;
        const by = startY + (row - col / 2) * 18;
        const colIdx = ballIndex === 8 ? 7 : (ballIndex % 7);
        this.balls.push({
          pos: new Vector2(bx, by),
          vel: Vector2.zero(),
          radius: 9,
          color: ballIndex === 8 ? "#111111" : targetColors[colIdx],
          isCue: false,
          potted: false,
          points: ballIndex * 10,
          number: ballIndex,
        });
        ballIndex++;
        if (ballIndex > 15) break;
      }
    }

    this.isAiming = true;
    this.cueAngle = 0;
    this.power = 0;
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    let allStationary = true;
    const friction = 0.982;

    if (this.isAiming) {
      this.power += 800 * dt * this.powerDir;
      if (this.power >= this.maxPower) {
        this.power = this.maxPower;
        this.powerDir = -1;
      } else if (this.power <= 0) {
        this.power = 0;
        this.powerDir = 1;
      }
    }

    for (const ball of this.balls) {
      if (ball.potted) continue;

      if (ball.vel.sqrMagnitude() > 4) {
        allStationary = false;
        ball.pos.x += ball.vel.x * dt;
        ball.pos.y += ball.vel.y * dt;
        ball.vel = ball.vel.scale(friction);

        const minX = this.tableX + ball.radius;
        const maxX = this.tableX + this.tableW - ball.radius;
        const minY = this.tableY + ball.radius;
        const maxY = this.tableY + this.tableH - ball.radius;

        if (ball.pos.x <= minX) {
          ball.pos.x = minX;
          ball.vel.x = Math.abs(ball.vel.x);
          this.ctx.audio?.playHit?.();
        } else if (ball.pos.x >= maxX) {
          ball.pos.x = maxX;
          ball.vel.x = -Math.abs(ball.vel.x);
          this.ctx.audio?.playHit?.();
        }

        if (ball.pos.y <= minY) {
          ball.pos.y = minY;
          ball.vel.y = Math.abs(ball.vel.y);
          this.ctx.audio?.playHit?.();
        } else if (ball.pos.y >= maxY) {
          ball.pos.y = maxY;
          ball.vel.y = -Math.abs(ball.vel.y);
          this.ctx.audio?.playHit?.();
        }

        for (const pocket of this.pockets) {
          if (ball.pos.distance(pocket) < 20) {
            ball.potted = true;
            ball.vel = Vector2.zero();

            if (ball.isCue) {
              this.score = Math.max(0, this.score - 50);
              this.ctx.audio?.playExplosion?.();
              setTimeout(() => {
                ball.potted = false;
                ball.pos.set(this.tableX + this.tableW * 0.25, this.tableY + this.tableH / 2);
                ball.vel = Vector2.zero();
              }, 400);
            } else {
              this.score += ball.points * this.level;
              this.ctx.audio?.playCoin?.();
            }
          }
        }
      } else {
        ball.vel = Vector2.zero();
      }
    }

    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const b1 = this.balls[i];
        const b2 = this.balls[j];
        if (b1.potted || b2.potted) continue;

        const delta = b2.pos.sub(b1.pos);
        const dist = delta.magnitude();
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0) {
          const normal = delta.normalize();
          const overlap = minDist - dist;

          b1.pos = b1.pos.sub(normal.scale(overlap / 2));
          b2.pos = b2.pos.add(normal.scale(overlap / 2));

          const relVel = b1.vel.sub(b2.vel);
          const sepVel = relVel.dot(normal);
          if (sepVel > 0) {
            const impulse = normal.scale(sepVel * 0.98);
            b1.vel = b1.vel.sub(impulse);
            b2.vel = b2.vel.add(impulse);
            this.ctx.audio?.playHit?.();
          }
        }
      }
    }

    if (allStationary && !this.isAiming) {
      this.isAiming = true;
      this.power = 0;
      this.powerDir = 1;

      const remainingTargets = this.balls.filter((b) => !b.isCue && !b.potted).length;
      if (remainingTargets === 0) {
        this.score += 2000 * this.level;
        this.level++;
        this.ctx.audio?.playVictory?.();
        this.initTable();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.cueAngle -= 0.08;
    } else if (action === "MOVE_RIGHT") {
      this.cueAngle += 0.08;
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.isAiming) {
        const cueBall = this.balls.find((b) => b.isCue && !b.potted);
        if (cueBall) {
          const impulse = Vector2.fromAngle(this.cueAngle).scale(Math.max(100, this.power));
          cueBall.vel = impulse;
          this.isAiming = false;
          this.ctx.audio?.playRotate?.();
        }
      }
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const rawCtx = pr.getContext();
    pr.clear("#050914");
    const w = renderer.getWidth();

    pr.drawRect(this.tableOuterX, this.tableOuterY, this.tableOuterW, this.tableOuterH, "#2d6a4f", true);
    pr.drawRect(this.tableX, this.tableY, this.tableW, this.tableH, "#1e8a4a", true);

    for (const p of this.pockets) {
      pr.drawCircle(p.x, p.y, 18, "#111111", true);
    }

    const cueBall = this.balls.find((b) => b.isCue && !b.potted);
    if (this.isAiming && cueBall) {
      const aimDir = Vector2.fromAngle(this.cueAngle);
      
      rawCtx.save();
      rawCtx.beginPath();
      rawCtx.setLineDash([2, 8]);
      rawCtx.moveTo(cueBall.pos.x, cueBall.pos.y);
      const endDot = cueBall.pos.add(aimDir.scale(300));
      rawCtx.lineTo(endDot.x, endDot.y);
      rawCtx.strokeStyle = "rgba(255,255,255,0.5)";
      rawCtx.lineWidth = 1;
      rawCtx.stroke();
      rawCtx.restore();

      const stickStart = cueBall.pos.sub(aimDir.scale(30));
      const stickEnd = cueBall.pos.sub(aimDir.scale(120 + this.power * 0.05));
      
      rawCtx.save();
      rawCtx.beginPath();
      rawCtx.moveTo(stickStart.x, stickStart.y);
      rawCtx.lineTo(stickEnd.x, stickEnd.y);
      rawCtx.strokeStyle = "#8b5a2b";
      rawCtx.lineWidth = 4;
      rawCtx.lineCap = "round";
      rawCtx.stroke();
      
      rawCtx.beginPath();
      rawCtx.moveTo(stickStart.x, stickStart.y);
      const stickMid = stickStart.add(stickEnd.sub(stickStart).scale(0.2));
      rawCtx.lineTo(stickMid.x, stickMid.y);
      rawCtx.strokeStyle = "#e8e8e8";
      rawCtx.lineWidth = 3;
      rawCtx.stroke();
      rawCtx.restore();
    }

    for (const ball of this.balls) {
      if (ball.potted) continue;
      
      rawCtx.fillStyle = "rgba(0,0,0,0.4)";
      rawCtx.beginPath();
      rawCtx.ellipse(ball.pos.x + 3, ball.pos.y + 3, ball.radius, ball.radius * 0.8, 0, 0, Math.PI * 2);
      rawCtx.fill();

      pr.drawCircle(ball.pos.x, ball.pos.y, ball.radius, ball.color, true);

      if (!ball.isCue && ball.number > 8) {
        pr.drawCircle(ball.pos.x, ball.pos.y, ball.radius * 0.7, "#FFFFFF", true);
      } else if (!ball.isCue) {
        pr.drawCircle(ball.pos.x, ball.pos.y, ball.radius * 0.5, "#FFFFFF", true);
      }

      pr.drawCircle(ball.pos.x - ball.radius / 3, ball.pos.y - ball.radius / 3, ball.radius / 3, "rgba(255,255,255,0.6)", true);

      if (!ball.isCue) {
        pr.drawText(ball.number.toString(), ball.pos.x, ball.pos.y + 3, { size: 8, color: "#111", align: "center", font: "sans-serif" });
      }
    }

    pr.drawRect(560, 100, 15, 300, "#111", true);
    pr.drawRect(560, 100 + 300 * (1 - this.power / this.maxPower), 15, 300 * (this.power / this.maxPower), "#ff3333", true);
    pr.drawRect(560, 100, 15, 300, "#fff", false);

    pr.drawText(`SCORE: ${this.score}  •  LVL ${this.level}  •  TURN: ${this.isAiming ? 'PLAYER' : 'WAIT'}`, w / 2, 25, {
      size: 14,
      color: "#ffd84d",
      align: "center",
      font: "monospace"
    });
  }
}
