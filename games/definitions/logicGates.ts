import type { GameDefinition } from "../types";
export const logicGatesDefinition: GameDefinition = {
  id: "logicGates",
  slug: "logic-gates",
  name: "Logic Gates",
  platform: "arcade",
  genre: "puzzle",
  era: "1980s",
  year: 1985,
  tags: ["logic", "puzzle", "circuits", "boolean"],
  tagline: "Build boolean logic circuits to solve puzzles.",
  description: "Wire together AND, OR, NOT, and XOR gates to create functional digital logic circuits.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "15 min",
  thumbnail: { src: "/games/logicGates/thumb.png", alt: "Logic Gates" },
  controls: {
    keyboard: [
      { key: "Direct Mouse Click / Tap", description: "Click any Input Switch (0/1) to Toggle" },
      { key: "Up / Down / Arrows", description: "Select Input Switch" },
      { key: "SPACE / Enter", description: "Toggle Selected Switch (0/1)" },
      { key: "R", description: "Restart Level" },
    ],
    touch: "Tap any input switch on the left to flip between 0 and 1.",
  },
  seo: {
    title: "Logic Gates Puzzle Game — Digital Circuit Simulator",
    description: "Solve boolean logic puzzles by connecting various digital gates in this retro game.",
    keywords: ["logic gates", "boolean", "circuit", "puzzle", "educational"],
  },
  math: {
    title: "Boolean Algebra & Combinational Logic",
    summary: "Simulates discrete digital logic gate operations and truth tables.",
    concepts: [
      {
        name: "Combinational Truth Evaluation",
        description: "Evaluates boolean algebra functions across directed acyclic gate networks.",
      },
    ],
  },
  createGame: async () => {
    const { LogicGatesGame } = await import("../logicGates/LogicGatesGame");
    return new LogicGatesGame();
  },
};
