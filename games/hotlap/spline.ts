/** ARCADE_ v1.2.2 */
import { Vector2 } from "../../core/math/vector";
import type { TrackPoint } from "./types";

export interface SplineSample {
  pos: Vector2;
  tangent: Vector2;
  normal: Vector2;
  leftBound: Vector2;
  rightBound: Vector2;
  leftKerb: Vector2;
  rightKerb: Vector2;
  progress: number; // 0.0 to 1.0
  distance: number; // Arc-length from start in world units
}

/**
 * Closed-loop Catmull-Rom Track Spline Evaluator.
 * Computes smooth continuous centerlines, boundary polygons, and orthogonal normals.
 */
export class TrackSpline {
  public readonly points: TrackPoint[];
  public readonly defaultWidth: number;
  public readonly samples: SplineSample[] = [];
  public totalLength: number = 0;

  constructor(points: TrackPoint[], defaultWidth: number = 140, samplesPerSegment: number = 24) {
    this.points = points;
    this.defaultWidth = defaultWidth;
    this.bake(samplesPerSegment);
  }

  private catmullRom(p0: TrackPoint, p1: TrackPoint, p2: TrackPoint, p3: TrackPoint, t: number): { x: number; y: number } {
    const t2 = t * t;
    const t3 = t2 * t;

    const x = 0.5 * (
      (2 * p1.x) +
      (-p0.x + p2.x) * t +
      (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
      (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
    );

    const y = 0.5 * (
      (2 * p1.y) +
      (-p0.y + p2.y) * t +
      (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
      (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
    );

    return { x, y };
  }

  private bake(samplesPerSegment: number): void {
    const n = this.points.length;
    if (n < 3) return;

    this.samples.length = 0;
    const rawPos: Vector2[] = [];

    for (let i = 0; i < n; i++) {
      const p0 = this.points[(i - 1 + n) % n];
      const p1 = this.points[i];
      const p2 = this.points[(i + 1) % n];
      const p3 = this.points[(i + 2) % n];

      for (let s = 0; s < samplesPerSegment; s++) {
        const t = s / samplesPerSegment;
        const pt = this.catmullRom(p0, p1, p2, p3, t);
        rawPos.push(new Vector2(pt.x, pt.y));
      }
    }

    // Compute cumulative arc-lengths and tangent/normal vectors
    const totalSamples = rawPos.length;
    let accumulatedDist = 0;
    const distances: number[] = [0];

    for (let i = 1; i < totalSamples; i++) {
      accumulatedDist += rawPos[i].distance(rawPos[i - 1]);
      distances.push(accumulatedDist);
    }
    // Close loop to first point
    this.totalLength = accumulatedDist + rawPos[0].distance(rawPos[totalSamples - 1]);

    const halfWidth = this.defaultWidth / 2;
    const kerbWidth = 16;

    for (let i = 0; i < totalSamples; i++) {
      const curr = rawPos[i];
      const next = rawPos[(i + 1) % totalSamples];
      const prev = rawPos[(i - 1 + totalSamples) % totalSamples];

      // Tangent direction
      const tangent = next.sub(prev).normalize();
      // Perpendicular normal (90 deg CCW)
      const normal = new Vector2(-tangent.y, tangent.x);

      const leftBound = curr.add(normal.scale(halfWidth));
      const rightBound = curr.sub(normal.scale(halfWidth));

      const leftKerb = curr.add(normal.scale(halfWidth + kerbWidth));
      const rightKerb = curr.sub(normal.scale(halfWidth + kerbWidth));

      this.samples.push({
        pos: curr,
        tangent,
        normal,
        leftBound,
        rightBound,
        leftKerb,
        rightKerb,
        progress: distances[i] / this.totalLength,
        distance: distances[i],
      });
    }
  }

  /**
   * Projects a car position (x, y) onto the closest point on the track centerline spline.
   * Returns progress t in [0.0, 1.0], signed lateral offset (+ is left, - is right), and onTrack boolean.
   */
  public project(x: number, y: number): { progress: number; lateralOffset: number; isOnTrack: boolean; isOnKerb: boolean; nearestSample: SplineSample } {
    if (this.samples.length === 0) {
      return { progress: 0, lateralOffset: 0, isOnTrack: false, isOnKerb: false, nearestSample: this.samples[0] };
    }

    let minSqDist = Infinity;
    let bestIdx = 0;

    // Fast search across pre-baked samples
    for (let i = 0; i < this.samples.length; i++) {
      const s = this.samples[i];
      const dx = x - s.pos.x;
      const dy = y - s.pos.y;
      const sq = dx * dx + dy * dy;
      if (sq < minSqDist) {
        minSqDist = sq;
        bestIdx = i;
      }
    }

    const nearest = this.samples[bestIdx];
    const toCar = new Vector2(x - nearest.pos.x, y - nearest.pos.y);
    const lateralOffset = toCar.dot(nearest.normal); // positive = left of center, negative = right
    const halfWidth = this.defaultWidth / 2;
    const kerbWidth = 16;

    const absOffset = Math.abs(lateralOffset);
    const isOnTrack = absOffset <= halfWidth;
    const isOnKerb = absOffset > halfWidth && absOffset <= halfWidth + kerbWidth;

    return {
      progress: nearest.progress,
      lateralOffset,
      isOnTrack,
      isOnKerb,
      nearestSample: nearest,
    };
  }

  public getSampleAtProgress(progress: number): SplineSample {
    const p = ((progress % 1.0) + 1.0) % 1.0;
    const idx = Math.floor(p * (this.samples.length - 1));
    return this.samples[Math.max(0, Math.min(this.samples.length - 1, idx))];
  }
}
