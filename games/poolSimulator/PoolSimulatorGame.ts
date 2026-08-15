import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  isCue: boolean;
  potted: boolean;
  points: number;
}

export class PoolSimulatorGame implements GameInstance {
  private ctx!: GameContext;
  private balls: Ball[] = [];
  private cueAngle: number = 0; // Radians
  private cuePower: number = 550;
  private isAiming: boolean = true;
  private score: number = 0;
  private level: number = 1;
  private isPaused: boolean = false;

  // Table bounds
  private tableX = 50;
  private tableY = 90;
  private tableW = 500;
  private tableH = 480;

  // 6 Pockets
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
      new Vector2(this.tableX + 16, this.tableY + 16),
      new Vector2(this.tableX + this.tableW / 2, this.tableY + 10),
      new Vector2(this.tableX + this.tableW - 16, this.tableY + 16),
      new Vector2(this.tableX + 16, this.tableY + this.tableH - 16),
      new Vector2(this.tableX + this.tableW / 2, this.tableY + this.tableH - 10),
      new Vector2(this.tableX + this.tableW - 16, this.tableY + this.tableH - 16),
    ];

    this.balls = [];

    // Cue Ball (White)
    this.balls.push({
      pos: new Vector2(this.tableX + this.tableW / 2, this.tableY + this.tableH - 90),
      vel: Vector2.zero(),
      radius: 9,
      color: "#FFFFFF",
      isCue: true,
      potted: false,
      points: 0,
    });

    // Target Colored Balls in Pyramid Formation
    const targetColors = ["#ffd84d", "#ff5c8a", "#4de8e8", "#a879ff", "#ff9f43", "#63e66d", "#ef4444", "#3b82f6"];
    const startX = this.tableX + this.tableW / 2;
    const startY = this.tableY + 130;

    let ballIndex = 0;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col <= row; col++) {
        const bx = startX + (col - row / 2) * 22;
        const by = startY - row * 19;
        this.balls.push({
          pos: new Vector2(bx, by),
          vel: Vector2.zero(),
          radius: 9,
          color: targetColors[ballIndex % targetColors.length],
          isCue: false,
          potted: false,
          points: (row + 1) * 100,
        });
        ballIndex++;
      }
    }

    this.isAiming = true;
    this.cueAngle = -Math.PI / 2;
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    let allStationary = true;
    const friction = 0.982;

    // 1. Move balls and apply table friction
    for (const ball of this.balls) {
      if (ball.potted) continue;

      if (ball.vel.sqrMagnitude() > 4) {
        allStationary = false;
        ball.pos.x += ball.vel.x * dt;
        ball.pos.y += ball.vel.y * dt;
        ball.vel = ball.vel.scale(friction);

        // Cushion Wall Bounces
        const minX = this.tableX + ball.radius + 12;
        const maxX = this.tableX + this.tableW - ball.radius - 12;
        const minY = this.tableY + ball.radius + 12;
        const maxY = this.tableY + this.tableH - ball.radius - 12;

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

        // Pocket check
        for (const pocket of this.pockets) {
          if (ball.pos.distance(pocket) < 22) {
            ball.potted = true;
            ball.vel = Vector2.zero();

            if (ball.isCue) {
              // Scratch penalty
              this.score = Math.max(0, this.score - 200);
              this.ctx.audio?.playExplosion?.();
              setTimeout(() => {
                ball.potted = false;
                ball.pos.set(this.tableX + this.tableW / 2, this.tableY + this.tableH - 90);
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

    // 2. Ball-to-Ball Elastic Collisions
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

          // Separate overlapping balls
          b1.pos = b1.pos.sub(normal.scale(overlap / 2));
          b2.pos = b2.pos.add(normal.scale(overlap / 2));

          // Elastic Momentum Exchange
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

    // Enable aiming once all balls have stopped
    if (allStationary && !this.isAiming) {
      this.isAiming = true;

      // Check if all target balls potted
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
      // Strike cue ball
      if (this.isAiming) {
        const cueBall = this.balls.find((b) => b.isCue && !b.potted);
        if (cueBall) {
          const impulse = Vector2.fromAngle(this.cueAngle).scale(this.cuePower);
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
    pr.clear("#050914");
    const w = renderer.getWidth();

    // Table Felt & Wooden Frame
    pr.drawRect(this.tableX - 14, this.tableY - 14, this.tableW + 28, this.tableH + 28, "#78350f", true);
    pr.drawRect(this.tableX, this.tableY, this.tableW, this.tableH, "#15803d", true);
    pr.drawRect(this.tableX, this.tableY, this.tableW, this.tableH, "#166534", false);

    // Pockets
    for (const p of this.pockets) {
      pr.drawCircle(p.x, p.y, 16, "#030712", true);
      pr.drawCircle(p.x, p.y, 16, "#475569", false);
    }

    // Aiming Cue Line
    const cueBall = this.balls.find((b) => b.isCue && !b.potted);
    if (this.isAiming && cueBall) {
      const aimDir = Vector2.fromAngle(this.cueAngle);
      const aimTarget = cueBall.pos.add(aimDir.scale(90));
      pr.drawLine(cueBall.pos.x, cueBall.pos.y, aimTarget.x, aimTarget.y, "#ffd84d", 2);

      // Cue Stick
      const cueStickStart = cueBall.pos.sub(aimDir.scale(18));
      const cueStickEnd = cueBall.pos.sub(aimDir.scale(90));
      pr.drawLine(cueStickStart.x, cueStickStart.y, cueStickEnd.x, cueStickEnd.y, "#f59e0b", 4);
    }

    // Balls
    for (const ball of this.balls) {
      if (ball.potted) continue;
      pr.drawCircle(ball.pos.x, ball.pos.y, ball.radius, ball.color, true);
      pr.drawCircle(ball.pos.x, ball.pos.y, ball.radius, "rgba(0,0,0,0.5)", false);
      if (ball.isCue) {
        pr.drawCircle(ball.pos.x, ball.pos.y, 3, "#ef4444", true);
      }
    }

    // Header HUD
    pr.drawText(`POOL SIMULATOR  •  LVL ${this.level}  •  AIM: ${Math.round((this.cueAngle * 180) / Math.PI)}°`, w / 2, 32, {
      size: 12,
      color: "#ffd84d",
      align: "center",
    });
    pr.drawText(`[LEFT/RIGHT] AIM CUE ANGLE    [SPACE/A] STRIKE CUE BALL`, w / 2, 54, {
      size: 10,
      color: "#94a3b8",
      align: "center",
    });
  }
}
