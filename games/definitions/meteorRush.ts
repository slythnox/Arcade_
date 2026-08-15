import { GameDefinition } from "../types";
export const meteorRushDefinition: GameDefinition = {
  id: "meteor-rush",
  slug: "meteor-rush",
  name: "Meteor Rush",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1983,
  tags: ["Perimeter Defense", "Shooter", "Orbit", "Action"],
  tagline: "Rotate around planetary defense perimeters to destroy incoming meteors.",
  description:
    "Defend a planetary station by rotating rapid-fire orbital defense turrets across 360 degrees to blast converging meteors.",
  difficulty: "medium",
  players: "single",
  category: "labs",
  subcategory: "experimental",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/meteor-rush.png",
    alt: "Meteor Rush Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Rotate Planetary Turret" },
      { key: "SPACE", description: "Fire Radial Defense Cannon" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap left/right to rotate turret, tap FIRE to blast.",
  },
  seo: {
    title: "Meteor Rush — 360-Degree Radial Planetary Defense",
    description: "Perimeter planetary defense shooter with circular coordinate aiming.",
    keywords: ["meteor rush", "planetary defense", "radial shooter", "perimeter defense"],
  },
  math: {
    title: "Radial Interception & Convergent Vectors",
    summary: "\\vec{p}(t) = \\vec{p}_0 + v t \\begin{bmatrix} \\cos(\\phi) \\\\ \\sin(\\phi) \\end{bmatrix}, \\text{Radial angular convergence}.",
    concepts: [
      { name: "Polar Trajectory Alignment", description: "\\theta_{\\text{turret}} = \\text{atan2}(y - y_c, x - x_c)." },
    ],
  },
  createGame: async () => {
    const { MeteorRushGame } = await import("../meteorRush/MeteorRushGame");
    return new MeteorRushGame();
  },
};
