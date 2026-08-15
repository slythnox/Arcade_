import { GameDefinition } from "../types";
import { CannonballGame } from "../cannonball/CannonballGame";

export const cannonballDefinition: GameDefinition = {
  id: "cannonball",
  slug: "cannonball",
  name: "Cannonball",
  platform: "arcade",
  genre: "physics",
  era: "1970s",
  year: 1976,
  tags: ["Artillery", "Ballistics", "Parabola", "Physics"],
  tagline: "Adjust launch angle and muzzle velocity to strike distant targets under variable wind.",
  description:
    "Solve classic 2D ballistic kinematics equations to hit targets with quadratic parabolic projectile trajectories.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/cannonball.png",
    alt: "Cannonball Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Adjust Muzzle Elevation Angle" },
      { key: "↑ ↓ / W S", description: "Adjust Gunpowder Charge / Velocity" },
      { key: "SPACE", description: "Fire Ballistic Artillery Round" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap and drag to adjust angle and velocity, tap FIRE to launch.",
  },
  seo: {
    title: "Cannonball — Ballistic Kinematics & Parabolic Trajectory",
    description: "Artillery ballistics arcade game with gravity, velocity vectors, and wind drift.",
    keywords: ["artillery", "cannonball", "ballistics physics", "parabolic trajectory"],
  },
  math: {
    title: "Parabolic Projectile Motion",
    summary: "y(x) = x \\tan(\\theta) - \\frac{g x^2}{2 v_0^2 \\cos^2(\\theta)}, \\text{Integrated with horizontal wind drag}.",
    concepts: [
      { name: "Kinematic Range Equation", description: "R = \\frac{v_0^2 \\sin(2\\theta)}{g}." },
      { name: "Peak Altitude", description: "H = \\frac{v_0^2 \\sin^2(\\theta)}{2g}." },
    ],
  },
  createGame: () => new CannonballGame(),
};
