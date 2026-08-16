# Search Engine & Multi-Attribute Ranking

This document describes the client-side search engine, query tokenization, fuzzy Levenshtein similarity, and multi-attribute ranking model implemented in **ARCADE_** (`lib/search/`, `core/algorithms/weightedSearch.ts`).

---

## 1. Search Engine Architecture

The search engine operates entirely in-memory in the browser. It indexes all 61 cartridges with sub-millisecond response times:

```text
User Search Query (e.g. "retro tetrs physics")
                     │
                     ▼
             tokenize(query)
     ["retro", "tetrs", "physics"]
                     │
                     ▼
      Calculate Field Match Scores
   (Name, Platform, Genre, Description, Tags)
                     │
                     ▼
      calculateWeightedSearchScore()
                     │
                     ▼
          Rank & Filter by Score
                     │
                     ▼
             Ranked Results
```

---

## 2. Tokenization & Sanitization (`lib/search/tokenize.ts`)

Queries are cleaned and split into normalized search tokens:
```typescript
export function tokenize(query: string): string[] {
  if (!query) return [];
  return query
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .split(/\s+/)
    .filter((token) => token.length > 0);
}
```

---

## 3. Field Similarity Calculation (`lib/search/similarity.ts`)

Each search token is evaluated against cartridge metadata fields:
1. **Exact String Match:** Returns $1.0$.
2. **Substring Inclusion:** Returns $0.85$.
3. **Fuzzy Levenshtein Similarity:** Words with normalized edit distance similarity $\ge 0.6$ receive a score scaled by $0.8$.

---

## 4. Multi-Attribute Weighted Ranking Formula

The final search score is computed as a weighted linear combination of individual field matches (`core/constants/search.ts`):

$$\text{Score} = w_{\text{name}} S_{\text{name}} + w_{\text{platform}} S_{\text{platform}} + w_{\text{genre}} S_{\text{genre}} + w_{\text{desc}} S_{\text{desc}} + w_{\text{tag}} S_{\text{tag}} + w_{\text{year}} S_{\text{year}}$$

### Centralized Weights (`SEARCH_WEIGHTS`):
- **Name Match ($w_{\text{name}}$):** $0.40$ (Highest priority)
- **Tags Match ($w_{\text{tag}}$):** $0.20$
- **Genre Match ($w_{\text{genre}}$):** $0.15$
- **Platform Match ($w_{\text{platform}}$):** $0.10$
- **Description Match ($w_{\text{desc}}$):** $0.10$
- **Year Match ($w_{\text{year}}$):** $0.05$

### Score Boosts:
- **Exact Name Match:** Adds a $+0.2$ bonus to promote direct title searches to the #1 position.
- **Year Query:** Adds a $+0.3$ bonus when the user searches for a specific era/year (e.g. "1989").
