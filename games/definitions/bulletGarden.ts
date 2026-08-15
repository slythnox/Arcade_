import type { GameDefinition } from "../types";
export const bulletGardenDefinition: GameDefinition = {
  id: "bullet-garden",
  slug: "bullet-garden",
  name: "Bullet Garden",
  platform: "arcade",
  genre: "shooter",
  era: "1990s",
  year: 1997,
  tags: ["Danmaku", "Bullet Hell", "Touhou", "Polar Coordinates", "Shooter"],
  tagline: "Survive intricate polar spiral floral bullet hell patterns with micro-hitbox precision.",
  description:
    "Weave through logarithmic spiral projectile formations and geometric Danmaku blossoms with 4-pixel micro-hitbox precision.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/bullet-garden.png",
    alt: "Bullet Garden Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Precision Micro-Steering" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Drag anywhere to guide micro-hitbox through bullet gaps.",
  },
  seo: {
    title: "Bullet Garden — Danmaku Bullet Hell Polar Spiral Arcade",
    description: "Intense Touhou-inspired Danmaku bullet hell game with logarithmic spiral projectile patterns.",
    keywords: ["danmaku", "bullet hell", "touhou", "spiral bullets", "shmup"],
  },
  math: {
    title: "Polar Coordinate Projectile Spirals",
    summary: "r(\\theta) = a + b \\theta, \\quad \\vec{p}_k(t) = \\vec{p}_{\\text{boss}} + v t \\begin{bmatrix} \\cos(\\omega t + \\frac{2\\pi k}{N}) \\\\ \\sin(\\omega t + \\frac{2\\pi k}{N}) \\end{bmatrix}.",
    concepts: [
      { name: "Archimedean / Fermat Spirals", description: "r = a \\theta^{1/2}." },
      { name: "Micro-Hitbox Graze", description: "\\text{Collision radius } r_{\\text{hitbox}} \\ll r_{\\text{sprite}}." },
    ],
  },
  createGame: async () => {
    const { BulletGardenGame } = await import("../bulletGarden/BulletGardenGame");
    return new BulletGardenGame();
  },
};
