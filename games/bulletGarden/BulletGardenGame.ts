import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawPixelDrone } from "../droneSwarm/droneSprite";

// Seed Bullets emitted by the Ancient Spore Core
interface SporeSeed {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  glowColor: string;
  size: number;
  type: "sakura" | "lotus" | "sunflower" | "orchid";
}

// Blooming Flowers planted when player loops around seeds!
interface BloomFlower {
  id: number;
  x: number;
  y: number;
  type: "sakura" | "lotus" | "sunflower" | "orchid";
  color: string;
  size: number;
  maxSize: number;
  life: number;
  petalCount: number;
  angle: number;
  fireTimer: number;
}

// Nectar Orbs dropped by bloomed flowers
interface NectarOrb {
  x: number;
  y: number;
  color: string;
  value: number;
}

// Bio-Spore Core (The Living Garden Boss)
interface SporeCore {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  pulseTimer: number;
  patternAngle: number;
  state: "dormant" | "blooming" | "overgrowth";
}

export class BulletGardenGame implements GameInstance {
  private ctx!: GameContext;

  // Player Weaver Drone
  private playerPos: Vector2 = new Vector2(300, 560);
  private playerHitboxRadius: number = 2.8;
  private silkTrail: { x: number; y: number }[] = [];
  private readonly maxSilkLength: number = 85;

  // Active Garden Elements
  private seeds: SporeSeed[] = [];
  private blooms: BloomFlower[] = [];
  private nectars: NectarOrb[] = [];
  private sporeCore!: SporeCore;

  // Shield & Bloom Power
  private shield: number = 100;
  private maxShield: number = 100;
  private shieldRechargeDelay: number = 0;
  private invulnTimer: number = 1.5;
  private bloomCombo: number = 0;
  private totalBloomed: number = 0;

  // Inputs
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private isSilkDashing: boolean = false;

  // Game Progress
  private score: number = 0;
  private gardenTier: number = 1;
  private lives: number = 3;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  private time: number = 0;
  private hitFlash: number = 0;
  private screenShake: number = 0;
  private bannerText: string = "";
  private bannerTimer: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(300, 560);
    this.silkTrail = [];
    this.seeds = [];
    this.blooms = [];
    this.nectars = [];

    const coreHp = 120 + (this.gardenTier - 1) * 80;
    this.sporeCore = {
      x: 300,
      y: 130,
      health: coreHp,
      maxHealth: coreHp,
      pulseTimer: 0,
      patternAngle: 0,
      state: "blooming",
    };

    this.shield = 100;
    this.shieldRechargeDelay = 0;
    this.invulnTimer = 1.5;
    this.bloomCombo = 0;
    this.totalBloomed = 0;

