import type { GameDefinition } from "../types";

export const roadHopperDefinition: GameDefinition = {
  id: "roadHopper",
  slug: "roadHopper",
  name: "Road Hopper",
  platform: "arcade",
  genre: "action",
  era: "1980s",
  year: 1981,
  tags: ["frog", "hop", "traffic", "retro"],
  description: "Navigate through hazardous traffic and dangerous rivers to reach the lilypad goal. Time your hops perfectly to survive.",
  tagline: "Hop across the perilous road.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "5 min",
  thumbnail: {
    src: "/games/roadHopper/thumb.png",
    alt: "Road Hopper",
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrows", description: "Hop" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
  },
  seo: {
    title: "Play Road Hopper Online - Hop Across the Traffic",
    description: "Classic grid-based hopping game. Avoid cars, ride the logs, and cross the river safely.",
    keywords: ["retro", "arcade", "hop", "traffic", "classic"],
  },
  math: {
    title: "Grid Mathematics",
    summary: "Grid alignment and linear velocity simulation for hazards.",
    concepts: [
      {
        name: "Linear Interpolation",
        description: "Moving cars and logs at constant velocity across a discrete grid layout.",
      }
    ],
  },
  createGame: async () => {
    const { RoadHopperGame } = await import("../roadHopper/RoadHopperGame");
    return new RoadHopperGame();
  },
};
