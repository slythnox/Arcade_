import { describe, it, expect } from "vitest";
import { searchGames } from "../../lib/search/searchGames";
import type { GameDefinition } from "../../games/types";

describe("searchGames", () => {
  const games: GameDefinition[] = [
    { id: "tetris", name: "Tetris", description: "Falling blocks", genre: "puzzle", platform: "arcade", tagline: "A classic", tags: ["blocks"], year: 1984, controls: {} } as any,
    { id: "snake", name: "Snake", description: "Eat apples", genre: "arcade", platform: "mobile", tagline: "Grow", tags: ["reptile"], year: 1997, controls: {} } as any,
    { id: "asteroids", name: "Asteroids", description: "Shoot rocks", genre: "physics", platform: "arcade", tagline: "Space", tags: ["space"], year: 1979, controls: {} } as any,
  ];

  it("empty query returns all games", () => {
    const res = searchGames("", games);
    expect(res.length).toBe(3);
    expect(res[0].item.id).toBe("tetris"); // maintains order
  });

  it("exact match for 'tetris' returns tetris first", () => {
    const res = searchGames("tetris", games);
    expect(res[0].item.id).toBe("tetris");
  });

  it("typo 'tetrs' still returns tetris", () => {
    const res = searchGames("tetrs", games);
    expect(res[0].item.id).toBe("tetris");
  });

  it("genre filter 'physics' returns only physics games", () => {
    const res = searchGames("", games, "all", "physics");
    expect(res.length).toBe(1);
    expect(res[0].item.id).toBe("asteroids");
  });

  it("nonsense query returns no results", () => {
    const res = searchGames("xyzqwerty123", games);
    expect(res.length).toBe(0);
  });
});
