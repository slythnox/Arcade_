import type { GameDefinition } from "../types";
export const colorFloodDefinition: GameDefinition = {
  id: "colorFlood",
  slug: "color-flood",
  name: "Color Flood",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2005,
  tags: ["color", "flood", "puzzle"],
  tagline: "Fill the grid from top-left corner by choosing colors.",
  description: "Each choice flood-fills matching neighbors. Clear board in minimum moves.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "2-5 min",
  thumbnail: { src: "/games/colorFlood/thumb.png", alt: "Color Flood" },
  controls: {
    keyboard: [
      { key: "1-6", description: "Choose Color" }
    ]
  },
  seo: {
    title: "Color Flood Puzzle",
    description: "Flood fill color puzzle game.",
    keywords: ["color flood", "puzzle", "flood fill"]
  },
  math: {
    title: "Flood Fill",
    summary: "Graph connectivity, greedy color selection.",
    concepts: [
      { name: "Flood Fill", description: "Iterative region expansion" }
    ]
  },
  createGame: async () => {
    const { ColorFloodGame } = await import("../colorFlood/ColorFloodGame");
    return new ColorFloodGame();
  },
};
