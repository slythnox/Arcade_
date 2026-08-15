import { describe, it, expect } from "vitest";
import { levenshteinDistance, stringSimilarity } from "../../core/algorithms/levenshtein";
import { findPathBFS } from "../../core/algorithms/bfs";
import { findPathAStar } from "../../core/algorithms/aStar";
import { iterativeFloodFill } from "../../core/algorithms/floodFill";
import { calculateWeightedSearchScore } from "../../core/algorithms/weightedSearch";

describe("Core Algorithms", () => {
  it("Levenshtein and similarity matching", () => {
    expect(levenshteinDistance("tetris", "tetris")).toBe(0);
    expect(levenshteinDistance("tetris", "tetres")).toBe(1);
    expect(stringSimilarity("tetris", "tetris")).toBe(1.0);
    expect(stringSimilarity("tetris", "tetres")).toBeCloseTo(5 / 6);
  });

  it("BFS finds shortest path on grid", () => {
    const start = { col: 0, row: 0 };
    const target = { col: 2, row: 2 };
    const isBlocked = (c: { col: number; row: number }) => c.col === 1 && c.row === 1;

    const path = findPathBFS(start, target, 3, 3, isBlocked);
    expect(path).not.toBeNull();
    expect(path!.length).toBe(4);
    expect(path![path!.length - 1]).toEqual(target);
  });

  it("A* finds shortest path with obstacle avoidance", () => {
    const start = { col: 0, row: 0 };
    const target = { col: 2, row: 0 };
    // Blocked wall at (1, 0)
    const isBlocked = (c: { col: number; row: number }) => c.col === 1 && c.row === 0;

    const path = findPathAStar(start, target, 3, 3, isBlocked);
    expect(path).not.toBeNull();
    expect(path![path!.length - 1]).toEqual(target);
  });

  it("Iterative Flood Fill reveals contiguous matching cells", () => {
    const grid = [
      [0, 0, 1],
      [0, 1, 1],
      [1, 1, 1],
    ];

    const visited: { col: number; row: number }[] = [];
    const filled = iterativeFloodFill(
      { col: 0, row: 0 },
      {
        cols: 3,
        rows: 3,
        isMatch: (c) => grid[c.row][c.col] === 0,
        onVisit: (c) => {
          visited.push(c);
        },
      }
    );

    expect(filled.length).toBe(3);
    expect(visited.length).toBe(3);
  });

  it("Weighted search score calculation", () => {
    const breakdown = {
      nameMatch: 1.0,
      platformMatch: 0.8,
      genreMatch: 0.5,
      descriptionMatch: 0.2,
      tagMatch: 0.9,
      yearMatch: 1.0,
    };
    const score = calculateWeightedSearchScore(breakdown);
    expect(score).toBeCloseTo(0.795);
  });
});
