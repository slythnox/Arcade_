import type { GameDefinition } from "../types";
export const minesweeperDefinition: GameDefinition = {
  id: "minesweeper",
  slug: "minesweeper",
  name: "Minesweeper",
  platform: "handheld",
  genre: "strategy",
  era: "1980s",
  year: 1989,
  tags: ["logic", "probability", "flood-fill", "deduction", "puzzle"],
  tagline: "Uncover safe cells and flag hidden explosive mines with deductive logic.",
  description:
    "Clear a hidden 10x10 minefield using numerical adjacency clues. Features guaranteed first-click safety, iterative flood-fill cell expansion, flagging system, and win-state verification.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "3–8 min",
  thumbnail: {
    src: "/games/minesweeper/thumb.png",
    alt: "Minesweeper Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← → ↑ ↓ / WASD", description: "Move Grid Cursor" },
      { key: "SPACE / X / Enter", description: "Reveal Cell" },
      { key: "SHIFT / C / F", description: "Toggle Flag" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap cell to reveal, Tap Flag mode to place markers",
    gamepad: "D-Pad to Move Cursor, A to Reveal, B to Flag",
  },
  seo: {
    title: "Play Minesweeper Online — Classic Retro Strategy Puzzle",
    description:
      "Play Minesweeper free in browser with guaranteed safe first click, iterative flood-fill algorithm, and retro hardware aesthetic.",
    keywords: ["minesweeper online", "classic minesweeper", "retro puzzle", "flood fill puzzle"],
  },
  math: {
    title: "Mathematics & Mechanics of Minesweeper",
    summary:
      "Minesweeper utilizes discrete grid graphs, Moore neighborhoods, combinatorial probability, and iterative flood-fill traversal.",
    concepts: [
      {
        name: "Moore Neighborhood Adjacency",
        description:
          "Each grid cell computes its numerical clue by counting explosive mines across its 8 surrounding Moore neighbors (Chebyshev distance d ≤ 1).",
        formula: "N(c, r) = \\sum_{dr=-1}^1 \\sum_{dc=-1}^1 M(c + dc, r + dr)",
      },
      {
        name: "Iterative Queue Flood Fill",
        description:
          "Revealing an empty cell (clue = 0) initiates a breadth-first flood-fill queue to cascade and unveil all contiguous empty regions without risking call-stack limits.",
      },
      {
        name: "Probabilistic Deduction",
        description:
          "When logical certainty is not attainable from neighboring clues, optimal moves require computing conditional probabilities across overlapping mine constraints.",
      },
    ],
  },
  createGame: async () => {
    const { MinesweeperGame } = await import("../minesweeper/MinesweeperGame");
    return new MinesweeperGame();
  },
};
