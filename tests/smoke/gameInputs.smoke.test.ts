import { describe, it, expect } from "vitest";
import { arcadeRegistry } from "@/games/registry";
import { createMockContext, createMockRenderer } from "../helpers/mockContext";
import type { GameAction } from "@/core/types/game";

// ALL valid GameAction values
const ALL_ACTIONS: GameAction[] = [
  "MOVE_LEFT",
  "MOVE_RIGHT",
  "MOVE_UP",
  "MOVE_DOWN",
  "ROTATE",
  "ACTION_PRIMARY",
  "ACTION_SECONDARY",
  "PAUSE",
  "RESTART",
  "CONFIRM",
  "BACK"
];

describe("Input Safety — no crash or NaN on any input", () => {
  for (const def of arcadeRegistry) {
    it(`[INPUT] ${def.name} handles all GameActions without crash`, async () => {
      const instance = await def.createGame();
      const ctx = createMockContext();
      const renderer = createMockRenderer();
      
      instance.init(ctx);
      
      // Warm up 5 frames
      for (let i = 0; i < 5; i++) instance.update(1 / 60);
      
      // Inject every action
      for (const action of ALL_ACTIONS) {
        expect(() => instance.handleInput(action, true)).not.toThrow();
        instance.update(1 / 60);
        instance.update(1 / 60);
        expect(() => instance.handleInput(action, false)).not.toThrow();
      }
      
      // Run 10 more frames
      for (let i = 0; i < 10; i++) {
        expect(() => instance.update(1 / 60)).not.toThrow();
      }
      
      instance.render(renderer);
      
      // Verify no NaN escaped into public state
      expect(Number.isFinite(instance.getScore())).toBe(true);
      expect(Number.isFinite(instance.getLevel())).toBe(true);
      if (instance.getLives) {
        const lives = instance.getLives();
        if (lives !== undefined) expect(Number.isFinite(lives)).toBe(true);
      }
      
      instance.destroy();
    }, 15000);
  }
});
