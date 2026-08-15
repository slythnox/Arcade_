export interface SearchQuery {
  raw: string;
  normalized: string;
  tokens: string[];
  platform?: string;
  genre?: string;
}

export interface SearchScoreBreakdown {
  nameMatch: number;
  platformMatch: number;
  genreMatch: number;
  descriptionMatch: number;
  tagMatch: number;
  yearMatch: number;
}

export interface SearchResult<T> {
  item: T;
  score: number;
  breakdown: SearchScoreBreakdown;
}
