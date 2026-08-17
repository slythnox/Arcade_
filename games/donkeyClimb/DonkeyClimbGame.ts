import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface Barrel {
  x: number;
  y: number;
  floor: number;
  dir: number;
  active: boolean;
  angle: number;
  isBlue?: boolean;
}

interface Fireball {
  x: number;
  y: number;
  floor: number;
  dir: number;
  jumpTimer: number;
}

interface Elevator {
  x: number;
  y: number;
  minY: number;
  maxY: number;
  dir: number;
  speed: number;
}

interface Rivet {
  x: number;
  floor: number;
  active: boolean;
}

export class DonkeyClimbGame implements GameInstance {
  private ctx!: GameContext;
  private isPaused: boolean = false;
  private gameOver: boolean = false;
  private isWon: boolean = false;
  private score: number = 0;
  private level: number = 1;
  private maxLevels: number = 4;
  private lives: number = 3;

  private playerX: number = 100;
  private playerY: number = 550;
  private playerVY: number = 0;
  private isJumping: boolean = false;
  private isClimbing: boolean = false;
  private climbFrame: number = 0;
  private currentLadderIdx: number = -1;
  private playerFloor: number = 0;
  private facingRight: boolean = true;
  private moveLeft: boolean = false;
  private moveRight: boolean = false;
  private moveUp: boolean = false;
  private moveDown: boolean = false;

  private barrels: Barrel[] = [];
  private fireballs: Fireball[] = [];
  private elevators: Elevator[] = [];
  private rivets: Rivet[] = [];
  private barrelSpawnTimer: number = 0;
  private fireballSpawnTimer: number = 0;
  private animTime: number = 0;
  private kongChestBeat: number = 0;

  // Centered Stage Dimensions
  private stageWidth: number = 520;
  private stageLeft: number = 40;
  private readonly floorY = [560, 460, 360, 260, 150];

