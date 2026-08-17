import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface ICBMMissile {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number;
  trail: { x: number; y: number }[];
}

interface DefenseInterceptor {
  id: number;
  siloIndex: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  targetX: number;
  targetY: number;
  speed: number;
  angle: number;
  trail: { x: number; y: number }[];
}

interface FireballExplosion {
  id: number;
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  expanding: boolean;
  intensity: number;
  timer: number;
}

interface DefenseBase {
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  label: string;
  alive: boolean;
}

interface CoastalStructure {
  type: "tower" | "hangar" | "radio_tower" | "building";
  x: number;
  y: number;
  w: number;
  h: number;
  alive: boolean;
  health: number;
  maxHealth: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  twinkle: number;
}

interface ColorRGB {
  r: number;
  g: number;
  b: number;
}

interface SkyKeyframe {
  pos: number; // 0.0 to 1.0
  top: ColorRGB;
  mid: ColorRGB;
  bot: ColorRGB;
  mountain: ColorRGB;
  grass: ColorRGB;
}

// 4 Harmonious Atmospheric Keyframes (Noon -> Sunset -> Midnight -> Dawn -> Noon)
const SKY_KEYFRAMES: SkyKeyframe[] = [
  {
    pos: 0.0, // High Noon
    top: { r: 2, g: 132, b: 199 },
    mid: { r: 56, g: 189, b: 248 },
    bot: { r: 186, g: 230, b: 253 },
    mountain: { r: 51, g: 65, b: 85 },
    grass: { r: 21, g: 128, b: 61 },
  },
  {
    pos: 0.28, // Golden Sunset
    top: { r: 49, g: 46, b: 129 },
    mid: { r: 131, g: 24, b: 67 },
    bot: { r: 234, g: 88, b: 12 },
    mountain: { r: 76, g: 5, b: 25 },
    grass: { r: 31, g: 84, b: 46 },
  },
  {
    pos: 0.55, // Midnight Deep Space
    top: { r: 3, g: 7, b: 18 },
    mid: { r: 11, g: 17, b: 32 },
    bot: { r: 30, g: 27, b: 75 },
    mountain: { r: 15, g: 23, b: 42 },
    grass: { r: 6, g: 78, b: 59 },
  },
  {
    pos: 0.78, // Golden Dawn
    top: { r: 30, g: 27, b: 75 },
    mid: { r: 2, g: 132, b: 199 },
    bot: { r: 245, g: 158, b: 11 },
    mountain: { r: 30, g: 41, b: 59 },
    grass: { r: 16, g: 105, b: 50 },
  },
];

function lerpColor(c1: ColorRGB, c2: ColorRGB, t: number): ColorRGB {
  return {
    r: Math.round(c1.r + (c2.r - c1.r) * t),
    g: Math.round(c1.g + (c2.g - c1.g) * t),
    b: Math.round(c1.b + (c2.b - c1.b) * t),
  };
}

function colorToString(c: ColorRGB, alpha: number = 1.0): string {
  return `rgba(${c.r}, ${c.g}, ${c.b}, ${alpha})`;
}

export class MissileCommandGame implements GameInstance {
  private ctx!: GameContext;

  private crosshairX: number = 300;
  private crosshairY: number = 280;

  private icbms: ICBMMissile[] = [];
  private interceptors: DefenseInterceptor[] = [];
  private explosions: FireballExplosion[] = [];
  private stars: Star[] = [];

  // Defense Batteries & Modern Coastal Base
  private silos: DefenseBase[] = [];
  private structures: CoastalStructure[] = [];

  private score: number = 0;
  private wave: number = 1;
  private totalIntercepts: number = 0;
  private spawnTimer: number = 0;
  private screenShake: number = 0;

