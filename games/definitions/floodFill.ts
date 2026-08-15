import { GameDefinition } from "../types";
export const floodFillDefinition: GameDefinition = {
  id: "flood-fill",
  slug: "flood-fill",
  name: "Flood Fill",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2006,
  tags: ["Flood It", "Graph Traversal", "BFS", "Color", "Puzzle"],
  tagline: "Capture the entire board in a single color within limited moves.",
  description:
    "Expand an interconnected color territory using graph breadth-first search within a finite move budget.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "3-5 min",
  thumbnail: {
    src: "/assets/thumbnails/flood-fill.png",
    alt: "Flood Fill Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Select Flood Color" },
      { key: "SPACE / ENTER", description: "Apply Flood Wave" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap any color button below to flood.",
  },
  seo: {
    title: "Flood Fill — Graph Traversal Color Puzzle",
    description: "Capture the board with iterative graph BFS flood fill algorithms.",
    keywords: ["flood fill", "graph bfs", "color puzzle", "flood it game"],
  },
  math: {
    title: "Connected Component Expansion (BFS)",
    summary: "Graph component growth via queue-based breadth-first search and border node recoloring.",
    concepts: [
      { name: "Breadth-First Traversal", description: "Q \\leftarrow \\{(0,0)\\}; \\forall v \\in N(u), \\text{if } C(v) = C_0 \\implies Q \\cup \\{v\\}." },
      { name: "Graph Contraction", description: "Shrinks color graph G to single super-vertex." },
    ],
  },
  createGame: async () => {
    const { FloodFillGame } = await import("../floodFill/FloodFillGame");
    return new FloodFillGame();
  },
};
