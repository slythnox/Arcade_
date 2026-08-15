import { GameDefinition } from "../types";
import { GravityFlipGame } from "../gravityFlip/GravityFlipGame";

export const gravityFlipDefinition: GameDefinition = {
  id: "gravity-flip",
  slug: "gravity-flip",
  name: "Gravity Flip",
  platform: "arcade",
  genre: "action",
  era: "2000s",
  year: 2010,
  tags: ["Gravity", "Runner", "VVVVVV", "Kinematics", "Action"],
  tagline: "Invert gravity instantaneously to sprint across floors and ceilings.",
  description:
    "Sprint through an infinite obstacle course by flipping your gravitational acceleration vector between floor and ceiling.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/gravity-flip.png",
    alt: "Gravity Flip Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "SPACE / ↑", description: "Flip Gravitational Vector" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere on screen to flip gravity.",
  },
  seo: {
    title: "Gravity Flip — High-Speed Gravity Inversion Runner",
    description: "High-reflex runner game flipping vertical gravitational acceleration vectors.",
    keywords: ["gravity flip", "vvvvvv", "gravity runner", "arcade reflex"],
  },
  math: {
    title: "Instantaneous Gravitational Inversion",
    summary: "\\vec{g}' = -\\vec{g}, \\text{Discrete kinematic state transitions with AABB collision bounds}.",
    concepts: [
      { name: "Sign Inversion", description: "a_y = g \\cdot \\text{sgn}(D), D \\in \\{-1, +1\\}." },
    ],
  },
  createGame: () => new GravityFlipGame(),
};