  // Slower, Continuous 24h Day/Night Cycle (90 seconds full cycle)
  private dayTimeProgress: number = 0;
  private readonly dayCycleDuration: number = 90;

  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;

  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.initStars();
    this.reset();
    this.attachPointerControls();
  }

  private initStars(): void {
    this.stars = [];
    for (let i = 0; i < 75; i++) {
      this.stars.push({
        x: Math.random() * 600,
        y: Math.random() * 460,
        size: Math.random() > 0.8 ? 2 : 1,
        twinkle: Math.random() * Math.PI * 2,
      });
    }
  }

  private attachPointerControls(): void {
    const canvas = (this.ctx.renderer as PixelRenderer).getContext?.()?.canvas;
    if (!canvas) return;

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      this.crosshairX = (e.clientX - rect.left) * scaleX;
      this.crosshairY = Math.min(560, (e.clientY - rect.top) * scaleY);
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (e.button === 0) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        this.crosshairX = (e.clientX - rect.left) * scaleX;
        this.crosshairY = Math.min(560, (e.clientY - rect.top) * scaleY);
        this.launchInterceptor(this.crosshairX, this.crosshairY);
      }
    };

    canvas.addEventListener("pointermove", this.boundPointerMove);
    canvas.addEventListener("pointerdown", this.boundPointerDown);
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.crosshairX = 300;
    this.crosshairY = 280;

    this.icbms = [];
    this.interceptors = [];
    this.explosions = [];

    this.silos = [
      { x: 140, y: 580, health: 4, maxHealth: 4, label: "SAM-1", alive: true },
      { x: 300, y: 580, health: 4, maxHealth: 4, label: "SAM-2", alive: true },
      { x: 460, y: 580, health: 4, maxHealth: 4, label: "SAM-3", alive: true },
    ];

    this.structures = [
      { type: "radio_tower", x: 45, y: 580, w: 24, h: 72, alive: true, health: 2, maxHealth: 2 },
      { type: "hangar", x: 85, y: 580, w: 38, h: 26, alive: true, health: 2, maxHealth: 2 },
      { type: "building", x: 195, y: 580, w: 42, h: 36, alive: true, health: 2, maxHealth: 2 },
      { type: "tower", x: 250, y: 580, w: 32, h: 70, alive: true, health: 3, maxHealth: 3 },
      { type: "tower", x: 350, y: 580, w: 32, h: 70, alive: true, health: 3, maxHealth: 3 },
      { type: "hangar", x: 405, y: 580, w: 38, h: 26, alive: true, health: 2, maxHealth: 2 },
      { type: "building", x: 520, y: 580, w: 44, h: 38, alive: true, health: 2, maxHealth: 2 },
      { type: "hangar", x: 570, y: 580, w: 28, h: 24, alive: true, health: 2, maxHealth: 2 },
    ];

    this.score = 0;
    this.wave = 1;
    this.totalIntercepts = 0;
    this.spawnTimer = 0;
    this.screenShake = 0;
    this.dayTimeProgress = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.animTime = 0;
  }

  private spawnICBM(): void {
    const startX = 30 + Math.random() * 540;
    const startY = 20;

    const aliveTargets = [
      ...this.silos.filter((s) => s.alive).map((s) => s.x),
      ...this.structures.filter((st) => st.alive).map((st) => st.x + st.w / 2),
    ];

    let targetX = 300;
    if (aliveTargets.length > 0 && Math.random() > 0.2) {
      targetX = aliveTargets[Math.floor(Math.random() * aliveTargets.length)];
    } else {
      targetX = 40 + Math.random() * 520;
    }
    const targetY = 580;

    const angle = Math.atan2(targetY - startY, targetX - startX);
    const speed = 80 + Math.min(180, this.wave * 12);

    this.icbms.push({
      id: Math.random(),
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      targetX,
      targetY,
      speed,
      angle,
      trail: [],
    });
  }

  public launchInterceptor(targetX: number, targetY: number): void {
    if (this.gameOver || this.isPaused) return;

    const activeSilos = this.silos.filter((s) => s.alive);
    let bestSilo = activeSilos.length > 0 ? activeSilos[0] : { x: 300, y: 580, alive: true, health: 1, maxHealth: 1, label: "EMERGENCY" };
    let minDist = Infinity;

    for (const s of activeSilos) {
      const d = Math.hypot(s.x - targetX, s.y - targetY);
      if (d < minDist) {
        minDist = d;
        bestSilo = s;
      }
    }

    const startX = bestSilo.x;
    const startY = bestSilo.y - 14;
    const angle = Math.atan2(targetY - startY, targetX - startX);

    this.interceptors.push({
      id: Math.random(),
      siloIndex: this.silos.indexOf(bestSilo as any),
      startX,
      startY,
      currentX: startX,
      currentY: startY,
      targetX,
      targetY,
      speed: 720,
      angle,
      trail: [],
    });

    this.ctx.audio?.playLaser?.();
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.animTime += dt;
    if (this.screenShake > 0) this.screenShake -= dt * 3;

    // Smooth, Majestic Day/Night Progression (0.0 to 1.0)
    this.dayTimeProgress = (this.dayTimeProgress + dt / this.dayCycleDuration) % 1.0;

    // Keyboard crosshair adjustment
    const cSpeed = 480;
    if (this.moveLeft) this.crosshairX -= cSpeed * dt;
    if (this.moveRight) this.crosshairX += cSpeed * dt;
    if (this.moveUp) this.crosshairY -= cSpeed * dt;
    if (this.moveDown) this.crosshairY += cSpeed * dt;

    this.crosshairX = Math.max(20, Math.min(580, this.crosshairX));
    this.crosshairY = Math.max(60, Math.min(560, this.crosshairY));

    // Spawn Incoming Ballistic Rockets
    this.spawnTimer += dt;
    const spawnRate = Math.max(0.45, 1.8 - this.wave * 0.1);
    if (this.spawnTimer >= spawnRate) {
      this.spawnTimer = 0;
      this.spawnICBM();
      if (this.wave > 3 && Math.random() > 0.6) {
        this.spawnICBM();
      }
    }

    // --- 1. Update Defense Interceptors ---
    for (let i = this.interceptors.length - 1; i >= 0; i--) {
      const m = this.interceptors[i];
      const dx = m.targetX - m.startX;
      const dy = m.targetY - m.startY;
      const totalDist = Math.hypot(dx, dy);
      const curDist = Math.hypot(m.currentX - m.startX, m.currentY - m.startY);

      if (curDist >= totalDist || totalDist < 6) {
        this.explosions.push({
          id: Math.random(),
          x: m.targetX,
          y: m.targetY,
          radius: 6,
          maxRadius: 46,
          expanding: true,
          intensity: 1.0,
          timer: 0,
        });

        this.interceptors.splice(i, 1);
        this.ctx.audio?.playExplosion?.();
      } else {
        m.currentX += (dx / totalDist) * m.speed * dt;
        m.currentY += (dy / totalDist) * m.speed * dt;

        m.trail.push({ x: m.currentX, y: m.currentY });
        if (m.trail.length > 16) m.trail.shift();
      }
    }

    // --- 2. Update Fireball Explosions ---
    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const exp = this.explosions[i];
      exp.timer += dt;

      if (exp.expanding) {
        exp.radius += 88 * dt;
        if (exp.radius >= exp.maxRadius) {
          exp.expanding = false;
        }
      } else {
        exp.radius -= 36 * dt;
        exp.intensity = Math.max(0, exp.radius / exp.maxRadius);
        if (exp.radius <= 0) {
          this.explosions.splice(i, 1);
        }
      }
    }

    // --- 3. Update Ballistic ICBMs ---
    for (let i = this.icbms.length - 1; i >= 0; i--) {
      const m = this.icbms[i];
      const dx = m.targetX - m.startX;
      const dy = m.targetY - m.startY;
      const totalDist = Math.hypot(dx, dy);

      m.currentX += (dx / totalDist) * m.speed * dt;
      m.currentY += (dy / totalDist) * m.speed * dt;

      m.trail.push({ x: m.currentX, y: m.currentY });
      if (m.trail.length > 20) m.trail.shift();

      let destroyed = false;
      for (const exp of this.explosions) {
        const dist = Math.hypot(m.currentX - exp.x, m.currentY - exp.y);
        if (dist <= exp.radius + 6) {
          destroyed = true;
          this.score += 100;
          this.totalIntercepts++;
          this.ctx.audio?.playHit?.();

          globalParticles.emitBurst(m.currentX, m.currentY, 20, ["#FFD84D", "#F97316", "#EF4444", "#FFFFFF"], 70, 220);
          globalParticles.emitText(dist < exp.radius * 0.4 ? "SKILL SHOT! +150" : "+100", m.currentX, m.currentY - 14, "#FACC15", 13);
          if (dist < exp.radius * 0.4) this.score += 50;
          break;
        }
      }

      if (destroyed) {
        this.icbms.splice(i, 1);
        continue;
      }

      if (m.currentY >= 580) {
        this.icbms.splice(i, 1);
        this.screenShake = 0.5;
        this.ctx.audio?.playExplosion?.();

        globalParticles.emitBurst(m.currentX, 580, 28, ["#EF4444", "#F59E0B", "#1E293B", "#FFFFFF"], 90, 280);

        for (const s of this.silos) {
          if (s.alive && Math.abs(m.currentX - s.x) < 32) {
            s.health--;
            if (s.health <= 0) s.alive = false;
          }
        }

        for (const st of this.structures) {
          if (st.alive && m.currentX >= st.x && m.currentX <= st.x + st.w) {
            st.health--;
            if (st.health <= 0) st.alive = false;
          }
        }

        if (!this.silos.some((s) => s.alive)) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
          this.ctx.audio?.playGameOver?.();
        }
      }
    }

    // Continuous Endless Wave Progression
    if (this.totalIntercepts >= this.wave * 15) {
      this.wave++;
      this.ctx.audio?.playVictory?.();
      for (const s of this.silos) {
        if (s.alive && s.health < s.maxHealth) s.health++;
      }
      globalParticles.emitText(`WAVE ${this.wave} SECTOR SECURED!`, 300, 300, "#22C55E", 20);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;
    if ((action === "ACTION_PRIMARY" || action === "CONFIRM") && isPressed) {
      this.launchInterceptor(this.crosshairX, this.crosshairY);
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

  private getInterpolatedAtmosphere(t: number) {
    // Find the two keyframes to interpolate between
    let kf1 = SKY_KEYFRAMES[0];
    let kf2 = SKY_KEYFRAMES[1];
    let segT = 0;

    for (let i = 0; i < SKY_KEYFRAMES.length; i++) {
      const current = SKY_KEYFRAMES[i];
      const next = SKY_KEYFRAMES[(i + 1) % SKY_KEYFRAMES.length];

      let nextPos = next.pos;
      if (nextPos <= current.pos) nextPos += 1.0;

      let normT = t;
      if (normT < current.pos) normT += 1.0;

      if (normT >= current.pos && normT < nextPos) {
        kf1 = current;
        kf2 = next;
        segT = (normT - current.pos) / (nextPos - current.pos);
        break;
      }
    }

    // Smooth Hermite easing for silky transitions
    const smoothT = segT * segT * (3 - 2 * segT);

    return {
      top: lerpColor(kf1.top, kf2.top, smoothT),
      mid: lerpColor(kf1.mid, kf2.mid, smoothT),
      bot: lerpColor(kf1.bot, kf2.bot, smoothT),
      mountain: lerpColor(kf1.mountain, kf2.mountain, smoothT),
      grass: lerpColor(kf1.grass, kf2.grass, smoothT),
    };
  }

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

    const t = this.dayTimeProgress;
    const atmo = this.getInterpolatedAtmosphere(t);

    // Smooth Night Darkness Factor (0 = full day, 1.0 = deep night)
    const nightFactor = Math.max(0, Math.sin(t * Math.PI * 2 - Math.PI / 4));

    // --- 1. Continuous Linear Color-Interpolated Sky ---
    if (ctx2d) {
      const skyGrad = ctx2d.createLinearGradient(0, 0, 0, 580);
      skyGrad.addColorStop(0, colorToString(atmo.top));
      skyGrad.addColorStop(0.5, colorToString(atmo.mid));
      skyGrad.addColorStop(1, colorToString(atmo.bot));
      ctx2d.fillStyle = skyGrad;
      ctx2d.fillRect(0, 0, w, 580);
    } else {
      pr.drawRect(0, 0, w, 580, colorToString(atmo.mid), true);
    }

    // --- 2. Smoothly Fading Night Stars ---
    if (nightFactor > 0.05) {
      for (const s of this.stars) {
        const twinkle = (Math.sin(this.animTime * 3 + s.twinkle) + 1) * 0.5;
        const starAlpha = nightFactor * (0.35 + twinkle * 0.65);
        pr.drawCircle(s.x, s.y, s.size, `rgba(255, 255, 255, ${starAlpha})`, true);
      }
    }

    // --- 3. Sun & Moon Celestial Orbit ---
    const sunAngle = (t * Math.PI * 2) - Math.PI / 2;
    const sunOrbitX = w / 2 + Math.cos(sunAngle) * 260;
    const sunOrbitY = 320 + Math.sin(sunAngle) * 240;

    const moonAngle = sunAngle + Math.PI;
    const moonOrbitX = w / 2 + Math.cos(moonAngle) * 260;
    const moonOrbitY = 320 + Math.sin(moonAngle) * 240;

    // Smooth Sun Fade
    if (sunOrbitY < 580) {
      const sunHeightRatio = Math.max(0, Math.min(1, (580 - sunOrbitY) / 200));
      pr.drawCircle(sunOrbitX, sunOrbitY, 36 * sunHeightRatio, `rgba(254, 240, 138, ${0.25 * sunHeightRatio})`, true);
      pr.drawCircle(sunOrbitX, sunOrbitY, 22 * sunHeightRatio, `rgba(254, 240, 138, ${0.5 * sunHeightRatio})`, true);
      pr.drawCircle(sunOrbitX, sunOrbitY, 14 * sunHeightRatio, "#FEF08A", true);
      pr.drawCircle(sunOrbitX, sunOrbitY, 8 * sunHeightRatio, "#FFFFFF", true);
    }

    // Smooth Moon Fade
    if (moonOrbitY < 580) {
      const moonHeightRatio = Math.max(0, Math.min(1, (580 - moonOrbitY) / 200));
      pr.drawCircle(moonOrbitX, moonOrbitY, 28 * moonHeightRatio, `rgba(224, 242, 254, ${0.2 * moonHeightRatio})`, true);
      pr.drawCircle(moonOrbitX, moonOrbitY, 18 * moonHeightRatio, "#E0F2FE", true);
      pr.drawCircle(moonOrbitX - 4 * moonHeightRatio, moonOrbitY - 4 * moonHeightRatio, 15 * moonHeightRatio, colorToString(atmo.top), true);
    }

    // --- 4. Distant Mountains with Smooth Lighting ---
    if (ctx2d) {
      ctx2d.fillStyle = colorToString(atmo.mountain);
      ctx2d.beginPath();
      ctx2d.moveTo(220, 580);
      ctx2d.lineTo(340, 430);
      ctx2d.lineTo(440, 580);
      ctx2d.closePath();
      ctx2d.fill();

      ctx2d.fillStyle = colorToString(lerpColor(atmo.mountain, { r: 15, g: 23, b: 42 }, 0.25));
      ctx2d.beginPath();
      ctx2d.moveTo(120, 580);
      ctx2d.lineTo(210, 480);
      ctx2d.lineTo(300, 580);
      ctx2d.closePath();
      ctx2d.fill();
    }

    // Smooth Searchlight Beams during Night
    if (nightFactor > 0.2) {
      const beamSweep1 = Math.sin(this.animTime * 1.2) * 80;
      const beamSweep2 = -Math.cos(this.animTime * 1.4) * 80;
      const beamAlpha = (nightFactor - 0.2) * 0.35;
      pr.drawLine(266, 510, 266 + beamSweep1, 140, `rgba(254, 240, 138, ${beamAlpha})`, 8);
      pr.drawLine(366, 510, 366 + beamSweep2, 140, `rgba(254, 240, 138, ${beamAlpha})`, 8);
    }

    // Palm Trees along coast
    const palmPositions = [35, 75, 175, 310, 410, 490, 550];
    for (const px of palmPositions) {
      pr.drawLine(px, 580, px - 3, 535, colorToString(atmo.mountain), 3);
      for (let fa = -1.2; fa <= 1.2; fa += 0.5) {
        pr.drawLine(px - 3, 535, px - 3 + Math.cos(fa) * 16, 535 - Math.sin(fa) * 10, colorToString(atmo.grass), 2);
      }
    }

    // --- 5. Ground Terrain ---
    pr.drawRect(0, 580, w, 120, colorToString(atmo.grass), true);
    pr.drawRect(0, 586, w, 114, colorToString(lerpColor(atmo.grass, { r: 2, g: 44, b: 34 }, 0.4)), true);
    pr.drawLine(0, 580, w, 580, colorToString(lerpColor(atmo.grass, { r: 74, g: 222, b: 128 }, 0.5)), 2);

    // --- 6. Base Structures with Smooth Lighting ---
    for (const st of this.structures) {
      if (!st.alive) {
        pr.drawRect(st.x, 580 - 6, st.w, 6, "#334155", true);
        continue;
      }

      if (st.type === "tower") {
        pr.drawRect(st.x, 580 - st.h, st.w, st.h, colorToString(lerpColor({ r: 203, g: 213, b: 225 }, { r: 71, g: 85, b: 105 }, nightFactor)), true);
        pr.drawRect(st.x, 580 - st.h, st.w, st.h, "#1E293B", false);
        pr.drawRect(st.x - 4, 580 - st.h, st.w + 8, 14, "#1E293B", true);
        pr.drawRect(st.x + 4, 580 - st.h + 3, st.w - 8, 6, nightFactor > 0.3 ? "#FEF08A" : "#00F0FF", true);
        pr.drawRect(st.x + 8, 580 - 35, 6, 8, "#0F172A", true);
      } else if (st.type === "hangar") {
        pr.drawRect(st.x, 580 - st.h, st.w, st.h, colorToString(lerpColor({ r: 63, g: 98, b: 18 }, { r: 20, g: 45, b: 10 }, nightFactor)), true);
        pr.drawRect(st.x, 580 - st.h, st.w, st.h, "#0F172A", false);
        pr.drawText("WI-12", st.x + st.w / 2, 580 - st.h + 12, { size: 7, color: "#FEF08A", align: "center", font: "monospace" });
      } else if (st.type === "radio_tower") {
        pr.drawLine(st.x + 4, 580, st.x + 12, 580 - st.h, "#64748B", 2);
        pr.drawLine(st.x + 20, 580, st.x + 12, 580 - st.h, "#64748B", 2);
        pr.drawLine(st.x + 6, 580 - 30, st.x + 18, 580 - 30, "#64748B", 2);
        const beaconFlash = Math.sin(this.animTime * 6) > 0;
        pr.drawCircle(st.x + 12, 580 - st.h, 4, beaconFlash ? "#EF4444" : "#7F1D1D", true);
      } else {
        pr.drawRect(st.x, 580 - st.h, st.w, st.h, colorToString(lerpColor({ r: 226, g: 232, b: 240 }, { r: 100, g: 116, b: 139 }, nightFactor)), true);
        pr.drawRect(st.x, 580 - st.h, st.w, st.h, "#1E293B", false);
        pr.drawRect(st.x - 2, 580 - st.h - 4, st.w + 4, 4, "#991B1B", true);
        for (let wy = 580 - st.h + 6; wy < 580 - 6; wy += 10) {
          pr.drawRect(st.x + 4, wy, 6, 6, nightFactor > 0.3 ? "#FEF08A" : "#38BDF8", true);
          pr.drawRect(st.x + 16, wy, 6, 6, nightFactor > 0.3 ? "#FEF08A" : "#38BDF8", true);
          pr.drawRect(st.x + 28, wy, 6, 6, nightFactor > 0.3 ? "#FEF08A" : "#38BDF8", true);
        }
      }

      const hbW = Math.max(24, st.w);
      const hbX = st.x + st.w / 2 - hbW / 2;
      const hbY = 580 - st.h - 10;
      pr.drawRect(hbX, hbY, hbW, 4, "#000000", true);
      pr.drawRect(hbX, hbY, (st.health / st.maxHealth) * hbW, 4, "#EF4444", true);
    }

    // --- 7. SAM Missile Defense Batteries ---
    for (const s of this.silos) {
      if (s.alive) {
        pr.drawRect(s.x - 14, 580 - 18, 28, 18, "#1E293B", true);
        pr.drawRect(s.x - 14, 580 - 18, 28, 18, "#64748B", false);

        const aimAng = Math.atan2(this.crosshairY - s.y, this.crosshairX - s.x);
        const tubeLen = 16;
        pr.drawLine(s.x, s.y - 10, s.x + Math.cos(aimAng) * tubeLen, s.y - 10 + Math.sin(aimAng) * tubeLen, "#38BDF8", 5);
        pr.drawLine(s.x, s.y - 10, s.x + Math.cos(aimAng) * tubeLen, s.y - 10 + Math.sin(aimAng) * tubeLen, "#FFFFFF", 2);

        pr.drawRect(s.x - 18, 580 - 28, 36, 5, "#000000", true);
        pr.drawRect(s.x - 18, 580 - 28, (s.health / s.maxHealth) * 36, 5, "#38BDF8", true);
        pr.drawText(s.label, s.x, 580 + 14, { size: 9, color: "#FFFFFF", align: "center", font: "monospace" });
      } else {
        pr.drawRect(s.x - 14, 580 - 8, 28, 8, "#334155", true);
      }
    }

    // --- 8. Interceptor Rocket Trails ---
    for (const im of this.interceptors) {
      for (let i = 0; i < im.trail.length - 1; i++) {
        const p1 = im.trail[i];
        const p2 = im.trail[i + 1];
        const alpha = (i / im.trail.length) * 0.7;
        pr.drawLine(p1.x, p1.y, p2.x, p2.y, `rgba(255, 255, 255, ${alpha})`, 3);
      }

      pr.save();
      pr.translate(im.currentX, im.currentY);
      pr.rotate(im.angle);
      pr.drawRect(-6, -3, 12, 6, "#FFFFFF", true);
      pr.drawRect(-4, -2, 8, 4, "#38BDF8", true);
      pr.drawCircle(6, 0, 3.5, "#F97316", true);
      pr.restore();
    }

    // --- 9. Incoming Red-Finned Ballistic Rockets ---
    for (const m of this.icbms) {
      for (let i = 0; i < m.trail.length - 1; i++) {
        const p1 = m.trail[i];
        const p2 = m.trail[i + 1];
        const alpha = (i / m.trail.length) * 0.55;
        pr.drawLine(p1.x, p1.y, p2.x, p2.y, nightFactor > 0.3 ? `rgba(244, 63, 94, ${alpha})` : `rgba(203, 213, 225, ${alpha})`, 2.5);
      }

      pr.save();
      pr.translate(m.currentX, m.currentY);
      pr.rotate(m.angle);

      pr.drawRect(-7, -4, 14, 8, "#000000", true);
      pr.drawRect(-6, -3, 12, 6, "#FFFFFF", true);
      pr.drawRect(2, -3, 4, 6, "#EF4444", true);
      pr.drawCircle(6, 0, 3, "#EF4444", true);

      pr.drawRect(-7, -6, 3, 3, "#EF4444", true);
      pr.drawRect(-7, 3, 3, 3, "#EF4444", true);

      pr.restore();
    }

    // --- 10. Multi-Layer Fireball Flak Explosions ---
    for (const exp of this.explosions) {
      pr.drawCircle(exp.x, exp.y, exp.radius, "rgba(249, 115, 22, 0.4)", true);
      pr.drawCircle(exp.x, exp.y, exp.radius * 0.8, "#F97316", true);
      pr.drawCircle(exp.x, exp.y, exp.radius * 0.55, "#FDE047", true);
      pr.drawCircle(exp.x, exp.y, exp.radius * 0.28, "#FFFFFF", true);
    }

    // Particle Bursts
    globalParticles.render(pr);

    // --- 11. Tactical Targeting Reticle ---
    pr.drawCircle(this.crosshairX, this.crosshairY, 12, "rgba(0, 0, 0, 0.4)", false);
    pr.drawCircle(this.crosshairX, this.crosshairY, 11, nightFactor > 0.3 ? "#00F0FF" : "#FFFFFF", false);
    pr.drawCircle(this.crosshairX, this.crosshairY, 3, "#EF4444", true);
    pr.drawLine(this.crosshairX - 16, this.crosshairY, this.crosshairX + 16, this.crosshairY, nightFactor > 0.3 ? "#00F0FF" : "#FFFFFF", 1.5);
    pr.drawLine(this.crosshairX, this.crosshairY - 16, this.crosshairX, this.crosshairY + 16, nightFactor > 0.3 ? "#00F0FF" : "#FFFFFF", 1.5);

    pr.restore();

    // --- 12. Top Modern Tactical HUD ---
    pr.drawRect(12, 12, w - 24, 44, "rgba(15, 23, 42, 0.94)", true);
    pr.drawRect(12, 12, w - 24, 44, "#38BDF8", false);

    // Time of Day Label
    let todName = "☀️ DAYLIGHT";
    if (t >= 0.22 && t < 0.42) todName = "🌅 SUNSET";
    else if (t >= 0.42 && t < 0.72) todName = "🌙 MIDNIGHT";
    else if (t >= 0.72 && t < 0.90) todName = "🌄 DAWN";

    pr.drawText(`SCORE: ${this.score}`, 24, 28, { size: 14, color: "#FFD84D", font: "monospace" });
    pr.drawText(`WAVE ${this.wave} • ${todName}`, w / 2, 28, { size: 12, color: "#38BDF8", align: "center", font: "monospace" });
    pr.drawText("AMMO: ∞ UNLIMITED", w - 24, 28, { size: 13, color: "#22C55E", align: "right", font: "monospace" });

    // Controls Legend (Bottom-Left)
    pr.drawRect(16, h - 28, 340, 20, "rgba(15, 23, 42, 0.9)", true);
    pr.drawText("[POINT & CLICK: UNLIMITED INTERCEPTORS  •  R: RESTART]", 186, h - 15, {
      size: 9,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(15, 23, 42, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#EF4444", false);
      pr.drawText("ALL DEFENSE SILOS DESTROYED — DEFENSE FAILED", w / 2, h / 2 - 12, { size: 18, color: "#EF4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO REBUILD DEFENSE BASE", w / 2, h / 2 + 18, { size: 12, color: "#CBD5E1", align: "center", font: "monospace" });
    }
  }
}
