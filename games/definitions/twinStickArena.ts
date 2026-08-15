import type { GameDefinition } from "../types";
export const twinStickArenaDefinition: GameDefinition = {
  id: "twin-stick-arena",
  slug: "twin-stick-arena",
  name: "Twin Stick Arena",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1982,
  tags: ["Robotron", "Twin-Stick", "Arena Shooter", "Action"],
  tagline: "Move freely in 8 directions while aiming 360-degree rapid laser fire.",
  description:
    "Survive enclosed gladiatorial arenas by destroying swarms of homing enemies with 360-degree twin-stick mechanics.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/twin-stick-arena.png",
    alt: "Twin Stick Arena Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrow Keys", description: "Maneuver Hero Across Arena" },
      { key: "SPACE", description: "Rotate 360° Aim Reticle" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Dual virtual analog thumbsticks for movement and firing.",
  },
  seo: {
    title: "Twin Stick Arena — 360-Degree Retro Arcade Shooter",
    description: "Top-down arena survival shooter inspired by Robotron and Geometry Wars.",
    keywords: ["twin stick", "arena shooter", "robotron", "geometry wars"],
  },
  math: {
    title: "Pursuit Vector Kinematics & 2D Steering",
    summary: "\\vec{v}_{\\text{enemy}} = s \\cdot \\frac{\\vec{p}_{\\text{player}} - \\vec{p}_{\\text{enemy}}}{|\\vec{p}_{\\text{player}} - \\vec{p}_{\\text{enemy}}|}.",
    concepts: [
      { name: "Unit Homing Vector", description: "\\hat{u} = \\frac{\\vec{\\Delta r}}{\\|\\vec{\\Delta r}\\|}." },
    ],
  },
  createGame: async () => {
    const { TwinStickArenaGame } = await import("../twinStickArena/TwinStickArenaGame");
    return new TwinStickArenaGame();
  },
};
