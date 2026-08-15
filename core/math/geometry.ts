import type { Rectangle, Circle, Point2D} from "../types/geometry";
import { Vector2 } from "./vector";
import { clamp } from "../utils";

/**
 * Axis-Aligned Bounding Box (AABB) & Geometric Intersection Tests.
 */
export class AABB implements Rectangle {
  public x: number;
  public y: number;
  public width: number;
  public height: number;

  constructor(x: number, y: number, width: number, height: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
  }

  get minX(): number {
    return this.x;
  }
  get maxX(): number {
    return this.x + this.width;
  }
  get minY(): number {
    return this.y;
  }
  get maxY(): number {
    return this.y + this.height;
  }
  get center(): Point2D {
    return { x: this.x + this.width / 2, y: this.y + this.height / 2 };
  }

  public intersectsAABB(other: Rectangle): boolean {
    return (
      this.x < other.x + other.width &&
      this.x + this.width > other.x &&
      this.y < other.y + other.height &&
      this.y + this.height > other.y
    );
  }

  public containsPoint(p: Point2D): boolean {
    return (
      p.x >= this.x &&
      p.x <= this.x + this.width &&
      p.y >= this.y &&
      p.y <= this.y + this.height
    );
  }

  public intersectsCircle(circle: Circle): boolean {
    // Find closest point on AABB to circle center
    const closestX = clamp(circle.x, this.minX, this.maxX);
    const closestY = clamp(circle.y, this.minY, this.maxY);

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    return dx * dx + dy * dy < circle.radius * circle.radius;
  }
}

/**
 * Circle-to-Circle collision check.
 */
export function circleIntersectsCircle(c1: Circle, c2: Circle): boolean {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const rSum = c1.radius + c2.radius;
  return dx * dx + dy * dy < rSum * rSum;
}

/**
 * Circle-to-AABB collision check with contact normal resolution.
 */
export function circleIntersectsAABB(
  circle: Circle,
  rect: Rectangle
): { hit: boolean; normal: Vector2; penetration: number } {
  const closestX = clamp(circle.x, rect.x, rect.x + rect.width);
  const closestY = clamp(circle.y, rect.y, rect.y + rect.height);

  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= circle.radius * circle.radius) {
    return { hit: false, normal: Vector2.zero(), penetration: 0 };
  }

  const dist = Math.sqrt(distSq);
  if (dist === 0) {
    // Circle center is inside rectangle
    return { hit: true, normal: Vector2.up(), penetration: circle.radius };
  }

  return {
    hit: true,
    normal: new Vector2(dx / dist, dy / dist),
    penetration: circle.radius - dist,
  };
}
