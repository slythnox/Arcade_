import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { arcadeRegistry, getGameBySlug, getGameById } from "@/games/registry";
import { GameIllustration } from "@/components/arcade/GameIllustration";

describe("Catalog Consistency Audit — all 60 games verified", () => {
  it("Registry contains exactly 60 games with unique IDs and slugs", () => {
    expect(arcadeRegistry.length).toBe(60);

    const ids = new Set<string>();
    const slugs = new Set<string>();

    for (const game of arcadeRegistry) {
      expect(ids.has(game.id)).toBe(false);
      expect(slugs.has(game.slug)).toBe(false);
      ids.add(game.id);
      slugs.add(game.slug);

      // Verify getters
      expect(getGameById(game.id)).toBeDefined();
      expect(getGameBySlug(game.slug)).toBeDefined();
    }
  });

  for (const game of arcadeRegistry) {
    it(`[METADATA] ${game.name} (${game.slug}) has valid controls, description and math`, () => {
      // 1. Name & Descriptions
      expect(game.name.trim().length).toBeGreaterThan(1);
      expect(game.description.trim().length).toBeGreaterThan(15);
      expect(game.tagline.trim().length).toBeGreaterThan(5);

      // 2. Controls
      expect(game.controls).toBeDefined();
      expect(Array.isArray(game.controls.keyboard)).toBe(true);
      expect(game.controls.keyboard.length).toBeGreaterThan(0);
      for (const kb of game.controls.keyboard) {
        expect(kb.key).toBeTruthy();
        expect(kb.description).toBeTruthy();
      }
      expect(typeof game.controls.touch).toBe("string");
      expect(game.controls.touch?.trim().length).toBeGreaterThan(5);

      // 3. Mathematical model
      expect(game.math).toBeDefined();
      expect(game.math.title).toBeTruthy();
      expect(game.math.summary).toBeTruthy();
      expect(Array.isArray(game.math.concepts)).toBe(true);
      expect(game.math.concepts.length).toBeGreaterThan(0);

      // 4. SEO
      expect(game.seo).toBeDefined();
      expect(game.seo.title).toBeTruthy();
      expect(game.seo.description).toBeTruthy();
    });

    it(`[LOGO / ILLUSTRATION] ${game.name} (${game.slug}) renders dedicated non-default pixel artwork`, () => {
      const htmlSlug = renderToStaticMarkup(React.createElement(GameIllustration, { game }));
      // Default fallback has stroke={theme.primary} and height="10" inside <rect x="8" y="7" width="14" height="10" fill={theme.secondary} />
      expect(htmlSlug.includes('width="14" height="10"')).toBe(false);
    });
  }
});
