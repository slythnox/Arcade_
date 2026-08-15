import type { GameDefinition } from "../../games/types";

export const pixelBrawlDefinition: GameDefinition = {
  id: "pixel-brawl",
  slug: "pixel-brawl",
  name: "Pixel Brawl",
  platform: "arcade",
  genre: "fighting",
  era: "1990s",
  year: 1991,
  tags: ["fighting", "2d", "brawler"],
  description: "Street Fighter-inspired 2D fighter.",
  tagline: "Head-to-head arcade fighting.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "fighting",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/placeholder.png", alt: "Pixel Brawl" },
  controls: {
    keyboard: [
      { key: "WASD", description: "Move/Jump/Crouch" },
      { key: "Space", description: "Light Attack" },
      { key: "Enter", description: "Heavy Attack" },
      { key: "Shift", description: "Special" }
    ]
  },
  seo: {
    title: "Pixel Brawl",
    description: "Play Pixel Brawl, a classic 2D fighting game."
  },
  math: {
    title: "Frame Data & AABB",
    summary: "Hitbox detection and animation frame timing.",
    concepts: [
      { name: "AABB", description: "Axis-Aligned Bounding Box" }
    ]
  },
  createGame: async () => {
    const { PixelBrawlGame } = await import("../pixelBrawl/PixelBrawlGame");
    return new PixelBrawlGame();
  }
};
