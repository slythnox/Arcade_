import { GameDefinition } from "../types";
import { LogicGatesGame } from "../logicGates/LogicGatesGame";

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
  estimatedPlayTime: "15 min",
  thumbnail: { src: "/games/logicGates/thumb.png", alt: "Logic Gates" },
  controls: {
    keyboard: [
      { key: "Z", description: "Toggle state / Interaction" },
      { key: "R", description: "Reset Puzzle" },
      { key: "Arrows", description: "Move Cursor" },
    ],
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
  createGame: () => new LogicGatesGame(),
};
