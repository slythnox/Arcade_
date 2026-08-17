import type { GameDefinition } from "../types";

export const starFormationDefinition: GameDefinition = {
  id: "starFormation",
  slug: "star-formation",
  name: "Rail Storm",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1981,
  tags: ["Train Battle", "Sky Fighter", "Aerial Strike", "Action"],
  description: "Aerial sky strike against an armored villain battle train racing along river railways with flak cannons, SAM missiles, and mortar artillery.",
  tagline: "Aerial fighter vs armored villain battle train racing on river tracks.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "10 min",
  thumbnail: {
    src: "/games/starFormation/thumb.png",
    alt: "Rail Storm Arcade",
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrows", description: "Maneuver Starfighter" },
      { key: "SPACE", description: "Twin Photon Lasers" },
      { key: "X", description: "Drop Heavy Bomb" },
      { key: "C", description: "Barrel Roll Evasion" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Use left dial to steer the starfighter, tap A to fire lasers, tap B to drop bombs, tap ROT to barrel roll.",
    gamepad: "Left stick to fly, A button to fire lasers, B button to drop bombs, X button for barrel roll."
  },
  seo: {
    title: "Rail Storm — Aerial Strike vs Armored Villain Train",
    description: "Engage the heavily armored villain battle train from the sky with photon lasers and bomb drops.",
    keywords: ["rail storm", "train battle", "aerial shooter", "arcade shooter"],
  },
  math: {
    title: "Curves & Formations",
    summary: "Sine waves and bounding boxes.",
    concepts: [
      {
        name: "Parametric Curves",
        description: "Diving enemies use sine waves to create swooping flight paths.",
      }
    ],
  },
  createGame: async () => {
    const { StarFormationGame } = await import("../starFormation/StarFormationGame");
    return new StarFormationGame();
  },
};
