import { GameDefinition } from "../types";
import { MatchThreeGame } from "../matchThree/MatchThreeGame";

export const matchThreeDefinition: GameDefinition = {
  id: "match-3",
  slug: "match-3",
  name: "Match-3",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2001,
  tags: ["Match-3", "Bejeweled", "Swap", "Cascade", "Puzzle"],
  tagline: "Swap adjacent gems to form orthogonal lines of 3 or more matching colors.",
  description:
    "Form matching horizontal and vertical triplets to trigger cascading multi-combo gravity reactions.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/match-3.png",
    alt: "Match-3 Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Gem" },
      { key: "SPACE / ENTER", description: "Pick / Swap Adjacent Gem" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap first gem then adjacent neighbor to swap.",
  },
  seo: {
    title: "Match-3 — Swap & Cascade Gem Puzzle",
    description: "Classic Match-3 gem puzzle game featuring cascade gravity and combo multipliers.",
    keywords: ["match 3", "gem puzzle", "bejeweled", "swap game"],
  },
  math: {
    title: "Permutation Swaps & Orthogonal Runs",
    summary: "Orthogonal run-length encoding (RLE) and cascade gravity matrix compaction.",
    concepts: [
      { name: "Run Length Matching", description: "\\text{Count adjacent identical values along matrix axes} \\ge 3." },
      { name: "Cascade Multiplier", description: "\\text{Score} = N_{\\text{matched}} \\times 100 \\times \\text{Combo}." },
    ],
  },
  createGame: () => new MatchThreeGame(),
};
