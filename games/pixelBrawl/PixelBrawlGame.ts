import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";
import {
  drawBrawlerSprite,
  KEN_PALETTE,
  RYU_PALETTE,
  type BrawlerAnimState,
  type BrawlerPalette,
} from "./brawlerSprite";

export type MoveType =
  | "light_punch"
  | "heavy_punch"
  | "light_kick"
  | "heavy_kick"
  | "special";

interface MoveDef {
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  range: number;
  hitY: number; // offset from ground
  hitHeight: number;
  isSpecial?: boolean;
}

const MOVES: Record<MoveType, MoveDef> = {
  light_punch: { startup: 3, active: 4, recovery: 6, damage: 7, range: 44, hitY: -54, hitHeight: 20 },
  heavy_punch: { startup: 6, active: 6, recovery: 12, damage: 16, range: 50, hitY: -70, hitHeight: 40 },
  light_kick: { startup: 4, active: 4, recovery: 8, damage: 9, range: 48, hitY: -28, hitHeight: 20 },
  heavy_kick: { startup: 8, active: 6, recovery: 14, damage: 20, range: 60, hitY: -60, hitHeight: 30 },
  special: { startup: 10, active: 8, recovery: 16, damage: 25, range: 64, hitY: -48, hitHeight: 30, isSpecial: true },
};

interface FighterState {
  x: number;
  y: number;
  vy: number;
  hp: number;
  maxHp: number;
  state: "idle" | "walking" | "crouching" | "jumping" | "attacking" | "blocking" | "hitstun" | "knockdown";
  currentMove: MoveType | null;
  animFrame: number;
  facing: 1 | -1;
  wins: number;
  name: string;
  palette: BrawlerPalette;
  aiTimer: number;
  aiDecision: string;
}

interface FireballProjectile {
  x: number;
  y: number;
  vx: number;
  fromP1: boolean;
  damage: number;
  active: boolean;
  frame: number;
}

export class PixelBrawlGame implements GameInstance {
  private ctx!: GameContext;
  private p1!: FighterState;
  private p2!: FighterState;
  private fireballs: FireballProjectile[] = [];

  private score = 0;
  private level = 1;
  private round = 1;
  private p1Combo = 0;
  private p2Combo = 0;
  private roundTimer = 99;
  private roundOver = false;
  private paused = false;

  private groundY = 550;
  private stageWidth = 600;

  // Input states
  private keys = {
    left: false,
    right: false,
    up: false,
    down: false,
    block: false,
  };

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.round = 1;
    this.score = 0;
    this.level = 1;
    this.roundTimer = 99;
    this.roundOver = false;
    this.fireballs = [];

    this.p1 = {
      x: 160,
      y: this.groundY,
      vy: 0,
      hp: 120,
      maxHp: 120,
      state: "idle",
      currentMove: null,
      animFrame: 0,
      facing: 1,
      wins: 0,
      name: "KEN",
      palette: KEN_PALETTE,
      aiTimer: 0,
      aiDecision: "idle",
    };

    this.p2 = {
      x: 440,
      y: this.groundY,
      vy: 0,
      hp: 120,
      maxHp: 120,
      state: "idle",
      currentMove: null,
      animFrame: 0,
      facing: -1,
      wins: 0,
      name: "SHADOW",
      palette: RYU_PALETTE,
      aiTimer: 0,
      aiDecision: "idle",
    };

