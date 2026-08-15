import type { GameDefinition } from "../types";
export const dungeonGeneratorDefinition: GameDefinition = {
  id: "dungeonGenerator",
  slug: "dungeon-generator",
  name: "Dungeon Generator",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2014,
  tags: ["procedural", "bsp", "dungeon", "algorithms"],
  tagline: "Procedural dungeon layout generation via Binary Space Partitioning.",
  description: "Interactive Binary Space Partitioning (BSP) algorithm that recursively subdivides space to construct non-overlapping rooms and connecting corridors.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/games/dungeonGenerator/thumb.png", alt: "Dungeon Generator" },
  controls: {
    keyboard: [
      { key: "SPACE / ENTER", description: "Generate New Layout" },
      { key: "R", description: "Reset Seed" },
    ],
  },
  seo: {
    title: "BSP Dungeon Generator — Procedural Roguelike Map Generation",
    description: "Real-time Binary Space Partitioning dungeon generation algorithm visualizer.",
    keywords: ["dungeon generator", "bsp", "procedural generation", "algorithms"],
  },
  math: {
    title: "Binary Space Partitioning (BSP)",
    summary: "Recursively subdivides 2D space into a binary tree of convex sub-spaces.",
    concepts: [
      {
        name: "Recursive Spatial Bisection",
        description: "Partitions bounding regions alternately along horizontal and vertical axes until leaf thresholds are met.",
      },
    ],
  },
  createGame: async () => {
    const { DungeonGeneratorGame } = await import("../dungeonGenerator/DungeonGeneratorGame");
    return new DungeonGeneratorGame();
  },
};
