import { RandomSource } from "./random";
import { smoothstep } from "./interpolation";

/**
 * 1D and 2D Seeded Gradient Value Noise generator.
 * Used for procedural pixel foliage, moss growth patterns, and terrain heights.
 */
export class ValueNoise {
  private permutation: number[] = [];

  constructor(seed: number = 1337) {
    this.init(seed);
  }

  private init(seed: number): void {
    const rng = new RandomSource(seed);
    const p: number[] = Array.from({ length: 256 }, (_, i) => i);
    const shuffled = rng.shuffle(p);
    this.permutation = [...shuffled, ...shuffled];
  }

  /**
   * 1D smooth value noise in range [0, 1].
   */
  public noise1D(x: number): number {
    const xi = Math.floor(x) & 255;
    const xf = x - Math.floor(x);
    const u = smoothstep(0, 1, xf);

    const g0 = (this.permutation[xi] % 100) / 100;
    const g1 = (this.permutation[xi + 1] % 100) / 100;

    return g0 * (1 - u) + g1 * u;
  }

  /**
   * 2D smooth value noise in range [0, 1].
   */
  public noise2D(x: number, y: number): number {
    const xi = Math.floor(x) & 255;
    const yi = Math.floor(y) & 255;
    const xf = x - Math.floor(x);
    const yf = y - Math.floor(y);

    const u = smoothstep(0, 1, xf);
    const v = smoothstep(0, 1, yf);

    const aa = this.permutation[this.permutation[xi] + yi];
    const ab = this.permutation[this.permutation[xi] + yi + 1];
    const ba = this.permutation[this.permutation[xi + 1] + yi];
    const bb = this.permutation[this.permutation[xi + 1] + yi + 1];

    const v0 = (aa % 100) / 100;
    const v1 = (ba % 100) / 100;
    const v2 = (ab % 100) / 100;
    const v3 = (bb % 100) / 100;

    const x1 = v0 * (1 - u) + v1 * u;
    const x2 = v2 * (1 - u) + v3 * u;

    return x1 * (1 - v) + x2 * v;
  }
}
