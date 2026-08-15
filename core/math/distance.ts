import type { Point2D } from "../types/geometry";

/**
 * Manhattan distance: |x1 - x2| + |y1 - y2|
 * Ideal for 4-directional grid games (Snake, Pac-Man, Maze).
 */
export function manhattanDistance(p1: Point2D, p2: Point2D): number {
  return Math.abs(p1.x - p2.x) + Math.abs(p1.y - p2.y);
}

/**
 * Euclidean distance: sqrt((x1-x2)^2 + (y1-y2)^2)
 */
export function euclideanDistance(p1: Point2D, p2: Point2D): number {
  const dx = p1.x - p2.x;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Chebyshev distance: max(|x1-x2|, |y1-y2|)
 * Ideal for 8-directional grids (Minesweeper neighbor distances, Chess kings).
 */
export function chebyshevDistance(p1: Point2D, p2: Point2D): number {
  return Math.max(Math.abs(p1.x - p2.x), Math.abs(p1.y - p2.y));
}
