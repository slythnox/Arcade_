import { GameDefinition } from "../types";

export const monsterArenaDefinition: GameDefinition = {
  id: "monster-arena",
  slug: "monster-arena",
  name: "Monster Arena",
  platform: "gameboy",
  genre: "rpg",
  era: "1990s",
  year: 1996,
  tags: ["rpg", "turn-based", "creatures", "battle"],
  tagline: "Train and battle elemental creatures.",
  description:
    "A turn-based RPG where you battle 16 elemental creatures across 3 areas. Master the type chart, level up your creatures, and defeat the Omega boss.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "rpg",
  estimatedPlayTime: "20-40 min",
  thumbnail: {
    src: "/games/monsterArena/thumb.png",
    alt: "Monster Arena Cartridge",
  },
  controls: {
    keyboard: [
      { key: "↑ / ↓ / W / S", description: "Navigate move menu" },
      { key: "SPACE / ENTER", description: "Confirm move selection" },
      { key: "X / SHIFT", description: "Flee (costs 10% score)" },
    ],
  },
  seo: {
    title: "Play Monster Arena — Retro Turn-Based RPG",
    description: "Play classic Monster Arena, a retro turn-based RPG with 16 elemental creatures.",
  },
  math: {
    title: "Battle Math",
    summary: "Combat relies on stats and type multipliers.",
    concepts: [
      {
        name: "Damage Formula",
        description: "dmg = (attacker.attack * move.power / 100) / (defender.defense * 0.5) * typeMultiplier * random(0.85, 1.0)",
      }
    ],
  },
  createGame: async () => {
    const { MonsterArenaGame } = await import("../monsterArena/MonsterArenaGame");
    return new MonsterArenaGame();
  },
};
