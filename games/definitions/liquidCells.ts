import { GameDefinition } from "../types";
import { LiquidCellsGame } from "../liquidCells/LiquidCellsGame";

export const liquidCellsDefinition: GameDefinition = {
  id: "liquidCells",
  slug: "liquid-cells",
  name: "Liquid Cells",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2014,
  tags: ["water", "fluid", "cellular automata"],
  tagline: "Cellular automaton fluid simulation.",
  description: "Water flows, fills containers, creates waves. Pour, block, watch physics emerge.",
  difficulty: "easy",
  players: "single",
  estimatedPlayTime: "10-20 min",
  thumbnail: { src: "/games/liquidCells/thumb.png", alt: "Liquid Cells" },
  controls: {
    keyboard: [
      { key: "Arrows", description: "Move cursor" },
      { key: "Z", description: "Place wall" },
      { key: "X", description: "Place water" },
      { key: "SPACE", description: "Erase" }
    ]
  },
  seo: {
    title: "Liquid Cells",
    description: "Fluid simulation with cellular automata.",
    keywords: ["liquid", "fluid simulation", "cellular automata"]
  },
  math: {
    title: "Fluid Approximation",
    summary: "Cellular automata, pressure-based flow.",
    concepts: [
      { name: "Pressure-based flow", description: "Mass exchange between cells" }
    ]
  },
  createGame: () => new LiquidCellsGame(),
};
