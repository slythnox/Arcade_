import { Vector2 } from "../../core/math/vector";
import type { Rectangle, Circle } from "../../core/types/geometry";
import { clamp } from "../../core/utils";

/**
 * Calculates ball reflection vector when striking the player paddle.
 * Deflects ball left/right depending on normalized offset from paddle center:
 * offset = (ball.x - paddle.center.x) / (paddle.width / 2) [-1.0, 1.0]
 */
export function calculatePaddleReflection(
  ballPos: Vector2,
  ballSpeed: number,
  paddle: Rectangle
): Vector2 {
  const paddleCenterX = paddle.x + paddle.width / 2;
  const offset = clamp((ballPos.x - paddleCenterX) / (paddle.width / 2), -0.95, 0.95);

  // Angle ranges from -60 deg (left) to +60 deg (right)
  const maxAngle = (60 * Math.PI) / 180;
  const angle = offset * maxAngle;

  // New velocity vector: (sin(angle), -cos(angle)) * speed
  return new Vector2(Math.sin(angle) * ballSpeed, -Math.cos(angle) * ballSpeed);
}

/**
 * Brick collision test returning reflection normal and hit status.
 */
export function testBallBrickCollision(
  ball: Circle,
  brick: Rectangle
): { hit: boolean; normal: Vector2 } {
  const closestX = clamp(ball.x, brick.x, brick.x + brick.width);
  const closestY = clamp(ball.y, brick.y, brick.y + brick.height);

  const dx = ball.x - closestX;
  const dy = ball.y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq > ball.radius * ball.radius) {
    return { hit: false, normal: Vector2.zero() };
  }

  // Determine collision side based on penetration depth
  const overlapLeft = Math.abs(ball.x + ball.radius - brick.x);
  const overlapRight = Math.abs(brick.x + brick.width - (ball.x - ball.radius));
  const overlapTop = Math.abs(ball.y + ball.radius - brick.y);
  const overlapBottom = Math.abs(brick.y + brick.height - (ball.y - ball.radius));

  const minOverlapX = Math.min(overlapLeft, overlapRight);
  const minOverlapY = Math.min(overlapTop, overlapBottom);

  if (minOverlapX < minOverlapY) {
    return { hit: true, normal: new Vector2(dx < 0 ? -1 : 1, 0) };
  } else {
    return { hit: true, normal: new Vector2(0, dy < 0 ? -1 : 1) };
  }
}
