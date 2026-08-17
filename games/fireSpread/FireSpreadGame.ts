import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface FireCell {
  x: number;
  y: number;
  state: "forest" | "burning" | "burnt" | "retardant" | "water" | "lake" | "camp";
  intensity: number; // 0 to 1
  burnTime: number;
}

interface FireDrop {
  pos: Vector2;
  radius: number;
  type: "water" | "retardant";
  life: number;
}

interface WildfireParticle {
  pos: Vector2;
  vel: Vector2;
  color: string;
  size: number;
  life: number;
}

interface CampSite {
  pos: Vector2;
  name: string;
  survivors: number;
  saved: boolean;
  destroyed: boolean;
}

export class FireSpreadGame implements GameInstance {
  private ctx!: GameContext;

  // Air Tanker Plane Physics (Super Tanker Large Payload)
  private planePos = new Vector2(300, 550);
  private planeAngle = -Math.PI / 2;
  private planeSpeed = 240;
  private waterPayload = 300;
  private retardantPayload = 300;
  private maxPayload = 300;
  private dropType: "water" | "retardant" = "water";

  // Grid Simulation
  private readonly gridCols = 40;
  private readonly gridRows = 44;
  private readonly cellSize = 14;
  private gridOffsetX = 20;
  private gridOffsetY = 70;
  private grid: FireCell[][] = [];

  // Environmental Dynamics
  private windDir = new Vector2(0.8, -0.4).normalize();
  private windSpeed = 22;
  private windAngle = -0.4;
  private spreadTimer = 0;
  private readonly spreadInterval = 0.55; // Slower, more strategic and manageable spread rate

  private drops: FireDrop[] = [];
  private fireParticles: WildfireParticle[] = [];
  private camps: CampSite[] = [];

  private score = 0;
  private level = 1;
  private survivorsSaved = 0;
  private totalSurvivors = 0;
  private isWon = false;
  private isGameOver = false;
  private isPaused = false;
  private animTime = 0;

  // Steering
  private turnLeft = false;
  private turnRight = false;
  private isDropping = false;

