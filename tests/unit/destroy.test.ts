import { describe, it, expect } from "vitest";
import { gameRegistry } from "@/games/registry";
import { createMockContext, createMockRenderer } from "../helpers/mockContext";

// Test the top 10 largest games by name (the ones most likely to have leaks)
const AUDIT_GAMES = [
  "maze-chaser", "pixel-quest", "monster-arena",
  "pixel-brawl", "ray-sector", "pixel-circuit", "garden-defense",
  "bomb-grid", "star-formation",
];

describe("Destroy Cleanup Audit", () => {
  for (const slug of AUDIT_GAMES) {
    const def = gameRegistry.find(g => g.slug === slug);
    if (!def) continue;
    
    it(`${def.name} — destroy() allows clean re-initialization`, async () => {
      const renderer = createMockRenderer();
      
      // First lifecycle
      const instance1 = await def.createGame();
      instance1.init(createMockContext());
      for (let i = 0; i < 30; i++) instance1.update(1/60);
      instance1.render(renderer);
      expect(() => instance1.destroy()).not.toThrow();
      
      // Second lifecycle — re-init after destroy must work cleanly
      const instance2 = await def.createGame();
      expect(() => instance2.init(createMockContext())).not.toThrow();
      for (let i = 0; i < 10; i++) {
        expect(() => instance2.update(1/60)).not.toThrow();
      }
      expect(Number.isFinite(instance2.getScore())).toBe(true);
      expect(() => instance2.destroy()).not.toThrow();
    }, 15000);
  }
  
  it("Reset after 60 frames produces finite state", async () => {
    const def = gameRegistry.find(g => g.slug === "tetris")!;
    const instance = await def.createGame();
    instance.init(createMockContext());
    for (let i = 0; i < 60; i++) instance.update(1/60);
    const scoreBefore = instance.getScore();
    instance.reset();
    const scoreAfter = instance.getScore();
    // Score should reset to 0 or lower than before (varies by game)
    expect(Number.isFinite(scoreAfter)).toBe(true);
    expect(scoreAfter).toBeLessThanOrEqual(scoreBefore);
    instance.destroy();
  });
});
