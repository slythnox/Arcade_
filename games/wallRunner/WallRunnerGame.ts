import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawGravityRunner } from "../gravityFlip/gravityRunnerSprite";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

interface EnemyShip {
  id: number;
  isLeft: boolean;
  x: number;
  y: number;
  vy: number;
  fireTimer: number;
  destroyed: boolean;
  color: string;
}

interface EnemyLaser {
  id: number;
  isLeft: boolean;
  x: number;
  y: number;
  vy: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

interface SlashEffect {
  x: number;
  y: number;
  angle: number;
  timer: number;
  maxTime: number;
}

interface BiomeTheme {
  name: string;
  minAltitude: number;
  bgGradTop: string;
  bgGradBot: string;
  wallBorder: string;
}

const BIOMES: BiomeTheme[] = [
  {
    name: "CYBER CANYON",
    minAltitude: 0,
    bgGradTop: "#08061C",
    bgGradBot: "#150E34",
    wallBorder: "#00F0FF",
  },
  {
    name: "SUNSET STRATOSPHERE",
    minAltitude: 500,
    bgGradTop: "#1E1B4B",
    bgGradBot: "#831843",
    wallBorder: "#F59E0B",
  },
  {
    name: "MIDNIGHT CLOUD VISTA",
    minAltitude: 1000,
    bgGradTop: "#030712",
    bgGradBot: "#0F172A",
    wallBorder: "#34D399",
  },
  {
    name: "COSMIC SKYLINE",
    minAltitude: 1500,
    bgGradTop: "#1E0A30",
    bgGradBot: "#0C0414",
    wallBorder: "#C084FC",
  },
];

export class WallRunnerGame implements GameInstance {
  private ctx!: GameContext;

  // Wall Surface Contact X Coordinates (Wall width = 56px)
  private readonly leftWallEdge: number = 56;
  private readonly rightWallEdge: number = 544;

  // Player Position
  private playerX: number = 56;
  private playerY: number = 540;
  private playerVx: number = 0;
  private currentWall: "left" | "right" | "midair" = "left";

  // Health & Hurt System
  private health: number = 3;
  private invulnTimer: number = 0;
  private hurtFlashTimer: number = 0;

  // Katana Slash FX
  private activeSlashes: SlashEffect[] = [];

  // Balanced Climbing Speed
  private climbSpeed: number = 240;

  // Active Enemy Spaceships & Lasers
  private enemyShips: EnemyShip[] = [];
  private enemyLasers: EnemyLaser[] = [];
  private particles: Particle[] = [];

  private lastSpawnWall: boolean = false;
  private enemySpawnTimer: number = 0;

  private score: number = 0;
  private altitude: number = 0;
  private combo: number = 1;
  private totalSlashed: number = 0;

  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private screenShake: number = 0;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        this.performKatanaSlash();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = this.leftWallEdge;
    this.playerY = 540;
    this.playerVx = 0;
    this.currentWall = "left";
    this.climbSpeed = 240;

    this.health = 3;
    this.invulnTimer = 0;
    this.hurtFlashTimer = 0;

    this.score = 0;
    this.altitude = 0;
    this.combo = 1;
    this.totalSlashed = 0;
    this.enemySpawnTimer = 0;
    this.lastSpawnWall = false;

    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.screenShake = 0;

    this.activeSlashes = [];
    this.enemyShips = [];
    this.enemyLasers = [];
    this.particles = [];

    // Spawn 1 starting enemy ship
    this.spawnEnemyShip(200, true);
  }

  private getCurrentBiome(): BiomeTheme {
    const cycleAlt = this.altitude % 2000;
    for (let i = BIOMES.length - 1; i >= 0; i--) {
      if (cycleAlt >= BIOMES[i].minAltitude) {
        return BIOMES[i];
      }
    }
    return BIOMES[0];
  }

