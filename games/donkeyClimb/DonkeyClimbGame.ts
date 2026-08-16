import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface Barrel {
  x: number;
  y: number;
  floor: number;
  dir: number;
  active: boolean;
  angle: number;
}

export class DonkeyClimbGame implements GameInstance {
  private ctx!: GameContext;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;

  private playerX: number = 80;
  private playerY: number = 550;
  private playerVY: number = 0;
  private isJumping: boolean = false;
  private isClimbing: boolean = false;
  private climbTimer: number = 0;
  private playerFloor: number = 0;
  private facingRight: boolean = true;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;

  private barrels: Barrel[] = [];
  private barrelSpawnTimer: number = 0;
  private animTime: number = 0;

  // 5 floors formatted cleanly for 600x700 viewport
  private readonly floors = [550, 440, 330, 220, 110];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.isPaused = false;
    this.gameOver = false;
    this.isWon = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.resetLevel();
  }

  private resetLevel(): void {
    this.playerX = 80;
    this.playerFloor = 0;
    this.playerY = this.floors[0];
    this.playerVY = 0;
    this.isJumping = false;
    this.isClimbing = false;
    this.barrels = [];
    this.barrelSpawnTimer = 0;
    this.isWon = false;
  }

  public update(deltaTime: number): void {
    globalParticles.update(deltaTime);
    if (this.isPaused || this.gameOver || this.isWon) return;
    this.animTime += deltaTime;

    const speed = 190;
    if (this.moveLeft && !this.isClimbing) {
      this.playerX -= speed * deltaTime;
      this.facingRight = false;
    }
    if (this.moveRight && !this.isClimbing) {
      this.playerX += speed * deltaTime;
      this.facingRight = true;
    }

    this.playerX = Math.max(50, Math.min(550, this.playerX));

    // Jump physics
    if (this.isJumping) {
      this.playerVY += 1000 * deltaTime;
      this.playerY += this.playerVY * deltaTime;

      if (this.playerY >= this.floors[this.playerFloor]) {
        this.playerY = this.floors[this.playerFloor];
        this.playerVY = 0;
        this.isJumping = false;
      }
    }

    // Climbing physics
    if (this.isClimbing) {
      this.climbTimer += deltaTime * 8;
    }

    // Barrel spawning & Kong roll animation
    this.barrelSpawnTimer += deltaTime;
    const spawnRate = Math.max(1.5, 3.2 - this.level * 0.4);
    if (this.barrelSpawnTimer > spawnRate) {
      this.barrelSpawnTimer = 0;
      this.barrels.push({
        x: 130,
        y: this.floors[4],
        floor: 4,
        dir: 1,
        active: true,
        angle: 0,
      });
      this.ctx.audio?.playDrop?.();
      globalParticles.emitBurst(130, this.floors[4] - 10, 8, ["#B45309", "#D97706"], 30, 100);
    }

    // Update barrels rolling across floors
    const barrelSpeed = 160 + this.level * 18;
    for (const b of this.barrels) {
      if (!b.active) continue;

      b.x += b.dir * barrelSpeed * deltaTime;
      b.angle += b.dir * 8 * deltaTime;

      // Check drop to next floor
      if (b.dir === 1 && b.x > 530) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floors[b.floor];
          b.dir = -1;
          this.ctx.audio?.playHit?.();
        } else {
          b.active = false;
          this.score += 50 * this.level;
        }
      } else if (b.dir === -1 && b.x < 70) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floors[b.floor];
          b.dir = 1;
          this.ctx.audio?.playHit?.();
        } else {
          b.active = false;
          this.score += 50 * this.level;
        }
      }

      // Check barrel collision with player
      if (
        b.floor === this.playerFloor &&
        Math.abs(b.x - this.playerX) < 22 &&
        Math.abs(b.y - this.playerY) < 26
      ) {
        this.lives--;
        this.ctx.audio?.playGameOver?.();
        globalParticles.emitBurst(this.playerX, this.playerY, 20, ["#FF3366", "#F59E0B", "#FFFFFF"], 80, 260);

        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        } else {
          this.resetLevel();
        }
        return;
      }
    }

    // Check rescue princess win condition
    if (this.playerFloor === 4 && this.playerX > 380) {
      this.isWon = true;
      this.score += 3000 * this.level;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(420, this.floors[4] - 20, 30, ["#EC4899", "#ffd84d", "#FFFFFF"], 90, 300);
      setTimeout(() => {
        this.level++;
        this.resetLevel();
      }, 1500);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (this.gameOver || this.isPaused || this.isWon) return;

    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;

    if (action === "MOVE_UP" && isPressed) {
      // Climb up ladder if aligned
      for (let f = 0; f < 4; f++) {
        if (this.playerFloor === f) {
          const ladderX = f % 2 === 0 ? 500 : 100;
          if (Math.abs(this.playerX - ladderX) < 32) {
            this.playerFloor = f + 1;
            this.playerY = this.floors[f + 1];
            this.playerX = ladderX;
            this.isClimbing = true;
            this.ctx.audio?.playJump?.();
            this.score += 100 * this.level;
            setTimeout(() => (this.isClimbing = false), 250);
            break;
          }
        }
      }
    } else if (action === "MOVE_DOWN" && isPressed) {
      // Climb down ladder
      for (let f = 1; f < 5; f++) {
        if (this.playerFloor === f) {
          const ladderX = (f - 1) % 2 === 0 ? 500 : 100;
          if (Math.abs(this.playerX - ladderX) < 32) {
            this.playerFloor = f - 1;
            this.playerY = this.floors[f - 1];
            this.playerX = ladderX;
            this.isClimbing = true;
            this.ctx.audio?.playJump?.();
            setTimeout(() => (this.isClimbing = false), 250);
            break;
          }
        }
      }
    } else if ((action === "ACTION_PRIMARY" || action === "ROTATE") && isPressed) {
      if (!this.isJumping && !this.isClimbing) {
        this.isJumping = true;
        this.playerVY = -440;
        this.ctx.audio?.playJump?.();
      }
    } else if (action === "RESTART" && isPressed) {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = pr.getWidth();
    const h = pr.getHeight();

    // 1. Steel Girders (Arcade Magenta Beams with Cross Trusses)
    for (let f = 0; f < 5; f++) {
      const gy = this.floors[f];
      pr.drawRect(40, gy, 520, 16, "#BE185D", true);
      pr.drawRect(40, gy + 12, 520, 4, "#831843", true);
      for (let x = 40; x < 550; x += 32) {
        pr.drawLine(x, gy, x + 16, gy + 16, "#FDA4AF", 1);
        pr.drawLine(x + 16, gy + 16, x + 32, gy + 16, "#FDA4AF", 1);
      }
    }

    // 2. Ladders with Blue Rails & Cyan Rungs
    for (let f = 0; f < 4; f++) {
      const lx = f % 2 === 0 ? 500 : 100;
      const topY = this.floors[f + 1];
      const botY = this.floors[f];

      pr.drawLine(lx - 12, topY + 16, lx - 12, botY, "#38BDF8", 3);
      pr.drawLine(lx + 12, topY + 16, lx + 12, botY, "#38BDF8", 3);

      for (let y = topY + 24; y < botY; y += 14) {
        pr.drawLine(lx - 12, y, lx + 12, y, "#93C5FD", 2);
      }
    }

    // 3. Draw Donkey Kong with Barrel Launcher Hopper
    const apeX = 90;
    const apeY = this.floors[4] - 38;
    // Wooden Barrel Hopper Stack
    pr.drawPixelRect(30, apeY + 6, 26, 28, "#B45309", "#D97706", "#78350F");
    pr.drawPixelRect(36, apeY - 14, 24, 24, "#B45309", "#D97706", "#78350F");

    // Kong Gorilla Body
    pr.drawRect(apeX - 22, apeY - 4, 44, 38, "#78350F", true);
    pr.drawCircle(apeX, apeY - 12, 16, "#92400E", true);
    pr.drawCircle(apeX, apeY + 8, 14, "#D97706", true);
    // Expressive Gorilla Eyes & Snout
    pr.drawCircle(apeX - 6, apeY - 14, 3, "#FFFFFF", true);
    pr.drawCircle(apeX + 6, apeY - 14, 3, "#FFFFFF", true);
    pr.drawCircle(apeX - 5, apeY - 14, 1.5, "#000000", true);
    pr.drawCircle(apeX + 7, apeY - 14, 1.5, "#000000", true);

    // 4. Draw Pauline Damsel
    const damselX = 420;
    const damselY = this.floors[4] - 28;
    pr.drawRect(damselX - 8, damselY + 8, 16, 20, "#F472B6", true);
    pr.drawCircle(damselX, damselY, 7, "#FDE047", true);
    pr.drawCircle(damselX, damselY + 2, 5, "#FED7AA", true);
    const heartPulse = Math.sin(this.animTime * 4) * 3;
    pr.drawText("HELP!", damselX, damselY - 16 + heartPulse, { size: 12, color: "#F43F5E", align: "center", font: "monospace" });

    // 5. Draw Animated Rolling Barrels
    for (const b of this.barrels) {
      if (!b.active) continue;
      pr.save();
      pr.translate(b.x, b.y - 12);
      pr.rotate(b.angle);

      // Wooden Barrel with Metallic Bands & Spokes
      pr.drawCircle(0, 0, 13, "#B45309", true);
      pr.drawCircle(0, 0, 13, "#78350F", false);
      pr.drawLine(-11, -5, 11, -5, "#CBD5E1", 2);
      pr.drawLine(-11, 5, 11, 5, "#CBD5E1", 2);
      pr.drawLine(-6, -11, -6, 11, "#78350F", 1.5);
      pr.drawLine(6, -11, 6, 11, "#78350F", 1.5);
      pr.restore();
    }

    // 6. Draw Detailed Jumpman Player Character
    const px = this.playerX;
    const py = this.playerY;

    if (this.isClimbing) {
      // Climbing pose (facing ladder, alternating arms)
      const armFlip = Math.sin(this.climbTimer) > 0;
      pr.drawRect(px - 7, py - 20, 14, 18, "#2563EB", true); // Blue overalls back
      pr.drawCircle(px, py - 26, 6, "#DC2626", true); // Red Cap
      pr.drawRect(px - 10, py - 28 + (armFlip ? -4 : 4), 4, 8, "#DC2626", true);
      pr.drawRect(px + 6, py - 28 + (armFlip ? 4 : -4), 4, 8, "#DC2626", true);
    } else {
      // Running / Jumping Pose
      const walkBob = Math.sin(this.animTime * 14) * 2;
      pr.drawRect(px - 8, py - 18 + walkBob, 16, 18, "#DC2626", true); // Red Shirt
      pr.drawRect(px - 7, py - 12 + walkBob, 14, 12, "#2563EB", true); // Blue Overalls
      pr.drawRect(px - 3, py - 10 + walkBob, 6, 2, "#FACC15", true); // Yellow Buckle

      // Head & Cap
      pr.drawCircle(px, py - 24 + walkBob, 6, "#FED7AA", true);
      pr.drawRect(px - 8, py - 30 + walkBob, 16, 6, "#DC2626", true);

      // Mustache & Face
      const eyeX = this.facingRight ? px + 3 : px - 3;
      pr.drawRect(eyeX - 1, py - 25 + walkBob, 2, 2, "#000000", true);
      pr.drawRect(eyeX - 3, py - 22 + walkBob, 6, 3, "#451A03", true); // Mustache
    }

    // Render Global Particles & Floating Text
    globalParticles.render(pr);

    // Top HUD
    pr.drawRect(0, 0, w, 44, "#080e1c", true);
    pr.drawLine(0, 44, w, 44, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 28, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`DONKEY CLIMB • LVL ${this.level}`, w / 2, 28, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 28, { size: 13, color: "#f43f5e", align: "right", font: "monospace" });

    // Overlay messages
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 40, w, 80, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 40, w, 80, "#ef4444", false);
      pr.drawText("GAME OVER", w / 2, h / 2 - 6, { size: 24, color: "#ef4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RETRY", w / 2, h / 2 + 20, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 40, w, 80, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 40, w, 80, "#22c55e", false);
      pr.drawText("STAGE CLEAR!", w / 2, h / 2 - 6, { size: 24, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("DAMSEL RESCUED!", w / 2, h / 2 + 20, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
