import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawSpaceshipSprite } from "../../engine/rendering/spaceshipSprite";

type FormationMode = "delta" | "spear" | "diamond" | "pincer";

interface SquadronMember {
  offsetX: number;
  offsetY: number;
  targetOffsetX: number;
  targetOffsetY: number;
  hp: number;
}

interface Dreadnought {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  width: number;
  height: number;
  turrets: { offsetX: number; offsetY: number; angle: number; timer: number }[];
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  fromPlayer: boolean;
  damage: number;
  isMegaBeam?: boolean;
}

export class StarFormationGame implements GameInstance {
  private ctx!: GameContext;

  private score: number = 0;
  private level: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  private leaderX: number = 300;
  private leaderY: number = 580;
  private movingLeft: boolean = false;
  private movingRight: boolean = false;
  private movingUp: boolean = false;
  private movingDown: boolean = false;

  private formationMode: FormationMode = "delta";
  private squadron: SquadronMember[] = [
    { offsetX: 0, offsetY: 0, targetOffsetX: 0, targetOffsetY: 0, hp: 100 },      // Leader
    { offsetX: -45, offsetY: 25, targetOffsetX: -45, targetOffsetY: 25, hp: 100 }, // Wingman Left
    { offsetX: 45, offsetY: 25, targetOffsetX: 45, targetOffsetY: 25, hp: 100 },   // Wingman Right
    { offsetX: 0, offsetY: 50, targetOffsetX: 0, targetOffsetY: 50, hp: 100 },     // Rear Guard
  ];

  private dreadnought: Dreadnought | null = null;
  private projectiles: Projectile[] = [];
  private shootCooldown: number = 0;
  private shieldAngle: number = 0;
  private stars: { x: number; y: number; speed: number; size: number; color: string }[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initStars();
    this.reset();
  }