  private spawnEnemyShip(y: number, forceLeft?: boolean): void {
    const isLeft = forceLeft !== undefined ? forceLeft : !this.lastSpawnWall;
    this.lastSpawnWall = isLeft;
    const spawnX = isLeft ? this.leftWallEdge + 26 : this.rightWallEdge - 26;

    this.enemyShips.push({
      id: Math.random(),
      isLeft,
      x: spawnX,
      y,
      vy: 110 + Math.random() * 40,
      fireTimer: 0.7 + Math.random() * 0.5,
      destroyed: false,
      color: "#EF4444",
    });
  }

  private takeDamage(): void {
    if (this.invulnTimer > 0 || this.gameOver || this.isPaused) return;

    this.health--;
    this.invulnTimer = 1.6;
    this.hurtFlashTimer = 0.35;
    this.screenShake = 0.6;
    this.combo = 1;

    this.ctx.audio?.playHit?.();

    const hurtX = this.currentWall === "left" ? this.leftWallEdge + 16 : this.rightWallEdge - 16;
    globalParticles.emitBurst(hurtX, this.playerY, 25, ["#EF4444", "#F59E0B", "#FFFFFF"], 70, 220);
    globalParticles.emitText("-1 HEALTH!", hurtX, this.playerY - 24, "#EF4444", 14);

    if (this.health <= 0) {
      this.gameOver = true;
      this.screenShake = 0.9;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio?.playExplosion?.();
      globalParticles.emitBurst(hurtX, this.playerY, 45, ["#EF4444", "#F59E0B", "#FFFFFF"], 120, 360);
    }
  }

  // --- Move Between Walls using A and D ---
  public jumpToLeft(): void {
    if (this.gameOver || this.isPaused) return;
    if (this.currentWall !== "left") {
      this.currentWall = "midair";
      this.playerVx = -840;
      this.ctx.audio?.playRotate?.();
      globalParticles.emitBurst(this.playerX, this.playerY, 14, ["#34D399", "#FFFFFF"], 50, 160);
    }
  }

  public jumpToRight(): void {
    if (this.gameOver || this.isPaused) return;
    if (this.currentWall !== "right") {
      this.currentWall = "midair";
      this.playerVx = 840;
      this.ctx.audio?.playRotate?.();
      globalParticles.emitBurst(this.playerX, this.playerY, 14, ["#34D399", "#FFFFFF"], 50, 160);
    }
  }

