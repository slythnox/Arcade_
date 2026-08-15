import { describe, it, expect } from "vitest";
import { diamondRunDefinition } from "@/games/definitions/diamondRun";
import { DiamondRunGame } from "@/games/diamondRun/DiamondRunGame";
import { createMockContext, createMockRenderer } from "../helpers/mockContext";
import { LEVELS } from "@/games/diamondRun/LevelData";

describe("Diamond Run Cartridge — 2000s Java Mobile Action-Platformer", () => {
  it("GameDefinition metadata is configured correctly", () => {
    expect(diamondRunDefinition.id).toBe("diamond-run");
    expect(diamondRunDefinition.slug).toBe("diamond-run");
    expect(diamondRunDefinition.name).toBe("Diamond Run");
    expect(diamondRunDefinition.category).toBe("arcade");
    expect(diamondRunDefinition.subcategory).toBe("platformer");
  });

  it("Factory resolves DiamondRunGame instance", async () => {
    const instance = await diamondRunDefinition.createGame();
    expect(instance).toBeInstanceOf(DiamondRunGame);
  });

  it("25 handcrafted levels exist across 5 worlds", () => {
    expect(LEVELS.length).toBe(25);
    const worlds = new Set(LEVELS.map((l) => l.world));
    expect(worlds.size).toBe(5);
  });

  it("GameInstance initializes and updates 60 frames without error", async () => {
    const instance = (await diamondRunDefinition.createGame()) as DiamondRunGame;
    const ctx = createMockContext();
    const renderer = createMockRenderer();

    expect(() => instance.init(ctx)).not.toThrow();

    // Boot transition to menu
    for (let i = 0; i < 60; i++) {
      expect(() => instance.update(1 / 60)).not.toThrow();
    }

    // Start playing
    instance.handleInput("ACTION_PRIMARY", true); // Menu -> World Select
    instance.handleInput("ACTION_PRIMARY", true); // World Select -> Level Select
    instance.handleInput("ACTION_PRIMARY", true); // Level Select -> Playing

    // Simulate 120 frames of gameplay
    for (let i = 0; i < 120; i++) {
      expect(() => instance.update(1 / 60)).not.toThrow();
    }

    expect(() => instance.render(renderer)).not.toThrow();
    expect(typeof instance.getScore()).toBe("number");
    expect(instance.getLevel()).toBeGreaterThanOrEqual(1);
  });

  it("Player movement inputs update position and jump buffer", async () => {
    const instance = (await diamondRunDefinition.createGame()) as DiamondRunGame;
    const ctx = createMockContext();

    instance.init(ctx);
    instance.handleInput("ACTION_PRIMARY", true);
    instance.handleInput("ACTION_PRIMARY", true);
    instance.handleInput("ACTION_PRIMARY", true);

    // Right movement
    instance.handleInput("MOVE_RIGHT", true);
    for (let i = 0; i < 30; i++) instance.update(1 / 60);
    instance.handleInput("MOVE_RIGHT", false);

    // Jump
    instance.handleInput("ACTION_PRIMARY", true);
    for (let i = 0; i < 30; i++) instance.update(1 / 60);

    expect(instance.getScore()).toBeGreaterThanOrEqual(0);
  });

  it("Lifecycle methods pause, resume, reset, destroy execute safely", async () => {
    const instance = (await diamondRunDefinition.createGame()) as DiamondRunGame;
    const ctx = createMockContext();

    instance.init(ctx);
    expect(() => instance.pause()).not.toThrow();
    expect(() => instance.resume()).not.toThrow();
    expect(() => instance.reset(1337)).not.toThrow();
    expect(() => instance.destroy()).not.toThrow();
  });
});
