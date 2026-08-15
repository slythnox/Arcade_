import { describe, it, expect } from "vitest";
import { Vector2 } from "../../core/math/vector";
import { Matrix2, rotateMatrixCW, rotateMatrixCCW } from "../../core/math/matrix";
import { AABB, circleIntersectsAABB } from "../../core/math/geometry";
import { lerp, inverseLerp, remap, smoothstep } from "../../core/math/interpolation";
import { RandomSource, seedFromDateString } from "../../core/math/random";
import { manhattanDistance, euclideanDistance } from "../../core/math/distance";
import { clamp } from "../../core/utils";

describe("Core Math & Utils", () => {
  it("clamp respects boundaries and throws on inverted bounds", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
    expect(() => clamp(5, 10, 0)).toThrow();
  });

  it("Vector2 arithmetic and reflection", () => {
    const v1 = new Vector2(3, 4);
    expect(v1.magnitude()).toBe(5);

    const norm = v1.normalize();
    expect(norm.magnitude()).toBeCloseTo(1.0);

    const v2 = new Vector2(1, 2);
    const sum = v1.add(v2);
    expect(sum.x).toBe(4);
    expect(sum.y).toBe(6);

    // Vector reflection off horizontal wall (normal pointing down [0, 1])
    const ballVel = new Vector2(2, -3);
    const reflected = ballVel.reflect(new Vector2(0, 1));
    expect(reflected.x).toBeCloseTo(2);
    expect(reflected.y).toBeCloseTo(3);
  });

  it("Matrix2 and discrete matrix rotations", () => {
    const m = Matrix2.rotation90CW();
    const v = new Vector2(1, 0);
    const rotated = m.multiplyVector(v);
    expect(rotated.x).toBe(0);
    expect(rotated.y).toBe(1);

    // 3x3 Tetris T-piece grid rotation
    const tPiece = [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ];
    const rotatedCW = rotateMatrixCW(tPiece);
    expect(rotatedCW).toEqual([
      [0, 1, 0],
      [0, 1, 1],
      [0, 1, 0],
    ]);

    const rotatedCCW = rotateMatrixCCW(rotatedCW);
    expect(rotatedCCW).toEqual(tPiece);
  });

  it("Geometry AABB and Circle intersections", () => {
    const box = new AABB(10, 10, 20, 20);
    expect(box.containsPoint({ x: 15, y: 15 })).toBe(true);
    expect(box.containsPoint({ x: 5, y: 15 })).toBe(false);

    expect(box.intersectsAABB({ x: 25, y: 25, width: 10, height: 10 })).toBe(true);
    expect(box.intersectsAABB({ x: 35, y: 35, width: 10, height: 10 })).toBe(false);

    const circleInside = { x: 15, y: 15, radius: 5 };
    expect(box.intersectsCircle(circleInside)).toBe(true);

    const circleOutside = { x: 50, y: 50, radius: 5 };
    expect(box.intersectsCircle(circleOutside)).toBe(false);

    const hitResult = circleIntersectsAABB({ x: 5, y: 20, radius: 6 }, box);
    expect(hitResult.hit).toBe(true);
  });

  it("Interpolation and remap", () => {
    expect(lerp(0, 100, 0.5)).toBe(50);
    expect(inverseLerp(10, 20, 15)).toBe(0.5);
    expect(remap(0, 10, 0, 100, 5)).toBe(50);
    expect(smoothstep(0, 10, 5)).toBe(0.5);
  });

  it("Deterministic PRNG reproduces identical sequences", () => {
    const rng1 = new RandomSource(1337);
    const rng2 = new RandomSource(1337);

    const seq1 = [rng1.nextFloat(), rng1.nextInt(1, 100), rng1.nextFloat()];
    const seq2 = [rng2.nextFloat(), rng2.nextInt(1, 100), rng2.nextFloat()];

    expect(seq1).toEqual(seq2);
    expect(seedFromDateString("2026-08-14")).toBe(seedFromDateString("2026-08-14"));
  });

  it("Distance metrics", () => {
    const p1 = { x: 0, y: 0 };
    const p2 = { x: 3, y: 4 };
    expect(manhattanDistance(p1, p2)).toBe(7);
    expect(euclideanDistance(p1, p2)).toBe(5);
  });
});
