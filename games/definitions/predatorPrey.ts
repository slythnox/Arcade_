import type { GameDefinition } from "../types";
export const predatorPreyDefinition: GameDefinition = {
  id: "predatorPrey",
  slug: "predator-prey",
  name: "Predator Prey",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2004,
  tags: ["boids", "simulation", "steering", "ai", "ecosystem"],
  tagline: "Craig Reynolds boid steering behaviors and predator-prey dynamics.",
  description: "Emergent artificial life ecosystem featuring flocking prey agents that separate, align, cohere, and evade pursuit predators.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/games/predatorPrey/thumb.png", alt: "Predator Prey" },
  controls: {
    keyboard: [
      { key: "R", description: "Reset Ecosystem" },
    ],
  },
  seo: {
    title: "Predator Prey Simulation — Boid Flocking & Artificial Life",
    description: "Real-time boid flocking and predator pursuit simulation built on autonomous steering vectors.",
    keywords: ["boids", "steering behaviors", "artificial life", "simulation"],
  },
  math: {
    title: "Craig Reynolds Autonomous Agent Steering",
    summary: "Combines separation, alignment, cohesion, and pursuit force vectors.",
    concepts: [
      {
        name: "Three Reynolds Flocking Rules",
        description: "F_total = w1*F_separation + w2*F_alignment + w3*F_cohesion + w4*F_evade.",
      },
    ],
  },
  createGame: async () => {
    const { PredatorPreyGame } = await import("../predatorPrey/PredatorPreyGame");
    return new PredatorPreyGame();
  },
};
