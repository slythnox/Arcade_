import { describe, it, expect } from "vitest";
import { arcadeRegistry } from "@/games/registry";
import { createMockContext } from "../helpers/mockContext";

const PHYSICS_SUBCATEGORIES = new Set(["physics", "platformer", "simulation", "racing"]);

describe("Physics Safety — 10-second stability for physics/platformer games", () => {
  const physicsGames = arcadeRegistry.filter(g => PHYSICS_SUBCATEGORIES.has(g.subcategory ?? ""));
  
  for (const def of physicsGames) {
    it(`[PHYSICS] ${def.name} — 600 frames stable`, async () => {
      const instance = await def.createGame();
      instance.init(createMockContext());
      
      for (let i = 0; i < 600; i++) {
        instance.update(1 / 60);
      }
      
      // No NaN or Infinity in score/level
      expect(Number.isFinite(instance.getScore())).toBe(true);
      expect(Number.isFinite(instance.getLevel())).toBe(true);
      
      instance.destroy();
    }, 20000);
  }
});
