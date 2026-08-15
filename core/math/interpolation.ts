import { clamp } from "../utils/index";
export { clamp };

/**
 * Standard linear interpolation.
 */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Calculates normalized parameter t where lerp(a, b, t) == value.
 */
export function inverseLerp(a: number, b: number, value: number): number {
  if (a === b) return 0;
  return clamp((value - a) / (b - a), 0, 1);
}

/**
 * Remaps value from [inMin, inMax] range to [outMin, outMax] range.
 */
export function remap(
  inMin: number,
  inMax: number,
  outMin: number,
  outMax: number,
  value: number
): number {
  const t = inverseLerp(inMin, inMax, value);
  return lerp(outMin, outMax, t);
}

/**
 * Smooth Hermite interpolation between 0 and 1.
 */
export function smoothstep(min: number, max: number, value: number): number {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * (3 - 2 * x);
}

/**
 * Ken Perlin's improved smootherstep.
 */
export function smootherstep(min: number, max: number, value: number): number {
  const x = clamp((value - min) / (max - min), 0, 1);
  return x * x * x * (x * (x * 6 - 15) + 10);
}
