import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface Ball {
  pos: Vector2;
  vel: Vector2;
  radius: number;
  color: string;
  isCue: boolean;
  isStripe: boolean;
  potted: boolean;
  points: number;
  number: number;
}

const BALL_COLORS: Record<number, string> = {
  1: "#FACC15", // 1 Solid Yellow
  2: "#2563EB", // 2 Solid Blue
  3: "#DC2626", // 3 Solid Red
  4: "#7C3AED", // 4 Solid Purple
  5: "#EA580C", // 5 Solid Orange
  6: "#16A34A", // 6 Solid Green
  7: "#991B1B", // 7 Solid Maroon
  8: "#0F172A", // 8 The 8-Ball
  9: "#FACC15", // 9 Stripe Yellow
  10: "#2563EB", // 10 Stripe Blue
  11: "#DC2626", // 11 Stripe Red
  12: "#7C3AED", // 12 Stripe Purple
  13: "#EA580C", // 13 Stripe Orange
  14: "#16A34A", // 14 Stripe Green
  15: "#991B1B", // 15 Stripe Maroon
};

export class PoolSimulatorGame implements GameInstance {
  private ctx!: GameContext;
  private balls: Ball[] = [];
  private cueAngle: number = 0;
  private power: number = 0;
  private maxPower: number = 1200;
  private powerDir: number = 1;
  private isAiming: boolean = true;
  private score: number = 0;
  private level: number = 1;
  private isPaused: boolean = false;
  private animTime: number = 0;

  // Table Geometry
  private tableOuterX = 36;
  private tableOuterY = 80;
  private tableOuterW = 528;
  private tableOuterH = 460;

  private tableX = 64;
  private tableY = 108;
  private tableW = 472;
  private tableH = 404;

  private pockets: { pos: Vector2; radius: number }[] = [];

  private isDragging: boolean = false;
  private dragStart: Vector2 = Vector2.zero();
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

    this.boundPointerDown = (e: MouseEvent | PointerEvent) => {
      if (!this.isAiming || this.isPaused) return;
      const mousePos = getCanvasPos(e);
      if (mousePos) {
        this.isDragging = true;
        this.dragStart = mousePos;
        const cueBall = this.balls.find((b) => b.isCue && !b.potted);
        if (cueBall) {
          const delta = mousePos.sub(cueBall.pos);
          this.cueAngle = Math.atan2(delta.y, delta.x);
        }
      }
    };

    this.boundPointerMove = (e: MouseEvent | PointerEvent) => {
      if (!this.isAiming || this.isPaused) return;
      const mousePos = getCanvasPos(e);
      if (mousePos) {
        const cueBall = this.balls.find((b) => b.isCue && !b.potted);
        if (cueBall) {
          if (!this.isDragging) {
            const delta = mousePos.sub(cueBall.pos);
            this.cueAngle = Math.atan2(delta.y, delta.x);
          } else {
            const dragDist = mousePos.distance(this.dragStart);
            this.power = Math.min(this.maxPower, dragDist * 6.5);
          }
        }
      }
    };

    this.boundPointerUp = () => {
      if (this.isDragging && this.isAiming) {
        this.isDragging = false;
        if (this.power > 80) {
          this.shootCueBall();
        } else {
          this.power = 0;
        }
      }
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
    this.initTable();
  }

