/**
 * Standard easing curves for deterministic animations and physics damping.
 */
export function easeLinear(t: number): number {
  return t;
}

export function easeInQuad(t: number): number {
  return t * t;
}

export function easeOutQuad(t: number): number {
  return t * (2 - t);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export function easeInCubic(t: number): number {
  return t * t * t;
}

export function easeOutCubic(t: number): number {
  const f = t - 1;
  return f * f * f + 1;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
}

export function easeOutBack(t: number, s: number = 1.70158): number {
  const f = t - 1;
  return f * f * ((s + 1) * f + s) + 1;
}

export function easeOutBounce(t: number): number {
  const n1 = 7.5625;
  const d1 = 2.75;

  if (t < 1 / d1) {
    return n1 * t * t;
  } else if (t < 2 / d1) {
    const f = t - 1.5 / d1;
    return n1 * f * f + 0.75;
  } else if (t < 2.5 / d1) {
    const f = t - 2.25 / d1;
    return n1 * f * f + 0.9375;
  } else {
    const f = t - 2.625 / d1;
    return n1 * f * f + 0.984375;
  }
}
