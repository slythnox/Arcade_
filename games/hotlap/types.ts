/** ARCADE_ v1.2.2 */
import type { Vector2 } from "../../core/math/vector";

export interface CarPhysicsState {
  pos: Vector2;
  vel: Vector2;
  angle: number; // In radians (0 = facing right)
  angularVel: number;
  speed: number;
  steerAngle: number;
  throttle: number; // 0 to 1
  brake: number; // 0 to 1
  handbrake: boolean;
  driftSlip: number; // Magnitude of lateral drift velocity
  isOnGrass: boolean;
  isOnKerb: boolean;
  exhaustFlame: number; // 0 to 1
  isCrashed: boolean;
  crashTimer: number;
}

export interface TrackPoint {
  x: number;
  y: number;
  width?: number; // Custom track width at this apex (default ~120px)
}

export interface SectorSplit {
  s1Time: number | null;
  s2Time: number | null;
  s3Time: number | null;
  lapTime: number | null;
}

export interface CircuitDefinition {
  id: string;
  name: string;
  subtitle: string;
  lengthMeters: number;
  points: TrackPoint[];
  width: number;
  gravityFactor: number; // e.g. 1.0 standard, 0.4 for moonbase
  baseGrip: number; // e.g. 0.88 asphalt
  theme: "emerald" | "neon" | "desert" | "alpine" | "night" | "jungle" | "industrial" | "monza" | "moonbase" | "gp";
  colors: {
    asphalt: string;
    asphaltDark: string;
    grass: string;
    grassDark: string;
    kerbRed: string;
    kerbWhite: string;
    barrier: string;
    line: string;
    accent: string;
  };
  startPos: { x: number; y: number; angle: number };
}

export interface GhostSample {
  progress: number; // 0.0 to 1.0 along spline
  time: number;     // Elapsed seconds in lap
  x: number;
  y: number;
  angle: number;
  speed: number;
}

export interface SkidMark {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  alpha: number;
}

export interface SmokeParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
}

export interface CrashDebrisParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  alpha: number;
  color: string;
}
