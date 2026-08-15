import { Vector2 } from "../../core/math/vector";
import { Rectangle } from "../../core/types/geometry";
import { clamp } from "../../core/utils";

/**
 * Calculates ball reflection vector off player or AI paddle with dynamic spin deflection.
 */
export function calculatePongPaddleReflection(
  ballY: number,
  paddle: Rectangle,
  ballSpeed: number,
  movingRight: boolean
): Vector2 {
  const paddleCenterY = paddle.y + paddle.height / 2;
  const offset = clamp((ballY - paddleCenterY) / (paddle.height / 2), -0.9, 0.9);

  const maxAngle = (50 * Math.PI) / 180;
  const angle = offset * maxAngle;

  const dirX = movingRight ? 1 : -1;
  return new Vector2(
    dirX * Math.cos(angle) * ballSpeed,
    Math.sin(angle) * ballSpeed
  );
}
