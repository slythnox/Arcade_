import type { GameDefinition } from "../types";
export const twentyFortyEightDefinition: GameDefinition = {
  id: "2048",
  slug: "2048",
  name: "2048",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2014,
  tags: ["2048", "Sliding", "Math", "Merge", "Puzzle"],
  tagline: "Slide matching numbered tiles across a 4x4 matrix to create the 2048 tile.",
  description:
    "Combine equal numbered tiles using four-directional slides to multiply values up to 2048.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/2048.png",
    alt: "2048 Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Slide All Tiles" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Swipe in any direction to slide tiles.",
  },
  seo: {
    title: "2048 — Sliding Tile Math Puzzle",
    description: "Play 2048 puzzle game with tile merging and exponential power-of-two scoring.",
    keywords: ["2048", "tile merge", "math puzzle", "sliding game"],
  },
  math: {
    title: "Exponential Matrix Merging & Monotonicity",
    summary: "Matrix row/column compression, pair-wise equality condensation, and exponential powers of 2.",
    concepts: [
      { name: "Binary Condensation", description: "x_i = x_{i+1} \\implies x_i' = 2x_i, \\text{Score} += 2x_i." },
      { name: "Monotonicity Heuristic", description: "\\sum |M_{i,j} - M_{i,j+1}|." },
    ],
  },
  createGame: async () => {
    const { TwentyFortyEightGame } = await import("../twentyFortyEight/TwentyFortyEightGame");
    return new TwentyFortyEightGame();
  },
};
