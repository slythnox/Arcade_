import { GameDefinition } from "../types";
import { SpaceDefenderGame } from "../spaceDefender/SpaceDefenderGame";

export const spaceDefenderDefinition: GameDefinition = {
  id: "space-defender",
  slug: "space-defender",
  name: "Space Defender",
  platform: "arcade",
  genre: "shooter",
  era: "1970s",
  year: 1978,
  tags: ["Space", "Shooter", "Waves", "Classic"],
  tagline: "Shoot descending waves of alien invaders before they reach Earth.",
  description:
    "Defend Earth from continuous descending waves of alien formations with laser cannons and directional evasion.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/space-defender.png",
    alt: "Space Defender Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Move Defense Cannon" },
      { key: "SPACE", description: "Fire Laser Projectile" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch left/right buttons to navigate, tap FIRE to shoot.",
  },
  seo: {
    title: "Space Defender — Retro Wave Shooter",
    description: "Play classic Space Defender with wave formations and projectile physics.",
    keywords: ["space invaders", "retro shooter", "arcade shooter", "canvas game"],
  },
  math: {
    title: "Wave Kinematics & Projectile Interception",
    summary: "Discrete formation pacing, speed ramp curves, and bounding box AABB projectile collisions.",
    concepts: [
      { name: "Step Down Logic", description: "Edge boundary check flips horizontal direction vector while stepping down Y." },
      { name: "AABB Bullet Hitbox", description: "Point-to-box collision: |x_bullet - x_alien| < width / 2." },
    ],
  },
  createGame: () => new SpaceDefenderGame(),
};
