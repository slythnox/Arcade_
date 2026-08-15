import type { GameDefinition } from "../types";
export const caveGeneratorDefinition: GameDefinition = {
  id: "caveGenerator",
  slug: "cave-generator",
  name: "Cave Generator",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2012,
  tags: ["procedural", "cellular-automata", "simulation", "caves"],
  tagline: "Watch cellular automata carve organic subterranean caves.",
  description: "Interactive procedural cave generation using B5678/S45678 cellular automata smoothing rules.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/games/caveGenerator/thumb.png", alt: "Cave Generator" },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Regenerate Cave" },
      { key: "← / →", description: "Adjust Initial Fill %" },
      { key: "↑ / ↓", description: "Adjust Smoothing Iterations" },
      { key: "R", description: "Reset Parameters" },
    ],
  },
  seo: {
    title: "Procedural Cave Generator — Cellular Automata Simulation",
    description: "Real-time procedural cave generation simulation powered by cellular automata smoothing.",
    keywords: ["cave generator", "procedural generation", "cellular automata", "simulation"],
  },
  math: {
    title: "Cellular Automata Smoothing Rules",
    summary: "Simulates subterranean rock compaction using Moore neighborhood density thresholds.",
    concepts: [
      {
        name: "B5678/S45678 Automaton Rule",
        description: "Cells become walls if 5 or more neighbors are walls, and survive if 4 or more are walls.",
      },
    ],
  },
  createGame: async () => {
    const { CaveGeneratorGame } = await import("../caveGenerator/CaveGeneratorGame");
    return new CaveGeneratorGame();
  },
};
