import type { GameDefinition } from "../types";
export const ballDropDefinition: GameDefinition = {
  id: "ball-drop",
  slug: "ball-drop",
  name: "Ball Drop",
  platform: "arcade",
  genre: "physics",
  era: "1990s",
  year: 1999,
  tags: ["Fall Down", "Gravity", "Reflex", "Physics"],
  tagline: "Guide a free-falling ball through rising floor gaps without getting crushed.",
  description:
    "Steer a falling ball through opening gaps in ascending floor platforms to survive as scroll speeds ramp up.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "physics",
  estimatedPlayTime: "3-6 min",
  thumbnail: {
    src: "/assets/thumbnails/ball-drop.png",
    alt: "Ball Drop Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Steer Falling Ball" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch left/right sides of screen to steer ball.",
  },
  seo: {
    title: "Ball Drop — Rapid Descent Gravity Obstacle Arcade",
    description: "Classic vertical falling ball reflex game with ascending floor gaps.",
    keywords: ["fall down", "ball drop", "gravity arcade", "reflex game"],
  },
  math: {
    title: "Free-Fall Kinematics & Platform Restitution",
    summary: "Vertical kinematic acceleration: y_{t+1} = y_t + v_y \\Delta t + \\frac{1}{2} g \\Delta t^2.",
    concepts: [
      { name: "Continuous Collision Check", description: "\\text{Interval gap test } x_{\\text{ball}} \\notin [x_{\\text{gap}}, x_{\\text{gap}} + w_{\\text{gap}}] \\implies \\text{rest on platform}." },
    ],
  },
  createGame: async () => {
    const { BallDropGame } = await import("../ballDrop/BallDropGame");
    return new BallDropGame();
  },
};
