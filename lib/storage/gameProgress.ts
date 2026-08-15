import { PlayerStats } from "../../core/types/player";
import { getStorageItem, setStorageItem } from "./localStorage";

const DEFAULT_PLAYER_STATS: PlayerStats = {
  gamesPlayed: 0,
  totalPlayTimeSeconds: 0,
  highScores: {
    tetris: 0,
    snake: 0,
    breakout: 0,
    minesweeper: 0,
    pong: 0,
  },
  cartridgesUnlocked: ["tetris", "snake", "breakout", "minesweeper", "pong"],
  favorites: [],
};

export function loadPlayerStats(): PlayerStats {
  return getStorageItem<PlayerStats>("progress", DEFAULT_PLAYER_STATS);
}

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

  stats.lastPlayed = {
    gameId,
    timestamp: Date.now(),
  };

  setStorageItem("progress", stats);
  return { isNewHighScore, stats };
}

export function toggleFavoriteGame(gameId: string): boolean {
  const stats = loadPlayerStats();
  const exists = stats.favorites.includes(gameId);
  if (exists) {
    stats.favorites = stats.favorites.filter((id) => id !== gameId);
  } else {
    stats.favorites.push(gameId);
  }
  setStorageItem("progress", stats);
  return !exists;
}