  private initTable(): void {
    const pocketRadius = 18;
    this.pockets = [
      { pos: new Vector2(this.tableX + 4, this.tableY + 4), radius: pocketRadius },
      { pos: new Vector2(this.tableX + this.tableW / 2, this.tableY - 2), radius: pocketRadius },
      { pos: new Vector2(this.tableX + this.tableW - 4, this.tableY + 4), radius: pocketRadius },
      { pos: new Vector2(this.tableX + 4, this.tableY + this.tableH - 4), radius: pocketRadius },
      { pos: new Vector2(this.tableX + this.tableW / 2, this.tableY + this.tableH + 2), radius: pocketRadius },
      { pos: new Vector2(this.tableX + this.tableW - 4, this.tableY + this.tableH - 4), radius: pocketRadius },
    ];

    this.balls = [];

    // 1. Pristine Ivory Cue Ball
    this.balls.push({
      pos: new Vector2(this.tableX + this.tableW * 0.28, this.tableY + this.tableH / 2),
      vel: Vector2.zero(),
      radius: 11,
      color: "#FFFFFF",
      isCue: true,
      isStripe: false,
      potted: false,
      points: 0,
      number: 0,
    });

    // 2. Official 15-Ball Triangle Rack
    const rackStartX = this.tableX + this.tableW * 0.72;
    const rackStartY = this.tableY + this.tableH / 2;
    const ballSpacing = 22.5;

    const rackNumbers = [
      [1],
      [2, 9],
      [3, 8, 10],
      [4, 11, 5, 12],
      [6, 13, 14, 7, 15],
    ];

    for (let col = 0; col < rackNumbers.length; col++) {
      const rowArr = rackNumbers[col];
      for (let row = 0; row < rowArr.length; row++) {
        const num = rowArr[row];
        const bx = rackStartX + col * (ballSpacing * 0.866);
        const by = rackStartY + (row - (rowArr.length - 1) / 2) * ballSpacing;

        this.balls.push({
          pos: new Vector2(bx, by),
          vel: Vector2.zero(),
          radius: 11,
          color: BALL_COLORS[num] || "#FACC15",
          isCue: false,
          isStripe: num > 8,
          potted: false,
          points: num * 25,
          number: num,
        });
      }
    }

    this.isAiming = true;
    this.cueAngle = Math.PI;
    this.power = 0;
    this.isDragging = false;
  }

  private shootCueBall(): void {
    const cueBall = this.balls.find((b) => b.isCue && !b.potted);
    if (cueBall && this.isAiming) {
      const impulse = Vector2.fromAngle(this.cueAngle).scale(Math.max(150, this.power));
      cueBall.vel = impulse;
      this.isAiming = false;
      this.isDragging = false;
      this.ctx.audio?.playRotate?.();

      globalParticles.emitBurst(cueBall.pos.x, cueBall.pos.y, 14, ["#67E8F9", "#FFFFFF"], 40, 160);
    }
  }

