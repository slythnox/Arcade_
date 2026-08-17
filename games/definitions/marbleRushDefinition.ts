import type { GameDefinition } from '../types';
export const marbleRushDefinition: GameDefinition = {
  id: "marbleRush",
  slug: "marble-rush",
  name: "Marble Rush",
  platform: "arcade",
  genre: "puzzle",
  era: "2000s",
  year: 2003,
  tags: ["Match-3", "Marble", "Spiral Rail", "Chain Reaction", "Casual Arcade"],
  tagline: "Aim and fire colored spheres into the rolling spiral chain.",
  description:
    "A 2000s match-3 marble shooter. Rotate your central frog launcher, match 3 or more identical colors in the advancing spiral rail, and trigger chain reactions before the marbles reach the golden skull pit.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "casual",
  estimatedPlayTime: "5-15 min",
  thumbnail: { src: "/games/marbleRush/thumb.png", alt: "Marble Rush" },
  controls: {
    keyboard: [
      { key: "LEFT / RIGHT (or A / D)", description: "Aim Launcher" },
      { key: "SPACE / X", description: "Shoot Marble" },
      { key: "SHIFT / C", description: "Swap Loaded Marble" },
      { key: "R", description: "Restart Level" },
    ],
    touch: "Drag finger or dial to rotate aiming vector, tap right A button to fire sphere, tap B to swap color.",
    gamepad: "Left stick to aim, A button to fire, B button to swap."
  },
  seo: {
    title: "Marble Rush — Spiral Chain Match-3 Puzzle",
    description: "Blast colored marble chains along continuous parametric curves in Marble Rush.",
    keywords: ["marble rush", "zuma arcade", "marble shooter", "match 3 puzzle", "chain reaction game"]
  },
  math: {
    title: "Parametric Spiral Rails & Topological Insertion",
    summary: "\\mathbf{C}(s) = (x(s), y(s)), \\quad \\operatorname{Insert}(i, \\text{sphere}) \\implies s_{j} \\gets s_j + 2r \\; (\\forall j > i).",
    concepts: [
      { name: "Arc-Length Parametrization", description: "Marbles advance along fixed equidistant arc-length offsets on spline curves." },
      { name: "Topological Contiguity", description: "Chain reaction search evaluates consecutive matched color runs upon collision insertion." }
    ]
  },
  createGame: async () => {
    const { MarbleRushGame } = await import("../marbleRush/MarbleRushGame");
    return new MarbleRushGame();
  }
};
