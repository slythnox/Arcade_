import { GameDefinition } from "../types";
import { HexTerritoryGame } from "../hexTerritory/HexTerritoryGame";

export const hexTerritoryDefinition: GameDefinition = {
  id: "hexTerritory",
  slug: "hex-territory",
  name: "Hex Territory",
  platform: "arcade",
  genre: "strategy",
  era: "2000s",
  year: 2012,
  tags: ["hex", "territory", "ai"],
  tagline: "Claim hex territory by placing colored hexagons.",
  description: "Flood fill determines territory. AI opponent uses greedy strategy.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-10 min",
  thumbnail: { src: "/games/hexTerritory/thumb.png", alt: "Hex Territory" },
  controls: {
    keyboard: [
      { key: "Mouse", description: "Select hex" }
    ]
  },
  seo: {
    title: "Hex Territory",
    description: "Hex grid strategy game against AI.",
    keywords: ["hex", "strategy", "territory"]
  },
  math: {
    title: "Hex Geometry",
    summary: "Axial hex coordinates, territory calculation, greedy algorithms.",
    concepts: [
      { name: "Axial Coordinates", description: "q, r coordinate system" }
    ]
  },
  createGame: () => new HexTerritoryGame(),
};
