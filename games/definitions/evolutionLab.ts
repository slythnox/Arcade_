import { GameDefinition } from "../types";
export const evolutionLabDefinition: GameDefinition = {
  id: "evolutionLab",
  slug: "evolution-lab",
  name: "Evolution Lab",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2006,
  tags: ["genetic-algorithms", "ai", "evolution", "simulation"],
  tagline: "Natural selection and genetic algorithm agent steering.",
  description: "Autonomous agents evolve locomotion sequences over successive generations through tournament selection, crossover, and mutation.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/games/evolutionLab/thumb.png", alt: "Evolution Lab" },
  controls: {
    keyboard: [
      { key: "R", description: "Reset Evolution" },
    ],
  },
  seo: {
    title: "Evolution Lab — Genetic Algorithms Simulation",
    description: "Interactive genetic algorithm simulation demonstrating natural selection and gene crossover.",
    keywords: ["genetic algorithm", "evolution", "ai simulation", "natural selection"],
  },
  math: {
    title: "Genetic Operators & Fitness Functions",
    summary: "Simulates evolutionary adaptation through genotype-phenotype mappings.",
    concepts: [
      {
        name: "Fitness Proportional Selection",
        description: "Fitness f(agent) = 1 / (distance(agent, target)^2 + 1) driving tournament selection.",
      },
    ],
  },
  createGame: async () => {
    const { EvolutionLabGame } = await import("../evolutionLab/EvolutionLabGame");
    return new EvolutionLabGame();
  },
};
