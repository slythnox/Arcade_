import type { GameDefinition } from "../types";
export const brickStackDefinition: GameDefinition = {
  id: "brick-stack",
  slug: "brick-stack",
  name: "Brick Stack",
  platform: "arcade",
  genre: "physics",
  era: "1990s",
  year: 1999,
  tags: ["Stacker", "Precision", "Slice Physics", "Tower"],
  tagline: "Stack oscillating blocks and slice away overhanging excess.",
  description:
    "Test your timing by stacking oscillating blocks on top of each other. Any misaligned section is sliced off!",
  difficulty: "medium",
  players: "single",
  category: "labs",
  subcategory: "experimental",
  estimatedPlayTime: "3-5 min",
  thumbnail: {
    src: "/assets/thumbnails/brick-stack.png",
    alt: "Brick Stack Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Drop / Lock Block" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere on screen to lock block.",
  },
  seo: {
    title: "Brick Stack — Precision Block Stacker Arcade",
    description: "Stack moving rectangular blocks with 1D slice physics and combo bonuses.",
    keywords: ["stacker", "brick stack", "arcade stacker", "timing game"],
  },
  math: {
    title: "1D Overlap Truncation & Alignment",
    summary: "1D interval intersection: [\\max(x_1, x_2), \\min(x_1+w_1, x_2+w_2)].",
    concepts: [
      { name: "Interval Overlap", description: "w_{\\text{new}} = \\min(R_1, R_2) - \\max(L_1, L_2)." },
      { name: "Precision Threshold", description: "|x_{\\text{cur}} - x_{\\text{prev}}| < \\epsilon \\implies \\text{Perfect Lock Combo}." },
    ],
  },
  createGame: async () => {
    const { BrickStackGame } = await import("../brickStack/BrickStackGame");
    return new BrickStackGame();
  },
};
