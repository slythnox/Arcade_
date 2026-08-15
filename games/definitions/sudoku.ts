import { GameDefinition } from "../types";
export const sudokuDefinition: GameDefinition = {
  id: "sudoku",
  slug: "sudoku",
  name: "Sudoku",
  platform: "handheld",
  genre: "puzzle",
  era: "1970s",
  year: 1979,
  tags: ["Sudoku", "Constraint Satisfaction", "Math", "Number", "Puzzle"],
  tagline: "Fill the 9x9 grid with numbers 1 to 9 under strict mathematical constraints.",
  description:
    "Solve the classic Japanese number placement puzzle where every row, column, and 3x3 block contains digits 1-9.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "10-20 min",
  thumbnail: {
    src: "/assets/thumbnails/sudoku.png",
    alt: "Sudoku Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate 9x9 Grid" },
      { key: "SPACE / 1-9", description: "Enter / Cycle Digit" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap cell to select and enter digits.",
  },
  seo: {
    title: "Sudoku — 9x9 Constraint Satisfaction Number Puzzle",
    description: "Play classic Sudoku logic puzzle with 3x3 subgrid validation.",
    keywords: ["sudoku", "number puzzle", "constraint satisfaction", "math grid"],
  },
  math: {
    title: "Exact Cover & Constraint Satisfaction (CSP)",
    summary: "Constraint solving: \\forall i, \\sum_{j=1}^9 M_{i,j} = 45 \\land \\prod_{j=1}^9 M_{i,j} = 9!.",
    concepts: [
      { name: "Exact Cover", description: "\\text{Each row, column, and block contains a permutation of } \\{1,\\dots,9\\}." },
      { name: "Backtracking Algorithm", description: "\\text{Knuth's Algorithm X for exact cover matrix elimination}." },
    ],
  },
  createGame: async () => {
    const { SudokuGame } = await import("../sudoku/SudokuGame");
    return new SudokuGame();
  },
};
