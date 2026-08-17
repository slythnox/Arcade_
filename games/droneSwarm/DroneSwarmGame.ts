import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawPixelDrone } from "./droneSprite";
import { drawPurpleBossShip } from "../bossReactor/bossShips";

export type DroneRole = "scout" | "gunner" | "kamikaze";

interface BoidDrone {
  id: number;
  pos: Vector2;
  vel: Vector2;
  angle: number;
  maxSpeed: number;
  health: number;
  maxHealth: number;
  role: DroneRole;
  shootCooldown: number;
  scale: number;
}

interface BossSpaceship {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  health: number;
  maxHealth: number;
  shootCooldown: number;
  spawnDroneCooldown: number;
  angle: number;
  isEnraged: boolean;
}

interface Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isPlayer: boolean;
  color: string;
  size: number;
  damage: number;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  color: string;
  alpha: number;
}

export class DroneSwarmGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 520);
  private playerAngle: number = -Math.PI / 2;

  private drones: BoidDrone[] = [];
  private boss: BossSpaceship | null = null;
  private bullets: Bullet[] = [];
  private shockwaves: Shockwave[] = [];

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private mousePos: Vector2 = new Vector2(300, 200);

  private shootTimer: number = 0;
  private empCooldown: number = 0;
  private empMaxCooldown: number = 5.0;
  private score: number = 0;
  private wave: number = 1;
  private lives: number = 3;
  private shieldTimer: number = 1.5;
  private screenShake: number = 0;
  private warningTimer: number = 0;

  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachMouseAim();
  }

  private attachMouseAim(): void {
    const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
    if (!canvas) return;

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.mousePos.x = (e.clientX - rect.left) * scaleX;
      this.mousePos.y = (e.clientY - rect.top) * scaleY;
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (e.button === 2 || e.button === 0) {
        this.triggerEMP();
      }
    };

    canvas.addEventListener("pointermove", this.boundPointerMove);
    canvas.addEventListener("pointerdown", this.boundPointerDown);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 520);
    this.playerAngle = -Math.PI / 2;

    this.bullets = [];
    this.drones = [];
    this.boss = null;
    this.shockwaves = [];
    this.score = 0;
    this.wave = 1;
    this.lives = 3;
    this.shootTimer = 0;
    this.empCooldown = 0;
    this.shieldTimer = 1.5;
    this.screenShake = 0;
    this.warningTimer = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;

    this.startWave(this.wave);
  }

  private startWave(waveNum: number): void {
    const isBossWave = waveNum % 3 === 0;

    if (isBossWave) {
      // Spawn Flagship Boss Spaceship
      this.warningTimer = 2.5;
      this.ctx.audio?.playExplosion?.();
      globalParticles.emitText("⚠️ WARNING: FLAGSHIP INCOMING!", 300, 320, "#EF4444", 22);

      const bossHp = 40 + waveNum * 20;
      this.boss = {
        x: 300,
        y: -90,
        targetX: 300,
        targetY: 170,
        health: bossHp,
        maxHealth: bossHp,
        shootCooldown: 1.5,
        spawnDroneCooldown: 4.0,
        angle: Math.PI,
        isEnraged: false,
      };

      // Spawn 2-3 escort drones
      this.spawnDrones(3);
    } else {
      this.boss = null;
      // Standard endless drone wave
      this.spawnDrones(4 + waveNum);
    }
  }

  private spawnDrones(count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + (this.ctx.random.next() - 0.5) * 0.4;
      const dist = 310 + this.ctx.random.next() * 50;
      const role: DroneRole = i % 4 === 0 ? "gunner" : i % 3 === 0 ? "kamikaze" : "scout";

      const maxSpeed = role === "kamikaze" ? 160 + this.wave * 6 : role === "scout" ? 135 + this.wave * 5 : 115 + this.wave * 4;
      const health = role === "gunner" ? 2 : 1;

      this.drones.push({
        id: Math.random(),
        pos: new Vector2(300 + Math.cos(angle) * dist, 380 + Math.sin(angle) * dist),
        vel: new Vector2((this.ctx.random.next() - 0.5) * 60, (this.ctx.random.next() - 0.5) * 60),
        angle: angle + Math.PI,
        maxSpeed,
        health,
        maxHealth: health,
        role,
        shootCooldown: 2.0 + this.ctx.random.next() * 2,
        scale: role === "gunner" ? 1.1 : role === "kamikaze" ? 0.9 : 1.0,
      });
    }
  }

  public triggerEMP(): void {
    if (this.empCooldown > 0 || this.gameOver) return;
    this.empCooldown = this.empMaxCooldown;

    this.shockwaves.push({
      x: this.playerPos.x,
      y: this.playerPos.y,
      radius: 10,
      maxRadius: 280,
      color: "#00F0FF",
      alpha: 1.0,
    });

    this.ctx.audio?.playExplosion?.();
    globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 35, ["#00F0FF", "#38BDF8", "#FFFFFF"], 120, 360);
    globalParticles.emitText("EMP BLAST!", this.playerPos.x, this.playerPos.y - 30, "#00F0FF", 16);

    // Damage drones
    for (let i = this.drones.length - 1; i >= 0; i--) {
      const d = this.drones[i];
      const dist = Math.hypot(d.pos.x - this.playerPos.x, d.pos.y - this.playerPos.y);
      if (dist < 260) {
        d.health -= 3;
        const repulseAngle = Math.atan2(d.pos.y - this.playerPos.y, d.pos.x - this.playerPos.x);
        d.vel.x += Math.cos(repulseAngle) * 280;
        d.vel.y += Math.sin(repulseAngle) * 280;

        if (d.health <= 0) {
          this.score += 150;
          this.drones.splice(i, 1);
          globalParticles.emitBurst(d.pos.x, d.pos.y, 16, ["#D84654", "#FFB703", "#FFFFFF"], 60, 200);
        }
      }
    }

    // Damage boss if present
    if (this.boss) {
      const bossDist = Math.hypot(this.boss.x - this.playerPos.x, this.boss.y - this.playerPos.y);
      if (bossDist < 280) {
        this.boss.health -= 6;
        globalParticles.emitBurst(this.boss.x, this.boss.y, 20, ["#A855F7", "#F59E0B", "#FFFFFF"], 80, 240);
      }
    }
  }

  private fireAutomaticCannons(): void {
    const forwardX = Math.cos(this.playerAngle + Math.PI / 2);
    const forwardY = Math.sin(this.playerAngle + Math.PI / 2);
    const rightX = -forwardY;
    const rightY = forwardX;
    const bSpeed = 780;

    const leftMuzzleX = this.playerPos.x - rightX * 12 + forwardX * 14;
    const leftMuzzleY = this.playerPos.y - rightY * 12 + forwardY * 14;
    const rightMuzzleX = this.playerPos.x + rightX * 12 + forwardX * 14;
    const rightMuzzleY = this.playerPos.y + rightY * 12 + forwardY * 14;

    this.bullets.push({
      x: leftMuzzleX,
      y: leftMuzzleY,
      vx: forwardX * bSpeed,
      vy: forwardY * bSpeed,
      isPlayer: true,
      color: "#00F0FF",
      size: 5,
      damage: 1,
    });
    this.bullets.push({
      x: rightMuzzleX,
      y: rightMuzzleY,
      vx: forwardX * bSpeed,
      vy: forwardY * bSpeed,
      isPlayer: true,
      color: "#00F0FF",
      size: 5,
      damage: 1,
    });

    globalParticles.emitBurst(leftMuzzleX, leftMuzzleY, 2, ["#00F0FF", "#FFFFFF"], 20, 50);
    globalParticles.emitBurst(rightMuzzleX, rightMuzzleY, 2, ["#00F0FF", "#FFFFFF"], 20, 50);

    this.ctx.audio?.playLaser?.();
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    if (this.shieldTimer > 0) this.shieldTimer -= dt;
    if (this.empCooldown > 0) this.empCooldown -= dt;
    if (this.screenShake > 0) this.screenShake -= dt * 4;
    if (this.warningTimer > 0) this.warningTimer -= dt;

    // --- 1. Player Movement ---
    const pSpeed = 340;
    if (this.moveLeft) this.playerPos.x -= pSpeed * dt;
    if (this.moveRight) this.playerPos.x += pSpeed * dt;
    if (this.moveUp) this.playerPos.y -= pSpeed * dt;
    if (this.moveDown) this.playerPos.y += pSpeed * dt;

    this.playerPos.x = Math.max(35, Math.min(565, this.playerPos.x));
    this.playerPos.y = Math.max(75, Math.min(645, this.playerPos.y));

    // Player Aim: Tracks Boss (if alive) or nearest Drone
    let targetX = this.mousePos.x;
    let targetY = this.mousePos.y;

    if (this.boss) {
      targetX = this.boss.x;
      targetY = this.boss.y;
    } else {
      let closestDrone: BoidDrone | null = null;
      let closestDist = Infinity;
      for (const d of this.drones) {
        const dist = Math.hypot(d.pos.x - this.playerPos.x, d.pos.y - this.playerPos.y);
        if (dist < closestDist) {
          closestDist = dist;
          closestDrone = d;
        }
      }
      if (closestDrone) {
        targetX = closestDrone.pos.x;
        targetY = closestDrone.pos.y;
      }
    }

    const aimAngle = Math.atan2(targetY - this.playerPos.y, targetX - this.playerPos.x);
    this.playerAngle = aimAngle - Math.PI / 2;

    // Continuous Auto-Fire
    this.shootTimer += dt;
    if (this.shootTimer >= 0.12) {
      this.shootTimer = 0;
      this.fireAutomaticCannons();
    }

    // --- 2. Flagship Boss Dreadnought AI ---
    if (this.boss) {
      const b = this.boss;
      // Smooth descent and hover motion
      b.y += (b.targetY - b.y) * 2.0 * dt;
      b.x = 300 + Math.sin(this.animTime * 1.8) * 160;

      // Boss Spire Gun Salvos
      b.shootCooldown -= dt;
      if (b.shootCooldown <= 0) {
        b.shootCooldown = b.isEnraged ? 1.0 : 1.6;

        // Tri-Laser Plasma Volley
        for (const angleOffset of [-0.35, 0, 0.35]) {
          const shotAngle = Math.atan2(this.playerPos.y - b.y, this.playerPos.x - b.x) + angleOffset;
          this.bullets.push({
            x: b.x,
            y: b.y + 20,
            vx: Math.cos(shotAngle) * 340,
            vy: Math.sin(shotAngle) * 340,
            isPlayer: false,
            color: "#A855F7",
            size: 5,
            damage: 1,
          });
        }
        this.ctx.audio?.playLaser?.();
      }

      // Carrier Deploy: Spawn Escort Drones
      b.spawnDroneCooldown -= dt;
      if (b.spawnDroneCooldown <= 0 && this.drones.length < 5) {
        b.spawnDroneCooldown = 5.0;
        this.spawnDrones(2);
        globalParticles.emitText("DRONES DEPLOYED!", b.x, b.y + 40, "#A855F7", 13);
      }

      // Enrage state below 40% hp
      if (b.health < b.maxHealth * 0.4 && !b.isEnraged) {
        b.isEnraged = true;
        this.screenShake = 0.5;
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitText("BOSS OVERHEAT ENRAGE!", b.x, b.y - 40, "#EF4444", 16);
      }
    }

    // --- 3. Craig Reynolds Boids Flocking Simulation ---
    const count = this.drones.length;
    for (let i = 0; i < count; i++) {
      const drone = this.drones[i];
      let sepX = 0, sepY = 0;
      let aliX = 0, aliY = 0;
      let cohX = 0, cohY = 0;
      let neighbors = 0;

      for (let j = 0; j < count; j++) {
        if (i === j) continue;
        const other = this.drones[j];
        const dx = drone.pos.x - other.pos.x;
        const dy = drone.pos.y - other.pos.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 0 && dist < 70) {
          sepX += dx / dist;
          sepY += dy / dist;
          aliX += other.vel.x;
          aliY += other.vel.y;
          cohX += other.pos.x;
          cohY += other.pos.y;
          neighbors++;
        }
      }

      const toPlayerX = this.playerPos.x - drone.pos.x;
      const toPlayerY = this.playerPos.y - drone.pos.y;
      const pDist = Math.hypot(toPlayerX, toPlayerY);
      const normPX = pDist > 0 ? (toPlayerX / pDist) * 90 : 0;
      const normPY = pDist > 0 ? (toPlayerY / pDist) * 90 : 0;

      if (neighbors > 0) {
        aliX /= neighbors;
        aliY /= neighbors;
        cohX = (cohX / neighbors) - drone.pos.x;
        cohY = (cohY / neighbors) - drone.pos.y;

        drone.vel.x += (sepX * 140 + aliX * 0.35 + cohX * 0.35 + normPX) * dt;
        drone.vel.y += (sepY * 140 + aliY * 0.35 + cohY * 0.35 + normPY) * dt;
      } else {
        drone.vel.x += normPX * dt * 2.8;
        drone.vel.y += normPY * dt * 2.8;
      }

      const curSpeed = Math.hypot(drone.vel.x, drone.vel.y);
      if (curSpeed > drone.maxSpeed) {
        drone.vel.x = (drone.vel.x / curSpeed) * drone.maxSpeed;
        drone.vel.y = (drone.vel.y / curSpeed) * drone.maxSpeed;
      }

      drone.pos.x += drone.vel.x * dt;
      drone.pos.y += drone.vel.y * dt;
      drone.angle = Math.atan2(drone.vel.y, drone.vel.x) - Math.PI / 2;

      // Enemy Gunner Shooting
      if (drone.role === "gunner") {
        drone.shootCooldown -= dt;
        if (drone.shootCooldown <= 0 && pDist < 350) {
          drone.shootCooldown = 2.4;
          const shotAngle = Math.atan2(this.playerPos.y - drone.pos.y, this.playerPos.x - drone.pos.x);
          this.bullets.push({
            x: drone.pos.x,
            y: drone.pos.y,
            vx: Math.cos(shotAngle) * 300,
            vy: Math.sin(shotAngle) * 300,
            isPlayer: false,
            color: "#D84654",
            size: 4,
            damage: 1,
          });
          this.ctx.audio?.playHit?.();
        }
      }

      // Contact with Player
      if (pDist < 24 && this.shieldTimer <= 0) {
        this.drones.splice(i, 1);
        this.lives--;
        this.shieldTimer = 2.0;
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 28, ["#D84654", "#FFB703", "#FFFFFF"], 90, 300);

        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
          this.ctx.audio?.playGameOver?.();
        }
        break;
      }
    }

    // --- 4. Update Bullets ---
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;

      if (b.x < -20 || b.x > 620 || b.y < -20 || b.y > 720) {
        this.bullets.splice(i, 1);
        continue;
      }

      if (b.isPlayer) {
        // Player bullet hits Boss
        if (this.boss && Math.hypot(b.x - this.boss.x, b.y - this.boss.y) < 48) {
          this.bullets.splice(i, 1);
          this.boss.health -= b.damage;
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(b.x, b.y, 8, ["#A855F7", "#F59E0B", "#FFFFFF"], 50, 160);

          if (this.boss.health <= 0) {
            // Boss Defeated!
            this.score += 10000;
            this.screenShake = 0.8;
            this.ctx.audio?.playExplosion?.();
            globalParticles.emitBurst(this.boss.x, this.boss.y, 60, ["#A855F7", "#F59E0B", "#EF4444", "#FFFFFF"], 150, 450);
            globalParticles.emitText("💥 FLAGSHIP DESTROYED! +10,000", 300, 320, "#FFD84D", 20);
            this.boss = null;
            this.drones = []; // Clear current wave drones
          }
          continue;
        }

        // Player bullet hits Drone
        for (let j = this.drones.length - 1; j >= 0; j--) {
          const d = this.drones[j];
          if (Math.hypot(b.x - d.pos.x, b.y - d.pos.y) < 22 * d.scale) {
            this.bullets.splice(i, 1);
            d.health -= b.damage;
            this.ctx.audio?.playHit?.();
            globalParticles.emitBurst(b.x, b.y, 8, ["#00F0FF", "#FFFFFF", "#FDE047"], 50, 140);

            if (d.health <= 0) {
              this.score += d.role === "gunner" ? 250 : d.role === "kamikaze" ? 150 : 100;
              this.drones.splice(j, 1);
              globalParticles.emitBurst(d.pos.x, d.pos.y, 22, ["#D84654", "#FFB703", "#FFFFFF", "#5D8A90"], 80, 260);
            }
            break;
          }
        }
      } else {
        // Enemy bullet hits Player
        if (Math.hypot(b.x - this.playerPos.x, b.y - this.playerPos.y) < 20 && this.shieldTimer <= 0) {
          this.bullets.splice(i, 1);
          this.lives--;
          this.shieldTimer = 2.0;
          this.ctx.audio?.playExplosion?.();
          globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 24, ["#D84654", "#FFB703"], 80, 260);

          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
            this.ctx.audio?.playGameOver?.();
          }
        }
      }
    }

    // --- 5. Update Shockwaves ---
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      sw.radius += 500 * dt;
      sw.alpha = 1.0 - sw.radius / sw.maxRadius;
      if (sw.radius >= sw.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // --- 6. Seamless Endless Wave Progression ---
    if (this.drones.length === 0 && !this.boss) {
      this.wave++;
      this.score += 2500 * this.wave;
      this.shieldTimer = 1.5;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitText(`WAVE ${this.wave}!`, 300, 350, "#00F0FF", 22);
      this.startWave(this.wave);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if ((action === "ACTION_PRIMARY" || action === "ACTION_SECONDARY" || action === "CONFIRM") && isPressed) {
      this.triggerEMP();
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (this.boundPointerMove || this.boundPointerDown) {
      const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
      if (this.boundPointerMove) canvas?.removeEventListener("pointermove", this.boundPointerMove);
      if (this.boundPointerDown) canvas?.removeEventListener("pointerdown", this.boundPointerDown);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.wave; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    pr.save();
    if (this.screenShake > 0) {
      const sx = (Math.random() - 0.5) * this.screenShake * 12;
      const sy = (Math.random() - 0.5) * this.screenShake * 12;
      pr.translate(sx, sy);
    }

    // 1. Cyber Arena Grid & Radar Sweep
    pr.drawGrid(10, 12, 60, "rgba(0, 240, 255, 0.05)", 0, 0);

    const scanAngle = this.animTime * 1.5;
    const scanEndX = 300 + Math.cos(scanAngle) * 450;
    const scanEndY = 380 + Math.sin(scanAngle) * 450;
    pr.drawLine(300, 380, scanEndX, scanEndY, "rgba(0, 240, 255, 0.12)", 2);

    // Arena Border Boundary
    pr.drawRect(20, 60, w - 40, h - 80, "rgba(56, 189, 248, 0.2)", false);

    // 2. Shockwaves
    for (const sw of this.shockwaves) {
      pr.drawCircle(sw.x, sw.y, sw.radius, `rgba(0, 240, 255, ${sw.alpha})`, false);
    }

    // 3. Bullets
    for (const b of this.bullets) {
      if (b.isPlayer) {
        const velMag = Math.hypot(b.vx, b.vy);
        const dirX = velMag > 0 ? b.vx / velMag : 0;
        const dirY = velMag > 0 ? b.vy / velMag : 0;
        const tailX = b.x - dirX * 14;
        const tailY = b.y - dirY * 14;

        pr.drawLine(tailX, tailY, b.x, b.y, "rgba(0, 240, 255, 0.4)", 6);
        pr.drawLine(tailX + dirX * 3, tailY + dirY * 3, b.x, b.y, "#00F0FF", 3.5);
        pr.drawCircle(b.x, b.y, 3, "#FFFFFF", true);
      } else {
        pr.drawCircle(b.x, b.y, b.size, b.color, true);
        pr.drawCircle(b.x, b.y, b.size * 0.5, "#FFFFFF", true);
      }
    }

    // 4. Flagship Boss Spaceship
    if (this.boss) {
      const b = this.boss;
      const hpPct = Math.max(0, b.health / b.maxHealth);
      drawPurpleBossShip(pr, b.x, b.y, 96, hpPct, this.animTime);

      // Boss Health Bar (Top of screen)
      const bhW = 260;
      const bhX = w / 2 - bhW / 2;
      const bhY = 66;
      pr.drawRect(bhX - 2, bhY - 2, bhW + 4, 12, "rgba(10, 14, 39, 0.95)", true);
      pr.drawRect(bhX - 2, bhY - 2, bhW + 4, 12, "#A855F7", false);
      pr.drawRect(bhX, bhY, bhW * hpPct, 8, b.isEnraged ? "#EF4444" : "#F59E0B", true);
      pr.drawText("⚠️ DREADNOUGHT FLAGSHIP", w / 2, bhY + 20, { size: 9, color: "#C084FC", align: "center", font: "monospace" });
    }

    // 5. Enemy Drone Swarm (Rendered using user's uploaded Quad-Rotor Pixel Drone!)
    for (const d of this.drones) {
      drawPixelDrone(
        pr,
        d.pos.x,
        d.pos.y,
        d.angle,
        d.scale,
        this.animTime,
        false
      );

      if (d.maxHealth > 1) {
        const hbW = 22 * d.scale;
        const hbX = d.pos.x - hbW / 2;
        const hbY = d.pos.y - 18 * d.scale;
        pr.drawRect(hbX, hbY, hbW, 3, "#1E293B", true);
        pr.drawRect(hbX, hbY, (d.health / d.maxHealth) * hbW, 3, "#22C55E", true);
      }
    }

    // 6. Player Interceptor Drone
    if (this.shieldTimer > 0) {
      const shieldPulse = Math.sin(this.animTime * 14) * 3;
      pr.drawCircle(this.playerPos.x, this.playerPos.y, 26 + shieldPulse, "rgba(0, 240, 255, 0.35)", true);
      pr.drawCircle(this.playerPos.x, this.playerPos.y, 26 + shieldPulse, "#00F0FF", false);
    }

    drawPixelDrone(
      pr,
      this.playerPos.x,
      this.playerPos.y,
      this.playerAngle,
      1.25,
      this.animTime,
      true
    );

    // Crosshair Reticle
    if (this.mousePos.x > 0 && this.mousePos.y > 0) {
      pr.drawCircle(this.mousePos.x, this.mousePos.y, 7, "rgba(0, 240, 255, 0.5)", false);
      pr.drawLine(this.mousePos.x - 10, this.mousePos.y, this.mousePos.x + 10, this.mousePos.y, "#00F0FF", 1);
      pr.drawLine(this.mousePos.x, this.mousePos.y - 10, this.mousePos.x, this.mousePos.y + 10, "#00F0FF", 1);
    }

    // 7. Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 8. Warning Banner Flash
    if (this.warningTimer > 0) {
      const flash = Math.sin(this.animTime * 18) > 0;
      if (flash) {
        pr.drawRect(0, 110, w, 32, "rgba(220, 38, 38, 0.85)", true);
        pr.drawText("⚠️ WARNING: DREADNOUGHT CLASS CAPITAL SHIP DETECTED ⚠️", w / 2, 126, {
          size: 11,
          color: "#FFFFFF",
          align: "center",
          font: "monospace",
        });
      }
    }

    // 9. Military Cyber HUD
    pr.drawRect(12, 12, w - 24, 42, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 42, "#38BDF8", false);

    pr.drawText(`SCORE: ${this.score}`, 24, 28, { size: 13, color: "#FFD84D", font: "monospace" });
    pr.drawText(this.boss ? `WAVE ${this.wave} • BOSS FIGHT` : `WAVE ${this.wave} • SWARM: ${this.drones.length}`, w / 2, 28, { size: 12, color: this.boss ? "#C084FC" : "#00F0FF", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`, w - 24, 28, { size: 13, color: "#D84654", align: "right", font: "monospace" });

    // EMP Bomb Gauge (Bottom-Right)
    const empReady = this.empCooldown <= 0;
    pr.drawRect(w - 140, h - 34, 124, 22, "rgba(8, 14, 28, 0.9)", true);
    pr.drawRect(w - 140, h - 34, 124, 22, empReady ? "#00F0FF" : "#475569", false);
    pr.drawText(empReady ? "EMP READY [SPACE]" : `EMP: ${(this.empCooldown).toFixed(1)}s`, w - 78, h - 20, {
      size: 8,
      color: empReady ? "#00F0FF" : "#94A3B8",
      align: "center",
      font: "monospace",
    });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 220, 22, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[WASD: MOVE  •  SPACE: EMP  •  R: RESTART]", 126, h - 20, {
      size: 8,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 48, w, 96, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 48, w, 96, "#D84654", false);
      pr.drawText("SWARM OVERWHELMED DEFENSES — MISSION FAILED", w / 2, h / 2 - 12, { size: 18, color: "#D84654", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART SORTIE", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
