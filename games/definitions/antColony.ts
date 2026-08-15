import { GameDefinition } from "../types";
import { AntColonyGame } from "../antColony/AntColonyGame";

export const antColonyDefinition: GameDefinition = {
  id: "antColony",
  slug: "ant-colony",
  name: "Ant Colony",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2005,
  tags: ["ants", "swarm", "simulation", "emergent"],
  tagline: "Pheromone-based swarm intelligence.",
  description: "Ants leave pheromone trails. Other ants follow them. Food gets found and carried back emergently.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-10 min",
  thumbnail: { src: "/games/antColony/thumb.png", alt: "Ant Colony" },
  controls: {
    keyboard: [{ key: "Any", description: "Observe" }]
  },
  seo: {
    title: "Ant Colony Simulation",
    description: "Watch ants collect food using pheromone trails.",
    keywords: ["ant colony", "simulation", "swarm intelligence"]
  },
  math: {
    title: "Swarm Intelligence",
    summary: "Emergent behavior from simple rules.",
    concepts: [
      { name: "Stigmergy", description: "Gradient following, pheromone diffusion" }
    ]
  },
  createGame: () => new AntColonyGame(),
};
