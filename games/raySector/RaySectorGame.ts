import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface Enemy {
  id: number;
  x: number;
  y: number;
  active: boolean;
  hp: number;
  maxHp: number;
  shootCooldown: number;
  moveSpeed: number;
  name: string;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  isEnemy: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Pickup {
  x: number;
  y: number;
  type: "ammo" | "health";
  collected: boolean;
  respawnTimer: number;
}

interface Casing {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  rotSpd: number;
  life: number;
}

interface SmokePuff {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

// Exact 17x16 pixel matrix extracted 1:1 from the reference image
const EXACT_HAND_GUN_PIXELS: string[][] = [
  ["", "#252525", "#252525", "", "", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["#252525", "#777C7B", "#646464", "#252525", "#252525", "", "", "", "", "", "", "", "", "", "", "", ""],
  ["#52453B", "#252525", "#777C7B", "#646464", "#646464", "#252525", "#252525", "", "", "", "", "", "", "", "", "", ""],
  ["#52453B", "#9E9074", "#52453B", "#777C7B", "#777C7B", "#646464", "#4D4651", "#252525", "", "", "", "", "", "", "", "", ""],
  ["", "#52453B", "#C9A680", "#52453B", "#646464", "", "#646464", "", "#252525", "", "", "", "", "", "", "", ""],
  ["", "", "#52453B", "#E8BB9D", "#52453B", "#646464", "#4D4651", "#4D4651", "#252525", "#823825", "", "", "", "", "", "", ""],
  ["", "", "", "#52453B", "#E8BB9D", "#52453B", "#252525", "#252525", "#252525", "#FFEFE7", "#823825", "", "", "", "", "", ""],
  ["", "", "", "#823825", "#52453B", "#E8BB9D", "#C9A680", "#9E9074", "#52453B", "#FFEFE7", "#FFEFE7", "#92503E", "", "", "", "", ""],
  ["", "", "#823825", "#FFEFE7", "#FFEFE7", "#52453B", "#52453B", "#52453B", "#FFEFE7", "#FFEFE7", "#FFB19C", "#924834", "", "", "", "", ""],
  ["", "", "#823825", "#FFB19C", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFB19C", "#924834", "", "", "", "", ""],
  ["", "#823825", "#FFB19C", "#823825", "#FFB19C", "#FFB19C", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#92503E", "", "", "", "", ""],
  ["", "#823825", "#FFEFE7", "#FFB19C", "#823825", "#FFB19C", "#FFB19C", "#FFB19C", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#92503E", "", "", "", "", ""],
  ["", "#823825", "#FFEFE7", "#FFB19C", "#FFB19C", "#823825", "#823825", "#FFB19C", "#FFB19C", "#FFB19C", "#FFEFE7", "#FFEFE7", "#823825", "#823825", "#A17C72", "", ""],
  ["", "", "#823825", "#FFEFE7", "#FFB19C", "#FFB19C", "#823825", "#FFB19C", "#FFB19C", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFEFE7", "#FFB9A6", "#C07460", "#823825", "#823825"],
  ["", "", "#823825", "#FFEFE7", "#FFE7DD", "#FFB19C", "#EFA18D", "#924834", "#FFB19C", "#FFB9A6", "#FFEFE7", "#FFEFE7", "#FFEFE7", "", "", "", ""],
  ["", "", "#A17C72", "#C09386", "#FFEFE7", "#FFD0C1", "#FFB19C", "#C07460", "#C07460", "#FFB19C", "#FFD0C1", "#FFD0C1", "#FFEFE7", "", "", "", ""]
];

// High-detail 16x11 rectangular First Aid Case
const HEALTH_KIT_PIXELS: string[][] = [
  ["", "", "", "", "#0F172A", "#94A3B8", "#94A3B8", "#94A3B8", "#94A3B8", "#94A3B8", "#94A3B8", "#0F172A", "", "", "", ""],
  ["", "", "#0F172A", "#CBD5E1", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#CBD5E1", "#0F172A", "", "", "", ""],
  ["#0F172A", "#0F172A", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#0F172A", "#0F172A", "", "", ""],
  ["#0F172A", "#FFFFFF", "#E2E8F0", "#FFFFFF", "#FFFFFF", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#FFFFFF", "#FFFFFF", "#E2E8F0", "#0F172A", "", "", ""],
  ["#0F172A", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#0F172A", "", "", ""],
  ["#0F172A", "#FFFFFF", "#FFFFFF", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#FFFFFF", "#0F172A", "", "", ""],
  ["#0F172A", "#FFFFFF", "#FFFFFF", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#FFFFFF", "#0F172A", "", "", ""],
  ["#0F172A", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#FFFFFF", "#FFFFFF", "#FFFFFF", "#0F172A", "", "", ""],
  ["#0F172A", "#FFFFFF", "#E2E8F0", "#FFFFFF", "#FFFFFF", "#EF4444", "#EF4444", "#EF4444", "#EF4444", "#FFFFFF", "#FFFFFF", "#E2E8F0", "#0F172A", "", "", ""],
  ["#0F172A", "#0F172A", "#CBD5E1", "#CBD5E1", "#94A3B8", "#94A3B8", "#CBD5E1", "#CBD5E1", "#94A3B8", "#94A3B8", "#CBD5E1", "#0F172A", "#0F172A", "", "", ""],
  ["", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "#0F172A", "", "", "", ""]
];

// High-detail 16x10 rectangular Military Ammo Box with Hazard Warning Chevrons
const AMMO_CRATE_PIXELS: string[][] = [
  ["", "", "", "", "#141F0E", "#657A42", "#657A42", "#657A42", "#657A42", "#657A42", "#657A42", "#141F0E", "", "", "", ""],
  ["", "", "#141F0E", "#4D7C0F", "#4D7C0F", "#4D7C0F", "#4D7C0F", "#4D7C0F", "#4D7C0F", "#4D7C0F", "#4D7C0F", "#141F0E", "", "", "", ""],
  ["#141F0E", "#141F0E", "#365314", "#365314", "#365314", "#365314", "#365314", "#365314", "#365314", "#365314", "#365314", "#141F0E", "#141F0E", "", "", ""],
  ["#141F0E", "#365314", "#FACC15", "#FACC15", "#1E293B", "#1E293B", "#FACC15", "#FACC15", "#1E293B", "#1E293B", "#FACC15", "#365314", "#141F0E", "", "", ""],
  ["#141F0E", "#365314", "#1E293B", "#FACC15", "#FACC15", "#1E293B", "#1E293B", "#FACC15", "#FACC15", "#1E293B", "#1E293B", "#365314", "#141F0E", "", "", ""],
  ["#141F0E", "#365314", "#1E293B", "#1E293B", "#FACC15", "#FACC15", "#1E293B", "#1E293B", "#FACC15", "#FACC15", "#1E293B", "#365314", "#141F0E", "", "", ""],
  ["#141F0E", "#365314", "#FACC15", "#1E293B", "#1E293B", "#FACC15", "#FACC15", "#1E293B", "#1E293B", "#FACC15", "#FACC15", "#365314", "#141F0E", "", "", ""],
  ["#141F0E", "#365314", "#365314", "#365314", "#FDE047", "#FDE047", "#EAB308", "#EAB308", "#FDE047", "#365314", "#365314", "#365314", "#141F0E", "", "", ""],
  ["#141F0E", "#141F0E", "#1A2E05", "#1A2E05", "#94A3B8", "#94A3B8", "#1A2E05", "#1A2E05", "#94A3B8", "#94A3B8", "#1A2E05", "#141F0E", "#141F0E", "", "", ""],
  ["", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "#141F0E", "", "", "", ""]
];

export class RaySectorGame implements GameInstance {
  private ctx!: GameContext;
  private posX: number = 3.5;
  private posY: number = 3.5;
  private dirX: number = 1;
  private dirY: number = 0;
  private planeX: number = 0;
  private planeY: number = 0.66;

  private mapW = 24;
  private mapH = 24;
  private map: number[][] = [];

  private moveSpeed = 4.0;
  private rotSpeed = 2.8;

  private movingForward = false;
  private movingBackward = false;
  private strafeLeft = false;
  private strafeRight = false;
  private turningLeft = false;
  private turningRight = false;

  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private pickups: Pickup[] = [];
  private particles: Particle[] = [];
  private casings: Casing[] = [];
  private smokePuffs: SmokePuff[] = [];

  private level: number = 1;
  private score: number = 0;
  private eliminations: number = 0;
  private lives: number = 3;
  private playerHp: number = 100;
  private ammo: number = 60;
  private paused: boolean = false;
  private gameOver: boolean = false;

  private recoil: number = 0;
  private swayTimer: number = 0;
  private breathTimer: number = 0;
  private animTimer: number = 0;
  private shootCooldown: number = 0;
  private damageFlash: number = 0;
  private enemyIdCounter: number = 0;

  // Assets & Pre-rasterized Pixel Canvases
  private opponentImage: HTMLImageElement | null = null;
  private opponentImageLoaded = false;
  private handCanvas: HTMLCanvasElement | null = null;
  private healthCanvas: HTMLCanvasElement | null = null;
  private ammoCanvas: HTMLCanvasElement | null = null;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.buildProceduralSprites();
    this.loadAssets();
    this.reset();
  }

  /**
   * Generates crisp 1:1 pixel-perfect bitmap canvases for all procedural game sprites.
   */
  private buildProceduralSprites(): void {
    if (typeof document === "undefined") return;

    this.handCanvas = this.createCanvasFromMatrix(EXACT_HAND_GUN_PIXELS, 8);
    this.healthCanvas = this.createCanvasFromMatrix(HEALTH_KIT_PIXELS, 6);
    this.ammoCanvas = this.createCanvasFromMatrix(AMMO_CRATE_PIXELS, 6);
  }

  private createCanvasFromMatrix(matrix: string[][], scale: number): HTMLCanvasElement {
    const rows = matrix.length;
    const cols = matrix[0].length;
    const canvas = document.createElement("canvas");
    canvas.width = cols * scale;
    canvas.height = rows * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return canvas;

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const hex = matrix[r][c];
        if (hex) {
          ctx.fillStyle = hex;
          ctx.fillRect(c * scale, r * scale, scale, scale);
        }
      }
    }
    return canvas;
  }

  private loadAssets(): void {
    if (typeof window === "undefined" || typeof Image === "undefined") return;

    // Load Opponent Portrait
    this.opponentImage = new Image();
    this.opponentImage.src = "/assets/raySector/opponent.png";
    this.opponentImage.onload = () => {
      this.opponentImageLoaded = true;
    };
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.level = 1;
    this.score = 0;
    this.eliminations = 0;
    this.lives = 3;
    this.playerHp = 100;
    this.ammo = 60;
    this.gameOver = false;
    this.recoil = 0;
    this.shootCooldown = 0;
    this.damageFlash = 0;
    this.projectiles = [];
    this.particles = [];
    this.casings = [];
    this.smokePuffs = [];
    this.initEndlessLoopMap();
  }

  /**
   * Constructs an endless looping corridor network with concentric rings and cross-halls.
   * Guarantees zero dead ends for seamless continuous pursuit and combat.
   */
  private initEndlessLoopMap(): void {
    this.mapW = 24;
    this.mapH = 24;
    this.map = Array.from({ length: this.mapH }, () => Array(this.mapW).fill(1));

    // Outer Perimeter Loop (width 2)
    for (let y = 2; y <= this.mapH - 3; y++) {
      for (let x = 2; x <= this.mapW - 3; x++) {
        if (y === 2 || y === 3 || y === this.mapH - 4 || y === this.mapH - 3 ||
            x === 2 || x === 3 || x === this.mapW - 4 || x === this.mapW - 3) {
          this.map[y][x] = 0;
        }
      }
    }

    // Inner Concentric Loop
    for (let y = 6; y <= this.mapH - 7; y++) {
      for (let x = 6; x <= this.mapW - 7; x++) {
        if (y === 6 || y === 7 || y === this.mapH - 8 || y === this.mapH - 7 ||
            x === 6 || x === 7 || x === this.mapW - 8 || x === this.mapW - 7) {
          this.map[y][x] = 0;
        }
      }
    }

    // Cross Interconnecting Corridors (North-South & East-West)
    const midX = Math.floor(this.mapW / 2);
    const midY = Math.floor(this.mapH / 2);
    for (let y = 2; y <= this.mapH - 3; y++) {
      this.map[y][midX - 1] = 0;
      this.map[y][midX] = 0;
    }
    for (let x = 2; x <= this.mapW - 3; x++) {
      this.map[midY - 1][x] = 0;
      this.map[midY][x] = 0;
    }

    // Central Open Arena Chamber
    for (let y = midY - 3; y <= midY + 2; y++) {
      for (let x = midX - 3; x <= midX + 2; x++) {
        this.map[y][x] = 0;
      }
    }

    // Decorative wall themes (1=Stone, 2=Cyan Neon, 3=Hazard Stripe, 4=Ruby Reactor)
    for (let y = 0; y < this.mapH; y++) {
      for (let x = 0; x < this.mapW; x++) {
        if (this.map[y][x] === 1) {
          const hash = (x * 17 + y * 31) % 12;
          if (hash === 1 || hash === 2) this.map[y][x] = 2;
          else if (hash === 3 || hash === 4) this.map[y][x] = 3;
          else if (hash === 5) this.map[y][x] = 4;
        }
      }
    }

    // Player initial spawn
    this.posX = 3.5;
    this.posY = 3.5;
    this.dirX = 1;
    this.dirY = 0;
    this.planeX = 0;
    this.planeY = 0.66;

    // Pickups stationed along the loops
    this.pickups = [
      { x: midX + 0.5, y: 2.5, type: "ammo", collected: false, respawnTimer: 0 },
      { x: midX + 0.5, y: this.mapH - 3.5, type: "ammo", collected: false, respawnTimer: 0 },
      { x: 2.5, y: midY + 0.5, type: "health", collected: false, respawnTimer: 0 },
      { x: this.mapW - 3.5, y: midY + 0.5, type: "health", collected: false, respawnTimer: 0 },
      { x: midX + 0.5, y: midY + 0.5, type: "ammo", collected: false, respawnTimer: 0 },
    ];

    // Spawn initial 2 Opponents
    this.enemies = [];
    this.spawnOpponent();
    this.spawnOpponent();
  }

  /**
   * Continuously spawns opponents in free corridor sectors away from the player.
   */
  private spawnOpponent(): void {
    let spawnX = 0;
    let spawnY = 0;
    let attempts = 0;

    while (attempts < 50) {
      attempts++;
      const rx = Math.floor(this.ctx.random.next() * (this.mapW - 4)) + 2;
      const ry = Math.floor(this.ctx.random.next() * (this.mapH - 4)) + 2;
      if (this.map[ry]?.[rx] === 0) {
        const dist = Math.hypot(rx + 0.5 - this.posX, ry + 0.5 - this.posY);
        if (dist >= 6.0) {
          spawnX = rx + 0.5;
          spawnY = ry + 0.5;
          break;
        }
      }
    }

    if (spawnX === 0) {
      spawnX = this.mapW - 3.5;
      spawnY = this.mapH - 3.5;
    }

    this.enemyIdCounter++;
    this.enemies.push({
      id: this.enemyIdCounter,
      x: spawnX,
      y: spawnY,
      active: true,
      hp: 45,
      maxHp: 45,
      shootCooldown: 1.2 + this.ctx.random.next() * 1.5,
      moveSpeed: 2.2 + Math.min(1.2, this.eliminations * 0.05),
      name: "OPPONENT",
    });
  }

  private shoot(): void {
    if (this.shootCooldown > 0 || this.ammo <= 0 || this.gameOver || this.paused) return;

    this.ammo--;
    this.recoil = 1.0;
    this.shootCooldown = 0.22;
    this.ctx.audio.playLaser();

    // Spawn spinning brass cartridge casing
    this.casings.push({
      x: 0,
      y: 0,
      vx: 140 + this.ctx.random.next() * 80,
      vy: -160 - this.ctx.random.next() * 70,
      rot: 0,
      rotSpd: 14 + this.ctx.random.next() * 16,
      life: 0.65,
    });

    // Spawn smoke puff at barrel
    this.smokePuffs.push({
      x: 0,
      y: 0,
      vx: -10 + this.ctx.random.next() * 20,
      vy: -45 - this.ctx.random.next() * 30,
      size: 6,
      alpha: 0.75,
    });

    // Hitscan ray against active opponents
    let closestEnemy: Enemy | null = null;
    let minDist = 16;

    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = e.x - this.posX;
      const dy = e.y - this.posY;
      const dist = Math.hypot(dx, dy);

      // Check alignment with aiming crosshair
      const dot = (dx / dist) * this.dirX + (dy / dist) * this.dirY;
      if (dot > 0.92 && dist < minDist) {
        // Line-of-sight wall collision test
        let hitWall = false;
        const steps = Math.floor(dist * 5);
        for (let s = 1; s <= steps; s++) {
          const tx = Math.floor(this.posX + (dx * s) / steps);
          const ty = Math.floor(this.posY + (dy * s) / steps);
          if (this.map[ty]?.[tx] > 0) {
            hitWall = true;
            break;
          }
        }

        if (!hitWall) {
          minDist = dist;
          closestEnemy = e;
        }
      }
    }

    if (closestEnemy) {
      closestEnemy.hp -= 15;
      this.ctx.audio.playHit();

      // Particle blood/spark burst
      for (let i = 0; i < 8; i++) {
        const ang = this.ctx.random.next() * Math.PI * 2;
        const spd = 20 + this.ctx.random.next() * 50;
        this.particles.push({
          x: closestEnemy.x,
          y: closestEnemy.y,
          vx: Math.cos(ang) * spd,
          vy: Math.sin(ang) * spd,
          life: 0.3,
          color: "#EF4444",
        });
      }

      if (closestEnemy.hp <= 0) {
        closestEnemy.active = false;
        this.eliminations++;
        this.score += 500;
        this.ctx.audio.playExplosion();
      }
    }
  }

  public update(dt: number): void {
    if (this.paused || this.gameOver) return;

    this.animTimer += dt;

    if (this.recoil > 0) {
      this.recoil = Math.max(0, this.recoil - dt * 5.0);
    }
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.damageFlash > 0) this.damageFlash -= dt;
    this.breathTimer += dt * 2.5;

    // Update Casings
    for (let i = this.casings.length - 1; i >= 0; i--) {
      const c = this.casings[i];
      c.life -= dt;
      c.vy += 480 * dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.rot += c.rotSpd * dt;
      if (c.life <= 0) this.casings.splice(i, 1);
    }

    // Update Smoke Puffs
    for (let i = this.smokePuffs.length - 1; i >= 0; i--) {
      const s = this.smokePuffs[i];
      s.alpha -= dt * 1.5;
      s.size += dt * 14;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      if (s.alpha <= 0) this.smokePuffs.splice(i, 1);
    }

    // 1. Player Turning
    if (this.turningLeft) {
      const oldDirX = this.dirX;
      this.dirX = this.dirX * Math.cos(-this.rotSpeed * dt) - this.dirY * Math.sin(-this.rotSpeed * dt);
      this.dirY = oldDirX * Math.sin(-this.rotSpeed * dt) + this.dirY * Math.cos(-this.rotSpeed * dt);
      const oldPlaneX = this.planeX;
      this.planeX = this.planeX * Math.cos(-this.rotSpeed * dt) - this.planeY * Math.sin(-this.rotSpeed * dt);
      this.planeY = oldPlaneX * Math.sin(-this.rotSpeed * dt) + this.planeY * Math.cos(-this.rotSpeed * dt);
    }
    if (this.turningRight) {
      const oldDirX = this.dirX;
      this.dirX = this.dirX * Math.cos(this.rotSpeed * dt) - this.dirY * Math.sin(this.rotSpeed * dt);
      this.dirY = oldDirX * Math.sin(this.rotSpeed * dt) + this.dirY * Math.cos(this.rotSpeed * dt);
      const oldPlaneX = this.planeX;
      this.planeX = this.planeX * Math.cos(this.rotSpeed * dt) - this.planeY * Math.sin(this.rotSpeed * dt);
      this.planeY = oldPlaneX * Math.sin(this.rotSpeed * dt) + this.planeY * Math.cos(this.rotSpeed * dt);
    }

    // 2. Player Movement
    let moveX = 0;
    let moveY = 0;
    if (this.movingForward) {
      moveX += this.dirX * this.moveSpeed * dt;
      moveY += this.dirY * this.moveSpeed * dt;
    }
    if (this.movingBackward) {
      moveX -= this.dirX * this.moveSpeed * dt;
      moveY -= this.dirY * this.moveSpeed * dt;
    }
    if (this.strafeLeft) {
      moveX -= this.planeX * this.moveSpeed * dt;
      moveY -= this.planeY * this.moveSpeed * dt;
    }
    if (this.strafeRight) {
      moveX += this.planeX * this.moveSpeed * dt;
      moveY += this.planeY * this.moveSpeed * dt;
    }

    const checkR = 0.28;
    if (this.map[Math.floor(this.posY)][Math.floor(this.posX + moveX + Math.sign(moveX) * checkR)] === 0) {
      this.posX += moveX;
    }
    if (this.map[Math.floor(this.posY + moveY + Math.sign(moveY) * checkR)][Math.floor(this.posX)] === 0) {
      this.posY += moveY;
    }

    if (moveX !== 0 || moveY !== 0) {
      this.swayTimer += dt * 9;
    }

    // 3. Endless Opponent Spawning (Always maintain 1-2 active opponents)
    this.enemies = this.enemies.filter((e) => e.active);
    while (this.enemies.length < 2) {
      this.spawnOpponent();
    }

    // 4. Opponent AI: Pathing and Shooting
    for (const e of this.enemies) {
      const dx = this.posX - e.x;
      const dy = this.posY - e.y;
      const dist = Math.hypot(dx, dy);

      // Check wall line-of-sight
      let hasLOS = true;
      const steps = Math.floor(dist * 4);
      for (let s = 1; s <= steps; s++) {
        const tx = Math.floor(e.x + (dx * s) / steps);
        const ty = Math.floor(e.y + (dy * s) / steps);
        if (this.map[ty]?.[tx] > 0) {
          hasLOS = false;
          break;
        }
      }

      // Pursuit vector
      if (dist > 1.4) {
        const vx = (dx / dist) * e.moveSpeed * dt;
        const vy = (dy / dist) * e.moveSpeed * dt;
        if (!hasLOS) {
          // Corridor slide navigation
          if (this.map[Math.floor(e.y)][Math.floor(e.x + vx + Math.sign(vx) * 0.3)] === 0) {
            e.x += vx;
          }
          if (this.map[Math.floor(e.y + vy + Math.sign(vy) * 0.3)][Math.floor(e.x)] === 0) {
            e.y += vy;
          }
        } else {
          if (this.map[Math.floor(e.y)][Math.floor(e.x + vx)] === 0) e.x += vx;
          if (this.map[Math.floor(e.y + vy)][Math.floor(e.x)] === 0) e.y += vy;
        }
      }

      // Shoot at player
      e.shootCooldown -= dt;
      if (hasLOS && dist < 12 && e.shootCooldown <= 0) {
        e.shootCooldown = 1.3 + this.ctx.random.next() * 1.0;
        this.projectiles.push({
          x: e.x,
          y: e.y,
          vx: (dx / dist) * 5.2,
          vy: (dy / dist) * 5.2,
          isEnemy: true,
        });
        this.ctx.audio.playLaser();
      }
    }

    // 5. Update Projectiles
    for (let i = this.projectiles.length - 1; i >= 0; i--) {
      const prj = this.projectiles[i];
      prj.x += prj.vx * dt;
      prj.y += prj.vy * dt;

      // Hit wall
      if (this.map[Math.floor(prj.y)]?.[Math.floor(prj.x)] > 0) {
        this.projectiles.splice(i, 1);
        continue;
      }

      // Hit player
      if (Math.hypot(prj.x - this.posX, prj.y - this.posY) < 0.45) {
        this.projectiles.splice(i, 1);
        this.playerHp -= 14;
        this.damageFlash = 0.22;
        this.ctx.audio.playHit();

        if (this.playerHp <= 0) {
          this.lives--;
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          } else {
            this.playerHp = 100;
            this.posX = 3.5;
            this.posY = 3.5;
          }
        }
      }
    }

    // 6. Pickups Respawning & Collection
    for (const p of this.pickups) {
      if (p.collected) {
        p.respawnTimer += dt;
        if (p.respawnTimer > 12) {
          p.collected = false;
          p.respawnTimer = 0;
        }
      } else if (Math.hypot(p.x - this.posX, p.y - this.posY) < 0.7) {
        p.collected = true;
        p.respawnTimer = 0;
        if (p.type === "ammo") {
          this.ammo = Math.min(99, this.ammo + 25);
          this.score += 50;
        } else {
          this.playerHp = Math.min(100, this.playerHp + 30);
          this.score += 50;
        }
        this.ctx.audio.playPowerUp();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    switch (action) {
      case "MOVE_UP": this.movingForward = isPressed; break;
      case "MOVE_DOWN": this.movingBackward = isPressed; break;
      case "MOVE_LEFT": this.turningLeft = isPressed; break;
      case "MOVE_RIGHT": this.turningRight = isPressed; break;
      case "ACTION_PRIMARY":
        if (isPressed) this.shoot();
        break;
      case "RESTART":
        if (isPressed) this.reset();
        break;
    }
  }

  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level + Math.floor(this.eliminations / 5); }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const w = renderer.getWidth();
    const h = renderer.getHeight();
    const rawCtx = (renderer as any).getContext ? (renderer as any).getContext() as CanvasRenderingContext2D : null;

    if (!this.handCanvas) {
      this.buildProceduralSprites();
    }

    const sceneH = h - 50;

    // 1. Atmosphere: Multi-Layered Cosmic Cyber-Skybox
    if (rawCtx) {
      const horizonY = sceneH / 2;

      // A. Deep Cosmic Nebula Gradient
      const skyGrad = rawCtx.createLinearGradient(0, 0, 0, horizonY);
      skyGrad.addColorStop(0, "#010206");
      skyGrad.addColorStop(0.35, "#05091a");
      skyGrad.addColorStop(0.70, "#100a26");
      skyGrad.addColorStop(0.92, "#1d103b");
      skyGrad.addColorStop(1, "#28174f");
      rawCtx.fillStyle = skyGrad;
      rawCtx.fillRect(0, 0, w, horizonY);

      // 360-Degree Continuous Yaw Parallax
      const yaw = (Math.atan2(this.dirY, this.dirX) + Math.PI * 2) % (Math.PI * 2);
      const skySpan = w * 2.8;
      const skyPanX = (yaw / (Math.PI * 2)) * skySpan;

      // B. Distant Nebula Cloud Formations
      const nebula1X = ((((w * 0.45 - skyPanX * 0.7) % skySpan) + skySpan) % skySpan) - w * 0.4;
      const nebGrad1 = rawCtx.createRadialGradient(nebula1X, horizonY * 0.35, 10, nebula1X, horizonY * 0.35, w * 0.45);
      nebGrad1.addColorStop(0, "rgba(168, 85, 247, 0.22)");
      nebGrad1.addColorStop(0.5, "rgba(59, 130, 246, 0.10)");
      nebGrad1.addColorStop(1, "rgba(0, 0, 0, 0)");
      rawCtx.fillStyle = nebGrad1;
      rawCtx.fillRect(0, 0, w, horizonY);

      const nebula2X = ((((w * 1.6 - skyPanX * 0.7) % skySpan) + skySpan) % skySpan) - w * 0.4;
      const nebGrad2 = rawCtx.createRadialGradient(nebula2X, horizonY * 0.45, 10, nebula2X, horizonY * 0.45, w * 0.4);
      nebGrad2.addColorStop(0, "rgba(0, 240, 255, 0.18)");
      nebGrad2.addColorStop(0.6, "rgba(236, 72, 153, 0.08)");
      nebGrad2.addColorStop(1, "rgba(0, 0, 0, 0)");
      rawCtx.fillStyle = nebGrad2;
      rawCtx.fillRect(0, 0, w, horizonY);

      // C. Ringed Celestial Gas Giant / Cyber Moon
      const moonX = ((((w * 0.85 - skyPanX) % skySpan) + skySpan) % skySpan) - w * 0.3;
      const moonY = Math.floor(horizonY * 0.38);
      const moonR = Math.max(16, Math.floor(w * 0.05));

      if (moonX > -moonR * 3 && moonX < w + moonR * 3) {
        // Moon Ambient Glow Halo
        const moonGlow = rawCtx.createRadialGradient(moonX, moonY, moonR * 0.5, moonX, moonY, moonR * 2.2);
        moonGlow.addColorStop(0, "rgba(56, 189, 248, 0.35)");
        moonGlow.addColorStop(0.5, "rgba(129, 140, 248, 0.15)");
        moonGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
        rawCtx.fillStyle = moonGlow;
        rawCtx.beginPath();
        rawCtx.arc(moonX, moonY, moonR * 2.2, 0, Math.PI * 2);
        rawCtx.fill();

        // Moon Sphere Body
        const moonBody = rawCtx.createRadialGradient(moonX - moonR * 0.3, moonY - moonR * 0.3, moonR * 0.1, moonX, moonY, moonR);
        moonBody.addColorStop(0, "#e0f2fe");
        moonBody.addColorStop(0.4, "#38bdf8");
        moonBody.addColorStop(0.8, "#1e3a8a");
        moonBody.addColorStop(1, "#0f172a");
        rawCtx.fillStyle = moonBody;
        rawCtx.beginPath();
        rawCtx.arc(moonX, moonY, moonR, 0, Math.PI * 2);
        rawCtx.fill();

        // Moon Planetary Ring System (Angled Ellipse)
        rawCtx.save();
        rawCtx.translate(moonX, moonY);
        rawCtx.rotate(-0.35);
        rawCtx.strokeStyle = "rgba(192, 132, 252, 0.65)";
        rawCtx.lineWidth = Math.max(2, Math.floor(moonR * 0.12));
        rawCtx.beginPath();
        rawCtx.ellipse(0, 0, moonR * 2.0, moonR * 0.45, 0, 0, Math.PI * 2);
        rawCtx.stroke();
        rawCtx.strokeStyle = "rgba(0, 240, 255, 0.45)";
        rawCtx.lineWidth = 1;
        rawCtx.beginPath();
        rawCtx.ellipse(0, 0, moonR * 2.3, moonR * 0.52, 0, 0, Math.PI * 2);
        rawCtx.stroke();
        rawCtx.restore();
      }

      // D. 64 Multi-Tier Twinkling Stars & Cross Diffraction Stars
      for (let i = 0; i < 64; i++) {
        const starSeed = (i * 137.5) % 1;
        const starX = ((((starSeed * skySpan - skyPanX) % skySpan) + skySpan) % skySpan) - w * 0.2;
        if (starX < 0 || starX >= w) continue;

        const starY = Math.floor(4 + ((i * 73.1) % (horizonY - 14)));
        const isCrossStar = i % 8 === 0;
        const pulse = 0.4 + 0.6 * Math.abs(Math.sin(this.animTimer * 2.5 + i * 1.9));

        if (isCrossStar) {
          // 4-Point Diffraction Spike Star
          rawCtx.fillStyle = `rgba(0, 240, 255, ${pulse * 0.9})`;
          rawCtx.fillRect(starX - 2, starY, 5, 1);
          rawCtx.fillRect(starX, starY - 2, 1, 5);
          rawCtx.fillStyle = "#ffffff";
          rawCtx.fillRect(starX, starY, 1, 1);
        } else {
          // Single Pixel Twinkle Star
          const isCyan = i % 3 === 0;
          rawCtx.fillStyle = isCyan ? `rgba(56, 189, 248, ${pulse})` : `rgba(255, 255, 255, ${pulse})`;
          rawCtx.fillRect(starX, starY, 1, 1);
        }
      }

      // E. Distant Cyberpunk Megacity Skyline on the Horizon
      for (let b = 0; b < 24; b++) {
        const bSeed = (b * 93.7) % 1;
        const bX = ((((bSeed * skySpan - skyPanX * 1.2) % skySpan) + skySpan) % skySpan) - w * 0.2;
        const bW = Math.floor(18 + ((b * 31) % 24));
        const bH = Math.floor(14 + ((b * 47) % 36));

        if (bX > -bW && bX < w + bW) {
          // Building Silhouette
          rawCtx.fillStyle = b % 2 === 0 ? "#080d19" : "#0d1424";
          rawCtx.fillRect(bX, horizonY - bH, bW, bH);

          // Illuminated Windows
          for (let wy = horizonY - bH + 4; wy < horizonY - 4; wy += 5) {
            for (let wx = bX + 3; wx < bX + bW - 3; wx += 4) {
              if ((wx * 13 + wy * 7) % 3 === 0) {
                rawCtx.fillStyle = (wx + wy) % 5 === 0 ? "rgba(0, 240, 255, 0.65)" : "rgba(245, 158, 11, 0.55)";
                rawCtx.fillRect(wx, wy, 2, 2);
              }
            }
          }

          // Antenna with Blinking Red Warning Beacon
          if (b % 3 === 0) {
            const antX = Math.floor(bX + bW / 2);
            rawCtx.fillStyle = "#1e293b";
            rawCtx.fillRect(antX, horizonY - bH - 8, 1, 8);
            const beaconBlink = Math.sin(this.animTimer * 5 + b) > 0;
            if (beaconBlink) {
              rawCtx.fillStyle = "#ef4444";
              rawCtx.fillRect(antX - 1, horizonY - bH - 9, 3, 2);
            }
          }
        }
      }

      // F. Horizon Dual Laser Glow Bands
      rawCtx.fillStyle = "rgba(236, 72, 153, 0.22)";
      rawCtx.fillRect(0, horizonY - 4, w, 8);
      rawCtx.fillStyle = "rgba(0, 240, 255, 0.45)";
      rawCtx.fillRect(0, horizonY - 1, w, 2);

      // Sci-Fi Metallic Grid Floor with Depth Shading
      const floorGrad = rawCtx.createLinearGradient(0, horizonY, 0, sceneH);
      floorGrad.addColorStop(0, "#060a14");
      floorGrad.addColorStop(0.35, "#0d1527");
      floorGrad.addColorStop(1, "#152038");
      rawCtx.fillStyle = floorGrad;
      rawCtx.fillRect(0, horizonY, w, sceneH / 2);

      // Converging Vertical Perspective Rays
      const vanishX = w / 2;
      const vanishY = horizonY;
      const floorSway = Math.sin(this.swayTimer) * 3;
      rawCtx.strokeStyle = "rgba(0, 240, 255, 0.08)";
      rawCtx.lineWidth = 1;
      for (let vx = -w * 0.4; vx <= w * 1.4; vx += w * 0.12) {
        rawCtx.beginPath();
        rawCtx.moveTo(vanishX, vanishY);
        rawCtx.lineTo(vx + floorSway, sceneH);
        rawCtx.stroke();
      }

      // Exponential Horizontal Depth Grid Lines
      for (let r = 1; r <= 12; r++) {
        const ratio = Math.pow(r / 12, 2.2);
        const lineY = Math.floor(horizonY + ratio * (sceneH / 2));
        const alpha = 0.03 + ratio * 0.16;
        rawCtx.fillStyle = `rgba(0, 240, 255, ${alpha})`;
        rawCtx.fillRect(0, lineY, w, Math.max(1, Math.floor(ratio * 2)));
      }
    } else {
      pr.drawRect(0, 0, w, sceneH / 2, "#090d18", true);
      pr.drawRect(0, sceneH / 2, w, sceneH / 2, "#151d2d", true);
    }

    // 2. 2.5D DDA Raycasting Engine
    const zBuffer: number[] = new Array(w).fill(0);

    for (let x = 0; x < w; x++) {
      const cameraX = (2 * x) / w - 1;
      const rayDirX = this.dirX + this.planeX * cameraX;
      const rayDirY = this.dirY + this.planeY * cameraX;

      let mapX = Math.floor(this.posX);
      let mapY = Math.floor(this.posY);

      const deltaDistX = rayDirX === 0 ? 1e30 : Math.abs(1 / rayDirX);
      const deltaDistY = rayDirY === 0 ? 1e30 : Math.abs(1 / rayDirY);

      let sideDistX = 0;
      let sideDistY = 0;
      let stepX = 0;
      let stepY = 0;
      let hit = 0;
      let side = 0;

      if (rayDirX < 0) {
        stepX = -1;
        sideDistX = (this.posX - mapX) * deltaDistX;
      } else {
        stepX = 1;
        sideDistX = (mapX + 1.0 - this.posX) * deltaDistX;
      }
      if (rayDirY < 0) {
        stepY = -1;
        sideDistY = (this.posY - mapY) * deltaDistY;
      } else {
        stepY = 1;
        sideDistY = (mapY + 1.0 - this.posY) * deltaDistY;
      }

      while (hit === 0) {
        if (sideDistX < sideDistY) {
          sideDistX += deltaDistX;
          mapX += stepX;
          side = 0;
        } else {
          sideDistY += deltaDistY;
          mapY += stepY;
          side = 1;
        }
        if (this.map[mapY] && this.map[mapY][mapX] > 0) {
          hit = this.map[mapY][mapX];
        }
      }

      let perpWallDist = 0;
      let wallHitU = 0;
      if (side === 0) {
        perpWallDist = (mapX - this.posX + (1 - stepX) / 2) / rayDirX;
        wallHitU = this.posY + perpWallDist * rayDirY;
      } else {
        perpWallDist = (mapY - this.posY + (1 - stepY) / 2) / rayDirY;
        wallHitU = this.posX + perpWallDist * rayDirX;
      }
      wallHitU -= Math.floor(wallHitU);

      zBuffer[x] = perpWallDist;

      const lineHeight = Math.floor(sceneH / Math.max(0.01, perpWallDist));
      let drawStart = -lineHeight / 2 + sceneH / 2;
      let drawEnd = lineHeight / 2 + sceneH / 2;
      const depthFog = Math.max(0.14, 1.0 / (1.0 + perpWallDist * 0.16));
      let wallBaseColor = "#334155";
      const isConduit = (wallHitU * 8) % 1 > 0.82;
      const isPanelSeam = (wallHitU * 4) % 1 > 0.94;
      const isRivet = (wallHitU * 4) % 1 < 0.08 || (wallHitU * 4) % 1 > 0.88;

      if (hit === 1) {
        // Tech Steel Plating
        wallBaseColor = isPanelSeam
          ? "#0f172a"
          : isRivet
          ? "#64748b"
          : (side === 0 ? "#475569" : "#334155");
      } else if (hit === 2) {
        // Cyan Cyber Data Corridors
        wallBaseColor = isConduit
          ? "#00F0FF"
          : (side === 0 ? "#0369a1" : "#075985");
      } else if (hit === 3) {
        // Reactor Hazard Corridors
        wallBaseColor = (Math.floor(wallHitU * 6) % 2 === 0)
          ? (isConduit ? "#FCD34D" : "#F59E0B")
          : "#0F172A";
      } else if (hit === 4) {
        // High-Security Crimson Sector
        wallBaseColor = isConduit
          ? "#EF4444"
          : (side === 0 ? "#991b1b" : "#7f1d1d");
      }

      if (drawStart < 0) drawStart = 0;
      if (drawEnd >= sceneH) drawEnd = sceneH - 1;

      pr.drawRect(x, drawStart, 1, Math.max(1, drawEnd - drawStart), wallBaseColor, true);

      // Distance Atmospheric Darkening Overlay
      if (rawCtx && depthFog < 0.95) {
        const fogAlpha = Math.min(0.86, (1.0 - depthFog) * 0.95);
        rawCtx.fillStyle = `rgba(3, 7, 18, ${fogAlpha})`;
        rawCtx.fillRect(x, drawStart, 1, Math.max(1, drawEnd - drawStart));
      }
    }

    // 3. Render Pickups: First Aid & Ammo Crates with Floating Bobbing & Particle Aura
    for (const p of this.pickups) {
      if (p.collected) continue;
      const spriteX = p.x - this.posX;
      const spriteY = p.y - this.posY;
      const invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
      const transformX = invDet * (this.dirY * spriteX - this.dirX * spriteY);
      const transformY = invDet * (-this.planeY * spriteX + this.planeX * spriteY);

      if (transformY > 0.2) {
        const screenX = Math.floor((w / 2) * (1 + transformX / transformY));
        const sz = Math.abs(Math.floor((sceneH / transformY) * 0.40));
        const bob = Math.sin(this.animTimer * 4.5 + p.x * 2) * Math.max(2, sz * 0.08);
        const sy = Math.floor(sceneH / 2 + sz / 2 + bob);

        if (screenX >= 0 && screenX < w && transformY < zBuffer[screenX]) {
          const pickupCanvas = p.type === "health" ? this.healthCanvas : this.ammoCanvas;
          const auraColor = p.type === "health" ? "rgba(34, 197, 94, 0.35)" : "rgba(250, 204, 21, 0.35)";
          const pW = Math.floor(sz * 1.35);
          const pH = Math.floor(sz * 0.95);

          if (rawCtx) {
            // Pulsing ground aura
            rawCtx.fillStyle = auraColor;
            rawCtx.beginPath();
            rawCtx.ellipse(screenX, sceneH / 2 + sz * 0.45, pW * 0.45, pH * 0.22, 0, 0, Math.PI * 2);
            rawCtx.fill();

            if (pickupCanvas) {
              rawCtx.drawImage(pickupCanvas, screenX - pW / 2, sy - pH, pW, pH);
            } else {
              const col = p.type === "ammo" ? "#FACC15" : "#22C55E";
              pr.drawPixelBlock(screenX - pW / 2, sy - pH, pW, col, "#FFFFFF", "#0F172A");
            }
          }
        }
      }
    }

    // 4. Render Opponents with Exact Photo Texture
    const sortedEnemies = [...this.enemies].sort((a, b) => {
      return (b.x - this.posX) ** 2 + (b.y - this.posY) ** 2 - ((a.x - this.posX) ** 2 + (a.y - this.posY) ** 2);
    });

    for (const e of sortedEnemies) {
      if (!e.active) continue;
      const spriteX = e.x - this.posX;
      const spriteY = e.y - this.posY;

      const invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
      const transformX = invDet * (this.dirY * spriteX - this.dirX * spriteY);
      const transformY = invDet * (-this.planeY * spriteX + this.planeX * spriteY);

      if (transformY > 0.2) {
        const screenX = Math.floor((w / 2) * (1 + transformX / transformY));
        const spriteH = Math.abs(Math.floor((sceneH / transformY) * 0.85));
        const spriteW = Math.floor(spriteH * 0.8);

        const startY = Math.floor(sceneH / 2 - spriteH / 2);
        const startX = Math.floor(screenX - spriteW / 2);

        // Check if visible in center slice
        if (screenX >= 0 && screenX < w && transformY < zBuffer[screenX]) {
          if (this.opponentImageLoaded && this.opponentImage && rawCtx) {
            rawCtx.save();
            rawCtx.drawImage(this.opponentImage, startX, startY, spriteW, spriteH);
            rawCtx.restore();
          } else {
            // Procedural fallback if image is still loading
            pr.drawRect(startX, startY, spriteW, spriteH, "#1E293B", true);
            pr.drawRect(startX + spriteW * 0.2, startY + spriteH * 0.1, spriteW * 0.6, spriteH * 0.35, "#FCD34D", true);
          }

          // Enemy Health Bar Above Head
          const hpW = Math.max(24, spriteW * 0.8);
          const hpPct = Math.max(0, e.hp / e.maxHp);
          pr.drawRect(screenX - hpW / 2, startY - 10, hpW, 4, "#0f172a", true);
          pr.drawRect(screenX - hpW / 2, startY - 10, hpW * hpPct, 4, "#EF4444", true);
        }
      }
    }

    // 5. Render Plasma Projectiles
    for (const prj of this.projectiles) {
      const spriteX = prj.x - this.posX;
      const spriteY = prj.y - this.posY;
      const invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
      const transformX = invDet * (this.dirY * spriteX - this.dirX * spriteY);
      const transformY = invDet * (-this.planeY * spriteX + this.planeX * spriteY);

      if (transformY > 0.2) {
        const screenX = Math.floor((w / 2) * (1 + transformX / transformY));
        const sz = Math.abs(Math.floor((sceneH / transformY) * 0.18));
        const sy = sceneH / 2;

        if (screenX >= 0 && screenX < w && transformY < zBuffer[screenX]) {
          pr.drawCircle(screenX, sy, Math.max(4, sz), "#EF4444", true);
          pr.drawCircle(screenX, sy, Math.max(2, sz * 0.5), "#FFFFFF", true);
        }
      }
    }

    // 6. Damage Red Flash Effect
    if (this.damageFlash > 0) {
      pr.drawRect(0, 0, w, sceneH, "rgba(239, 68, 68, 0.35)", true);
    }

    // 7. Render Player's Character: Compact Pixel Hand with Gun & Dynamic Shooting Recoil
    const isMoving = this.movingForward || this.movingBackward || this.strafeLeft || this.strafeRight;
    const swayX = isMoving ? Math.sin(this.swayTimer) * 8 : Math.sin(this.breathTimer) * 2;
    const swayY = isMoving ? Math.abs(Math.cos(this.swayTimer)) * 5 : Math.cos(this.breathTimer * 2) * 2;

    const recoilKickY = this.recoil * 18;
    const recoilKickX = this.recoil * 5;
    const recoilRot = -this.recoil * 0.16;

    // Compact, balanced first-person scale
    const pixelBlockSize = Math.max(4, Math.floor(sceneH * 0.024));
    const gunW = 17 * pixelBlockSize;
    const gunH = 16 * pixelBlockSize;
    const gunPosX = Math.floor(w * 0.62 + swayX + recoilKickX);
    const gunPosY = Math.floor(sceneH - gunH * 0.98 + swayY + recoilKickY);

    if (rawCtx) {
      rawCtx.save();
      rawCtx.imageSmoothingEnabled = false;

      // Rotate around the wrist / grip pivot (bottom right of sprite)
      const pivotX = gunPosX + 13 * pixelBlockSize;
      const pivotY = gunPosY + 14 * pixelBlockSize;
      rawCtx.translate(pivotX, pivotY);
      rawCtx.rotate(recoilRot);
      rawCtx.translate(-pivotX, -pivotY);

      if (this.handCanvas) {
        rawCtx.drawImage(this.handCanvas, gunPosX, gunPosY, gunW, gunH);
      } else {
        // Direct pixel matrix fallback
        for (let r = 0; r < 16; r++) {
          for (let c = 0; c < 17; c++) {
            const hex = EXACT_HAND_GUN_PIXELS[r][c];
            if (hex) {
              pr.drawRect(gunPosX + c * pixelBlockSize, gunPosY + r * pixelBlockSize, pixelBlockSize, pixelBlockSize, hex, true);
            }
          }
        }
      }

      // Muzzle flash starburst at exact barrel tip (col 1.5, row 0.5)
      const muzzleX = gunPosX + 1.5 * pixelBlockSize;
      const muzzleY = gunPosY + 1.0 * pixelBlockSize;

      if (this.recoil > 0.55) {
        const flashIntensity = (this.recoil - 0.55) / 0.45;
        const flashSize = 28 * flashIntensity;

        // Outer fiery orange ambient halo
        rawCtx.fillStyle = "rgba(255, 92, 138, 0.45)";
        rawCtx.beginPath();
        rawCtx.arc(muzzleX, muzzleY, flashSize * 1.5, 0, Math.PI * 2);
        rawCtx.fill();

        // 8-Ray Starburst Muzzle Flame
        rawCtx.fillStyle = "#FFD84D";
        rawCtx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i * Math.PI) / 4;
          const r1 = flashSize * (i % 2 === 0 ? 1.0 : 0.45);
          const px = muzzleX + Math.cos(a) * r1;
          const py = muzzleY + Math.sin(a) * r1;
          if (i === 0) rawCtx.moveTo(px, py);
          else rawCtx.lineTo(px, py);
        }
        rawCtx.closePath();
        rawCtx.fill();

        // White-Hot Diamond Center
        rawCtx.fillStyle = "#FFFFFF";
        rawCtx.beginPath();
        rawCtx.moveTo(muzzleX - flashSize * 0.4, muzzleY);
        rawCtx.lineTo(muzzleX, muzzleY - flashSize * 0.4);
        rawCtx.lineTo(muzzleX + flashSize * 0.4, muzzleY);
        rawCtx.lineTo(muzzleX, muzzleY + flashSize * 0.4);
        rawCtx.closePath();
        rawCtx.fill();

        // Forward fiery sparks
        rawCtx.fillStyle = "#FDE047";
        rawCtx.fillRect(muzzleX - flashSize * 1.3, muzzleY - 5, 5, 2);
        rawCtx.fillRect(muzzleX - flashSize * 1.1, muzzleY + 6, 4, 2);
        rawCtx.fillRect(muzzleX - flashSize * 0.8, muzzleY - 12, 3, 2);
      }

      // Flying ejected brass casings
      for (const c of this.casings) {
        rawCtx.save();
        rawCtx.translate(gunPosX + 7 * pixelBlockSize + c.x, gunPosY + 4 * pixelBlockSize + c.y);
        rawCtx.rotate(c.rot);
        rawCtx.fillStyle = "#FCD34D";
        rawCtx.fillRect(-4, -2, 8, 3);
        rawCtx.fillStyle = "#B45309";
        rawCtx.fillRect(-4, -2, 2, 3);
        rawCtx.restore();
      }

      // Barrel smoke puffs
      for (const s of this.smokePuffs) {
        rawCtx.fillStyle = `rgba(226, 232, 240, ${s.alpha * 0.45})`;
        rawCtx.beginPath();
        rawCtx.arc(muzzleX + s.x, muzzleY + s.y, s.size, 0, Math.PI * 2);
        rawCtx.fill();
      }

      rawCtx.restore();
    }

    // 8. Crosshair Reticle
    pr.drawLine(w / 2 - 8, (h - 50) / 2, w / 2 + 8, (h - 50) / 2, "#00F0FF", 2);
    pr.drawLine(w / 2, (h - 50) / 2 - 8, w / 2, (h - 50) / 2 + 8, "#00F0FF", 2);
    pr.drawCircle(w / 2, (h - 50) / 2, 4, "#00F0FF", false);

    // 9. Retro HUD Dashboard
    const hudY = h - 50;
    pr.drawRect(0, hudY, w, 50, "#080e1c", true);
    pr.drawLine(0, hudY, w, hudY, "#00F0FF", 2);

    // Eliminates Counter
    pr.drawText(`KILLS: ${this.eliminations}`, 20, hudY + 30, { size: 14, color: "#ffd84d", font: "monospace" });

    // Score
    pr.drawText(`SCORE: ${this.score}`, 130, hudY + 30, { size: 14, color: "#38bdf8", font: "monospace" });

    // Opponents Active
    pr.drawText(`TARGETS: ${this.enemies.length}`, 260, hudY + 30, { size: 14, color: "#ff5c8a", font: "monospace" });

    // Player Health
    const hpColor = this.playerHp > 50 ? "#22c55e" : (this.playerHp > 25 ? "#f59e0b" : "#ef4444");
    pr.drawText(`HEALTH: ${this.playerHp}%`, w - 220, hudY + 30, { size: 14, color: hpColor, font: "monospace" });

    // Ammo Counter
    pr.drawText(`AMMO: ${this.ammo}`, w - 20, hudY + 30, { size: 14, color: "#ffd84d", align: "right", font: "monospace" });

    // Game Over Popup
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#FF3366", false);
      pr.drawText("CRITICAL FAILURE — AGENT TERMINATED", w / 2, h / 2 - 12, { size: 18, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] OR [SPACE] TO RE-ENTER SECTOR", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}

