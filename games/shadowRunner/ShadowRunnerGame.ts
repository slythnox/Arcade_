import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";

type GuardState = "patrol" | "investigate" | "alert" | "stunned";

interface Guard {
  id: number;
  pos: Vector2;
  dirAngle: number;
  targetAngle: number;
  patrolMinX: number;
  patrolMaxX: number;
  patrolDir: number;
  state: GuardState;
  stateTimer: number;
  investigatePos?: Vector2;
  viewRange: number;
  viewFov: number;
  speed: number;
  animTimer: number;
  shootTimer: number;
  pauseTimer: number;
}

interface SoundRipple {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  life: number;
  maxLife: number;
}

interface ObstacleRect {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  type: "green_crate" | "wood_crate" | "generator" | "building" | "wall_left";
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export class ShadowRunnerGame implements GameInstance {
  private ctx!: GameContext;

  // Player Operative State
  private playerX: number = 240;
  private playerY: number = 520;
  private playerFacing: number = -Math.PI / 2;
  private playerSpeed: number = 165;
  private isCrouching: boolean = false;
  private isCovered: boolean = false;
  private walkAnimTimer: number = 0;

  // Endless Infiltration World State
  private cameraY: number = 0;
  private distanceTraveled: number = 0;
  private score: number = 0;
  private stealthMultiplier: number = 1.0;
  private totalTakedowns: number = 0;

  // Alert System
  private alertLevel: "normal" | "caution" | "alert" = "normal";
  private alertTimer: number = 0;

  // Endless Streaming World Elements
  private guards: Guard[] = [];
  private obstacles: ObstacleRect[] = [];
  private soundRipples: SoundRipple[] = [];
  private bullets: Bullet[] = [];

  // Rooftop Fan & Spawning
  private fanAngle: number = 0;
  private nextSpawnWorldY: number = 200;

  // Controls
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;

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
        this.performCQC();
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
      window.addEventListener("contextmenu", (e) => e.preventDefault());
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerX = 240;
    this.playerY = 520;
    this.playerFacing = -Math.PI / 2;
    this.cameraY = 0;
    this.distanceTraveled = 0;
    this.score = 0;
    this.stealthMultiplier = 1.0;
    this.totalTakedowns = 0;
    this.alertLevel = "normal";
    this.alertTimer = 0;
    this.walkAnimTimer = 0;

    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.screenShake = 0;

    this.soundRipples = [];
    this.bullets = [];
    this.obstacles = [];
    this.guards = [];

    // Starting Safe Chunk (World Y = 300 to 700): Clean alley with cover crates on the side
    this.generateStartingZone();

    // Generate upcoming procedural chunks ahead (World Y <= 200)
    this.nextSpawnWorldY = 200;
    for (let i = 0; i < 7; i++) {
      this.generateCompoundChunk(this.nextSpawnWorldY);
      this.nextSpawnWorldY -= 380;
    }
  }

  // --- Safe Starting Zone (Guaranteed Open Player Spawn Area) ---
  private generateStartingZone(): void {
    // Left and Right Boundary Walls
    this.obstacles.push({
      id: 1,
      x: 0,
      y: 350,
      w: 64,
      h: 400,
      type: "wall_left",
    });

    this.obstacles.push({
      id: 2,
      x: 440,
      y: 350,
      w: 160,
      h: 400,
      type: "building",
    });

    // Side Cover Crates (Completely clear of center path at x=240, y=520)
    this.obstacles.push({
      id: 3,
      x: 95,
      y: 460,
      w: 65,
      h: 90,
      type: "generator",
    });

    this.obstacles.push({
      id: 4,
      x: 350,
      y: 480,
      w: 55,
      h: 70,
      type: "wood_crate",
    });

    this.obstacles.push({
      id: 5,
      x: 160,
      y: 360,
      w: 70,
      h: 80,
      type: "green_crate",
    });

    // Sentry Guard patrolling ahead in the courtyard
    this.guards.push({
      id: 10,
      pos: new Vector2(240, 390),
      dirAngle: 0,
      targetAngle: 0,
      patrolMinX: 110,
      patrolMaxX: 390,
      patrolDir: 1,
      state: "patrol",
      stateTimer: 0,
      viewRange: 140,
      viewFov: Math.PI / 3.2,
      speed: 42,
      animTimer: 0,
      shootTimer: 0,
      pauseTimer: 0,
    });
  }

