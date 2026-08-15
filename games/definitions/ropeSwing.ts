import type { GameDefinition } from "../types";
export const ropeSwingDefinition: GameDefinition = {
  id: "rope-swing",
  slug: "rope-swing",
  name: "Rope Swing",
  platform: "arcade",
  genre: "physics",
  era: "2000s",
  year: 2005,
  tags: ["Rope Swing", "Pendulum", "Momentum", "Physics"],
  tagline: "Attach tension ropes to anchor points and release at peak angular velocity.",
  description:
    "Swing across an infinite chasm by anchoring ropes to overhead grapple points and conserving angular kinetic momentum.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "physics",
  estimatedPlayTime: "3-6 min",
  thumbnail: {
    src: "/assets/thumbnails/rope-swing.png",
    alt: "Rope Swing Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Attach / Release Rope" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap and hold to attach rope, release to swing free.",
  },
  seo: {
    title: "Rope Swing — Pendulum Physics & Angular Momentum",
    description: "Endless rope swinging physics game with rigid constraint mechanics.",
    keywords: ["rope swing", "pendulum physics", "grapple game", "momentum arcade"],
  },
  math: {
    title: "Constrained Pendulum Dynamics",
    summary: "\\vec{v}_{\\text{tangent}} = \\vec{v} - (\\vec{v} \\cdot \\hat{n}) \\hat{n}, \\text{Conserving tangential kinetic energy}.",
    concepts: [
      { name: "Constraint Projection", description: "\\vec{p}_{\\text{corrected}} = \\vec{p}_{\\text{anchor}} + L \\hat{n}." },
      { name: "Centripetal Tension", description: "T = m g \\cos(\\theta) + \\frac{m v^2}{L}." },
    ],
  },
  createGame: async () => {
    const { RopeSwingGame } = await import("../ropeSwing/RopeSwingGame");
    return new RopeSwingGame();
  },
};
