import { GameDefinition } from "../types";
export const fireSpreadDefinition: GameDefinition = {
  id: "fireSpread",
  slug: "fire-spread",
  name: "Fire Spread",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2018,
  tags: ["cellular automata", "fire", "simulation"],
  tagline: "Forest fire simulation using cellular automata with wind.",
  description: "Control firebreaks. Can you save the forest?",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "strategy",
  estimatedPlayTime: "5-10 min",
  thumbnail: { src: "/games/fireSpread/thumb.png", alt: "Fire Spread" },
  controls: {
    keyboard: [
      { key: "Arrows", description: "Move cursor" },
      { key: "SPACE", description: "Cut firebreak" },
      { key: "Z/X", description: "Rotate wind" }
    ]
  },
  seo: {
    title: "Fire Spread Simulator",
    description: "Cellular automata forest fire simulation.",
    keywords: ["fire spread", "cellular automata", "simulation"]
  },
  math: {
    title: "Cellular Automata",
    summary: "Probabilistic propagation, wind vector influence.",
    concepts: [
      { name: "Probabilistic rules", description: "Spread chance influenced by wind" }
    ]
  },
  createGame: async () => {
    const { FireSpreadGame } = await import("../fireSpread/FireSpreadGame");
    return new FireSpreadGame();
  },
};