  public update(dt: number): void {
    if (this.isPaused) return;
    globalParticles.update(dt);
    this.animTime += dt;

    let allStationary = true;
    const friction = 0.985;

    // Power pulse if not dragging with mouse
    if (this.isAiming && !this.isDragging) {
      this.power += 750 * dt * this.powerDir;
      if (this.power >= this.maxPower) {
        this.power = this.maxPower;
        this.powerDir = -1;
      } else if (this.power <= 100) {
        this.power = 100;
        this.powerDir = 1;
      }
    }

    for (const ball of this.balls) {
      if (ball.potted) continue;

      if (ball.vel.sqrMagnitude() > 3) {
        allStationary = false;
        ball.pos.x += ball.vel.x * dt;
        ball.pos.y += ball.vel.y * dt;
        ball.vel = ball.vel.scale(friction);

        // Cushion Bounce Physics
        const minX = this.tableX + ball.radius + 6;
        const maxX = this.tableX + this.tableW - ball.radius - 6;
        const minY = this.tableY + ball.radius + 6;
        const maxY = this.tableY + this.tableH - ball.radius - 6;

        if (ball.pos.x <= minX) {
          ball.pos.x = minX;
          ball.vel.x = Math.abs(ball.vel.x) * 0.95;
          this.ctx.audio?.playHit?.();
        } else if (ball.pos.x >= maxX) {
          ball.pos.x = maxX;
          ball.vel.x = -Math.abs(ball.vel.x) * 0.95;
          this.ctx.audio?.playHit?.();
        }

        if (ball.pos.y <= minY) {
          ball.pos.y = minY;
          ball.vel.y = Math.abs(ball.vel.y) * 0.95;
          this.ctx.audio?.playHit?.();
        } else if (ball.pos.y >= maxY) {
          ball.pos.y = maxY;
          ball.vel.y = -Math.abs(ball.vel.y) * 0.95;
          this.ctx.audio?.playHit?.();
        }

        // Pocket Catching
        for (const p of this.pockets) {
          if (ball.pos.distance(p.pos) < p.radius + 4) {
            ball.potted = true;
            ball.vel = Vector2.zero();

            if (ball.isCue) {
              this.score = Math.max(0, this.score - 100);
              this.ctx.audio?.playExplosion?.();
              globalParticles.emitBurst(p.pos.x, p.pos.y, 20, ["#FFFFFF", "#EF4444"], 60, 200);
              globalParticles.emitText("SCRATCH FOUL!", p.pos.x, p.pos.y - 20, "#EF4444", 16);

              setTimeout(() => {
                ball.potted = false;
                ball.pos.set(this.tableX + this.tableW * 0.28, this.tableY + this.tableH / 2);
                ball.vel = Vector2.zero();
              }, 500);
            } else {
              this.score += ball.points * this.level;
              this.ctx.audio?.playCoin?.();
              globalParticles.emitBurst(p.pos.x, p.pos.y, 22, [ball.color, "#FFFFFF", "#FBBF24"], 60, 220);
              globalParticles.emitText(`+${ball.points * this.level} POTTED #${ball.number}!`, p.pos.x, p.pos.y - 20, ball.color, 15);
            }
          }
        }
      } else {
        ball.vel = Vector2.zero();
      }
    }

    // Ball-to-Ball Elastic Collision Physics
    for (let i = 0; i < this.balls.length; i++) {
      for (let j = i + 1; j < this.balls.length; j++) {
        const b1 = this.balls[i];
        const b2 = this.balls[j];
        if (b1.potted || b2.potted) continue;

        const delta = b2.pos.sub(b1.pos);
        const dist = delta.magnitude();
        const minDist = b1.radius + b2.radius;

        if (dist < minDist && dist > 0) {
          const normal = delta.normalize();
          const overlap = minDist - dist;

          b1.pos = b1.pos.sub(normal.scale(overlap / 2));
          b2.pos = b2.pos.add(normal.scale(overlap / 2));

          const relVel = b1.vel.sub(b2.vel);
          const sepVel = relVel.dot(normal);

          if (sepVel > 0) {
            const impulse = normal.scale(sepVel * 0.985);
            b1.vel = b1.vel.sub(impulse);
            b2.vel = b2.vel.add(impulse);

            if (sepVel > 60) {
              this.ctx.audio?.playHit?.();
              globalParticles.emitBurst((b1.pos.x + b2.pos.x) / 2, (b1.pos.y + b2.pos.y) / 2, 4, ["#FFFFFF"], 20, 80);
            }
          }
        }
      }
    }

    // Turn Reset When Balls Settle
    if (allStationary && !this.isAiming) {
      this.isAiming = true;
      this.power = 200;
      this.powerDir = 1;

      const remainingBalls = this.balls.filter((b) => !b.isCue && !b.potted).length;
      if (remainingBalls === 0) {
        this.score += 5000 * this.level;
        this.level++;
        this.ctx.audio?.playVictory?.();
        globalParticles.emitBurst(300, 350, 60, ["#FBBF24", "#34D399", "#38BDF8", "#FFFFFF"], 100, 320);
        globalParticles.emitText("TABLE CLEARED! LEVEL UP!", 300, 160, "#FBBF24", 24);
        this.initTable();
      }
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (action === "MOVE_LEFT") {
      this.cueAngle -= 0.06;
    } else if (action === "MOVE_RIGHT") {
      this.cueAngle += 0.06;
    } else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      this.shootCueBall();
    } else if (action === "RESTART") {
      this.reset();
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

    // 1. Dark Lounge Floor Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#080C14");
      bgGrad.addColorStop(0.5, "#0F172A");
      bgGrad.addColorStop(1, "#05080E");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#080C14");
    }

    // 2. Top Header HUD
    pr.drawText("8-BALL POOL", 28, 38, {
      size: 26,
      color: "#38BDF8",
      font: "system-ui, -apple-system, sans-serif",
    });

    pr.drawText(`LEVEL ${this.level}`, 220, 38, { size: 14, color: "#94A3B8", font: "monospace" });
    pr.drawText(`SCORE: ${this.score}`, w - 28, 38, { size: 16, color: "#FBBF24", align: "right", font: "monospace" });

    // 3. Luxurious Polished Cherry Wood Outer Table Rails
    if (ctx2d) {
      ctx2d.save();
      // Outer drop shadow on floor
      ctx2d.shadowColor = "rgba(0, 0, 0, 0.75)";
      ctx2d.shadowBlur = 28;
      ctx2d.shadowOffsetY = 12;

      // Cherry wood gradient
      const woodGrad = ctx2d.createLinearGradient(
        this.tableOuterX,
        this.tableOuterY,
        this.tableOuterX + this.tableOuterW,
        this.tableOuterY + this.tableOuterH
      );
      woodGrad.addColorStop(0, "#451A03");
      woodGrad.addColorStop(0.3, "#78350F");
      woodGrad.addColorStop(0.7, "#92400E");
      woodGrad.addColorStop(1, "#451A03");
      ctx2d.fillStyle = woodGrad;

      ctx2d.beginPath();
      ctx2d.roundRect(this.tableOuterX, this.tableOuterY, this.tableOuterW, this.tableOuterH, 20);
      ctx2d.fill();

      // Polished Gold Corner Casting Caps
      const corners = [
        { x: this.tableOuterX, y: this.tableOuterY },
        { x: this.tableOuterX + this.tableOuterW - 36, y: this.tableOuterY },
        { x: this.tableOuterX, y: this.tableOuterY + this.tableOuterH - 36 },
        { x: this.tableOuterX + this.tableOuterW - 36, y: this.tableOuterY + this.tableOuterH - 36 },
      ];
      ctx2d.fillStyle = "#D97706";
      for (const c of corners) {
        ctx2d.beginPath();
        ctx2d.roundRect(c.x, c.y, 36, 36, 12);
        ctx2d.fill();
      }

      // Mother-of-Pearl Diamond Sight Inlays along Rails
      ctx2d.fillStyle = "#F8FAFC";
      for (let i = 1; i <= 3; i++) {
        // Top & Bottom Rail Diamonds
        const dx = this.tableX + (this.tableW / 4) * i;
        ctx2d.fillRect(dx - 3, this.tableOuterY + 10, 6, 6);
        ctx2d.fillRect(dx - 3, this.tableOuterY + this.tableOuterH - 16, 6, 6);

        // Left & Right Rail Diamonds
        const dy = this.tableY + (this.tableH / 4) * i;
        ctx2d.fillRect(this.tableOuterX + 10, dy - 3, 6, 6);
        ctx2d.fillRect(this.tableOuterX + this.tableOuterW - 16, dy - 3, 6, 6);
      }

      // Inner Rubber Cushion Rail
      ctx2d.fillStyle = "#064E3B";
      ctx2d.beginPath();
      ctx2d.roundRect(this.tableX - 8, this.tableY - 8, this.tableW + 16, this.tableH + 16, 8);
      ctx2d.fill();

      // Professional Tournament Emerald Baize Felt
      const feltGrad = ctx2d.createRadialGradient(
        this.tableX + this.tableW / 2,
        this.tableY + this.tableH / 2,
        40,
        this.tableX + this.tableW / 2,
        this.tableY + this.tableH / 2,
        280
      );
      feltGrad.addColorStop(0, "#10B981");
      feltGrad.addColorStop(0.7, "#059669");
      feltGrad.addColorStop(1, "#047857");
      ctx2d.fillStyle = feltGrad;

      ctx2d.beginPath();
      ctx2d.roundRect(this.tableX, this.tableY, this.tableW, this.tableH, 6);
      ctx2d.fill();

      // Headstring / Baize Break Line
      ctx2d.strokeStyle = "rgba(255, 255, 255, 0.25)";
      ctx2d.lineWidth = 1.5;
      ctx2d.beginPath();
      ctx2d.moveTo(this.tableX + this.tableW * 0.28, this.tableY);
      ctx2d.lineTo(this.tableX + this.tableW * 0.28, this.tableY + this.tableH);
      ctx2d.stroke();

      // "D" Semicircle Break Arc
      ctx2d.beginPath();
      ctx2d.arc(this.tableX + this.tableW * 0.28, this.tableY + this.tableH / 2, 45, Math.PI / 2, -Math.PI / 2);
      ctx2d.stroke();

      ctx2d.restore();
    }

    // 4. Drop Pockets (Deep Cast Bronze & Leather Cavities)
    for (const p of this.pockets) {
      if (ctx2d) {
        ctx2d.save();
        // Bronze pocket rim
        ctx2d.fillStyle = "#78350F";
        ctx2d.beginPath();
        ctx2d.arc(p.pos.x, p.pos.y, p.radius + 3, 0, Math.PI * 2);
        ctx2d.fill();

        // Dark leather drop hole
        const holeGrad = ctx2d.createRadialGradient(p.pos.x - 3, p.pos.y - 3, 2, p.pos.x, p.pos.y, p.radius);
        holeGrad.addColorStop(0, "#1E293B");
        holeGrad.addColorStop(1, "#020617");
        ctx2d.fillStyle = holeGrad;
        ctx2d.beginPath();
        ctx2d.arc(p.pos.x, p.pos.y, p.radius, 0, Math.PI * 2);
        ctx2d.fill();
        ctx2d.restore();
      }
    }

    // 5. Multi-Bounce Laser Trajectory Aiming Line & Cue Stick
    const cueBall = this.balls.find((b) => b.isCue && !b.potted);
    if (this.isAiming && cueBall && ctx2d) {
      const aimDir = Vector2.fromAngle(this.cueAngle);

      // Multi-Ray Laser Target Projection
      ctx2d.save();
      ctx2d.setLineDash([4, 6]);
      ctx2d.strokeStyle = "#38BDF8";
      ctx2d.lineWidth = 2;
      ctx2d.shadowColor = "#38BDF8";
      ctx2d.shadowBlur = 10;

      ctx2d.beginPath();
      ctx2d.moveTo(cueBall.pos.x, cueBall.pos.y);
      const laserEnd = cueBall.pos.add(aimDir.scale(320));
      ctx2d.lineTo(laserEnd.x, laserEnd.y);
      ctx2d.stroke();
      ctx2d.restore();

      // High-Detail Tapered Ash Wood Cue Stick
      const stickPullback = 28 + (this.power / this.maxPower) * 70;
      const stickTip = cueBall.pos.sub(aimDir.scale(stickPullback));
      const stickButt = cueBall.pos.sub(aimDir.scale(stickPullback + 220));

      ctx2d.save();
      // Cue stick drop shadow
      ctx2d.shadowColor = "rgba(0, 0, 0, 0.4)";
      ctx2d.shadowBlur = 8;
      ctx2d.shadowOffsetY = 6;

      // Maple cue shaft
      ctx2d.strokeStyle = "#FDE68A";
      ctx2d.lineWidth = 5;
      ctx2d.lineCap = "round";
      ctx2d.beginPath();
      ctx2d.moveTo(stickTip.x, stickTip.y);
      ctx2d.lineTo(stickButt.x, stickButt.y);
      ctx2d.stroke();

      // Irish linen grip wrap on butt
      const gripStart = stickTip.add(stickButt.sub(stickTip).scale(0.55));
      ctx2d.strokeStyle = "#1E293B";
      ctx2d.lineWidth = 7;
      ctx2d.beginPath();
      ctx2d.moveTo(gripStart.x, gripStart.y);
      ctx2d.lineTo(stickButt.x, stickButt.y);
      ctx2d.stroke();

      // Blue chalk cue tip
      ctx2d.strokeStyle = "#0284C7";
      ctx2d.lineWidth = 4;
      ctx2d.beginPath();
      ctx2d.moveTo(stickTip.x, stickTip.y);
      const tipFront = stickTip.add(aimDir.scale(6));
      ctx2d.lineTo(tipFront.x, tipFront.y);
      ctx2d.stroke();

      ctx2d.restore();
    }

    // 6. Render Spherical 3D Phenolic Resin Pool Balls
    for (const ball of this.balls) {
      if (ball.potted) continue;

      if (ctx2d) {
        ctx2d.save();

        // Felt Drop Shadow
        ctx2d.fillStyle = "rgba(0, 0, 0, 0.45)";
        ctx2d.beginPath();
        ctx2d.ellipse(ball.pos.x + 3, ball.pos.y + 4, ball.radius, ball.radius * 0.75, 0, 0, Math.PI * 2);
        ctx2d.fill();

        // 3D Spherical Radial Color Base
        const ballGrad = ctx2d.createRadialGradient(
          ball.pos.x - 4,
          ball.pos.y - 4,
          2,
          ball.pos.x,
          ball.pos.y,
          ball.radius
        );

        if (ball.isCue) {
          ballGrad.addColorStop(0, "#FFFFFF");
          ballGrad.addColorStop(0.7, "#F1F5F9");
          ballGrad.addColorStop(1, "#94A3B8");
          ctx2d.fillStyle = ballGrad;
          ctx2d.beginPath();
          ctx2d.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
          ctx2d.fill();

          // Red Sighting Dot on Cue Ball
          ctx2d.fillStyle = "#EF4444";
          ctx2d.beginPath();
          ctx2d.arc(ball.pos.x, ball.pos.y, 2, 0, Math.PI * 2);
          ctx2d.fill();
        } else {
          // Colored Body (Solid / Stripe)
          ballGrad.addColorStop(0, "#FFFFFF");
          ballGrad.addColorStop(0.2, ball.color);
          ballGrad.addColorStop(1, "#090D16");
          ctx2d.fillStyle = ballGrad;

          ctx2d.beginPath();
          ctx2d.arc(ball.pos.x, ball.pos.y, ball.radius, 0, Math.PI * 2);
          ctx2d.fill();

          if (ball.isStripe) {
            // White Striped Caps
            ctx2d.fillStyle = "#FFFFFF";
            ctx2d.beginPath();
            ctx2d.arc(ball.pos.x, ball.pos.y, ball.radius * 0.75, 0, Math.PI * 2);
            ctx2d.fill();
          }

          // Center White Target Number Disc
          ctx2d.fillStyle = "#FFFFFF";
          ctx2d.beginPath();
          ctx2d.arc(ball.pos.x, ball.pos.y, ball.radius * 0.52, 0, Math.PI * 2);
          ctx2d.fill();

          // Ball Number Digit
          ctx2d.fillStyle = "#0F172A";
          ctx2d.font = "bold 9px system-ui, sans-serif";
          ctx2d.textAlign = "center";
          ctx2d.textBaseline = "middle";
          ctx2d.fillText(ball.number.toString(), ball.pos.x, ball.pos.y);
        }

        // Curved Top Specular Light Glint
        const glintGrad = ctx2d.createRadialGradient(
          ball.pos.x - 4,
          ball.pos.y - 4,
          1,
          ball.pos.x - 4,
          ball.pos.y - 4,
          ball.radius * 0.5
        );
        glintGrad.addColorStop(0, "rgba(255, 255, 255, 0.85)");
        glintGrad.addColorStop(1, "rgba(255, 255, 255, 0)");
        ctx2d.fillStyle = glintGrad;
        ctx2d.beginPath();
        ctx2d.arc(ball.pos.x - 3, ball.pos.y - 3, ball.radius * 0.4, 0, Math.PI * 2);
        ctx2d.fill();

        ctx2d.restore();
      }
    }

    // 7. Particle Bursts
    globalParticles.render(pr);

    // 8. Power Meter HUD (Right Rail)
    const meterX = w - 24;
    const meterY = this.tableOuterY + 40;
    const meterH = this.tableOuterH - 80;

    pr.drawRect(meterX - 6, meterY, 14, meterH, "#0F172A", true);
    pr.drawRect(meterX - 6, meterY, 14, meterH, "#38BDF8", false);

    const fillH = meterH * (this.power / this.maxPower);
    if (ctx2d) {
      ctx2d.save();
      const pGrad = ctx2d.createLinearGradient(0, meterY + meterH, 0, meterY);
      pGrad.addColorStop(0, "#34D399");
      pGrad.addColorStop(0.6, "#FBBF24");
      pGrad.addColorStop(1, "#EF4444");
      ctx2d.fillStyle = pGrad;
      ctx2d.fillRect(meterX - 4, meterY + meterH - fillH, 10, fillH);
      ctx2d.restore();
    }

    // 9. Bottom Tactical Help & Controls Bar
    pr.drawRect(16, h - 56, w - 32, 44, "rgba(15, 23, 42, 0.94)", true);
    pr.drawRect(16, h - 56, w - 32, 44, "#38BDF8", false);

    pr.drawText("[MOUSE / TOUCH: DRAG TO AIM & PULL TO STRIKE]", 32, h - 30, {
      size: 12,
      color: "#FBBF24",
      font: "bold system-ui, sans-serif",
    });

    pr.drawText("[ARROWS: FINE TUNE AIM  •  SPACE: SHOOT  •  R: RACK]", w - 32, h - 30, {
      size: 11,
      color: "#94A3B8",
      align: "right",
      font: "monospace",
    });
  }
}
