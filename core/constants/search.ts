/**
 * Centralized ranking weights for the ARCADE_ fuzzy search formula.
 * Must sum to 1.0.
 */
export const SEARCH_WEIGHTS = {
  name: 0.40,
  platform: 0.20,
  genre: 0.15,
  description: 0.10,
  tag: 0.10,
  year: 0.05,
} as const;

export const MIN_SEARCH_SIMILARITY_THRESHOLD = 0.35;
