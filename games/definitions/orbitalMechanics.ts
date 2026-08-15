import type { GameDefinition } from "../types";
export const orbitalMechanicsDefinition: GameDefinition = {
  id: "orbitalMechanics",
  slug: "orbital-mechanics",
  name: "Orbital Mechanics",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2015,
  tags: ["space", "physics", "orbit"],
  tagline: "Simulate a satellite orbiting a planet.",
  description: "Add thrust to adjust orbit. Achieve target orbit altitude. Real gravitational physics.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "10-20 min",
  thumbnail: { src: "/games/orbitalMechanics/thumb.png", alt: "Orbital Mechanics" },
  controls: {
    keyboard: [
      { key: "UP", description: "Prograde burn" },
      { key: "DOWN", description: "Retrograde burn" }
    ]
  },
  seo: {
    title: "Orbital Mechanics",
    description: "Real gravitational physics satellite simulation.",
    keywords: ["orbit", "physics", "space"]
  },
  math: {
    title: "Gravitational Physics",
    summary: "Gravitational law, numerical integration, orbital mechanics.",
    concepts: [
      { name: "Numerical Integration", description: "Runge-Kutta or Euler integration" }
    ]
  },
  createGame: async () => {
    const { OrbitalMechanicsGame } = await import("../orbitalMechanics/OrbitalMechanicsGame");
    return new OrbitalMechanicsGame();
  },
};
