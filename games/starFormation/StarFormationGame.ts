import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

type CarriageType = "locomotive" | "flak_turret" | "missile_silo" | "plasma_mortar" | "reactor_core";

interface TrainCarriage {
  type: CarriageType;
  name: string;
  yOffset: number; // Offset behind locomotive
  width: number;
  length: number;
  hp: number;
  maxHp: number;
  destroyed: boolean;
  attackCooldown: number;
  turretAngle: number;
  siloOpen: number; // 0..1
}

interface Projectile {
  pos: Vector2;
  vel: Vector2;
  isPlayer: boolean;
  isBomb?: boolean;
  isHoming?: boolean;
  damage: number;
  color: string;
  glow?: string;
  radius: number;
}

interface GroundVehicle {
  x: number;
  y: number;
  speed: number;
  color: string;
  isTruck: boolean;
}

export class StarFormationGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 560);
  private playerVel: Vector2 = new Vector2(0, 0);

  // Train State
  private trainX: number = 300;
  private trainY: number = 180;
  private trainSpeed: number = 280;
  private trainTrack: number = 1; // 0: Left Track, 1: Right Track
  private trainTargetX: number = 300;
  private carriages: TrainCarriage[] = [];

  private projectiles: Projectile[] = [];
  private groundVehicles: GroundVehicle[] = [];

  private moveLeft = false;
  private moveRight = false;
  private moveUp = false;
  private moveDown = false;
  private isShooting = false;
  private shootTimer = 0;
  private bombCooldown = 0;
  private barrelRollTimer = 0;

  private score = 0;
  private level = 1;
  private phase = 1;
  private lives = 3;
  private shield = 100;
  private scrollOffset = 0;
  private isWon = false;
  private gameOver = false;
  private isPaused = false;
  private animTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 560);
    this.playerVel = new Vector2(0, 0);
    this.trainX = 300;
    this.trainY = 180;
    this.trainTargetX = 300;
    this.trainSpeed = 280;
    this.trainTrack = 1;
    this.projectiles = [];
    this.groundVehicles = [];

    this.score = 0;
    this.level = 1;
    this.phase = 1;
    this.lives = 3;
    this.shield = 100;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.scrollOffset = 0;
    this.shootTimer = 0;
    this.bombCooldown = 0;
    this.barrelRollTimer = 0;

    this.initTrainCarriages();
    this.initGroundTraffic();
  }

  private initTrainCarriages(): void {
    this.carriages = [
      {
        type: "locomotive",
        name: "ARMORED TITAN LOCOMOTIVE",
        yOffset: 0,
        width: 44,
        length: 70,
        hp: 120 + (this.level - 1) * 40,
        maxHp: 120 + (this.level - 1) * 40,
        destroyed: false,
        attackCooldown: 1.5,
        turretAngle: 0,
        siloOpen: 0,
      },
      {
        type: "flak_turret",
        name: "TWIN FLAK CANNON",
        yOffset: 80,
        width: 40,
        length: 64,
        hp: 60 + (this.level - 1) * 20,
        maxHp: 60 + (this.level - 1) * 20,
        destroyed: false,
        attackCooldown: 0.8,
        turretAngle: 0,
        siloOpen: 0,
      },
      {
        type: "missile_silo",
        name: "VERTICAL SAM MISSILE SILO",
        yOffset: 154,
        width: 40,
        length: 64,
        hp: 70 + (this.level - 1) * 20,
        maxHp: 70 + (this.level - 1) * 20,
        destroyed: false,
        attackCooldown: 2.2,
        turretAngle: 0,
        siloOpen: 0,
      },
      {
        type: "plasma_mortar",
        name: "PLASMA MORTAR HOWITZER",
        yOffset: 228,
        width: 40,
        length: 64,
        hp: 80 + (this.level - 1) * 25,
        maxHp: 80 + (this.level - 1) * 25,
        destroyed: false,
        attackCooldown: 2.8,
        turretAngle: 0,
        siloOpen: 0,
      },
      {
        type: "reactor_core",
        name: "REAR TURBO GENERATOR",
        yOffset: 302,
        width: 42,
        length: 60,
        hp: 100 + (this.level - 1) * 30,
        maxHp: 100 + (this.level - 1) * 30,
        destroyed: false,
        attackCooldown: 3.5,
        turretAngle: 0,
        siloOpen: 0,
      },
    ];
  }

  private initGroundTraffic(): void {
    this.groundVehicles = [
      { x: 500, y: 100, speed: 180, color: "#38BDF8", isTruck: true },
      { x: 530, y: 340, speed: 220, color: "#F59E0B", isTruck: false },
      { x: 490, y: 550, speed: 160, color: "#94A3B8", isTruck: true },
    ];
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused || this.isWon) return;

    this.animTime += dt;
    this.scrollOffset += (this.trainSpeed + 120) * dt;

    if (this.barrelRollTimer > 0) this.barrelRollTimer -= dt;
    if (this.bombCooldown > 0) this.bombCooldown -= dt;

    // 1. Smooth Flight Controls for Player Spaceship
    const spd = 420;
    let ix = 0;
    let iy = 0;
    if (this.moveLeft) ix -= 1;
    if (this.moveRight) ix += 1;
    if (this.moveUp) iy -= 1;
    if (this.moveDown) iy += 1;

    if (ix !== 0 && iy !== 0) {
      ix *= 0.7071;
      iy *= 0.7071;
    }

    this.playerVel.x += ix * spd * 8 * dt;
    this.playerVel.y += iy * spd * 8 * dt;
    this.playerVel.x *= 0.82;
    this.playerVel.y *= 0.82;

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));
    this.playerPos.y = Math.max(120, Math.min(650, this.playerPos.y));

    // 2. Player Weapon Firing
    this.shootTimer -= dt;
    if (this.shootTimer <= 0) {
      this.shootTimer = 0.12;
      // Twin Wingtip Lasers
      this.projectiles.push({
        pos: new Vector2(this.playerPos.x - 12, this.playerPos.y - 20),
        vel: new Vector2(0, -780),
        isPlayer: true,
        damage: 2,
        color: "#00F0FF",
        glow: "#FFFFFF",
        radius: 3,
      });
      this.projectiles.push({
        pos: new Vector2(this.playerPos.x + 12, this.playerPos.y - 20),
        vel: new Vector2(0, -780),
        isPlayer: true,
        damage: 2,
        color: "#00F0FF",
        glow: "#FFFFFF",
        radius: 3,
      });
      this.ctx.audio?.playLaser?.();
    }

    // 3. Train Motion & Track Switching Logic
    this.trainX += (this.trainTargetX - this.trainX) * 4 * dt;
    this.trainY = 160 + Math.sin(this.animTime * 1.5) * 15;

    // Track Switching every few seconds
    if (Math.floor(this.animTime) % 12 === 0 && Math.abs(this.trainX - this.trainTargetX) < 5) {
      this.trainTrack = this.trainTrack === 1 ? 0 : 1;
      this.trainTargetX = this.trainTrack === 0 ? 210 : 340;
    }

    // 4. Update Train Carriages & AI Attacks
    let remainingCarriages = 0;

    for (const car of this.carriages) {
      if (car.destroyed) continue;
      remainingCarriages++;

      const carX = this.trainX;
      const carY = this.trainY + car.yOffset;

      // Aim turret towards player
      car.turretAngle = Math.atan2(this.playerPos.y - carY, this.playerPos.x - carX);
      car.attackCooldown -= dt;

      if (car.attackCooldown <= 0) {
        if (car.type === "flak_turret") {
          car.attackCooldown = Math.max(0.4, 0.9 - this.phase * 0.15);
          // Rapid twin flak burst
          const flakSpd = 340;
          this.projectiles.push({
            pos: new Vector2(carX, carY),
            vel: new Vector2(Math.cos(car.turretAngle - 0.1) * flakSpd, Math.sin(car.turretAngle - 0.1) * flakSpd),
            isPlayer: false,
            damage: 12,
            color: "#F59E0B",
            glow: "#FEF08A",
            radius: 4,
          });
          this.projectiles.push({
            pos: new Vector2(carX, carY),
            vel: new Vector2(Math.cos(car.turretAngle + 0.1) * flakSpd, Math.sin(car.turretAngle + 0.1) * flakSpd),
            isPlayer: false,
            damage: 12,
            color: "#F59E0B",
            glow: "#FEF08A",
            radius: 4,
          });
          this.ctx.audio?.playHit?.();
        } else if (car.type === "missile_silo") {
          car.attackCooldown = 2.4;
          car.siloOpen = 1.0;
          // Launch Homing SAM Missiles
          this.projectiles.push({
            pos: new Vector2(carX - 10, carY),
            vel: new Vector2(-60, -180),
            isPlayer: false,
            isHoming: true,
            damage: 22,
            color: "#EF4444",
            glow: "#FCA5A5",
            radius: 5,
          });
          this.projectiles.push({
            pos: new Vector2(carX + 10, carY),
            vel: new Vector2(60, -180),
            isPlayer: false,
            isHoming: true,
            damage: 22,
            color: "#EF4444",
            glow: "#FCA5A5",
            radius: 5,
          });
          this.ctx.audio?.playPowerUp?.();
        } else if (car.type === "plasma_mortar") {
          car.attackCooldown = 3.0;
          // Arcing Plasma Clusters
          for (let p = -1; p <= 1; p++) {
            const spread = car.turretAngle + p * 0.25;
            this.projectiles.push({
              pos: new Vector2(carX, carY),
              vel: new Vector2(Math.cos(spread) * 260, Math.sin(spread) * 260),
              isPlayer: false,
              damage: 28,
              color: "#C084FC",
              glow: "#E879F9",
              radius: 6,
            });
          }
          this.ctx.audio?.playExplosion?.();
        } else if (car.type === "locomotive") {
          car.attackCooldown = 2.0;
          // Heavy Lead Cowcatcher Cannon
          this.projectiles.push({
            pos: new Vector2(carX, carY + 30),
            vel: new Vector2(0, 320),
            isPlayer: false,
            damage: 20,
            color: "#DC2626",
            glow: "#FCA5A5",
            radius: 5,
          });
        }
      }

      if (car.siloOpen > 0) car.siloOpen = Math.max(0, car.siloOpen - dt * 0.8);
    }

    // 5. Update Highway Ground Traffic
    for (const v of this.groundVehicles) {
      v.y += (v.speed - this.trainSpeed * 0.4) * dt;
      if (v.y > 720) {
        v.y = -60;
        v.x = 480 + (Math.random() > 0.5 ? 40 : 0);
      }
    }

    // 6. Update Projectiles & Check Collisions
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];

      // Homing missile logic
      if (p.isHoming) {
        const hx = this.playerPos.x - p.pos.x;
        const hy = this.playerPos.y - p.pos.y;
        const hDist = Math.hypot(hx, hy);
        if (hDist > 1) {
          p.vel.x += (hx / hDist) * 320 * dt;
          p.vel.y += (hy / hDist) * 320 * dt;
          // Speed cap
          const curSpd = Math.hypot(p.vel.x, p.vel.y);
          if (curSpd > 260) {
            p.vel.x = (p.vel.x / curSpd) * 260;
            p.vel.y = (p.vel.y / curSpd) * 260;
          }
        }
      }

      p.pos.x += p.vel.x * dt;
      p.pos.y += p.vel.y * dt;

      // Screen boundary cleanup
      if (p.pos.y < -30 || p.pos.y > 720 || p.pos.x < 10 || p.pos.x > 590) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.isPlayer) {
        // Check Player Lasers / Bombs hit on Train Carriages
        let hitCarriage = false;
        for (const car of this.carriages) {
          if (car.destroyed) continue;

          const carX = this.trainX;
          const carY = this.trainY + car.yOffset;

          if (
            Math.abs(p.pos.x - carX) < car.width / 2 &&
            Math.abs(p.pos.y - carY) < car.length / 2
          ) {
            car.hp -= p.damage;
            this.score += 50 * this.phase;
            this.projectiles.splice(i, 1);
            this.ctx.audio?.playHit?.();
            globalParticles.emitBurst(p.pos.x, p.pos.y, 8, ["#00F0FF", "#FFFFFF", "#F59E0B"], 40, 140);
            hitCarriage = true;

            // Carriage Destroyed!
            if (car.hp <= 0) {
              car.destroyed = true;
              const bonus = car.type === "locomotive" ? 5000 : 1500;
              this.score += bonus * this.phase;
              this.ctx.audio?.playExplosion?.();
              globalParticles.emitBurst(carX, carY, 30, ["#DC2626", "#F59E0B", "#ffd84d", "#1E293B"], 100, 320);
              globalParticles.emitText(`DESTROYED! +${bonus}`, carX, carY, "#F59E0B", 14);

              // Check if Locomotive / All Carriages Destroyed
              const remaining = this.carriages.filter((c) => !c.destroyed).length;
              if (remaining === 0 || (car.type === "locomotive" && remaining <= 1)) {
                this.handleTrainVictory();
              }
            }
            break;
          }
        }
        if (hitCarriage) continue;
      } else {
        // Enemy projectile hits Player
        if (
          Math.hypot(p.pos.x - this.playerPos.x, p.pos.y - this.playerPos.y) < 20 &&
          this.barrelRollTimer <= 0
        ) {
          this.projectiles.splice(i, 1);
          this.shield -= p.damage;
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 14, ["#EF4444", "#F59E0B", "#FFFFFF"], 70, 220);

          if (this.shield <= 0) {
            this.lives--;
            this.shield = 100;
            this.ctx.audio?.playGameOver?.();
            if (this.lives <= 0) {
              this.gameOver = true;
              this.ctx.session.setStatus("game-over");
            }
          }
        }
      }
    }
  }

  private handleTrainVictory(): void {
    if (this.isWon) return;
    this.isWon = true;
    this.score += 25000;
    this.ctx.audio?.playVictory?.();
    globalParticles.emitBurst(this.trainX, this.trainY + 100, 60, ["#DC2626", "#F59E0B", "#ffd84d", "#00F0FF"], 140, 450);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;

    if (action === "ACTION_SECONDARY" && isPressed && this.bombCooldown <= 0) {
      // Drop Heavy Photon Bomb
      this.bombCooldown = 0.8;
      this.projectiles.push({
        pos: new Vector2(this.playerPos.x, this.playerPos.y - 10),
        vel: new Vector2(0, -420),
        isPlayer: true,
        isBomb: true,
        damage: 16,
        color: "#F59E0B",
        glow: "#FEF08A",
        radius: 8,
      });
      this.ctx.audio?.playPowerUp?.();
      globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 10, ["#F59E0B", "#FFFFFF"], 50, 160);
    }

    if (action === "ROTATE" && isPressed && this.barrelRollTimer <= 0) {
      // Barrel Roll / Shield Evasion
      this.barrelRollTimer = 0.45;
      this.ctx.audio?.playRotate?.();
      globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 16, ["#00F0FF", "#FFFFFF", "#38BDF8"], 60, 200);
      globalParticles.emitText("BARREL ROLL!", this.playerPos.x, this.playerPos.y - 30, "#00F0FF", 12);
    }

    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. River Canal on the Left (Flowing Blue Water)
    pr.drawRect(0, 0, 140, h, "#0284C7", true);
    for (let wy = -40; wy < h + 40; wy += 36) {
      const waveY = (wy + this.scrollOffset * 0.4) % (h + 40);
      pr.drawLine(10, waveY, 130, waveY, "rgba(255,255,255,0.25)", 2);
    }
    // Concrete Canal Shore Embankment
    pr.drawRect(138, 0, 12, h, "#64748B", true);
    pr.drawRect(148, 0, 4, h, "#94A3B8", true);

    // 2. Railway Ballast Bed & Dual Tracks (Center)
    pr.drawRect(152, 0, 316, h, "#94A3B8", true); // Gravel Ballast

    // Track 1 (Left Track: x = 210) & Track 2 (Right Track: x = 340)
    const trackCenters = [210, 340];
    for (const tx of trackCenters) {
      // Wooden Railway Sleepers / Ties
      for (let ty = -20; ty < h + 20; ty += 22) {
        const tieY = (ty + this.scrollOffset) % (h + 20);
        pr.drawRect(tx - 28, tieY, 56, 6, "#57534E", true);
      }
      // Steel Rail Lines
      pr.drawRect(tx - 20, 0, 4, h, "#E2E8F0", true);
      pr.drawRect(tx + 16, 0, 4, h, "#E2E8F0", true);
    }

    // Overhead Catenary Electric Gantry Poles (Matching Screenshot)
    for (let gy = -80; gy < h + 80; gy += 160) {
      const gantryY = (gy + this.scrollOffset) % (h + 80);
      pr.drawRect(154, gantryY - 4, 8, 8, "#475569", true); // Left Pylon
      pr.drawRect(456, gantryY - 4, 8, 8, "#475569", true); // Right Pylon
      pr.drawLine(158, gantryY, 460, gantryY, "rgba(255,255,255,0.6)", 2); // Overhead Crossbar
    }

    // 3. Highway Service Road on Right
    pr.drawRect(468, 0, w - 468, h, "#334155", true);
    for (let dy = -30; dy < h + 30; dy += 48) {
      const dashY = (dy + this.scrollOffset * 0.6) % (h + 30);
      pr.drawRect(518, dashY, 4, 20, "#FACC15", true);
    }

    // Draw Highway Traffic Vehicles
    for (const v of this.groundVehicles) {
      if (v.isTruck) {
        // Pickup Truck (from screenshot)
        pr.drawPixelBlock(v.x - 12, v.y - 16, 24, v.color, "#FFFFFF", "#0F172A");
        pr.drawRect(v.x - 10, v.y - 4, 20, 14, "#475569", true); // Bed
      } else {
        pr.drawPixelBlock(v.x - 10, v.y - 12, 20, v.color, "#FFFFFF", "#0F172A");
      }
    }

    // 4. Draw Evil Armored Villain Train Carriages
    for (const car of this.carriages) {
      const carX = this.trainX;
      const carY = this.trainY + car.yOffset;

      if (car.destroyed) {
        // Burning Destroyed Carriage Husk
        pr.drawRect(carX - car.width / 2, carY - car.length / 2, car.width, car.length, "#1C1917", true);
        pr.drawCircle(carX, carY, 12, "rgba(239, 68, 68, 0.4)", true);
        pr.drawCircle(carX + 4, carY - 6, 8, "#F59E0B", true);
        continue;
      }

      if (car.type === "locomotive") {
        // Heavy Armored Locomotive Engine (Red & Titanium)
        pr.drawPixelBlock(carX - car.width / 2, carY - car.length / 2, car.width, "#DC2626", "#F87171", "#7F1D1D");
        // Pilot Cowcatcher Prow
        pr.drawRect(carX - car.width / 2 + 4, carY - car.length / 2 - 8, car.width - 8, 8, "#1E293B", true);
        // Cabin Windows & Headlights
        pr.drawRect(carX - 14, carY - car.length / 2 + 6, 28, 10, "#0F172A", true);
        pr.drawCircle(carX - 10, carY - car.length / 2 - 4, 3, "#FEF08A", true);
        pr.drawCircle(carX + 10, carY - car.length / 2 - 4, 3, "#FEF08A", true);
      } else if (car.type === "flak_turret") {
        // Commuter / Armored Flak Carriage (White & Orange Livery from screenshot)
        pr.drawRect(carX - car.width / 2, carY - car.length / 2, car.width, car.length, "#E2E8F0", true);
        pr.drawRect(carX - car.width / 2, carY - 6, car.width, 12, "#EA580C", true); // Orange Stripe
        // Rotating Flak Turret
        pr.drawCircle(carX, carY, 10, "#1E293B", true);
        const bx = carX + Math.cos(car.turretAngle) * 16;
        const by = carY + Math.sin(car.turretAngle) * 16;
        pr.drawLine(carX, carY, bx, by, "#000000", 3);
      } else if (car.type === "missile_silo") {
        pr.drawRect(carX - car.width / 2, carY - car.length / 2, car.width, car.length, "#CBD5E1", true);
        pr.drawRect(carX - car.width / 2, carY - 6, car.width, 12, "#DC2626", true);
        // Silo Roof Hatches
        pr.drawRect(carX - 12, carY - 14, 10, 10, "#0F172A", true);
        pr.drawRect(carX + 2, carY - 14, 10, 10, "#0F172A", true);
        if (car.siloOpen > 0) {
          pr.drawCircle(carX - 7, carY - 9, 4, "#EF4444", true);
          pr.drawCircle(carX + 7, carY - 9, 4, "#EF4444", true);
        }
      } else if (car.type === "plasma_mortar") {
        pr.drawRect(carX - car.width / 2, carY - car.length / 2, car.width, car.length, "#E2E8F0", true);
        pr.drawRect(carX - car.width / 2, carY - 6, car.width, 12, "#7E22CE", true); // Violet Trim
        // Heavy Mortar Ring
        pr.drawCircle(carX, carY, 12, "#3B0764", true);
        pr.drawCircle(carX, carY, 6, "#C084FC", true);
      } else {
        // Reactor Core Generator
        pr.drawRect(carX - car.width / 2, carY - car.length / 2, car.width, car.length, "#1E293B", true);
        pr.drawCircle(carX, carY, 10, "#00F0FF", true);
        pr.drawCircle(carX, carY, 5, "#FFFFFF", true);
      }

      // Carriage Health Bar
      const hpPct = car.hp / car.maxHp;
      pr.drawRect(carX - 18, carY - car.length / 2 - 6, 36, 4, "#0F172A", true);
      pr.drawRect(carX - 18, carY - car.length / 2 - 6, 36 * hpPct, 4, "#22C55E", true);
    }

    // 5. Draw Projectiles
    for (const p of this.projectiles) {
      if (p.isBomb) {
        pr.drawCircle(p.pos.x, p.pos.y, p.radius, p.color, true);
        pr.drawCircle(p.pos.x, p.pos.y, p.radius * 0.5, p.glow || "#FFFFFF", true);
      } else if (p.isPlayer) {
        pr.drawRect(p.pos.x - 2, p.pos.y - 6, 4, 12, p.color, true);
        pr.drawRect(p.pos.x - 1, p.pos.y - 4, 2, 8, "#FFFFFF", true);
      } else {
        pr.drawCircle(p.pos.x, p.pos.y, p.radius, p.color, true);
        pr.drawCircle(p.pos.x, p.pos.y, p.radius * 0.4, p.glow || "#FFFFFF", true);
      }
    }

    // 6. Draw Player Spaceship Hovering from Sky POV
    const px = this.playerPos.x;
    const py = this.playerPos.y;

    // Barrel roll visual
    const scaleX = this.barrelRollTimer > 0 ? Math.cos(this.animTime * 25) : 1;
    pr.save();
    pr.translate(px, py);
    pr.scale(scaleX, 1);
    drawSpaceshipSprite(pr, 0, 0, 42, 0, "#00F0FF");
    pr.restore();

    // Active Forcefield Ring
    pr.drawCircle(px, py, 26, "rgba(0, 240, 255, 0.2)", false);

    // 7. Render Particle Bursts
    globalParticles.render(pr);

    // 8. Top Tactical HUD
    pr.drawRect(12, 12, w - 24, 38, "rgba(15, 23, 42, 0.9)", true);
    pr.drawRect(12, 12, w - 24, 38, "#334155", false);

    pr.drawText(`SCORE: ${this.score}`, 24, 28, { size: 12, color: "#FFD84D", font: "monospace" });
    pr.drawText(`RAIL STORM • LVL ${this.level}`, w / 2, 28, { size: 12, color: "#F97316", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`, w - 24, 28, { size: 12, color: "#F43F5E", align: "right", font: "monospace" });

    // Shield Bar
    const shieldW = 100;
    const shieldPct = Math.max(0, this.shield / 100);
    pr.drawRect(w - 24 - shieldW, 36, shieldW, 6, "#0F172A", true);
    pr.drawRect(w - 24 - shieldW, 36, shieldW * shieldPct, 6, "#38BDF8", true);

    // Controls Legend Footer
    pr.drawRect(16, h - 26, w - 32, 18, "rgba(15, 23, 42, 0.85)", true);
    pr.drawText(
      "[ARROWS/WASD: FLY  •  AUTO-LASER  •  X: DROP BOMB  •  C: BARREL ROLL]",
      w / 2,
      h - 13,
      {
        size: 9,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      }
    );

    // Overlay Screens
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(15, 23, 42, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#DC2626", false);
      pr.drawText("MISSION FAILED — FIGHTER SHOT DOWN", w / 2, h / 2 - 10, { size: 20, color: "#DC2626", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RE-ENGAGE TRAIN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(15, 23, 42, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22C55E", false);
      pr.drawText("VILLAIN BATTLE TRAIN ANNIHILATED!", w / 2, h / 2 - 10, { size: 20, color: "#22C55E", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY NEXT SECTOR", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
