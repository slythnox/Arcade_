import type { GameDefinition } from '../types';
export const velocityRushDefinition: GameDefinition = {
  id: "velocityRush",
  slug: "velocity-rush",
  name: "Velocity Rush",
  platform: "nes",
  genre: "platformer",
  era: "1990s",
  year: 1991,
  tags: ["Platformer", "Momentum", "Speedrun", "Physics", "NES"],
  tagline: "High-speed momentum-based platforming through looping obstacle courses.",
  description:
    "A 1990s momentum platformer. Build exponential running speed, maintain forward velocity across undulating terrain, and execute high-speed spin jumps past hazard barriers.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "5-15 min",
  thumbnail: { src: "/games/velocityRush/thumb.png", alt: "Velocity Rush" },
  controls: {
    keyboard: [
      { key: "LEFT / A", description: "Accelerate Left" },
      { key: "RIGHT / D", description: "Accelerate Right" },
      { key: "SPACE / UP / W", description: "Momentum Jump" },
      { key: "DOWN / S", description: "Crouch / Spin Roll" },
      { key: "R", description: "Restart Level" },
    ],
    touch: "Use left directional dial to steer and build speed, tap right A button to jump.",
    gamepad: "Left stick to run, A button to jump, B button to roll."
  },
  seo: {
    title: "Velocity Rush — Momentum Platformer",
    description: "Experience 1990s high-velocity platforming physics with momentum conservation and slope acceleration.",
    keywords: ["velocity rush", "sonic platformer", "momentum physics", "retro speedrun", "canvas platformer"]
  },
  math: {
    title: "Momentum & Slope Acceleration Kinematics",
    summary: "v_{t+1} = v_t + (a_{\\text{input}} + g \\sin\\theta - \\mu v_t) \\Delta t.",
    concepts: [
      { name: "Slope Projection", description: "Gravity decomposition accelerating the character along inclined tangent vectors." },
      { name: "Variable Jump Curve", description: "Early jump release dampens upward velocity by 50% for fine-grained air control." }
    ]
  },
  createGame: async () => {
    const { VelocityRushGame } = await import("../velocityRush/VelocityRushGame");
    return new VelocityRushGame();
  }
};
