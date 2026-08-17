import type { GameDefinition } from "../types";

export const bombGridDefinition: GameDefinition = {
  id: "bombGrid",
  slug: "bomb-grid",
  name: "Bomb Grid",
  platform: "nes",
  genre: "action",
  era: "1980s",
  year: 1983,
  tags: ["bomb", "maze", "action", "retro"],
  description: "Place bombs to blast crates, find power-ups, and defeat enemies. Don't get caught in the blast!",
  tagline: "Explosive maze action.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "15 min",
  thumbnail: {
    src: "/games/bombGrid/thumb.png",
    alt: "Bomb Grid",
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrows", description: "Move Player" },
      { key: "SPACE / X", description: "Place Bomb" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Use left directional dial to run through alleys, tap right A button to drop bomb.",
    gamepad: "D-pad to move, A button to drop bomb."
  },
  seo: {
    title: "Play Bomb Grid Online - Retro Explosive Action",
    description: "Blast your way through the maze, collect power-ups, and destroy enemies in this classic arcade bomber.",
    keywords: ["bomb", "maze", "retro", "arcade", "action"],
  },
  math: {
    title: "Grid Raycasting",
    summary: "Bomb blasts expand outwards until they hit solid walls.",
    concepts: [
      {
        name: "Orthogonal Traversal",
        description: "Checking cells in 4 cardinal directions up to a blast radius limit.",
      }
    ],
  },
  createGame: async () => {
    const { BombGridGame } = await import("../bombGrid/BombGridGame");
    return new BombGridGame();
  },
};
