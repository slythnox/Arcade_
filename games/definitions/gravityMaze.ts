import type { GameDefinition } from "../types";
export const gravityMazeDefinition: GameDefinition = {
  id: "gravity-maze",
  slug: "gravity-maze",
  name: "Gravity Maze",
  platform: "arcade",
  genre: "puzzle",
  era: "1990s",
  year: 1991,
  tags: ["Gravity Maze", "World Rotation", "Rolling Marble", "Puzzle"],
  tagline: "Rotate the world coordinate frame to roll a marble through complex maze walls.",
  description:
    "Solve spatial orientation labyrinths by rotating the global gravitational vector across 4 cardinal directions.",
  difficulty: "medium",
  players: "single",
  category: "labs",
  subcategory: "experimental",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/gravity-maze.png",
    alt: "Gravity Maze Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Rotate World Gravity Direction" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Swipe in 4 directions to rotate world gravity vector.",
  },
  seo: {
    title: "Gravity Maze — 90-Degree World Rotation Labyrinth Puzzle",
    description: "Rotate gravity vectors to guide a rolling marble through labyrinth corridors.",
    keywords: ["gravity maze", "world rotation", "marble maze", "spatial puzzle"],
  },
  math: {
    title: "Orthogonal Coordinate Rotations & Sliding Ray Casts",
    summary: "\\vec{g}' = R(\\theta) \\vec{g}, \\quad R(90^\\circ) = \\begin{bmatrix} 0 & -1 \\\\ 1 & 0 \\end{bmatrix}.",
    concepts: [
      { name: "Cardinal Rotation Matrix", description: "\\text{Discrete 90-degree orthogonal transformation group } SO(2, \\mathbb{Z})." },
    ],
  },
  createGame: async () => {
    const { GravityMazeGame } = await import("../gravityMaze/GravityMazeGame");
    return new GravityMazeGame();
  },
};
