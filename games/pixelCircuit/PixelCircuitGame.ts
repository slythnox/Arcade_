import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import { drawRearViewKart, KART_PALETTES, type KartPalette } from "./kartSprite";

export type KartItemType =
  | "nitro_cell"
  | "oil_blob"
  | "pulse_mine"
  | "rocket_pod"
  | "shield_core"
  | "emp_burst";

interface BiomeTheme {
  name: string;
  skyTop: string;
  skyMid: string;
  skyHorizon: string;
  mountainCol: string;
  cityCol: string;
  grassLight: string;
  grassDark: string;
  asphaltLight: string;
  asphaltDark: string;
  kerbLight: string;
  kerbDark: string;
}

const BIOMES: BiomeTheme[] = [
  // 1. Neon Cyber Metropolis
  {
    name: "CYBER METROPOLIS",
    skyTop: "#050814",
    skyMid: "#1E1B4B",
    skyHorizon: "#3B82F6",
    mountainCol: "#0F172A",
    cityCol: "#312E81",
    grassLight: "#064E3B",
    grassDark: "#022C22",
    asphaltLight: "#1E293B",
    asphaltDark: "#0F172A",
    kerbLight: "#00F0FF",
    kerbDark: "#A855F7",
  },
  // 2. Sunset Coastal GP
  {
    name: "SUNSET COAST",
    skyTop: "#1E1B4B",
    skyMid: "#831843",
    skyHorizon: "#EA580C",
    mountainCol: "#4C0519",
    cityCol: "#881337",
    grassLight: "#15803D",
    grassDark: "#166534",
    asphaltLight: "#334155",
    asphaltDark: "#1E293B",
    kerbLight: "#EF4444",
    kerbDark: "#FFFFFF",
  },
  // 3. Alpine Glacier Pass
  {
    name: "ALPINES",
    skyTop: "#0C4A6E",
    skyMid: "#0284C7",
    skyHorizon: "#E0F2FE",
    mountainCol: "#F8FAFC",
    cityCol: "#0369A1",
    grassLight: "#E2E8F0",
    grassDark: "#CBD5E1",
    asphaltLight: "#38BDF8",
    asphaltDark: "#0284C7",
    kerbLight: "#0284C7",
    kerbDark: "#FFFFFF",
  },
  // 4. Magma Speedway
  {
    name: "MAGMA FOUNDRY",
    skyTop: "#450A0A",
    skyMid: "#7F1D1D",
    skyHorizon: "#F97316",
    mountainCol: "#1C1917",
    cityCol: "#78350F",
    grassLight: "#7C2D12",
    grassDark: "#431407",
    asphaltLight: "#1C1917",
    asphaltDark: "#0C0A09",
    kerbLight: "#F97316",
    kerbDark: "#FACC15",
  },
];

interface RoadSegment {
  index: number;
  worldZ: number;
  curve: number;
  hill: number;
  biomeIdx: number;
  hasItemBox: boolean;
  hasTurboPad: boolean;
  hasBillboard: boolean;
  billboardText: string;
}

interface AIRacer {
  id: number;
  name: string;
  worldZ: number;
  laneOffset: number;
  speed: number;
  baseSpeed: number;
  palette: KartPalette;
  spinoutTimer: number;
  lap: number;
}

interface ActiveHazard {
  id: number;
  type: "oil" | "mine";
  worldZ: number;
  laneOffset: number;
  timer: number;
}

export class PixelCircuitGame implements GameInstance {
  private ctx!: GameContext;

  private score: number = 0;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private animTime: number = 0;

  // Road Configuration
  private readonly segmentLength: number = 200;
  private readonly totalSegments: number = 500; // 100,000 px circuit
  private readonly roadWidth: number = 2200;
  private readonly drawDistance: number = 180;
  private readonly cameraHeight: number = 950;
  private readonly cameraDepth: number = 0.88;

  private road: RoadSegment[] = [];
  private trackLength: number = 0;

  // Player State (Continuous Flow Physics)
  private playerZ: number = 0;
  private playerX: number = 0;
  private speed: number = 0;
  private maxSpeed: number = 2400;
  private accel: number = 2000;
  private lap: number = 1;
  private rank: number = 1;

  // Dynamic Impact & Spinout State
  private spinoutTimer: number = 0;
  private wallScrapeTimer: number = 0;
  private screenShake: number = 0;

  // Drift & Turbo
  private isDrifting: boolean = false;
  private driftDir: number = 0;
  private driftTime: number = 0;
  private boostTimer: number = 0;
  private hasShield: boolean = false;
  private heldItem: KartItemType | null = null;

  // Persistent Input States
  private keyLeft: boolean = false;
  private keyRight: boolean = false;
  private keyAccel: boolean = false;
  private keyBrake: boolean = false;
  private keyDrift: boolean = false;

