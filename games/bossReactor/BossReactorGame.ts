import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";
import { drawPurpleBossShip } from "./bossShips";

interface Bullet {
  pos: Vector2;
  vel: Vector2;
  fromPlayer: boolean;
  color: string;
  glow?: string;
  damage: number;
}

interface MinionShip {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hp: number;
  shootCooldown: number;
  t: number;
}

interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  angle: number;
  rotSpeed: number;
  hp: number;
}

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: string;
}

export class BossReactorGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(300, 620);
  private bossPos: Vector2 = new Vector2(300, 160);
  private bossHealth: number = 250;
  private maxHealth: number = 250;
  private bossAngle: number = 0;
  private phase: number = 1;

  private bullets: Bullet[] = [];
  private minions: MinionShip[] = [];
  private asteroids: Asteroid[] = [];
  private stars: Star[] = [];

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private isShooting: boolean = false;

  private shootTimer: number = 0;
  private attackTimer: number = 0;
  private minionSpawnTimer: number = 0;
  private asteroidSpawnTimer: number = 0;

  private score: number = 0;
  private lives: number = 3;
  private shield: number = 100;
  private isWon: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;
  private laserSweepAngle: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initStars();
    this.reset();
  }

  private initStars(): void {
    this.stars = [];
    const colors = ["#FFFFFF", "#93C5FD", "#FDE047", "#C084FC", "#67E8F9"];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        speed: 30 + Math.random() * 80,
        size: Math.random() > 0.8 ? 2 : 1,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 620);
    this.bossPos = new Vector2(300, 160);
    this.bossHealth = 250;
    this.maxHealth = 250;
    this.bossAngle = 0;
    this.phase = 1;
    this.bullets = [];
    this.minions = [];
    this.asteroids = [];
    this.shootTimer = 0;
    this.attackTimer = 0;
    this.minionSpawnTimer = 0;
    this.asteroidSpawnTimer = 0;
    this.score = 0;
    this.lives = 3;
    this.shield = 100;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;

    // Initial asteroid cluster
    this.spawnAsteroid(120, 280);
    this.spawnAsteroid(480, 280);
  }

  private spawnAsteroid(x?: number, y?: number): void {
    const ax = x ?? Math.random() * 560 + 20;
    const ay = y ?? -30;
    this.asteroids.push({
      x: ax,
      y: ay,
      vx: (Math.random() - 0.5) * 40,
      vy: 20 + Math.random() * 40,
      radius: 16 + Math.random() * 12,
      angle: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 2,
      hp: 4,
    });
  }

  private spawnMinionWave(): void {
    const count = this.phase === 1 ? 2 : this.phase === 2 ? 3 : 4;
    for (let i = 0; i < count; i++) {
      const offsetX = (i - (count - 1) / 2) * 80;
      this.minions.push({
        x: this.bossPos.x + offsetX,
        y: this.bossPos.y + 50,
        vx: (Math.random() - 0.5) * 120,
        vy: 100 + Math.random() * 60,
        hp: 3,
        shootCooldown: 1.0 + Math.random(),
        t: 0,
      });
    }
    this.ctx.audio?.playPowerUp?.();
  }

  public update(dt: number): void {
    globalParticles.update(dt);

    for (const star of this.stars) {
      star.y += star.speed * dt;
      if (star.y > 700) {
        star.y = 0;
        star.x = Math.random() * 600;
      }
    }

    if (this.isWon || this.gameOver || this.isPaused) return;
    this.animTime += dt;

    // Player movement
    const spd = 400;
    if (this.moveLeft) this.playerPos.x -= spd * dt;
    if (this.moveRight) this.playerPos.x += spd * dt;
    if (this.moveUp) this.playerPos.y -= spd * dt;
    if (this.moveDown) this.playerPos.y += spd * dt;

    this.playerPos.x = Math.max(30, Math.min(570, this.playerPos.x));
    this.playerPos.y = Math.max(280, Math.min(650, this.playerPos.y));

    // Boss motion with graceful hover swoop
    this.bossPos.x = 300 + Math.sin(this.bossAngle) * 170;
    this.bossPos.y = 150 + Math.cos(this.bossAngle * 0.8) * 35;
    this.bossAngle += (1.4 + (this.phase - 1) * 0.4) * dt;
    this.laserSweepAngle += dt * 3.5;

    // Auto-fire player lasers
    this.shootTimer += dt;
    if (this.shootTimer >= 0.14) {
      this.shootTimer = 0;
      this.bullets.push({
        pos: new Vector2(this.playerPos.x - 12, this.playerPos.y - 18),
        vel: new Vector2(0, -720),
        fromPlayer: true,
        color: "#00F0FF",
        glow: "#FFFFFF",
        damage: 2,
      });
      this.bullets.push({
        pos: new Vector2(this.playerPos.x + 12, this.playerPos.y - 18),
        vel: new Vector2(0, -720),
        fromPlayer: true,
        color: "#00F0FF",
        glow: "#FFFFFF",
        damage: 2,
      });
      this.ctx.audio?.playLaser?.();
    }

    // Boss Attacks (Amber / Magenta Plasma Spreads & Homing Missiles)
    this.attackTimer += dt;
    const interval = this.phase === 1 ? 0.65 : this.phase === 2 ? 0.42 : 0.26;
    if (this.attackTimer >= interval) {
      this.attackTimer = 0;
      const count = this.phase === 1 ? 3 : this.phase === 2 ? 5 : 7;
      for (let i = 0; i < count; i++) {
        const spread = (i - (count - 1) / 2) * (this.phase === 3 ? 0.32 : 0.22);
        this.bullets.push({
          pos: new Vector2(this.bossPos.x, this.bossPos.y + 40),
          vel: new Vector2(Math.sin(spread) * 320, Math.cos(spread) * 320),
          fromPlayer: false,
          color: this.phase === 3 ? "#EC4899" : "#F59E0B",
          glow: "#FEF08A",
          damage: 18,
        });
      }
      this.ctx.audio?.playLaser?.();
    }

    // Minion Spawn Waves (Blue Escort Armada)
    this.minionSpawnTimer += dt;
    const minionInterval = Math.max(3.0, 7.0 - this.phase * 1.5);
    if (this.minionSpawnTimer >= minionInterval && this.minions.length < 6) {
      this.minionSpawnTimer = 0;
      this.spawnMinionWave();
    }

    // Asteroid Spawning
    this.asteroidSpawnTimer += dt;
    if (this.asteroidSpawnTimer >= 4.0 && this.asteroids.length < 5) {
      this.asteroidSpawnTimer = 0;
      this.spawnAsteroid();
    }

    // Update Minion Army Ships
    for (let i = this.minions.length - 1; i >= 0; i--) {
      const m = this.minions[i];
      m.t += dt;
      m.x += m.vx * dt + Math.sin(m.t * 3) * 60 * dt;
      m.y += m.vy * dt;

      if (m.x < 30 || m.x > 570) m.vx *= -1;

      // Minion shooter
      m.shootCooldown -= dt;
      if (m.shootCooldown <= 0) {
        m.shootCooldown = 1.6;
        const aimAngle = Math.atan2(this.playerPos.y - m.y, this.playerPos.x - m.x);
        this.bullets.push({
          pos: new Vector2(m.x, m.y + 10),
          vel: new Vector2(Math.cos(aimAngle) * 280, Math.sin(aimAngle) * 280),
          fromPlayer: false,
          color: "#38BDF8",
          glow: "#FFFFFF",
          damage: 12,
        });
      }

      if (m.y > 690) {
        m.y = -20;
        m.x = this.bossPos.x + (Math.random() - 0.5) * 120;
      }
    }

    // Update Asteroids
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      const ast = this.asteroids[i];
      ast.x += ast.vx * dt;
      ast.y += ast.vy * dt;
      ast.angle += ast.rotSpeed * dt;

      if (ast.y > 720) {
        this.asteroids.splice(i, 1);
      }
    }

    // Update Bullets & Collisions
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.pos.x += b.vel.x * dt;
      b.pos.y += b.vel.y * dt;

      if (b.pos.y < 10 || b.pos.y > 690 || b.pos.x < 10 || b.pos.x > 590) {
        this.bullets.splice(i, 1);
        continue;
      }

      // Check Bullet hit on Asteroids
      let hitAsteroid = false;
      for (let k = this.asteroids.length - 1; k >= 0; k--) {
        const ast = this.asteroids[k];
        if (Math.hypot(b.pos.x - ast.x, b.pos.y - ast.y) < ast.radius) {
          ast.hp -= b.damage;
          this.bullets.splice(i, 1);
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(b.pos.x, b.pos.y, 6, ["#94A3B8", "#64748B"], 30, 100);
          hitAsteroid = true;

          if (ast.hp <= 0) {
            this.score += 150;
            this.ctx.audio?.playExplosion?.();
            globalParticles.emitBurst(ast.x, ast.y, 16, ["#94A3B8", "#F59E0B"], 60, 200);
            this.asteroids.splice(k, 1);
          }
          break;
        }
      }
      if (hitAsteroid) continue;

      if (b.fromPlayer) {
        // Hit on Minions
        let hitMinion = false;
        for (let j = this.minions.length - 1; j >= 0; j--) {
          const m = this.minions[j];
          if (Math.hypot(b.pos.x - m.x, b.pos.y - m.y) < 22) {
            m.hp -= b.damage;
            this.bullets.splice(i, 1);
            this.ctx.audio?.playHit?.();
            globalParticles.emitBurst(b.pos.x, b.pos.y, 8, ["#38BDF8", "#FFFFFF"], 40, 140);
            hitMinion = true;

            if (m.hp <= 0) {
              this.score += 400 * this.phase;
              this.ctx.audio?.playExplosion?.();
              globalParticles.emitBurst(m.x, m.y, 18, ["#38BDF8", "#EF4444", "#ffd84d"], 70, 240);
              globalParticles.emitText("+400", m.x, m.y - 10, "#38BDF8", 12);
              this.minions.splice(j, 1);
            }
            break;
          }
        }
        if (hitMinion) continue;

        // Hit on Purple Boss Ship
        if (Math.hypot(b.pos.x - this.bossPos.x, b.pos.y - this.bossPos.y) < 48) {
          this.bossHealth -= b.damage;
          this.score += 40 * this.phase;
          this.bullets.splice(i, 1);
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(b.pos.x, b.pos.y, 8, ["#C084FC", "#F59E0B", "#FFFFFF"], 50, 180);

          // Phase Transitions
          if (this.bossHealth <= this.maxHealth * 0.33 && this.phase < 3) {
            this.phase = 3;
            this.ctx.audio?.playPowerUp?.();
            globalParticles.emitBurst(this.bossPos.x, this.bossPos.y, 30, ["#EF4444", "#EC4899", "#FFFFFF"], 100, 300);
            globalParticles.emitText("PHASE 3: HYPERNOVA OVERDRIVE!", 300, 260, "#EF4444", 16);
          } else if (this.bossHealth <= this.maxHealth * 0.66 && this.phase < 2) {
            this.phase = 2;
            this.ctx.audio?.playPowerUp?.();
            globalParticles.emitBurst(this.bossPos.x, this.bossPos.y, 25, ["#F59E0B", "#C084FC"], 80, 250);
            globalParticles.emitText("PHASE 2: DREADNOUGHT ASSAULT!", 300, 260, "#F59E0B", 16);
          }

          // Boss Defeated!
          if (this.bossHealth <= 0) {
            this.isWon = true;
            this.score += 20000;
            this.ctx.audio?.playVictory?.();
            globalParticles.emitBurst(this.bossPos.x, this.bossPos.y, 50, ["#C084FC", "#EF4444", "#F59E0B", "#FFFFFF"], 120, 400);
          }
        }
      } else {
        // Enemy bullet hits player
        if (Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y) < 18) {
          this.bullets.splice(i, 1);
          this.shield -= b.damage;
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

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.phase; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040612");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cosmic Nebula Backdrop & Starfield
    pr.drawCircle(480, 220, 160, "rgba(168, 85, 247, 0.08)", true);
    pr.drawCircle(140, 480, 180, "rgba(56, 189, 248, 0.08)", true);

    for (const s of this.stars) {
      pr.drawRect(s.x, s.y, s.size, s.size, s.color, true);
    }

    // Outer Stage Border
    pr.drawRect(8, 8, w - 16, h - 16, "#1e293b", false);

    // 2. Draw Drifting Asteroids with Craters
    for (const ast of this.asteroids) {
      pr.save();
      pr.translate(ast.x, ast.y);
      pr.rotate(ast.angle);
      pr.drawCircle(0, 0, ast.radius, "#475569", true);
      pr.drawCircle(0, 0, ast.radius, "#1E293B", false);
      // Impact Craters
      pr.drawCircle(-ast.radius * 0.3, -ast.radius * 0.2, ast.radius * 0.25, "#334155", true);
      pr.drawCircle(ast.radius * 0.3, ast.radius * 0.3, ast.radius * 0.2, "#334155", true);
      pr.restore();
    }

    // 3. Draw Blue Minion Escort Armada (Using reference spaceship sprite)
    for (const m of this.minions) {
      drawSpaceshipSprite(pr, m.x, m.y, 26, Math.PI, "#38BDF8");
    }

    // 4. Draw Purple Boss Villain Ship (from reference image)
    const hpPct = Math.max(0, this.bossHealth / this.maxHealth);
    drawPurpleBossShip(pr, this.bossPos.x, this.bossPos.y, 92, hpPct, this.animTime);

    // Phase 3 Sweeping Laser Death Rays
    if (this.phase === 3) {
      const lx = this.bossPos.x + Math.sin(this.laserSweepAngle) * 220;
      pr.drawLine(this.bossPos.x, this.bossPos.y + 35, lx, h - 30, "rgba(236, 72, 153, 0.4)", 4);
      pr.drawLine(this.bossPos.x, this.bossPos.y + 35, lx, h - 30, "#EC4899", 2);
    }

    // 5. Draw Bullets
    for (const b of this.bullets) {
      if (b.fromPlayer) {
        pr.drawRect(b.pos.x - 2, b.pos.y - 6, 4, 12, "#00F0FF", true);
        pr.drawRect(b.pos.x - 1, b.pos.y - 4, 2, 8, "#FFFFFF", true);
      } else {
        pr.drawCircle(b.pos.x, b.pos.y, 5, b.color, true);
        pr.drawCircle(b.pos.x, b.pos.y, 2, b.glow || "#FFFFFF", true);
      }
    }

    // 6. Draw Player Spaceship (Shared Reference Starfighter)
    drawSpaceshipSprite(pr, this.playerPos.x, this.playerPos.y, 42, 0, "#00F0FF");

    // Player Forcefield Shield Ring
    pr.drawCircle(this.playerPos.x, this.playerPos.y, 26, "rgba(0, 240, 255, 0.15)", false);

    // 7. Render Particle Bursts & Floating Popups
    globalParticles.render(pr);

    // 8. Top Tactical HUD & Boss Health Gauge
    pr.drawRect(0, 0, w, 54, "#080e1c", true);
    pr.drawLine(0, 54, w, 54, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 24, { size: 12, color: "#ffd84d", font: "monospace" });
    pr.drawText(`VOID VANGUARD • PHASE ${this.phase}/3`, w / 2, 24, { size: 12, color: "#C084FC", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, w - 20, 24, { size: 12, color: "#f43f5e", align: "right", font: "monospace" });

    // Boss Health Bar
    const barW = 260;
    pr.drawRect(w / 2 - barW / 2, 34, barW, 10, "#0F172A", true);
    pr.drawRect(w / 2 - barW / 2, 34, barW * hpPct, 10, this.phase === 3 ? "#EC4899" : this.phase === 2 ? "#F59E0B" : "#A855F7", true);
    pr.drawRect(w / 2 - barW / 2, 34, barW, 10, "#475569", false);

    // Overlay Screens
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("VANGUARD DESTROYED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RE-ENGAGE DREADNOUGHT", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22c55e", false);
      pr.drawText("PURPLE DREADNOUGHT ANNIHILATED!", w / 2, h / 2 - 10, { size: 20, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
