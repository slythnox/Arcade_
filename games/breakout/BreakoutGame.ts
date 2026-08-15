import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import type { Rectangle } from "../../core/types/geometry";
import { clamp } from "../../core/math/interpolation";
import { testBallBrickCollision, calculatePaddleReflection } from "./BreakoutPhysics";
import { generateBreakoutLevel, type Brick } from "./BreakoutLevel";
import { globalParticles } from "../../engine/particles/ParticleSystem";

export class BreakoutGame implements GameInstance {
  private ctx!: GameContext;

  private courtWidth: number = 540;
  private courtHeight: number = 620;
  private courtOffsetX: number = 30;
  private courtOffsetY: number = 40;

  // Paddle
  private paddle: Rectangle = { x: 230, y: 580, width: 78, height: 12 };
  private paddleSpeed: number = 420; // pixels per sec
  private paddleMoveDir: number = 0; // -1, 0, 1

  // Ball
  private ballPos: Vector2 = new Vector2(270, 540);
  private ballVel: Vector2 = new Vector2(150, -320);
  private ballRadius: number = 4;
  private baseSpeed: number = 340;
  private ballAttached: boolean = true; // wait for player launch

  // Bricks
  private bricks: Brick[] = [];

  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  constructor() {}

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.initLevel();
  }

  private initLevel(): void {
    this.courtWidth = 540;
    this.courtHeight = 620;
    this.courtOffsetX = 30;
    this.courtOffsetY = 40;

    this.paddle.x = this.courtOffsetX + (this.courtWidth - this.paddle.width) / 2;
    this.paddle.y = this.courtOffsetY + this.courtHeight - 34;
    this.resetBall();

    // Generate dense smaller bricks across 16 columns
    this.bricks = generateBreakoutLevel(
      this.level,
      this.courtWidth - 24,
      this.courtOffsetX + 12,
      this.courtOffsetY + 30
    );
  }

  private resetBall(): void {
    this.ballAttached = true;
    this.ballPos.set(
      this.paddle.x + this.paddle.width / 2,
      this.paddle.y - this.ballRadius - 2
    );
    const speed = this.baseSpeed + (this.level - 1) * 15;
    this.ballVel.set(130, -speed);
  }

  public update(deltaTime: number): void {
    globalParticles.update(deltaTime);
    if (this.gameOver || this.isPaused) return;

    // Move paddle
    if (this.paddleMoveDir !== 0) {
      this.paddle.x += this.paddleMoveDir * this.paddleSpeed * deltaTime;
      this.paddle.x = clamp(
        this.paddle.x,
        this.courtOffsetX,
        this.courtOffsetX + this.courtWidth - this.paddle.width
      );
    }

    if (this.ballAttached) {
      this.ballPos.x = this.paddle.x + this.paddle.width / 2;
      this.ballPos.y = this.paddle.y - this.ballRadius - 2;
      return;
    }

    // Move ball
    this.ballPos.x += this.ballVel.x * deltaTime;
    this.ballPos.y += this.ballVel.y * deltaTime;

    // Wall reflections
    // Left wall
    if (this.ballPos.x - this.ballRadius <= this.courtOffsetX) {
      this.ballPos.x = this.courtOffsetX + this.ballRadius;
      this.ballVel.x = Math.abs(this.ballVel.x);
      this.ctx.audio?.playHit?.();
    }
    // Right wall
    if (this.ballPos.x + this.ballRadius >= this.courtOffsetX + this.courtWidth) {
      this.ballPos.x = this.courtOffsetX + this.courtWidth - this.ballRadius;
      this.ballVel.x = -Math.abs(this.ballVel.x);
      this.ctx.audio?.playHit?.();
    }
    // Top ceiling
    if (this.ballPos.y - this.ballRadius <= this.courtOffsetY) {
      this.ballPos.y = this.courtOffsetY + this.ballRadius;
      this.ballVel.y = Math.abs(this.ballVel.y);
      this.ctx.audio?.playHit?.();
    }

    // Bottom out of bounds (lost life)
    if (this.ballPos.y - this.ballRadius >= this.courtOffsetY + this.courtHeight) {
      this.lives--;
      this.ctx.audio?.playGameOver?.();
      if (this.lives <= 0) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      } else {
        this.resetBall();
      }
      return;
    }

    // Paddle collision
    if (
      this.ballVel.y > 0 &&
      this.ballPos.y + this.ballRadius >= this.paddle.y &&
      this.ballPos.y - this.ballRadius <= this.paddle.y + this.paddle.height &&
      this.ballPos.x >= this.paddle.x &&
      this.ballPos.x <= this.paddle.x + this.paddle.width
    ) {
      const currentSpeed = this.baseSpeed + (this.level - 1) * 15;
      this.ballVel = calculatePaddleReflection(this.ballPos, currentSpeed, this.paddle);
      this.ctx.audio?.playHit?.();
    }

    // Brick collisions
    for (const brick of this.bricks) {
      if (brick.destroyed) continue;

      const test = testBallBrickCollision(
        { x: this.ballPos.x, y: this.ballPos.y, radius: this.ballRadius },
        brick
      );

      if (test.hit) {
        brick.destroyed = true;
        const pts = brick.points * this.level;
        this.score += pts;
        this.ctx.audio?.playCoin?.();

        globalParticles.emitBurst(
          brick.x + brick.width / 2,
          brick.y + brick.height / 2,
          12,
          [brick.color || "#FF5C8A", "#FFD700", "#ffffff"],
          50,
          200
        );
        globalParticles.emitText(`+${pts}`, brick.x + brick.width / 2, brick.y, "#FFD700", 14);

        // Reflect ball off collision normal
        if (test.normal.x !== 0) {
          this.ballVel.x = Math.abs(this.ballVel.x) * test.normal.x;
        }
        if (test.normal.y !== 0) {
          this.ballVel.y = Math.abs(this.ballVel.y) * test.normal.y;
        }

        break;
      }
    }

    // Check level clear
    const remainingBricks = this.bricks.filter((b) => !b.destroyed).length;
    if (remainingBricks === 0) {
      this.level++;
      this.score += 500 * this.level;
      this.ctx.audio?.playVictory?.();
      this.initLevel();
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (this.gameOver || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.paddleMoveDir = isPressed ? -1 : this.paddleMoveDir === -1 ? 0 : this.paddleMoveDir;
    } else if (action === "MOVE_RIGHT") {
      this.paddleMoveDir = isPressed ? 1 : this.paddleMoveDir === 1 ? 0 : this.paddleMoveDir;
    } else if (action === "ACTION_PRIMARY" && isPressed) {
      // Launch ball
      if (this.ballAttached) {
        this.ballAttached = false;
        this.ctx.audio?.playRotate?.();
      }
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public destroy(): void {
    this.bricks = [];
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.level;
  }

  public getLives(): number {
    return this.lives;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040711");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    this.courtWidth = 540;
    this.courtHeight = 620;
    this.courtOffsetX = Math.floor((w - this.courtWidth) / 2);
    this.courtOffsetY = Math.floor((h - this.courtHeight) / 2);

    // Court background & boundary
    pr.drawRect(
      this.courtOffsetX - 3,
      this.courtOffsetY - 3,
      this.courtWidth + 6,
      this.courtHeight + 6,
      "#080e1c",
      true
    );
    pr.drawRect(
      this.courtOffsetX - 3,
      this.courtOffsetY - 3,
      this.courtWidth + 6,
      this.courtHeight + 6,
      "rgba(77, 232, 232, 0.4)",
      false
    );

    // Render all small dense bricks with beveled edges
    for (const brick of this.bricks) {
      if (!brick.destroyed) {
        pr.drawPixelRect(
          brick.x,
          brick.y,
          brick.width,
          brick.height,
          brick.color,
          brick.glow,
          "rgba(0, 0, 0, 0.45)"
        );
      }
    }

    // Paddle
    pr.drawPixelRect(
      this.paddle.x,
      this.paddle.y,
      this.paddle.width,
      this.paddle.height,
      "#ffd84d",
      "#ffffff",
      "#b45309"
    );

    // Ball
    pr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius + 2, "rgba(77, 232, 232, 0.35)", true);
    pr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius, "#FFFFFF", true);

    if (this.ballAttached && !this.gameOver) {
      pr.drawText("[ PRESS SPACE TO LAUNCH BALL ]", w / 2, this.courtOffsetY + this.courtHeight - 60, {
        size: 11,
        color: "#4de8e8",
        align: "center",
      });
    }

    // Render Particles & Floating Text
    globalParticles.render(pr);

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4, 6, 14, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("GAME OVER", w / 2, h / 2 - 10, {
        size: 26,
        color: "#FF3366",
        align: "center",
      });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, {
        size: 12,
        color: "#e2e8f0",
        align: "center",
      });
    }
  }
}
