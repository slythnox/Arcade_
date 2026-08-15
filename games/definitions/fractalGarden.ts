import { GameDefinition } from "../types";
export const fractalGardenDefinition: GameDefinition = {
  id: "fractal-garden",
  slug: "fractal-garden",
  name: "Fractal Garden",
  platform: "arcade",
  genre: "experimental",
  era: "1990s",
  year: 1993,
  tags: ["Fractal", "L-Systems", "Recursion", "Mathematics", "Experimental"],
  tagline: "Cultivate mathematical botanical gardens through recursive L-system branching equations.",
  description:
    "Grow recursive algorithmic fractal trees by tuning branching angles, length scaling, and recursion depth in real time.",
  difficulty: "easy",
  players: "single",
  category: "labs",
  subcategory: "fractals",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/fractal-garden.png",
    alt: "Fractal Garden Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Tune Branching Bifurcation Angle" },
      { key: "↑ ↓ / W S", description: "Scale Recursion Depth (3-9)" },
      { key: "SPACE", description: "Toggle Self-Similarity Scale Ratio" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Drag to adjust branching angles and scale.",
  },
  seo: {
    title: "Fractal Garden — Recursive Mathematical Botanical Simulator",
    description: "Interactive L-system recursive fractal tree generator with harmonic sway physics.",
    keywords: ["fractal garden", "l-systems", "recursive tree", "fractal art", "procedural nature"],
  },
  math: {
    title: "L-Systems & Self-Similar Recursive Geometry",
    summary: "T(x, y, L, \\theta, d) = T(x', y', r L, \\theta - \\Delta\\theta, d-1) \\cup T(x', y', r L, \\theta + \\Delta\\theta, d-1).",
    concepts: [
      { name: "Hausdorff Fractal Dimension", description: "D = \\frac{\\log(N)}{\\log(1/r)} = \\frac{\\log(2)}{\\log(1/0.72)} \\approx 2.11." },
    ],
  },
  createGame: async () => {
    const { FractalGardenGame } = await import("../fractalGarden/FractalGardenGame");
    return new FractalGardenGame();
  },
};
