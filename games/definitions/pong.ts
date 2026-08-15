import type { GameDefinition } from "../types";
export const pongDefinition: GameDefinition = {
  id: "pong",
  slug: "pong",
  name: "Pong",
  platform: "arcade",
  genre: "arcade",
  era: "1970s",
  year: 1972,
  tags: ["classic", "retro", "2-player", "reflex", "physics"],
  tagline: "The origin of video games. Table tennis in illuminated monochrome.",
  description:
    "Engage in timeless table tennis combat against an adaptive AI opponent. Features spin reflection angles, increasing rally acceleration, and authentic 1970s arcade audio tones.",
  difficulty: "medium",
  players: "1-2 players",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "3–6 min",
  thumbnail: {
    src: "/games/pong/thumb.png",
    alt: "Pong Cartridge",
  },
  controls: {
    keyboard: [
      { key: "↑ / ↓ / W / S", description: "Move Paddle Up / Down" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "On-screen Up/Down buttons",
    gamepad: "Left Analog Stick / D-Pad Up and Down",
  },
  seo: {
    title: "Play Pong Online — Authentic 1972 Arcade Classic",
    description:
      "Play classic Pong online with responsive paddle physics, spin deflection, adaptive AI opponent, and retro arcade sounds.",
    keywords: ["pong online", "classic pong", "arcade pong", "retro tennis game"],
  },
  math: {
    title: "Mathematics & Mechanics of Pong",
    summary:
      "Pong demonstrates 1D boundary kinematics, angular deflection mapping, and rally velocity acceleration.",
    concepts: [
      {
        name: "Angular Deflection Mapping",
        description:
          "The contact point on the paddle determines the exit velocity angle: hitting near paddle tips imparts high angular deflection (up to ±50°), whereas center hits return flatter horizontal trajectories.",
      },
      {
        name: "Kinematic Acceleration",
        description:
          "With each successive paddle return, ball velocity magnitude increments dynamically: v_{n+1} = v_n + \\Delta v, increasing intensity as rallies progress.",
      },
    ],
  },
  createGame: async () => {
    const { PongGame } = await import("../pong/PongGame");
    return new PongGame();
  },
};
