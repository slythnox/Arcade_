import type { GameDefinition } from "../../games/types";

export const pixelBrawlDefinition: GameDefinition = {
  id: "pixel-brawl",
  slug: "pixel-brawl",
  name: "Pixel Brawl",
  platform: "arcade",
  genre: "fighting",
  era: "1990s",
  year: 1991,
  tags: ["Fighting", "Brawler", "2D Combat", "Frame Data", "Hitboxes", "Arcade"],
  description:
    "A 1990s head-to-head fighting game. Master frame data, execute high/low attacks, cancel into special moves, and deplete your opponent's health bar in best-of-three round combat.",
  tagline: "Head-to-head arcade fighting with frame-perfect hitboxes.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "fighting",
  estimatedPlayTime: "5-10 min",
  thumbnail: { src: "/games/pixelBrawl/thumb.png", alt: "Pixel Brawl" },
  controls: {
    keyboard: [
      { key: "A / D (or LEFT / RIGHT)", description: "Move Forward / Retreat (Block)" },
      { key: "W / UP", description: "Jump" },
      { key: "S / DOWN", description: "Crouch Guard" },
      { key: "SPACE / Z", description: "Light Punch (Jab)" },
      { key: "X / SHIFT", description: "Heavy Kick (Roundhouse)" },
      { key: "C", description: "Special Surge Wave (Hadouken)" },
      { key: "P", description: "Pause" },
      { key: "R", description: "Restart Match" },
    ],
    touch: "Use left directional dial for walking/guarding, tap A for Light Punch, B for Heavy Kick, ROT for Special Surge Wave.",
    gamepad: "D-pad to move, A for Light Punch, B for Heavy Kick, X for Special Surge Wave."
  },
  seo: {
    title: "Pixel Brawl — 2D Arcade Fighting Game",
    description: "Play Pixel Brawl, a retro 1990s head-to-head fighting game with frame data and hitbox combat systems.",
    keywords: ["pixel brawl", "street fighter arcade", "2d fighting game", "hitbox combat", "retro brawler"]
  },
  math: {
    title: "Frame Data & Hitbox Disjoint Intersection",
    summary: "\\text{Hit}(\\text{Atk}, \\text{Def}) = \\operatorname{AABB}(\\text{Hitbox}_{\\text{active}}, \\text{Hurtbox}_{\\text{defender}}).",
    concepts: [
      { name: "Frame Window Windows", description: "Startup, active, and recovery animation frames defining attack priority." },
      { name: "Knockback Impulse Vectors", description: "Linear momentum transfer scaled by attack severity and guard state." }
    ]
  },
  createGame: async () => {
    const { PixelBrawlGame } = await import("../pixelBrawl/PixelBrawlGame");
    return new PixelBrawlGame();
  }
};
