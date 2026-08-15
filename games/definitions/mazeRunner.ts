import { GameDefinition } from "../types";
export const mazeRunnerDefinition: GameDefinition = {
  id: "maze-runner",
  slug: "maze-runner",
  name: "Maze Runner",
  platform: "arcade",
  genre: "puzzle",
  era: "1980s",
  year: 1980,
  tags: ["Maze", "DFS Generator", "Pathfinding", "Procedural", "Puzzle"],
  tagline: "Escape procedurally generated 2D labyrinth mazes using tree traversal.",
  description:
    "Navigate procedurally carved spanning-tree mazes generated with randomized depth-first search.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "puzzle",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/maze-runner.png",
    alt: "Maze Runner Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate Labyrinth Corridors" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Generate Fresh Maze" },
    ],
    touch: "Swipe to step along open maze corridors.",
  },
  seo: {
    title: "Maze Runner — Procedural Labyrinth Spanning Tree Puzzle",
    description: "Procedural maze escape game powered by randomized depth-first search spanning trees.",
    keywords: ["maze runner", "procedural maze", "dfs maze", "labyrinth game"],
  },
  math: {
    title: "Randomized Spanning Trees & Graph DFS",
    summary: "Generating minimum spanning trees on 2D grid graphs with guaranteed single unique paths between any two nodes.",
    concepts: [
      { name: "Spanning Tree", description: "V \\text{ vertices, } |E| = |V| - 1 \\text{ with zero cycles}." },
      { name: "Recursive Backtracking", description: "\\text{Stack-based randomized DFS corridor carving}." },
    ],
  },
  createGame: async () => {
    const { MazeRunnerGame } = await import("../mazeRunner/MazeRunnerGame");
    return new MazeRunnerGame();
  },
};
