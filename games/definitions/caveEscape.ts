import { GameDefinition } from "../types";
export const caveEscapeDefinition: GameDefinition = {
  id: "cave-escape",
  slug: "cave-escape",
  name: "Cave Escape",
  platform: "arcade",
  genre: "platformer",
  era: "1990s",
  year: 1998,
  tags: ["Helicopter", "Cave", "Procedural Terrain", "Action"],
  tagline: "Navigate an infinite narrow cavern generated with undulating procedural terrain.",
  description:
    "Control a thrust-powered craft through a continuously undulating procedural cavern without colliding with ceilings or floors.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "3-6 min",
  thumbnail: {
    src: "/assets/thumbnails/cave-escape.png",
    alt: "Cave Escape Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "SPACE / ↑", description: "Hold to Engage Upward Thrust" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Press and hold screen to thrust upward, release to fall.",
  },
  seo: {
    title: "Cave Escape — Procedural Cavern Helicopter Flight",
    description: "Classic helicopter cave navigation game with continuous undulating heightmaps.",
    keywords: ["cave escape", "helicopter game", "flappy cave", "procedural terrain"],
  },
  math: {
    title: "Procedural Terrain Heightmaps & Thrust Dynamics",
    summary: "h_{\\text{top}}(x) = h_0 + \\sum A_i \\sin(\\omega_i x + \\phi_i), \\quad h_{\\text{bottom}}(x) = h_{\\text{top}}(x) + G(x).",
    concepts: [
      { name: "Continuous Gap Interpolation", description: "\\text{Height differential clamped to human reaction latency windows}." },
    ],
  },
  createGame: async () => {
    const { CaveEscapeGame } = await import("../caveEscape/CaveEscapeGame");
    return new CaveEscapeGame();
  },
};
