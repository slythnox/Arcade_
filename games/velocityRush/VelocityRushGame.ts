import type { GameInstance } from '../types';
import type { GameContext } from '../../engine/GameContext';
import type { Renderer } from '../../engine/rendering/Renderer';
import type { PixelRenderer } from '../../engine/rendering/PixelRenderer';
import type { GameAction } from '../../core/types/game';
import { globalParticles } from '../../engine/particles/ParticleSystem';
import { drawSpaceshipSprite } from '../../engine/rendering/spaceshipSprite';

interface Platform { x: number; y: number; w: number; h: number; }
interface FoodItem { x: number; y: number; type: 'burger' | 'apple' | 'pizza'; collected: boolean; }
interface Ring { x: number; y: number; collected: boolean; }
interface Hazard { x: number; y: number; w: number; h: number; }
interface Bomb { x: number; y: number; vy: number; }

export class VelocityRushGame implements GameInstance {
  private ctx!: GameContext;

  private score = 0;
  private level = 1;
  private lives = 3;
  private hunger = 100; // 0 to 100
  private gameOver = false;
  private isPaused = false;
  private won = false;

  private pX = 150;
  private pY = 400;
  private vX = 0;
  private vY = 0;
  private cameraX = 0;
  private isGrounded = false;
  private animTime = 0;

  private moveLeft = false;
  private moveRight = false;
  private moveJump = false;

  private gravity = 1500;
  private jumpVel = -720;

  private platforms: Platform[] = [];
  private foods: FoodItem[] = [];
  private rings: Ring[] = [];
  private hazards: Hazard[] = [];
  private bombs: Bomb[] = [];

  // Hovering Alien Spaceship Attacker
  private attackerX = 250;
  private attackerY = 120;
  private bombTimer = 0;

