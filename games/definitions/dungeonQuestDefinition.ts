import type { GameDefinition } from "../types";

export const dungeonQuestDefinition: GameDefinition = {
  id: "dungeon-quest",
  slug: "dungeon-quest",
  name: "Dungeon Quest",
  platform: "nes",
  genre: "rpg",
  era: "1980s",
  year: 1986,
  tags: ["adventure", "top-down", "dungeon", "action-rpg"],
  tagline: "A top-down action adventure with puzzles and dungeons.",
  description:
    "Explore the Overworld, solve puzzles in 3 Temples, and defeat challenging bosses in this top-down action adventure.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "rpg",
  estimatedPlayTime: "20-45 min",
  thumbnail: {
    src: "/games/dungeonQuest/thumb.png",
    alt: "Dungeon Quest Cartridge",
  },
  controls: {
    keyboard: [
      { key: "W / A / S / D", description: "Move (tile-by-tile)" },
      { key: "SPACE", description: "Sword Attack" },
      { key: "SHIFT / Z", description: "Use Item" },
    ],
  },
  seo: {
    title: "Play Dungeon Quest — Classic Top-Down Adventure",
    description: "Embark on an epic quest through dungeons, puzzles, and boss fights.",
  },
  math: {
    title: "Grid Mechanics",
    summary: "Movement and collisions operate on a 2D tile grid.",
    concepts: [],
  },
  createGame: async () => {
    const { DungeonQuestGame } = await import("../dungeonQuest/DungeonQuestGame");
    return new DungeonQuestGame();
  },
};
