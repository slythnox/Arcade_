import { GameDefinition } from "../types";
export const alienSwarmDefinition: GameDefinition = {
  id: "alien-swarm",
  slug: "alien-swarm",
  name: "Alien Swarm",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1981,
  tags: ["Galaga", "Formation Flight", "Space Shooter", "Swoop"],
  tagline: "Enemy formations break pattern and dive directly at your ship.",
  description:
    "Intercept dynamic swooping alien attack waves with rapid-fire lasers and reflex evasion.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/alien-swarm.png",
    alt: "Alien Swarm Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Maneuver Fighter" },
      { key: "SPACE", description: "Fire Twin Lasers" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch left/right to move, tap FIRE to launch lasers.",
  },
  seo: {
    title: "Alien Swarm — Swooping Flight Formation Shooter",
    description: "Play classic Alien Swarm arcade game with parametric swoop dive curves.",
    keywords: ["galaga", "alien swarm", "arcade shooter", "retro canvas"],
  },
  math: {
    title: "Swoop Dive Parametrics & Interception",
    summary: "Harmonic formation breathing and cubic Bezier swoop trajectory curves.",
    concepts: [
      { name: "Harmonic Swarm Oscillation", description: "x(t) = x_0 + A \\sin(\\omega t + \\phi)." },
      { name: "Dive Trajectory", description: "x(t) = x_0 + A \\sin(k t), y(t) = y_0 + v_y t." },
    ],
  },
  createGame: async () => {
    const { AlienSwarmGame } = await import("../alienSwarm/AlienSwarmGame");
    return new AlienSwarmGame();
  },
};
