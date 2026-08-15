import { GameDefinition } from "../types";
export const voronoiGardenDefinition: GameDefinition = {
  id: "voronoiGarden",
  slug: "voronoi-garden",
  name: "Voronoi Garden",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2008,
  tags: ["geometry", "voronoi", "mathematics", "visualization"],
  tagline: "Nearest-site Voronoi tessellation and distance metric visualizer.",
  description: "Interactive Voronoi diagram generator demonstrating Euclidean (L2) and Manhattan (L1) metric spaces in real-time.",
  difficulty: "easy",
  players: "single",
  category: "labs",
  subcategory: "procedural",
  estimatedPlayTime: "5 min",
  thumbnail: { src: "/games/voronoiGarden/thumb.png", alt: "Voronoi Garden" },
  controls: {
    keyboard: [
      { key: "ARROWS", description: "Move Cursor" },
      { key: "SPACE", description: "Place Voronoi Seed Site" },
      { key: "X / SHIFT", description: "Toggle L1 / L2 Metric" },
      { key: "R", description: "Reset Sites" },
    ],
  },
  seo: {
    title: "Voronoi Garden — Computational Geometry Visualizer",
    description: "Interactive real-time Voronoi diagram simulator exploring distance metrics and space partitioning.",
    keywords: ["voronoi diagram", "computational geometry", "math visualization", "tessellation"],
  },
  math: {
    title: "Voronoi Tessellation & Norms",
    summary: "Partitions a plane into regions close to each generating seed point under metric d(p, q).",
    concepts: [
      {
        name: "L2 (Euclidean) Metric",
        description: "Standard Euclidean distance d(p,q) = sqrt((px-qx)^2 + (py-qy)^2).",
      },
      {
        name: "L1 (Manhattan) Metric",
        description: "Taxicab grid distance d(p,q) = |px-qx| + |py-qy| producing diamond partitioning facets.",
      },
    ],
  },
  createGame: async () => {
    const { VoronoiGardenGame } = await import("../voronoiGarden/VoronoiGardenGame");
    return new VoronoiGardenGame();
  },
};
