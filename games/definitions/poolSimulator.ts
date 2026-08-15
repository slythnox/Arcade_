import type { GameDefinition } from "../types";
export const poolSimulatorDefinition: GameDefinition = {
  id: "poolSimulator",
  slug: "pool-simulator",
  name: "Pool Simulator",
  platform: "arcade",
  genre: "experimental",
  era: "1990s",
  year: 1995,
  tags: ["sports", "billiards", "physics"],
  tagline: "2D billiards physics.",
  description: "Elastic collisions between balls. Friction. Pocket detection. Play a simplified 8-ball.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "simulation",
  estimatedPlayTime: "5-15 min",
  thumbnail: { src: "/games/poolSimulator/thumb.png", alt: "Pool Simulator" },
  controls: {
    keyboard: [
      { key: "Arrows", description: "Aim" },
      { key: "Z", description: "Power" },
      { key: "X", description: "Shoot" }
    ]
  },
  seo: {
    title: "Pool Simulator",
    description: "2D billiards game with realistic physics.",
    keywords: ["pool", "billiards", "physics"]
  },
  math: {
    title: "Elastic Collisions",
    summary: "Momentum conservation, friction deceleration.",
    concepts: [
      { name: "Vector Reflection", description: "Wall bounce and ball collision" }
    ]
  },
  createGame: async () => {
    const { PoolSimulatorGame } = await import("../poolSimulator/PoolSimulatorGame");
    return new PoolSimulatorGame();
  },
};
