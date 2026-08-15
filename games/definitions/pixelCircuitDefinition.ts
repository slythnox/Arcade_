import { GameDefinition } from "../types";

export const pixelCircuitDefinition: GameDefinition = {
  id: "pixel-circuit",
  slug: "pixel-circuit",
  name: "Pixel Circuit",
  platform: "nes",
  genre: "racing",
  era: "1990s",
  year: 1992,
  tags: ["racing", "kart", "top-down", "drifting"],
  tagline: "Top-down kart racer with drift mechanics.",
  description:
    "Race against 3 AI opponents across 4 challenging spline-based tracks. Master drifting for speed boosts and use items to secure 1st place.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "racing",
  estimatedPlayTime: "10-20 min",
  thumbnail: {
    src: "/games/pixelCircuit/thumb.png",
    alt: "Pixel Circuit Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← / → / A / D", description: "Steer Kart" },
      { key: "↑ / W", description: "Accelerate" },
      { key: "↓ / S", description: "Brake / Drift" },
      { key: "SPACE", description: "Use Item" },
    ],
  },
  seo: {
    title: "Play Pixel Circuit — Retro Kart Racing",
    description: "Drift your way to victory in this fast-paced top-down kart racer.",
  },
  math: {
    title: "Racing Physics",
    summary: "Kart physics uses velocity and angular steering based on splines.",
    concepts: [],
  },
  createGame: async () => {
    const { PixelCircuitGame } = await import("../pixelCircuit/PixelCircuitGame");
    return new PixelCircuitGame();
  },
};
