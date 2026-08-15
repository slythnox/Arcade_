import { GameDefinition } from "../types";
import { LadderClimbGame } from "../ladderClimb/LadderClimbGame";

export const ladderClimbDefinition: GameDefinition = {
  id: "ladder-climb",
  slug: "ladder-climb",
  name: "Ladder Climb",
  platform: "arcade",
  genre: "platformer",
  era: "1980s",
  year: 1981,
  tags: ["Donkey Kong", "Ladders", "Platformer", "Action"],
  tagline: "Climb tiered scaffolding and ladders while dodging rolling obstacle barrels.",
  description:
    "Ascend multi-tier industrial scaffolding by climbing vertical ladders and timing hops over rolling barrels.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/ladder-climb.png",
    alt: "Ladder Climb Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Run and Climb Scaffolding Ladders" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch D-Pad to run and climb ladders.",
  },
  seo: {
    title: "Ladder Climb — Classic Scaffolding Ladder Platformer",
    description: "Multi-tier ladder climbing platformer dodging rolling obstacle barrels.",
    keywords: ["ladder climb", "donkey kong", "platformer", "lode runner"],
  },
  math: {
    title: "Tiered Grid Snap & Ladder State Intersections",
    summary: "\\text{If } |x - x_{\\text{ladder}}| \\le \\delta \\implies \\text{Switch to 1D vertical ladder axis}.",
    concepts: [
      { name: "Zigzag Tier Descent", description: "v_x = \\text{dir} \\cdot s, \\text{ upon reaching edge } y \\leftarrow y_{\\text{lower}}." },
    ],
  },
  createGame: () => new LadderClimbGame(),
};
