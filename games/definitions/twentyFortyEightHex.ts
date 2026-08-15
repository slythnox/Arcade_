import type { GameDefinition } from "../types";
export const twentyFortyEightHexDefinition: GameDefinition = {
  id: "2048-hex",
  slug: "2048-hex",
  name: "2048 Hex",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2014,
  tags: ["2048", "Hex", "Matrix", "Merge", "Puzzle"],
  tagline: "Expanded 5x5 matrix variant of the classic power-of-two number merge.",
  description:
    "Merge equal numbers across an expanded 5x5 lattice matrix to achieve maximum combinatorial values.",
  difficulty: "hard",
  players: "single",
  category: "labs",
  subcategory: "experimental",
  estimatedPlayTime: "10-20 min",
  thumbnail: {
    src: "/assets/thumbnails/2048-hex.png",
    alt: "2048 Hex Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Slide Matrix Across Axes" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Swipe to slide tiles across grid.",
  },
  seo: {
    title: "2048 Hex — 5x5 Matrix Power-of-Two Tile Merge",
    description: "Expanded matrix number merge puzzle game.",
    keywords: ["2048 hex", "matrix puzzle", "power of two", "math merge"],
  },
  math: {
    title: "High-Dimensional Matrix Merging",
    summary: "Combinatorial tile merging over N-dimensional lattice coordinates.",
    concepts: [
      { name: "Exponential Value Scale", description: "V_k = 2^k, \\text{with logarithmic scoring}." },
    ],
  },
  createGame: async () => {
    const { TwentyFortyEightHexGame } = await import("../twentyFortyEightHex/TwentyFortyEightHexGame");
    return new TwentyFortyEightHexGame();
  },
};
