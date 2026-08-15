import { GameDefinition } from "../types";
export const breakoutDefinition: GameDefinition = {
  id: "breakout",
  slug: "breakout",
  name: "Breakout",
  platform: "arcade",
  genre: "physics",
  era: "1970s",
  year: 1976,
  tags: ["physics", "vectors", "reflection", "arcade", "reflex"],
  tagline: "Shatter colorful brick formations with vector deflection physics.",
  description:
    "Deflect a high-speed ball using an adjustable paddle to demolish brick walls. Features continuous vector reflection mathematics, variable angle strikes, multi-tier scoring, and progressive difficulty.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "5–12 min",
  thumbnail: {
    src: "/games/breakout/thumb.png",
    alt: "Breakout Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← / → / A / D", description: "Move Paddle Left / Right" },
      { key: "SPACE / X", description: "Launch Ball / Release" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "On-screen Left/Right arrows + Launch button",
    gamepad: "Left Analog Stick / D-Pad + A Button to Launch",
  },
  seo: {
    title: "Play Breakout Online — Classic Retro Brick Breaker",
    description:
      "Play classic Breakout online with real 2D vector physics, strike-angle deflection, brick destruction, and high score progression.",
    keywords: ["breakout game", "brick breaker", "retro breakout", "vector reflection game"],
  },
  math: {
    title: "Mathematics & Mechanics of Breakout",
    summary:
      "Breakout showcases 2D vector mechanics, specular reflections, AABB-circle intersection tests, and paddle deflection angles.",
    concepts: [
      {
        name: "Vector Reflection Off Surface Normals",
        description:
          "When hitting court boundaries, the velocity vector is reflected across the surface normal N using the standard formula R = V - 2(V · N)N.",
        formula: "\\mathbf{R} = \\mathbf{V} - 2(\\mathbf{V} \\cdot \\mathbf{N})\\mathbf{N}",
      },
      {
        name: "Variable Paddle Strike Deflection",
        description:
          "Rather than simple mirror reflection, the reflection angle θ is a linear mapping of normalized offset from paddle center: offset = (x_{ball} - x_{center}) / (width / 2).",
        formula: "\\theta = \\text{offset} \\times 60^\\circ, \\quad \\mathbf{V} = (s\\sin\\theta, -s\\cos\\theta)",
      },
      {
        name: "Circle-to-AABB Swept Collision",
        description:
          "Intersection tests compute the closest point on the axis-aligned brick bounding box to the circle center, resolving contact normals for clean bounce dynamics.",
      },
    ],
  },
  createGame: async () => {
    const { BreakoutGame } = await import("../breakout/BreakoutGame");
    return new BreakoutGame();
  },
};
