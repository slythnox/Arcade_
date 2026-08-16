import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface FrameState {
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

export class TimeLoopGame implements GameInstance {
  private ctx!: GameContext;
  private playerX = 60;
  private playerY = 500;
  private playerVx = 0;
  private playerVy = 0;
  private isGrounded = true;

  // Ghosts history
  private currentRecording: FrameState[] = [];
  private ghostRecordings: FrameState[][] = [];
  private playbackFrame = 0;
  private readonly maxGhosts = 3;

  private loopTimer = 8.0;
  private readonly loopDuration = 8.0;

  // Level Puzzle Elements
  private switch1 = false;
  private switch2 = false;
  private doorOpen = false;
  private exitX = 520;
  private exitY = 480;

  private score = 0;
  private level = 1;
  private isPaused = false;
  private levelCleared = false;
  private particles: Particle[] = [];
  private animTime = 0;

  private moveLeft = false;
  private moveRight = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initLevel();
  }

  private initLevel(): void {
    this.playerX = 60;
    this.playerY = 500;
    this.playerVx = 0;
    this.playerVy = 0;
    this.isGrounded = true;
    this.currentRecording = [];
    this.ghostRecordings = [];
    this.playbackFrame = 0;
    this.loopTimer = this.loopDuration;
    this.switch1 = false;
    this.switch2 = false;
    this.doorOpen = false;
    this.levelCleared = false;
  }

  private triggerLoopReset(): void {
    if (this.currentRecording.length > 0 && this.ghostRecordings.length < this.maxGhosts) {
      this.ghostRecordings.push([...this.currentRecording]);
    }
    this.playerX = 60;
    this.playerY = 500;
    this.playerVx = 0;
    this.playerVy = 0;
    this.currentRecording = [];
    this.playbackFrame = 0;
    this.loopTimer = this.loopDuration;
    this.ctx.audio.playPowerUp();

    // Time warp particles
    for (let i = 0; i < 20; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 50 + this.ctx.random.next() * 100;
      this.particles.push({
        x: 300,
        y: 350,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.5,
        color: "#00F0FF",
      });
    }
  }

  public update(dt: number): void {
    if (this.isPaused || this.levelCleared) return;
    this.animTime += dt;

    this.loopTimer -= dt;
    if (this.loopTimer <= 0) {
      this.triggerLoopReset();
      return;
    }

    // Player physics
    const speed = 240;
    this.playerVx = 0;
    if (this.moveLeft) this.playerVx = -speed;
    if (this.moveRight) this.playerVx = speed;

    this.playerVy += 1300 * dt;
    this.playerX += this.playerVx * dt;
    this.playerY += this.playerVy * dt;

    this.playerX = Math.max(30, Math.min(570, this.playerX));

    // Floor collision (ground at y = 520)
    if (this.playerY >= 500) {
      this.playerY = 500;
      this.playerVy = 0;
      this.isGrounded = true;
    }

    // Record player trajectory
    this.currentRecording.push({ x: this.playerX, y: this.playerY });

    // Switch activation checks (Player + Ghosts)
    const allPositions = [{ x: this.playerX, y: this.playerY }];
    for (const g of this.ghostRecordings) {
      if (this.playbackFrame < g.length) {
        allPositions.push(g[this.playbackFrame]);
      }
    }
    this.playbackFrame++;

    // Switch 1 at x=200, Switch 2 at x=380
    this.switch1 = allPositions.some((p) => Math.abs(p.x - 200) < 32 && Math.abs(p.y - 500) < 18);
    this.switch2 = allPositions.some((p) => Math.abs(p.x - 380) < 32 && Math.abs(p.y - 500) < 18);

    // Door opens when both switches active simultaneously
    this.doorOpen = this.switch1 && this.switch2;

    // Exit reach
    if (this.doorOpen && Math.abs(this.playerX - this.exitX) < 28 && Math.abs(this.playerY - this.exitY) < 32) {
      this.levelCleared = true;
      this.score += 2000 * this.level;
      this.ctx.audio.playVictory();
      this.ctx.session.setStatus("ready");
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
      this.playerVy = -500;
      this.isGrounded = false;
      this.ctx.audio.playMove();
    }

    if (action === "ACTION_SECONDARY" || action === "ROTATE") {
      this.triggerLoopReset();
    }

    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Quantum Cyber Background Grid
    pr.drawGrid(8, 9, 65, "rgba(0, 240, 255, 0.04)", 40, 70);

    // 2. Ground Platform
    pr.drawRect(20, 520, 560, 20, "#1e293b", true);
    pr.drawLine(20, 520, 580, 520, "#00F0FF", 2);

    // 3. Pressure Switches
    // Switch 1 at x=200
    const s1Color = this.switch1 ? "#22C55E" : "#EF4444";
    pr.drawRect(180, 514, 40, 6, s1Color, true);
    pr.drawCircle(200, 512, 6, s1Color, true);

    // Switch 2 at x=380
    const s2Color = this.switch2 ? "#22C55E" : "#EF4444";
    pr.drawRect(360, 514, 40, 6, s2Color, true);
    pr.drawCircle(380, 512, 6, s2Color, true);

    // 4. Blast Security Door at x=460
    if (!this.doorOpen) {
      pr.drawRect(455, 420, 14, 100, "#EF4444", true);
      pr.drawLine(462, 420, 462, 520, "#FFFFFF", 2);
    } else {
      pr.drawRect(455, 420, 14, 20, "#22C55E", true);
    }

    // 5. Exit Portal at x=520
    const portalPulse = Math.sin(this.animTime * 6) * 4;
    pr.drawCircle(this.exitX, this.exitY, 20 + portalPulse, "rgba(0, 240, 255, 0.25)", true);
    pr.drawCircle(this.exitX, this.exitY, 14, "#00F0FF", false);

    // 6. Draw Recorded Time Ghosts
    const ghostColors = ["rgba(34, 197, 94, 0.7)", "rgba(168, 85, 247, 0.7)", "rgba(245, 158, 11, 0.7)"];
    for (let gi = 0; gi < this.ghostRecordings.length; gi++) {
      const rec = this.ghostRecordings[gi];
      if (this.playbackFrame < rec.length) {
        const gp = rec[this.playbackFrame];
        pr.drawCircle(gp.x, gp.y - 12, 10, ghostColors[gi], true);
      }
    }

    // 7. Draw Active Player Vessel
    pr.drawPixelBlock(this.playerX - 10, this.playerY - 20, 20, "#00F0FF", "#FFFFFF", "#0284C7");
    pr.drawCircle(this.playerX, this.playerY - 26, 6, "#FFFFFF", true);

    // 8. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2.5, p.color, true);
    }

    // 9. Top HUD & Time Rift Gauge
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`TIME LOOP: ${this.loopTimer.toFixed(1)}s`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`GHOSTS: ${this.ghostRecordings.length}/${this.maxGhosts}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    // Time Progress Gauge Bar
    const timePct = Math.max(0, this.loopTimer / this.loopDuration);
    pr.drawRect(w / 2 - 120, 42, 240, 5, "#1e293b", true);
    pr.drawRect(w / 2 - 120, 42, 240 * timePct, 5, "#00F0FF", true);

    if (this.levelCleared) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22C55E", false);
      pr.drawText("QUANTUM TIME PARADOX SOLVED!", w / 2, h / 2 - 10, { size: 20, color: "#22C55E", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
