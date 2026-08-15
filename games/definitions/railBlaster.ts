import { GameDefinition } from "../types";
export const railBlasterDefinition: GameDefinition = {
  id: "rail-blaster",
  slug: "rail-blaster",
  name: "Rail Blaster",
  platform: "arcade",
  genre: "shooter",
  era: "1990s",
  year: 1994,
  tags: ["Light Gun", "Rail Shooter", "Crosshair", "Action"],
  tagline: "Blast rapid popup hostile targets before their detonation countdown expires.",
  description:
    "Test optical reflex speed by steering a high-speed crosshair reticle to eliminate emerging targets before detonation.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "3-6 min",
  thumbnail: {
    src: "/assets/thumbnails/rail-blaster.png",
    alt: "Rail Blaster Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Steer Crosshair Reticle" },
      { key: "SPACE", description: "Trigger Rail Blaster" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap directly on targets to fire.",
  },
  seo: {
    title: "Rail Blaster — Arcade Light Gun Crosshair Shooter",
    description: "Light gun style fast crosshair reaction shooter with combo multipliers.",
    keywords: ["rail blaster", "light gun", "crosshair shooter", "reaction game"],
  },
  math: {
    title: "Point-to-Circle Intersection & Decay Timers",
    summary: "\\|\\vec{p}_{\\text{reticle}} - \\vec{p}_{\\text{target}}\\| < r_{\\text{target}}, \\text{with linear timer decay } \\tau(t) = \\tau_0 - t.",
    concepts: [
      { name: "Hitbox Circle Radius", description: "d \\le r_{\\text{hit}}." },
      { name: "Exponential Combo Scaling", description: "S = 200 \\times 2^{c-1}." },
    ],
  },
  createGame: async () => {
    const { RailBlasterGame } = await import("../railBlaster/RailBlasterGame");
    return new RailBlasterGame();
  },
};
