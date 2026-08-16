# Determinism, PRNG & Replay Systems

This document explains the mathematical determinism model, pseudo-random number generator implementation, seed derivation formulas, and replay capabilities in **ARCADE_** (`core/math/random.ts`, `lib/featured/`).

---

## 1. The Core Determinism Principle

A simulation is **fully deterministic** if:

$$\text{State}_{t+1} = f(\text{State}_t, \text{Input}_t, \text{PRNG}_t)$$

Given:
1. An identical initial seed $S_0$
2. A fixed simulation delta time $\Delta t = \frac{1}{60}\text{s}$
3. An identical chronological stream of user inputs $(\text{tick}_i, \text{action}_i)$

The simulation will produce **byte-for-byte identical outcomes** across any browser, operating system, and hardware architecture.

---

## 2. Why `Math.random()` Breaks Determinism

1. **Unseeded:** JavaScript's built-in `Math.random()` cannot be seeded. It initializes from system entropy.
2. **Implementation-Defined:** The ECMAScript specification does not mandate a specific algorithm. V8 uses xorshift128+, while SpiderMonkey and JavaScriptCore may use different algorithms or bit distributions.
3. **Non-Reproducible:** Games using `Math.random()` cannot implement daily challenges or synchronized gameplay.

---

## 3. Mulberry32 Implementation (`core/math/random.ts`)

ARCADE_ uses **Mulberry32**, a fast, high-quality 32-bit state generator passing standard statistical tests (Dieharder, BigCrush):

```typescript
export class RandomSource {
  private seed: number;
  private state: number;

  constructor(seed: number = 1337) {
    this.seed = seed;
    this.state = seed >>> 0;
  }

  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  public nextInt(min: number, max: number): number {
    return Math.floor(this.nextFloat() * (max - min + 1)) + min;
  }

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
```

---

## 4. Deterministic Global Features

### 1. Deterministic Daily Challenge (`lib/featured/getWeeklyFeatured.ts`)
Generates a synchronized daily game and seed for all players worldwide using the ISO date string:

```typescript
export function getDailyChallenge(date: Date = new Date()) {
  const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const seed = seedFromDateString(dateString);
  const rng = new RandomSource(seed);
  const game = rng.choice(gameRegistry);

  return { game, seed, dateString };
}
```

### 2. Deterministic Weekly Featured Game
Computes the ISO 8601 week number (`WEEK-YYYY-WW`) and picks a featured game identically across all users without database queries.

---

## 5. Limits of Determinism

While ARCADE_ strives for strict determinism, developers must adhere to these rules:
- **Never use `performance.now()` or `Date.now()` inside `update()`:** Use `deltaTime` or `session.tickCount`.
- **Never read mouse/touch coordinates without rounding:** Sub-pixel pointer coordinates can introduce floating-point divergence.
- **Never call `Math.random()`:** Always use `ctx.random.nextFloat()`.
