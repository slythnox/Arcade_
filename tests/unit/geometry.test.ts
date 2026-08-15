import { describe, it, expect } from "vitest";
import { AABB, circleIntersectsAABB, circleIntersectsCircle } from "../../core/math/geometry";
import { Circle } from "../../core/types/geometry";

describe("Geometry", () => {
  describe("AABB", () => {
    it("containsPoint edge cases", () => {
      const box = new AABB(0, 0, 10, 10);
      expect(box.containsPoint({ x: 5, y: 5 })).toBe(true);
      expect(box.containsPoint({ x: 0, y: 5 })).toBe(true);
      expect(box.containsPoint({ x: 10, y: 10 })).toBe(true);
      expect(box.containsPoint({ x: -1, y: 5 })).toBe(false);
      expect(box.containsPoint({ x: 5, y: 11 })).toBe(false);
    });

    it("intersectsAABB", () => {
      const box1 = new AABB(0, 0, 10, 10);
      const box2 = new AABB(5, 5, 10, 10); // Overlapping
      const box3 = new AABB(10, 0, 10, 10); // Touching edges
      const box4 = new AABB(11, 0, 10, 10); // Separated

      expect(box1.intersectsAABB(box2)).toBe(true);
      expect(box1.intersectsAABB(box3)).toBe(false);
      expect(box1.intersectsAABB(box4)).toBe(false);
    });
  });

  describe("Circle vs AABB", () => {
    it("normal directions", () => {
      const rect = new AABB(10, 10, 10, 10);
      
      // Circle on left
      const cLeft: Circle = { x: 5, y: 15, radius: 6 };
      let res = circleIntersectsAABB(cLeft, rect);
      expect(res.hit).toBe(true);
      expect(res.normal.x).toBeCloseTo(-1);
      expect(res.normal.y).toBeCloseTo(0);

      // Circle on right
      const cRight: Circle = { x: 25, y: 15, radius: 6 };
      res = circleIntersectsAABB(cRight, rect);
      expect(res.hit).toBe(true);
      expect(res.normal.x).toBeCloseTo(1);
      expect(res.normal.y).toBeCloseTo(0);

      // Circle above
      const cAbove: Circle = { x: 15, y: 5, radius: 6 };
      res = circleIntersectsAABB(cAbove, rect);
      expect(res.hit).toBe(true);
      expect(res.normal.x).toBeCloseTo(0);
      expect(res.normal.y).toBeCloseTo(-1);

      // Circle below
      const cBelow: Circle = { x: 15, y: 25, radius: 6 };
      res = circleIntersectsAABB(cBelow, rect);
      expect(res.hit).toBe(true);
      expect(res.normal.x).toBeCloseTo(0);
      expect(res.normal.y).toBeCloseTo(1);
    });

    it("penetration depth calculation", () => {
      const rect = new AABB(10, 10, 10, 10);
      const cLeft: Circle = { x: 8, y: 15, radius: 4 }; // overlaps by 2
      const res = circleIntersectsAABB(cLeft, rect);
      expect(res.hit).toBe(true);
      expect(res.penetration).toBeCloseTo(2);
    });
  });

  describe("Circle vs Circle", () => {
    it("touching and overlapping", () => {
      const c1: Circle = { x: 0, y: 0, radius: 5 };
      const c2: Circle = { x: 10, y: 0, radius: 5 }; // touching exactly
      const c3: Circle = { x: 8, y: 0, radius: 5 }; // overlapping

      expect(circleIntersectsCircle(c1, c2)).toBe(false);
      expect(circleIntersectsCircle(c1, c3)).toBe(true);
    });
  });
});
