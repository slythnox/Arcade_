import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { ValueNoise } from "../../core/math/noise";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface ChristmasTree {
  worldX: number;
  worldY: number;
  height: number;
  health: number;
  maxHealth: number;
  destroyed: boolean;
  type: "small" | "large" | "gift";
}

interface WoodDebris {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vRot: number;
  color: string;
  size: number;
  life: number;
}

interface Snowflake {
  x: number;
  y: number;
  speed: number;
  drift: number;
  size: number;
}

export class InfiniteForestGame implements GameInstance {
  private ctx!: GameContext;
  private noise!: ValueNoise;
  private scrollX = 0;
  private tractorX = 140;
  private tractorY = 400;
  private tractorVy = 0;
  private isGrounded = true;

  // Driving Dynamics
  private speed = 0;
  private maxSpeed = 380;
  private isDrivingForward = false;
  private isReversing = false;

  // Grinder Upgrade Mechanics (Press E to expand & add dense teeth)
  private grinderTier = 1;
  private maxGrinderTier = 4;
  private grinderRadius = 18;
  private targetGrinderRadius = 18;

  private score = 0;
  private treesDestroyed = 0;
  private distance = 0;
  private gameOver = false;
  private isPaused = false;
  private animTime = 0;
  private wheelRotation = 0;
  private grinderRotation = 0;
  private isGrindingBlocked = false;

  private trees: ChristmasTree[] = [];
  private debrisList: WoodDebris[] = [];
  private snowflakes: Snowflake[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.noise = new ValueNoise(seed || 2026);
    this.scrollX = 0;
    this.tractorX = 140;
    this.tractorY = 400;
    this.tractorVy = 0;
    this.isGrounded = true;
    this.speed = 0;
    this.isDrivingForward = false;
    this.isReversing = false;
    this.grinderTier = 1;
    this.grinderRadius = 18;
    this.targetGrinderRadius = 18;
    this.isGrindingBlocked = false;
    this.score = 0;
    this.treesDestroyed = 0;
    this.distance = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
    this.wheelRotation = 0;
    this.grinderRotation = 0;
    this.trees = [];
    this.debrisList = [];

    // Initialize atmospheric snowflakes
    this.snowflakes = Array.from({ length: 60 }, () => ({
      x: Math.random() * 600,
      y: Math.random() * 700,
      speed: 40 + Math.random() * 80,
      drift: -20 - Math.random() * 30,
      size: 1.5 + Math.random() * 2.5,
    }));

    // Pre-generate well-spaced Christmas trees
    for (let x = 600; x < 5000; x += 340 + Math.floor(this.ctx.random.next() * 220)) {
      const groundY = this.getGroundHeight(x);
      const rand = this.ctx.random.next();
      const isGift = rand > 0.85;
      const isLarge = rand > 0.45;
      const maxHp = isGift ? 45 : isLarge ? 75 : 45;

      this.trees.push({
        worldX: x,
        worldY: groundY,
        height: isLarge ? 85 : 62,
        health: maxHp,
        maxHealth: maxHp,
        destroyed: false,
        type: isGift ? "gift" : isLarge ? "large" : "small",
      });
    }
  }

  // Upgrade Grinder on E Press
  public upgradeGrinder(): void {
    if (this.grinderTier < this.maxGrinderTier) {
      this.grinderTier++;
    } else {
      this.grinderTier = 1; // Cycle back through tiers
    }

    const tierRadii = [18, 25, 32, 40];
    this.targetGrinderRadius = tierRadii[this.grinderTier - 1];

    this.ctx.audio?.playPowerUp?.();
    globalParticles.emitBurst(this.tractorX + 64, this.tractorY - 4, 30, ["#FACC15", "#38BDF8", "#FFFFFF"], 70, 220);
  }

  private getGroundHeight(worldX: number): number {
    const n = this.noise.noise1D(worldX * 0.0018);
    const n2 = this.noise.noise1D(worldX * 0.006) * 0.25;
    return 480 + (n + n2) * 85;
  }