    this.resetRoundPositions();
  }

  private resetRoundPositions(): void {
    this.p1.x = 160;
    this.p1.y = this.groundY;
    this.p1.vy = 0;
    this.p1.hp = this.p1.maxHp;
    this.p1.state = "idle";
    this.p1.currentMove = null;
    this.p1.facing = 1;

    this.p2.x = 440;
    this.p2.y = this.groundY;
    this.p2.vy = 0;
    this.p2.hp = this.p2.maxHp;
    this.p2.state = "idle";
    this.p2.currentMove = null;
    this.p2.facing = -1;

    this.roundTimer = 99;
    this.roundOver = false;
    this.p1Combo = 0;
    this.p2Combo = 0;
    this.fireballs = [];
  }

  public update(deltaTime: number): void {
    globalParticles.update(deltaTime);
    if (this.paused) return;

    // Round Timer countdown
    if (!this.roundOver) {
      this.roundTimer = Math.max(0, this.roundTimer - deltaTime * 0.9);
      if (this.roundTimer <= 0) {
        // Time over decision
        if (this.p1.hp >= this.p2.hp) this.handleKnockout(this.p1, this.p2);
        else this.handleKnockout(this.p2, this.p1);
      }
    }

    // Update fighters
    this.updateFighter(this.p1, this.p2, true, deltaTime);
    this.updateFighter(this.p2, this.p1, false, deltaTime);

    // Update Fireball Projectiles
    this.updateFireballs(deltaTime);

    // Check melee attack collisions
    this.checkAttackHits(this.p1, this.p2);
    this.checkAttackHits(this.p2, this.p1);
  }

  private updateFighter(
    f: FighterState,
    opp: FighterState,
    isPlayer: boolean,
    dt: number
  ): void {
    f.animFrame += dt * 60;

    // Automatic facing orientation toward opponent
    if (f.state !== "attacking" && f.state !== "knockdown") {
      f.facing = f.x < opp.x ? 1 : -1;
    }

    // Gravity & Jump Physics
    if (f.y < this.groundY) {
      f.vy += 1500 * dt;
      f.y += f.vy * dt;
      if (f.y >= this.groundY) {
        f.y = this.groundY;
        f.vy = 0;
        if (f.state === "jumping") {
          f.state = "idle";
          this.ctx.audio?.playHit?.();
        }
      }
    }

    // State Processing
    if (f.state === "attacking" && f.currentMove) {
      const move = MOVES[f.currentMove];
      const totalFrames = move.startup + move.active + move.recovery;
      if (f.animFrame >= totalFrames) {
        f.state = "idle";
        f.currentMove = null;
        f.animFrame = 0;
      }
    } else if (f.state === "hitstun") {
      if (f.animFrame > 14) {
        f.state = "idle";
        f.animFrame = 0;
      }
    } else if (f.state === "knockdown") {
      // Round end waiting
    } else {
      if (isPlayer) {
        this.processPlayerInputs(f, opp, dt);
      } else {
        this.processAI(f, opp, dt);
      }
    }

    // Stage Bound Clamping
    f.x = Math.max(40, Math.min(this.stageWidth - 40, f.x));
  }

  private processPlayerInputs(p: FighterState, opp: FighterState, dt: number): void {
    if (p.state === "jumping") {
      if (this.keys.left) p.x -= 220 * dt;
      if (this.keys.right) p.x += 220 * dt;
      return;
    }

    if (this.keys.down) {
      p.state = "crouching";
      return;
    }

    if (this.keys.up && p.y >= this.groundY) {
      p.state = "jumping";
      p.vy = -620;
      p.animFrame = 0;
      this.ctx.audio?.playRotate?.();
      return;
    }

    const moveSpeed = 220;
    if (this.keys.left) {
      p.x -= moveSpeed * dt;
      // If moving away from opponent, automatically block!
      if (p.facing === 1) {
        p.state = "blocking";
      } else {
        p.state = "walking";
      }
    } else if (this.keys.right) {
      p.x += moveSpeed * dt;
      if (p.facing === -1) {
        p.state = "blocking";
      } else {
        p.state = "walking";
      }
    } else {
      p.state = "idle";
    }
  }

  private processAI(ai: FighterState, player: FighterState, dt: number): void {
    ai.aiTimer += dt;
    const dist = Math.abs(ai.x - player.x);

    if (ai.aiTimer > 0.35) {
      ai.aiTimer = 0;
      const roll = Math.random();

      if (dist > 220) {
        // Long distance: Walk forward or throw Hadouken!
        if (roll < 0.45) {
          ai.aiDecision = "walk_forward";
        } else if (roll < 0.8) {
          this.executeMove(ai, "special");
        } else {
          ai.aiDecision = "idle";
        }
      } else if (dist > 80) {
        // Medium distance: Close in, jump kick, or roundhouse
        if (roll < 0.4) {
          ai.aiDecision = "walk_forward";
        } else if (roll < 0.65) {
          this.executeMove(ai, "heavy_kick");
        } else if (roll < 0.85) {
          this.executeMove(ai, "light_kick");
        } else {
          ai.aiDecision = "block";
        }
      } else {
        // Close range: Fast jabs, dragon uppercuts, or block
        if (roll < 0.35) {
          this.executeMove(ai, "light_punch");
        } else if (roll < 0.6) {
          this.executeMove(ai, "heavy_punch");
        } else if (roll < 0.8) {
          this.executeMove(ai, "heavy_kick");
        } else {
          ai.aiDecision = "block";
        }
      }
    }

    // Execute continuous movement decisions
    if (ai.state === "idle" || ai.state === "walking" || ai.state === "blocking") {
      if (ai.aiDecision === "walk_forward") {
        ai.x += (ai.facing === 1 ? 1 : -1) * 160 * dt;
        ai.state = "walking";
      } else if (ai.aiDecision === "block") {
        ai.state = "blocking";
      } else {
        ai.state = "idle";
      }
    }
  }

  private executeMove(f: FighterState, move: MoveType): void {
    if (f.state === "attacking" || f.state === "hitstun" || f.state === "knockdown") return;

    f.state = "attacking";
    f.currentMove = move;
    f.animFrame = 0;

    if (move === "special") {
      this.ctx.audio?.playLaser?.();
      // Spawn Hadouken Energy Wave
      setTimeout(() => {
        if (f.state === "attacking" && f.currentMove === "special") {
          this.fireballs.push({
            x: f.x + f.facing * 40,
            y: f.y - 48,
            vx: f.facing * 380,
            fromP1: f === this.p1,
            damage: 24,
            active: true,
            frame: 0,
          });
          globalParticles.emitBurst(f.x + f.facing * 40, f.y - 48, 14, ["#38BDF8", "#FFFFFF", "#00F0FF"], 60, 200);
        }
      }, 140);
    } else if (move === "heavy_punch") {
      this.ctx.audio?.playPowerUp?.();
    } else {
      this.ctx.audio?.playRotate?.();
    }
  }

  private updateFireballs(dt: number): void {
    for (let i = this.fireballs.length - 1; i >= 0; i--) {
      const fb = this.fireballs[i];
      fb.x += fb.vx * dt;
      fb.frame += dt * 10;

      // Wall hit check
      if (fb.x < 10 || fb.x > this.stageWidth - 10) {
        globalParticles.emitBurst(fb.x, fb.y, 10, ["#38BDF8", "#FFFFFF"], 40, 160);
        this.fireballs.splice(i, 1);
        continue;
      }

      // Check collision with target fighter
      const target = fb.fromP1 ? this.p2 : this.p1;
      const attacker = fb.fromP1 ? this.p1 : this.p2;

      if (Math.abs(fb.x - target.x) < 32 && Math.abs(fb.y - (target.y - 40)) < 40) {
        // Hit target!
        this.fireballs.splice(i, 1);

        const isBlocking = target.state === "blocking";
        const dmg = isBlocking ? Math.floor(fb.damage * 0.2) : fb.damage;
        target.hp = Math.max(0, target.hp - dmg);

        if (isBlocking) {
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(fb.x, fb.y, 8, ["#38BDF8", "#FFFFFF"], 50, 180);
          globalParticles.emitText("GUARD!", target.x, target.y - 80, "#38BDF8", 14);
        } else {
          target.state = "hitstun";
          target.animFrame = 0;
          target.x += Math.sign(fb.vx) * 20;
          this.ctx.audio?.playExplosion?.();
          globalParticles.emitBurst(fb.x, fb.y, 22, ["#EF4444", "#ffd84d", "#FFFFFF"], 80, 260);

          if (fb.fromP1) {
            this.p1Combo++;
            this.score += 300 * this.p1Combo;
            globalParticles.emitText(`HADOUKEN! ${this.p1Combo} HIT`, target.x, target.y - 80, "#ffd84d", 16);
          } else {
            this.p2Combo++;
          }
        }

        if (target.hp <= 0) {
          this.handleKnockout(attacker, target);
        }
      }
    }
  }

  private checkAttackHits(attacker: FighterState, defender: FighterState): void {
    if (attacker.state !== "attacking" || !attacker.currentMove) return;

    const move = MOVES[attacker.currentMove];
    if (move.isSpecial) return; // Special is handled by projectile

    // Only strike during active frames
    const frame = Math.floor(attacker.animFrame);
    if (frame === move.startup + 1) {
      const hitBoxX = attacker.x + attacker.facing * (move.range / 2);
      const hitBoxY = attacker.y + move.hitY;

      const dist = Math.abs(attacker.x - defender.x);
      const inFront = (defender.x - attacker.x) * attacker.facing > 0;

      if (inFront && dist < move.range + 16) {
        const isBlocking = defender.state === "blocking";
        const dmg = isBlocking ? Math.floor(move.damage * 0.2) : move.damage;
        defender.hp = Math.max(0, defender.hp - dmg);

        if (isBlocking) {
          this.ctx.audio?.playHit?.();
          globalParticles.emitBurst(defender.x, defender.y - 50, 6, ["#38BDF8", "#FFFFFF"], 40, 140);
          globalParticles.emitText("BLOCKED", defender.x, defender.y - 80, "#38BDF8", 12);
        } else {
          defender.state = "hitstun";
          defender.animFrame = 0;
          defender.x += attacker.facing * 18;
          this.ctx.audio?.playHit?.();

          const hitCol = attacker.currentMove === "heavy_punch" ? ["#F59E0B", "#EF4444", "#FFFFFF"] : ["#ffd84d", "#FFFFFF"];
          globalParticles.emitBurst(defender.x, hitBoxY, 18, hitCol, 70, 240);

          if (attacker === this.p1) {
            this.p1Combo++;
            this.score += move.damage * 25 * this.p1Combo;
            if (this.p1Combo > 1) {
              globalParticles.emitText(`${this.p1Combo} HIT COMBO!`, defender.x, defender.y - 80, "#ffd84d", 16);
            }
          } else {
            this.p2Combo++;
          }
        }

        if (defender.hp <= 0) {
          this.handleKnockout(attacker, defender);
        }
      }
    }
  }

  private handleKnockout(winner: FighterState, loser: FighterState): void {
    if (this.roundOver) return;
    this.roundOver = true;
    loser.hp = 0;
    loser.state = "knockdown";
    loser.animFrame = 0;

    this.ctx.audio?.playExplosion?.();
    globalParticles.emitBurst(loser.x, loser.y - 30, 30, ["#EF4444", "#F59E0B", "#ffd84d"], 100, 320);

    winner.wins++;
    if (winner === this.p1) {
      this.score += 5000 * this.level;
      this.ctx.audio?.playVictory?.();
    } else {
      this.ctx.audio?.playGameOver?.();
    }

    setTimeout(() => {
      if (this.p1.wins >= 2 || this.p2.wins >= 2) {
        if (this.p1.wins >= 2) {
          this.level++;
          this.score += 10000;
        }
        this.p1.wins = 0;
        this.p2.wins = 0;
        this.round = 1;
      } else {
        this.round++;
      }
      this.resetRoundPositions();
    }, 2200);
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (action === "MOVE_LEFT") this.keys.left = isPressed;
    if (action === "MOVE_RIGHT") this.keys.right = isPressed;
    if (action === "MOVE_UP") this.keys.up = isPressed;
    if (action === "MOVE_DOWN") this.keys.down = isPressed;

    if (this.p1.state !== "knockdown" && !this.roundOver && !this.paused) {
      if (action === "ACTION_PRIMARY" && isPressed) {
        // Light Punch (Jab)
        this.executeMove(this.p1, "light_punch");
      }
      if (action === "ACTION_SECONDARY" && isPressed) {
        // Heavy Kick (Roundhouse)
        this.executeMove(this.p1, "heavy_kick");
      }
      if (action === "ROTATE" && isPressed) {
        // Special Move (Hadouken Fireball Blast!)
        this.executeMove(this.p1, "special");
      }
    }

    if (action === "RESTART" && isPressed) this.reset();
  }

  public pause(): void { this.paused = true; }
  public resume(): void { this.paused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Street Fighter Temple Dojo Stage (Moonlit Night & Bamboo Silhouette)
    pr.drawRect(0, 0, w, this.groundY, "#0B1021", true); // Deep Night Sky
    pr.drawCircle(480, 140, 50, "#FEF08A", true);       // Full Moon
    pr.drawCircle(480, 140, 50, "rgba(254, 240, 138, 0.2)", false);

    // Temple Traditional Pagoda Roof Silhouette
    pr.drawRect(30, this.groundY - 140, 180, 140, "#0F172A", true);
    pr.drawRect(w - 210, this.groundY - 140, 180, 140, "#0F172A", true);
    pr.drawPixelBlock(100, this.groundY - 160, 40, "#1E293B", "#334155", "#020617");
    pr.drawPixelBlock(w - 140, this.groundY - 160, 40, "#1E293B", "#334155", "#020617");

    // Glowing Red Paper Lanterns
    pr.drawCircle(80, this.groundY - 80, 10, "#DC2626", true);
    pr.drawCircle(80, this.groundY - 80, 5, "#FDE047", true);
    pr.drawCircle(w - 80, this.groundY - 80, 10, "#DC2626", true);
    pr.drawCircle(w - 80, this.groundY - 80, 5, "#FDE047", true);

    // Polished Cedar Wood Dojo Floor
    pr.drawRect(0, this.groundY, w, h - this.groundY, "#78350F", true);
    pr.drawRect(0, this.groundY, w, 4, "#D97706", true); // Highlight Edge
    for (let lx = 0; lx < w; lx += 48) {
      pr.drawRect(lx, this.groundY + 4, 2, h - this.groundY, "#451A03", true);
    }

    // 2. Draw Fireball Plasma Projectiles
    for (const fb of this.fireballs) {
      // Pulsing Hadouken Core
      pr.drawCircle(fb.x, fb.y, 16, "rgba(56, 189, 248, 0.5)", true);
      pr.drawCircle(fb.x, fb.y, 11, "#38BDF8", true);
      pr.drawCircle(fb.x, fb.y, 5, "#FFFFFF", true);
      // Flame trail particles
      pr.drawCircle(fb.x - Math.sign(fb.vx) * 12, fb.y, 8, "rgba(0, 240, 255, 0.4)", true);
    }

    // 3. Draw Both Fighters using detailed reference martial artist sprite
    drawBrawlerSprite(
      pr,
      this.p1.x,
      this.p1.y,
      (this.p1.currentMove as BrawlerAnimState) || (this.p1.state as BrawlerAnimState),
      this.p1.animFrame,
      this.p1.facing,
      this.p1.palette
    );

    drawBrawlerSprite(
      pr,
      this.p2.x,
      this.p2.y,
      (this.p2.currentMove as BrawlerAnimState) || (this.p2.state as BrawlerAnimState),
      this.p2.animFrame,
      this.p2.facing,
      this.p2.palette
    );

    // 4. Render Global Particle Bursts & Hit Sparks
    globalParticles.render(pr);

    // 5. Classic Street Fighter II Championship HUD
    const barW = 210;
    const barH = 18;
    const barY = 28;

    // P1 Health Bar (Ken - Crimson/Gold)
    pr.drawRect(20, barY, barW, barH, "#7F1D1D", true);
    const p1HpW = Math.max(0, (this.p1.hp / this.p1.maxHp) * barW);
    pr.drawRect(20 + (barW - p1HpW), barY, p1HpW, barH, "#FACC15", true);
    pr.drawRect(20, barY, barW, barH, "#F59E0B", false);

    // P2 Health Bar (Shadow - Navy/Ruby)
    pr.drawRect(w - 20 - barW, barY, barW, barH, "#7F1D1D", true);
    const p2HpW = Math.max(0, (this.p2.hp / this.p2.maxHp) * barW);
    pr.drawRect(w - 20 - barW, barY, p2HpW, barH, "#FACC15", true);
    pr.drawRect(w - 20 - barW, barY, barW, barH, "#F59E0B", false);

    // Fighter Names & Win Badges
    pr.drawText(`KEN ${"★ ".repeat(this.p1.wins)}`, 20, barY - 8, { size: 13, color: "#F87171", font: "monospace" });
    pr.drawText(`${"★ ".repeat(this.p2.wins)}SHADOW`, w - 20, barY - 8, { size: 13, color: "#93C5FD", align: "right", font: "monospace" });

    // Round Timer Box (Center 99-second display)
    const timerW = 48;
    pr.drawRect(w / 2 - timerW / 2, 18, timerW, 34, "#0F172A", true);
    pr.drawRect(w / 2 - timerW / 2, 18, timerW, 34, "#FACC15", false);
    pr.drawText(`${Math.ceil(this.roundTimer)}`, w / 2, 42, {
      size: 20,
      color: "#FFD84D",
      align: "center",
      font: "monospace",
    });

    // Top Header: Score & Round
    pr.drawText(`SCORE: ${this.score}`, w / 2, 70, { size: 12, color: "#38BDF8", align: "center", font: "monospace" });
    pr.drawText(`ROUND ${this.round}`, w / 2, 88, { size: 12, color: "#FEF08A", align: "center", font: "monospace" });

    // Controls Legend Footer
    pr.drawRect(12, h - 28, w - 24, 20, "rgba(15, 23, 42, 0.85)", true);
    pr.drawText(
      "[Z/SPACE: JAB PUNCH  •  X: HEAVY KICK  •  C: HADOUKEN FIREBALL  •  HOLD BACK: GUARD]",
      w / 2,
      h - 14,
      {
        size: 9,
        color: "#94A3B8",
        align: "center",
        font: "monospace",
      }
    );

    // Knockout Overlay
    if (this.roundOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#EF4444", false);
      pr.drawText("K. O. !", w / 2, h / 2 - 8, { size: 36, color: "#EF4444", align: "center", font: "monospace" });
      const winnerName = this.p1.hp > 0 ? "KEN WINS" : "SHADOW WINS";
      pr.drawText(winnerName, w / 2, h / 2 + 22, { size: 16, color: "#FFD84D", align: "center", font: "monospace" });
    }
  }
}
