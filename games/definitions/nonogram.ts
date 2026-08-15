import { GameDefinition } from "../types";
import { NonogramGame } from "../nonogram/NonogramGame";

export const nonogramDefinition: GameDefinition = {
  id: "nonogram",
  slug: "nonogram",
  name: "Nonogram",
  platform: "handheld",
  genre: "puzzle",
  era: "1980s",
  year: 1987,
  tags: ["Picross", "Nonogram", "Pixel Art", "Logic", "Puzzle"],
  tagline: "Reveal hidden pixel art using row and column run-length number clues.",
  description:
    "Deduce binary pixel image solutions through intersecting orthogonal run-length constraints.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-12 min",
  thumbnail: {
    src: "/assets/thumbnails/nonogram.png",
    alt: "Nonogram Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate Pixel Grid" },
      { key: "SPACE / ENTER", description: "Toggle Pixel State" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any pixel to mark or unmark.",
  },
  seo: {
    title: "Nonogram — Japanese Picross Logic Grid",
    description: "Solve picture logic puzzles using row and column run-length clues.",
    keywords: ["picross", "nonogram", "griddlers", "picture logic"],
  },
  math: {
    title: "Run-Length Encoding (RLE) & Line Constraints",
    summary: "Discrete tomography constraint satisfaction over binary vectors: x \\in \\{0,1\\}^N.",
    concepts: [
      { name: "RLE Decomposition", description: "\\text{Lengths of consecutive contiguous 1-sequences}." },
      { name: "Overlap Intersection", description: "\\text{If minimum span exceeds remaining width, overlaps are guaranteed 1s}." },
    ],
  },
  createGame: () => new NonogramGame(),
};
