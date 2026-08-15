import { GameDefinition } from "../types";
export const lightsOutDefinition: GameDefinition = {
  id: "lights-out",
  slug: "lights-out",
  name: "Lights Out",
  platform: "handheld",
  genre: "puzzle",
  era: "1990s",
  year: 1995,
  tags: ["Lights Out", "Matrix", "Linear Algebra", "GF2", "Puzzle"],
  tagline: "Toggle lights to deactivate all cells in the 5x5 matrix.",
  description:
    "Solve the classic electronic puzzle where pressing any button toggles both it and its adjacent neighbors.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/lights-out.png",
    alt: "Lights Out Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate Matrix Cursor" },
      { key: "SPACE / Z", description: "Toggle Light & Neighbors" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any tile to toggle its state.",
  },
  seo: {
    title: "Lights Out — Boolean Linear Algebra Puzzle",
    description: "Classic 1995 Lights Out puzzle game featuring matrix XOR toggle operations.",
    keywords: ["lights out", "matrix puzzle", "boolean logic", "linear algebra game"],
  },
  math: {
    title: "Linear Algebra over GF(2)",
    summary: "Matrix system Ax = b over the Galois field GF(2) with modulo-2 addition (XOR).",
    concepts: [
      { name: "Galois Field GF(2)", description: "A \\cdot x \\equiv b \\pmod 2." },
      { name: "Neighborhood Inversion", description: "M_{i,j}' = M_{i,j} \\oplus 1, \\forall (i,j) \\in N(c)." },
    ],
  },
  createGame: async () => {
    const { LightsOutGame } = await import("../lightsOut/LightsOutGame");
    return new LightsOutGame();
  },
};
