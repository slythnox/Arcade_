import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Checkpoint {
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class ShadowRunnerGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(80, 560);
  private playerVel: Vector2 = new Vector2(0, 0);
  private isGrounded: boolean = true;
  private ghostRecording: Vector2[] = [];
  private bestGhost: Vector2[] = [];
  private ghostFrame: number = 0;
  private checkpoints: Checkpoint[] = [];
  private currentCheckpoint: number = 0;
  private lapTimer: number = 0;
  private bestLap: number | null = null;
  private lapCount: number = 1;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private particles: Particle[] = [];
  private animTime: number = 0;

  // Platforms: [x, y, w, h]
  private readonly platforms = [
    [40, 580, 520, 20],   // Bottom Ground
    [100, 460, 160, 16],  // Lower Left
    [340, 460, 160, 16],  // Lower Right
    [220, 340, 160, 16],  // Mid Center
    [80, 220, 160, 16],   // Upper Left
    [360, 220, 160, 16],  // Upper Right
    [220, 120, 160, 16],  // Top High Center
  ];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(80, 560);
    this.playerVel = new Vector2(0, 0);
    this.ghostRecording = [];
    this.ghostFrame = 0;
    this.currentCheckpoint = 0;
    this.lapTimer = 0;
    this.lapCount = 1;
    this.isWon = false;
    this.isPaused = false;
    this.particles = [];

    this.checkpoints = [
      { x: 180, y: 440 },
      { x: 420, y: 440 },
      { x: 300, y: 320 },
      { x: 160, y: 200 },
      { x: 440, y: 200 },
      { x: 300, y: 100 },
      { x: 80, y: 560 }, // Return home
    ];
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 30 + this.ctx.random.next() * 80;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.35,
        color,
      });
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    this.animTime += dt;
    this.lapTimer += dt;

    // Movement Physics
    const speed = 280;
    this.playerVel.x = 0;
    if (this.moveLeft) this.playerVel.x = -speed;
    if (this.moveRight) this.playerVel.x = speed;

    this.playerVel.y += 1300 * dt; // Gravity
    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    this.playerPos.x = Math.max(40, Math.min(560, this.playerPos.x));

    // Platform Collisions
    this.isGrounded = false;
    for (const [px, py, pw, ph] of this.platforms) {
      if (
        this.playerPos.x >= px - 10 &&
        this.playerPos.x <= px + pw + 10 &&
        this.playerPos.y >= py - 18 &&
        this.playerPos.y <= py + ph &&
        this.playerVel.y >= 0
      ) {
        this.playerPos.y = py - 18;
        this.playerVel.y = 0;
        this.isGrounded = true;
        break;
      }
    }

    // Record Player Path
    this.ghostRecording.push(new Vector2(this.playerPos.x, this.playerPos.y));
    this.ghostFrame++;

    // Checkpoint Collision
    const cp = this.checkpoints[this.currentCheckpoint];
    if (Math.hypot(cp.x - this.playerPos.x, cp.y - this.playerPos.y) < 32) {
      this.addParticles(cp.x, cp.y, "#00F0FF", 8);
      this.ctx.audio.playCoin();
      this.currentCheckpoint++;

      if (this.currentCheckpoint >= this.checkpoints.length) {
        // Lap Completed!
        if (this.bestLap === null || this.lapTimer < this.bestLap) {
          this.bestLap = this.lapTimer;
          this.bestGhost = [...this.ghostRecording];
        }
        this.lapCount++;
        this.currentCheckpoint = 0;
        this.lapTimer = 0;
        this.ghostRecording = [];
        this.ghostFrame = 0;
        this.ctx.audio.playVictory();
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;

    if (!isPressed) return;

    if ((action === "MOVE_UP" || action === "ACTION_PRIMARY") && this.isGrounded) {
      this.playerVel.y = -520;
      this.isGrounded = false;
      this.addParticles(this.playerPos.x, this.playerPos.y + 16, "#38BDF8", 4);
      this.ctx.audio.playMove();
    }

    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return Math.floor((this.bestLap ? 1000 / this.bestLap : 0) * 100); }
  public getLevel(): number { return this.lapCount; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cyber Grid
    pr.drawGrid(8, 9, 65, "rgba(0, 240, 255, 0.04)", 40, 60);

    // 2. Platforms
    for (const [px, py, pw, ph] of this.platforms) {
      pr.drawPixelBlock(px, py, ph, "#1e293b", "#475569", "#0f172a");
      pr.drawRect(px, py, pw, ph, "#334155", true);
      pr.drawLine(px, py, px + pw, py, "#00F0FF", 2);
    }

    // 3. Draw Checkpoints with Glowing Rings
    for (let i = 0; i < this.checkpoints.length; i++) {
      const cp = this.checkpoints[i];
      const isTarget = i === this.currentCheckpoint;
      const col = isTarget ? "#FFD84D" : "rgba(56, 189, 248, 0.25)";
      const pulse = isTarget ? Math.sin(this.animTime * 6) * 3 : 0;

      pr.drawCircle(cp.x, cp.y, 14 + pulse, col, false);
      if (isTarget) {
        pr.drawCircle(cp.x, cp.y, 6, "#FFD84D", true);
        pr.drawText(`${i + 1}`, cp.x, cp.y + 4, { size: 10, color: "#000000", align: "center", font: "monospace" });
      }
    }

    // 4. Draw Best Ghost Echo
    if (this.bestGhost.length > 0 && this.ghostFrame < this.bestGhost.length) {
      const gp = this.bestGhost[this.ghostFrame];
      pr.drawCircle(gp.x, gp.y, 10, "rgba(168, 85, 247, 0.5)", true);
      pr.drawCircle(gp.x, gp.y - 12, 6, "rgba(168, 85, 247, 0.8)", true);
    }

    // 5. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2.5, p.color, true);
    }

    // 6. Draw Player Runner Sprite
    const px = this.playerPos.x;
    const py = this.playerPos.y;
    pr.drawPixelBlock(px - 9, py - 14, 18, "#00F0FF", "#E0F2FE", "#0284C7");
    pr.drawCircle(px, py - 20, 6, "#FFFFFF", true);
    // Glowing cyan visor
    pr.drawRect(px - 4, py - 21, 8, 3, "#00F0FF", true);

    // 7. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`TIME: ${this.lapTimer.toFixed(2)}s`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`LAP ${this.lapCount} • GATE: ${this.currentCheckpoint + 1}/${this.checkpoints.length}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`BEST: ${this.bestLap ? `${this.bestLap.toFixed(2)}s` : "--"}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });
  }
}
