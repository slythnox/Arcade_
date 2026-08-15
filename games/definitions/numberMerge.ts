import { GameDefinition } from "../types";
export const numberMergeDefinition: GameDefinition = {
  id: "number-merge",
  slug: "number-merge",
  name: "Number Merge",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2016,
  tags: ["Drop Merge", "Number", "Cascade", "Puzzle"],
  tagline: "Drop numbered blocks into columns and trigger cascade doubling reactions.",
  description:
    "Drop exponential numbers into columns to match adjacent values and initiate cascading mergers.",
  difficulty: "medium",
  players: "single",
  category: "labs",
  subcategory: "experimental",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/number-merge.png",
    alt: "Number Merge Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Select Drop Column" },
      { key: "SPACE / ↓", description: "Drop Number Block" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any column to drop number tile.",
  },
  seo: {
    title: "Number Merge — Column Drop & Cascade Doubling",
    description: "Drop and merge numbered tiles with recursive cascade chaining.",
    keywords: ["number merge", "drop merge", "math drop", "puzzle arcade"],
  },
  math: {
    title: "Recursive Adjacency Condensation",
    summary: "Stack physics with recursive neighborhood merge chaining: V_{\\text{target}} = 2V.",
    concepts: [
      { name: "Cascade Chaining", description: "\\text{Recursive search for adjacent identical powers of two}." },
    ],
  },
  createGame: async () => {
    const { NumberMergeGame } = await import("../numberMerge/NumberMergeGame");
    return new NumberMergeGame();
  },
};