  // Entities
  private aiRacers: AIRacer[] = [];
  private hazards: ActiveHazard[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.buildSmoothTrack();
    this.reset();
  }

  private buildSmoothTrack(): void {
    this.road = [];
    this.trackLength = this.totalSegments * this.segmentLength;

    const billboards = ["ARCADE_ GP", "TURBO NITRO", "DRIFT KING", "HYPER BOOST", "HIGH SPEED", "GRAND PRIX"];

    for (let i = 0; i < this.totalSegments; i++) {
      const biomeIdx = Math.floor((i / this.totalSegments) * BIOMES.length);
      const progress = i / this.totalSegments;

      let curve = 0;
      if (progress > 0.06 && progress < 0.20) {
        curve = Math.sin((progress - 0.06) * Math.PI * 4) * 1.5;
      } else if (progress > 0.30 && progress < 0.44) {
        curve = -Math.sin((progress - 0.30) * Math.PI * 4) * 1.7;
      } else if (progress > 0.54 && progress < 0.70) {
        curve = Math.sin((progress - 0.54) * Math.PI * 3.5) * 1.3;
      } else if (progress > 0.80 && progress < 0.94) {
        curve = -Math.sin((progress - 0.80) * Math.PI * 4) * 1.5;
      }

      const hasItemBox = i % 35 === 0;
      const hasTurboPad = i % 70 === 18;
      const hasBillboard = i % 28 === 0;

      this.road.push({
        index: i,
        worldZ: i * this.segmentLength,
        curve,
        hill: Math.sin(i * 0.05) * 15,
        biomeIdx,
        hasItemBox,
        hasTurboPad,
        hasBillboard,
        billboardText: billboards[Math.floor(i / 28) % billboards.length],
      });
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.isPaused = false;
    this.gameOver = false;
    this.animTime = 0;

    this.playerZ = 0;
    this.playerX = -0.25;
    this.speed = 0;
    this.lap = 1;
    this.rank = 4;
    this.spinoutTimer = 0;
    this.wallScrapeTimer = 0;
    this.screenShake = 0;
    this.isDrifting = false;
    this.driftDir = 0;
    this.driftTime = 0;
    this.boostTimer = 0;
    this.hasShield = false;
    this.heldItem = null;

    // AI Rivals on Starting Grid
    this.aiRacers = [
      {
        id: 1,
        name: "LUIGI",
        worldZ: 160,
        laneOffset: 0.35,
        speed: 0,
        baseSpeed: 2150,
        palette: KART_PALETTES.green,
        spinoutTimer: 0,
        lap: 1,
      },
      {
        id: 2,
        name: "TOAD",
        worldZ: 320,
        laneOffset: -0.35,
        speed: 0,
        baseSpeed: 2200,
        palette: KART_PALETTES.blue,
        spinoutTimer: 0,
        lap: 1,
      },
      {
        id: 3,
        name: "WARIO",
        worldZ: 480,
        laneOffset: 0.2,
        speed: 0,
        baseSpeed: 2250,
        palette: KART_PALETTES.yellow,
        spinoutTimer: 0,
        lap: 1,
      },
    ];

    this.hazards = [];
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.isPaused || this.gameOver) return;

    this.animTime += dt;
    if (this.screenShake > 0) this.screenShake -= dt * 3;
    if (this.wallScrapeTimer > 0) this.wallScrapeTimer -= dt;

    // --- 1. Robust Player Acceleration & Movement (Continuous Throttle) ---
    if (this.boostTimer > 0) this.boostTimer -= dt;
    const topSpeed = this.boostTimer > 0 ? 3200 : this.maxSpeed;

    if (this.spinoutTimer > 0) {
      this.spinoutTimer -= dt;
      // Partial deceleration during spinout without dead stop
      this.speed = Math.max(400, this.speed - 1600 * dt);
    } else {
      // Throttle Application: Works continuously even after bumps or scrapes!
      if (this.keyAccel) {
        this.speed = Math.min(topSpeed, this.speed + this.accel * dt);
      } else if (this.keyBrake) {
        this.speed = Math.max(0, this.speed - 2600 * dt);
      } else {
        // Natural rolling deceleration
        this.speed = Math.max(0, this.speed - 450 * dt);
      }

      // Responsive Steering
      let steer = 0;
      if (this.keyLeft) steer -= 1;
      if (this.keyRight) steer += 1;

      // Drift Mode
      const isTryingToDrift = this.keyDrift && steer !== 0 && this.speed > 700;
      if (isTryingToDrift && !this.isDrifting) {
        this.isDrifting = true;
        this.driftDir = steer;
        this.driftTime = 0;
        this.ctx.audio?.playRotate?.();
      } else if (!this.keyDrift && this.isDrifting) {
        if (this.driftTime > 1.2) {
          this.speed = 3000;
          this.boostTimer = 1.4;
          this.ctx.audio?.playPowerUp?.();
          globalParticles.emitBurst(300, 560, 28, ["#00F0FF", "#F97316", "#C084FC"], 90, 300);
          globalParticles.emitText("SUPER MINI-TURBO!", 300, 480, "#C084FC", 15);
        } else if (this.driftTime > 0.4) {
          this.speed = 2600;
          this.boostTimer = 0.8;
          this.ctx.audio?.playPowerUp?.();
          globalParticles.emitBurst(300, 560, 18, ["#00F0FF", "#FFFFFF"], 60, 220);
          globalParticles.emitText("MINI-TURBO!", 300, 480, "#00F0FF", 13);
        }
        this.isDrifting = false;
        this.driftTime = 0;
      }

      if (this.isDrifting) {
        this.driftTime += dt;
        steer *= 1.4;
      }

      // Centrifugal Curve Push
      const currentSegmentIdx = Math.floor(this.playerZ / this.segmentLength) % this.totalSegments;
      const currentSegment = this.road[currentSegmentIdx];
      const curvePush = currentSegment.curve * (this.speed / this.maxSpeed) * 0.65;

      this.playerX += (steer * 3.6 - curvePush) * dt;

      // --- IMPROVED ELASTIC BOUNDARY COLLISION LOGIC ---
      // When player reaches track edge, apply elastic guardrail bounce & sparks instead of stopping!
      if (Math.abs(this.playerX) >= 1.0) {
        const wallSide = Math.sign(this.playerX);
        // Elastic rebound toward center
        this.playerX = wallSide * 0.97;
        this.speed = Math.max(500, this.speed * 0.94); // Slight friction penalty, never freezing!

        if (this.wallScrapeTimer <= 0) {
          this.wallScrapeTimer = 0.15;
          this.screenShake = 0.25;
          this.ctx.audio?.playHit?.();

          // Guardrail friction sparks
          const sparkX = wallSide > 0 ? 370 : 230;
          globalParticles.emitBurst(sparkX, 570, 10, ["#FFFFFF", "#FACC15", "#F97316"], 50, 180);
        }
      }

      // Turbo Pad Trigger
      if (currentSegment.hasTurboPad && Math.abs(this.playerX) < 0.5) {
        this.speed = 3200;
        this.boostTimer = 1.4;
        this.ctx.audio?.playLaser?.();
        globalParticles.emitBurst(300, 560, 20, ["#FDE047", "#F59E0B"], 70, 240);
        globalParticles.emitText("BOOST PAD!", 300, 480, "#FDE047", 14);
      }

      // Item Box Trigger
      if (currentSegment.hasItemBox && Math.abs(this.playerX) < 0.5 && !this.heldItem) {
        const items: KartItemType[] = ["nitro_cell", "oil_blob", "pulse_mine", "rocket_pod", "shield_core", "emp_burst"];
        this.heldItem = items[Math.floor(Math.random() * items.length)];
        this.ctx.audio?.playCoin?.();
        globalParticles.emitBurst(300, 560, 20, ["#FFD84D", "#00F0FF", "#FFFFFF"], 70, 240);
        globalParticles.emitText(`ITEM: ${this.heldItem.toUpperCase().replace("_", " ")}`, 300, 480, "#FFD84D", 14);
      }
    }

    // Advance forward continuously
    this.playerZ += this.speed * dt;

    // Lap Progression Cycle
    if (this.playerZ >= this.trackLength) {
      this.playerZ -= this.trackLength;
      this.lap++;
      this.score += 5000;
      this.ctx.audio?.playVictory?.();
      globalParticles.emitText(`LAP ${this.lap}!`, 300, 300, "#22C55E", 22);
    }

    // --- 2. Opponent AI & Kart Collision Physics ---
    for (let i = 0; i < this.aiRacers.length; i++) {
      const ai = this.aiRacers[i];

      if (ai.spinoutTimer > 0) {
        ai.spinoutTimer -= dt;
        ai.speed = Math.max(400, ai.speed - 1600 * dt);
      } else {
        const distToPlayer = ai.worldZ - this.playerZ;
        const rubberband = distToPlayer > 1400 ? 0.85 : distToPlayer < -800 ? 1.2 : 1.0;
        const targetSpeed = ai.baseSpeed * rubberband;

        ai.speed += (targetSpeed - ai.speed) * 2 * dt;

        const aiSegIdx = Math.floor(ai.worldZ / this.segmentLength) % this.totalSegments;
        const aiSeg = this.road[aiSegIdx];
        ai.laneOffset += (-aiSeg.curve * 0.3 - ai.laneOffset) * 2.5 * dt;

        ai.worldZ += ai.speed * dt;

        if (ai.worldZ >= this.trackLength) {
          ai.worldZ -= this.trackLength;
          ai.lap++;
        }
      }

      // --- PLAYER <-> OPPONENT COLLISION PHYSICS ---
      const deltaZ = Math.abs(this.playerZ - ai.worldZ);
      const deltaX = Math.abs(this.playerX - ai.laneOffset);

      if (deltaZ < 75 && deltaX < 0.32) {
        this.ctx.audio?.playHit?.();
        this.screenShake = 0.3;
        globalParticles.emitBurst(300, 560, 14, ["#FFFFFF", "#FACC15", "#EF4444"], 60, 200);

        const isRearEnd = this.playerZ < ai.worldZ && this.speed > ai.speed;
        const isTboneRam = Math.abs(this.speed - ai.speed) > 1000;

        if (isTboneRam) {
          if (this.speed > ai.speed) {
            ai.spinoutTimer = 0.8;
            ai.speed *= 0.6;
            globalParticles.emitText("OPPONENT RAMMED!", 300, 480, "#FACC15", 14);
          } else {
            this.spinoutTimer = 0.6;
            this.speed = Math.max(600, this.speed * 0.7);
            globalParticles.emitText("BUMPED!", 300, 480, "#EF4444", 14);
          }
        } else if (isRearEnd) {
          ai.speed += 350;
          this.speed = Math.max(600, this.speed * 0.85);
          globalParticles.emitText("BUMP!", 300, 480, "#FFFFFF", 12);
        } else {
          const bumpDir = this.playerX > ai.laneOffset ? 1 : -1;
          this.playerX += bumpDir * 0.18;
          ai.laneOffset -= bumpDir * 0.18;
          this.speed = Math.max(600, this.speed * 0.92);
          ai.speed = Math.max(600, ai.speed * 0.92);
        }
      }

      // AI <-> AI Collision
      for (let j = i + 1; j < this.aiRacers.length; j++) {
        const otherAI = this.aiRacers[j];
        const aiDistZ = Math.abs(ai.worldZ - otherAI.worldZ);
        const aiDistX = Math.abs(ai.laneOffset - otherAI.laneOffset);

        if (aiDistZ < 70 && aiDistX < 0.28) {
          const repulseDir = ai.laneOffset > otherAI.laneOffset ? 1 : -1;
          ai.laneOffset += repulseDir * 0.15;
          otherAI.laneOffset -= repulseDir * 0.15;
        }
      }

      // AI <-> Hazard Collision
      for (const h of this.hazards) {
        if (Math.abs(ai.worldZ - h.worldZ) < 80 && Math.abs(ai.laneOffset - h.laneOffset) < 0.35) {
          ai.spinoutTimer = 0.8;
          ai.speed *= 0.5;
          globalParticles.emitBurst(300, 400, 18, ["#0F172A", "#EF4444", "#FFFFFF"], 50, 180);
        }
      }
    }

    // --- 3. Update Hazards ---
    for (let i = this.hazards.length - 1; i >= 0; i--) {
      const h = this.hazards[i];
      h.timer -= dt;

      const distZ = Math.abs(this.playerZ - h.worldZ);
      if (distZ < 90 && Math.abs(this.playerX - h.laneOffset) < 0.4) {
        if (this.hasShield) {
          this.hasShield = false;
          globalParticles.emitText("SHIELD DEFLECTED!", 300, 500, "#00F0FF", 14);
        } else {
          this.spinoutTimer = 0.8;
          this.ctx.audio?.playExplosion?.();
          globalParticles.emitBurst(300, 560, 22, ["#1E293B", "#F59E0B", "#DC2626"], 60, 220);
          globalParticles.emitText(h.type === "mine" ? "MINE DETONATED!" : "SPIN OUT!", 300, 500, "#DC2626", 14);
        }
        this.hazards.splice(i, 1);
        continue;
      }
      if (h.timer <= 0) this.hazards.splice(i, 1);
    }

    // --- 4. Live Leaderboard Standings ---
    const allProgress = [
      { id: 0, score: (this.lap - 1) * this.trackLength + this.playerZ },
      ...this.aiRacers.map((ai) => ({ id: ai.id, score: (ai.lap - 1) * this.trackLength + ai.worldZ })),
    ].sort((a, b) => b.score - a.score);

    this.rank = allProgress.findIndex((p) => p.id === 0) + 1;
  }