  private boundPointerDown?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerMove?: (e: MouseEvent | PointerEvent) => void;
  private boundPointerUp?: (e: MouseEvent | PointerEvent) => void;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
    this.attachPointerControls();
  }

  private attachPointerControls(): void {
    const getCanvasPos = (e: MouseEvent | PointerEvent) => {
      const target = e.target as HTMLElement;
      if (target && target.tagName === "CANVAS") {
        const rect = target.getBoundingClientRect();
        const scaleX = 600 / rect.width;
        const scaleY = 700 / rect.height;
        return new Vector2((e.clientX - rect.left) * scaleX, (e.clientY - rect.top) * scaleY);
      }
      return null;
    };

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      if (this.isWon || this.isGameOver || this.isPaused) return;
      const targetPos = getCanvasPos(e);
      if (targetPos) {
        const toTarget = targetPos.sub(this.planePos);
        this.planeAngle = Math.atan2(toTarget.y, toTarget.x);
      }
    };

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (this.isWon) {
        this.nextLevel();
        return;
      }
      if (this.isGameOver) {
        this.reset();
        return;
      }
      this.isDropping = true;
    };

    this.boundPointerUp = () => {
      this.isDropping = false;
    };

    if (typeof window !== "undefined") {
      window.addEventListener("pointerdown", this.boundPointerDown);
      window.addEventListener("pointermove", this.boundPointerMove);
      window.addEventListener("pointerup", this.boundPointerUp);
    }
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.startLevel(this.level);
  }

  private startLevel(lvl: number): void {
    this.level = lvl;
    this.isWon = false;
    this.isGameOver = false;
    this.isPaused = false;
    this.planePos = new Vector2(300, 580);
    this.planeAngle = -Math.PI / 2;
    this.waterPayload = this.maxPayload;
    this.retardantPayload = this.maxPayload;
    this.drops = [];
    this.fireParticles = [];
    this.animTime = 0;
    this.survivorsSaved = 0;

    // Initialize Grid Terrain
    this.grid = [];
    for (let r = 0; r < this.gridRows; r++) {
      const row: FireCell[] = [];
      for (let c = 0; c < this.gridCols; c++) {
        // Lakes at bottom-left and right
        const distToLake = Math.hypot(c - 8, r - 36);
        const isLake = distToLake < 6.5;

        row.push({
          x: c,
          y: r,
          state: isLake ? "lake" : "forest",
          intensity: 0,
          burnTime: 0,
        });
      }
      this.grid.push(row);
    }

    // Spawn Camps to defend
    this.camps = [
      {
        pos: new Vector2(this.gridOffsetX + 28 * this.cellSize, this.gridOffsetY + 12 * this.cellSize),
        name: "ALPINE RIDGE LODGE",
        survivors: 14,
        saved: false,
        destroyed: false,
      },
      {
        pos: new Vector2(this.gridOffsetX + 14 * this.cellSize, this.gridOffsetY + 22 * this.cellSize),
        name: "EAGLE CREEK SANCTUARY",
        survivors: 8,
        saved: false,
        destroyed: false,
      },
    ];

    this.totalSurvivors = this.camps.reduce((sum, c) => sum + c.survivors, 0);

    // Ignite Wildfires
    for (let i = 0; i < 2 + lvl; i++) {
      const fc = Math.floor(10 + this.ctx.random.next() * (this.gridCols - 20));
      const fr = Math.floor(8 + this.ctx.random.next() * 16);
      if (this.grid[fr][fc].state === "forest") {
        this.grid[fr][fc].state = "burning";
        this.grid[fr][fc].intensity = 1.0;
      }
    }

    globalParticles.emitText(`WILDFIRE MISSION ${this.level}: INFERNO STRIKE`, 300, 320, "#EF4444", 22);
  }

  // Release Firebomb Drop
  private executeDrop(): void {
    if (this.dropType === "water") {
      if (this.waterPayload <= 0) return;
      this.waterPayload = Math.max(0, this.waterPayload - 10);
      this.drops.push({
        pos: new Vector2(this.planePos.x, this.planePos.y),
        radius: 40,
        type: "water",
        life: 0.6,
      });
      this.ctx.audio?.playDrop?.();
      globalParticles.emitBurst(this.planePos.x, this.planePos.y, 25, ["#38BDF8", "#0284C7", "#FFFFFF"], 60, 160);
    } else {
      if (this.retardantPayload <= 0) return;
      this.retardantPayload = Math.max(0, this.retardantPayload - 12);
      this.drops.push({
        pos: new Vector2(this.planePos.x, this.planePos.y),
        radius: 48,
        type: "retardant",
        life: 0.8,
      });
      this.ctx.audio?.playLaser?.();
      globalParticles.emitBurst(this.planePos.x, this.planePos.y, 30, ["#DC2626", "#EF4444", "#FCA5A5", "#FFFFFF"], 70, 200);
    }
  }

  public update(dt: number): void {
    if (this.isPaused || this.isWon || this.isGameOver) return;
    globalParticles.update(dt);
    this.animTime += dt;

    // 1. Air Tanker Flight Physics
    if (this.turnLeft) this.planeAngle -= 3.2 * dt;
    if (this.turnRight) this.planeAngle += 3.2 * dt;

    const forwardDir = Vector2.fromAngle(this.planeAngle);
    this.planePos = this.planePos.add(forwardDir.scale(this.planeSpeed * dt));

    // Screen wrapping boundaries
    if (this.planePos.x < 10) this.planePos.x = 590;
    if (this.planePos.x > 590) this.planePos.x = 10;
    if (this.planePos.y < 20) this.planePos.y = 680;
    if (this.planePos.y > 680) this.planePos.y = 20;

    // Refill Water when flying over Lake (Fast Turbo Scooper)
    const gridC = Math.floor((this.planePos.x - this.gridOffsetX) / this.cellSize);
    const gridR = Math.floor((this.planePos.y - this.gridOffsetY) / this.cellSize);
    if (gridR >= 0 && gridR < this.gridRows && gridC >= 0 && gridC < this.gridCols) {
      if (this.grid[gridR][gridC].state === "lake" && this.waterPayload < this.maxPayload) {
        this.waterPayload = Math.min(this.maxPayload, this.waterPayload + 90 * dt);
        if (Math.random() < 0.4) {
          globalParticles.emitBurst(this.planePos.x, this.planePos.y, 5, ["#38BDF8", "#FFFFFF"], 20, 60);
        }
      }
    }

    // Auto Drop when button/pointer held
    if (this.isDropping && Math.random() < 0.35) {
      this.executeDrop();
    }

    // 2. Fire Simulation Step
    this.spreadTimer += dt;
    if (this.spreadTimer >= this.spreadInterval) {
      this.spreadTimer = 0;
      this.stepWildfire();
    }

    // 3. Process Chemical Drops & Extinguishing
    for (let i = this.drops.length - 1; i >= 0; i--) {
      const drop = this.drops[i];
      drop.life -= dt;

      // Apply to grid cells in radius
      for (let r = 0; r < this.gridRows; r++) {
        for (let c = 0; c < this.gridCols; c++) {
          const cell = this.grid[r][c];
          const cellPos = new Vector2(
            this.gridOffsetX + c * this.cellSize + this.cellSize / 2,
            this.gridOffsetY + r * this.cellSize + this.cellSize / 2
          );

          if (cellPos.distance(drop.pos) <= drop.radius) {
            if (drop.type === "water") {
              if (cell.state === "burning") {
                cell.state = "water";
                cell.intensity = 0;
                this.score += 80;
              }
            } else if (drop.type === "retardant") {
              if (cell.state === "forest") {
                cell.state = "retardant"; // Immune to fire spread!
              } else if (cell.state === "burning") {
                cell.state = "burnt";
                cell.intensity = 0;
                this.score += 120;
              }
            }
          }
        }
      }

      if (drop.life <= 0) this.drops.splice(i, 1);
    }

    // 4. Update Camp Status
    for (const camp of this.camps) {
      if (camp.destroyed) continue;

      const campC = Math.floor((camp.pos.x - this.gridOffsetX) / this.cellSize);
      const campR = Math.floor((camp.pos.y - this.gridOffsetY) / this.cellSize);

      if (campR >= 0 && campR < this.gridRows && campC >= 0 && campC < this.gridCols) {
        if (this.grid[campR][campC].state === "burning") {
          camp.destroyed = true;
          this.ctx.audio?.playExplosion?.();
          globalParticles.emitBurst(camp.pos.x, camp.pos.y, 35, ["#EF4444", "#78716C", "#000000"], 70, 200);
        }
      }
    }

    // 5. Update Fire Smoke Particles
    if (Math.random() < 0.6) {
      for (let r = 0; r < this.gridRows; r += 2) {
        for (let c = 0; c < this.gridCols; c += 2) {
          if (this.grid[r][c].state === "burning" && Math.random() < 0.15) {
            const px = this.gridOffsetX + c * this.cellSize + 7;
            const py = this.gridOffsetY + r * this.cellSize + 7;
            this.fireParticles.push({
              pos: new Vector2(px, py),
              vel: new Vector2(this.windDir.x * 20 + (Math.random() - 0.5) * 10, -25 - Math.random() * 20),
              color: Math.random() < 0.4 ? "#EF4444" : Math.random() < 0.7 ? "#F59E0B" : "rgba(100, 116, 139, 0.6)",
              size: 2.5 + Math.random() * 4,
              life: 0.7,
            });
          }
        }
      }
    }

    for (let i = this.fireParticles.length - 1; i >= 0; i--) {
      const p = this.fireParticles[i];
      p.pos = p.pos.add(p.vel.scale(dt));
      p.life -= dt;
      if (p.life <= 0) this.fireParticles.splice(i, 1);
    }

    // 6. Check Victory Condition (All active burning fires extinguished!)
    let activeFires = 0;
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        if (this.grid[r][c].state === "burning") activeFires++;
      }
    }

    if (activeFires === 0 && !this.isWon) {
      this.isWon = true;
      const survivingCamps = this.camps.filter((c) => !c.destroyed).length;
      this.score += 4000 * this.level + survivingCamps * 1500;
      this.ctx.audio?.playVictory?.();
      this.ctx.session.setStatus("ready");
      globalParticles.emitBurst(300, 350, 70, ["#22C55E", "#38BDF8", "#FBBF24", "#FFFFFF"], 110, 320);
    }
  }

  private stepWildfire(): void {
    const nextStates: { r: number; c: number; state: FireCell["state"] }[] = [];

    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.grid[r][c];

        if (cell.state === "burning") {
          cell.burnTime += this.spreadInterval;
          if (cell.burnTime > 4.5) {
            nextStates.push({ r, c, state: "burnt" });
          }

          // Spread to 8 neighbor cells
          const neighbors = [
            [-1, 0], [1, 0], [0, -1], [0, 1],
            [-1, -1], [-1, 1], [1, -1], [1, 1],
          ];

          for (const [dr, dc] of neighbors) {
            const nr = r + dr;
            const nc = c + dc;
            if (nr >= 0 && nr < this.gridRows && nc >= 0 && nc < this.gridCols) {
              const target = this.grid[nr][nc];
              if (target.state === "forest") {
                // Fire spread probability influenced by wind direction (calibrated for balanced gameplay)
                const dirVec = new Vector2(dc, dr).normalize();
                const windAlignment = dirVec.dot(this.windDir);
                const spreadChance = 0.12 + Math.max(0, windAlignment) * 0.18;

                if (this.ctx.random.next() < spreadChance) {
                  nextStates.push({ r: nr, c: nc, state: "burning" });
                }
              }
            }
          }
        }
      }
    }

    for (const change of nextStates) {
      this.grid[change.r][change.c].state = change.state;
      if (change.state === "burning") {
        this.grid[change.r][change.c].intensity = 1.0;
      }
    }
  }

  public nextLevel(): void {
    this.startLevel(this.level + 1);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.turnLeft = isPressed;
    if (action === "MOVE_RIGHT") this.turnRight = isPressed;

    if (!isPressed) return;

    if (this.isWon) {
      if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
        this.nextLevel();
      } else if (action === "RESTART") {
        this.reset();
      }
      return;
    }

    if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      this.executeDrop();
    } else if (action === "ACTION_SECONDARY" || action === "ROTATE") {
      // Toggle Water vs Red Phos-Chek Fire Retardant
      this.dropType = this.dropType === "water" ? "retardant" : "water";
      this.ctx.audio?.playRotate?.();
    } else if (action === "RESTART") {
      this.startLevel(this.level);
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {
    if (typeof window !== "undefined") {
      if (this.boundPointerDown) window.removeEventListener("pointerdown", this.boundPointerDown);
      if (this.boundPointerMove) window.removeEventListener("pointermove", this.boundPointerMove);
      if (this.boundPointerUp) window.removeEventListener("pointerup", this.boundPointerUp);
    }
  }

  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Tactical Satellite Thermal Valley Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, 0, h);
      bgGrad.addColorStop(0, "#080E1A");
      bgGrad.addColorStop(0.5, "#0D182A");
      bgGrad.addColorStop(1, "#050A14");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#080E1A");
    }

    // 2. Render Forest Grid Terrain
    for (let r = 0; r < this.gridRows; r++) {
      for (let c = 0; c < this.gridCols; c++) {
        const cell = this.grid[r][c];
        const cx = this.gridOffsetX + c * this.cellSize;
        const cy = this.gridOffsetY + r * this.cellSize;

        if (cell.state === "forest") {
          pr.drawRect(cx + 1, cy + 1, this.cellSize - 2, this.cellSize - 2, "#14532D", true);
          pr.drawCircle(cx + 7, cy + 6, 3.5, "#16A34A", true);
        } else if (cell.state === "retardant") {
          // Coated with Red Chemical Fire Retardant
          pr.drawRect(cx + 1, cy + 1, this.cellSize - 2, this.cellSize - 2, "#991B1B", true);
          pr.drawCircle(cx + 7, cy + 6, 3.5, "#EF4444", true);
        } else if (cell.state === "burning") {
          const flameFlicker = Math.sin(this.animTime * 14 + r * 2 + c) > 0;
          pr.drawRect(cx + 1, cy + 1, this.cellSize - 2, this.cellSize - 2, flameFlicker ? "#EF4444" : "#F59E0B", true);
          pr.drawCircle(cx + 7, cy + 7, 4, "#FDE047", true);
        } else if (cell.state === "burnt") {
          pr.drawRect(cx + 2, cy + 2, this.cellSize - 4, this.cellSize - 4, "#1E293B", true);
        } else if (cell.state === "water") {
          pr.drawRect(cx + 1, cy + 1, this.cellSize - 2, this.cellSize - 2, "#0284C7", true);
        } else if (cell.state === "lake") {
          pr.drawRect(cx, cy, this.cellSize, this.cellSize, "#0369A1", true);
          pr.drawCircle(cx + 7, cy + 7, 4, "#38BDF8", true);
        }
      }
    }

    // 3. Render Mountain Camps & Lodges
    for (const camp of this.camps) {
      if (camp.destroyed) {
        pr.drawCircle(camp.pos.x, camp.pos.y, 12, "#334155", true);
        pr.drawText("DESTROYED", camp.pos.x, camp.pos.y + 16, { size: 8, color: "#EF4444", align: "center", font: "monospace" });
      } else {
        if (ctx2d) {
          ctx2d.save();
          ctx2d.shadowColor = "#FBBF24";
          ctx2d.shadowBlur = 14;
          ctx2d.fillStyle = "#FBBF24";
          ctx2d.fillRect(camp.pos.x - 10, camp.pos.y - 10, 20, 20);
          ctx2d.strokeStyle = "#FFFFFF";
          ctx2d.lineWidth = 2;
          ctx2d.strokeRect(camp.pos.x - 10, camp.pos.y - 10, 20, 20);
          ctx2d.restore();
        }

        pr.drawText(camp.name, camp.pos.x, camp.pos.y - 16, {
          size: 8.5,
          color: "#FBBF24",
          align: "center",
          font: "bold monospace",
        });
      }
    }

    // 4. Render Active Fire Particles & Volumetric Smoke
    for (const p of this.fireParticles) {
      pr.drawCircle(p.pos.x, p.pos.y, p.size, p.color, true);
    }

    // 5. Render Active Chemical Drops
    for (const d of this.drops) {
      const dropCol = d.type === "water" ? "rgba(56, 189, 248, 0.45)" : "rgba(239, 68, 68, 0.55)";
      pr.drawCircle(d.pos.x, d.pos.y, d.radius, dropCol, true);
      pr.drawCircle(d.pos.x, d.pos.y, d.radius, d.type === "water" ? "#38BDF8" : "#EF4444", false);
    }

    // 6. Render Air Tanker Plane (Lockheed C-130 Hercules / Canadair Firebomber)
    if (ctx2d) {
      ctx2d.save();
      ctx2d.translate(this.planePos.x, this.planePos.y);
      ctx2d.rotate(this.planeAngle);

      ctx2d.shadowColor = "#FFFFFF";
      ctx2d.shadowBlur = 12;

      // Plane Fuselage
      ctx2d.fillStyle = "#F8FAFC";
      ctx2d.beginPath();
      ctx2d.roundRect(-22, -6, 44, 12, 6);
      ctx2d.fill();

      // Bright Orange Fire Agency Stripes
      ctx2d.fillStyle = "#EA580C";
      ctx2d.fillRect(-8, -6, 14, 12);

      // Wingspan
      ctx2d.fillStyle = "#E2E8F0";
      ctx2d.fillRect(-4, -28, 10, 56);

      // Twin Turboprop Engines
      ctx2d.fillStyle = "#475569";
      ctx2d.fillRect(-2, -18, 6, 6);
      ctx2d.fillRect(-2, 12, 6, 6);

      // Tail Fin
      ctx2d.fillStyle = "#DC2626";
      ctx2d.fillRect(-20, -10, 6, 20);

      ctx2d.restore();
    }

    // 7. Particle System FX
    globalParticles.render(pr);

    // 8. Top Tactical Dashboard HUD
    pr.drawRect(14, 10, w - 28, 52, "rgba(15, 23, 42, 0.96)", true);
    pr.drawRect(14, 10, w - 28, 52, "#EF4444", false);

    pr.drawText(`MISSION: LEVEL ${this.level}`, 26, 30, {
      size: 13,
      color: "#EF4444",
      font: "bold system-ui, sans-serif",
    });

    pr.drawText(`SCORE: ${this.score}`, w / 2, 30, {
      size: 13,
      color: "#FBBF24",
      align: "center",
      font: "bold monospace",
    });

    pr.drawText(`WIND: ${Math.floor(this.windSpeed)} KTS ▶`, w - 26, 30, {
      size: 13,
      color: "#38BDF8",
      align: "right",
      font: "bold monospace",
    });

    // 9. Bottom Flight Controls & Payload Gauges
    pr.drawRect(14, h - 56, w - 28, 46, "rgba(15, 23, 42, 0.96)", true);
    pr.drawRect(14, h - 56, w - 28, 46, "#334155", false);

    // Water Gauge
    const waterPct = Math.floor((this.waterPayload / this.maxPayload) * 100);
    pr.drawText(`WATER: ${waterPct}%`, 30, h - 36, {
      size: 11,
      color: "#38BDF8",
      font: "bold monospace",
    });
    pr.drawRect(30, h - 24, 100, 6, "#1E293B", true);
    pr.drawRect(30, h - 24, (this.waterPayload / this.maxPayload) * 100, 6, "#38BDF8", true);

    // Chemical Retardant Gauge
    const retardantPct = Math.floor((this.retardantPayload / this.maxPayload) * 100);
    pr.drawText(`RETARDANT: ${retardantPct}%`, 160, h - 36, {
      size: 11,
      color: "#EF4444",
      font: "bold monospace",
    });
    pr.drawRect(160, h - 24, 100, 6, "#1E293B", true);
    pr.drawRect(160, h - 24, (this.retardantPayload / this.maxPayload) * 100, 6, "#EF4444", true);

    // Active Selected Drop Tool
    pr.drawText(
      `PAYLOAD: [${this.dropType.toUpperCase()}] (PRESS Z / SHIFT TO SWITCH)`,
      w - 26,
      h - 28,
      {
        size: 10,
        color: this.dropType === "water" ? "#38BDF8" : "#EF4444",
        align: "right",
        font: "bold monospace",
      }
    );

    // 10. Victory Overlay
    if (this.isWon) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#22C55E", false);
      pr.drawText("WILDFIRE CONTAINED — SECTOR SECURED!", w / 2, h / 2 - 12, {
        size: 19,
        color: "#22C55E",
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
      pr.drawText("CLICK ANYWHERE OR PRESS [SPACE] FOR NEXT EMERGENCY", w / 2, h / 2 + 18, {
        size: 12,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    }
  }
}