  // --- Dedicated Katana Slash with SPACEBAR / Left-Click ---
  public performKatanaSlash(): void {
    if (this.gameOver || this.isPaused) return;

    const slashOriginX = this.currentWall === "left" ? this.leftWallEdge + 24 : this.currentWall === "right" ? this.rightWallEdge - 24 : this.playerX;
    const slashOriginY = this.playerY;

    // Spawn Visual Crescent Katana Slash Arc
    this.activeSlashes.push({
      x: slashOriginX,
      y: slashOriginY,
      angle: this.currentWall === "left" ? -Math.PI / 4 : this.currentWall === "right" ? Math.PI * 1.25 : 0,
      timer: 0.25,
      maxTime: 0.25,
    });

    this.ctx.audio?.playLaser?.();

    // Slices through nearby enemy spaceships within 120px radius
    let hitSomething = false;
    for (const ship of this.enemyShips) {
      if (!ship.destroyed && Math.hypot(ship.x - slashOriginX, ship.y - slashOriginY) < 120) {
        ship.destroyed = true;
        hitSomething = true;
        this.totalSlashed++;
        this.score += 500 * this.combo;
        this.combo++;
        this.screenShake = 0.35;
        this.ctx.audio?.playHit?.();
        globalParticles.emitBurst(ship.x, ship.y, 28, ["#EF4444", "#FEF08A", "#FFFFFF"], 90, 260);
        globalParticles.emitText(`KATANA SLASH! +${500 * this.combo}`, ship.x, ship.y - 22, "#FEF08A", 15);
      }
    }

    // Slice through and destroy incoming lasers
    for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
      const lz = this.enemyLasers[i];
      if (Math.hypot(lz.x - slashOriginX, lz.y - slashOriginY) < 110) {
        this.enemyLasers.splice(i, 1);
        hitSomething = true;
        globalParticles.emitBurst(lz.x, lz.y, 10, ["#00F0FF", "#FFFFFF"], 40, 120);
        globalParticles.emitText("DEFLECTED!", lz.x, lz.y - 14, "#00F0FF", 12);
      }
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    if (this.screenShake > 0) this.screenShake -= dt * 3;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;
    if (this.hurtFlashTimer > 0) this.hurtFlashTimer -= dt;

    // Update Slash Arc FX
    for (let i = this.activeSlashes.length - 1; i >= 0; i--) {
      const s = this.activeSlashes[i];
      s.timer -= dt;
      if (s.timer <= 0) this.activeSlashes.splice(i, 1);
    }

    // Smooth speed progression
    this.climbSpeed = Math.min(320, 240 + Math.floor(this.altitude / 100) * 4);
    const scrollDelta = this.climbSpeed * dt;
    this.altitude += scrollDelta * 0.12;
    this.score += Math.floor(scrollDelta * 0.15);

    // --- Spaceship Spawning Cadence (Every 2.4s) ---
    this.enemySpawnTimer += dt;
    const spawnInterval = Math.max(2.0, 2.6 - Math.floor(this.altitude / 250) * 0.1);
    if (this.enemySpawnTimer >= spawnInterval) {
      this.enemySpawnTimer = 0;
      this.spawnEnemyShip(-50);
    }

    // --- Update Enemy Spaceships (Active Attack & Laser Firing) ---
    for (let i = this.enemyShips.length - 1; i >= 0; i--) {
      const ship = this.enemyShips[i];
      ship.x = ship.isLeft ? this.leftWallEdge + 26 : this.rightWallEdge - 26;
      ship.y += (ship.vy + scrollDelta) * dt;

      // Spaceships actively shoot plasma laser bursts down the wall line!
      ship.fireTimer -= dt;
      if (!ship.destroyed && ship.fireTimer <= 0 && ship.y > 30 && ship.y < 480) {
        ship.fireTimer = 1.3;
        this.enemyLasers.push({
          id: Math.random(),
          isLeft: ship.isLeft,
          x: ship.x,
          y: ship.y + 16,
          vy: 360,
        });
        this.ctx.audio?.playLaser?.();
      }

      // Spaceship Collision with Player
      const playerEffectiveX = this.currentWall === "left" ? this.leftWallEdge + 18 : this.currentWall === "right" ? this.rightWallEdge - 18 : this.playerX;
      const shipDist = Math.hypot(ship.x - playerEffectiveX, ship.y - this.playerY);

      if (!ship.destroyed && shipDist < 48) {
        if (this.currentWall === "midair") {
          ship.destroyed = true;
          this.totalSlashed++;
          this.score += 500 * this.combo;
          this.combo++;
          this.screenShake = 0.35;
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(ship.x, ship.y, 28, ["#EF4444", "#FEF08A", "#FFFFFF"], 90, 260);
          globalParticles.emitText(`AIR SLASH! +${500 * this.combo}`, ship.x, ship.y - 20, "#FEF08A", 15);
        } else if (this.invulnTimer <= 0 && (ship.isLeft ? this.currentWall === "left" : this.currentWall === "right")) {
          ship.destroyed = true;
          this.takeDamage();
        }
      }

      if (ship.y > 750 || ship.destroyed) {
        this.enemyShips.splice(i, 1);
      }
    }

    // --- Update Enemy Attack Lasers ---
    for (let i = this.enemyLasers.length - 1; i >= 0; i--) {
      const lz = this.enemyLasers[i];
      lz.y += (lz.vy + scrollDelta) * dt;

      // Laser Collision with Player
      const isPlayerOnSameWall = (lz.isLeft && this.currentWall === "left") || (!lz.isLeft && this.currentWall === "right");
      const isPlayerMidairInPath = this.currentWall === "midair" && Math.abs(lz.x - this.playerX) < 24;

      if ((isPlayerOnSameWall || isPlayerMidairInPath) && Math.abs(lz.y - this.playerY) < 28) {
        this.enemyLasers.splice(i, 1);
        this.takeDamage();
        continue;
      }

      if (lz.y > 750) {
        this.enemyLasers.splice(i, 1);
      }
    }

    // --- Player Mid-Air Kinematics & Wall Clinging ---
    if (this.currentWall === "midair") {
      this.playerX += this.playerVx * dt;

      this.particles.push({
        x: this.playerX,
        y: this.playerY,
        vx: -this.playerVx * 0.15,
        vy: (Math.random() - 0.5) * 30,
        life: 0.22,
        maxLife: 0.22,
        color: "#34D399",
      });

      // Latch onto Left Wall Surface
      if (this.playerX <= this.leftWallEdge) {
        this.playerX = this.leftWallEdge;
        this.currentWall = "left";
        this.playerVx = 0;
        this.combo = Math.min(10, this.combo + 1);
        this.ctx.audio?.playMove?.();
        globalParticles.emitBurst(this.playerX + 10, this.playerY, 8, ["#34D399", "#FFFFFF"], 30, 90);
      } else if (this.playerX >= this.rightWallEdge) {
        // Latch onto Right Wall Surface
        this.playerX = this.rightWallEdge;
        this.currentWall = "right";
        this.playerVx = 0;
        this.combo = Math.min(10, this.combo + 1);
        this.ctx.audio?.playMove?.();
        globalParticles.emitBurst(this.playerX - 10, this.playerY, 8, ["#34D399", "#FFFFFF"], 30, 90);
      }
    } else {
      // Wall Slide Friction Sparks
      if (Math.random() < 0.4) {
        this.particles.push({
          x: this.currentWall === "left" ? this.leftWallEdge : this.rightWallEdge,
          y: this.playerY + (Math.random() - 0.5) * 10,
          vx: (this.currentWall === "left" ? 1 : -1) * (20 + Math.random() * 40),
          vy: -20 - Math.random() * 40,
          life: 0.25,
          maxLife: 0.25,
          color: "#FEF08A",
        });
      }
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.life -= dt;
      if (pt.life <= 0) this.particles.splice(i, 1);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;

    if (action === "MOVE_LEFT") {
      this.jumpToLeft();
    } else if (action === "MOVE_RIGHT") {
      this.jumpToRight();
    } else if (action === "ACTION_PRIMARY" || action === "MOVE_UP" || action === "CONFIRM") {
      this.performKatanaSlash();
    }

    if (action === "RESTART") this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerDown && typeof window !== "undefined") {
      window.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return Math.floor(this.altitude / 200) + 1; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = pr.getWidth();
    const h = pr.getHeight();

    pr.save();
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake * 12;
      const sy = (Math.random() - 0.5) * this.screenShake * 12;
      pr.translate(sx, sy);
    }

    const biome = this.getCurrentBiome();

    // 1. Dynamic Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, biome.bgGradTop);
      bgGrad.addColorStop(1, biome.bgGradBot);
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#08061C");
    }

