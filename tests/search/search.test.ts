import { describe, it, expect } from "vitest";
import { searchGames } from "../../lib/search/searchGames";
import { gameRegistry } from "../../games/registry";

describe("Intelligent Search Engine", () => {
  it("Finds exact match with highest score", () => {
    const results = searchGames("tetris", gameRegistry);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.id).toBe("tetris");
    expect(results[0].score).toBeGreaterThan(0.4);
  });

  it("Fuzzy typo tolerance for 'tetres' and 'tetirs'", () => {
    const resultsTetres = searchGames("tetres", gameRegistry);
    expect(resultsTetres.length).toBeGreaterThan(0);
    expect(resultsTetres[0].item.id).toBe("tetris");

    const resultsTetirs = searchGames("tetirs", gameRegistry);
    expect(resultsTetirs.length).toBeGreaterThan(0);
    expect(resultsTetirs[0].item.id).toBe("tetris");
  });

  it("Multi-token search: 'tetris gameboy puzzle'", () => {
    const results = searchGames("tetris gameboy puzzle", gameRegistry);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].item.id).toBe("tetris");
    // High score across name, platform, and genre matches
    expect(results[0].score).toBeGreaterThan(0.5);
  });

  it("Finds games by release year: '1989'", () => {
    const results = searchGames("1989", gameRegistry);
    const ids = results.map((r) => r.item.id);
    expect(ids).toContain("tetris");
    expect(ids).toContain("minesweeper");
  });

  it("Fuzzy match for 'snak' and 'break'", () => {
    const resultsSnake = searchGames("snak", gameRegistry);
    expect(resultsSnake[0].item.id).toBe("snake");

    const resultsBreak = searchGames("break", gameRegistry);
    expect(resultsBreak[0].item.id).toBe("breakout");
  });

  it("Platform filter filtering", () => {
    const results = searchGames("", gameRegistry, "gameboy");
    expect(results.every((r) => r.item.platform === "gameboy")).toBe(true);
    expect(results.some((r) => r.item.id === "tetris")).toBe(true);
  });
});
