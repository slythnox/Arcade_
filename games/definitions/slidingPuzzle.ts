import { GameDefinition } from "../types";
import { SlidingPuzzleGame } from "../slidingPuzzle/SlidingPuzzleGame";

export const slidingPuzzleDefinition: GameDefinition = {
  id: "sliding-puzzle",
  slug: "sliding-puzzle",
  name: "Sliding Puzzle",
  platform: "handheld",
  genre: "puzzle",
  era: "1970s",
  year: 1970,
  tags: ["15-Puzzle", "Sliding", "Permutation", "Math", "Puzzle"],
  tagline: "Rearrange numbered tiles 1 through 15 into ascending order.",
  description:
    "Solve the classic mathematical 15-puzzle by sliding tiles into the single vacant position.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/sliding-puzzle.png",
    alt: "Sliding Puzzle Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Adjacent Tile" },
      { key: "SPACE / ENTER", description: "Slide Into Open Space" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any tile adjacent to the open gap to slide it.",
  },
  seo: {
    title: "Sliding Puzzle — Classic 15-Puzzle Math Challenge",
    description: "Play the 15-puzzle sliding block permutation game with Manhattan distance scoring.",
    keywords: ["15 puzzle", "sliding puzzle", "permutation puzzle", "math game"],
  },
  math: {
    title: "Permutations & Manhattan Distance Heuristics",
    summary: "Parity of permutation inversions and Manhattan distance: h(n) = \\sum |x_i - x_i^*| + |y_i - y_i^*|.",
    concepts: [
      { name: "Manhattan Distance", description: "d(p_1, p_2) = |x_1 - x_2| + |y_1 - y_2|." },
      { name: "Inversion Parity", description: "\\text{Solvability determined by parity of inversion count } N." },
    ],
  },
  createGame: () => new SlidingPuzzleGame(),
};
