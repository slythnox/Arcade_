import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";

type EnemyType = "chaser" | "shooter" | "tank";
type WeaponMode = "railgun" | "spread" | "hyperbeam";

interface Enemy {
  pos: Vector2;
  vel: Vector2;
  speed: number;
  hp: number;
  maxHp: number;
  type: EnemyType;
  shootCooldown: number;
  animFrame: number;
}

interface Bullet {
  pos: Vector2;
  vel: Vector2;
  isEnemy: boolean;
  color: string;
  glow: string;
  isPierce?: boolean;
  damage: number;
}

interface PowerupItem {
  pos: Vector2;
  type: "spread" | "hyperbeam" | "shield";
  duration: number;
  color: string;
}

export class TwinStickArenaGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 350);
  private playerVel: Vector2 = new Vector2(0, 0);
  private aimAngle: number = 0;
  private bullets: Bullet[] = [];
  private enemies: Enemy[] = [];
  private powerups: PowerupItem[] = [];

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private isShooting: boolean = false;

  private spawnTimer: number = 0;
  private shootTimer: number = 0;
  private recoilOffset: number = 0;
  private muzzleFlashTimer: number = 0;
  private currentWeapon: WeaponMode = "railgun";
  private weaponDuration: number = 0;

  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private shield: number = 100;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerUp?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachMouseControls();
  }

  private attachMouseControls(): void {
    if (typeof window === "undefined") return;
    const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
    if (!canvas) return;

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      this.aimAngle = Math.atan2(my - this.playerPos.y, mx - this.playerPos.x);
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.isPaused || this.gameOver) return;
      this.isShooting = true;
    };

    this.boundPointerUp = () => {
      this.isShooting = false;
    };

    canvas.addEventListener("pointermove", this.boundPointerMove);
    canvas.addEventListener("pointerdown", this.boundPointerDown);
    window.addEventListener("pointerup", this.boundPointerUp);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 350);
    this.playerVel = new Vector2(0, 0);
    this.aimAngle = 0;
    this.bullets = [];
    this.enemies = [];
    this.powerups = [];
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.shield = 100;
    this.spawnTimer = 0;
    this.shootTimer = 0;
    this.recoilOffset = 0;
    this.muzzleFlashTimer = 0;
    this.currentWeapon = "railgun";
    this.weaponDuration = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
  }

  private spawnEnemy(): void {
    const angle = this.ctx.random.next() * Math.PI * 2;
    const dist = 360;
    const x = 300 + Math.cos(angle) * dist;
    const y = 350 + Math.sin(angle) * dist;

    const roll = this.ctx.random.next();
    let type: EnemyType = "chaser";
    let hp = 1;
    let speed = 145 + this.level * 10;

    if (roll > 0.65 && this.level >= 2) {
      type = "shooter";
      hp = 3;
      speed = 95 + this.level * 6;
    } else if (roll > 0.88 && this.level >= 3) {
      type = "tank";
      hp = 8;
      speed = 65 + this.level * 5;
    }

    this.enemies.push({
      pos: new Vector2(x, y),
      vel: new Vector2(0, 0),
      speed,
      hp,
      maxHp: hp,
      type,
      shootCooldown: 1.5 + this.ctx.random.next() * 1.5,
      animFrame: 0,
    });
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    if (this.muzzleFlashTimer > 0) this.muzzleFlashTimer -= dt;
    if (this.recoilOffset > 0) this.recoilOffset = Math.max(0, this.recoilOffset - dt * 30);

    if (this.weaponDuration > 0) {
      this.weaponDuration -= dt;
      if (this.weaponDuration <= 0) {
        this.currentWeapon = "railgun";
      }
    }

    // Smooth movement physics
    const accel = 1800;
    const friction = 0.86;
    let inputX = 0;
    let inputY = 0;
    if (this.moveLeft) inputX -= 1;
    if (this.moveRight) inputX += 1;
    if (this.moveUp) inputY -= 1;
    if (this.moveDown) inputY += 1;

    if (inputX !== 0 && inputY !== 0) {
      inputX *= 0.7071;
      inputY *= 0.7071;
    }

    this.playerVel.x += inputX * accel * dt;
    this.playerVel.y += inputY * accel * dt;
    this.playerVel.x *= friction;
    this.playerVel.y *= friction;

    this.playerPos.x += this.playerVel.x * dt;
    this.playerPos.y += this.playerVel.y * dt;

    // Arena boundary collision (circular radius 250)
    const arenaRadius = 250;
    const distFromCenter = Math.hypot(this.playerPos.x - 300, this.playerPos.y - 350);
    if (distFromCenter > arenaRadius) {
      const angle = Math.atan2(this.playerPos.y - 350, this.playerPos.x - 300);
      this.playerPos.x = 300 + Math.cos(angle) * arenaRadius;
      this.playerPos.y = 350 + Math.sin(angle) * arenaRadius;
    }

    // Auto-fire / Trigger Fire
    this.shootTimer -= dt;
    if (this.shootTimer <= 0 && (this.isShooting || this.enemies.length > 0)) {
      this.fireWeapon();
    }

    // Spawn enemies
    this.spawnTimer += dt;
    const spawnRate = Math.max(0.45, 1.4 - this.level * 0.12);
    if (this.spawnTimer >= spawnRate) {
      this.spawnTimer = 0;
      this.spawnEnemy();
    }

    // Update bullets
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      // Arena boundary collision
      const bDist = Math.hypot(b.pos.x - 300, b.pos.y - 350);
      if (bDist > arenaRadius + 20) {
        globalParticles.emitBurst(b.pos.x, b.pos.y, 4, [b.color, "#FFFFFF"], 30, 100);
        this.bullets.splice(i, 1);
        continue;
      }

      if (!b.isEnemy) {
        // Player bullet hits enemy
        for (let j = this.enemies.length - 1; j >= 0; j--) {
          const e = this.enemies[j];
          const hitDist = e.type === "tank" ? 24 : 16;
          if (Math.hypot(b.pos.x - e.pos.x, b.pos.y - e.pos.y) < hitDist) {
            e.hp -= b.damage;
            this.score += 25 * this.level;
            this.ctx.audio?.playHit?.();
            globalParticles.emitBurst(b.pos.x, b.pos.y, 10, ["#C084FC", "#E879F9", "#FFFFFF"], 60, 200);

            if (!b.isPierce) {
              this.bullets.splice(i, 1);
            }

            if (e.hp <= 0) {
              // Enemy Destroyed!
              const pts = (e.type === "tank" ? 500 : e.type === "shooter" ? 250 : 100) * this.level;
              this.score += pts;
              this.ctx.audio?.playExplosion?.();
              globalParticles.emitBurst(e.pos.x, e.pos.y, 22, ["#C084FC", "#EF4444", "#F59E0B", "#FFFFFF"], 90, 280);
              globalParticles.emitText(`+${pts}`, e.pos.x, e.pos.y - 10, "#C084FC", 14);

              // Chance to drop weapon powerup
              if (this.ctx.random.next() < 0.22) {
                const pTypes: ("spread" | "hyperbeam" | "shield")[] = ["spread", "hyperbeam", "shield"];
                const pType = pTypes[Math.floor(this.ctx.random.next() * pTypes.length)];
                this.powerups.push({
                  pos: new Vector2(e.pos.x, e.pos.y),
                  type: pType,
                  duration: 8.0,
                  color: pType === "spread" ? "#F59E0B" : pType === "hyperbeam" ? "#00F0FF" : "#38BDF8",
                });
              }

              this.enemies.splice(j, 1);
            }
            break;
          }
        }
      } else {
        // Enemy bullet hits player
        if (Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y) < 18) {
          this.bullets.splice(i, 1);
          this.shield -= 25;
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

    // Update powerups collection
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (Math.hypot(p.pos.x - this.playerPos.x, p.pos.y - this.playerPos.y) < 26) {
        if (p.type === "shield") {
          this.shield = 100;
        } else {
          this.currentWeapon = p.type;
          this.weaponDuration = 10;
        }
        this.ctx.audio?.playPowerUp?.();
        globalParticles.emitBurst(p.pos.x, p.pos.y, 16, [p.color, "#FFFFFF"], 60, 200);
        globalParticles.emitText(`${p.type.toUpperCase()} ACQUIRED!`, this.playerPos.x, this.playerPos.y - 25, p.color, 14);
        this.powerups.splice(i, 1);
      }
    }

    // Update enemies
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const e = this.enemies[i];
      e.animFrame += dt * 8;

      const dx = this.playerPos.x - e.pos.x;
      const dy = this.playerPos.y - e.pos.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 1) {
        e.pos.x += (dx / dist) * e.speed * dt;
        e.pos.y += (dy / dist) * e.speed * dt;
      }

      // Shooter behavior
      if (e.type === "shooter") {
        e.shootCooldown -= dt;
        if (e.shootCooldown <= 0) {
          e.shootCooldown = 2.0;
          const sAngle = Math.atan2(dy, dx);
          this.bullets.push({
            pos: new Vector2(e.pos.x, e.pos.y),
            vel: new Vector2(Math.cos(sAngle) * 280, Math.sin(sAngle) * 280),
            isEnemy: true,
            color: "#EF4444",
            glow: "#FCA5A5",
            damage: 20,
          });
          this.ctx.audio?.playLaser?.();
        }
      }

      // Contact collision with player
      if (dist < 22) {
        this.enemies.splice(i, 1);
        this.shield -= 35;
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(e.pos.x, e.pos.y, 16, ["#EF4444", "#F59E0B"], 70, 240);

        if (this.shield <= 0) {
          this.lives--;
          this.shield = 100;
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          }
        }
      }
    }

    // Level progression
    if (this.score >= this.level * 3000) {
      this.level++;
      this.shield = 100;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 350, 30, ["#C084FC", "#00F0FF", "#ffd84d"], 90, 300);
      globalParticles.emitText(`LEVEL ${this.level} COMMENCING`, 300, 300, "#C084FC", 18);
    }
  }

  private fireWeapon(): void {
    const spd = 720;
    this.recoilOffset = 6;
    this.muzzleFlashTimer = 0.08;
    this.ctx.audio?.playLaser?.();

    const barrelX = this.playerPos.x + Math.cos(this.aimAngle) * 28;
    const barrelY = this.playerPos.y + Math.sin(this.aimAngle) * 28;

    if (this.currentWeapon === "spread") {
      this.shootTimer = 0.18;
      const spreadAngles = [-0.15, 0, 0.15];
      for (const ang of spreadAngles) {
        const finalAng = this.aimAngle + ang;
        this.bullets.push({
          pos: new Vector2(barrelX, barrelY),
          vel: new Vector2(Math.cos(finalAng) * spd, Math.sin(finalAng) * spd),
          isEnemy: false,
          color: "#E879F9",
          glow: "#F5D0FE",
          damage: 2,
        });
      }
    } else if (this.currentWeapon === "hyperbeam") {
      this.shootTimer = 0.12;
      this.bullets.push({
        pos: new Vector2(barrelX, barrelY),
        vel: new Vector2(Math.cos(this.aimAngle) * 900, Math.sin(this.aimAngle) * 900),
        isEnemy: false,
        color: "#00F0FF",
        glow: "#FFFFFF",
        isPierce: true,
        damage: 4,
      });
    } else {
      // Standard Sci-Fi Plasma Railgun
      this.shootTimer = 0.16;
      this.bullets.push({
        pos: new Vector2(barrelX, barrelY),
        vel: new Vector2(Math.cos(this.aimAngle) * spd, Math.sin(this.aimAngle) * spd),
        isEnemy: false,
        color: "#C084FC",
        glow: "#E879F9",
        damage: 2,
      });
    }

    globalParticles.emitBurst(barrelX, barrelY, 6, ["#C084FC", "#E879F9", "#FFFFFF"], 40, 140);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;

    if (action === "ACTION_PRIMARY") {
      this.isShooting = isPressed;
    }
    if (action === "ACTION_SECONDARY" && isPressed) {
      // Manual aim sweep
      this.aimAngle += Math.PI / 4;
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (typeof window !== "undefined" && this.boundPointerMove && this.boundPointerDown && this.boundPointerUp) {
      const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
      canvas?.removeEventListener("pointermove", this.boundPointerMove);
      canvas?.removeEventListener("pointerdown", this.boundPointerDown);
      window.removeEventListener("pointerup", this.boundPointerUp);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cyber Hex Arena Floor & Perimeter Forcefield
    const arenaRadius = 250;
    pr.drawCircle(300, 350, arenaRadius + 8, "#1E293B", false);
    pr.drawCircle(300, 350, arenaRadius, "rgba(168, 85, 247, 0.25)", false);
    pr.drawCircle(300, 350, arenaRadius - 10, "rgba(168, 85, 247, 0.08)", false);

    // Glowing Arena Center Power Matrix
    pr.drawCircle(300, 350, 48, "rgba(192, 132, 252, 0.08)", true);
    pr.drawCircle(300, 350, 36, "#0F172A", true);
    pr.drawCircle(300, 350, 36, "#A855F7", false);

    // Cyber Arena Grid Lines
    pr.drawGrid(8, 9, 65, "rgba(168, 85, 247, 0.05)", 40, 90);

    // 2. Draw Weapon Powerup Crates
    for (const p of this.powerups) {
      pr.drawPixelBlock(p.pos.x - 12, p.pos.y - 12, 24, p.color, "#FFFFFF", "#0F172A");
      pr.drawCircle(p.pos.x, p.pos.y, 16, `rgba(192, 132, 252, 0.3)`, false);
      pr.drawText(p.type[0].toUpperCase(), p.pos.x, p.pos.y + 4, { size: 10, color: "#FFFFFF", align: "center", font: "monospace" });
    }

    // 3. Draw Overhauled Enemies
    for (const e of this.enemies) {
      if (e.type === "tank") {
        // Goliath Mech Tank (Quad-Track Heavy War Mech)
        pr.drawPixelBlock(e.pos.x - 18, e.pos.y - 18, 36, "#1E293B", "#475569", "#0F172A");
        pr.drawRect(e.pos.x - 14, e.pos.y - 14, 28, 28, "#DC2626", true);
        pr.drawCircle(e.pos.x, e.pos.y, 8, "#FACC15", true);
        // Dual Heavy Barrel Cannons
        pr.drawRect(e.pos.x - 6, e.pos.y - 24, 4, 10, "#94A3B8", true);
        pr.drawRect(e.pos.x + 2, e.pos.y - 24, 4, 10, "#94A3B8", true);
      } else if (e.type === "shooter") {
        // Plasma Turret Walker (Violet/Purple Bipedal Mech)
        pr.drawPixelBlock(e.pos.x - 13, e.pos.y - 13, 26, "#6B21A8", "#C084FC", "#3B0764");
        pr.drawCircle(e.pos.x, e.pos.y, 6, "#EF4444", true);
        pr.drawCircle(e.pos.x, e.pos.y, 2, "#FFFFFF", true);
      } else {
        // Arachnid Chaser Drone (Skittering Red Spider Drone)
        const legWiggle = Math.sin(e.animFrame) * 4;
        pr.drawPixelBlock(e.pos.x - 10, e.pos.y - 10, 20, "#DC2626", "#F87171", "#7F1D1D");
        pr.drawCircle(e.pos.x - 3, e.pos.y - 3, 2, "#FDE047", true); // Glowing optic eyes
        pr.drawCircle(e.pos.x + 3, e.pos.y - 3, 2, "#FDE047", true);
        // Skittering Legs
        pr.drawLine(e.pos.x - 10, e.pos.y - 6, e.pos.x - 16, e.pos.y - 10 + legWiggle, "#EF4444", 2);
        pr.drawLine(e.pos.x + 10, e.pos.y - 6, e.pos.x + 16, e.pos.y - 10 - legWiggle, "#EF4444", 2);
        pr.drawLine(e.pos.x - 10, e.pos.y + 6, e.pos.x - 16, e.pos.y + 10 - legWiggle, "#EF4444", 2);
        pr.drawLine(e.pos.x + 10, e.pos.y + 6, e.pos.x + 16, e.pos.y + 10 + legWiggle, "#EF4444", 2);
      }

      // Enemy Health Bar
      if (e.hp < e.maxHp) {
        const barW = 26;
        const hpPct = e.hp / e.maxHp;
        pr.drawRect(e.pos.x - barW / 2, e.pos.y - 24, barW, 4, "#0F172A", true);
        pr.drawRect(e.pos.x - barW / 2, e.pos.y - 24, barW * hpPct, 4, "#22C55E", true);
      }
    }

    // 4. Draw Bullets (High-Velocity Plasma Slugs & Beams)
    for (const b of this.bullets) {
      if (b.isPierce) {
        pr.drawCircle(b.pos.x, b.pos.y, 6, b.color, true);
        pr.drawCircle(b.pos.x, b.pos.y, 3, "#FFFFFF", true);
      } else {
        pr.drawCircle(b.pos.x, b.pos.y, b.isEnemy ? 4 : 3.5, b.color, true);
        pr.drawCircle(b.pos.x, b.pos.y, 1.5, b.glow, true);
      }
    }

    // 5. Draw Player Commando & Sci-Fi Railgun Rifle (Matching User Reference Image)
    const px = this.playerPos.x;
    const py = this.playerPos.y;

    // Player Armored Chassis Body
    pr.drawPixelBlock(px - 14, py - 14, 28, "#0284C7", "#38BDF8", "#0369A1");
    // Visor Helmet
    pr.drawCircle(px, py, 8, "#00F0FF", true);
    pr.drawCircle(px, py, 4, "#FFFFFF", true);

    // Aim Laser Sight Line
    const sightX = px + Math.cos(this.aimAngle) * 50;
    const sightY = py + Math.sin(this.aimAngle) * 50;
    pr.drawLine(px, py, sightX, sightY, "rgba(192, 132, 252, 0.4)", 1);
    pr.drawCircle(sightX, sightY, 3, "#C084FC", false);

    // --- DRAW THE SCI-FI PLASMA RAILGUN RIFLE ---
    pr.save();
    pr.translate(px, py);
    pr.rotate(this.aimAngle);

    const recoil = -this.recoilOffset;

    // 1. Heavy Titanium Chassis & Thumbhole Stock
    pr.drawRect(recoil - 6, -3, 16, 6, "#1E293B", true);
    pr.drawRect(recoil - 10, -1, 6, 8, "#0F172A", true);  // Thumbhole Stock
    pr.drawRect(recoil - 14, -3, 6, 8, "#334155", true);  // Buttpad

    // 2. Main Receiver & Illuminated Plasma Coils (Purple/Violet Slots)
    pr.drawRect(recoil + 8, -4, 18, 8, "#1E293B", true);
    pr.drawRect(recoil + 10, -2, 4, 3, "#C084FC", true);  // Violet Energy Slot 1
    pr.drawRect(recoil + 16, -2, 4, 3, "#C084FC", true);  // Violet Energy Slot 2
    pr.drawRect(recoil + 22, -2, 4, 3, "#E879F9", true);  // Violet Energy Slot 3

    // 3. Top Optical Scope with Purple Hologram Glint
    pr.drawRect(recoil + 6, -8, 14, 4, "#0F172A", true);
    pr.drawRect(recoil + 10, -7, 6, 2, "#C084FC", true);  // Scope Glint

    // 4. Extended Barrel & Heavy Muzzle Suppressor
    pr.drawRect(recoil + 26, -2, 12, 4, "#0F172A", true);  // Barrel
    pr.drawRect(recoil + 34, -4, 10, 8, "#1E293B", true);  // Heavy Muzzle Brake
    pr.drawRect(recoil + 36, -3, 2, 6, "#C084FC", true);  // Muzzle Port 1
    pr.drawRect(recoil + 40, -3, 2, 6, "#E879F9", true);  // Muzzle Port 2

    // 5. Purple Plasma Muzzle Flash Blast
    if (this.muzzleFlashTimer > 0) {
      pr.drawCircle(recoil + 48, 0, 12, "rgba(232, 121, 249, 0.6)", true);
      pr.drawCircle(recoil + 48, 0, 7, "#C084FC", true);
      pr.drawCircle(recoil + 48, 0, 3, "#FFFFFF", true);
    }

    pr.restore();

    // 6. Render Particle Bursts & Floating Popups
    globalParticles.render(pr);

    // 7. Top HUD (Score, Level, Lives, Shield, & Active Weapon)
    pr.drawRect(12, 12, w - 24, 34, "rgba(8, 14, 28, 0.85)", true);
    pr.drawRect(12, 12, w - 24, 34, "#1e293b", false);

    pr.drawText(`SCORE: ${this.score}`, 24, 28, { size: 12, color: "#ffd84d", font: "monospace" });
    pr.drawText(`LEVEL ${this.level}`, 24, 42, { size: 11, color: "#C084FC", font: "monospace" });

    // Center Active Weapon Badge
    const weaponText = `WEAPON: [ ${this.currentWeapon.toUpperCase()} ]`;
    const weaponCol = this.currentWeapon === "spread" ? "#F59E0B" : this.currentWeapon === "hyperbeam" ? "#00F0FF" : "#C084FC";
    pr.drawText(weaponText, w / 2, 34, { size: 12, color: weaponCol, align: "center", font: "monospace" });

    // Right: Lives & Shield Gauge
    pr.drawText(`LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`, w - 24, 28, { size: 12, color: "#f43f5e", align: "right", font: "monospace" });

    const shieldW = 90;
    const shieldPct = Math.max(0, this.shield / 100);
    pr.drawRect(w - 24 - shieldW, 36, shieldW, 6, "#0F172A", true);
    pr.drawRect(w - 24 - shieldW, 36, shieldW * shieldPct, 6, "#38BDF8", true);
    pr.drawRect(w - 24 - shieldW, 36, shieldW, 6, "#475569", false);

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("ARENA OVERRUN — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("CLICK OR PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
