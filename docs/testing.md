# Testing Strategy & Quality Assurance

This document details the testing architecture, mock test harnesses, 62-cartridge smoke testing suites, and unit test patterns in **ARCADE_** (`tests/`, `vitest.config.ts`).

---

## 1. Test Suite Overview

ARCADE_ uses **Vitest** for fast, deterministic headless unit and smoke testing:

```bash
# Run the entire test suite
npm test

# Run tests in watch mode
npm run test:watch

# Run TypeScript compiler check
npm run typecheck
```

---

## 2. Test Harness & Dependency Mocking (`tests/helpers/mockContext.ts`)

Because cartridges receive all dependencies via `GameContext`, tests can execute headlessly in Node.js without a real browser DOM, Canvas element, or Web Audio context:

```typescript
export function createMockContext(seed = 1337): GameContext {
  return {
    session: new GameSession("test-game", seed),
    input: new InputManager(),
    renderer: createMockRenderer(),
    audio: {
      playTone: () => {},
      playMove: () => {},
      playRotate: () => {},
      playDrop: () => {},
      playCoin: () => {},
      playLineClear: () => {},
      playHit: () => {},
      playExplosion: () => {},
      playGameOver: () => {},
      playLaser: () => {},
      playPowerUp: () => {},
      playVictory: () => {},
      setVolume: () => {},
      getVolume: () => 0.7,
      setMuted: () => {},
      toggleMute: () => false,
      getIsMuted: () => false,
      subscribeMuteChange: () => () => {},
      destroy: () => {},
    } as unknown as AudioManager,
    random: new RandomSource(seed),
  };
}

export function createMockRenderer(): Renderer {
  return {
    clear: () => {},
    drawRect: () => {},
    drawCircle: () => {},
    drawLine: () => {},
    drawText: () => {},
    drawGrid: () => {},
    save: () => {},
    restore: () => {},
    translate: () => {},
    scale: () => {},
    rotate: () => {},
    getWidth: () => 480,
    getHeight: () => 640,
  };
}
```

---

## 3. Automated Smoke Test Suites (`tests/smoke/`)

### 1. All-Cartridge Gauntlet (`tests/smoke/allGames.smoke.test.ts`)
Iterates over all 62 entries in `arcadeRegistry` and verifies:
1. `def.createGame()` factory resolves without throwing.
2. `instance.init(ctx)` succeeds.
3. 60 consecutive simulation ticks (`update(1/60)`) execute without error.
4. `instance.render(renderer)` draws without throwing.
5. `instance.getScore()` and `instance.getLevel()` return valid, finite numbers.
6. `pause()`, `resume()`, and `reset()` state transitions succeed.
7. `instance.destroy()` cleanly unlinks resources.

### 2. Input Fuzzing & Safety (`tests/smoke/gameInputs.smoke.test.ts`)
Injects every valid `GameAction` (`MOVE_LEFT`, `MOVE_RIGHT`, `ROTATE`, `ACTION_PRIMARY`, etc.) into every game, ensuring no cartridge crashes or produces `NaN` states on unexpected input sequences.

### 3. Physics Safety (`tests/smoke/physicsSafety.smoke.test.ts`)
Tests 20 physics-driven cartridges over 300 simulation frames to verify that positions, velocities, and bounding boxes remain finite and never escape into `NaN` or `Infinity`.

---

## 4. Mathematical & Algorithmic Unit Tests (`tests/unit/`)

- `vector.test.ts`: Vector arithmetic, dot product, scalar cross product, projections, and normal reflections.
- `geometry.test.ts`: AABB containment, overlap boundaries, and circle-to-AABB contact normal resolution.
- `algorithms.test.ts`: A\* pathfinding, BFS traversal, iterative flood fill, and Levenshtein edit distance.
- `math.test.ts`: Mulberry32 seed determinism, ValueNoise continuity, and easing curve endpoints.
