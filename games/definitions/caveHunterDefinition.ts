import type { GameDefinition } from "../types";

export const caveHunterDefinition: GameDefinition = {
  id: "caveHunter",
  slug: "cave-hunter",
  name: "Cave Hunter",
  platform: "arcade",
  genre: "action",
  era: "1980s",
  year: 1982,
  tags: ["digging", "classic", "enemies", "underground"],
  tagline: "Dig, trap, and defeat underground monsters!",
  description: "Dig through the earth to outsmart enemies. Use your air pump to inflate and pop monsters, or strategically drop rocks on them for huge points.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "10-20 min",
  thumbnail: {
    src: "/games/caveHunter/thumb.png",
    alt: "Cave Hunter Cartridge",
  },
  controls: {
    keyboard: [
      { key: "W / A / S / D (or Arrows)", description: "Move & Dig" },
      { key: "SPACE / X", description: "Use Air Pump / Attack" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Use left directional dial to dig tunnels, tap right A button to pump and pop monsters.",
    gamepad: "D-pad to dig, A button to use air pump."
  },
  seo: {
    title: "Play Cave Hunter Online - Classic Arcade Digging",
    description: "Dig tunnels and defeat enemies in this retro arcade classic. Free online.",
    keywords: ["cave hunter", "dig game", "arcade classic", "retro"],
  },
  math: {
    title: "Grid based movement",
    summary: "Simulates grid movement and pathfinding.",
    concepts: [
      {
        name: "Grid Digging",
        description: "Altering level topology dynamically.",
      },
    ],
  },
  createGame: async () => {
    const { CaveHunterGame } = await import("../caveHunter/CaveHunterGame");
    return new CaveHunterGame();
  },
};
