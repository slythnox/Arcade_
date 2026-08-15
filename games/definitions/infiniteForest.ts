import { GameDefinition } from "../types";
import { InfiniteForestGame } from "../infiniteForest/InfiniteForestGame";

export const infiniteForestDefinition: GameDefinition = {
  id: "infiniteForest",
  slug: "infinite-forest",
  name: "Infinite Forest",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2023,
  tags: ["procedural", "relaxation", "art"],
  tagline: "Scroll through an infinite procedurally generated terrain.",
  description: "Trees, hills, and clouds generated via layered noise. Serene visualization.",
  difficulty: "easy",
  players: "single",
  estimatedPlayTime: "Infinite",
  thumbnail: { src: "/games/infiniteForest/thumb.png", alt: "Infinite Forest" },
  controls: {
    keyboard: [
      { key: "LEFT / RIGHT", description: "Adjust scroll speed" }
    ]
  },
  seo: {
    title: "Infinite Forest",
    description: "Procedurally generated forest visualization.",
    keywords: ["procedural", "noise", "forest"]
  },
  math: {
    title: "Procedural Noise",
    summary: "Fractal terrain, layered noise functions.",
    concepts: [
      { name: "Value Noise", description: "1D/2D noise for natural variation" }
    ]
  },
  createGame: () => new InfiniteForestGame(),
};
