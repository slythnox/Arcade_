import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import type { Rectangle } from "../../core/types/geometry";
import { clamp } from "../../core/math/interpolation";
import { calculatePongPaddleReflection } from "./PongPhysics";
import { globalParticles } from "../../engine/particles/ParticleSystem";

export class PongGame implements GameInstance {
  private ctx!: GameContext;

  private courtWidth: number = 560;
  private courtHeight: number = 640;
  private courtOffsetX: number = 20;
  private courtOffsetY: number = 30;

  // Paddles (Elongated paddle dash size: 92px height)
  private playerPaddle: Rectangle = { x: 38, y: 220, width: 14, height: 92 };
  private aiPaddle: Rectangle = { x: 548, y: 220, width: 14, height: 92 };
  private paddleSpeed: number = 380;
  private playerMoveDir: number = 0; // -1 (up), 0, 1 (down)

  // Ball
  private ballPos: Vector2 = new Vector2(300, 350);
  private ballVel: Vector2 = new Vector2(240, 120);
  private ballRadius: number = 6;
  private baseSpeed: number = 300;
  private currentSpeed: number = 300;

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
    const angle = (this.ctx.random.nextFloat() * 0.6 - 0.3) * Math.PI;
    this.ballVel.set(
      dirX * Math.cos(angle) * this.currentSpeed,
      Math.sin(angle) * this.currentSpeed
    );
    this.serveTimer = 0.8;
  }

  public update(deltaTime: number): void {
    globalParticles.update(deltaTime);
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

    // AI paddle tracking
    const targetY = this.ballPos.y - this.aiPaddle.height / 2;
    const aiDiff = targetY - this.aiPaddle.y;
    const aiMaxStep = this.paddleSpeed * 0.85 * deltaTime;
    this.aiPaddle.y += clamp(aiDiff, -aiMaxStep, aiMaxStep);
    this.aiPaddle.y = clamp(
      this.aiPaddle.y,
      this.courtOffsetY,
      this.courtOffsetY + this.courtHeight - this.aiPaddle.height
    );

    // Ball movement
    this.ballPos.x += this.ballVel.x * deltaTime;
    this.ballPos.y += this.ballVel.y * deltaTime;

    // Top / bottom boundary collisions
    if (this.ballPos.y - this.ballRadius <= this.courtOffsetY) {
      this.ballPos.y = this.courtOffsetY + this.ballRadius;
      this.ballVel.y = Math.abs(this.ballVel.y);
      this.ctx.audio?.playHit?.();
    } else if (this.ballPos.y + this.ballRadius >= this.courtOffsetY + this.courtHeight) {
      this.ballPos.y = this.courtOffsetY + this.courtHeight - this.ballRadius;
      this.ballVel.y = -Math.abs(this.ballVel.y);
      this.ctx.audio?.playHit?.();
    }

    // Player paddle collision
    if (
      this.ballVel.x < 0 &&
      this.ballPos.x - this.ballRadius <= this.playerPaddle.x + this.playerPaddle.width &&
      this.ballPos.x + this.ballRadius >= this.playerPaddle.x &&
      this.ballPos.y >= this.playerPaddle.y &&
      this.ballPos.y <= this.playerPaddle.y + this.playerPaddle.height
    ) {
      this.rallyCount++;
      this.currentSpeed = Math.min(650, this.currentSpeed + 15);
      this.ballVel = calculatePongPaddleReflection(
        this.ballPos.y,
        this.playerPaddle,
        this.currentSpeed,
        true
      );
      this.ctx.audio?.playHit?.();
      globalParticles.emitBurst(
        this.playerPaddle.x + this.playerPaddle.width,
        this.ballPos.y,
        8,
        ["#00F0FF", "#FFFFFF", "#38BDF8"],
        50,
        200
      );
    }

    // AI paddle collision
    if (
      this.ballVel.x > 0 &&
      this.ballPos.x + this.ballRadius >= this.aiPaddle.x &&
      this.ballPos.x - this.ballRadius <= this.aiPaddle.x + this.aiPaddle.width &&
      this.ballPos.y >= this.aiPaddle.y &&
      this.ballPos.y <= this.aiPaddle.y + this.aiPaddle.height
    ) {
      this.currentSpeed = Math.min(650, this.currentSpeed + 15);
      this.ballVel = calculatePongPaddleReflection(
        this.ballPos.y,
        this.aiPaddle,
        this.currentSpeed,
        false
      );
      this.ctx.audio?.playHit?.();
      globalParticles.emitBurst(
        this.aiPaddle.x,
        this.ballPos.y,
        8,
        ["#FF3366", "#FFFFFF", "#FDA4AF"],
        50,
        200
      );
    }

    // Player scores (ball passes AI on right)
    if (this.ballPos.x - this.ballRadius >= this.courtOffsetX + this.courtWidth) {
      this.playerScore++;
      this.ctx.audio?.playCoin?.();
      globalParticles.emitText("+1 POINT", this.courtOffsetX + this.courtWidth / 2, this.courtOffsetY + 100, "#ffd84d", 20);
      if (this.playerScore >= this.winningScore) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio?.playVictory?.();
      } else {
        this.resetBall(false);
      }
    }

    // AI scores (ball passes player on left)
    if (this.ballPos.x + this.ballRadius <= this.courtOffsetX) {
      this.aiScore++;
      this.ctx.audio?.playGameOver?.();
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
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    this.courtWidth = 560;
    this.courtHeight = 640;
    this.courtOffsetX = Math.floor((w - this.courtWidth) / 2);
    this.courtOffsetY = Math.floor((h - this.courtHeight) / 2);

    this.playerPaddle.x = this.courtOffsetX + 18;
    this.aiPaddle.x = this.courtOffsetX + this.courtWidth - 32;

    // Court metallic frame & illuminated boundary
    pr.drawRect(this.courtOffsetX - 4, this.courtOffsetY - 4, this.courtWidth + 8, this.courtHeight + 8, "#1e293b", true);
    pr.drawRect(this.courtOffsetX - 2, this.courtOffsetY - 2, this.courtWidth + 4, this.courtHeight + 4, "#0f172a", true);
    pr.drawRect(this.courtOffsetX - 2, this.courtOffsetY - 2, this.courtWidth + 4, this.courtHeight + 4, "#00F0FF", false);

    // Center dividing neon dashed line
    const centerX = this.courtOffsetX + this.courtWidth / 2;
    for (let y = this.courtOffsetY + 10; y < this.courtOffsetY + this.courtHeight; y += 22) {
      pr.drawRect(centerX - 1, y, 2, 12, "rgba(0, 240, 255, 0.4)", true);
    }

    // Elongated player paddle with cyan glow bevels
    pr.drawPixelRect(
      this.playerPaddle.x,
      this.playerPaddle.y,
      this.playerPaddle.width,
      this.playerPaddle.height,
      "#00F0FF",
      "#E0F2FE",
      "#0284C7"
    );

    // Elongated AI paddle with red/orange glow bevels
    pr.drawPixelRect(
      this.aiPaddle.x,
      this.aiPaddle.y,
      this.aiPaddle.width,
      this.aiPaddle.height,
      "#FF3366",
      "#FFE4E6",
      "#BE123C"
    );

    // Ball with glowing aura
    pr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius + 3, "rgba(0, 240, 255, 0.4)", true);
    pr.drawCircle(this.ballPos.x, this.ballPos.y, this.ballRadius, "#FFFFFF", true);

    // Score Board
    pr.drawText(this.playerScore.toString(), centerX - 60, this.courtOffsetY + 55, {
      size: 40,
      color: "#00F0FF",
      align: "center",
      font: "monospace",
    });
    pr.drawText(this.aiScore.toString(), centerX + 60, this.courtOffsetY + 55, {
      size: 40,
      color: "#FF3366",
      align: "center",
      font: "monospace",
    });

    // Render Particles & Score Text Popups
    globalParticles.render(pr);

    // Game Over Overlay
    if (this.gameOver) {
      const playerWon = this.playerScore >= this.winningScore;
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, playerWon ? "#ffd84d" : "#FF3366", false);
      pr.drawText(playerWon ? "VICTORY!" : "DEFEAT", w / 2, h / 2 - 10, {
        size: 28,
        color: playerWon ? "#ffd84d" : "#FF3366",
        align: "center",
        font: "monospace",
      });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, {
        size: 13,
        color: "#cbd5e1",
        align: "center",
        font: "monospace",
      });
    }
  }
}
