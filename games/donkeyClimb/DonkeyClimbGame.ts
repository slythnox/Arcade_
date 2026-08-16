import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

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
    this.barrels = [];
    this.barrelSpawnTimer = 0;
    this.isWon = false;
  }

  public update(deltaTime: number): void {
    if (this.isPaused || this.gameOver || this.isWon) return;
    this.animTime += deltaTime;

    const speed = 180;
    if (this.moveLeft) {
      this.playerX -= speed * deltaTime;
      this.facingRight = false;
    }
    if (this.moveRight) {
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

    // Barrel spawning
    this.barrelSpawnTimer += deltaTime;
    const spawnRate = Math.max(1.5, 3.5 - this.level * 0.4);
    if (this.barrelSpawnTimer > spawnRate) {
      this.barrelSpawnTimer = 0;
      this.barrels.push({
        x: 180,
        y: this.floors[4],
        floor: 4,
        dir: 1,
        active: true,
        angle: 0,
      });
      this.ctx.audio.playDrop();
    }

    // Barrel updates
    const barrelSpeed = 160 + this.level * 20;
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];
      if (!b.active) continue;

      b.x += b.dir * barrelSpeed * deltaTime;
      b.angle += b.dir * deltaTime * 10;

      // Drop to next floor at edges
      if (b.dir === 1 && b.x > 520) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floors[b.floor];
          b.dir = -1;
          this.ctx.audio.playHit();
        } else {
          b.active = false;
        }
      } else if (b.dir === -1 && b.x < 80) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floors[b.floor];
          b.dir = 1;
          this.ctx.audio.playHit();
        } else {
          b.active = false;
        }
      }

      // Collision with player
      const dx = Math.abs(b.x - this.playerX);
      const dy = Math.abs(b.y - this.playerY);
      if (b.floor === this.playerFloor && dx < 22 && dy < 24) {
        this.lives--;
        this.ctx.audio.playExplosion();
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
          this.ctx.audio.playGameOver();
        } else {
          this.resetLevel();
        }
        return;
      }

      // Jumping over barrel score bonus
      if (this.isJumping && b.floor === this.playerFloor && dx < 20 && this.playerY < b.y - 10) {
        this.score += 100;
        this.ctx.audio.playCoin();
      }
    }

    // Win condition: Reach top platform near damsel (x > 380, floor 4)
    if (this.playerFloor === 4 && this.playerX > 360) {
      this.isWon = true;
      this.score += 1000 * this.level;
      this.ctx.audio.playVictory();
      setTimeout(() => {
        this.level++;
        this.resetLevel();
      }, 1500);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;

    if (!isPressed) return;

    if (action === "MOVE_UP") {
      if (!this.isJumping && this.playerFloor < 4) {
        const ladderX = this.playerFloor % 2 === 0 ? 500 : 100;
        if (Math.abs(this.playerX - ladderX) < 40) {
          this.playerFloor++;
          this.playerY = this.floors[this.playerFloor];
          this.ctx.audio.playMove();
        }
      }
    } else if (action === "MOVE_DOWN") {
      if (!this.isJumping && this.playerFloor > 0) {
        const ladderX = (this.playerFloor - 1) % 2 === 0 ? 500 : 100;
        if (Math.abs(this.playerX - ladderX) < 40) {
          this.playerFloor--;
          this.playerY = this.floors[this.playerFloor];
          this.ctx.audio.playMove();
        }
      }
    } else if (action === "ACTION_PRIMARY" || action === "ROTATE") {
      if (!this.isJumping) {
        this.isJumping = true;
        this.playerVY = -420;
        this.ctx.audio.playRotate();
      }
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = pr.getWidth();
    const h = pr.getHeight();

    // 1. Draw Steel Girders (Retro Magenta / Blue Arcade Beams with cross trusses)
    for (let f = 0; f < 5; f++) {
      const gy = this.floors[f];
      pr.drawRect(40, gy, 520, 16, "#be185d", true); // Beam Top
      pr.drawRect(40, gy + 12, 520, 4, "#831843", true); // Bottom Shadow
      // Truss Cross Hatches
      for (let x = 40; x < 550; x += 32) {
        pr.drawLine(x, gy, x + 16, gy + 16, "#fda4af", 1);
        pr.drawLine(x + 16, gy, x + 32, gy + 16, "#fda4af", 1);
      }
    }

    // 2. Draw Ladders with Blue Rails & Cyan Rungs
    for (let f = 0; f < 4; f++) {
      const lx = f % 2 === 0 ? 500 : 100;
      const topY = this.floors[f + 1];
      const botY = this.floors[f];

      pr.drawLine(lx - 12, topY + 16, lx - 12, botY, "#38bdf8", 3);
      pr.drawLine(lx + 12, topY + 16, lx + 12, botY, "#38bdf8", 3);

      for (let y = topY + 24; y < botY; y += 14) {
        pr.drawLine(lx - 12, y, lx + 12, y, "#93c5fd", 2);
      }
    }

    // 3. Draw Kong Ape at top-left
    const apeX = 90;
    const apeY = this.floors[4] - 38;
    // Ape Body
    pr.drawRect(apeX - 20, apeY, 40, 36, "#78350f", true);
    // Ape Face & Chest
    pr.drawCircle(apeX, apeY - 10, 14, "#92400e", true);
    pr.drawCircle(apeX, apeY + 10, 12, "#d97706", true);
    // Eyes
    pr.drawCircle(apeX - 5, apeY - 12, 2.5, "#ffffff", true);
    pr.drawCircle(apeX + 5, apeY - 12, 2.5, "#ffffff", true);
    pr.drawCircle(apeX - 4, apeY - 12, 1, "#000000", true);
    pr.drawCircle(apeX + 6, apeY - 12, 1, "#000000", true);

    // 4. Draw Damsel (Princess) at top-right
    const damselX = 420;
    const damselY = this.floors[4] - 28;
    // Pink Dress
    pr.drawRect(damselX - 8, damselY + 8, 16, 20, "#f472b6", true);
    // Blonde Hair & Face
    pr.drawCircle(damselX, damselY, 7, "#fde047", true);
    pr.drawCircle(damselX, damselY + 2, 5, "#fed7aa", true);
    // Animated Floating Heart
    const heartPulse = Math.sin(this.animTime * 4) * 3;
    pr.drawText("♥", damselX, damselY - 16 + heartPulse, { size: 14, color: "#f43f5e", align: "center" });

    // 5. Draw Barrels (Detailed Wood & Metal Hoops)
    for (const b of this.barrels) {
      if (!b.active) continue;
      // Barrel base cylinder
      pr.drawCircle(b.x, b.y - 10, 12, "#b45309", true);
      pr.drawCircle(b.x, b.y - 10, 12, "#78350f", false);
      // Metal bands
      pr.drawLine(b.x - 10, b.y - 12, b.x + 10, b.y - 12, "#94a3b8", 1.5);
      pr.drawLine(b.x - 10, b.y - 8, b.x + 10, b.y - 8, "#94a3b8", 1.5);
    }

    // 6. Draw Player (Jumpman Sprite)
    const px = this.playerX;
    const py = this.playerY;
    // Red Shirt / Overalls
    pr.drawRect(px - 8, py - 18, 16, 18, "#dc2626", true);
    pr.drawRect(px - 7, py - 12, 14, 12, "#2563eb", true);
    // Head & Cap
    pr.drawCircle(px, py - 24, 6, "#fed7aa", true);
    pr.drawRect(px - 8, py - 30, 16, 5, "#dc2626", true); // Cap
    // Mustache & Eye
    const eyeX = this.facingRight ? px + 3 : px - 3;
    pr.drawRect(eyeX - 1, py - 25, 2, 2, "#000000", true);
    pr.drawRect(eyeX - 2, py - 22, 6, 2, "#451a03", true);

    // Top HUD
    pr.drawRect(0, 0, w, 44, "#080e1c", true);
    pr.drawLine(0, 44, w, 44, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 28, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`LVL: ${this.level}`, w / 2, 28, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
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

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }
}