  private levelEndX = 5000;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.hunger = 100;
    this.gameOver = false;
    this.won = false;
    this.isPaused = false;
    this.loadLevel(this.level);
  }

  private loadLevel(lv: number) {
    this.pX = 150;
    this.pY = 400;
    this.vX = 0;
    this.vY = 0;
    this.cameraX = 0;
    this.hunger = 100;
    this.platforms = [];
    this.foods = [];
    this.rings = [];
    this.hazards = [];
    this.bombs = [];
    this.bombTimer = 0;
    this.levelEndX = 5000 + (lv - 1) * 1200;

    // Ground platform
    this.platforms.push({ x: 0, y: 560, w: this.levelEndX + 500, h: 140 });

    // Procedural suspended cyber platforms, rings, and food
    const foodTypes: ('burger' | 'apple' | 'pizza')[] = ['burger', 'apple', 'pizza'];
    for (let i = 0; i < 18 + lv * 6; i++) {
      const px = 400 + i * 260 + (Math.random() * 80);
      const py = 340 + (Math.random() * 140);
      const pw = 120 + Math.random() * 100;
      this.platforms.push({ x: px, y: py, w: pw, h: 20 });

      // Rings
      this.rings.push({ x: px + 30, y: py - 35, collected: false });
      this.rings.push({ x: px + 70, y: py - 35, collected: false });

      // Food items for hunger
      if (Math.random() < 0.65) {
        this.foods.push({
          x: px + pw / 2,
          y: py - 40,
          type: foodTypes[Math.floor(Math.random() * foodTypes.length)],
          collected: false,
        });
      }

      // Hazards
      if (Math.random() < 0.35) {
        this.hazards.push({ x: px + 40, y: py - 18, w: 24, h: 18 });
      }
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused || this.won) return;
    this.animTime += dt;

    // 1. Hunger Drain System (Must eat or starve!)
    this.hunger -= 4.2 * dt;
    if (this.hunger <= 0) {
      this.hunger = 0;
      this.lives--;
      this.ctx.audio?.playGameOver?.();
      globalParticles.emitText("STARVED OF HUNGER!", this.pX - this.cameraX, this.pY - 20, "#EF4444", 16);
      if (this.lives <= 0) {
        this.gameOver = true;
        this.ctx.session.setStatus("game-over");
      } else {
        this.hunger = 100;
        this.pX = Math.max(150, this.pX - 400);
      }
    }

    // 2. Hovering Alien Attacker AI
    this.attackerX += ((this.pX + 120) - this.attackerX) * 2.8 * dt;
    this.attackerY = 120 + Math.sin(this.animTime * 3) * 20;

    this.bombTimer += dt;
    const dropRate = Math.max(1.2, 2.6 - this.level * 0.2);
    if (this.bombTimer >= dropRate) {
      this.bombTimer = 0;
      this.bombs.push({ x: this.attackerX, y: this.attackerY + 20, vy: 260 });
      this.ctx.audio?.playLaser?.();
      globalParticles.emitBurst(this.attackerX, this.attackerY + 20, 6, ["#EF4444", "#F59E0B"], 30, 100);
    }

    // Update bombs dropped by attacker
    for (let i = this.bombs.length - 1; i >= 0; i--) {
      const b = this.bombs[i];
      b.vy += 600 * dt;
      b.y += b.vy * dt;

      if (b.y > 580) {
        globalParticles.emitBurst(b.x - this.cameraX, b.y, 12, ["#EF4444", "#F59E0B", "#ffd84d"], 50, 180);
        this.ctx.audio?.playExplosion?.();
        this.bombs.splice(i, 1);
        continue;
      }

      // Check hit on player
      if (Math.hypot(b.x - this.pX, b.y - this.pY) < 28) {
        this.lives--;
        this.ctx.audio?.playExplosion?.();
        globalParticles.emitBurst(this.pX - this.cameraX, this.pY, 20, ["#EF4444", "#FFFFFF"], 70, 240);
        this.bombs.splice(i, 1);

        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        }
        break;
      }
    }

    // 3. Player Physics
    if (this.moveLeft) this.vX -= 2200 * dt;
    if (this.moveRight) this.vX += 2200 * dt;

    this.vY += this.gravity * dt;
    this.vX *= this.isGrounded ? 0.88 : 0.985;
    this.vX = Math.max(-650, Math.min(650, this.vX));

    this.pX += this.vX * dt;
    this.pY += this.vY * dt;

    // Platform collision
    this.isGrounded = false;
    for (const plat of this.platforms) {
      if (
        this.pX + 10 > plat.x &&
        this.pX - 10 < plat.x + plat.w &&
        this.pY + 16 >= plat.y &&
        this.pY - 16 <= plat.y + plat.h &&
        this.vY >= 0
      ) {
        this.pY = plat.y - 16;
        this.vY = 0;
        this.isGrounded = true;
      }
    }

    // Jump handling
    if (this.moveJump && this.isGrounded) {
      this.vY = this.jumpVel;
      this.isGrounded = false;
      this.ctx.audio?.playJump?.();
    }

    // Collect Food Items
    for (const f of this.foods) {
      if (!f.collected && Math.hypot(f.x - this.pX, f.y - this.pY) < 32) {
        f.collected = true;
        this.hunger = Math.min(100, this.hunger + 30);
        this.score += 200 * this.level;
        this.ctx.audio?.playPowerUp?.();
        globalParticles.emitBurst(f.x - this.cameraX, f.y, 14, ["#10B981", "#ffd84d", "#FFFFFF"], 50, 180);
        globalParticles.emitText("+30 HUNGER!", f.x - this.cameraX, f.y - 15, "#10B981", 14);
      }
    }

    // Collect Energy Rings
    for (const r of this.rings) {
      if (!r.collected && Math.hypot(r.x - this.pX, r.y - this.pY) < 28) {
        r.collected = true;
        this.score += 100 * this.level;
        this.ctx.audio?.playCoin?.();
        globalParticles.emitBurst(r.x - this.cameraX, r.y, 8, ["#ffd84d", "#FFFFFF"], 40, 140);
      }
    }

    // Hazard collision
    for (const h of this.hazards) {
      if (
        this.pX + 12 > h.x &&
        this.pX - 12 < h.x + h.w &&
        this.pY + 16 > h.y &&
        this.pY - 16 < h.y + h.h
      ) {
        this.lives--;
        this.ctx.audio?.playGameOver?.();
        globalParticles.emitBurst(this.pX - this.cameraX, this.pY, 20, ["#FF3366", "#F59E0B"], 70, 240);
        if (this.lives <= 0) {
          this.gameOver = true;
          this.ctx.session.setStatus("game-over");
        } else {
          this.pX = Math.max(150, this.pX - 250);
          this.pY = 400;
        }
        break;
      }
    }

    // Camera follow
    this.cameraX = this.pX - 220;

    // Victory check
    if (this.pX >= this.levelEndX) {
      this.won = true;
      this.score += 5000 * this.level;
      this.ctx.audio?.playVictory?.();
      setTimeout(() => {
        this.level++;
        this.loadLevel(this.level);
        this.won = false;
      }, 1500);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if ((action === "ACTION_PRIMARY" || action === "MOVE_UP") && isPressed) {
      this.moveJump = true;
      setTimeout(() => (this.moveJump = false), 100);
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
    pr.clear("#040714");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Parallax Cyberpunk City Skyline
    pr.drawRect(0, 0, w, 560, "#080e1c", true);
    for (let bx = 0; bx < w + 200; bx += 70) {
      const bHeight = 120 + ((bx * 37) % 180);
      pr.drawRect(bx - (this.cameraX * 0.2) % 70, 560 - bHeight, 55, bHeight, "#0f172a", true);
      // Windows
      for (let wy = 560 - bHeight + 15; wy < 550; wy += 22) {
        pr.drawRect(bx - (this.cameraX * 0.2) % 70 + 8, wy, 8, 12, "#1e293b", true);
        pr.drawRect(bx - (this.cameraX * 0.2) % 70 + 26, wy, 8, 12, "#38bdf8", true);
      }
    }

    // 2. Draw Platforms
    for (const plat of this.platforms) {
      const rx = plat.x - this.cameraX;
      if (rx + plat.w < 0 || rx > w) continue;
      pr.drawPixelRect(rx, plat.y, plat.w, plat.h, "#1E293B", "#38BDF8", "#0F172A");
      pr.drawRect(rx, plat.y, plat.w, 3, "#00F0FF", true); // Neon upper strip
    }

    // 3. Draw Golden Rings
    for (const r of this.rings) {
      if (r.collected) continue;
      const rx = r.x - this.cameraX;
      if (rx < -20 || rx > w + 20) continue;
      pr.drawCircle(rx, r.y, 8, "#FACC15", false);
      pr.drawCircle(rx, r.y, 4, "#FEF08A", true);
    }

    // 4. Draw Food Items (Burgers, Apples, Pizzas)
    for (const f of this.foods) {
      if (f.collected) continue;
      const fx = f.x - this.cameraX;
      if (fx < -20 || fx > w + 20) continue;

      if (f.type === 'burger') {
        pr.drawRect(fx - 8, f.y - 4, 16, 4, "#D97706", true); // Bun top
        pr.drawRect(fx - 9, f.y, 18, 3, "#10B981", true);     // Lettuce
        pr.drawRect(fx - 8, f.y + 3, 16, 3, "#78350F", true); // Patty
        pr.drawRect(fx - 8, f.y + 6, 16, 3, "#D97706", true); // Bun bot
      } else if (f.type === 'pizza') {
        pr.drawRect(fx - 7, f.y - 6, 14, 12, "#F59E0B", true);
        pr.drawRect(fx - 5, f.y - 4, 10, 8, "#EF4444", true);
        pr.drawCircle(fx, f.y, 2, "#FDE047", true);
      } else {
        // Apple
        pr.drawCircle(fx, f.y, 7, "#EF4444", true);
        pr.drawRect(fx - 1, f.y - 9, 2, 4, "#10B981", true);
      }
    }

    // 5. Draw Hazard Spikes
    for (const haz of this.hazards) {
      const hx = haz.x - this.cameraX;
      if (hx < -40 || hx > w + 40) continue;
      pr.drawRect(hx, haz.y, haz.w, haz.h, "#EF4444", true);
      pr.drawRect(hx + 4, haz.y + 4, haz.w - 8, haz.h - 4, "#FCA5A5", true);
    }

    // 6. Draw Falling Plasma Bombs
    for (const b of this.bombs) {
      const bx = b.x - this.cameraX;
      pr.drawCircle(bx, b.y, 8, "#EF4444", true);
      pr.drawCircle(bx, b.y, 4, "#FDE047", true);
    }

    // 7. Draw Hovering Alien Attacker (Reference Spaceship)
    drawSpaceshipSprite(pr, this.attackerX - this.cameraX, this.attackerY, 40, Math.PI, "#EF4444");
    // Target Laser Reticle on ground
    pr.drawLine(this.attackerX - this.cameraX, this.attackerY + 20, this.attackerX - this.cameraX, 560, "rgba(239, 68, 68, 0.3)", 1);

    // 8. Draw Player Sonic Runner with Phantom Afterimages
    const rx = this.pX - this.cameraX;
    const ry = this.pY;

    // Afterimage speed trails
    if (Math.abs(this.vX) > 300) {
      pr.drawCircle(rx - Math.sign(this.vX) * 14, ry, 12, "rgba(0, 240, 255, 0.3)", true);
    }

    // Runner Body (Cobalt Blue & Red Sneakers)
    pr.drawCircle(rx, ry - 10, 11, "#0284C7", true); // Blue Head & Quills
    pr.drawCircle(rx, ry, 9, "#38BDF8", true);       // Chest
    pr.drawRect(rx - 6, ry + 8, 12, 6, "#DC2626", true); // Red Speed Shoes
    pr.drawRect(rx - 6, ry + 10, 12, 2, "#FFFFFF", true); // White Sock Stripe

    // Render Particles & Text Popups
    globalParticles.render(pr);

    // 9. Top HUD (Score, Level, Lives, & HUNGER METER)
    pr.drawRect(0, 0, w, 52, "#080e1c", true);
    pr.drawLine(0, 52, w, 52, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 24, { size: 12, color: "#ffd84d", font: "monospace" });
    pr.drawText(`LIVES: ${"♥".repeat(Math.max(0, this.lives))}`, 20, 42, { size: 12, color: "#f43f5e", font: "monospace" });

    // Hunger Meter Gauge Bar
    const hungerW = 160;
    const hungerPct = this.hunger / 100;
    const hungerCol = this.hunger > 50 ? "#10B981" : this.hunger > 25 ? "#F59E0B" : "#EF4444";
    pr.drawText("HUNGER:", w / 2 - 80, 32, { size: 11, color: "#cbd5e1", font: "monospace" });
    pr.drawRect(w / 2 - 20, 22, hungerW, 14, "#0f172a", true);
    pr.drawRect(w / 2 - 20, 22, hungerW * hungerPct, 14, hungerCol, true);
    pr.drawRect(w / 2 - 20, 22, hungerW, 14, "#475569", false);

    pr.drawText(`DISTANCE: ${Math.floor(this.pX)}m / ${this.levelEndX}m`, w - 20, 32, { size: 12, color: "#4de8e8", align: "right", font: "monospace" });

    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("RUN TERMINATED — GAME OVER", w / 2, h / 2 - 10, { size: 22, color: "#FF3366", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO SPRINT AGAIN", w / 2, h / 2 + 18, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
