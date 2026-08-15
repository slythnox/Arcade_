import { GameDefinition } from "../types";
export const colorCollapseDefinition: GameDefinition = {
  id: "color-collapse",
  slug: "color-collapse",
  name: "Color Collapse",
  platform: "arcade",
  genre: "puzzle",
  era: "1990s",
  year: 1992,
  tags: ["SameGame", "Collapse", "Gravity", "Match", "Puzzle"],
  tagline: "Collapse matching block clusters with gravity cascade and column compaction.",
  description:
    "Clear groups of matching colored blocks to trigger cascading gravity drops and compacting column shifts.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/color-collapse.png",
    alt: "Color Collapse Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Select Block" },
      { key: "SPACE / ENTER", description: "Collapse Group" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any group of 2+ matching blocks to collapse.",
  },
  seo: {
    title: "Color Collapse — SameGame Gravity Cascade Puzzle",
    description: "Classic SameGame tile collapsing puzzle with gravity cascade and column compaction.",
    keywords: ["samegame", "color collapse", "block collapse", "gravity puzzle"],
  },
  math: {
    title: "Connected Component & Gravity Cascade",
    summary: "Graph component clustering with non-linear scoring: S = N(N-1) \\times 10.",
    concepts: [
      { name: "Cluster Scoring", description: "S = N(N - 1) \\times 10." },
      { name: "Column Compaction", description: "\\text{Shift non-empty columns left to compress matrix}." },
    ],
  },
  createGame: async () => {
    const { ColorCollapseGame } = await import("../colorCollapse/ColorCollapseGame");
    return new ColorCollapseGame();
  },
};
