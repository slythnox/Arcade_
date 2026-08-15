/**
 * Normalizes and tokenizes a search query string into clean keywords.
 */
export function tokenize(query: string): string[] {
  if (!query) return [];

  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}
