import type { GameDefinition } from "../../games/types";
import type { SearchResult, SearchScoreBreakdown } from "../../core/types/search";
import { calculateWeightedSearchScore } from "../../core/algorithms/weightedSearch";
import { calculateFieldScore } from "./similarity";
import { tokenize } from "./tokenize";

export function rankGame(queryTokens: string[], game: GameDefinition): SearchResult<GameDefinition> {
  const nameMatch = calculateFieldScore(queryTokens, game.name);
  const platformMatch = calculateFieldScore(queryTokens, game.platform);
  const genreMatch = calculateFieldScore(queryTokens, game.genre);
  const descriptionMatch = calculateFieldScore(queryTokens, `${game.tagline} ${game.description}`);
  const tagMatch = calculateFieldScore(queryTokens, game.tags.join(" "));
  const yearMatch = queryTokens.some((t) => t === game.year.toString()) ? 1.0 : 0.0;

  const breakdown: SearchScoreBreakdown = {
    nameMatch,
    platformMatch,
    genreMatch,
    descriptionMatch,
    tagMatch,
    yearMatch,
  };

  let score = calculateWeightedSearchScore(breakdown);

  // Bonus for exact name match
  if (nameMatch >= 1.0) {
    score += 0.2;
  }

  // Bonus for year matching when user searched for a year
  if (yearMatch >= 1.0) {
    score += 0.3;
  }

  return {
    item: game,
    score: Math.min(1.0, score),
    breakdown,
  };
}

/**
 * Searches and ranks games from registry based on fuzzy multi-attribute formula.
 */
export function searchGames(
  query: string,
  games: readonly GameDefinition[],
  platformFilter?: string,
  genreFilter?: string
): SearchResult<GameDefinition>[] {
  const tokens = tokenize(query);

  let filtered = games;
  if (platformFilter && platformFilter !== "all") {
    filtered = filtered.filter((g) => g.platform === platformFilter);
  }
  if (genreFilter && genreFilter !== "all") {
    filtered = filtered.filter((g) => g.genre === genreFilter);
  }

  if (tokens.length === 0) {
    // If empty query, return all matching filters with score 1.0
    return filtered.map((g) => ({
      item: g,
      score: 1.0,
      breakdown: {
        nameMatch: 1.0,
        platformMatch: 1.0,
        genreMatch: 1.0,
        descriptionMatch: 1.0,
        tagMatch: 1.0,
        yearMatch: 1.0,
      },
    }));
  }

  const results = filtered
    .map((game) => rankGame(tokens, game))
    .filter(
      (res) =>
        res.score >= 0.2 ||
        res.breakdown.nameMatch > 0.3 ||
        res.breakdown.yearMatch > 0 ||
        res.breakdown.platformMatch > 0.5 ||
        res.breakdown.genreMatch > 0.5
    )
    .sort((a, b) => b.score - a.score);

  return results;
}
