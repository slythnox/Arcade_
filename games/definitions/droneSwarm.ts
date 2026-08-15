import type { GameDefinition } from "../types";
export const droneSwarmDefinition: GameDefinition = {
  id: "drone-swarm",
  slug: "drone-swarm",
  name: "Drone Swarm",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1986,
  tags: ["Boids", "Flocking", "Drone Swarm", "Shooter"],
  tagline: "Survive coordinated enemy drone swarms driven by Reynolds flocking algorithms.",
  description:
    "Battle intelligent autonomous drone swarms executing emergent separation, cohesion, and pursuit behaviors.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/drone-swarm.png",
    alt: "Drone Swarm Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrow Keys", description: "Maneuver Defense Core" },
      { key: "SPACE", description: "Fire 4-Way Cross Pulse" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch to move, tap pulse button to fire radial burst.",
  },
  seo: {
    title: "Drone Swarm — Reynolds Boids Flocking Emergence Shooter",
    description: "Multi-agent autonomous drone swarm survival game powered by Reynolds flocking rules.",
    keywords: ["drone swarm", "boids flocking", "emergent ai", "arcade shooter"],
  },
  math: {
    title: "Craig Reynolds Boids Flocking Model",
    summary: "\\vec{a} = w_s \\vec{F}_{\\text{separation}} + w_a \\vec{F}_{\\text{alignment}} + w_c \\vec{F}_{\\text{cohesion}} + w_p \\vec{F}_{\\text{pursuit}}.",
    concepts: [
      { name: "Separation Vector", description: "\\vec{F}_s = \\sum_{j \\neq i} \\frac{\\vec{p}_i - \\vec{p}_j}{\\|\\vec{p}_i - \\vec{p}_j\\|^2}." },
      { name: "Cohesion Centroid", description: "\\vec{F}_c = \\frac{1}{N} \\sum_{j} \\vec{p}_j - \\vec{p}_i." },
    ],
  },
  createGame: async () => {
    const { DroneSwarmGame } = await import("../droneSwarm/DroneSwarmGame");
    return new DroneSwarmGame();
  },
};
