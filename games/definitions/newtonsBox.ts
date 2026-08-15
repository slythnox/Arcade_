import type { GameDefinition } from "../types";
export const newtonsBoxDefinition: GameDefinition = {
  id: "newtons-box",
  slug: "newtons-box",
  name: "Newton's Box",
  platform: "arcade",
  genre: "physics",
  era: "1980s",
  year: 1982,
  tags: ["Sokoban", "Ice Physics", "Inertia", "Puzzle"],
  tagline: "Push boxes across frictionless ice surfaces toward target activation pads.",
  description:
    "Solve spatial inertia puzzles by pushing heavy blocks that slide continuously until stopped by obstacles.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "physics",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/newtons-box.png",
    alt: "Newton's Box Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Move Worker & Push Blocks" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Swipe in any direction to move and push.",
  },
  seo: {
    title: "Newton's Box — Frictionless Sliding Block Puzzle",
    description: "Sokoban variant with frictionless sliding physics and target matching.",
    keywords: ["newtons box", "sokoban", "ice puzzle", "sliding block physics"],
  },
  math: {
    title: "Inertial Sliding Ray Cast & State Space Search",
    summary: "Discrete ray casting until first non-empty cell: \\arg\\min_k \\{ (r + k \\Delta r, c + k \\Delta c) \\in \\text{Obstacles} \\}.",
    concepts: [
      { name: "Terminal Displacement", description: "\\vec{p}_{\\text{stop}} = \\vec{p}_0 + (k_{\\text{hit}} - 1) \\vec{d}." },
    ],
  },
  createGame: async () => {
    const { NewtonsBoxGame } = await import("../newtonsBox/NewtonsBoxGame");
    return new NewtonsBoxGame();
  },
};
