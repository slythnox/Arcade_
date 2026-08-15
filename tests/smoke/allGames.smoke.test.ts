import { describe, it, expect } from "vitest";
import { arcadeRegistry } from "@/games/registry";
import { createMockContext, createMockRenderer } from "../helpers/mockContext";

describe("Arcade Game Smoke Tests — every cartridge must survive the gauntlet", () => {
  for (const def of arcadeRegistry) {
    it(`[SMOKE] ${def.name} (${def.slug})`, async () => {
      // 1. Factory must resolve
      let instance: any;
      expect(async () => {
        instance = await def.createGame();
      }).not.toThrow();
      instance = await def.createGame();
      expect(instance).toBeTruthy();
      
      // 2. init must not throw
      const ctx = createMockContext();
      const renderer = createMockRenderer();
      expect(() => instance.init(ctx)).not.toThrow();
      
      // 3. Simulate 60 frames (1 second of gameplay)
      for (let i = 0; i < 60; i++) {
        expect(() => instance.update(1 / 60)).not.toThrow();
      }
      
      // 4. render must not throw
      expect(() => instance.render(renderer)).not.toThrow();
      
      // 5. Score and level must be finite numbers
      expect(typeof instance.getScore()).toBe("number");
      expect(Number.isFinite(instance.getScore())).toBe(true);
      expect(typeof instance.getLevel()).toBe("number");
      expect(instance.getLevel()).toBeGreaterThanOrEqual(1);
      
      // 6. Lifecycle methods must not throw
      expect(() => instance.pause()).not.toThrow();
      expect(() => instance.resume()).not.toThrow();
      expect(() => instance.reset()).not.toThrow();
      
      // 7. 10 more frames after reset
      for (let i = 0; i < 10; i++) {
        expect(() => instance.update(1 / 60)).not.toThrow();
      }
      
      // 8. destroy must not throw
      expect(() => instance.destroy()).not.toThrow();
    }, 10000); // 10 second timeout per game
  }
});
