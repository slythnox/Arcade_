import type { GameDefinition } from "../types";
export const snakeDefinition: GameDefinition = {
  id: "snake",
  slug: "snake",
  name: "Snake",
  platform: "arcade",
  genre: "action",
  era: "1970s",
  year: 1976,
  tags: ["grid", "reflex", "classic", "ai", "pathfinding"],
  tagline: "Navigate the grid, collect food, and avoid self-collision.",
  description:
    "Control an ever-growing serpent across a 20x20 discrete grid. Avoid colliding with walls or your own tail. Features deterministic food generation and an optional Breadth-First Search (BFS) automated autopilot mode.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "3–10 min",
  thumbnail: {
    src: "/games/snake/thumb.png",
    alt: "Snake Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← → ↑ ↓ / WASD", description: "Change Snake Heading" },
      { key: "SHIFT / C", description: "Toggle BFS Autopilot AI" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "On-screen 4-way D-Pad + AI Autopilot toggle",
    gamepad: "D-Pad Directional Controls",
  },
  seo: {
    title: "Play Snake Online — Classic Arcade Retro Game",
    description:
      "Play classic Snake in browser with deterministic grid movement, speed acceleration, and built-in BFS AI pathfinding.",
    keywords: ["snake game", "retro snake", "arcade snake", "bfs snake ai"],
  },
  math: {
    title: "Mathematics & Mechanics of Snake",
    summary:
      "Snake models discrete topology on a 2D integer lattice, Manhattan distance metrics, and graph search pathfinding.",
    concepts: [
      {
        name: "Discrete 2D Grid Topology",
        description:
          "The snake body is represented as a queue of coordinates [(c_0, r_0), (c_1, r_1), ...]. Each tick pops the tail and prepends a new head coordinate based on the direction vector.",
      },
      {
        name: "Manhattan Distance Heuristic",
        description:
          "The distance between the snake head (c_1, r_1) and target food (c_2, r_2) on an unweighted grid is calculated via the L1 metric: |c_1 - c_2| + |r_1 - r_2|.",
        formula: "D_{Manhattan}(P_1, P_2) = |c_1 - c_2| + |r_1 - r_2|",
      },
      {
        name: "Breadth-First Search (BFS) Pathfinding",
        description:
          "The autopilot mode builds an unweighted reachability tree to find the shortest collision-free path to food with O(V + E) complexity.",
      },
    ],
  },
  createGame: async () => {
    const { SnakeGame } = await import("../snake/SnakeGame");
    return new SnakeGame();
  },
};
