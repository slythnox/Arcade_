/**
 * Classic scoring calculation for Tetris based on cleared lines and current level.
 */
export function calculateLineScore(linesCleared: number, level: number): number {
  switch (linesCleared) {
    case 1:
      return 100 * level;
    case 2:
      return 300 * level;
    case 3:
      return 500 * level;
    case 4:
      return 800 * level; // TETRIS!
    default:
      return 0;
  }
}

/**
 * Calculates drop speed in seconds per cell based on level.
 * Classic gravity formula.
 */
export function getGravityForLevel(level: number): number {
  const clampedLevel = Math.max(1, Math.min(20, level));
  // Standard exponential gravity curve: (0.8 - ((level - 1) * 0.007))^(level - 1)
  return Math.max(0.05, Math.pow(0.8 - (clampedLevel - 1) * 0.007, clampedLevel - 1));
}
