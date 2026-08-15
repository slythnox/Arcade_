import { stringSimilarity } from "../../core/algorithms/levenshtein";

/**
 * Computes maximum fuzzy match score between query token and a target field.
 */
export function calculateFieldScore(queryTokens: string[], fieldText: string): number {
  if (queryTokens.length === 0 || !fieldText) return 0;

  const normalizedField = fieldText.toLowerCase();
  let maxScore = 0;

  for (const token of queryTokens) {
    // Exact substring match gives highest baseline
    if (normalizedField === token) {
      maxScore = Math.max(maxScore, 1.0);
    } else if (normalizedField.includes(token)) {
      maxScore = Math.max(maxScore, 0.85);
    } else {
      // Fuzzy similarity against individual words in field
      const words = normalizedField.split(/[\s-_]+/);
      for (const word of words) {
        const sim = stringSimilarity(token, word);
        if (sim >= 0.6) {
          maxScore = Math.max(maxScore, sim * 0.8);
        }
      }
    }
  }

  return maxScore;
}