  // Ladders per level
  private ladders: { x: number; bottomFloor: number; topFloor: number }[] = [];

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.isPaused = false;
    this.gameOver = false;
    this.isWon = false;
    this.score = 0;
    this.level = 1;
    this.lives = 3;
    this.setupLevel(this.level);
  }

  private setupLevel(lvl: number): void {
    this.playerX = 80;
    this.playerFloor = 0;
    this.playerY = this.floorY[0];
    this.playerVY = 0;
    this.isJumping = false;
    this.isClimbing = false;
    this.barrels = [];
    this.fireballs = [];
    this.elevators = [];
    this.rivets = [];
    this.barrelSpawnTimer = 0;
    this.fireballSpawnTimer = 0;
    this.isWon = false;

    // Define Ladders based on level layout
    if (lvl === 1) {
      // Level 1: 25m Sloped Girders
      this.ladders = [
        { x: 440, bottomFloor: 0, topFloor: 1 },
        { x: 120, bottomFloor: 1, topFloor: 2 },
        { x: 440, bottomFloor: 2, topFloor: 3 },
        { x: 200, bottomFloor: 3, topFloor: 4 },
      ];
    } else if (lvl === 2) {
      // Level 2: 50m Conveyor Belts & Flaming Oil Drums
      this.ladders = [
        { x: 240, bottomFloor: 0, topFloor: 1 },
        { x: 450, bottomFloor: 1, topFloor: 2 },
        { x: 110, bottomFloor: 2, topFloor: 3 },
        { x: 380, bottomFloor: 3, topFloor: 4 },
      ];
    } else if (lvl === 3) {
      // Level 3: 75m Elevators & Lifts
      this.ladders = [
        { x: 150, bottomFloor: 0, topFloor: 1 },
        { x: 420, bottomFloor: 2, topFloor: 3 },
        { x: 260, bottomFloor: 3, topFloor: 4 },
      ];
      this.elevators = [
        { x: 280, y: 460, minY: 260, maxY: 460, dir: -1, speed: 80 },
        { x: 340, y: 260, minY: 260, maxY: 460, dir: 1, speed: 80 },
      ];
    } else {
      // Level 4: 100m Rivet Collapse Boss Chamber!
      this.ladders = [
        { x: 120, bottomFloor: 0, topFloor: 1 },
        { x: 440, bottomFloor: 0, topFloor: 1 },
        { x: 220, bottomFloor: 1, topFloor: 2 },
        { x: 340, bottomFloor: 1, topFloor: 2 },
        { x: 140, bottomFloor: 2, topFloor: 3 },
        { x: 420, bottomFloor: 2, topFloor: 3 },
        { x: 280, bottomFloor: 3, topFloor: 4 },
      ];
      this.rivets = [
        { x: 180, floor: 1, active: true },
        { x: 380, floor: 1, active: true },
        { x: 180, floor: 2, active: true },
        { x: 380, floor: 2, active: true },
        { x: 180, floor: 3, active: true },
        { x: 380, floor: 3, active: true },
      ];
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.isPaused || this.gameOver || this.isWon) return;

    this.animTime += dt;
    this.kongChestBeat += dt * 6;

    // Smooth horizontal movement
    const speed = 190;
    if (this.moveLeft && !this.isClimbing) {
      this.playerX -= speed * dt;
      this.facingRight = false;
    }
    if (this.moveRight && !this.isClimbing) {
      this.playerX += speed * dt;
      this.facingRight = true;
    }

    this.playerX = Math.max(this.stageLeft + 15, Math.min(this.stageLeft + this.stageWidth - 15, this.playerX));

    // Jump Physics
    if (this.isJumping) {
      this.playerVY += 1100 * dt;
      this.playerY += this.playerVY * dt;

      if (this.playerY >= this.floorY[this.playerFloor]) {
        this.playerY = this.floorY[this.playerFloor];
        this.playerVY = 0;
        this.isJumping = false;
        this.ctx.audio?.playHit?.();
      }
    }

    // Smooth Ladder Climbing Logic
    if (this.isClimbing) {
      const climbSpeed = 140;
      if (this.moveUp) {
        this.playerY -= climbSpeed * dt;
        this.climbFrame += dt * 10;

        // Check if reached top of ladder
        const targetFloorY = this.floorY[this.playerFloor + 1];
        if (this.playerY <= targetFloorY) {
          this.playerY = targetFloorY;
          this.playerFloor++;
          this.isClimbing = false;
          this.score += 150 * this.level;
          this.ctx.audio?.playVictory?.();
        }
      } else if (this.moveDown) {
        this.playerY += climbSpeed * dt;
        this.climbFrame += dt * 10;

        // Check if reached bottom of ladder
        const targetFloorY = this.floorY[this.playerFloor - 1];
        if (this.playerY >= targetFloorY) {
          this.playerY = targetFloorY;
          this.playerFloor--;
          this.isClimbing = false;
        }
      }
    }

    // Update Elevators
    for (const el of this.elevators) {
      el.y += el.dir * el.speed * dt;
      if (el.y <= el.minY) {
        el.y = el.minY;
        el.dir = 1;
      } else if (el.y >= el.maxY) {
        el.y = el.maxY;
        el.dir = -1;
      }

      // Check player riding elevator
      if (!this.isJumping && !this.isClimbing) {
        if (Math.abs(this.playerX - el.x) < 24 && Math.abs(this.playerY - el.y) < 14) {
          this.playerY = el.y;
        }
      }
    }

    // Check Rivet collection (Level 4 Boss)
    if (this.level === 4) {
      for (const r of this.rivets) {
        if (r.active && r.floor === this.playerFloor && Math.abs(this.playerX - r.x) < 18) {
          r.active = false;
          this.score += 500;
          this.ctx.audio?.playCoin?.();
          globalParticles.emitBurst(r.x, this.floorY[r.floor], 14, ["#FDE047", "#FFFFFF", "#F59E0B"], 50, 180);
          globalParticles.emitText("+500 RIVET REMOVED!", r.x, this.floorY[r.floor] - 20, "#FDE047", 12);

          // If all rivets pulled, defeat Donkey Kong!
          if (this.rivets.every((rv) => !rv.active)) {
            this.handleLevelVictory();
          }
        }
      }
    }

    // Barrel Spawning
    this.barrelSpawnTimer += dt;
    const spawnRate = Math.max(1.6, 3.4 - this.level * 0.4);
    if (this.barrelSpawnTimer > spawnRate) {
      this.barrelSpawnTimer = 0;
      const isBlue = this.level >= 2 && Math.random() < 0.35;
      this.barrels.push({
        x: this.stageLeft + 80,
        y: this.floorY[4],
        floor: 4,
        dir: 1,
        active: true,
        angle: 0,
        isBlue,
      });
      this.ctx.audio?.playDrop?.();
      globalParticles.emitBurst(this.stageLeft + 80, this.floorY[4] - 10, 8, ["#B45309", "#D97706"], 30, 100);
    }

    // Update Barrels Rolling Down Zig-Zag Girders
    const barrelSpeed = 160 + this.level * 18;
    for (const b of this.barrels) {
      if (!b.active) continue;

      b.x += b.dir * barrelSpeed * dt;
      b.angle += b.dir * 8 * dt;

      // Drop down to next floor at edges
      if (b.dir === 1 && b.x > this.stageLeft + this.stageWidth - 25) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floorY[b.floor];
          b.dir = -1;
          this.ctx.audio?.playHit?.();
        } else {
          b.active = false;
          this.score += 50 * this.level;
        }
      } else if (b.dir === -1 && b.x < this.stageLeft + 25) {
        if (b.floor > 0) {
          b.floor--;
          b.y = this.floorY[b.floor];
          b.dir = 1;
          this.ctx.audio?.playHit?.();
        } else {
          b.active = false;
          this.score += 50 * this.level;
        }
      }

      // Check Collision with Player
      if (
        b.floor === this.playerFloor &&
        Math.abs(b.x - this.playerX) < 18 &&
        Math.abs(b.y - this.playerY) < 22
      ) {
        this.handlePlayerHit();
        break;
      }
    }

    // Check Victory (Reaching Pauline at Floor 4)
    if (this.level < 4 && this.playerFloor === 4 && this.playerX > this.stageLeft + 360) {
      this.handleLevelVictory();
    }
  }

  private handlePlayerHit(): void {
    this.lives--;
    this.ctx.audio?.playExplosion?.();
    globalParticles.emitBurst(this.playerX, this.playerY - 14, 24, ["#DC2626", "#2563EB", "#FFFFFF"], 80, 260);

    if (this.lives <= 0) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
    } else {
      this.playerX = this.stageLeft + 40;
      this.playerFloor = 0;
      this.playerY = this.floorY[0];
      this.isJumping = false;
      this.isClimbing = false;
      this.barrels = [];
    }
  }

  private handleLevelVictory(): void {
    this.isWon = true;
    this.score += 3000 * this.level;
    this.ctx.audio?.playVictory?.();
    globalParticles.emitBurst(this.stageLeft + 420, this.floorY[4] - 30, 40, ["#F472B6", "#FFD84D", "#FFFFFF"], 100, 320);

    setTimeout(() => {
      if (this.level < this.maxLevels) {
        this.level++;
        this.setupLevel(this.level);
      } else {
        this.level = 1;
        this.setupLevel(1);
      }
    }, 2400);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.moveLeft = isPressed;
    if (action === "MOVE_RIGHT") this.moveRight = isPressed;
    if (action === "MOVE_UP") this.moveUp = isPressed;
    if (action === "MOVE_DOWN") this.moveDown = isPressed;

    if (action === "MOVE_UP" && isPressed && !this.isClimbing && !this.isJumping) {
      // Find matching ladder to climb up
      for (const lad of this.ladders) {
        if (lad.bottomFloor === this.playerFloor && Math.abs(this.playerX - lad.x) < 22) {
          this.isClimbing = true;
          this.playerX = lad.x;
          this.ctx.audio?.playJump?.();
          break;
        }
      }
    }

    if (action === "MOVE_DOWN" && isPressed && !this.isClimbing && !this.isJumping) {
      // Find matching ladder to climb down
      for (const lad of this.ladders) {
        if (lad.topFloor === this.playerFloor && Math.abs(this.playerX - lad.x) < 22) {
          this.isClimbing = true;
          this.playerX = lad.x;
          this.ctx.audio?.playJump?.();
          break;
        }
      }
    }

    if ((action === "ACTION_PRIMARY" || action === "ROTATE") && isPressed) {
      if (!this.isJumping && !this.isClimbing) {
        this.isJumping = true;
        this.playerVY = -460;
        this.ctx.audio?.playJump?.();
        globalParticles.emitBurst(this.playerX, this.playerY, 6, ["#DC2626", "#FFFFFF"], 30, 100);
      }
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

    const w = pr.getWidth();
    const h = pr.getHeight();

    // Calculate Stage Centering Offsets
    this.stageWidth = Math.min(520, w - 40);
    this.stageLeft = Math.floor((w - this.stageWidth) / 2);

    // 1. Steel Girder Gantry Floors (Classic Pink/Magenta Arcade Beams)
    for (let f = 0; f < 5; f++) {
      const gy = this.floorY[f];
      pr.drawRect(this.stageLeft, gy, this.stageWidth, 16, "#BE185D", true);
      pr.drawRect(this.stageLeft, gy + 12, this.stageWidth, 4, "#831843", true);

      // Girder Rivets & Cross-Trusses
      for (let x = this.stageLeft; x < this.stageLeft + this.stageWidth; x += 28) {
        pr.drawLine(x, gy, x + 14, gy + 16, "#FDA4AF", 1.5);
        pr.drawLine(x + 14, gy + 16, x + 28, gy + 16, "#FDA4AF", 1.5);
        pr.drawCircle(x + 2, gy + 4, 1.5, "#FCE7F3", true); // Rivet
      }
    }

    // 2. Ladders with Blue Steel Rails & Glowing Rungs
    for (const lad of this.ladders) {
      const lx = lad.x;
      const topY = this.floorY[lad.topFloor];
      const botY = this.floorY[lad.bottomFloor];

      pr.drawLine(lx - 10, topY + 16, lx - 10, botY, "#38BDF8", 3);
      pr.drawLine(lx + 10, topY + 16, lx + 10, botY, "#38BDF8", 3);

      for (let y = topY + 22; y < botY; y += 12) {
        pr.drawLine(lx - 10, y, lx + 10, y, "#93C5FD", 2);
      }
    }

    // 3. Elevators (Level 3)
    for (const el of this.elevators) {
      pr.drawRect(el.x - 22, el.y, 44, 8, "#F59E0B", true);
      pr.drawRect(el.x - 22, el.y + 6, 44, 2, "#B45309", true);
      pr.drawLine(el.x, el.minY, el.x, el.maxY, "rgba(245, 158, 11, 0.3)", 1);
    }

    // 4. Rivet Pegs (Level 4 Boss Chamber)
    for (const r of this.rivets) {
      if (r.active) {
        pr.drawCircle(r.x, this.floorY[r.floor] + 8, 5, "#FDE047", true);
        pr.drawCircle(r.x, this.floorY[r.floor] + 8, 2, "#FFFFFF", true);
      }
    }

    // 5. Flaming Oil Drums (Base Floor)
    const drumX = this.stageLeft + 40;
    const drumY = this.floorY[0] - 22;
    pr.drawPixelBlock(drumX - 10, drumY, 20, "#1E3A8A", "#3B82F6", "#172554");
    // Animated Fire
    const fireFlicker = Math.sin(this.animTime * 18) * 3;
    pr.drawCircle(drumX, drumY - 6 + fireFlicker, 8, "#EF4444", true);
    pr.drawCircle(drumX, drumY - 6 + fireFlicker, 4, "#F59E0B", true);
    pr.drawCircle(drumX, drumY - 6 + fireFlicker, 2, "#FEF08A", true);

    // 6. Draw Donkey Kong Gorilla with Barrel Hopper Stack
    const apeX = this.stageLeft + 90;
    const apeY = this.floorY[4] - 38;

    // Wooden Barrel Hopper Stack
    pr.drawPixelRect(this.stageLeft + 30, apeY + 6, 26, 28, "#B45309", "#D97706", "#78350F");
    pr.drawPixelRect(this.stageLeft + 36, apeY - 14, 24, 24, "#B45309", "#D97706", "#78350F");

    // Kong Gorilla Body & Chest Beating Animation
    const chestArmWiggle = Math.sin(this.kongChestBeat) * 4;
    pr.drawRect(apeX - 22, apeY - 4, 44, 38, "#78350F", true);
    pr.drawCircle(apeX, apeY - 12, 16, "#92400E", true);
    pr.drawCircle(apeX, apeY + 8, 14, "#D97706", true);
    // Arms
    pr.drawRect(apeX - 26, apeY + chestArmWiggle, 8, 20, "#78350F", true);
    pr.drawRect(apeX + 18, apeY - chestArmWiggle, 8, 20, "#78350F", true);

    // Expressive Gorilla Face
    pr.drawCircle(apeX - 6, apeY - 14, 3, "#FFFFFF", true);
    pr.drawCircle(apeX + 6, apeY - 14, 3, "#FFFFFF", true);
    pr.drawCircle(apeX - 5, apeY - 14, 1.5, "#000000", true);
    pr.drawCircle(apeX + 7, apeY - 14, 1.5, "#000000", true);
    pr.drawRect(apeX - 8, apeY - 8, 16, 6, "#D97706", true); // Snout

    // 7. Draw Pauline Damsel at Top
    const damselX = this.stageLeft + 420;
    const damselY = this.floorY[4] - 28;
    pr.drawRect(damselX - 8, damselY + 8, 16, 20, "#F472B6", true);
    pr.drawCircle(damselX, damselY, 7, "#FDE047", true); // Blonde Hair
    pr.drawCircle(damselX, damselY + 2, 5, "#FED7AA", true);
    const heartPulse = Math.sin(this.animTime * 4) * 3;
    pr.drawText("HELP!", damselX, damselY - 16 + heartPulse, { size: 12, color: "#F43F5E", align: "center", font: "monospace" });

    // 8. Draw Animated Rolling Barrels
    for (const b of this.barrels) {
      if (!b.active) continue;
      pr.save();
      pr.translate(b.x, b.y - 12);
      pr.rotate(b.angle);

      // Wooden Barrel with Metallic Bands & Spokes
      const barrelColor = b.isBlue ? "#2563EB" : "#B45309";
      pr.drawCircle(0, 0, 13, barrelColor, true);
      pr.drawCircle(0, 0, 13, "#78350F", false);
      pr.drawLine(-11, -5, 11, -5, "#CBD5E1", 2);
      pr.drawLine(-11, 5, 11, 5, "#CBD5E1", 2);
      pr.drawLine(-6, -11, -6, 11, "#78350F", 1.5);
      pr.drawLine(6, -11, 6, 11, "#78350F", 1.5);
      pr.restore();
    }

    // 9. Draw Jumpman Player with Enhanced Ladder Climbing Animation
    const px = this.playerX;
    const py = this.playerY;

    if (this.isClimbing) {
      // Detailed Hand-Over-Hand Ladder Climbing Animation
      const armPhase = Math.sin(this.climbFrame);
      const armL = armPhase > 0 ? -6 : 4;
      const armR = armPhase > 0 ? 4 : -6;
      const legL = armPhase > 0 ? 3 : -3;
      const legR = armPhase > 0 ? -3 : 3;

      // Blue Overalls (Back View)
      pr.drawRect(px - 7, py - 20, 14, 16, "#2563EB", true);
      pr.drawRect(px - 5, py - 20, 3, 12, "#1D4ED8", true);
      pr.drawRect(px + 2, py - 20, 3, 12, "#1D4ED8", true);

      // Red Cap (Back View)
      pr.drawCircle(px, py - 26, 6, "#DC2626", true);
      pr.drawRect(px - 7, py - 26, 14, 3, "#B91C1C", true);

      // Alternating Reaching Arms grabbing rungs
      pr.drawRect(px - 11, py - 26 + armL, 4, 8, "#DC2626", true);
      pr.drawRect(px - 12, py - 28 + armL, 5, 3, "#FED7AA", true); // Left Hand

      pr.drawRect(px + 7, py - 26 + armR, 4, 8, "#DC2626", true);
      pr.drawRect(px + 7, py - 28 + armR, 5, 3, "#FED7AA", true);  // Right Hand

      // Stepping Feet on Rungs
      pr.drawRect(px - 8, py - 4 + legL, 5, 4, "#78350F", true);
      pr.drawRect(px + 3, py - 4 + legR, 5, 4, "#78350F", true);
    } else {
      // Running / Jumping Pose
      const walkBob = Math.sin(this.animTime * 14) * 2;
      pr.drawRect(px - 8, py - 18 + walkBob, 16, 18, "#DC2626", true); // Red Shirt
      pr.drawRect(px - 7, py - 12 + walkBob, 14, 12, "#2563EB", true); // Blue Overalls
      pr.drawRect(px - 3, py - 10 + walkBob, 6, 2, "#FACC15", true); // Yellow Buckle

      // Head & Cap
      pr.drawCircle(px, py - 24 + walkBob, 6, "#FED7AA", true);
      pr.drawRect(px - 8, py - 30 + walkBob, 16, 6, "#DC2626", true);

      // Mustache & Face
      const eyeX = this.facingRight ? px + 3 : px - 3;
      pr.drawRect(eyeX - 1, py - 25 + walkBob, 2, 2, "#000000", true);
      pr.drawRect(eyeX - 3, py - 22 + walkBob, 6, 3, "#451A03", true); // Mustache
    }

    // Render Global Particles & Floating Text
    globalParticles.render(pr);

    // 10. Top HUD
    pr.drawRect(0, 0, w, 44, "#080e1c", true);
    pr.drawLine(0, 44, w, 44, "#1e293b", 1);
    pr.drawText(`SCORE: ${this.score}`, 20, 28, { size: 12, color: "#ffd84d", font: "monospace" });
    pr.drawText(`DONKEY CLIMB • LEVEL ${this.level}/${this.maxLevels}`, w / 2, 28, { size: 13, color: "#4de8e8", align: "center", font: "monospace" });
    pr.drawText(`LIVES: ${"♥ ".repeat(Math.max(0, this.lives))}`, w - 20, 28, { size: 12, color: "#f43f5e", align: "right", font: "monospace" });

    // Overlay messages
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 40, w, 80, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 40, w, 80, "#ef4444", false);
      pr.drawText("GAME OVER", w / 2, h / 2 - 6, { size: 24, color: "#ef4444", align: "center", font: "monospace" });
      pr.drawText("PRESS [R] TO RETRY", w / 2, h / 2 + 20, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    } else if (this.isWon) {
      pr.drawRect(0, h / 2 - 40, w, 80, "rgba(8,14,28,0.95)", true);
      pr.drawRect(0, h / 2 - 40, w, 80, "#22c55e", false);
      pr.drawText("STAGE CLEAR!", w / 2, h / 2 - 6, { size: 24, color: "#22c55e", align: "center", font: "monospace" });
      pr.drawText(`RESCUING DAMSEL — ADVANCING TO LEVEL ${this.level}`, w / 2, h / 2 + 20, { size: 12, color: "#cbd5e1", align: "center", font: "monospace" });
    }
  }
}
