import type { SearchScoreBreakdown } from "../types/search";
import { SEARCH_WEIGHTS } from "../constants/search";

/**
 * Calculates final weighted search score using centralized SEARCH_WEIGHTS.
 * Score is in [0, 1] range.
 */
export function calculateWeightedSearchScore(
  breakdown: SearchScoreBreakdown
): number {
  return (
    breakdown.nameMatch * SEARCH_WEIGHTS.name +
    breakdown.platformMatch * SEARCH_WEIGHTS.platform +
    breakdown.genreMatch * SEARCH_WEIGHTS.genre +
    breakdown.descriptionMatch * SEARCH_WEIGHTS.description +
    breakdown.tagMatch * SEARCH_WEIGHTS.tag +
    breakdown.yearMatch * SEARCH_WEIGHTS.year
  );
}
