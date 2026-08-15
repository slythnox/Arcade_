import type { GameDefinition } from "../../games/types";
import { gameRegistry } from "../../games/registry";
import { seedFromDateString, RandomSource } from "../../core/math/random";

/**
 * Returns deterministic Weekly Featured Game based on ISO Year and Week number.
 * Identical across all users without database queries.
 */
export function getWeeklyFeaturedGame(date: Date = new Date()): GameDefinition {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);

  const key = `WEEK-${d.getUTCFullYear()}-${weekNo}`;
  const seed = seedFromDateString(key);
  const rng = new RandomSource(seed);

  return rng.choice(gameRegistry);
}

/**
 * Returns deterministic Daily Challenge Game & Seed for today's date.
 */
export function getDailyChallenge(date: Date = new Date()): {
  game: GameDefinition;
  seed: number;
  dateString: string;
} {
  const dateString = date.toISOString().split("T")[0]; // YYYY-MM-DD
  const seed = seedFromDateString(dateString);
  const rng = new RandomSource(seed);
  const game = rng.choice(gameRegistry);

  return {
    game,
    seed,
    dateString,
  };
}
