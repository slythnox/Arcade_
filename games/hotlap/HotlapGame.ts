/** ARCADE_ v1.2.2 */
import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { GameAction } from "../../core/types/game";
import { Vector2 } from "../../core/math/vector";
import type { CarPhysicsState, CircuitDefinition, SkidMark, SmokeParticle, CrashDebrisParticle, SectorSplit } from "./types";
import { HOTLAP_CIRCUITS } from "./tracks";
import { TrackSpline } from "./spline";
import { HotlapPhysics, DEFAULT_PHYSICS_PARAMS } from "./physics";
import { GhostManager } from "./ghost";
import { HotlapRenderer } from "./renderer";

export class HotlapGame implements GameInstance {
  private ctx!: GameContext;
  private circuitIdx: number = 0;
  private circuit!: CircuitDefinition;
  private spline!: TrackSpline;
  private ghostManager!: GhostManager;

  // Car Physics State
  private car!: CarPhysicsState;
  private skidBuffer: SkidMark[] = [];
  private smokeBuffer: SmokeParticle[] = [];
  private debrisBuffer: CrashDebrisParticle[] = [];

  // Input State
  private leftPressed: boolean = false;
  private rightPressed: boolean = false;
  private upPressed: boolean = false;
  private downPressed: boolean = false;
  private handbrakePressed: boolean = false;
  private cleanupCanvasListeners: (() => void) | null = null;

  // Timing & Lap State
  private lapTime: number = 0;
  private currentLap: number = 1;
  private isLapValid: boolean = true;
  private sectors: SectorSplit = { s1Time: null, s2Time: null, s3Time: null, lapTime: null };
  private passedS1: boolean = false;
  private passedS2: boolean = false;
  private prevProgress: number = 0;
  private score: number = 0;
  private isPaused: boolean = false;

