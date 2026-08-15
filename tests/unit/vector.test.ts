import { describe, it, expect } from "vitest";
import { Vector2 } from "../../core/math/vector";

describe("Vector2", () => {
  it("cross product works", () => {
    const v1 = new Vector2(1, 0);
    const v2 = new Vector2(0, 1);
    expect(v1.cross(v2)).toBe(1);
    expect(v2.cross(v1)).toBe(-1);
  });

  it("project works", () => {
    const v1 = new Vector2(2, 2);
    const onto = new Vector2(1, 0);
    const proj = v1.project(onto);
    expect(proj.x).toBe(2);
    expect(proj.y).toBe(0);

    const zeroOnto = new Vector2(0, 0);
    const projZero = v1.project(zeroOnto);
    expect(projZero.x).toBe(0);
    expect(projZero.y).toBe(0);
  });

  it("perp works", () => {
    const v = new Vector2(1, 2);
    const p = v.perp();
    expect(p.x).toBe(-2);
    expect(p.y).toBe(1);
  });

  it("fromAngle works", () => {
    const v = Vector2.fromAngle(Math.PI / 2);
    expect(v.x).toBeCloseTo(0);
    expect(v.y).toBeCloseTo(1);
  });

  it("edge cases: zero vector normalization", () => {
    const zero = new Vector2(0, 0);
    const norm = zero.normalize();
    expect(norm.x).toBe(0);
    expect(norm.y).toBe(0);

    zero.normalizeMut();
    expect(zero.x).toBe(0);
    expect(zero.y).toBe(0);
  });

  it("reflect off non-axis normals", () => {
    const v = new Vector2(1, -1);
    const normal = new Vector2(-1, 1).normalize();
    const reflected = v.reflect(normal);
    expect(reflected.x).toBeCloseTo(-1);
    expect(reflected.y).toBeCloseTo(1);
  });

  it("lerp at t=0 and t=1 boundaries", () => {
    const v1 = new Vector2(0, 0);
    const v2 = new Vector2(10, 10);
    
    const l0 = v1.lerp(v2, 0);
    expect(l0.x).toBe(0);
    expect(l0.y).toBe(0);

    const l1 = v1.lerp(v2, 1);
    expect(l1.x).toBe(10);
    expect(l1.y).toBe(10);
  });

  it("sqrDistance vs distance consistency", () => {
    const v1 = new Vector2(0, 0);
    const v2 = new Vector2(3, 4);
    expect(v1.sqrDistance(v2)).toBe(25);
    expect(v1.distance(v2)).toBe(5);
  });
});
