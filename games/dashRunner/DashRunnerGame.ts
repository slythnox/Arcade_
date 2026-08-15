import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface BuildingPlatform {
  x: number;
  width: number;
  height: number;
}

export class DashRunnerGame implements GameInstance {
  private ctx!: GameContext;
  private playerX: number = 120;
  private playerY: number = 480;
  private playerVy: number = 0;
  private isGrounded: boolean = true;
  private jumpsLeft: number = 2;
  private scrollSpeed: number = 420;
  private buildings: BuildingPlatform[] = [];
  private score: number = 0;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 120;
    this.playerY = 480;
    this.playerVy = 0;
    this.isGrounded = true;
    this.jumpsLeft = 2;
    this.scrollSpeed = 420;
    this.score = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.buildings = [];

    // Initial continuous rooftop
    this.buildings.push({ x: 0, width: 400, height: 160 });
    let curX = 400;
    for (let i = 0; i < 5; i++) {
      const gap = 80 + this.ctx.random.next() * 80;
      const w = 200 + this.ctx.random.next() * 220;
      const h = 120 + this.ctx.random.next() * 100;
      this.buildings.push({ x: curX + gap, width: w, height: h });
      curX += gap + w;
    }
  }

  private jump(): void {
    if (this.gameOver || this.isPaused) return;

    if (this.jumpsLeft > 0) {
      this.playerVy = -560;
      this.jumpsLeft--;
      this.isGrounded = false;
      this.ctx.audio.playRotate();
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;

    // Apply gravity
    this.playerVy += 1350 * dt;
    this.playerY += this.playerVy * dt;

    // Move buildings left
    for (const b of this.buildings) {
      b.x -= this.scrollSpeed * dt;
    }

    // Check Landing on Rooftops
    this.isGrounded = false;
    for (const b of this.buildings) {
      const roofY = 660 - b.height;
      if (
        this.playerX + 16 > b.x &&
        this.playerX - 16 < b.x + b.width &&
        this.playerY + 20 >= roofY &&
        this.playerY + 20 <= roofY + 20 &&
        this.playerVy >= 0
      ) {
        this.playerY = roofY - 20;
        this.playerVy = 0;
        this.isGrounded = true;
        this.jumpsLeft = 2;
        break;
      }
    }

    // Recycle buildings
    if (this.buildings[0].x + this.buildings[0].width < -50) {
      this.buildings.shift();
      const lastB = this.buildings[this.buildings.length - 1];
      const gap = 80 + this.ctx.random.next() * 100;
      const w = 180 + this.ctx.random.next() * 240;
      const h = 100 + this.ctx.random.next() * 120;
      this.buildings.push({
        x: lastB.x + lastB.width + gap,
        width: w,
        height: h,
      });
      this.score += 150;
    }

    // Fall into gap
    if (this.playerY > 670) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playExplosion();
    }

    this.score += Math.round(dt * 50);
    this.scrollSpeed += dt * 4;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "ACTION_PRIMARY" && isPressed) this.jump();
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

    // Draw Rooftop Buildings
    for (const b of this.buildings) {
      const topY = 660 - b.height;
      pr.drawRect(b.x, topY, b.width, b.height + 20, "#080e08", true);
      pr.drawRect(b.x, topY, b.width, 8, "#00FF66", true);
      pr.drawRect(b.x, topY, b.width, b.height + 20, "rgba(0, 255, 102, 0.3)", false);
    }

    // Draw Runner Player
    pr.drawPixelBlock(this.playerX - 14, this.playerY - 14, 28, "#00F0FF", "#FFFFFF", "#040604");

    pr.drawText(
      `DISTANCE: ${this.score}  •  JUMPS: ${this.jumpsLeft}  •  [SPACE FOR DOUBLE JUMP]`,
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
      pr.drawText("ROOFTOP GAP FALL — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center" });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#F0F4F0", align: "center" });
    }
  }
}
