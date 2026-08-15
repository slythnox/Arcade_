import { GameDefinition } from "../types";
export const oneButtonJumpDefinition: GameDefinition = {
  id: "one-button-jump",
  slug: "one-button-jump",
  name: "One Button Jump",
  platform: "handheld",
  genre: "platformer",
  era: "2000s",
  year: 2007,
  tags: ["One Button", "Rhythm", "Precision Jump", "Action"],
  tagline: "Single-button deterministic timing precision obstacle jumper.",
  description:
    "Test pure reflex timing with a minimalist single-button obstacle jumper running across hazard terrain.",
  difficulty: "medium",
  players: "single",
  category: "labs",
  subcategory: "experimental",
  estimatedPlayTime: "2-5 min",
  thumbnail: {
    src: "/assets/thumbnails/one-button-jump.png",
    alt: "One Button Jump Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Precision Jump" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere on screen to jump.",
  },
  seo: {
    title: "One Button Jump — Minimalist Rhythm Reflex Jumper",
    description: "Single-button obstacle jumper test of pure rhythmic reaction timing.",
    keywords: ["one button jump", "minimalist runner", "rhythm jumper", "reflex game"],
  },
  math: {
    title: "Single-Degree-of-Freedom Kinematic State Machine",
    summary: "y(t) = y_0 + v_0 t - \\frac{1}{2} g t^2, \\quad \\Delta t_{\\text{window}} = \\frac{w_{\\text{hazard}}}{v_{\\text{scroll}}}.",
    concepts: [
      { name: "Jump Timing Tolerance", description: "\\text{Human reaction window } \\Delta t \\approx 180\\text{ms}." },
    ],
  },
  createGame: async () => {
    const { OneButtonJumpGame } = await import("../oneButtonJump/OneButtonJumpGame");
    return new OneButtonJumpGame();
  },
};