  // --- Procedural Endless Compound Chunk Generator ---
  private generateCompoundChunk(worldY: number): void {
    // 1. Left Concrete Wall & Right Bunker Facade
    this.obstacles.push({
      id: Math.random(),
      x: 0,
      y: worldY,
      w: 64,
      h: 380,
      type: "wall_left",
    });

    this.obstacles.push({
      id: Math.random(),
      x: 440,
      y: worldY,
      w: 160,
      h: 380,
      type: "building",
    });

    // 2. Clear Open Walking Corridors & Staggered Cover Crates
    const layoutRoll = Math.random();
    let guardLaneY = worldY + 190;

    if (layoutRoll < 0.35) {
      // Left Container & Right Wood Stacks (Center corridor open)
      this.obstacles.push({
        id: Math.random(),
        x: 100,
        y: worldY + 50,
        w: 75,
        h: 110,
        type: "green_crate",
      });
      this.obstacles.push({
        id: Math.random(),
        x: 340,
        y: worldY + 80,
        w: 55,
        h: 60,
        type: "wood_crate",
      });
      guardLaneY = worldY + 230;
    } else if (layoutRoll < 0.7) {
      // Right Container with Left Generator (Flank corridors open)
      this.obstacles.push({
        id: Math.random(),
        x: 270,
        y: worldY + 60,
        w: 75,
        h: 110,
        type: "green_crate",
      });
      this.obstacles.push({
        id: Math.random(),
        x: 95,
        y: worldY + 70,
        w: 55,
        h: 60,
        type: "generator",
      });
      this.obstacles.push({
        id: Math.random(),
        x: 130,
        y: worldY + 250,
        w: 50,
        h: 65,
        type: "wood_crate",
      });
      guardLaneY = worldY + 190;
    } else {
      // Center Generator & Right Wooden Crates
      this.obstacles.push({
        id: Math.random(),
        x: 110,
        y: worldY + 50,
        w: 60,
        h: 80,
        type: "generator",
      });
      this.obstacles.push({
        id: Math.random(),
        x: 330,
        y: worldY + 60,
        w: 55,
        h: 65,
        type: "wood_crate",
      });
      this.obstacles.push({
        id: Math.random(),
        x: 220,
        y: worldY + 240,
        w: 75,
        h: 95,
        type: "green_crate",
      });
      guardLaneY = worldY + 160;
    }

    // 3. Guaranteed Sentry Guard per chunk
    const guardX = 130 + Math.random() * 210;
    const patrolDir = Math.random() < 0.5 ? 1 : -1;
    this.guards.push({
      id: Math.random(),
      pos: new Vector2(guardX, guardLaneY),
      dirAngle: patrolDir > 0 ? 0 : Math.PI,
      targetAngle: patrolDir > 0 ? 0 : Math.PI,
      patrolMinX: 95,
      patrolMaxX: 410,
      patrolDir,
      state: "patrol",
      stateTimer: 0,
      viewRange: 145,
      viewFov: Math.PI / 3.2,
      speed: 44 + Math.min(30, this.distanceTraveled * 0.01),
      animTimer: Math.random() * 10,
      shootTimer: 0,
      pauseTimer: 0,
    });
  }

