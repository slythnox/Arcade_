export class Vector2 {
  public x: number;
  public y: number;

  constructor(x: number = 0, y: number = 0) {
    this.x = x;
    this.y = y;
  }

  public clone(): Vector2 {
    return new Vector2(this.x, this.y);
  }

  public set(x: number, y: number): this {
    this.x = x;
    this.y = y;
    return this;
  }

  public add(v: Vector2): Vector2 {
    return new Vector2(this.x + v.x, this.y + v.y);
  }

  public addMut(v: Vector2): this {
    this.x += v.x;
    this.y += v.y;
    return this;
  }

  public sub(v: Vector2): Vector2 {
    return new Vector2(this.x - v.x, this.y - v.y);
  }

  public subMut(v: Vector2): this {
    this.x -= v.x;
    this.y -= v.y;
    return this;
  }

  public scale(s: number): Vector2 {
    return new Vector2(this.x * s, this.y * s);
  }

  public scaleMut(s: number): this {
    this.x *= s;
    this.y *= s;
    return this;
  }

  public magnitude(): number {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  }

  public sqrMagnitude(): number {
    return this.x * this.x + this.y * this.y;
  }

  public normalize(): Vector2 {
    const len = this.magnitude();
    if (len === 0) return new Vector2(0, 0);
    return new Vector2(this.x / len, this.y / len);
  }

  public normalizeMut(): this {
    const len = this.magnitude();
    if (len !== 0) {
      this.x /= len;
      this.y /= len;
    }
    return this;
  }

  public dot(v: Vector2): number {
    return this.x * v.x + this.y * v.y;
  }

  public distance(v: Vector2): number {
    return Math.sqrt(this.sqrDistance(v));
  }

  public sqrDistance(v: Vector2): number {
    const dx = this.x - v.x;
    const dy = this.y - v.y;
    return dx * dx + dy * dy;
  }

  public lerp(v: Vector2, t: number): Vector2 {
    return new Vector2(
      this.x + (v.x - this.x) * t,
      this.y + (v.y - this.y) * t
    );
  }

  public angle(): number {
    return Math.atan2(this.y, this.x);
  }

  /**
   * Reflects this vector off a surface with the given normal.
   * R = V - 2 * (V · N) * N
   */
  public reflect(normal: Vector2): Vector2 {
    const n = normal.normalize();
    const d = this.dot(n);
    return this.sub(n.scale(2 * d));
  }

  /**
   * Rotates vector by radians.
   */
  public rotate(radians: number): Vector2 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new Vector2(
      this.x * cos - this.y * sin,
      this.x * sin + this.y * cos
    );
  }

  /** 2D scalar cross product. Positive = v is counter-clockwise from this. */
  public cross(v: Vector2): number {
    return this.x * v.y - this.y * v.x;
  }

  /** Projects this vector onto `onto`. */
  public project(onto: Vector2): Vector2 {
    const d = onto.dot(onto);
    if (d === 0) return Vector2.zero();
    return onto.scale(this.dot(onto) / d);
  }

  /** Returns the perpendicular vector (rotated 90° CCW). */
  public perp(): Vector2 {
    return new Vector2(-this.y, this.x);
  }

  public static zero(): Vector2 {
    return new Vector2(0, 0);
  }

  public static up(): Vector2 {
    return new Vector2(0, -1);
  }

  public static down(): Vector2 {
    return new Vector2(0, 1);
  }

  public static left(): Vector2 {
    return new Vector2(-1, 0);
  }

  public static right(): Vector2 {
    return new Vector2(1, 0);
  }

  /** Creates a unit vector from an angle in radians. */
  public static fromAngle(radians: number): Vector2 {
    return new Vector2(Math.cos(radians), Math.sin(radians));
  }

  /** Linear interpolation between two vectors. */
  public static lerp(a: Vector2, b: Vector2, t: number): Vector2 {
    return new Vector2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}
