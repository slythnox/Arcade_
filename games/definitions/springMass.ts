import { GameDefinition } from "../types";
import { SpringMassGame } from "../springMass/SpringMassGame";

export const springMassDefinition: GameDefinition = {
  id: "springMass",
  slug: "spring-mass",
  name: "Spring Mass System",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2005,
  tags: ["physics", "simulation", "verlet", "springs"],
  tagline: "Interactive physics playground using Verlet integration.",
  description: "Connect masses with springs and watch them simulate soft body dynamics.",
  difficulty: "easy",
  players: "single",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/games/springMass/thumb.png", alt: "Spring Mass System" },
  controls: {
    keyboard: [
      { key: "R", description: "Reset" },
      { key: "SPACE", description: "Add random connected mass" },
    ],
    touch: "Drag to move nearest mass",
  },
  seo: {
    title: "Spring Mass System Simulator",
    description: "Interactive 2D physics simulation with springs, masses, and Verlet integration.",
    keywords: ["physics", "spring", "mass", "simulation"],
  },
  math: {
    title: "Hooke's Law & Verlet Integration",
    summary: "Simulates elastic spring forces and damped harmonic motion.",
    concepts: [
      {
        name: "Hooke's Law",
        description: "F = -k * (|x| - L0) * normalize(x)",
      },
    ],
  },
  createGame: () => new SpringMassGame(),
};