  private emitSound(x: number, y: number, maxRadius: number): void {
    this.soundRipples.push({
      x,
      y,
      radius: 5,
      maxRadius,
      life: 0.5,
      maxLife: 0.5,
    });

    for (const g of this.guards) {
      if (g.state === "stunned") continue;
      const dist = Math.hypot(g.pos.x - x, g.pos.y - y);
      if (dist < maxRadius) {
        g.state = "investigate";
        g.stateTimer = 4.5;
        g.investigatePos = new Vector2(x, y);
        g.targetAngle = Math.atan2(y - g.pos.y, x - g.pos.x);
      }
    }
  }

  public performCQC(): void {
    if (this.gameOver || this.isPaused) return;

    const playerWorldY = this.cameraY + this.playerY;
    let tookDown = false;

    for (const g of this.guards) {
      if (g.state === "stunned") continue;
      const dist = Math.hypot(g.pos.x - this.playerX, g.pos.y - playerWorldY);

      if (dist < 46) {
        g.state = "stunned";
        g.stateTimer = 22.0;
        tookDown = true;
        this.totalTakedowns++;
        this.score += Math.round(500 * this.stealthMultiplier);
        this.stealthMultiplier = Math.min(4.0, this.stealthMultiplier + 0.5);
        this.screenShake = 0.25;
        this.ctx.audio?.playHit?.();

        const screenGy = g.pos.y - this.cameraY;
        globalParticles.emitBurst(g.pos.x, screenGy, 20, ["#38BDF8", "#FFFFFF"], 50, 160);
        globalParticles.emitText(`SILENT TAKEDOWN! +${Math.round(500 * this.stealthMultiplier)}`, g.pos.x, screenGy - 20, "#38BDF8", 13);
        break;
      }
    }

    if (!tookDown) {
      this.emitSound(this.playerX, playerWorldY, 170);
      this.ctx.audio?.playMove?.();
      globalParticles.emitText("KNOCK...", this.playerX, this.playerY - 18, "#FEF08A", 12);
    }
  }

  private hasLineOfSight(x1: number, y1: number, x2: number, y2: number): boolean {
    const steps = 14;
    for (let i = 1; i < steps; i++) {
      const px = x1 + (x2 - x1) * (i / steps);
      const py = y1 + (y2 - y1) * (i / steps);

      for (const obs of this.obstacles) {
        if (px >= obs.x && px <= obs.x + obs.w && py >= obs.y && py <= obs.y + obs.h) {
          return false;
        }
      }
    }
    return true;
  }