  // Camera & Audio
  private cameraPos: Vector2 = new Vector2(0, 0);
  private cameraZoom: number = 0.85;
  private audioTimer: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.loadCircuit(0);
    this.setupDirectTouchListeners();
  }

  private setupDirectTouchListeners(): void {
    try {
      const canvas = (this.ctx.renderer as unknown as { getContext?: () => { canvas?: HTMLCanvasElement } }).getContext?.()?.canvas;
      if (canvas && typeof canvas.addEventListener === "function") {
        const activePointers = new Map<number, { x: number; y: number }>();

        const evaluatePointers = () => {
          let left = false;
          let right = false;
          let up = false;
          let down = false;

          for (const pt of activePointers.values()) {
            if (pt.x < 0.5) {
              // Left half of screen is steering
              if (pt.x < 0.25) {
                left = true;
              } else {
                right = true;
              }
            } else {
              // Right half of screen is throttle / brake
              if (pt.y < 0.55) {
                up = true;
              } else {
                down = true;
              }
            }
          }

          this.leftPressed = left;
          this.rightPressed = right;
          this.upPressed = up;
          this.downPressed = down;
        };

        const onDown = (e: PointerEvent) => {
          const rect = canvas.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            activePointers.set(e.pointerId, {
              x: (e.clientX - rect.left) / rect.width,
              y: (e.clientY - rect.top) / rect.height,
            });
            evaluatePointers();
          }
        };

        const onMove = (e: PointerEvent) => {
          if (activePointers.has(e.pointerId)) {
            const rect = canvas.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              activePointers.set(e.pointerId, {
                x: (e.clientX - rect.left) / rect.width,
                y: (e.clientY - rect.top) / rect.height,
              });
              evaluatePointers();
            }
          }
        };

        const onUp = (e: PointerEvent) => {
          activePointers.delete(e.pointerId);
          evaluatePointers();
        };

        canvas.addEventListener("pointerdown", onDown);
        canvas.addEventListener("pointermove", onMove);
        canvas.addEventListener("pointerup", onUp);
        canvas.addEventListener("pointercancel", onUp);

        this.cleanupCanvasListeners = () => {
          canvas.removeEventListener("pointerdown", onDown);
          canvas.removeEventListener("pointermove", onMove);
          canvas.removeEventListener("pointerup", onUp);
          canvas.removeEventListener("pointercancel", onUp);
        };
      }
    } catch {}
  }

  public loadCircuit(idx: number): void {
    this.circuitIdx = Math.max(0, Math.min(HOTLAP_CIRCUITS.length - 1, idx));
    this.circuit = HOTLAP_CIRCUITS[this.circuitIdx];
    this.spline = new TrackSpline(this.circuit.points, this.circuit.width);
    this.ghostManager = new GhostManager(this.circuit.id);

    this.resetCar();
    this.skidBuffer = [];
    this.smokeBuffer = [];
    this.debrisBuffer = [];
    this.lapTime = 0;
    this.currentLap = 1;
    this.isLapValid = true;
    this.sectors = { s1Time: null, s2Time: null, s3Time: null, lapTime: null };
    this.passedS1 = false;
    this.passedS2 = false;
    this.prevProgress = 0;
    this.ghostManager.startNewLap();
  }

  private resetCar(): void {
    const start = this.circuit.startPos;
    this.car = {
      pos: new Vector2(start.x, start.y),
      vel: Vector2.zero(),
      angle: start.angle,
      angularVel: 0,
      speed: 0,
      steerAngle: 0,
      throttle: 0,
      brake: 0,
      handbrake: false,
      driftSlip: 0,
      isOnGrass: false,
      isOnKerb: false,
      exhaustFlame: 0,
      isCrashed: false,
      crashTimer: 0,
    };
    this.leftPressed = false;
    this.rightPressed = false;
    this.upPressed = false;
    this.downPressed = false;
    this.handbrakePressed = false;
    this.cameraPos = new Vector2(start.x, start.y);
  }

  public update(dt: number): void {
    if (this.isPaused) return;

    // 1. Process Steering & Pedal Inputs with Progressive Damping
    if (!this.car.isCrashed) {
      let targetSteer = 0;
      if (this.leftPressed && !this.rightPressed) targetSteer = -1;
      else if (this.rightPressed && !this.leftPressed) targetSteer = 1;

      // Progressive steering ramp for smooth touch/gamepad steering
      const steerRampRate = targetSteer !== 0 ? 14.0 : 18.0;
      this.car.steerAngle += (targetSteer - this.car.steerAngle) * Math.min(1.0, dt * steerRampRate);
      if (Math.abs(this.car.steerAngle) < 0.01 && targetSteer === 0) {
        this.car.steerAngle = 0;
      }

      this.car.throttle = this.upPressed ? 1 : 0;
      this.car.brake = this.downPressed ? 1 : 0;
      this.car.handbrake = this.handbrakePressed;
    }

    // 2. Surface Query via Spline Centerline Projection
    const proj = this.spline.project(this.car.pos.x, this.car.pos.y);
    this.car.isOnGrass = !proj.isOnTrack && !proj.isOnKerb;
    this.car.isOnKerb = proj.isOnKerb;

    // 3. Boundary Collision Detection -> CRASH
    const barrierLimit = (this.circuit.width / 2) + 20;
    if (Math.abs(proj.lateralOffset) > barrierLimit && !this.car.isCrashed) {
      this.triggerCrash(proj.nearestSample);
    }

    // 4. Crash State Update
    if (this.car.isCrashed) {
      this.car.crashTimer -= dt;
      this.car.angle += dt * 5;
      this.car.vel = this.car.vel.scale(0.85);
      this.car.speed = this.car.vel.magnitude();
      this.car.pos = this.car.pos.add(this.car.vel.scale(dt));

      if (Math.random() < 0.5) {
        this.smokeBuffer.push({
          x: this.car.pos.x + (Math.random() - 0.5) * 12,
          y: this.car.pos.y + (Math.random() - 0.5) * 12,
          vx: (Math.random() - 0.5) * 40,
          vy: (Math.random() - 0.5) * 40 - 20,
          size: 4 + Math.random() * 8,
          alpha: 0.8,
          color: "#ff3d5a",
        });
      }

      if (this.car.crashTimer <= 0) {
        this.repositionToTrack(proj.nearestSample);
      }
    } else {
      // 5. Normal Physics Simulation
      const physicsParams = {
        ...DEFAULT_PHYSICS_PARAMS,
        gravityFactor: this.circuit.gravityFactor,
        tireGripAsphalt: this.circuit.baseGrip,
      };
      HotlapPhysics.updateCar(this.car, physicsParams, dt, this.skidBuffer, this.smokeBuffer);
    }

    // 6. Smooth Camera Follow
    const targetCamX = this.car.pos.x + Math.cos(this.car.angle) * (this.car.speed * 0.25);
    const targetCamY = this.car.pos.y + Math.sin(this.car.angle) * (this.car.speed * 0.25);
    this.cameraPos.x += (targetCamX - this.cameraPos.x) * 0.12;
    this.cameraPos.y += (targetCamY - this.cameraPos.y) * 0.12;

    const targetZoom = 0.90 - Math.min(0.20, (this.car.speed / 680) * 0.20);
    this.cameraZoom += (targetZoom - this.cameraZoom) * 0.05;

    // 7. Update Smoke & Debris Particles
    for (let i = this.smokeBuffer.length - 1; i >= 0; i--) {
      const p = this.smokeBuffer[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.alpha -= dt * 1.2;
      p.size += dt * 3;
      if (p.alpha <= 0) {
        this.smokeBuffer.splice(i, 1);
      }
    }

    for (let i = this.debrisBuffer.length - 1; i >= 0; i--) {
      const d = this.debrisBuffer[i];
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.rotation += d.rotSpeed * dt;
      d.vx *= 0.95;
      d.vy *= 0.95;
      d.alpha -= dt * 0.8;
      if (d.alpha <= 0) {
        this.debrisBuffer.splice(i, 1);
      }
    }

    // 8. Lap & Sector Tracking
    if (!this.car.isCrashed) {
      this.lapTime += dt;
      const currProgress = proj.progress;

      // Sector 1 Split (33% progress)
      if (!this.passedS1 && this.prevProgress < 0.33 && currProgress >= 0.33) {
        this.passedS1 = true;
        this.sectors.s1Time = this.lapTime;
        this.ctx.audio?.playCoin();
      }

      // Sector 2 Split (66% progress)
      if (!this.passedS2 && this.prevProgress < 0.66 && currProgress >= 0.66) {
        this.passedS2 = true;
        this.sectors.s2Time = this.lapTime;
        this.ctx.audio?.playCoin();
      }

      // Lap Completion Trigger (crossing finish line 0.85 -> 0.15)
      if (this.prevProgress > 0.85 && currProgress < 0.15) {
        this.completeLap();
      }
      this.prevProgress = currProgress;

      // 9. Record Ghost Sample
      if (this.isLapValid) {
        this.ghostManager.recordTick(
          dt,
          currProgress,
          this.lapTime,
          this.car.pos.x,
          this.car.pos.y,
          this.car.angle,
          this.car.speed
        );
      }
    }

    // 10. Engine Sound Synthesis
    this.audioTimer += dt;
    if (this.audioTimer > 0.08 && this.car.speed > 5 && !this.car.isCrashed) {
      this.audioTimer = 0;
      const rpmFreq = 80 + (this.car.speed / 680) * 340;
      if (this.car.driftSlip > 50) {
        this.ctx.audio?.playTone(600 + Math.random() * 300, "sawtooth", 50, 0.08);
      } else {
        this.ctx.audio?.playTone(rpmFreq, "square", 60, 0.06);
      }
    }
  }

  private triggerCrash(_nearestSample: { pos: { x: number; y: number } }): void {
    this.car.isCrashed = true;
    this.car.crashTimer = 1.2;
    this.isLapValid = false;
    this.ctx.audio?.playExplosion();

    const colors = ["#ff3d5a", "#ffd84d", "#ffffff", "#1a2233", "#4de8e8"];
    for (let i = 0; i < 25; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 220;
      this.debrisBuffer.push({
        x: this.car.pos.x,
        y: this.car.pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 5,
        rotation: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 15,
        alpha: 1.0,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private repositionToTrack(nearestSample: { pos: Vector2; tangent: Vector2 }): void {
    this.car.isCrashed = false;
    this.car.crashTimer = 0;
    this.car.pos = new Vector2(nearestSample.pos.x, nearestSample.pos.y);
    this.car.angle = Math.atan2(nearestSample.tangent.y, nearestSample.tangent.x);
    this.car.vel = Vector2.zero();
    this.car.speed = 0;
    this.car.throttle = 0;
    this.car.brake = 0;
    this.car.steerAngle = 0;
    this.leftPressed = false;
    this.rightPressed = false;
    this.upPressed = false;
    this.downPressed = false;
    this.handbrakePressed = false;
  }

  private completeLap(): void {
    if (!this.isLapValid) {
      this.isLapValid = true;
      this.currentLap++;
      this.lapTime = 0;
      this.passedS1 = false;
      this.passedS2 = false;
      this.ghostManager.startNewLap();
      return;
    }

    const finalLapTime = this.lapTime;
    this.sectors.s3Time = finalLapTime;
    this.sectors.lapTime = finalLapTime;

    const isNewBest = this.ghostManager.saveCompletedLapIfBest(this.circuit.id, finalLapTime, this.sectors);
    if (isNewBest) {
      this.ctx.audio?.playVictory();
      this.score += 5000;
    } else {
      this.ctx.audio?.playLineClear();
      this.score += 1000;
    }

    this.currentLap++;
    this.lapTime = 0;
    this.passedS1 = false;
    this.passedS2 = false;
    this.ghostManager.startNewLap();
  }

  public render(renderer: Renderer): void {
    // 1. Render Track & Kerbs
    HotlapRenderer.renderTrack(
      renderer,
      this.spline,
      this.circuit,
      this.cameraPos.x,
      this.cameraPos.y,
      this.cameraZoom
    );

    // 2. Render Skids, Smoke & Crash Debris
    HotlapRenderer.renderSkidsAndSmoke(
      renderer,
      this.skidBuffer,
      this.smokeBuffer,
      this.debrisBuffer,
      this.cameraPos.x,
      this.cameraPos.y,
      this.cameraZoom
    );

    // 3. Render Ghost Car (if personal best exists)
    if (!this.car.isCrashed) {
      const ghost = this.ghostManager.getGhostAtTime(this.lapTime);
      if (ghost) {
        HotlapRenderer.renderCar(
          renderer,
          {
            pos: new Vector2(ghost.x, ghost.y),
            vel: Vector2.zero(),
            angle: ghost.angle,
            angularVel: 0,
            speed: ghost.speed,
            steerAngle: 0,
            throttle: 0,
            brake: 0,
            handbrake: false,
            driftSlip: 0,
            isOnGrass: false,
            isOnKerb: false,
            exhaustFlame: 0,
            isCrashed: false,
            crashTimer: 0,
          },
          true,
          this.cameraPos.x,
          this.cameraPos.y,
          this.cameraZoom
        );
      }
    }

    // 4. Render Player Car
    HotlapRenderer.renderCar(
      renderer,
      this.car,
      false,
      this.cameraPos.x,
      this.cameraPos.y,
      this.cameraZoom
    );

    // 5. Render F1 Telemetry HUD
    const proj = this.spline.project(this.car.pos.x, this.car.pos.y);
    const liveDelta = this.ghostManager.getLiveDelta(proj.progress, this.lapTime);

    HotlapRenderer.renderHUD(
      renderer,
      this.currentLap,
      this.lapTime,
      this.ghostManager.bestLapTime,
      liveDelta,
      this.sectors,
      this.car.speed,
      this.circuit,
      this.spline,
      proj.progress,
      this.car.isCrashed
    );
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (this.car.isCrashed) {
      if (action === "RESTART" && isPressed) {
        this.reset(1337);
      }
      return;
    }

    switch (action) {
      case "MOVE_LEFT":
        this.leftPressed = isPressed;
        break;
      case "MOVE_RIGHT":
        this.rightPressed = isPressed;
        break;
      case "MOVE_UP":
      case "ACTION_PRIMARY":
        this.upPressed = isPressed;
        break;
      case "MOVE_DOWN":
      case "BACK":
        this.downPressed = isPressed;
        break;
      case "ROTATE":
      case "ACTION_SECONDARY":
        this.handbrakePressed = isPressed;
        break;
      case "CONFIRM":
        if (isPressed) {
          this.loadCircuit((this.circuitIdx + 1) % HOTLAP_CIRCUITS.length);
        }
        break;
      case "RESTART":
        if (isPressed) {
          this.reset(1337);
        }
        break;
      case "PAUSE":
        if (isPressed) {
          this.isPaused = !this.isPaused;
        }
        break;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public reset(_seed?: number): void {
    this.loadCircuit(this.circuitIdx);
  }

  public destroy(): void {
    if (this.cleanupCanvasListeners) {
      this.cleanupCanvasListeners();
      this.cleanupCanvasListeners = null;
    }
    this.skidBuffer = [];
    this.smokeBuffer = [];
    this.debrisBuffer = [];
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.circuitIdx + 1;
  }
}
