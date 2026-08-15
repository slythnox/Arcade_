import type { GameDefinition } from "../types";
export const towerDefenseDefinition: GameDefinition = {
  id: "tower-defense",
  slug: "tower-defense",
  name: "Tower Defense",
  platform: "arcade",
  genre: "strategy",
  era: "2000s",
  year: 2007,
  tags: ["Tower Defense", "Pathfinding", "Creep Waves", "Strategy"],
  tagline: "Build and upgrade defensive turrets along S-curve creep march corridors.",
  description:
    "Place defensive turrets along waypoint-guided creep march lanes to defend your base against escalating waves.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "strategy",
  estimatedPlayTime: "5-15 min",
  thumbnail: {
    src: "/assets/thumbnails/tower-defense.png",
    alt: "Tower Defense Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Navigate Building Grid" },
      { key: "SPACE / ENTER", description: "Construct Defense Turret ($100)" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap grid cell to place defense turret.",
  },
  seo: {
    title: "Tower Defense — Tactical Turret Pathfinding Defense",
    description: "Classic grid-based tower defense game with range circles and wave progression.",
    keywords: ["tower defense", "turret defense", "creep waves", "strategy arcade"],
  },
  math: {
    title: "Waypoint Pathfinding & Range Circle Intersection",
    summary: "\\|\\vec{p}_{\\text{creep}} - \\vec{p}_{\\text{tower}}\\| \\le R_{\\text{range}}, \\quad \\text{DPS} = \\frac{\\text{Damage}}{\\tau_{\\text{cooldown}}}.",
    concepts: [
      { name: "Greedy Nearest Targeting", description: "\\arg\\min_{c \\in \\text{Creeps}} \\|\\vec{p}_c - \\vec{p}_t\\|." },
    ],
  },
  createGame: async () => {
    const { TowerDefenseGame } = await import("../towerDefense/TowerDefenseGame");
    return new TowerDefenseGame();
  },
};