  private checkCollision(x: number, worldY: number, radius: number): boolean {
    for (const obs of this.obstacles) {
      if (
        x + radius > obs.x &&
        x - radius < obs.x + obs.w &&
        worldY + radius > obs.y &&
        worldY - radius < obs.y + obs.h
      ) {
        return true;
      }
    }
    return false;
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    this.fanAngle += dt * 8;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // --- Player Movement & Automatic Unstuck Depenetration ---
    let dx = 0;
    let dy = 0;
    if (this.moveLeft) dx -= 1;
    if (this.moveRight) dx += 1;
    if (this.moveUp) dy -= 1;
    if (this.moveDown) dy += 1;

    const isMoving = dx !== 0 || dy !== 0;
    const playerWorldY = this.cameraY + this.playerY;

    if (isMoving) {
      this.walkAnimTimer += dt * 9;
      const len = Math.hypot(dx, dy);
      dx /= len;
      dy /= len;

      this.playerFacing = Math.atan2(dy, dx);
      const moveSpeed = this.isCrouching ? 85 : this.playerSpeed;

      const nextX = this.playerX + dx * moveSpeed * dt;
      const nextWorldY = playerWorldY + dy * moveSpeed * dt;

      if (!this.checkCollision(nextX, playerWorldY, 10)) {
        this.playerX = nextX;
      }

      if (!this.checkCollision(this.playerX, nextWorldY, 10)) {
        if (dy < 0) {
          this.cameraY += dy * moveSpeed * dt;
          this.distanceTraveled += Math.abs(dy * moveSpeed * dt * 0.1);
          this.score += Math.round(Math.abs(dy * moveSpeed * dt * 0.15) * this.stealthMultiplier);
        } else if (dy > 0) {
          this.cameraY += dy * moveSpeed * dt;
        }
      }

      if (!this.isCrouching && Math.random() < 0.22) {
        this.emitSound(this.playerX, this.cameraY + this.playerY, 95);
      }
    }

    // Depenetration Safety: Push player out of any overlapping obstacle
    for (const obs of this.obstacles) {
      const curPWY = this.cameraY + this.playerY;
      if (
        this.playerX > obs.x &&
        this.playerX < obs.x + obs.w &&
        curPWY > obs.y &&
        curPWY < obs.y + obs.h
      ) {
        // Push player to nearest edge
        const distLeft = Math.abs(this.playerX - obs.x);
        const distRight = Math.abs(this.playerX - (obs.x + obs.w));
        if (distLeft < distRight) {
          this.playerX = obs.x - 12;
        } else {
          this.playerX = obs.x + obs.w + 12;
        }
      }
    }

    this.playerX = Math.max(74, Math.min(426, this.playerX));

    // Continuous Endless Compound Stream Generation Ahead
    while (this.cameraY - 1200 < this.nextSpawnWorldY) {
      this.generateCompoundChunk(this.nextSpawnWorldY);
      this.nextSpawnWorldY -= 380;
    }

    // Clean up far behind obstacles & guards
    const playerBehindWorldY = this.cameraY + 950;
    this.obstacles = this.obstacles.filter((obs) => obs.y + obs.h > this.cameraY - 1400 && obs.y < playerBehindWorldY);
    this.guards = this.guards.filter((g) => g.pos.y > this.cameraY - 1400 && g.pos.y < playerBehindWorldY);

    // Cover Status Check
    const currentPWY = this.cameraY + this.playerY;
    this.isCovered = false;
    for (const obs of this.obstacles) {
      if (
        this.playerX >= obs.x - 16 &&
        this.playerX <= obs.x + obs.w + 16 &&
        currentPWY >= obs.y - 16 &&
        currentPWY <= obs.y + obs.h + 16
      ) {
        this.isCovered = true;
        break;
      }
    }

    // Update Sound Ripples
    for (let i = this.soundRipples.length - 1; i >= 0; i--) {
      const r = this.soundRipples[i];
      r.radius += (r.maxRadius / r.maxLife) * dt;
      r.life -= dt;
      if (r.life <= 0) this.soundRipples.splice(i, 1);
    }

    // --- Update Guard AI with Obstacle Collision ---
    for (const g of this.guards) {
      if (g.state === "stunned") {
        g.stateTimer -= dt;
        if (g.stateTimer <= 0) {
          g.state = "patrol";
          g.targetAngle = g.dirAngle;
        }
        continue;
      }

      let angleDiff = g.targetAngle - g.dirAngle;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
      g.dirAngle += angleDiff * Math.min(1, dt * 6);

      const toPlayerX = this.playerX - g.pos.x;
      const toPlayerY = currentPWY - g.pos.y;
      const distToPlayer = Math.hypot(toPlayerX, toPlayerY);

      if (distToPlayer < g.viewRange) {
        const angleToPlayer = Math.atan2(toPlayerY, toPlayerX);
        let fovDiff = angleToPlayer - g.dirAngle;
        while (fovDiff > Math.PI) fovDiff -= Math.PI * 2;
        while (fovDiff < -Math.PI) fovDiff += Math.PI * 2;

        const inFov = Math.abs(fovDiff) < g.viewFov / 2;
        const lineOfSight = this.hasLineOfSight(g.pos.x, g.pos.y, this.playerX, currentPWY);
        const isDetected = inFov && lineOfSight && (!this.isCovered || distToPlayer < 40);

        if (isDetected) {
          g.state = "alert";
          g.stateTimer = 5.0;
          g.targetAngle = angleToPlayer;
          this.alertLevel = "alert";
          this.alertTimer = 6.0;
          this.stealthMultiplier = 1.0;

          // Guard Fires Assault Rifle
          g.shootTimer -= dt;
          if (g.shootTimer <= 0) {
            g.shootTimer = 0.65;
            const bulletSpeed = 400;
            this.bullets.push({
              x: g.pos.x,
              y: g.pos.y,
              vx: Math.cos(g.dirAngle) * bulletSpeed,
              vy: Math.sin(g.dirAngle) * bulletSpeed,
            });
            this.ctx.audio?.playLaser?.();
            this.screenShake = 0.25;
            const screenGy = g.pos.y - this.cameraY;
            globalParticles.emitBurst(g.pos.x, screenGy, 8, ["#FEF08A", "#EF4444"], 40, 120);
          }
        }
      }

      // Guard Movement Logic
      if (g.state === "patrol") {
        if (g.pauseTimer > 0) {
          g.pauseTimer -= dt;
        } else {
          g.animTimer += dt * 6;
          const nextGX = g.pos.x + g.patrolDir * g.speed * dt;

          const hitObs = this.checkCollision(nextGX, g.pos.y, 12);
          const hitBound = nextGX >= g.patrolMaxX || nextGX <= g.patrolMinX;

          if (hitObs || hitBound) {
            g.patrolDir *= -1;
            g.pauseTimer = 1.0;
            g.targetAngle = g.patrolDir > 0 ? 0 : Math.PI;
          } else {
            g.pos.x = nextGX;
            g.targetAngle = g.patrolDir > 0 ? 0 : Math.PI;
          }
        }
      } else if (g.state === "investigate") {
        g.animTimer += dt * 7;
        g.stateTimer -= dt;
        if (g.investigatePos) {
          const toInvX = g.investigatePos.x - g.pos.x;
          const toInvY = g.investigatePos.y - g.pos.y;
          const distInv = Math.hypot(toInvX, toInvY);

          if (distInv > 12) {
            g.targetAngle = Math.atan2(toInvY, toInvX);
            const moveX = Math.cos(g.dirAngle) * (g.speed * 1.2) * dt;
            const moveY = Math.sin(g.dirAngle) * (g.speed * 1.2) * dt;

            if (!this.checkCollision(g.pos.x + moveX, g.pos.y, 12)) {
              g.pos.x += moveX;
            }
            if (!this.checkCollision(g.pos.x, g.pos.y + moveY, 12)) {
              g.pos.y += moveY;
            }
          }
        }
        if (g.stateTimer <= 0) {
          g.state = "patrol";
        }
      } else if (g.state === "alert") {
        g.animTimer += dt * 9;
        g.stateTimer -= dt;
        g.targetAngle = Math.atan2(currentPWY - g.pos.y, this.playerX - g.pos.x);
        const moveX = Math.cos(g.dirAngle) * (g.speed * 1.5) * dt;
        const moveY = Math.sin(g.dirAngle) * (g.speed * 1.5) * dt;

        if (!this.checkCollision(g.pos.x + moveX, g.pos.y, 12)) {
          g.pos.x += moveX;
        }
        if (!this.checkCollision(g.pos.x, g.pos.y + moveY, 12)) {
          g.pos.y += moveY;
        }

        if (g.stateTimer <= 0) {
          g.state = "investigate";
          g.investigatePos = new Vector2(this.playerX, currentPWY);
          g.stateTimer = 4.0;
        }
      }
    }

    if (this.alertTimer > 0) {
      this.alertTimer -= dt;
      if (this.alertTimer <= 0) {
        this.alertLevel = "normal";
      }
    }

    // --- Update Bullets ---
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (this.checkCollision(b.x, b.y, 4)) {
        this.bullets.splice(i, 1);
        globalParticles.emitBurst(b.x, b.y - this.cameraY, 6, ["#FEF08A", "#FFFFFF"], 30, 80);
        continue;
      }

      if (Math.hypot(this.playerX - b.x, currentPWY - b.y) < 16) {
        this.gameOver = true;
        this.screenShake = 0.8;
        this.ctx.session.setStatus("game-over");
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(this.playerX, this.playerY, 40, ["#EF4444", "#F59E0B", "#FFFFFF"], 100, 300);
        return;
      }

      if (b.y < this.cameraY - 700 || b.y > this.cameraY + 800 || b.x < 0 || b.x > 600) {
        this.bullets.splice(i, 1);
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;

    if (action === "ACTION_SECONDARY") {
      this.isCrouching = isPressed;
    }

    if (!isPressed) return;

    if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      this.performCQC();
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
  public getLevel(): number { return Math.floor(this.distanceTraveled / 100) + 1; }

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

    // 1. Dark Asphalt Alleyway Ground
    pr.drawRect(0, 0, w, h, "#121722", true);

    // Parallax Gravel Speckles & Drainage Seams
    const scrollOffsetY = (-this.cameraY) % 48;
    for (let gy = -48 + scrollOffsetY; gy < h + 48; gy += 32) {
      for (let gx = 64; gx < 440; gx += 32) {
        if ((gx + gy * 3) % 5 === 0) {
          pr.drawRect(gx + 4, gy + 4, 2, 2, "rgba(56, 189, 248, 0.07)", true);
        }
      }
    }

    // 2. Render Environment Obstacles
    for (const obs of this.obstacles) {
      const screenOy = obs.y - this.cameraY;
      if (screenOy + obs.h < -50 || screenOy > h + 50) continue;

      if (obs.type === "green_crate") {
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#1E3022", true);
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#2D4833", false);

        for (let rx = obs.x + 8; rx < obs.x + obs.w - 4; rx += 14) {
          pr.drawRect(rx, screenOy + 4, 8, obs.h - 8, "#18261B", true);
          pr.drawLine(rx, screenOy + 4, rx, screenOy + obs.h - 4, "#385A40", 1);
        }
        pr.drawRect(obs.x + obs.w / 2 - 3, screenOy + obs.h / 2 - 8, 6, 16, "#EAB308", true);
        pr.drawRect(obs.x + 4, screenOy + 4, obs.w - 8, 2, "#3D6246", true);
      } else if (obs.type === "wood_crate") {
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#4E3722", true);
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#6D4E30", false);
        pr.drawLine(obs.x + 4, screenOy + 4, obs.x + obs.w - 4, screenOy + obs.h - 4, "#362617", 2);
        pr.drawLine(obs.x + obs.w - 4, screenOy + 4, obs.x + 4, screenOy + obs.h - 4, "#362617", 2);
      } else if (obs.type === "generator") {
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#181D26", true);
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#2E384A", false);
        for (let vy = screenOy + 12; vy < screenOy + obs.h - 16; vy += 10) {
          pr.drawRect(obs.x + 8, vy, obs.w - 16, 4, "#0E1117", true);
        }
        pr.drawCircle(obs.x + 12, screenOy + obs.h - 8, 3, "#EAB308", true);
      } else if (obs.type === "building") {
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#1E2736", true);
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#2D3B52", false);

        pr.drawRect(obs.x + 25, screenOy + 90, 75, 75, "#151B26", true);
        pr.drawCircle(obs.x + 62, screenOy + 127, 30, "#0E121A", true);
        pr.drawCircle(obs.x + 62, screenOy + 127, 30, "#334155", false);

        pr.save();
        pr.translate(obs.x + 62, screenOy + 127);
        pr.rotate(this.fanAngle);
        for (let f = 0; f < 4; f++) {
          const fa = (f * Math.PI) / 2;
          pr.drawLine(0, 0, Math.cos(fa) * 26, Math.sin(fa) * 26, "#475569", 4);
        }
        pr.restore();

        pr.drawRect(obs.x + 30, screenOy + 18, 90, 16, "#2B374A", true);
        pr.drawRect(obs.x + 30, screenOy + 42, 90, 16, "#2B374A", true);
        pr.drawLine(obs.x + 30, screenOy + 26, obs.x + 120, screenOy + 26, "#475569", 2);

        pr.drawRect(obs.x + 85, screenOy + 260, 48, 32, "#0B0E14", true);
        pr.drawRect(obs.x + 85, screenOy + 260, 48, 32, "#38475E", false);
        for (let bx = obs.x + 94; bx < obs.x + 130; bx += 8) {
          pr.drawLine(bx, screenOy + 260, bx, screenOy + 292, "#64748B", 2);
        }
      } else if (obs.type === "wall_left") {
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#1A222E", true);
        pr.drawRect(obs.x, screenOy, obs.w, obs.h, "#283547", false);

        pr.drawRect(35, screenOy + 60, 10, 22, "#EF4444", true);
        pr.drawCircle(40, screenOy + 58, 4, "#000000", true);
        pr.drawLine(40, screenOy + 58, 35, screenOy + 72, "#000000", 2);

        pr.drawCircle(58, screenOy + 180, 8, "#22543D", true);
        pr.drawCircle(58, screenOy + 340, 8, "#276749", true);
      }
    }

    // 3. Sound Ripples
    for (const r of this.soundRipples) {
      const alpha = r.life / r.maxLife;
      const screenRy = r.y - this.cameraY;
      pr.drawCircle(r.x, screenRy, r.radius, `rgba(56, 189, 248, ${alpha * 0.4})`, false);
    }

    // 4. Guards Vision Cones & Guard Sprites
    for (const g of this.guards) {
      const screenGy = g.pos.y - this.cameraY;
      if (screenGy < -160 || screenGy > h + 160) continue;

      if (g.state !== "stunned" && ctx2d) {
        ctx2d.save();
        ctx2d.translate(g.pos.x, screenGy);
        ctx2d.rotate(g.dirAngle);

        const coneColor =
          g.state === "alert"
            ? "rgba(239, 68, 68, 0.28)"
            : g.state === "investigate"
            ? "rgba(234, 179, 8, 0.24)"
            : "rgba(56, 189, 248, 0.16)";

        const coneBorder =
          g.state === "alert"
            ? "#EF4444"
            : g.state === "investigate"
            ? "#EAB308"
            : "rgba(56, 189, 248, 0.4)";

        ctx2d.fillStyle = coneColor;
        ctx2d.strokeStyle = coneBorder;
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        ctx2d.moveTo(0, 0);
        ctx2d.arc(0, 0, g.viewRange, -g.viewFov / 2, g.viewFov / 2);
        ctx2d.closePath();
        ctx2d.fill();
        ctx2d.stroke();
        ctx2d.restore();
      }

      // Guard Body
      pr.save();
      pr.translate(g.pos.x, screenGy);
      pr.rotate(g.dirAngle + Math.PI / 2);

      if (g.state === "stunned") {
        pr.drawRect(-11, -7, 22, 14, "#1E3A8A", true);
        pr.drawCircle(0, -9, 6, "#2563EB", true);
        pr.drawText("💤", 0, -14, { size: 12, color: "#38BDF8", align: "center" });
      } else {
        const legSwing = Math.sin(g.animTimer) * 4;
        const walkBob = Math.abs(Math.sin(g.animTimer)) * 2;

        pr.drawRect(-7, 8 + legSwing, 5, 7, "#0F172A", true);
        pr.drawRect(2, 8 - legSwing, 5, 7, "#0F172A", true);

        pr.drawRect(-9, -10 + walkBob, 18, 18, "#1E40AF", true);
        pr.drawRect(-7, -8 + walkBob, 14, 14, "#2563EB", true);
        pr.drawRect(-8, -4 + walkBob, 16, 3, "#1E3A8A", true);

        pr.drawCircle(0, -12 + walkBob, 7, "#1D4ED8", true);
        pr.drawRect(-6, -14 + walkBob, 12, 3, "#1E40AF", true);
        pr.drawCircle(0, -10 + walkBob, 4.5, "#FBBF24", true);
        pr.drawCircle(2, -10 + walkBob, 1.5, "#1E293B", true);

        pr.drawRect(6, -6 + walkBob, 4, 18, "#0F172A", true);
        pr.drawRect(5, 2 + walkBob, 6, 3, "#334155", true);

        if (g.state === "alert") {
          pr.drawText("❗", 0, -24, { size: 16, color: "#EF4444", align: "center" });
        } else if (g.state === "investigate") {
          pr.drawText("❓", 0, -24, { size: 14, color: "#EAB308", align: "center" });
        }
      }
      pr.restore();
    }

    // 5. Operative Infiltrator Body
    pr.save();
    pr.translate(this.playerX, this.playerY);
    pr.rotate(this.playerFacing + Math.PI / 2);

    const pLegSwing = Math.sin(this.walkAnimTimer) * 4;
    const pWalkBob = Math.abs(Math.sin(this.walkAnimTimer)) * 2;

    pr.drawRect(-7, 8 + pLegSwing, 5, 7, "#18181B", true);
    pr.drawRect(2, 8 - pLegSwing, 5, 7, "#18181B", true);

    pr.drawRect(-9, -10 + pWalkBob, 18, 18, "#2D4018", true);
    pr.drawRect(-7, -8 + pWalkBob, 14, 14, "#4D6B28", true);
    pr.drawRect(-8, -4 + pWalkBob, 16, 3, "#1C2412", true);

    pr.drawCircle(0, -12 + pWalkBob, 7, "#5B381C", true);
    pr.drawRect(-6, -14 + pWalkBob, 12, 3, "#65A30D", true);
    pr.drawCircle(0, -10 + pWalkBob, 4.5, "#FBBF24", true);
    pr.drawCircle(2, -10 + pWalkBob, 1.5, "#00F0FF", true);

    if (this.isCovered) {
      pr.drawCircle(0, 0, 15, "rgba(52, 211, 153, 0.3)", false);
    }
    pr.restore();

    // 6. Bullets
    for (const b of this.bullets) {
      pr.drawCircle(b.x, b.y - this.cameraY, 3, "#EF4444", true);
      pr.drawCircle(b.x, b.y - this.cameraY, 1.5, "#FFFFFF", true);
    }

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 7. Tactical Soliton Radar & Alert HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, this.alertLevel === "alert" ? "#EF4444" : "#38BDF8", false);

    pr.drawText(`DISTANCE: ${Math.floor(this.distanceTraveled)}M`, 24, 28, { size: 13, color: "#FFD84D", font: "monospace" });

    const alertStatusText =
      this.alertLevel === "alert"
        ? `ALERT! [${Math.ceil(this.alertTimer)}s]`
        : `STEALTH MULTIPLIER: x${this.stealthMultiplier.toFixed(1)} • TAKEDOWNS: ${this.totalTakedowns}`;
    pr.drawText(alertStatusText, w / 2, 28, {
      size: 11,
      color: this.alertLevel === "alert" ? "#EF4444" : "#34D399",
      align: "center",
      font: "monospace",
    });

    pr.drawText(`SCORE: ${this.score}`, w - 24, 28, { size: 13, color: "#38BDF8", align: "right", font: "monospace" });

    // Controls Strip (Bottom-Left)
    pr.drawRect(16, h - 34, 380, 22, "rgba(8, 14, 28, 0.92)", true);
    pr.drawText("[WASD: SNEAK FORWARD  •  SPACE/CLICK: CQC TAKEDOWN / KNOCK  •  SHIFT: CROUCH]", 206, h - 19, {
      size: 7.2,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("OPERATIVE DISCOVERED — MISSION FAILED", w / 2, h / 2 - 12, { size: 17, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [SPACE] OR [R] TO RETRY", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
