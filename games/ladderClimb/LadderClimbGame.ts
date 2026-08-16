import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";

interface Ladder {
  x: number;
  topY: number;
  bottomY: number;
}

interface Barrel {
  pos: Vector2;
  dir: number;
  tier: number;
}

interface GoldNugget {
  x: number;
  y: number;
  collected: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export class LadderClimbGame implements GameInstance {
  private ctx!: GameContext;
  private playerPos: Vector2 = new Vector2(80, 600);
  private playerVx: number = 0;
  private isClimbing: boolean = false;
  private ladders: Ladder[] = [];
  private barrels: Barrel[] = [];
  private goldNuggets: GoldNugget[] = [];
  private particles: Particle[] = [];
  private barrelTimer: number = 0;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private isWon: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  // 4 Tiers of platforms at Y = 620, 480, 340, 200
  private readonly tiers: number[] = [620, 480, 340, 200];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.playerPos = new Vector2(80, 600);
    this.playerVx = 0;
    this.isClimbing = false;
    this.barrels = [];
    this.particles = [];
    this.goldNuggets = [];
    this.barrelTimer = 0;
    this.score = 0;
    this.level = 1;
    this.isWon = false;
    this.gameOver = false;
    this.isPaused = false;

    this.ladders = [
      { x: 500, topY: 480, bottomY: 620 },
      { x: 140, topY: 340, bottomY: 480 },
      { x: 460, topY: 200, bottomY: 340 },
    ];

    // Spawn Gold Nuggets across tiers
    this.goldNuggets = [
      { x: 260, y: 604, collected: false },
      { x: 380, y: 604, collected: false },
      { x: 300, y: 464, collected: false },
      { x: 400, y: 464, collected: false },
      { x: 240, y: 324, collected: false },
      { x: 340, y: 324, collected: false },
      { x: 200, y: 184, collected: false },
    ];
  }

