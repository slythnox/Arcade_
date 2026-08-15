import type { GameDefinition } from "../types";
export const orbitalDefinition: GameDefinition = {
  id: "orbital",
  slug: "orbital",
  name: "Orbital",
  platform: "arcade",
  genre: "physics",
  era: "1980s",
  year: 1983,
  tags: ["Gravity", "Orbital Mechanics", "Physics", "Satellite"],
  tagline: "Launch satellite probes into stable gravitational planetary orbits.",
  description:
    "Master gravitational slingshots and orbital velocity vectors by launching satellites around a massive planetary body.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "physics",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/orbital.png",
    alt: "Orbital Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Adjust Launch Trajectory Angle" },
      { key: "↑ ↓ / W S", description: "Adjust Thrust Power" },
      { key: "SPACE", description: "Launch Orbital Probe" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap and drag to aim launch vector.",
  },
  seo: {
    title: "Orbital — Gravitational Slingshot & Keplerian Orbit Physics",
    description: "Launch satellites into stable planetary orbits with Newtonian gravitational mechanics.",
    keywords: ["orbital physics", "gravity game", "newtonian physics", "orbital mechanics"],
  },
  math: {
    title: "Newton's Law of Universal Gravitation",
    summary: "\\vec{F} = -\\frac{G M m}{r^2} \\hat{r}, \\text{Integrated via Euler-Verlet kinematics}.",
    concepts: [
      { name: "Gravitational Acceleration", description: "\\vec{a} = -\\frac{G M}{|\\vec{r}|^3} \\vec{r}." },
      { name: "Circular Orbital Velocity", description: "v_{\\text{orb}} = \\sqrt{\\frac{G M}{r}}." },
    ],
  },
  createGame: async () => {
    const { OrbitalGame } = await import("../orbital/OrbitalGame");
    return new OrbitalGame();
  },
};
