import type { GameDefinition } from "../types";

export const donkeyClimbDefinition: GameDefinition = {
  id: "donkeyClimb",
  slug: "donkey-climb",
  name: "Donkey Climb",
  platform: "arcade",
  genre: "platformer",
  era: "1980s",
  year: 1981,
  tags: ["platformer", "classic", "jumping", "ape"],
  tagline: "Climb the girders and dodge the barrels!",
  description: "Scale a dangerous construction site to confront the angry ape at the top. Jump over rolling barrels, climb ladders, and grab the power tool to secure victory.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "10-15 min",
  thumbnail: {
    src: "/games/donkeyClimb/thumb.png",
    alt: "Donkey Climb Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← / →", description: "Move Left / Right" },
      { key: "↑ / ↓", description: "Climb Ladder Up / Down" },
      { key: "SPACE", description: "Jump" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
  },
  seo: {
    title: "Play Donkey Climb Online - Retro Arcade Platformer",
    description: "Experience the thrill of dodging barrels and climbing ladders in this retro platformer.",
    keywords: ["donkey climb", "retro platformer", "arcade classic", "jump game"],
  },
  math: {
    title: "Platformer Physics",
    summary: "Simulates gravity, jumping, and collision.",
    concepts: [
      {
        name: "AABB Collision",
        description: "Checking axis-aligned bounding box intersections.",
      },
    ],
  },
  createGame: async () => {
    const { DonkeyClimbGame } = await import("../donkeyClimb/DonkeyClimbGame");
    return new DonkeyClimbGame();
  },
};
