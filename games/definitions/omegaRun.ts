import { GameDefinition } from "../types";
export const omegaRunDefinition: GameDefinition = {
  id: "omegaRun",
  slug: "omega-run",
  name: "Omega Run",
  platform: "arcade",
  genre: "platformer",
  era: "2000s",
  year: 2024,
  tags: ["runner", "roguelite", "action"],
  tagline: "A roguelite endless runner.",
  description: "Navigate a procedurally generated obstacle field. Speed increases. Score is distance.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "2-10 min",
  thumbnail: { src: "/games/omegaRun/thumb.png", alt: "Omega Run" },
  controls: {
    keyboard: [
      { key: "UP", description: "Jump" },
      { key: "DOWN", description: "Duck" },
      { key: "LEFT / RIGHT", description: "Change lane" }
    ]
  },
  seo: {
    title: "Omega Run Endless Runner",
    description: "Procedurally generated endless runner.",
    keywords: ["endless runner", "action", "platformer"]
  },
  math: {
    title: "Procedural Obstacles",
    summary: "Procedural generation, AABB collision, gravity mechanics.",
    concepts: [
      { name: "AABB Collision", description: "Axis-Aligned Bounding Box" }
    ]
  },
  createGame: async () => {
    const { OmegaRunGame } = await import("../omegaRun/OmegaRunGame");
    return new OmegaRunGame();
  },
};
