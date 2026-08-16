import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

interface Enemy {
  x: number;
  y: number;
  type: "drone" | "soldier" | "boss";
  active: boolean;
  hp: number;
  maxHp: number;
  shootCooldown: number;
  animFrame: number;
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
  type: "ammo" | "health" | "key";
  collected: boolean;
}

export class RaySectorGame implements GameInstance {
  private ctx!: GameContext;
  private posX: number = 2.5;
  private posY: number = 2.5;
  private dirX: number = 1;
  private dirY: number = 0;
  private planeX: number = 0;
  private planeY: number = 0.66;

  private mapW = 24;
  private mapH = 24;
  private map: number[][] = [];

  private moveSpeed = 3.8;
  private rotSpeed = 2.6;

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

  private level: number = 1;
  private score: number = 0;
  private lives: number = 3;
  private playerHp: number = 100;
  private ammo: number = 80;
  private keys: number = 0;
  private paused: boolean = false;
  private gameOver: boolean = false;
  private isWon: boolean = false;

  private muzzleFlash = 0;
  private swayTimer = 0;
  private shootCooldown = 0;
  private damageFlash = 0;
  private animTime = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.level = 1;
    this.score = 0;
    this.lives = 3;
    this.playerHp = 100;
    this.ammo = 80;
    this.keys = 0;
    this.gameOver = false;
    this.isWon = false;
    this.muzzleFlash = 0;
    this.shootCooldown = 0;
    this.damageFlash = 0;
    this.projectiles = [];
    this.particles = [];
    this.initMazeLevel();
  }

  private initMazeLevel(): void {
    this.mapW = 22 + this.level * 2;
    this.mapH = 22 + this.level * 2;
    this.map = Array.from({ length: this.mapH }, () => Array(this.mapW).fill(1));

    // Carve maze rooms & corridors
    const carveRoom = (rx: number, ry: number, rw: number, rh: number) => {
      for (let y = ry; y < ry + rh; y++) {
        for (let x = rx; x < rx + rw; x++) {
          if (x > 0 && x < this.mapW - 1 && y > 0 && y < this.mapH - 1) {
            this.map[y][x] = 0;
          }
        }
      }
    };

    // Starting player room
    carveRoom(1, 1, 5, 5);
    this.posX = 2.5;
    this.posY = 2.5;
    this.dirX = 1;
    this.dirY = 0;
    this.planeX = 0;
    this.planeY = 0.66;

    // Additional labyrinth chambers & decorated walls (1=Stone, 2=Cyan Neon, 3=Hazard, 4=Reactor)
    for (let i = 0; i < 6 + this.level * 2; i++) {
      const rx = 2 + Math.floor(this.ctx.random.next() * (this.mapW - 8));
      const ry = 2 + Math.floor(this.ctx.random.next() * (this.mapH - 8));
      carveRoom(rx, ry, 4, 4);

      // Connect with corridor
      const prevX = Math.floor(this.posX);
      const prevY = Math.floor(this.posY);
      for (let x = Math.min(prevX, rx); x <= Math.max(prevX, rx); x++) this.map[prevY][x] = 0;
      for (let y = Math.min(prevY, ry); y <= Math.max(prevY, ry); y++) this.map[y][rx] = 0;
    }

    // Decorate walls with variety
    for (let y = 1; y < this.mapH - 1; y++) {
      for (let x = 1; x < this.mapW - 1; x++) {
        if (this.map[y][x] === 1) {
          const roll = (x * 7 + y * 13) % 10;
          if (roll < 3) this.map[y][x] = 2; // Cyan Cyber
          else if (roll < 5) this.map[y][x] = 3; // Hazard Wall
          else if (roll < 6) this.map[y][x] = 4; // Red Reactor
        }
      }
    }

    // Spawn Enemies
    this.enemies = [];
    const enemyCount = 4 + this.level * 3;
    for (let i = 0; i < enemyCount; i++) {
      let ex = 0;
      let ey = 0;
      while (this.map[ey]?.[ex] !== 0 || Math.hypot(ex - this.posX, ey - this.posY) < 4) {
        ex = Math.floor(this.ctx.random.next() * (this.mapW - 2)) + 1;
        ey = Math.floor(this.ctx.random.next() * (this.mapH - 2)) + 1;
      }
      const typeRoll = this.ctx.random.next();
      const type = (i === enemyCount - 1 && this.level % 2 === 0) ? "boss" : (typeRoll > 0.6 ? "soldier" : "drone");
      const hp = type === "boss" ? 80 : (type === "soldier" ? 30 : 15);
      this.enemies.push({
        x: ex + 0.5,
        y: ey + 0.5,
        type,
        active: true,
        hp,
        maxHp: hp,
        shootCooldown: 1.5 + this.ctx.random.next() * 2,
        animFrame: 0,
      });
    }

    // Spawn Pickups
    this.pickups = [];
    for (let i = 0; i < 6; i++) {
      let px = 0;
      let py = 0;
      while (this.map[py]?.[px] !== 0) {
        px = Math.floor(this.ctx.random.next() * (this.mapW - 2)) + 1;
        py = Math.floor(this.ctx.random.next() * (this.mapH - 2)) + 1;
      }
      this.pickups.push({
        x: px + 0.5,
        y: py + 0.5,
        type: i % 2 === 0 ? "ammo" : "health",
        collected: false,
      });
    }

    this.projectiles = [];
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 20 + this.ctx.random.next() * 60;
      this.particles.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.35,
        color,
      });
    }
  }

  private shoot(): void {
    if (this.shootCooldown > 0 || this.ammo <= 0 || this.gameOver || this.paused) return;

    this.ammo--;
    this.muzzleFlash = 0.08;
    this.shootCooldown = 0.22;
    this.ctx.audio.playLaser();

    // Raycast bullet hitscan
    let closestEnemy: Enemy | null = null;
    let minDist = 12;

    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = e.x - this.posX;
      const dy = e.y - this.posY;
      const dist = Math.hypot(dx, dy);

      // Check angle alignment with forward vector
      const dot = (dx / dist) * this.dirX + (dy / dist) * this.dirY;
      if (dot > 0.94 && dist < minDist) {
        // Verify wall line of sight
        let hitWall = false;
        const steps = Math.floor(dist * 4);
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
      if (closestEnemy.hp <= 0) {
        closestEnemy.active = false;
        this.score += closestEnemy.type === "boss" ? 1000 : (closestEnemy.type === "soldier" ? 300 : 150);
        this.ctx.audio.playExplosion();
      }
    }
  }

  public update(dt: number): void {
    if (this.paused || this.gameOver) return;
    this.animTime += dt;

    if (this.muzzleFlash > 0) this.muzzleFlash -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.damageFlash > 0) this.damageFlash -= dt;

    // Movement & Turning
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

    // Collision against walls
    const checkRadius = 0.25;
    if (this.map[Math.floor(this.posY)][Math.floor(this.posX + moveX + Math.sign(moveX) * checkRadius)] === 0) {
      this.posX += moveX;
    }
    if (this.map[Math.floor(this.posY + moveY + Math.sign(moveY) * checkRadius)][Math.floor(this.posX)] === 0) {
      this.posY += moveY;
    }

    if (moveX !== 0 || moveY !== 0) {
      this.swayTimer += dt * 10;
    }

    // Pickups collection
    for (const p of this.pickups) {
      if (!p.collected && Math.hypot(p.x - this.posX, p.y - this.posY) < 0.6) {
        p.collected = true;
        if (p.type === "ammo") {
          this.ammo = Math.min(99, this.ammo + 25);
          this.score += 50;
        } else if (p.type === "health") {
          this.playerHp = Math.min(100, this.playerHp + 30);
          this.score += 50;
        }
        this.ctx.audio.playPowerUp();
      }
    }

    // Enemy AI & Projectiles
    for (const e of this.enemies) {
      if (!e.active) continue;
      const dx = this.posX - e.x;
      const dy = this.posY - e.y;
      const dist = Math.hypot(dx, dy);

      // Approach player if within sight
      if (dist < 8 && dist > 1.2) {
        const nx = e.x + (dx / dist) * (e.type === "boss" ? 1.2 : 1.8) * dt;
        const ny = e.y + (dy / dist) * (e.type === "boss" ? 1.2 : 1.8) * dt;
        if (this.map[Math.floor(ny)]?.[Math.floor(nx)] === 0) {
          e.x = nx;
          e.y = ny;
        }
      }

      // Attack player
      e.shootCooldown -= dt;
      if (dist < 7 && e.shootCooldown <= 0) {
        e.shootCooldown = e.type === "boss" ? 1.0 : 2.0;
        this.projectiles.push({
          x: e.x,
          y: e.y,
          vx: (dx / dist) * 4.5,
          vy: (dy / dist) * 4.5,
          isEnemy: true,
        });
        this.ctx.audio.playLaser();
      }
    }

    // Update enemy plasma projectiles
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
      if (Math.hypot(prj.x - this.posX, prj.y - this.posY) < 0.4) {
        this.projectiles.splice(i, 1);
        this.playerHp -= 12;
        this.damageFlash = 0.2;
        this.ctx.audio.playHit();

        if (this.playerHp <= 0) {
          this.lives--;
          if (this.lives <= 0) {
            this.gameOver = true;
            this.ctx.session.setStatus("game-over");
          } else {
            this.playerHp = 100;
            this.posX = 2.5;
            this.posY = 2.5;
          }
        }
      }
    }

    // Check level clear
    const allCleared = this.enemies.every((e) => !e.active);
    if (allCleared && !this.isWon) {
      this.isWon = true;
      this.score += 2000 * this.level;
      this.ctx.audio.playVictory();
      this.level++;
      setTimeout(() => {
        this.isWon = false;
        this.initMazeLevel();
      }, 1800);
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
  public getLevel(): number { return this.level; }
  public getLives(): number { return this.lives; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Atmosphere Gradient (Ceiling & Floor with Atmospheric Horizon Fog)
    pr.drawRect(0, 0, w, h / 2, "#0a0f1d", true);
    pr.drawRect(0, h / 2, w, h / 2 - 50, "#1e293b", true);

    // 2. High-Performance Raycasting Engine
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
      let side = 0; // 0 = NS, 1 = EW

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

      const lineHeight = Math.floor((h - 50) / Math.max(0.01, perpWallDist));
      let drawStart = -lineHeight / 2 + (h - 50) / 2;
      let drawEnd = lineHeight / 2 + (h - 50) / 2;

      // Distance Fog Shading Factor
      const fog = Math.max(0.2, Math.min(1.0, 1.0 / (1.0 + perpWallDist * 0.18)));

      // Procedural Texture Styling based on Wall Type
      let wallColor = "#334155";
      const isStripe = (wallHitU * 8) % 1 > 0.85;
      const isMortar = (wallHitU * 4) % 1 > 0.92;

      if (hit === 1) {
        // Tech Stone Bricks
        wallColor = isMortar ? "#0f172a" : (side === 0 ? "#475569" : "#334155");
      } else if (hit === 2) {
        // Cyan Cyber Neon Conduit
        wallColor = isStripe ? "#00F0FF" : (side === 0 ? "#0369a1" : "#075985");
      } else if (hit === 3) {
        // Hazard Airlock Stripe
        wallColor = (Math.floor(wallHitU * 6) % 2 === 0) ? "#F59E0B" : "#0F172A";
      } else if (hit === 4) {
        // Red Power Reactor
        wallColor = isStripe ? "#EF4444" : (side === 0 ? "#991b1b" : "#7f1d1d");
      }

      if (drawStart < 0) drawStart = 0;
      if (drawEnd >= h - 50) drawEnd = h - 51;

      pr.drawRect(x, drawStart, 1, Math.max(1, drawEnd - drawStart), wallColor, true);
    }

    // 3. Render Pickups (Ammo & Health Packs)
    for (const p of this.pickups) {
      if (p.collected) continue;
      const spriteX = p.x - this.posX;
      const spriteY = p.y - this.posY;
      const invDet = 1.0 / (this.planeX * this.dirY - this.dirX * this.planeY);
      const transformX = invDet * (this.dirY * spriteX - this.dirX * spriteY);
      const transformY = invDet * (-this.planeY * spriteX + this.planeX * spriteY);

      if (transformY > 0.2) {
        const screenX = Math.floor((w / 2) * (1 + transformX / transformY));
        const sz = Math.abs(Math.floor((h - 50) / transformY * 0.35));
        const sy = (h - 50) / 2 + sz / 2;

        if (screenX >= 0 && screenX < w && transformY < zBuffer[screenX]) {
          const col = p.type === "ammo" ? "#FFD84D" : "#22C55E";
          pr.drawPixelBlock(screenX - sz / 2, sy - sz, sz, col, "#FFFFFF", "#0F172A");
        }
      }
    }

    // 4. Render 3D Enemies (Drones, Soldiers, Bosses) with Detailed Procedural Sprites
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
        const szScale = e.type === "boss" ? 1.3 : 0.75;
        const spriteH = Math.abs(Math.floor(((h - 50) / transformY) * szScale));
        const spriteW = spriteH;

        let startY = Math.floor((h - 50) / 2 - spriteH / 2);
        if (startY < 0) startY = 0;
        let endY = startY + spriteH;
        if (endY >= h - 50) endY = h - 51;

        let startX = Math.floor(screenX - spriteW / 2);
        let endX = startX + spriteW;

        for (let stripe = startX; stripe < endX; stripe++) {
          if (stripe >= 0 && stripe < w && transformY < zBuffer[stripe]) {
            const u = (stripe - startX) / spriteW;
            const stripeH = endY - startY;

            if (e.type === "drone") {
              // Spherical Floating Drone with Thrusters & Cyan Optic Eye
              const isCenter = u > 0.25 && u < 0.75;
              const isEye = u > 0.4 && u < 0.6;
              const col = isEye ? "#00F0FF" : isCenter ? "#64748B" : "#334155";
              pr.drawRect(stripe, startY + stripeH * 0.15, 1, stripeH * 0.7, col, true);
              // Twin Jet Thruster Flames
              if ((u > 0.15 && u < 0.28) || (u > 0.72 && u < 0.85)) {
                pr.drawRect(stripe, startY + stripeH * 0.75, 1, stripeH * 0.25, "#F59E0B", true);
              }
            } else if (e.type === "boss") {
              // Massive Dread Mech (Purple & Ruby Armor, Quad Red Visor Eyes)
              const isCore = u > 0.42 && u < 0.58;
              const isShoulder = (u > 0.1 && u < 0.25) || (u > 0.75 && u < 0.9);
              const col = isCore ? "#A855F7" : isShoulder ? "#DC2626" : "#1E293B";
              pr.drawRect(stripe, startY, 1, stripeH, col, true);
              // Glowing Red Eye Slits
              if (u > 0.35 && u < 0.65) {
                pr.drawRect(stripe, startY + stripeH * 0.25, 1, stripeH * 0.08, "#EF4444", true);
              }
            } else {
              // Cybernetic Soldier (Blue Titanium Chest Armor & Cyan Visor)
              const isHelmet = u > 0.35 && u < 0.65;
              const isVisor = u > 0.42 && u < 0.58;
              const col = isVisor ? "#00F0FF" : isHelmet ? "#0284C7" : "#334155";
              pr.drawRect(stripe, startY, 1, stripeH, col, true);
            }
          }
        }

        // Enemy Health Bar above head
        if (screenX >= 20 && screenX < w - 20 && transformY < zBuffer[screenX]) {
          const hpW = Math.max(20, spriteW * 0.8);
          const hpPct = Math.max(0, e.hp / e.maxHp);
          pr.drawRect(screenX - hpW / 2, startY - 8, hpW, 4, "#0f172a", true);
          pr.drawRect(screenX - hpW / 2, startY - 8, hpW * hpPct, 4, e.type === "boss" ? "#A855F7" : "#EF4444", true);
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
        const sz = Math.abs(Math.floor((h - 50) / transformY * 0.18));
        const sy = (h - 50) / 2;

        if (screenX >= 0 && screenX < w && transformY < zBuffer[screenX]) {
          pr.drawCircle(screenX, sy, Math.max(4, sz), "#EF4444", true);
          pr.drawCircle(screenX, sy, Math.max(2, sz * 0.5), "#FFFFFF", true);
        }
      }
    }

    // 6. Damage Red Flash Effect
    if (this.damageFlash > 0) {
      pr.drawRect(0, 0, w, h - 50, "rgba(239, 68, 68, 0.35)", true);
    }

    // 7. Hand-Drawn Plasma Rifle with Animated Recoil, Heat Coils, and Muzzle Flash
    const swayX = Math.sin(this.swayTimer) * 6;
    const swayY = Math.abs(Math.cos(this.swayTimer)) * 4;
    const recoil = this.muzzleFlash > 0 ? 14 : 0;
    const gunX = w / 2 + swayX;
    const gunY = h - 110 + swayY + recoil;

    // Heavy Metal Receiver & Stock
    pr.drawPixelBlock(gunX - 26, gunY, 52, "#1E293B", "#475569", "#0F172A");
    pr.drawRect(gunX - 12, gunY - 32, 24, 38, "#334155", true);

    // Glowing Cyan Energy Coils & Ammo LED
    pr.drawRect(gunX - 8, gunY - 26, 16, 6, "#00F0FF", true);
    pr.drawRect(gunX - 8, gunY - 14, 16, 6, "#00F0FF", true);
    pr.drawRect(gunX - 10, gunY + 8, 20, 8, "#0284C7", true); // Ammo Battery Magazine

    // Muzzle Flash Blast
    if (this.muzzleFlash > 0) {
      pr.drawCircle(gunX, gunY - 42, 24, "rgba(0, 240, 255, 0.4)", true);
      pr.drawCircle(gunX, gunY - 42, 14, "#00F0FF", true);
      pr.drawCircle(gunX, gunY - 42, 6, "#FFFFFF", true);
    }

    // 8. Crosshair Reticle
    pr.drawLine(w / 2 - 8, (h - 50) / 2, w / 2 + 8, (h - 50) / 2, "#00F0FF", 2);
    pr.drawLine(w / 2, (h - 50) / 2 - 8, w / 2, (h - 50) / 2 + 8, "#00F0FF", 2);
    pr.drawCircle(w / 2, (h - 50) / 2, 4, "#00F0FF", false);

    // 9. Classic Wolf3D / Doom Retro Dashboard HUD
    const hudY = h - 50;
    pr.drawRect(0, hudY, w, 50, "#080e1c", true);
    pr.drawLine(0, hudY, w, hudY, "#00F0FF", 2);

    // Level Badge
    pr.drawText(`SECTOR ${this.level}`, 20, hudY + 30, { size: 14, color: "#ffd84d", font: "monospace" });

    // Score
    pr.drawText(`SCORE: ${this.score}`, 140, hudY + 30, { size: 14, color: "#38bdf8", font: "monospace" });

    // Center Animated Marine Visor Face
    const faceX = w / 2 - 16;
    pr.drawRect(faceX - 2, hudY + 6, 36, 38, "#1e293b", true);
    pr.drawRect(faceX - 2, hudY + 6, 36, 38, "#00F0FF", false);
    pr.drawCircle(faceX + 16, hudY + 24, 12, "#fde047", true); // Helmet Visor
    pr.drawRect(faceX + 8, hudY + 20, 16, 6, "#0284c7", true); // Cyan Eye Band

    // Player Health
    const hpColor = this.playerHp > 50 ? "#22c55e" : (this.playerHp > 25 ? "#f59e0b" : "#ef4444");
    pr.drawText(`HEALTH: ${this.playerHp}%`, w - 240, hudY + 30, { size: 14, color: hpColor, font: "monospace" });

    // Ammo Counter
    pr.drawText(`AMMO: ${this.ammo}`, w - 20, hudY + 30, { size: 14, color: "#ffd84d", align: "right", font: "monospace" });

    // Game Over / Sector Clear Popups
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#FF3366", false);
      pr.drawText("CRITICAL FAILURE — AGENT TERMINATED", w / 2, h / 2 - 12, { size: 18, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] OR [SPACE] TO RE-ENTER SECTOR", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#22c55e", false);
      pr.drawText(`SECTOR ${this.level - 1} HOSTILES ELIMINATED!`, w / 2, h / 2 - 12, { size: 18, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText("WARPING TO NEXT SECTOR CORRIDOR...", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
