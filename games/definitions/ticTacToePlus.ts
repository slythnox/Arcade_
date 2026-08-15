import type { GameDefinition } from "../types";
export const ticTacToePlusDefinition: GameDefinition = {
  id: "tic-tac-toe-plus",
  slug: "tic-tac-toe-plus",
  name: "Tic-Tac-Toe+",
  platform: "arcade",
  genre: "strategy",
  era: "2000s",
  year: 2008,
  tags: ["Ultimate Tic-Tac-Toe", "Nested Grid", "Board Game", "Strategy"],
  tagline: "Expanded nested tactical 3x3 grid variant of classic Tic-Tac-Toe.",
  description:
    "Play Ultimate Tic-Tac-Toe where winning individual sub-boards claims positions on the macro 3x3 master grid.",
  difficulty: "hard",
  players: "1-2 players",
  category: "arcade",
  subcategory: "strategy",
  estimatedPlayTime: "5-12 min",
  thumbnail: {
    src: "/assets/thumbnails/tic-tac-toe-plus.png",
    alt: "Tic-Tac-Toe+ Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Sub-Grid Cell" },
      { key: "Z / R", description: "Cycle Active Master Board" },
      { key: "SPACE / ENTER", description: "Play Macro Marker (X)" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap directly on nested grid cells to claim markers.",
  },
  seo: {
    title: "Tic-Tac-Toe+ — Ultimate Nested Macro Grid Strategy",
    description: "Ultimate 9-board nested Tic-Tac-Toe strategy game with recursive winning constraints.",
    keywords: ["ultimate tic tac toe", "tic tac toe plus", "nested board game", "strategy"],
  },
  math: {
    title: "Recursive Nested Grid Game Theory",
    summary: "G = \\prod_{i=1}^3 \\prod_{j=1}^3 g_{i,j}, \\text{Recursive state constraint propagation}.",
    concepts: [
      { name: "Constrained Target Dispatch", description: "\\text{Sub-move } (r, c) \\implies \\text{Next active master board } M = (r, c)." },
    ],
  },
  createGame: async () => {
    const { TicTacToePlusGame } = await import("../ticTacToePlus/TicTacToePlusGame");
    return new TicTacToePlusGame();
  },
};
