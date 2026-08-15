import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import type { Rectangle } from "../../core/types/geometry";
import { clamp } from "../../core/utils";
import { calculatePongPaddleReflection } from "./PongPhysics";

export class PongGame implements GameInstance {
  private ctx!: GameContext;

  private courtWidth: number = 440;
  private courtHeight: number = 400;
  private courtOffsetX: number = 20;
  private courtOffsetY: number = 60;

  // Paddles
  private playerPaddle: Rectangle = { x: 30, y: 220, width: 10, height: 60 };
  private aiPaddle: Rectangle = { x: 440, y: 220, width: 10, height: 60 };
  private paddleSpeed: number = 320;
  private playerMoveDir: number = 0; // -1 (up), 0, 1 (down)

  // Ball
  private ballPos: Vector2 = new Vector2(240, 260);
  private ballVel: Vector2 = new Vector2(200, 100);
  private ballRadius: number = 5;
  private baseSpeed: number = 260;
  private currentSpeed: number = 260;

  private playerScore: number = 0;
  private aiScore: number = 0;
  private winningScore: number = 7;
  private rallyCount: number = 0;

  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private serveTimer: number = 0.5;

  constructor() {}

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.playerScore = 0;
    this.aiScore = 0;
    this.rallyCount = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.resetBall(true);
  }

  private resetBall(toPlayer: boolean): void {
    this.currentSpeed = this.baseSpeed;
    this.ballPos.set(
      this.courtOffsetX + this.courtWidth / 2,
      this.courtOffsetY + this.courtHeight / 2
    );
    const dirX = toPlayer ? -1 : 1;
    const angle = (this.ctx.random.nextFloat() * 0.6 - 0.3) * Math.PI; // -30 to +30 deg
    this.ballVel.set(
      dirX * Math.cos(angle) * this.currentSpeed,
      Math.sin(angle) * this.currentSpeed
    );
    this.serveTimer = 0.8;
  }

  public update(deltaTime: number): void {
    if (this.gameOver || this.isPaused) return;

    if (this.serveTimer > 0) {
      this.serveTimer -= deltaTime;
      return;
    }

    // Player paddle movement
    if (this.playerMoveDir !== 0) {
      this.playerPaddle.y += this.playerMoveDir * this.paddleSpeed * deltaTime;
      this.playerPaddle.y = clamp(
        this.playerPaddle.y,
        this.courtOffsetY,
        this.courtOffsetY + this.courtHeight - this.playerPaddle.height
      );
    }

    // AI paddle movement (smooth tracking with slight latency)
    const aiTargetY = this.ballPos.y - this.aiPaddle.height / 2;
    const aiDiff = aiTargetY - this.aiPaddle.y;
    const aiSpeed = this.paddleSpeed * 0.82; // Balanced AI
    if (Math.abs(aiDiff) > 6) {
      this.aiPaddle.y += Math.sign(aiDiff) * aiSpeed * deltaTime;
      this.aiPaddle.y = clamp(
        this.aiPaddle.y,
        this.courtOffsetY,
        this.courtOffsetY + this.courtHeight - this.aiPaddle.height
      );
    }

    // Ball movement
    this.ballPos.x += this.ballVel.x * deltaTime;
    this.ballPos.y += this.ballVel.y * deltaTime;

    // Top/bottom court wall reflections
    if (this.ballPos.y - this.ballRadius <= this.courtOffsetY) {
      this.ballPos.y = this.courtOffsetY + this.ballRadius;
      this.ballVel.y = Math.abs(this.ballVel.y);
      this.ctx.audio.playHit();
    }
    if (this.ballPos.y + this.ballRadius >= this.courtOffsetY + this.courtHeight) {
      this.ballPos.y = this.courtOffsetY + this.courtHeight - this.ballRadius;
      this.ballVel.y = -Math.abs(this.ballVel.y);
      this.ctx.audio.playHit();
    }

    // Player paddle collision (Left side)
    if (
      this.ballVel.x < 0 &&
      this.ballPos.x - this.ballRadius <= this.playerPaddle.x + this.playerPaddle.width &&
      this.ballPos.x + this.ballRadius >= this.playerPaddle.x &&
      this.ballPos.y >= this.playerPaddle.y &&
      this.ballPos.y <= this.playerPaddle.y + this.playerPaddle.height
    ) {
      this.currentSpeed += 10;
      this.rallyCount++;
      this.ballVel = calculatePongPaddleReflection(
        this.ballPos.y,
        this.playerPaddle,
        this.currentSpeed,
        true
      );
      this.ctx.audio.playHit();
    }

    // AI paddle collision (Right side)
    if (
      this.ballVel.x > 0 &&
      this.ballPos.x + this.ballRadius >= this.aiPaddle.x &&
      this.ballPos.x - this.ballRadius <= this.aiPaddle.x + this.aiPaddle.width &&
      this.ballPos.y >= this.aiPaddle.y &&
      this.ballPos.y <= this.aiPaddle.y + this.aiPaddle.height
    ) {
      this.currentSpeed += 10;
      this.rallyCount++;
      this.ballVel = calculatePongPaddleReflection(
        this.ballPos.y,
        this.aiPaddle,
        this.currentSpeed,
        false
      );
      this.ctx.audio.playHit();
    }

    // Scoring conditions
    // Player scores (ball passes AI on right)
    if (this.ballPos.x - this.ballRadius >= this.courtOffsetX + this.courtWidth) {
      this.playerScore++;
      this.ctx.audio.playCoin();
      if (this.playerScore >= this.winningScore) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio.playVictory();
      } else {
        this.resetBall(false);
      }
    }

    // AI scores (ball passes player on left)
    if (this.ballPos.x + this.ballRadius <= this.courtOffsetX) {
      this.aiScore++;
      this.ctx.audio.playGameOver();
      if (this.aiScore >= this.winningScore) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      } else {
        this.resetBall(true);
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (this.gameOver || this.isPaused) return;

    if (action === "MOVE_UP") {
      this.playerMoveDir = isPressed ? -1 : this.playerMoveDir === -1 ? 0 : this.playerMoveDir;
    } else if (action === "MOVE_DOWN") {
      this.playerMoveDir = isPressed ? 1 : this.playerMoveDir === 1 ? 0 : this.playerMoveDir;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public destroy(): void {}

  public getScore(): number {
    return this.playerScore * 100 + this.rallyCount * 10;
  }

  public getLevel(): number {
    return 1;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    this.courtWidth = 560;
    this.courtHeight = 640;
    this.courtOffsetX = Math.floor((w - this.courtWidth) / 2); // 20
    this.courtOffsetY = Math.floor((h - this.courtHeight) / 2); // 30

    this.playerPaddle.x = this.courtOffsetX + 18;
    this.aiPaddle.x = this.courtOffsetX + this.courtWidth - 28;

    // Court background & illuminated boundary
    pr.drawRect(this.courtOffsetX - 4, this.courtOffsetY - 4, this.courtWidth + 8, this.courtHeight + 8, "#080e08", true);
    pr.drawRect(this.courtOffsetX - 4, this.courtOffsetY - 4, this.courtWidth + 8, this.courtHeight + 8, "rgba(0, 255, 102, 0.55)", false);

    // Center laser dividing line
    const centerX = this.courtOffsetX + this.courtWidth / 2;
    for (let y = this.courtOffsetY + 10; y < this.courtOffsetY + this.courtHeight; y += 20) {
      pr.drawRect(centerX - 1, y, 2, 10, "rgba(0, 255, 102, 0.35)", true);
    }

    // Paddles with glowing bevels
    pr.drawPixelBlock(this.playerPaddle.x, this.playerPaddle.y, this.playerPaddle.width, "#00FF66", "#FFFFFF", "#047857");
    pr.drawPixelBlock(this.aiPaddle.x, this.aiPaddle.y, this.aiPaddle.width, "#FFB703", "#FFFBEB", "#B45309");

    // Ball with glowing aura
    pr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius + 2, "rgba(0, 255, 102, 0.3)", true);
    pr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius, "#FFFFFF", true);

    // Score Board
    pr.drawText(this.playerScore.toString(), centerX - 60, this.courtOffsetY + 50, {
      size: 40,
      color: "#00FF66",
      align: "center",
    });
    pr.drawText(this.aiScore.toString(), centerX + 60, this.courtOffsetY + 50, {
      size: 40,
      color: "#FFB703",
      align: "center",
    });

    // Game Over Overlay
    if (this.gameOver) {
      const playerWon = this.playerScore >= this.winningScore;
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4, 6, 4, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, playerWon ? "#00FF66" : "#FF3366", false);
      pr.drawText(playerWon ? "PLAYER 1 WINS!" : "AI OPPONENT WINS", w / 2, h / 2 - 10, {
        size: 28,
        color: playerWon ? "#00FF66" : "#FF3366",
        align: "center",
      });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, {
        size: 13,
        color: "#F0F4F0",
        align: "center",
      });
    }
  }
}