    // Parallax Vertical Speed Matrix
    pr.drawGrid(8, 10, 60, "rgba(255, 255, 255, 0.04)", 0, (this.animTime * this.climbSpeed * 0.4) % 60);

    // 2. High-Tech Left & Right Vertical Wall Roads
    const wallW = 56;
    const scrollOffset = (this.animTime * this.climbSpeed) % 40;

    // Left Wall Road
    pr.drawRect(0, 0, wallW, h, "#0F172A", true);
    pr.drawRect(wallW - 4, 0, 4, h, biome.wallBorder, true);
    pr.drawLine(wallW, 0, wallW, h, "#FFFFFF", 1);
    for (let wy = -scrollOffset; wy < h; wy += 40) {
      pr.drawRect(8, wy, 24, 6, "#1E293B", true);
      pr.drawRect(34, wy + 2, 12, 2, biome.wallBorder, true);
    }

    // Right Wall Road
    pr.drawRect(w - wallW, 0, wallW, h, "#0F172A", true);
    pr.drawRect(w - wallW, 0, 4, h, biome.wallBorder, true);
    pr.drawLine(w - wallW, 0, w - wallW, h, "#FFFFFF", 1);
    for (let wy = -scrollOffset; wy < h; wy += 40) {
      pr.drawRect(w - 32, wy, 24, 6, "#1E293B", true);
      pr.drawRect(w - 46, wy + 2, 12, 2, biome.wallBorder, true);
    }