  private triggerItem(): void {
    if (!this.heldItem) return;
    const item = this.heldItem;
    this.heldItem = null;

    switch (item) {
      case "nitro_cell":
        this.speed = 3200;
        this.boostTimer = 2.0;
        this.ctx.audio?.playPowerUp?.();
        globalParticles.emitBurst(300, 560, 32, ["#00F0FF", "#38BDF8", "#FFFFFF"], 100, 340);
        globalParticles.emitText("NITRO BOOST!", 300, 480, "#00F0FF", 16);
        break;

      case "oil_blob":
        this.hazards.push({
          id: Math.random(),
          type: "oil",
          worldZ: this.playerZ - 80,
          laneOffset: this.playerX,
          timer: 16,
        });
        this.ctx.audio?.playDrop?.();
        globalParticles.emitText("OIL SLICK DROPPED", 300, 500, "#0F172A", 12);
        break;

      case "pulse_mine":
        this.hazards.push({
          id: Math.random(),
          type: "mine",
          worldZ: this.playerZ - 90,
          laneOffset: this.playerX,
          timer: 18,
        });
        this.ctx.audio?.playHit?.();
        globalParticles.emitText("PULSE MINE ARMED", 300, 500, "#EF4444", 12);
        break;

      case "shield_core":
        this.hasShield = true;
        this.ctx.audio?.playRotate?.();
        globalParticles.emitText("SHIELD ACTIVE", 300, 500, "#00F0FF", 12);
        break;

      case "emp_burst":
        for (const ai of this.aiRacers) {
          if (Math.abs(ai.worldZ - this.playerZ) < 2200) {
            ai.spinoutTimer = 1.0;
          }
        }
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(300, 500, 40, ["#00F0FF", "#A855F7", "#FFFFFF"], 110, 360);
        globalParticles.emitText("EMP DISRUPTOR!", 300, 460, "#A855F7", 16);
        break;

      default:
        this.speed = 2800;
        this.boostTimer = 1.2;
        break;
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    switch (action) {
      case "MOVE_LEFT":
        this.keyLeft = isPressed;
        break;
      case "MOVE_RIGHT":
        this.keyRight = isPressed;
        break;
      case "MOVE_UP":
      case "ACTION_PRIMARY":
        this.keyAccel = isPressed;
        break;
      case "MOVE_DOWN":
      case "BACK":
        this.keyBrake = isPressed;
        break;
      case "ROTATE":
      case "ACTION_SECONDARY":
        this.keyDrift = isPressed;
        if (action === "ACTION_SECONDARY" && isPressed && !this.keyDrift) {
          this.triggerItem();
        }
        break;
      case "CONFIRM":
        if (isPressed) this.triggerItem();
        break;
      case "RESTART":
        if (isPressed) this.reset();
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return 1; }
  public getLives(): number { return 4 - this.rank; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = pr.getWidth();
    const h = pr.getHeight();

    const startSegIdx = Math.floor(this.playerZ / this.segmentLength) % this.totalSegments;
    const currentBiome = BIOMES[this.road[startSegIdx].biomeIdx];
    const horizonY = Math.floor(h * 0.38);

    pr.save();
    if (this.screenShake > 0) {
      const shakeX = (Math.random() - 0.5) * this.screenShake * 16;
      const shakeY = (Math.random() - 0.5) * this.screenShake * 16;
      pr.translate(shakeX, shakeY);
    }

    // --- 1. Parallax Sky & Scenery Background ---
    pr.drawRect(0, 0, w, horizonY * 0.45, currentBiome.skyTop, true);
    pr.drawRect(0, horizonY * 0.45, w, horizonY * 0.3, currentBiome.skyMid, true);
    pr.drawRect(0, horizonY * 0.75, w, horizonY * 0.25, currentBiome.skyHorizon, true);

    // Distant Parallax Skyline
    const steerShift = this.playerX * 50;
    for (let bx = -90; bx < w + 90; bx += 52) {
      const bh = 30 + Math.sin(bx * 0.04) * 18;
      const sx = bx - steerShift * 0.35;
      pr.drawRect(sx, horizonY - bh, 46, bh, currentBiome.mountainCol, true);
      pr.drawRect(sx, horizonY - bh, 46, bh, currentBiome.cityCol, false);

      for (let wy = horizonY - bh + 4; wy < horizonY - 4; wy += 8) {
        pr.drawRect(sx + 8, wy, 4, 4, "#FDE047", true);
        pr.drawRect(sx + 30, wy, 4, 4, "#38BDF8", true);
      }
    }
    pr.drawLine(0, horizonY, w, horizonY, currentBiome.skyHorizon, 2);

    // --- 2. Smooth Continuous Trapezoid 3D Road ---
    const cameraX = this.playerX * this.roadWidth;
    let accumulatedCurve = 0;

    interface ProjectedLine {
      x: number;
      y: number;
      w: number;
      scale: number;
      seg: RoadSegment;
      worldZ: number;
    }

    const projectedLines: ProjectedLine[] = [];

    for (let n = 0; n < this.drawDistance; n++) {
      const segIdx = (startSegIdx + n) % this.totalSegments;
      const seg = this.road[segIdx];

      accumulatedCurve += seg.curve;

      const z = (n * this.segmentLength) + (this.segmentLength - (this.playerZ % this.segmentLength));
      if (z <= 0) continue;

      const scale = this.cameraDepth / z;
      const screenX = (w / 2) + (scale * (accumulatedCurve * 28 - cameraX) * (w / 2));
      const screenY = (horizonY) + (scale * (this.cameraHeight + seg.hill) * (h / 2));
      const screenW = scale * this.roadWidth * (w / 2);

      projectedLines.push({ x: screenX, y: screenY, w: screenW, scale, seg, worldZ: this.playerZ + z });
    }

    if (ctx2d) {
      for (let i = projectedLines.length - 2; i >= 0; i--) {
        const p1 = projectedLines[i];     // Nearer
        const p2 = projectedLines[i + 1]; // Farther

        const seg = p1.seg;
        const biome = BIOMES[seg.biomeIdx];
        const isEven = seg.index % 2 === 0;

        const y1 = p1.y;
        const y2 = p2.y;
        if (y1 < horizonY || y2 > h || y2 >= y1) continue;

        // Ground Strip
        ctx2d.fillStyle = isEven ? biome.grassLight : biome.grassDark;
        ctx2d.fillRect(0, y2, w, y1 - y2);

        // Smooth 3D Kerbs
        const kerbW1 = p1.w * 0.14;
        const kerbW2 = p2.w * 0.14;
        const kerbCol = isEven ? biome.kerbLight : biome.kerbDark;

        ctx2d.fillStyle = kerbCol;
        // Left Kerb
        ctx2d.beginPath();
        ctx2d.moveTo(p1.x - p1.w / 2 - kerbW1, y1);
        ctx2d.lineTo(p2.x - p2.w / 2 - kerbW2, y2);
        ctx2d.lineTo(p2.x - p2.w / 2, y2);
        ctx2d.lineTo(p1.x - p1.w / 2, y1);
        ctx2d.closePath();
        ctx2d.fill();

        // Right Kerb
        ctx2d.beginPath();
        ctx2d.moveTo(p1.x + p1.w / 2, y1);
        ctx2d.lineTo(p2.x + p2.w / 2, y2);
        ctx2d.lineTo(p2.x + p2.w / 2 + kerbW2, y2);
        ctx2d.lineTo(p1.x + p1.w / 2 + kerbW1, y1);
        ctx2d.closePath();
        ctx2d.fill();

        // Smooth Asphalt Road
        ctx2d.fillStyle = isEven ? biome.asphaltLight : biome.asphaltDark;
        ctx2d.beginPath();
        ctx2d.moveTo(p1.x - p1.w / 2, y1);
        ctx2d.lineTo(p2.x - p2.w / 2, y2);
        ctx2d.lineTo(p2.x + p2.w / 2, y2);
        ctx2d.lineTo(p1.x + p1.w / 2, y1);
        ctx2d.closePath();
        ctx2d.fill();

        // Center Dashed White Line
        if (isEven) {
          const laneW1 = Math.max(2, p1.w * 0.02);
          const laneW2 = Math.max(1, p2.w * 0.02);
          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.beginPath();
          ctx2d.moveTo(p1.x - laneW1 / 2, y1);
          ctx2d.lineTo(p2.x - laneW2 / 2, y2);
          ctx2d.lineTo(p2.x + laneW2 / 2, y2);
          ctx2d.lineTo(p1.x + laneW1 / 2, y1);
          ctx2d.closePath();
          ctx2d.fill();
        }

        // Turbo Boost Pad
        if (seg.hasTurboPad) {
          const padW1 = p1.w * 0.35;
          const padW2 = p2.w * 0.35;
          ctx2d.fillStyle = "#F59E0B";
          ctx2d.beginPath();
          ctx2d.moveTo(p1.x - padW1 / 2, y1);
          ctx2d.lineTo(p2.x - padW2 / 2, y2);
          ctx2d.lineTo(p2.x + padW2 / 2, y2);
          ctx2d.lineTo(p1.x + padW1 / 2, y1);
          ctx2d.closePath();
          ctx2d.fill();

          ctx2d.fillStyle = "#FDE047";
          ctx2d.beginPath();
          ctx2d.moveTo(p1.x - padW1 * 0.3, y1);
          ctx2d.lineTo(p2.x - padW2 * 0.3, y2);
          ctx2d.lineTo(p2.x + padW2 * 0.3, y2);
          ctx2d.lineTo(p1.x + padW1 * 0.3, y1);
          ctx2d.closePath();
          ctx2d.fill();
        }

        // Billboard Arches
        if (seg.hasBillboard && (y1 - y2) > 2) {
          const archW = p1.w * 1.4;
          const archH = Math.min(65, (y1 - y2) * 9);
          pr.drawRect(p1.x - archW / 2, y2 - archH, archW, archH * 0.35, "#0F172A", true);
          pr.drawRect(p1.x - archW / 2, y2 - archH, archW, archH * 0.35, "#00F0FF", false);
          pr.drawText(seg.billboardText, p1.x, y2 - archH + archH * 0.24, {
            size: Math.max(9, Math.floor(archH * 0.22)),
            color: "#FDE047",
            align: "center",
            font: "monospace",
          });
        }

        // Floating ? Item Mystery Boxes
        if (seg.hasItemBox) {
          const sz = Math.max(9, p1.w * 0.12);
          pr.drawCircle(p1.x, y2 - sz, sz * 0.7, "rgba(253, 224, 71, 0.3)", true);
          pr.drawRect(p1.x - sz / 2, y2 - sz * 1.4, sz, sz, "#F59E0B", true);
          pr.drawRect(p1.x - sz / 2 + 2, y2 - sz * 1.4 + 2, sz - 4, sz - 4, "#FDE047", true);
          pr.drawText("?", p1.x, y2 - sz * 0.8, { size: Math.max(8, Math.floor(sz * 0.65)), color: "#1E293B", align: "center", font: "monospace" });
        }

        // AI Rival Karts
        for (const ai of this.aiRacers) {
          let aiNormZ = ai.worldZ;
          if (aiNormZ < this.playerZ - 100) aiNormZ += this.trackLength;

          if (Math.abs(aiNormZ - p1.worldZ) < this.segmentLength * 1.2) {
            const aiX = p1.x + ai.laneOffset * (p1.w * 0.4);
            const aiScale = Math.max(0.35, p1.w / 520);
            drawRearViewKart(
              pr,
              aiX,
              y2,
              aiScale,
              0,
              ai.palette,
              false,
              0,
              false,
              this.animTime
            );
          }
        }

        // Hazards
        for (const h of this.hazards) {
          if (Math.abs(h.worldZ - p1.worldZ) < this.segmentLength) {
            const hX = p1.x + h.laneOffset * (p1.w * 0.4);
            const hr = Math.max(5, p1.w * 0.08);
            pr.drawCircle(hX, y2, hr, h.type === "oil" ? "#090D16" : "#EF4444", true);
          }
        }
      }
    }

    // --- 3. High-Speed Wind Particles ---
    if (this.speed > 1800) {
      for (let i = 0; i < 8; i++) {
        const wx = Math.random() * w;
        const wy = horizonY + Math.random() * (h - horizonY);
        pr.drawLine(wx, wy, wx - (this.playerX * 10), wy + 16, "rgba(255, 255, 255, 0.4)", 2);
      }
    }

    // --- 4. High-Detail 3D Player Kart (Foreground) ---
    const px = w / 2;
    const py = h - 68;
    const steerLean = this.keyLeft ? -6 : this.keyRight ? 6 : 0;
    const driftTier = this.driftTime > 1.2 ? 3 : this.driftTime > 0.4 ? 2 : this.isDrifting ? 1 : 0;
    const isBoosting = this.boostTimer > 0;

    // Shield Aura
    if (this.hasShield) {
      pr.drawCircle(px, py - 10, 56, "rgba(0, 240, 255, 0.3)", true);
      pr.drawCircle(px, py - 10, 56, "#00F0FF", false);
    }

    // Render Player Kart Sprite (or Spinout)
    if (this.spinoutTimer > 0) {
      pr.save();
      pr.translate(px, py);
      pr.rotate(this.animTime * 16);
      drawRearViewKart(pr, 0, 0, 1.2, 0, KART_PALETTES.red, false, 0, false, this.animTime);
      pr.restore();
    } else {
      drawRearViewKart(
        pr,
        px,
        py,
        1.2,
        steerLean,
        KART_PALETTES.red,
        this.isDrifting,
        driftTier,
        isBoosting,
        this.animTime
      );
    }

    // Particle Bursts
    globalParticles.render(pr);

    pr.restore();

    // --- 5. Holographic Left-Side Minimap Box ---
    const mapX = 14;
    const mapY = 56;
    const mapW = 126;
    const mapH = 198;

    pr.drawRect(mapX, mapY, mapW, mapH, "rgba(10, 14, 39, 0.94)", true);
    pr.drawRect(mapX, mapY, mapW, mapH, "#38BDF8", false);
    pr.drawRect(mapX + 2, mapY + 2, mapW - 4, 18, "rgba(56, 189, 248, 0.2)", true);
    pr.drawText(currentBiome.name, mapX + mapW / 2, mapY + 14, { size: 8, color: "#38BDF8", align: "center", font: "monospace" });

    // S-Curve Track Blueprint
    const mapTrackPts = [
      { x: 30, y: 175 }, { x: 92, y: 175 }, { x: 110, y: 145 },
      { x: 74, y: 115 }, { x: 42, y: 85 }, { x: 78, y: 55 },
      { x: 104, y: 38 }, { x: 32, y: 38 }, { x: 18, y: 75 },
      { x: 18, y: 145 }, { x: 30, y: 175 },
    ];

    for (let i = 0; i < mapTrackPts.length - 1; i++) {
      const p1 = mapTrackPts[i];
      const p2 = mapTrackPts[i + 1];
      pr.drawLine(mapX + p1.x, mapY + p1.y, mapX + p2.x, mapY + p2.y, "#DC2626", 6);
      pr.drawLine(mapX + p1.x, mapY + p1.y, mapX + p2.x, mapY + p2.y, "#FFFFFF", 4);
      pr.drawLine(mapX + p1.x, mapY + p1.y, mapX + p2.x, mapY + p2.y, "#0F172A", 2);
    }

    // Live Player Beacon
    const playerMapIdx = Math.floor((this.playerZ / this.trackLength) * (mapTrackPts.length - 1));
    const pPt = mapTrackPts[playerMapIdx] || mapTrackPts[0];
    pr.drawCircle(mapX + pPt.x, mapY + pPt.y, 5, "#EF4444", true);
    pr.drawCircle(mapX + pPt.x, mapY + pPt.y, 8, "rgba(239, 68, 68, 0.6)", false);

    // AI Beacons
    for (const ai of this.aiRacers) {
      const aiMapIdx = Math.floor((ai.worldZ / this.trackLength) * (mapTrackPts.length - 1));
      const aiPt = mapTrackPts[aiMapIdx] || mapTrackPts[0];
      pr.drawCircle(mapX + aiPt.x, mapY + aiPt.y, 4, ai.palette.cap, true);
    }

    // --- 6. Top Retro Dashboard HUD ---
    pr.drawRect(12, 12, w - 24, 38, "rgba(10, 14, 39, 0.95)", true);
    pr.drawRect(12, 12, w - 24, 38, "#38BDF8", false);

    const rankCol = this.rank === 1 ? "#FFD84D" : this.rank === 2 ? "#E2E8F0" : "#F97316";
    pr.drawText(`POS: ${this.rank}/4`, 24, 28, { size: 13, color: rankCol, font: "monospace" });

    // Speedometer (0 - 280 KM/H)
    const speedKmh = Math.floor((this.speed / this.maxSpeed) * 230);
    pr.drawText(`SPEED: ${speedKmh} KM/H`, w / 2 - 30, 28, { size: 12, color: speedKmh > 180 ? "#EF4444" : "#FDE047", align: "center", font: "monospace" });
    pr.drawRect(w / 2 + 35, 20, 60, 10, "#1E293B", true);
    pr.drawRect(w / 2 + 35, 20, Math.min(60, (speedKmh / 280) * 60), 10, speedKmh > 180 ? "#EF4444" : "#00F0FF", true);

    pr.drawText(`LAP ${this.lap}`, w - 24, 28, { size: 13, color: "#22C55E", align: "right", font: "monospace" });

    // Held Item Box on Bottom-Left
    pr.drawRect(mapX, h - 56, 48, 48, "rgba(10, 14, 39, 0.95)", true);
    pr.drawRect(mapX, h - 56, 48, 48, "#FFD84D", false);
    if (this.heldItem) {
      pr.drawText("ITEM", mapX + 24, h - 44, { size: 8, color: "#94A3B8", align: "center", font: "monospace" });
      pr.drawText(this.heldItem.substring(0, 4).toUpperCase(), mapX + 24, h - 24, { size: 10, color: "#00F0FF", align: "center", font: "monospace" });
    } else {
      pr.drawText("EMPTY", mapX + 24, h - 32, { size: 9, color: "#64748B", align: "center", font: "monospace" });
    }

    // Controls Legend Footer
    pr.drawRect(70, h - 26, w - 86, 18, "rgba(10, 14, 39, 0.9)", true);
    pr.drawText(
      "[WASD / ARROWS / SPACE: DRIVE  •  SHIFT/C: DRIFT TURBO  •  E/F: USE ITEM]",
      w / 2 + 25,
      h - 13,
      {
        size: 9,
        color: "#CBD5E1",
        align: "center",
        font: "monospace",
      }
    );
  }
}
