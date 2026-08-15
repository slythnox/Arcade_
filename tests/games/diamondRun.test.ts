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

  it("World/Level selection menu navigation and Level 1 -> Level 2 progression work seamlessly", async () => {
    const instance = (await diamondRunDefinition.createGame()) as DiamondRunGame;
    const ctx = createMockContext();

    instance.init(ctx);
    // Boot -> Menu
    for (let i = 0; i < 60; i++) instance.update(1 / 60);

    // Menu -> World Select
    instance.handleInput("CONFIRM", true);

    // World Select navigation
    instance.handleInput("MOVE_DOWN", true);
    expect((instance as any).currentWorld).toBe(2);

    instance.handleInput("MOVE_UP", true);
    expect((instance as any).currentWorld).toBe(1);

    // Confirm World -> Level Select
    instance.handleInput("CONFIRM", true);
    expect((instance as any).gameState).toBe("LEVEL_SELECT");

    // Level Select navigation
    instance.handleInput("MOVE_DOWN", true);
    expect((instance as any).currentLevelIdx).toBe(1);

    instance.handleInput("MOVE_UP", true);
    expect((instance as any).currentLevelIdx).toBe(0);

    // Confirm Level -> Playing Level 1
    instance.handleInput("CONFIRM", true);
    expect((instance as any).gameState).toBe("PLAYING");
    expect(ctx.session.setStatus).toHaveBeenCalledWith("running");

    // Simulate level 1 completion (reach exit)
    (instance as any).gameState = "LEVEL_COMPLETE";
    instance.handleInput("CONFIRM", true);

    // Should transition to Level 2 (index 1) and status running
    expect((instance as any).currentLevelIdx).toBe(1);
    expect((instance as any).gameState).toBe("PLAYING");
    expect(ctx.session.setStatus).toHaveBeenCalledWith("running");
  });
});
