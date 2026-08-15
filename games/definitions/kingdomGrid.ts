import { GameDefinition } from "../types";
export const kingdomGridDefinition: GameDefinition = {
  id: "kingdom-grid",
  slug: "kingdom-grid",
  name: "Kingdom Grid",
  platform: "arcade",
  genre: "strategy",
  era: "1990s",
  year: 1993,
  tags: ["Influence Map", "Territory Conquest", "Turn-Based", "Strategy"],
  tagline: "Expand territorial dominion and economic control across an 8x8 feudal grid.",
  description:
    "Capture territory against an AI adversary by claiming adjacent neutral and enemy sectors using turn-based energy economy.",
  difficulty: "medium",
  players: "1-2 players",
  category: "labs",
  subcategory: "experimental",
  estimatedPlayTime: "5-12 min",
  thumbnail: {
    src: "/assets/thumbnails/kingdom-grid.png",
    alt: "Kingdom Grid Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Sector Coordinate" },
      { key: "SPACE / ENTER", description: "Claim / Conquer Sector" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap adjacent highlighted sector to expand territory.",
  },
  seo: {
    title: "Kingdom Grid — Territorial Influence Map Feudal Conquest",
    description: "Turn-based territory conquest strategy game with influence map expansion.",
    keywords: ["kingdom grid", "territory strategy", "influence map", "feudal conquest"],
  },
  math: {
    title: "Influence Maps & Connected Subgraph Expansion",
    summary: "\\text{Adjacency requirement: } \\exists n \\in N(v) \\text{ s.t. } T(n) = \\text{Player}, \\quad E_{t+1} = E_t + \\lfloor |V_{\\text{player}}| / 3 \\rfloor.",
    concepts: [
      { name: "Territory Income Scaling", description: "\\text{Turn energy proportional to connected component cardinality}." },
    ],
  },
  createGame: async () => {
    const { KingdomGridGame } = await import("../kingdomGrid/KingdomGridGame");
    return new KingdomGridGame();
  },
};
