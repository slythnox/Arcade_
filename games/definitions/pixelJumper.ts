import { GameDefinition } from "../types";
export const pixelJumperDefinition: GameDefinition = {
  id: "pixel-jumper",
  slug: "pixel-jumper",
  name: "Pixel Jumper",
  platform: "arcade",
  genre: "platformer",
  era: "2000s",
  year: 2009,
  tags: ["Doodle Jump", "Platformer", "Infinite Ascender", "Action"],
  tagline: "Bounce infinitely upward across procedurally ascending spring platforms.",
  description:
    "Steer an auto-jumping character across an infinite vertical cascade of platforms with toroidal wrap mechanics.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/pixel-jumper.png",
    alt: "Pixel Jumper Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Steer Jumper Horizontally" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tilt or touch left/right to steer jumper.",
  },
  seo: {
    title: "Pixel Jumper — Infinite Vertical Platform Ascender",
    description: "Endless platform jumping arcade game inspired by Doodle Jump and Icy Tower.",
    keywords: ["pixel jumper", "doodle jump", "icy tower", "infinite jumper"],
  },
  math: {
    title: "One-Way Platform Collision & Toroidal Bounds",
    summary: "v_y > 0 \\land y_{\\text{player}} \\in [y_p - \\epsilon, y_p + \\delta] \\implies v_y' = -v_{\\text{jump}}.",
    concepts: [
      { name: "One-Way Impulse", description: "\\text{Collision resolved strictly on downward falling vector}." },
      { name: "Camera Relative Scrolling", description: "y_{\\text{cam}} = \\min(y_{\\text{cam}}, y_{\\text{player}} - h_{\\text{offset}})." },
    ],
  },
  createGame: async () => {
    const { PixelJumperGame } = await import("../pixelJumper/PixelJumperGame");
    return new PixelJumperGame();
  },
};
