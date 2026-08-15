import { GameDefinition } from "../types";
export const circlePackingLabDefinition: GameDefinition = {
  id: "circlePackingLab",
  slug: "circle-packing-lab",
  name: "Circle Packing Lab",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2016,
  tags: ["geometry", "physics", "simulation"],
  tagline: "Watch circles pack into a container.",
  description: "Add circles, watch them find optimal positions. Beautiful emergent geometry.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "Infinite",
  thumbnail: { src: "/games/circlePackingLab/thumb.png", alt: "Circle Packing" },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Add circle" },
      { key: "Z", description: "Add 5" },
      { key: "R", description: "Clear" }
    ]
  },
  seo: {
    title: "Circle Packing Lab",
    description: "Circle packing physics simulation.",
    keywords: ["circle packing", "geometry", "simulation"]
  },
  math: {
    title: "Circle Packing",
    summary: "Collision response, physics settlement, Apollonian gasket inspiration.",
    concepts: [
      { name: "Collision Response", description: "Push apart overlapping circles" }
    ]
  },
  createGame: async () => {
    const { CirclePackingLabGame } = await import("../circlePackingLab/CirclePackingLabGame");
    return new CirclePackingLabGame();
  },
};
