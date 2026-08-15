import { Vector2 } from "./vector";

/**
 * 2x2 Matrix for 2D linear transformations and rotations.
 * | a  c |
 * | b  d |
 */
export class Matrix2 {
  public a: number;
  public b: number;
  public c: number;
  public d: number;

  constructor(a: number = 1, b: number = 0, c: number = 0, d: number = 1) {
    this.a = a;
    this.b = b;
    this.c = c;
    this.d = d;
  }

  public static identity(): Matrix2 {
    return new Matrix2(1, 0, 0, 1);
  }

  /**
   * Creates a 90-degree clockwise rotation matrix:
   * | 0  1 |
   * |-1  0 |
   */
  public static rotation90CW(): Matrix2 {
    return new Matrix2(0, 1, -1, 0);
  }

  /**
   * Creates a 90-degree counter-clockwise rotation matrix:
   * | 0 -1 |
   * | 1  0 |
   */
  public static rotation90CCW(): Matrix2 {
    return new Matrix2(0, -1, 1, 0);
  }

  public static fromAngle(radians: number): Matrix2 {
    const cos = Math.cos(radians);
    const sin = Math.sin(radians);
    return new Matrix2(cos, sin, -sin, cos);
  }

  public multiplyVector(v: Vector2): Vector2 {
    return new Vector2(
      this.a * v.x + this.c * v.y,
      this.b * v.x + this.d * v.y
    );
  }

  public multiplyMatrix(m: Matrix2): Matrix2 {
    return new Matrix2(
      this.a * m.a + this.c * m.b,
      this.b * m.a + this.d * m.b,
      this.a * m.c + this.c * m.d,
      this.b * m.c + this.d * m.d
    );
  }

  public determinant(): number {
    return this.a * this.d - this.b * this.c;
  }
}

/**
 * Rotates an NxN discrete 2D matrix clockwise.
 * Mathematical equivalent to Transpose + Reverse Rows.
 */
export function rotateMatrixCW<T>(matrix: T[][]): T[][] {
  const n = matrix.length;
  if (n === 0) return [];
  const m = matrix[0].length;
  const result: T[][] = Array.from({ length: m }, () => new Array(n));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < m; c++) {
      result[c][n - 1 - r] = matrix[r][c];
    }
  }

  return result;
}

/**
 * Rotates an NxN discrete 2D matrix counter-clockwise.
 */
export function rotateMatrixCCW<T>(matrix: T[][]): T[][] {
  const n = matrix.length;
  if (n === 0) return [];
  const m = matrix[0].length;
  const result: T[][] = Array.from({ length: m }, () => new Array(n));

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < m; c++) {
      result[m - 1 - c][r] = matrix[r][c];
    }
  }

  return result;
}
