import { GameDefinition } from "../types";

export const starFormationDefinition: GameDefinition = {
  id: "starFormation",
  slug: "starFormation",
  name: "Star Formation",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1981,
  tags: ["shooter", "space", "aliens", "retro"],
  description: "Defend the earth from waves of alien formations. Watch out for aliens breaking formation to dive-bomb your ship.",
  tagline: "Classic space shooting action.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "10 min",
  thumbnail: {
    src: "/games/starFormation/thumb.png",
    alt: "Star Formation",
  },
  controls: {
    keyboard: [
      { key: "A / D / Left / Right", description: "Move Ship" },
      { key: "SPACE", description: "Shoot" },
      { key: "P", description: "Pause / Resume" },
    ],
  },
  seo: {
    title: "Play Star Formation Online - Space Arcade Shooter",
    description: "Blast waves of alien formations in this classic retro space shooter.",
    keywords: ["space shooter", "retro", "arcade", "aliens"],
  },
  math: {
    title: "Curves & Formations",
    summary: "Sine waves and bounding boxes.",
    concepts: [
      {
        name: "Parametric Curves",
        description: "Diving enemies use sine waves to create swooping flight paths.",
      }
    ],
  },
  createGame: async () => {
    const { StarFormationGame } = await import("../starFormation/StarFormationGame");
    return new StarFormationGame();
  },
};
