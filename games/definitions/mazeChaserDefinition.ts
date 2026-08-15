import type { GameDefinition } from "../types";

export const mazeChaserDefinition: GameDefinition = {
  id: "mazeChaser",
  slug: "mazeChaser",
  name: "Maze Chaser",
  platform: "arcade",
  genre: "action",
  era: "1980s",
  year: 1980,
  tags: ["maze", "classic", "pac", "chase"],
  description: "Navigate a maze to consume all pellets while evading four pursuing ghosts. Eat power pellets to turn the tables and capture the ghosts for bonus points.",
  tagline: "The timeless maze-chasing arcade classic.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/games/mazeChaser/thumb.png",
    alt: "Maze Chaser",
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrows", description: "Move Player" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
  },
  seo: {
    title: "Play Maze Chaser Online - Retro Arcade Classic",
    description: "Enjoy the retro maze chasing game. Outsmart ghosts and eat all the pellets to clear the board.",
    keywords: ["maze", "retro", "arcade", "ghosts", "classic"],
  },
  math: {
    title: "Pathfinding & State Machines",
    summary: "Ghosts use deterministic pathfinding algorithms (like Breadth-First Search) and Finite State Machines (FSM) to switch between chasing, scattering, and fleeing.",
    concepts: [
      {
        name: "Breadth-First Search (BFS)",
        description: "A graph traversal algorithm used to find the shortest path from the ghost to the player's position in the grid maze.",
      },
      {
        name: "Manhattan Distance",
        description: "Distance heuristic used when making directional choices, d = |x1-x2| + |y1-y2|.",
        formula: "d = |x_1 - x_2| + |y_1 - y_2|",
      },
      {
        name: "Finite State Machine",
        description: "Controls ghost behavior: CHASE (pursue player), SCATTER (return to home corner), and FRIGHTENED (move randomly, vulnerable).",
      }
    ],
  },
  createGame: async () => {
    const { MazeChaserGame } = await import("../mazeChaser/MazeChaserGame");
    return new MazeChaserGame();
  },
};