  private addParticles(x: number, y: number, color: string, count = 6): void {
    for (let i = 0; i < count; i++) {
      const ang = this.ctx.random.next() * Math.PI * 2;
      const spd = 30 + this.ctx.random.next() * 80;
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

  public update(dt: number): void {
    if (this.gameOver || this.isWon || this.isPaused) return;
    this.animTime += dt;

    // Determine current platform tier or ladder climb
    let currentTier = -1;
    for (let i = 0; i < this.tiers.length; i++) {
      if (Math.abs(this.playerPos.y - (this.tiers[i] - 18)) < 12) {
        currentTier = i;
        break;
      }
    }

    // Check ladder alignment
    let nearLadder: Ladder | null = null;
    for (const l of this.ladders) {
      if (Math.abs(this.playerPos.x - l.x) < 22 && this.playerPos.y >= l.topY - 20 && this.playerPos.y <= l.bottomY + 5) {
        nearLadder = l;
        break;
      }
    }

    if (nearLadder && (this.moveUp || this.moveDown)) {
      this.isClimbing = true;
      this.playerPos.x = nearLadder.x; // Snap to ladder
      if (this.moveUp) this.playerPos.y -= 160 * dt;
      if (this.moveDown) this.playerPos.y += 160 * dt;
      this.playerPos.y = Math.max(nearLadder.topY - 18, Math.min(nearLadder.bottomY - 18, this.playerPos.y));
    } else {
      this.isClimbing = false;
      // Horizontal motion
      const speed = 240;
      if (this.moveLeft) this.playerPos.x -= speed * dt;
      if (this.moveRight) this.playerPos.x += speed * dt;
    }

    this.playerPos.x = Math.max(40, Math.min(560, this.playerPos.x));

    // Spawn rolling barrels
    this.barrelTimer += dt;
    if (this.barrelTimer >= 2.4) {
      this.barrelTimer = 0;
      this.barrels.push({
        pos: new Vector2(80, this.tiers[3] - 12),
        dir: 1,
        tier: 3,
      });
      this.ctx.audio.playDrop();
    }

    // Update barrels
    const barrelSpeed = 160 + this.level * 20;
    for (let i = this.barrels.length - 1; i >= 0; i--) {
      const b = this.barrels[i];
      b.pos.x += b.dir * barrelSpeed * dt;

      // Drop down to next tier at ends
      if (b.dir === 1 && b.pos.x >= 540) {
        if (b.tier > 0) {
          b.tier--;
          b.pos.y = this.tiers[b.tier] - 12;
          b.dir = -1;
        } else {
          this.barrels.splice(i, 1);
          continue;
        }
      } else if (b.dir === -1 && b.pos.x <= 60) {
        if (b.tier > 0) {
          b.tier--;
          b.pos.y = this.tiers[b.tier] - 12;
          b.dir = 1;
        } else {
          this.barrels.splice(i, 1);
          continue;
        }
      }

      // Check collision with player
      if (Math.hypot(b.pos.x - this.playerPos.x, b.pos.y - this.playerPos.y) < 22) {
        this.gameOver = true;
        this.addParticles(this.playerPos.x, this.playerPos.y, "#EF4444", 20);
        this.ctx.audio.playExplosion();
        this.ctx.session.setStatus("game-over");
      }
    }

    // Check gold nuggets
    for (const g of this.goldNuggets) {
      if (!g.collected && Math.hypot(g.x - this.playerPos.x, g.y - this.playerPos.y) < 22) {
        g.collected = true;
        this.score += 200;
        this.addParticles(g.x, g.y, "#FFD84D", 8);
        this.ctx.audio.playCoin();
      }
    }

    // Win condition: Reach top platform safe zone (x > 440 on top tier 3)
    if (this.playerPos.y <= this.tiers[3] && this.playerPos.x >= 440) {
      this.isWon = true;
      this.score += 2000;
      this.ctx.audio.playVictory();
      this.ctx.session.setStatus("ready");
    }

    // Update Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.particles.splice(i, 1);
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
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040714");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Mine Shaft Brick Wall Backdrop
    pr.drawGrid(8, 9, 65, "rgba(245, 158, 11, 0.03)", 40, 60);

    // 2. Draw 4 Timber Beam Platforms
    for (let i = 0; i < this.tiers.length; i++) {
      const ty = this.tiers[i];
      pr.drawRect(40, ty, 520, 16, "#78350f", true);
      pr.drawRect(40, ty, 520, 4, "#b45309", true); // Wood Highlight
      pr.drawRect(40, ty + 12, 520, 4, "#451a03", true); // Shadow
    }

    // 3. Draw Wooden Ladders with Gold Rungs
    for (const l of this.ladders) {
      pr.drawLine(l.x - 12, l.topY, l.x - 12, l.bottomY, "#d97706", 3);
      pr.drawLine(l.x + 12, l.topY, l.x + 12, l.bottomY, "#d97706", 3);
      for (let y = l.topY + 12; y < l.bottomY; y += 14) {
        pr.drawLine(l.x - 12, y, l.x + 12, y, "#fef08a", 2);
      }
    }

    // 4. Draw Gold Nuggets
    for (const g of this.goldNuggets) {
      if (g.collected) continue;
      const pulse = Math.sin(this.animTime * 6 + g.x) * 2;
      pr.drawCircle(g.x, g.y, 7 + pulse, "rgba(255, 216, 77, 0.3)", true);
      pr.drawCircle(g.x, g.y, 5, "#FFD84D", true);
      pr.drawCircle(g.x - 1, g.y - 1, 2, "#FFFFFF", true);
    }

    // 5. Draw Rolling Barrels
    for (const b of this.barrels) {
      pr.drawCircle(b.pos.x, b.pos.y, 11, "#b45309", true);
      pr.drawCircle(b.pos.x, b.pos.y, 11, "#78350f", false);
      pr.drawLine(b.pos.x - 9, b.pos.y - 4, b.pos.x + 9, b.pos.y - 4, "#d97706", 1.5);
      pr.drawLine(b.pos.x - 9, b.pos.y + 4, b.pos.x + 9, b.pos.y + 4, "#d97706", 1.5);
    }

    // 6. Particles
    for (const p of this.particles) {
      pr.drawCircle(p.x, p.y, 2, p.color, true);
    }

    // 7. Draw Miner Character (with Lantern Glow)
    const px = this.playerPos.x;
    const py = this.playerPos.y;
    // Blue Dungarees & Helmet
    pr.drawPixelBlock(px - 9, py - 14, 18, "#2563EB", "#93C5FD", "#1E40AF");
    pr.drawCircle(px, py - 18, 6, "#FED7AA", true);
    pr.drawRect(px - 8, py - 24, 16, 6, "#F59E0B", true); // Miner Hardhat
    // Lantern
    pr.drawCircle(px + 10, py - 6, 4, "#FFD84D", true);

    // 8. Top HUD
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 32, { size: 13, color: "#ffd84d", font: "monospace" });
    pr.drawText(`LADDER CLIMB • LVL ${this.level}`, w / 2, 32, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    const nuggetsLeft = this.goldNuggets.filter((g) => !g.collected).length;
    pr.drawText(`GOLD: ${nuggetsLeft} REMAINING`, w - 20, 32, { size: 13, color: "#22c55e", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("MINER CRUSHED — GAME OVER", w / 2, h / 2 - 10, { size: 20, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO CLIMB AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#22C55E", false);
      pr.drawText("MINE SHAFT ESCAPED — VICTORY!", w / 2, h / 2 - 10, { size: 20, color: "#22C55E", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO PLAY AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