    // 3. Enemy Spaceships (Diving along wall line)
    for (const ship of this.enemyShips) {
      if (ship.destroyed) continue;

      drawSpaceshipSprite(
        pr,
        ship.x,
        ship.y,
        30,
        Math.PI,
        ship.color
      );
    }

    // Enemy Attack Lasers
    for (const lz of this.enemyLasers) {
      pr.drawRect(lz.x - 3, lz.y - 12, 6, 24, "#EF4444", true);
      pr.drawRect(lz.x - 1, lz.y - 10, 2, 20, "#FFFFFF", true);
    }

    // 4. Katana Energy Crescent Slash Arcs
    for (const sl of this.activeSlashes) {
      const alpha = sl.timer / sl.maxTime;
      if (ctx2d) {
        ctx2d.save();
        ctx2d.translate(sl.x, sl.y);
        ctx2d.rotate(sl.angle);
        ctx2d.strokeStyle = `rgba(0, 240, 255, ${alpha})`;
        ctx2d.lineWidth = 6 * alpha + 2;
        ctx2d.beginPath();
        ctx2d.arc(0, 0, 48, -Math.PI / 3, Math.PI / 3);
        ctx2d.stroke();

        ctx2d.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx2d.lineWidth = 2.5 * alpha;
        ctx2d.beginPath();
        ctx2d.arc(0, 0, 48, -Math.PI / 4, Math.PI / 4);
        ctx2d.stroke();
        ctx2d.restore();
      } else {
        pr.drawCircle(sl.x, sl.y, 45, "rgba(0, 240, 255, 0.4)", false);
      }
    }

    // 5. Particles
    for (const pt of this.particles) {
      const alpha = pt.life / pt.maxLife;
      pr.drawCircle(pt.x, pt.y, 2.5 * alpha, pt.color, true);
    }

    // 6. Pixel Runner Character with Invulnerability Flashing
    const px = this.playerX;
    const py = this.playerY;
    const isVisible = this.invulnTimer <= 0 || Math.sin(this.animTime * 28) > 0;

    if (isVisible) {
      pr.save();
      if (this.currentWall === "left") {
        pr.translate(this.leftWallEdge + 24, py);
        pr.rotate(Math.PI / 2);
        pr.scale(-1, 1);
        drawGravityRunner(pr, 0, 0, 1, this.animTime, true, 2.4);
      } else if (this.currentWall === "right") {
        pr.translate(this.rightWallEdge - 24, py);
        pr.rotate(-Math.PI / 2);
        drawGravityRunner(pr, 0, 0, 1, this.animTime, true, 2.4);
      } else {
        pr.translate(px, py);
        if (this.playerVx < 0) pr.scale(-1, 1);
        drawGravityRunner(pr, 0, 0, 1, this.animTime, false, 2.4);
      }
      pr.restore();
    }

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 7. Hurt Red Flash Vignette
    if (this.hurtFlashTimer > 0) {
      pr.drawRect(0, 0, w, h, `rgba(239, 68, 68, ${this.hurtFlashTimer * 1.2})`, true);
    }

    // 8. Top Cyber HUD with Health Hearts
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, biome.wallBorder, false);

    pr.drawText(`CLIMB: ${Math.floor(this.altitude)}M`, 24, 28, { size: 14, color: "#FFD84D", font: "monospace" });
    pr.drawText(`SLASHED: ${this.totalSlashed} 🛸`, w / 2, 28, { size: 12, color: "#00F0FF", align: "center", font: "monospace" });

    const heartsText = "♥ ".repeat(Math.max(0, this.health));
    pr.drawText(`HEALTH: ${heartsText}`, w - 24, 28, { size: 13, color: "#EF4444", align: "right", font: "monospace" });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 340, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[A / D: JUMP TO WALL  •  SPACE / CLICK: KATANA SLASH  •  R: RETRY]", 186, h - 20, {
      size: 7.2,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("RUNNER DESTROYED — MISSION FAILED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO DASH AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
