/**
 * Clamps a number within inclusive lower and upper bounds.
 */
export function clamp(value: number, min: number, max: number): number {
  if (min > max) {
    throw new Error(`clamp: min (${min}) cannot be greater than max (${max})`);
  }
  return Math.max(min, Math.min(max, value));
}

/**
 * Normalizes and converts string to a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

/**
 * Formats a score with leading zeros for that authentic retro 8-digit arcade look.
 */
export function formatScore(score: number, digits: number = 6): string {
  const safeScore = Math.max(0, Math.floor(score));
  return safeScore.toString().padStart(digits, "0");
}

/**
 * Formats seconds into MM:SS format.
 */
export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Generic debounce utility function.
 */
export function debounce<T extends (...args: unknown[]) => void>(
  fn: T,
  waitMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return (...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
    }, waitMs);
  };
}

/**
 * Simple invariant assertion.
 */
export function invariant(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(`Invariant Violation: ${message}`);
  }
}
