# Storage & Player Persistence Architecture

This document details the client-side persistence model, schema versioning, player statistics, and high-score storage implemented in **ARCADE_** (`lib/storage/`).

---

## 1. Storage Philosophy

- **Zero Backend Database:** Gameplay scores and user preferences reside entirely within the user's browser.
- **Privacy First:** Gameplay telemetry is never transmitted to an external server.
- **Fail-Safe Operation:** If `localStorage` is disabled (e.g. private browsing storage lock) or full, the system falls back gracefully to in-memory defaults without crashing.

---

## 2. Versioned LocalStorage Abstraction (`lib/storage/localStorage.ts`)

All keys are prefixed with a schema version (`arcade:v1:*`) to prevent key collisions with other applications on the same origin:

```typescript
const STORAGE_PREFIX = "arcade:v1:";

export function getStorageItem<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") return defaultValue;
  try {
    const raw = window.localStorage.getItem(`${STORAGE_PREFIX}${key}`);
    if (raw === null) return defaultValue;
    return JSON.parse(raw) as T;
  } catch {
    return defaultValue;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(`${STORAGE_PREFIX}${key}`, JSON.stringify(value));
  } catch {
    // Graceful fallback on QuotaExceededError or security exceptions
  }
}
```

---

## 3. Player Stats & High Scores (`lib/storage/gameProgress.ts`)

`PlayerStats` tracks cumulative metrics across all 60 cartridges:

```typescript
export interface PlayerStats {
  gamesPlayed: number;
  totalPlayTimeSeconds: number;
  highScores: Record<string, number>;
  cartridgesUnlocked: string[];
  favorites: string[];
  lastPlayed?: {
    gameId: string;
    timestamp: number;
  };
}
```

### High Score Recording
When a game session terminates, `recordGameSessionEnd()` updates cumulative play time, increments game counts, and checks if a new personal best was achieved:

```typescript
export function recordGameSessionEnd(
  gameId: string,
  score: number,
  durationSeconds: number
): { isNewHighScore: boolean; stats: PlayerStats } {
  const stats = loadPlayerStats();
  stats.gamesPlayed++;
  stats.totalPlayTimeSeconds += Math.floor(durationSeconds);

  const prevHigh = stats.highScores[gameId] || 0;
  const isNewHighScore = score > prevHigh;

  if (isNewHighScore) {
    stats.highScores[gameId] = score;
  }

  setStorageItem("progress", stats);
  return { isNewHighScore, stats };
}
```

---

## 4. Player Settings (`lib/storage/settings.ts`)

Stores user preferences:
- `soundEnabled`: Master sound switch.
- `volume`: Gain level in range $[0.0, 1.0]$.
- `crtEnabled`: CRT scanline and vignette overlay switch.
- `reducedMotion`: Disables blinking animations and intense camera shakes.