  private spawnSawdustChips(x: number, y: number, isGift: boolean, count = 4): void {
    const colors = isGift
      ? ["#EF4444", "#FBBF24", "#38BDF8", "#FFFFFF", "#10B981"]
      : ["#15803D", "#854D0E", "#FBBF24", "#EF4444", "#FFFFFF", "#FDE047"];

    for (let i = 0; i < count; i++) {
      const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.4;
      const spd = 120 + Math.random() * 260;
      this.debrisList.push({
        x: x + (Math.random() - 0.5) * 8,
        y: y - 10 - Math.random() * 25,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        rot: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 18,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 2.5 + Math.random() * 4,
        life: 0.5 + Math.random() * 0.4,
      });
    }
  }

  public update(dt: number): void {
    if (this.gameOver || this.isPaused) return;
    this.animTime += dt;

    // Smooth Grinder Expansion Lerp
    this.grinderRadius += (this.targetGrinderRadius - this.grinderRadius) * Math.min(1, dt * 10);

    // Check tree blocking collision
    this.isGrindingBlocked = false;
    const grinderContactX = this.tractorX + 50 + this.grinderRadius;

    // Multiplier for grinder tier cutting speed (Tier 1: 1.0x, Tier 2: 1.8x, Tier 3: 2.8x, Tier 4: 4.2x)
    const tierDmgMultipliers = [1.0, 1.8, 2.8, 4.2];
    const currentGrindDmgRate = 120 * tierDmgMultipliers[this.grinderTier - 1];

    for (const tree of this.trees) {
      if (tree.destroyed) continue;
      const screenX = tree.worldX - this.scrollX;

      if (screenX >= grinderContactX - 14 && screenX <= grinderContactX + 32) {
        if (Math.abs(tree.worldY - (this.tractorY + 28)) < 65) {
          this.isGrindingBlocked = true;

          tree.health -= currentGrindDmgRate * dt;
          this.spawnSawdustChips(screenX, tree.worldY, tree.type === "gift", 2 + this.grinderTier);

          if (Math.random() < 0.25) {
            this.ctx.audio?.playHit?.();
          }

          if (tree.health <= 0) {
            tree.destroyed = true;
            this.treesDestroyed++;
            this.score += tree.type === "gift" ? 350 : 150;
            this.ctx.audio?.playExplosion?.();
            this.spawnSawdustChips(screenX, tree.worldY, tree.type === "gift", 18 + this.grinderTier * 6);
          }

          break;
        }
      }
    }

    // Velocity & Acceleration Physics
    let targetSpeed = 0;
    if (this.isGrindingBlocked) {
      targetSpeed = 0;
    } else if (this.isDrivingForward) {
      targetSpeed = this.maxSpeed;
    } else if (this.isReversing) {
      targetSpeed = -140;
    }

    this.speed += (targetSpeed - this.speed) * Math.min(1, dt * (this.isGrindingBlocked ? 20 : 6));
    this.wheelRotation += this.speed * dt * 0.08;
    this.grinderRotation += dt * (this.isGrindingBlocked ? 60 : 35);

    // Scroll forward
    this.scrollX = Math.max(0, this.scrollX + this.speed * dt);
    if (this.speed > 0) {
      this.distance += this.speed * dt;
    }
    this.score = Math.floor(this.distance / 8) + this.treesDestroyed * 150;

    // Tractor Gravity & Ground Physics
    this.tractorVy += 1600 * dt;
    this.tractorY += this.tractorVy * dt;

    const currentGround = this.getGroundHeight(this.scrollX + this.tractorX);
    if (this.tractorY >= currentGround - 28) {
      this.tractorY = currentGround - 28;
      this.tractorVy = 0;
      this.isGrounded = true;
    } else {
      this.isGrounded = false;
    }

    // Snowflakes
    for (const snow of this.snowflakes) {
      snow.y += snow.speed * dt;
      snow.x += (snow.drift - this.speed * 0.2) * dt;
      if (snow.y > 700) {
        snow.y = -10;
        snow.x = Math.random() * 600;
      }
      if (snow.x < -10) snow.x = 610;
    }

    // Exhaust Smoke
    if (Math.abs(this.speed) > 10 || this.isGrindingBlocked) {
      if (Math.random() < (this.isGrindingBlocked ? 0.6 : 0.3)) {
        this.debrisList.push({
          x: this.tractorX + 18,
          y: this.tractorY - 34,
          vx: -50 - Math.random() * 60,
          vy: -35 - Math.random() * 40,
          rot: 0,
          vRot: 0,
          color: this.isGrindingBlocked ? "rgba(71, 85, 105, 0.85)" : "rgba(148, 163, 184, 0.5)",
          size: 4 + Math.random() * 5,
          life: 0.45,
        });
      }
    }

    // Spawn more trees ahead
    const maxWorldX = this.scrollX + 900;
    const lastTreeX = this.trees.length > 0 ? this.trees[this.trees.length - 1].worldX : 0;
    if (lastTreeX < maxWorldX) {
      const nextX = lastTreeX + 340 + Math.floor(this.ctx.random.next() * 220);
      const gY = this.getGroundHeight(nextX);
      const rand = this.ctx.random.next();
      const isGift = rand > 0.85;
      const isLarge = rand > 0.45;
      const maxHp = isGift ? 45 : isLarge ? 75 : 45;

      this.trees.push({
        worldX: nextX,
        worldY: gY,
        height: isLarge ? 85 : 62,
        health: maxHp,
        maxHealth: maxHp,
        destroyed: false,
        type: isGift ? "gift" : isLarge ? "large" : "small",
      });
    }

    this.trees = this.trees.filter((t) => t.worldX > this.scrollX - 200);

    // Debris
    for (let i = this.debrisList.length - 1; i >= 0; i--) {
      const d = this.debrisList[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vy += 850 * dt;
      d.rot += d.vRot * dt;
      d.life -= dt;
      if (d.life <= 0) this.debrisList.splice(i, 1);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_RIGHT") {
      this.isDrivingForward = isPressed;
    } else if (action === "MOVE_LEFT") {
      this.isReversing = isPressed;
    } else if (action === "MOVE_UP" || action === "ACTION_PRIMARY") {
      if (isPressed && this.isGrounded) {
        this.tractorVy = -640;
        this.isGrounded = false;
        this.ctx.audio?.playMove?.();
      }
    } else if (action === "ACTION_SECONDARY" || action === "CONFIRM" || action === "ROTATE") {
      // E / Action Secondary: Expand & Densify Grinder
      if (isPressed) {
        this.upgradeGrinder();
      }
    } else if (action === "RESTART" && isPressed) {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.grinderTier; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Nordic Twilight Sky with Aurora Borealis
    if (ctx2d) {
      const skyGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      skyGrad.addColorStop(0, "#050B14");
      skyGrad.addColorStop(0.35, "#0A172E");
      skyGrad.addColorStop(0.7, "#162544");
      skyGrad.addColorStop(1, "#263B66");
      ctx2d.fillStyle = skyGrad;
      ctx2d.fillRect(0, 0, w, h);

      // Aurora Ribbon
      ctx2d.save();
      const auroraWave = Math.sin(this.animTime * 0.8) * 20;
      const auroraGrad = ctx2d.createLinearGradient(0, 40, w, 200);
      auroraGrad.addColorStop(0, "rgba(52, 211, 153, 0.22)");
      auroraGrad.addColorStop(0.5, "rgba(56, 189, 248, 0.28)");
      auroraGrad.addColorStop(1, "rgba(168, 85, 247, 0)");
      ctx2d.fillStyle = auroraGrad;
      ctx2d.beginPath();
      ctx2d.moveTo(0, 80 + auroraWave);
      ctx2d.bezierCurveTo(w * 0.3, 30 - auroraWave, w * 0.7, 130 + auroraWave, w, 70 - auroraWave);
      ctx2d.lineTo(w, 240);
      ctx2d.lineTo(0, 240);
      ctx2d.closePath();
      ctx2d.fill();
      ctx2d.restore();

      // Glowing Moon
      ctx2d.save();
      ctx2d.shadowColor = "rgba(255, 255, 255, 0.6)";
      ctx2d.shadowBlur = 24;
      ctx2d.fillStyle = "#F8FAFC";
      ctx2d.beginPath();
      ctx2d.arc(w - 90, 85, 28, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();
    } else {
      pr.clear("#050B14");
    }

    // 2. Parallax Mountain Ridges (Parallax 0.08)
    for (let x = 0; x < w; x += 4) {
      const mx = x + this.scrollX * 0.08;
      const my = 220 + this.noise.noise1D(mx * 0.001) * 75;
      pr.drawRect(x, my, 4, h - my, "#111D36", true);
      pr.drawRect(x, my, 4, 10, "#E2E8F0", true);
    }

    // 3. Mid-Ground Frosted Pine Forest (Parallax 0.32)
    for (let x = 0; x < w; x += 36) {
      const fx = x - ((this.scrollX * 0.32) % 36);
      const fy = 330 + this.noise.noise1D((x + this.scrollX * 0.32) * 0.0028) * 55;
      pr.drawRect(fx + 14, fy, 8, 90, "#064E3B", true);
      pr.drawCircle(fx + 18, fy - 16, 24, "#065F46", true);
      pr.drawCircle(fx + 18, fy - 22, 16, "#F1F5F9", true);
    }

    // 4. Foreground Rolling Snow Hills
    for (let x = 0; x < w; x += 4) {
      const wx = this.scrollX + x;
      const gy = this.getGroundHeight(wx);
      pr.drawRect(x, gy, 4, 14, "#F8FAFC", true);
      pr.drawRect(x, gy + 14, 4, h - gy - 14, "#5B3317", true);
    }

    // 5. Render Christmas Trees
    for (const tree of this.trees) {
      const sx = tree.worldX - this.scrollX;
      if (sx < -60 || sx > w + 60) continue;

      if (tree.destroyed) {
        pr.drawRect(sx - 8, tree.worldY - 14, 16, 14, "#854D0E", true);
        pr.drawRect(sx - 10, tree.worldY - 16, 20, 4, "#FDE047", true);
        continue;
      }

      const hpPercent = Math.max(0, tree.health / tree.maxHealth);
      const currentHeight = Math.max(16, tree.height * hpPercent);
      const trunkH = Math.floor(tree.height * 0.25);
      const trunkW = 12;

      const shakeX = (tree.health < tree.maxHealth && !tree.destroyed) ? (Math.random() - 0.5) * 6 : 0;

      pr.drawRect(sx + shakeX - trunkW / 2, tree.worldY - trunkH, trunkW, trunkH, "#78350F", true);

      const tiers = 3;
      const tierH = Math.max(4, (currentHeight - trunkH) / tiers);
      for (let i = 0; i < tiers; i++) {
        const ty = tree.worldY - trunkH - i * (tierH * 0.75);
        const tw = Math.max(12, (44 - i * 10) * hpPercent);
        pr.drawRect(sx + shakeX - tw / 2, ty - tierH, tw, tierH, "#15803D", true);
        pr.drawRect(sx + shakeX - tw / 2, ty - tierH, tw, 3, "#F8FAFC", true);
      }

      if (hpPercent > 0.4) {
        pr.drawCircle(sx + shakeX - 10, tree.worldY - trunkH - 12, 3, "#EF4444", true);
        pr.drawCircle(sx + shakeX + 8, tree.worldY - trunkH - 16, 3, "#FBBF24", true);
      }
      if (hpPercent > 0.7) {
        pr.drawCircle(sx + shakeX - 6, tree.worldY - trunkH - 28, 2.5, "#38BDF8", true);
        pr.drawCircle(sx + shakeX, tree.worldY - currentHeight - 4, 5, "#FBBF24", true);
      }

      if (tree.type === "gift" && hpPercent > 0.2) {
        pr.drawRect(sx + shakeX - 16, tree.worldY - 14, 12, 14, "#EF4444", true);
        pr.drawRect(sx + shakeX + 8, tree.worldY - 12, 10, 12, "#38BDF8", true);
      }

      if (tree.health < tree.maxHealth && ctx2d) {
        ctx2d.save();
        ctx2d.fillStyle = "rgba(15, 23, 42, 0.85)";
        ctx2d.fillRect(sx - 18, tree.worldY - tree.height - 18, 36, 6);
        ctx2d.fillStyle = "#22C55E";
        ctx2d.fillRect(sx - 17, tree.worldY - tree.height - 17, 34 * hpPercent, 4);
        ctx2d.restore();
      }
    }

    // 6. Snowflakes
    for (const snow of this.snowflakes) {
      pr.drawCircle(snow.x, snow.y, snow.size, "rgba(255, 255, 255, 0.85)", true);
    }

    // 7. Debris
    for (const d of this.debrisList) {
      pr.drawRect(d.x - d.size / 2, d.y - d.size / 2, d.size, d.size, d.color, true);
    }

    // 8. Render Tractor with Upgraded Dense Circular Grinder
    const px = this.tractorX;
    const py = this.tractorY;

    if (ctx2d) {
      ctx2d.save();

      // Hood Engine Body
      ctx2d.fillStyle = "#15803D";
      ctx2d.fillRect(px + 4, py - 18, 48, 20);
      ctx2d.fillStyle = "#22C55E";
      ctx2d.fillRect(px + 6, py - 20, 44, 4);

      // John Deere Yellow Decal
      ctx2d.fillStyle = "#FACC15";
      ctx2d.fillRect(px + 20, py - 14, 24, 4);

      // Driver Cab Body & Roof
      ctx2d.fillStyle = "#166534";
      ctx2d.fillRect(px - 28, py - 46, 36, 42);
      ctx2d.fillStyle = "#15803D";
      ctx2d.fillRect(px - 32, py - 50, 44, 6);

      // Tinted Glass Windows
      ctx2d.fillStyle = "#A78BFA";
      ctx2d.fillRect(px - 24, py - 42, 28, 22);
      ctx2d.fillStyle = "rgba(255, 255, 255, 0.4)";
      ctx2d.fillRect(px - 22, py - 40, 10, 18);

      // Chrome Exhaust Stack
      ctx2d.fillStyle = "#334155";
      ctx2d.fillRect(px + 14, py - 42, 5, 24);
      ctx2d.fillStyle = "#94A3B8";
      ctx2d.fillRect(px + 13, py - 44, 7, 3);

      // Ladder
      ctx2d.strokeStyle = "#10B981";
      ctx2d.lineWidth = 2.5;
      ctx2d.strokeRect(px - 6, py - 4, 8, 16);

      // --- DENSE UPGRADED CIRCULAR WOOD GRINDER MULCHER (Scales by Grinder Tier!) ---
      const grinderX = px + 48 + this.grinderRadius * 0.75;
      const grinderY = py - 4;
      const grinderRadius = this.grinderRadius;

      // Heavy Mounting Arm & Hydraulic Piston
      ctx2d.fillStyle = "#334155";
      ctx2d.fillRect(px + 48, py - 12, 16, 16);
      ctx2d.strokeStyle = "#64748B";
      ctx2d.lineWidth = 2;
      ctx2d.strokeRect(px + 48, py - 12, 16, 16);

      // Protective Steel Hood Cowling over Drum
      ctx2d.fillStyle = "#475569";
      ctx2d.beginPath();
      ctx2d.arc(grinderX, grinderY, grinderRadius + 5, Math.PI, Math.PI * 1.7);
      ctx2d.lineWidth = 4;
      ctx2d.strokeStyle = "#CBD5E1";
      ctx2d.stroke();

      // Spinning Drum & Dense Teeth Array
      ctx2d.save();
      ctx2d.translate(grinderX, grinderY);
      ctx2d.rotate(this.grinderRotation);

      // Steel Disc Drum
      ctx2d.fillStyle = this.grinderTier === 4 ? "#1E293B" : this.grinderTier === 3 ? "#0F172A" : "#64748B";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, grinderRadius, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.strokeStyle = this.grinderTier === 4 ? "#F43F5E" : this.grinderTier === 3 ? "#38BDF8" : "#94A3B8";
      ctx2d.lineWidth = 2.5;
      ctx2d.stroke();

      // Teeth Count scales densely: Tier 1: 6 teeth, Tier 2: 10 teeth, Tier 3: 14 teeth, Tier 4: 18 teeth!
      const teethCounts = [6, 10, 14, 18];
      const toothCount = teethCounts[this.grinderTier - 1];
      const toothColor = this.grinderTier === 4 ? "#FDE047" : this.grinderTier === 3 ? "#E0F2FE" : "#F8FAFC";

      ctx2d.fillStyle = toothColor;
      for (let t = 0; t < toothCount; t++) {
        ctx2d.rotate((Math.PI * 2) / toothCount);
        ctx2d.beginPath();
        ctx2d.moveTo(grinderRadius - 2, -3);
        ctx2d.lineTo(grinderRadius + 8 + this.grinderTier * 1.5, 0); // Pointy carbide cutting tooth
        ctx2d.lineTo(grinderRadius - 2, 3);
        ctx2d.closePath();
        ctx2d.fill();
      }

      // Center Spindle Hub
      ctx2d.fillStyle = "#FACC15";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, 5 + this.grinderTier * 1.2, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();

      // --- REAR WHEEL ---
      const rwX = px - 20;
      const rwY = py + 4;
      const rwRadius = 26;

      ctx2d.save();
      ctx2d.translate(rwX, rwY);
      ctx2d.rotate(this.wheelRotation);

      ctx2d.fillStyle = "#1E293B";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, rwRadius, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.fillStyle = "#0F172A";
      for (let a = 0; a < 8; a++) {
        ctx2d.rotate((Math.PI * 2) / 8);
        ctx2d.fillRect(-3, -rwRadius - 2, 6, 5);
      }

      ctx2d.fillStyle = "#EAB308";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, rwRadius * 0.65, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.fillStyle = "#CA8A04";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, rwRadius * 0.35, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.fillStyle = "#FACC15";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, rwRadius * 0.15, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();

      // --- FRONT WHEEL ---
      const fwX = px + 40;
      const fwY = py + 12;
      const fwRadius = 16;

      ctx2d.save();
      ctx2d.translate(fwX, fwY);
      ctx2d.rotate(this.wheelRotation * 1.5);

      ctx2d.fillStyle = "#1E293B";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, fwRadius, 0, Math.PI * 2);
      ctx2d.fill();

      ctx2d.fillStyle = "#EAB308";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, fwRadius * 0.62, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.fillStyle = "#FACC15";
      ctx2d.beginPath();
      ctx2d.arc(0, 0, fwRadius * 0.2, 0, Math.PI * 2);
      ctx2d.fill();
      ctx2d.restore();

      ctx2d.restore();
    }

    // 9. Top Clean HUD
    const tierLabels = ["MK-I (STD)", "MK-II (HEAVY)", "MK-III (TITANIUM)", "MK-IV (MONSTER)"];

    pr.drawRect(16, 12, w - 32, 46, "rgba(15, 23, 42, 0.94)", true);
    pr.drawRect(16, 12, w - 32, 46, "#22C55E", false);

    pr.drawText(`GRINDER: ${tierLabels[this.grinderTier - 1]}`, 28, 30, {
      size: 13,
      color: this.grinderTier === 4 ? "#F43F5E" : this.grinderTier === 3 ? "#38BDF8" : "#22C55E",
      font: "bold system-ui, sans-serif",
    });

    pr.drawText(`TREES: ${this.treesDestroyed}`, w / 2, 30, {
      size: 13,
      color: "#94A3B8",
      align: "center",
      font: "monospace",
    });

    pr.drawText(`LUMBER: ${this.score}`, w - 28, 30, {
      size: 14,
      color: "#FBBF24",
      align: "right",
      font: "bold monospace",
    });

    pr.drawText(
      this.isGrindingBlocked
        ? "MULCHING TREE IN PROGRESS... CUTTING DOWN!"
        : "[PRESS E: UPGRADE DENSE GRINDER  •  HOLD D / RIGHT: DRIVE  •  SPACE: JUMP]",
      w / 2,
      48,
      {
        size: 9.5,
        color: this.isGrindingBlocked ? "#FBBF24" : "#CBD5E1",
        align: "center",
        font: "monospace",
      }
    );
  }
}
