import { GameDefinition } from "../types";
export const algorithmDungeonDefinition: GameDefinition = {
  id: "algorithmDungeon",
  slug: "algorithm-dungeon",
  name: "Algorithm Dungeon",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2024,
  tags: ["maze", "algorithms", "bfs", "astar", "dijkstra"],
  tagline: "Watch pathfinding algorithms race through a recursive dungeon.",
  description: "A procedural maze solved concurrently by BFS, A*, and Dijkstra pathfinding algorithms.",
  difficulty: "easy",
  players: "single",
  category: "labs",
  subcategory: "algorithms",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/games/algorithmDungeon/thumb.png", alt: "Algorithm Dungeon" },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Pause / Resume" },
      { key: "R", description: "Generate New Maze" },
      { key: "Z / X", description: "Slow Down / Speed Up" },
    ],
  },
  seo: {
    title: "Algorithm Dungeon — Live Pathfinding Race",
    description: "Watch and control BFS, A*, and Dijkstra algorithms solving procedural mazes.",
    keywords: ["algorithm", "maze", "pathfinding", "a-star", "dijkstra", "bfs"],
  },
  math: {
    title: "Graph Traversal & Heuristic Search",
    summary: "Compares unweighted breadth-first exploration with heuristic-guided A* search.",
    concepts: [
      {
        name: "A* Heuristic Function",
        description: "f(n) = g(n) + h(n), where h(n) is the Manhattan distance admissible heuristic.",
      },
    ],
  },
  createGame: async () => {
    const { AlgorithmDungeonGame } = await import("../algorithmDungeon/AlgorithmDungeonGame");
    return new AlgorithmDungeonGame();
  },
};