    this.score = 0;
    this.lives = 3;
    this.gameOver = false;
    this.isPaused = false;
    this.time = 0;
    this.hitFlash = 0;
    this.screenShake = 0;
    this.bannerText = "🌿 WEAVE SILK TRAILS TO BLOOM THE GARDEN! 🌸";
    this.bannerTimer = 3.0;
  }

  // --- Spore Core Emits Botanical Spiral Seeds (Sunflower & Rose Curves) ---
  private emitBotanicalSeeds(): void {
    const core = this.sporeCore;
    const petTypes: ("sakura" | "lotus" | "sunflower" | "orchid")[] = ["sakura", "lotus", "sunflower", "orchid"];
    const colors = ["#F472B6", "#38BDF8", "#FBBF24", "#C084FC"];

    const arms = 6 + (this.gardenTier % 4);
    const speed = 125 + this.gardenTier * 8;
    const typeIdx = Math.floor(this.time * 0.5) % petTypes.length;

    for (let i = 0; i < arms; i++) {
      // Golden Angle Spiral Pattern (137.5 degrees)
      const angle = core.patternAngle + (i * 2 * Math.PI) / arms;
      this.seeds.push({
        id: Math.random(),
        x: core.x,
        y: core.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: colors[typeIdx],
        glowColor: "#FFFFFF",
        size: 4.5,
        type: petTypes[typeIdx],
      });
    }
  }

  // --- Check if Player Closed a Silk Trail Loop (Polygon Containment) ---
  private checkSilkLoopEnclosure(): void {
    if (this.silkTrail.length < 15) return;

    // Check if head is close to any earlier point in the tail
    const head = this.silkTrail[this.silkTrail.length - 1];
    let loopStartIndex = -1;

    for (let i = 0; i < this.silkTrail.length - 12; i++) {
      const p = this.silkTrail[i];
      if (Math.hypot(head.x - p.x, head.y - p.y) < 22) {
        loopStartIndex = i;
        break;
      }
    }

    if (loopStartIndex === -1) return;

    // A valid closed loop polygon has been woven!
    const loopPolygon = this.silkTrail.slice(loopStartIndex);

    // Harvest & Bloom all enclosed seeds inside the polygon!
    let bloomedInThisLoop = 0;
    let loopCenterX = 0;
    let loopCenterY = 0;

    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i];
      if (this.isPointInPolygon(s.x, s.y, loopPolygon)) {
        bloomedInThisLoop++;
        loopCenterX += s.x;
        loopCenterY += s.y;

        // Plant Blooming Flower on the arena floor!
        this.blooms.push({
          id: Math.random(),
          x: s.x,
          y: s.y,
          type: s.type,
          color: s.color,
          size: 4,
          maxSize: 18 + Math.random() * 8,
          life: 8.0,
          petalCount: s.type === "lotus" ? 8 : s.type === "sunflower" ? 12 : 5,
          angle: Math.random() * Math.PI * 2,
          fireTimer: 0.5,
        });

        // Drop Nectar
        this.nectars.push({
          x: s.x,
          y: s.y,
          color: s.color,
          value: 100 * (1 + this.bloomCombo),
        });

        this.seeds.splice(i, 1);
      }
    }

    if (bloomedInThisLoop > 0) {
      loopCenterX /= bloomedInThisLoop;
      loopCenterY /= bloomedInThisLoop;

      this.bloomCombo++;
      this.totalBloomed += bloomedInThisLoop;
      this.score += bloomedInThisLoop * 250 * this.bloomCombo;
      this.screenShake = 0.35;

      this.ctx.audio?.playPowerUp?.();

      globalParticles.emitBurst(loopCenterX, loopCenterY, 30, ["#F472B6", "#38BDF8", "#FBBF24", "#FFFFFF"], 90, 260);
      globalParticles.emitText(
        this.bloomCombo > 2 ? `🌸 HARMONIC SYMPHONY x${this.bloomCombo}! (+${bloomedInThisLoop * 250 * this.bloomCombo})` : `🌸 BLOOM HARVEST! +${bloomedInThisLoop}`,
        loopCenterX,
        loopCenterY - 20,
        "#F472B6",
        15
      );

      // Shorten trail after successful bloom harvest
      this.silkTrail = this.silkTrail.slice(this.silkTrail.length - 6);
    }
  }

  private isPointInPolygon(px: number, py: number, poly: { x: number; y: number }[]): boolean {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y;
      const xj = poly[j].x, yj = poly[j].y;
      const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.time += dt;
    if (this.hitFlash > 0) this.hitFlash -= dt;
    if (this.bannerTimer > 0) this.bannerTimer -= dt;
    if (this.screenShake > 0) this.screenShake -= dt * 3;
    if (this.invulnTimer > 0) this.invulnTimer -= dt;

    // Shield Auto-Recharge
    if (this.shieldRechargeDelay > 0) {
      this.shieldRechargeDelay -= dt;
    } else if (this.shield < this.maxShield) {
      this.shield = Math.min(this.maxShield, this.shield + 15 * dt);
    }

    // --- 1. Player Weaver Drone Movement ---
    const speed = this.isSilkDashing ? 380 : 250;
    if (this.moveLeft) this.playerPos.x -= speed * dt;
    if (this.moveRight) this.playerPos.x += speed * dt;
    if (this.moveUp) this.playerPos.y -= speed * dt;
    if (this.moveDown) this.playerPos.y += speed * dt;

    this.playerPos.x = Math.max(25, Math.min(575, this.playerPos.x));
    this.playerPos.y = Math.max(65, Math.min(650, this.playerPos.y));

    // Append to Luminous Silk Trail
    const lastPoint = this.silkTrail[this.silkTrail.length - 1];
    if (!lastPoint || Math.hypot(this.playerPos.x - lastPoint.x, this.playerPos.y - lastPoint.y) > 6) {
      this.silkTrail.push({ x: this.playerPos.x, y: this.playerPos.y });
      if (this.silkTrail.length > this.maxSilkLength) {
        this.silkTrail.shift();
      }
    }

    // Check Closed Loop Enclosures
    this.checkSilkLoopEnclosure();

    // --- 2. Spore Core Movement & Seed Emission ---
    const core = this.sporeCore;
    core.x = 300 + Math.sin(this.time * 1.1) * 140;
    core.y = 130 + Math.cos(this.time * 0.8) * 25;
    core.patternAngle += 1.6 * dt;

    core.pulseTimer += dt;
    if (core.pulseTimer >= 0.13) {
      core.pulseTimer = 0;
      this.emitBotanicalSeeds();
    }

    // --- 3. Update Bloomed Flowers (Floral Resonance Beams vs Spore Core) ---
    for (let i = this.blooms.length - 1; i >= 0; i--) {
      const fl = this.blooms[i];
      fl.life -= dt;
      if (fl.size < fl.maxSize) fl.size += 30 * dt;
      fl.angle += 0.5 * dt;

      // Flowers channel harmonic solar beams into the Spore Core to purify it!
      fl.fireTimer -= dt;
      if (fl.fireTimer <= 0) {
        fl.fireTimer = 0.8;
        // Harmonic beam damage to boss
        core.health -= 1.8;
        this.score += 40;
        globalParticles.emitBurst(core.x, core.y, 2, [fl.color, "#FFFFFF"], 20, 60);

        if (core.health <= 0) {
          this.handleCorePurified();
          return;
        }
      }

      if (fl.life <= 0) {
        this.blooms.splice(i, 1);
      }
    }

    // --- 4. Update Spore Seeds vs Player Hitbox ---
    for (let i = this.seeds.length - 1; i >= 0; i--) {
      const s = this.seeds[i];
      s.x += s.vx * dt;
      s.y += s.vy * dt;

      if (s.x < 5 || s.x > 595 || s.y < 20 || s.y > 680) {
        this.seeds.splice(i, 1);
        continue;
      }

      // Contact with Player
      const dist = Math.hypot(s.x - this.playerPos.x, s.y - this.playerPos.y);
      if (dist <= this.playerHitboxRadius + 3 && this.invulnTimer <= 0) {
        this.seeds.splice(i, 1);
        this.shieldRechargeDelay = 3.0;
        this.bloomCombo = 0; // Reset combo

        if (this.shield > 0) {
          this.shield = Math.max(0, this.shield - 25);
          this.hitFlash = 0.2;
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 14, ["#00F0FF", "#38BDF8", "#FFFFFF"], 50, 160);
          globalParticles.emitText(`SHIELD -25`, this.playerPos.x, this.playerPos.y - 20, "#00F0FF", 12);
        } else {
          this.lives--;
          this.shield = 100;
          this.invulnTimer = 2.0;
          this.hitFlash = 0.4;
          this.screenShake = 0.6;
          this.ctx.audio?.playExplosion?.();
          globalParticles.emitBurst(this.playerPos.x, this.playerPos.y, 35, ["#EF4444", "#F472B6", "#FFFFFF"], 100, 320);
          this.seeds = [];

          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
            this.ctx.audio?.playGameOver?.();
          }
        }
        break;
      }
    }

    // --- 5. Update Nectar Orbs ---
    for (let i = this.nectars.length - 1; i >= 0; i--) {
      const n = this.nectars[i];
      const toPlayer = Math.atan2(this.playerPos.y - n.y, this.playerPos.x - n.x);
      n.x += Math.cos(toPlayer) * 420 * dt;
      n.y += Math.sin(toPlayer) * 420 * dt;

      if (Math.hypot(n.x - this.playerPos.x, n.y - this.playerPos.y) < 22) {
        this.score += n.value;
        this.nectars.splice(i, 1);
        this.ctx.audio?.playCoin?.();
      }
    }
  }

  private handleCorePurified(): void {
    this.score += 20000;
    this.screenShake = 1.0;
    this.ctx.audio?.playVictory?.();
    globalParticles.emitBurst(this.sporeCore.x, this.sporeCore.y, 80, ["#F472B6", "#38BDF8", "#FBBF24", "#FFFFFF"], 200, 500);

    this.gardenTier++;
    this.bannerText = `🌺 GARDEN TIER ${this.gardenTier - 1} PURIFIED! EVOLVING... 🌺`;
    this.bannerTimer = 3.0;

    // Reset next tier
    this.seeds = [];
    this.blooms = [];
    const coreHp = 120 + (this.gardenTier - 1) * 80;
    this.sporeCore.maxHealth = coreHp;
    this.sporeCore.health = coreHp;
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if (action === "ACTION_PRIMARY" || action === "ACTION_SECONDARY" || action === "CONFIRM") {
      this.isSilkDashing = isPressed; // Hold Shift/Space to Silk Dash
    }
    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.gardenTier; }
  public getLives(): number { return this.lives; }

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

    // 1. Bioluminescent Cyber-Garden Arena Floor
    pr.clear("#040C08");
    pr.drawGrid(10, 12, 60, "rgba(52, 211, 153, 0.05)", 0, 0);

    // Glowing Garden Boundary
    pr.drawRect(14, 56, w - 28, h - 72, "rgba(52, 211, 153, 0.2)", false);
    pr.drawRect(16, 58, w - 32, h - 76, "rgba(244, 114, 182, 0.1)", false);

    // 2. Bloomed Flowers on Arena Floor (with Harmonic Light Beams)
    for (const fl of this.blooms) {
      // Harmonic Beam to Spore Core
      if (ctx2d) {
        ctx2d.strokeStyle = fl.color;
        ctx2d.globalAlpha = 0.25;
        ctx2d.lineWidth = 1.5;
        ctx2d.beginPath();
        ctx2d.moveTo(fl.x, fl.y);
        ctx2d.lineTo(this.sporeCore.x, this.sporeCore.y);
        ctx2d.stroke();
        ctx2d.globalAlpha = 1.0;
      }

      // Draw Floral Petals
      pr.save();
      pr.translate(fl.x, fl.y);
      pr.rotate(fl.angle);
      for (let p = 0; p < fl.petalCount; p++) {
        const pAng = (p * Math.PI * 2) / fl.petalCount;
        const petX = Math.cos(pAng) * (fl.size * 0.6);
        const petY = Math.sin(pAng) * (fl.size * 0.6);
        pr.drawCircle(petX, petY, fl.size * 0.45, fl.color, true);
      }
      pr.drawCircle(0, 0, fl.size * 0.35, "#FEF08A", true);
      pr.restore();
    }

    // 3. Luminous Silk Trail Woven by Player
    if (this.silkTrail.length > 1) {
      for (let i = 0; i < this.silkTrail.length - 1; i++) {
        const p1 = this.silkTrail[i];
        const p2 = this.silkTrail[i + 1];
        const alpha = (i / this.silkTrail.length) * 0.85;
        pr.drawLine(p1.x, p1.y, p2.x, p2.y, "rgba(244, 114, 182, 0.3)", 5);
        pr.drawLine(p1.x, p1.y, p2.x, p2.y, `rgba(255, 255, 255, ${alpha})`, 2.5);
      }
    }

    // 4. Floating Nectar Orbs
    for (const n of this.nectars) {
      pr.drawCircle(n.x, n.y, 4, "#FDE047", true);
      pr.drawCircle(n.x, n.y, 2, "#FFFFFF", true);
    }

    // 5. Living Alien Spore Core Boss
    const core = this.sporeCore;
    const hpPct = Math.max(0, core.health / core.maxHealth);

    // Glowing Bio-Spore Crown
    pr.save();
    pr.translate(core.x, core.y);
    pr.rotate(this.time * 0.8);
    for (let i = 0; i < 6; i++) {
      const sang = (i * Math.PI * 2) / 6;
      pr.drawCircle(Math.cos(sang) * 36, Math.sin(sang) * 36, 12, "rgba(244, 114, 182, 0.35)", true);
      pr.drawCircle(Math.cos(sang) * 36, Math.sin(sang) * 36, 8, "#EC4899", true);
    }
    pr.restore();

    pr.drawCircle(core.x, core.y, 32, "#831843", true);
    pr.drawCircle(core.x, core.y, 22, "#F472B6", true);
    pr.drawCircle(core.x, core.y, 12, "#FFFFFF", true);

    // 6. Spore Seeds (Glowing Botanical Seed Bullets)
    for (const s of this.seeds) {
      pr.drawCircle(s.x, s.y, s.size + 1.5, "rgba(255, 255, 255, 0.3)", true);
      pr.drawCircle(s.x, s.y, s.size, s.color, true);
      pr.drawCircle(s.x, s.y, s.size * 0.45, s.glowColor, true);
    }

    // 7. Player Weaver Drone (from droneSprite.ts)
    const px = this.playerPos.x;
    const py = this.playerPos.y;

    if (this.shield > 0) {
      const shieldAlpha = (this.shield / this.maxShield) * 0.35;
      const shieldPulse = Math.sin(this.time * 12) * 2;
      pr.drawCircle(px, py, 22 + shieldPulse, `rgba(52, 211, 153, ${shieldAlpha})`, true);
      pr.drawCircle(px, py, 22 + shieldPulse, "#34D399", false);
    }

    if (this.invulnTimer <= 0 || Math.sin(this.time * 24) > 0) {
      drawPixelDrone(pr, px, py, -Math.PI / 2, 1.2, this.time, true);
    }

    // Micro-Hitbox Heart
    pr.drawCircle(px, py, this.playerHitboxRadius + 1.5, "#34D399", false);
    pr.drawCircle(px, py, this.playerHitboxRadius, "#FFFFFF", true);

    // On-Vessel Shield Bar
    const sbW = 28;
    const sbH = 3.5;
    const sbX = px - sbW / 2;
    const sbY = py + 18;
    pr.drawRect(sbX - 1, sbY - 1, sbW + 2, sbH + 2, "#0F172A", true);
    pr.drawRect(sbX, sbY, (this.shield / this.maxShield) * sbW, sbH, this.shield > 30 ? "#34D399" : "#EF4444", true);

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // 8. Hit Flash
    if (this.hitFlash > 0) {
      pr.drawRect(0, 0, w, h, "rgba(239, 68, 68, 0.35)", true);
    }

    // 9. Spore Core Health Bar (Top of Screen)
    const bhW = 280;
    const bhX = w / 2 - bhW / 2;
    const bhY = 62;
    pr.drawRect(bhX - 2, bhY - 2, bhW + 4, 12, "rgba(10, 14, 39, 0.95)", true);
    pr.drawRect(bhX - 2, bhY - 2, bhW + 4, 12, "#EC4899", false);
    pr.drawRect(bhX, bhY, bhW * hpPct, 8, "#F472B6", true);
    pr.drawText(`SPORE HYDRA PURITY: ${Math.round(hpPct * 100)}%`, w / 2, bhY + 18, { size: 9, color: "#F472B6", align: "center", font: "monospace" });

    // 10. Banner Announcements
    if (this.bannerTimer > 0) {
      pr.drawRect(0, h / 2 - 36, w, 72, "rgba(10, 14, 39, 0.94)", true);
      pr.drawRect(0, h / 2 - 36, w, 72, "#34D399", false);
      pr.drawText(this.bannerText, w / 2, h / 2 + 6, { size: 14, color: "#34D399", align: "center", font: "monospace" });
    }

    // 11. Top Cyber-Botanical HUD
    pr.drawRect(12, 12, w - 24, 44, "rgba(8, 14, 28, 0.95)", true);
    pr.drawRect(12, 12, w - 24, 44, "#34D399", false);

    pr.drawText(`SCORE: ${this.score}`, 24, 28, { size: 13, color: "#FFD84D", font: "monospace" });
    pr.drawText(`TIER ${this.gardenTier} • BLOOMED: ${this.totalBloomed} 🌸`, w / 2, 28, { size: 12, color: "#34D399", align: "center", font: "monospace" });
    pr.drawText(`${"♥ ".repeat(Math.max(0, this.lives))}`, w - 24, 28, { size: 13, color: "#F472B6", align: "right", font: "monospace" });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 34, 300, 20, "rgba(8, 14, 28, 0.9)", true);
    pr.drawText("[WASD: WEAVE SILK  •  LOOP TO BLOOM  •  R: RETRY]", 166, h - 20, {
      size: 8,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("GARDEN OVERGROWN — WEAVER CORRUPTED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO REWEAVE THE GARDEN", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