  private initStars(): void {
    this.stars = [];
    const cols = ["#FFFFFF", "#93C5FD", "#FDE047", "#C084FC", "#67E8F9"];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 700,
        speed: 40 + Math.random() * 120,
        size: Math.random() > 0.8 ? 2 : 1,
        color: cols[Math.floor(Math.random() * cols.length)],
      });
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.leaderX = 300;
    this.leaderY = 580;
    this.projectiles = [];
    this.setFormation("delta");
    this.spawnDreadnought();
  }

  private setFormation(mode: FormationMode): void {
    this.formationMode = mode;
    this.ctx.audio?.playRotate?.();

    if (mode === "delta") {
      // Wide Delta Wing (Wide Area Sweep)
      this.squadron[0].targetOffsetX = 0; this.squadron[0].targetOffsetY = 0;
      this.squadron[1].targetOffsetX = -50; this.squadron[1].targetOffsetY = 25;
      this.squadron[2].targetOffsetX = 50; this.squadron[2].targetOffsetY = 25;
      this.squadron[3].targetOffsetX = 0; this.squadron[3].targetOffsetY = 50;
    } else if (mode === "spear") {
      // Phalanx Spear (Heavy Concentrated Piercing Column)
      this.squadron[0].targetOffsetX = 0; this.squadron[0].targetOffsetY = -30;
      this.squadron[1].targetOffsetX = 0; this.squadron[1].targetOffsetY = 0;
      this.squadron[2].targetOffsetX = 0; this.squadron[2].targetOffsetY = 30;
      this.squadron[3].targetOffsetX = 0; this.squadron[3].targetOffsetY = 60;
    } else if (mode === "diamond") {
      // Diamond Defense (Reflective Energy Shield)
      this.squadron[0].targetOffsetX = 0; this.squadron[0].targetOffsetY = -30;
      this.squadron[1].targetOffsetX = -35; this.squadron[1].targetOffsetY = 0;
      this.squadron[2].targetOffsetX = 35; this.squadron[2].targetOffsetY = 0;
      this.squadron[3].targetOffsetX = 0; this.squadron[3].targetOffsetY = 30;
    } else if (mode === "pincer") {
      // Twin Pincer (Inward Angled Cross-Fire)
      this.squadron[0].targetOffsetX = -60; this.squadron[0].targetOffsetY = 0;
      this.squadron[1].targetOffsetX = -60; this.squadron[1].targetOffsetY = 40;
      this.squadron[2].targetOffsetX = 60; this.squadron[2].targetOffsetY = 0;
      this.squadron[3].targetOffsetX = 60; this.squadron[3].targetOffsetY = 40;
    }

    globalParticles.emitBurst(this.leaderX, this.leaderY, 12, ["#00F0FF", "#ffd84d"], 50, 180);
  }

  private cycleFormation(): void {
    const modes: FormationMode[] = ["delta", "spear", "diamond", "pincer"];
    const nextIdx = (modes.indexOf(this.formationMode) + 1) % modes.length;
    this.setFormation(modes[nextIdx]);
  }

  private spawnDreadnought(): void {
    const hp = 800 + this.level * 400;
    this.dreadnought = {
      x: 300,
      y: 120,
      hp,
      maxHp: hp,
      width: 240,
      height: 90,
      turrets: [
        { offsetX: -80, offsetY: 20, angle: Math.PI / 2, timer: 0.5 },
        { offsetX: -30, offsetY: 35, angle: Math.PI / 2, timer: 1.0 },
        { offsetX: 30, offsetY: 35, angle: Math.PI / 2, timer: 1.5 },
        { offsetX: 80, offsetY: 20, angle: Math.PI / 2, timer: 2.0 },
      ],
    };
  }

  public update(dt: number): void {
    globalParticles.update(dt);

    for (const s of this.stars) {
      s.y += s.speed * dt;
      if (s.y > 700) {
        s.y = 0;
        s.x = Math.random() * 600;
      }
    }

    if (this.gameOver || this.isPaused) return;

    this.shieldAngle += dt * 4;
    this.shootCooldown = Math.max(0, this.shootCooldown - dt);

    // Smooth movement
    const spd = 340;
    if (this.movingLeft) this.leaderX = Math.max(80, this.leaderX - spd * dt);
    if (this.movingRight) this.leaderX = Math.min(520, this.leaderX + spd * dt);
    if (this.movingUp) this.leaderY = Math.max(320, this.leaderY - spd * dt);
    if (this.movingDown) this.leaderY = Math.min(640, this.leaderY + spd * dt);

    // Smooth formation interpolation
    for (const member of this.squadron) {
      member.offsetX += (member.targetOffsetX - member.offsetX) * 12 * dt;
      member.offsetY += (member.targetOffsetY - member.offsetY) * 12 * dt;
    }

    // Dreadnought Boss AI
    if (this.dreadnought) {
      this.dreadnought.x = 300 + Math.sin(this.shieldAngle * 0.4) * 120;

      for (const t of this.dreadnought.turrets) {
        t.timer -= dt;
        if (t.timer <= 0) {
          t.timer = Math.max(0.6, 1.6 - this.level * 0.1);
          const tx = this.dreadnought.x + t.offsetX;
          const ty = this.dreadnought.y + t.offsetY;
          const aimAngle = Math.atan2(this.leaderY - ty, this.leaderX - tx);
          this.projectiles.push({
            x: tx,
            y: ty,
            vx: Math.cos(aimAngle) * 240,
            vy: Math.sin(aimAngle) * 240,
            fromPlayer: false,
            damage: 20,
          });
          this.ctx.audio?.playLaser?.();
        }
      }
    }

    // Update projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const p = this.projectiles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.y < 10 || p.y > 690 || p.x < 10 || p.x > 590) {
        this.projectiles.splice(i, 1);
        continue;
      }

      if (p.fromPlayer) {
        // Hit Boss
        if (
          this.dreadnought &&
          Math.abs(p.x - this.dreadnought.x) < this.dreadnought.width / 2 &&
          Math.abs(p.y - this.dreadnought.y) < this.dreadnought.height / 2
        ) {
          this.dreadnought.hp -= p.damage;
          this.score += 50 * this.level;
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(p.x, p.y, 6, ["#00F0FF", "#ffd84d", "#FFFFFF"], 40, 160);
          this.projectiles.splice(i, 1);

          if (this.dreadnought.hp <= 0) {
            // Boss destroyed!
            this.ctx.audio?.playExplosion?.();
            globalParticles.emitBurst(this.dreadnought.x, this.dreadnought.y, 40, ["#EF4444", "#F59E0B", "#ffd84d"], 120, 360);
            this.score += 5000 * this.level;
            this.level++;
            this.dreadnought = null;
            setTimeout(() => this.spawnDreadnought(), 1200);
          }
          continue;
        }
      } else {
        // Enemy projectile: Check Diamond Shield reflection
        if (this.formationMode === "diamond") {
          const distToLeader = Math.hypot(p.x - this.leaderX, p.y - this.leaderY);
          if (distToLeader < 48) {
            // Reflect!
            p.fromPlayer = true;
            p.vy = -Math.abs(p.vy) * 1.5;
            p.vx *= -1;
            p.damage = 40;
            this.ctx.audio?.playPowerUp?.();
            globalParticles.emitBurst(p.x, p.y, 10, ["#00F0FF", "#FFFFFF"], 50, 180);
            continue;
          }
        }

        // Check hit on squadron fighters
        for (const member of this.squadron) {
          const mx = this.leaderX + member.offsetX;
          const my = this.leaderY + member.offsetY;
          if (Math.hypot(p.x - mx, p.y - my) < 18) {
            this.projectiles.splice(i, 1);
            this.lives--;
            this.ctx.audio?.playGameOver?.();
            globalParticles.emitBurst(mx, my, 20, ["#EF4444", "#F59E0B", "#FFFFFF"], 80, 260);

            if (this.lives <= 0) {
              this.gameOver = true;
              this.ctx.session.setStatus("game-over");
            }
            break;
          }
        }
      }
    }
  }

  private fireTacticalBarrage(): void {
    if (this.shootCooldown > 0 || this.gameOver || this.isPaused) return;
    this.shootCooldown = 0.18;
    this.ctx.audio?.playLaser?.();

    if (this.formationMode === "delta") {
      // Wide sweeping barrage from all 4 fighters
      for (const m of this.squadron) {
        this.projectiles.push({
          x: this.leaderX + m.offsetX,
          y: this.leaderY + m.offsetY - 16,
          vx: 0,
          vy: -600,
          fromPlayer: true,
          damage: 25,
        });
      }
    } else if (this.formationMode === "spear") {
      // Concentrated Phalanx Mega-Beam
      this.projectiles.push({
        x: this.leaderX,
        y: this.leaderY - 40,
        vx: 0,
        vy: -750,
        fromPlayer: true,
        damage: 80,
        isMegaBeam: true,
      });
    } else if (this.formationMode === "pincer") {
      // Inward crossing laser salvo
      this.projectiles.push({ x: this.leaderX - 60, y: this.leaderY - 10, vx: 120, vy: -580, fromPlayer: true, damage: 30 });
      this.projectiles.push({ x: this.leaderX - 60, y: this.leaderY + 30, vx: 120, vy: -580, fromPlayer: true, damage: 30 });
      this.projectiles.push({ x: this.leaderX + 60, y: this.leaderY - 10, vx: -120, vy: -580, fromPlayer: true, damage: 30 });
      this.projectiles.push({ x: this.leaderX + 60, y: this.leaderY + 30, vx: -120, vy: -580, fromPlayer: true, damage: 30 });
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.movingLeft = isPressed;
    if (action === "MOVE_RIGHT") this.movingRight = isPressed;
    if (action === "MOVE_UP") this.movingUp = isPressed;
    if (action === "MOVE_DOWN") this.movingDown = isPressed;

    if (action === "ACTION_PRIMARY" && isPressed) {
      this.fireTacticalBarrage();
    }
    if (action === "ACTION_SECONDARY" && isPressed) {
      this.cycleFormation();
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
    pr.clear("#040612");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Cosmic Nebula Backdrop & Starfield
    pr.drawCircle(480, 260, 160, "rgba(99, 102, 241, 0.08)", true);
    pr.drawCircle(140, 480, 180, "rgba(236, 72, 153, 0.08)", true);

    for (const s of this.stars) {
      pr.drawRect(s.x, s.y, s.size, s.size, s.color, true);
    }

    // 2. Stage outer border
    pr.drawRect(8, 8, w - 16, h - 16, "#1e293b", false);

    // 3. Draw Alien Dreadnought Battlecruiser
    if (this.dreadnought) {
      const bx = this.dreadnought.x;
      const by = this.dreadnought.y;
      const bw = this.dreadnought.width;
      const bh = this.dreadnought.height;

      // Heavy Armor Hull
      pr.drawPixelRect(bx - bw / 2, by - bh / 2, bw, bh, "#1E293B", "#475569", "#0F172A");
      pr.drawPixelRect(bx - bw / 2 + 20, by - bh / 2 + 10, bw - 40, bh - 20, "#334155", "#94A3B8", "#020617");

      // Glowing Reactor Core
      pr.drawCircle(bx, by, 18, "#EF4444", true);
      pr.drawCircle(bx, by, 10, "#FCA5A5", true);

      // Turrets
      for (const t of this.dreadnought.turrets) {
        const tx = bx + t.offsetX;
        const ty = by + t.offsetY;
        pr.drawCircle(tx, ty, 8, "#DC2626", true);
        pr.drawCircle(tx, ty, 4, "#FDE047", true);
      }

      // Boss Health Bar
      const hpPct = Math.max(0, this.dreadnought.hp / this.dreadnought.maxHp);
      pr.drawRect(bx - 120, by - bh / 2 - 18, 240, 8, "#0F172A", true);
      pr.drawRect(bx - 120, by - bh / 2 - 18, 240 * hpPct, 8, "#EF4444", true);
      pr.drawRect(bx - 120, by - bh / 2 - 18, 240, 8, "#94A3B8", false);
      pr.drawText(`DREADNOUGHT CLASS ${this.level}`, bx, by - bh / 2 - 24, { size: 10, color: "#F87171", align: "center", font: "monospace" });
    }

    // 4. Draw Projectiles
    for (const p of this.projectiles) {
      if (p.fromPlayer) {
        if (p.isMegaBeam) {
          pr.drawRect(p.x - 4, p.y - 12, 8, 24, "#00F0FF", true);
          pr.drawRect(p.x - 2, p.y - 10, 4, 20, "#FFFFFF", true);
        } else {
          pr.drawRect(p.x - 2, p.y - 6, 4, 12, "#00F0FF", true);
        }
      } else {
        pr.drawCircle(p.x, p.y, 5, "#EF4444", true);
        pr.drawCircle(p.x, p.y, 2, "#FFFFFF", true);
      }
    }

    // 5. Draw Squadron Formation Energy Tether & Fighters
    if (this.formationMode === "diamond") {
      // Rotating Energy Barrier Shield
      pr.drawCircle(this.leaderX, this.leaderY, 48, "rgba(0, 240, 255, 0.25)", true);
      pr.drawCircle(this.leaderX, this.leaderY, 48, "#00F0FF", false);
    }

    // Draw all 4 reference starfighters in formation
    for (let idx = 0; idx < this.squadron.length; idx++) {
      const m = this.squadron[idx];
      const isLeader = idx === 0;
      drawSpaceshipSprite(
        pr,
        this.leaderX + m.offsetX,
        this.leaderY + m.offsetY,
        isLeader ? 36 : 28,
        0,
        isLeader ? "#00F0FF" : "#38BDF8"
      );
    }

    // Render Particles & Popups
    globalParticles.render(pr);

    // Top Tactical HUD
    pr.drawRect(12, 12, w - 24, 32, "rgba(8, 14, 28, 0.8)", true);
    pr.drawRect(12, 12, w - 24, 32, "#1e293b", false);
    pr.drawText(
      `FORMATION: [ ${this.formationMode.toUpperCase()} ]  •  SCORE: ${this.score}  •  LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`,
      w / 2,
      26,
      {
        size: 11,
        color: "#00F0FF",
        align: "center",
        font: "monospace",
      }
    );
    pr.drawText(
      `[SPACE / C: CHANGE FORMATION: DELTA (SPREAD) • SPEAR (BEAM) • DIAMOND (SHIELD) • PINCER (CROSS)]`,
      w / 2,
      40,
      {
        size: 8,
        color: "#94A3B8",
        align: "center",
        font: "monospace",
      }
    );

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("SQUADRON WIPED OUT — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
