import type { GameDefinition } from "../types";
export const sokobanDefinition: GameDefinition = {
  id: "sokoban",
  slug: "sokoban",
  name: "Sokoban",
  platform: "arcade",
  genre: "puzzle",
  era: "1980s",
  year: 1982,
  tags: ["sokoban", "puzzle", "classic", "grid", "push"],
  tagline: "The legendary warehouse box-pushing planning puzzle.",
  description: "Push all cargo crates onto the target docks with finite moves, spatial forward-planning, and complete state undo capabilities.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "10 min",
  thumbnail: { src: "/games/sokoban/thumb.png", alt: "Sokoban" },
  controls: {
    keyboard: [
      { key: "ARROWS", description: "Move & Push Box" },
      { key: "Z / SHIFT", description: "Undo Last Move" },
      { key: "R", description: "Restart Level" },
    ],
  },
  seo: {
    title: "Sokoban — Classic Box Pushing Warehouse Puzzle",
    description: "Play classic Sokoban in-browser with multi-level layouts and full state-undo history.",
    keywords: ["sokoban", "box pushing", "warehouse puzzle", "retro puzzle"],
  },
  math: {
    title: "State-Space Search & Deadlock Detection",
    summary: "Formalizes box-pushing permutations as PSPACE-complete discrete graph traversals.",
    concepts: [
      {
        name: "Deadlock Configuration Pruning",
        description: "Detects non-recoverable 2x2 box corners and wall-adjacent deadlock topologies.",
      },
    ],
  },
  createGame: async () => {
    const { SokobanGame } = await import("../sokoban/SokobanGame");
    return new SokobanGame();
  },
};
