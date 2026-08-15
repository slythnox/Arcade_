/**
 * Deterministic Pseudo-Random Number Generator (PRNG) using Mulberry32.
 * Produces identical numerical sequences across any platform/browser given the same seed.
 */
export class RandomSource {
  private seed: number;
  private state: number;

  constructor(seed: number = 1337) {
    this.seed = seed;
    this.state = seed >>> 0;
  }

  public getSeed(): number {
    return this.seed;
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.seed = seed;
    }
    this.state = this.seed >>> 0;
  }

  /**
   * Generates next float in [0, 1) range (alias for nextFloat).
   */
  public next(): number {
    return this.nextFloat();
  }

  /**
   * Generates next float in [0, 1) range.
   */
  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates integer in inclusive [min, max] range.
   */
  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

  /**
   * Random boolean with optional probability threshold.
   */
  public nextBool(probability: number = 0.5): boolean {
    return this.nextFloat() < probability;
  }

  /**
   * Pick random item from an array.
   */
  public choice<T>(array: readonly T[]): T {
    if (array.length === 0) {
      throw new Error("Cannot pick from empty array");
    }
    return array[this.nextInt(0, array.length - 1)];
  }

  /**
   * Deterministic Fisher-Yates array shuffle (returns new copy).
   */
  public shuffle<T>(array: readonly T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      const temp = copy[i];
      copy[i] = copy[j];
      copy[j] = temp;
    }
    return copy;
  }
}

/**
 * Creates a new RandomSource with specified seed.
 */
export function createRandom(seed: number = 1337): RandomSource {
  return new RandomSource(seed);
}

/**
 * Generate a deterministic integer seed from a date string (e.g. "2026-08-14")
 */
export function seedFromDateString(dateStr: string): number {
  let hash = 0;
  for (let i = 0; i < dateStr.length; i++) {
    const char = dateStr.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash) || 1337;
}
