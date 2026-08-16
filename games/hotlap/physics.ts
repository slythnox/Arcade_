/** ARCADE_ v1.2.2 */
import { Vector2 } from "../../core/math/vector";
import { clamp } from "../../core/utils";
import type { CarPhysicsState, SkidMark, SmokeParticle } from "./types";

export interface PhysicsParams {
  mass: number;           // e.g. 750 kg
  enginePower: number;    // Drive force multiplier
  brakePower: number;     // Braking force multiplier
  reversePower: number;
  maxSpeed: number;       // Top velocity in px/s (~700 px/s)
  steerSpeed: number;     // Angular steering responsiveness
  tireGripAsphalt: number;// Lateral friction coeff (~0.92)
  tireGripKerb: number;   // Kerb grip (~0.72)
  tireGripGrass: number;  // Off-track grass/sand grip (~0.35)
  dragCoeff: number;      // Aerodynamic drag constant (0.0012)
  rollingResistance: number;
  gravityFactor: number;
}

export const DEFAULT_PHYSICS_PARAMS: PhysicsParams = {
  mass: 750,
  enginePower: 1400,
  brakePower: 2200,
  reversePower: 500,
  maxSpeed: 680,
  steerSpeed: 3.4,
  tireGripAsphalt: 0.94,
  tireGripKerb: 0.72,
  tireGripGrass: 0.35,
  dragCoeff: 0.0014,
  rollingResistance: 12.0,
  gravityFactor: 1.0,
};

export class HotlapPhysics {
  public static updateCar(
    car: CarPhysicsState,
    params: PhysicsParams,
    dt: number,
    skidBuffer: SkidMark[],
    smokeBuffer: SmokeParticle[]
  ): void {
    // 1. Heading & Lateral Unit Vectors
    const forward = new Vector2(Math.cos(car.angle), Math.sin(car.angle));
    const right = new Vector2(-Math.sin(car.angle), Math.cos(car.angle)); // Perpendicular normal

    // 2. Velocity Decomposition into Local Space
    let vLong = car.vel.dot(forward);
    let vLat = car.vel.dot(right);
    const totalSpeed = car.vel.magnitude();

    // 3. Dynamic Steering with Speed Damping (High-speed stability)
    const speedRatio = clamp(totalSpeed / params.maxSpeed, 0, 1);
    // Steering is sharp at medium speeds, progressively stabilized at extreme speeds
    const steerFactor = (1.0 - speedRatio * 0.45) * params.steerSpeed;
    const effectiveSteer = car.steerAngle * steerFactor * (vLong >= 0 ? 1 : -1);

    // Angular velocity update with damping
    car.angularVel = effectiveSteer;
    car.angle += car.angularVel * dt * (totalSpeed > 5 ? 1 : 0);

    // 4. Longitudinal Forces (Drive Throttle vs Brake vs Rolling Drag)
    let fDrive = 0;
    if (car.throttle > 0) {
      // Power drops off near top speed
      const powerRamp = Math.max(0, 1 - Math.pow(Math.max(0, vLong) / params.maxSpeed, 2));
      fDrive = car.throttle * params.enginePower * powerRamp;
      car.exhaustFlame = Math.min(1.0, car.exhaustFlame + dt * 6);
    } else {
      car.exhaustFlame = Math.max(0, car.exhaustFlame - dt * 4);
    }

    let fBrake = 0;
    if (car.brake > 0) {
      if (vLong > 10) {
        fBrake = -car.brake * params.brakePower;
      } else {
        // Reverse gear
        fDrive = -car.brake * params.reversePower;
      }
    }

    // Aerodynamic Drag: F_drag = -c * v * |v|
    const fDrag = -params.dragCoeff * vLong * Math.abs(vLong);
    const fRolling = -Math.sign(vLong) * params.rollingResistance;

    const netLongAcc = (fDrive + fBrake + fDrag + fRolling) * (1 / (params.mass / 1000));
    vLong += netLongAcc * dt;

    // 5. Surface Grip & Lateral Traction Physics
    let surfaceGrip = params.tireGripAsphalt;
    if (car.isOnGrass) {
      surfaceGrip = params.tireGripGrass;
      // Grass speed limit penalty
      vLong *= (1 - 0.5 * dt);
    } else if (car.isOnKerb) {
      surfaceGrip = params.tireGripKerb;
    }

    // Handbrake drops lateral grip to induce drift
    if (car.handbrake) {
      surfaceGrip *= 0.35;
      vLong *= (1 - 0.25 * dt);
    }

    // Apply lateral grip: v_lat' = v_lat * (1 - mu * dt * rate)
    const gripRate = 18.0 * params.gravityFactor;
    const lateralDamping = Math.max(0, 1.0 - surfaceGrip * gripRate * dt);
    vLat *= lateralDamping;

    // 6. Drift Slip & Tire Smoke / Skid Particles
    car.driftSlip = Math.abs(vLat);
    const isDrifting = (car.driftSlip > 45 && totalSpeed > 80) || (car.handbrake && totalSpeed > 50);

    if (isDrifting) {
      // Rear tire positions
      const rearOffset = 14;
      const trackWidth = 8;
      const rearLeft = car.pos.sub(forward.scale(rearOffset)).add(right.scale(trackWidth));
      const rearRight = car.pos.sub(forward.scale(rearOffset)).sub(right.scale(trackWidth));

      // Emit skid marks
      if (skidBuffer.length < 300) {
        skidBuffer.push({
          x1: rearLeft.x,
          y1: rearLeft.y,
          x2: rearLeft.x - forward.x * 4,
          y2: rearLeft.y - forward.y * 4,
          alpha: Math.min(0.6, car.driftSlip / 120),
        });
      }

      // Emit tire smoke particles
      if (smokeBuffer.length < 120 && Math.random() < 0.45) {
        const emitPos = Math.random() < 0.5 ? rearLeft : rearRight;
        smokeBuffer.push({
          x: emitPos.x + (Math.random() - 0.5) * 4,
          y: emitPos.y + (Math.random() - 0.5) * 4,
          vx: -forward.x * 20 + (Math.random() - 0.5) * 15,
          vy: -forward.y * 20 + (Math.random() - 0.5) * 15,
          size: 2 + Math.random() * 4,
          alpha: 0.65,
          color: car.isOnGrass ? "#8da84a" : "#d0d4dc",
        });
      }
    }

    // 7. Reconstruct World Velocity Vector
    car.vel = forward.scale(vLong).add(right.scale(vLat));
    car.speed = car.vel.magnitude();

    // 8. Integrate Position
    car.pos = car.pos.add(car.vel.scale(dt));
  }
}
