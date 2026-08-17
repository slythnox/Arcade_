import type { GameDefinition } from "../types";

export const pixelCircuitDefinition: GameDefinition = {
  id: "pixel-circuit",
  slug: "pixel-circuit",
  name: "Pixel Kart",
  platform: "nes",
  genre: "racing",
  era: "1990s",
  year: 1992,
  tags: ["Kart Racing", "Drifting", "Items", "Multi-Track", "Action"],
  tagline: "Chaotic arcade kart racing with drifting, items, and dynamic circuits.",
  description:
    "Race against rival kart drivers across diverse championship circuits. Master tire grip, slipstreaming, and mini-turbo drift boosts while deploying chaotic weapons like Nitro Cells, Rocket Pods, and Pulse Mines.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "racing",
  estimatedPlayTime: "10-20 min",
  thumbnail: {
    src: "/games/pixelCircuit/thumb.png",
    alt: "Pixel Kart Cartridge",
  },
  controls: {
    keyboard: [
      { key: "WASD / Arrows", description: "Steer & Accelerate Kart" },
      { key: "SPACE / C", description: "Hop & Drift (Mini-Turbo Boost)" },
      { key: "E / F / J", description: "Deploy Held Item" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart / Next Track" },
    ],
    touch: "Use left directional dial to steer and accelerate, tap right A button to hop & drift, tap B to fire items.",
    gamepad: "Left stick to steer, A button to accelerate, B button for item, Right trigger to drift."
  },
  seo: {
    title: "Pixel Kart — Chaotic Retro Arcade Kart Racing",
    description: "Drift into corners, draft in slipstreams, and blast rivals with smart items in Pixel Kart.",
    keywords: ["pixel kart", "kart racing", "drifting", "arcade racer", "retro kart"],
  },
  math: {
    title: "Kinematic Drift & Slipstream Mathematics",
    summary:
      "Kart dynamics decompose velocity into longitudinal (v_parallel) and lateral (v_perp) components. Holding drifts reduces lateral tire grip to charge multi-tier Mini-Turbo impulses.",
    concepts: [
      {
        name: "Drift Decomposition",
        formula: "v_{\\parallel} = (v \\cdot \\hat{t})\\hat{t}, \\quad v_{\\perp} = v - v_{\\parallel}",
        description: "Separates forward traction from sideways tire slip to calculate drift angle and spark accumulation.",
      },
      {
        name: "Mini-Turbo Impulse",
        formula: "v' = v + k\\hat{h}",
        description: "Applies an instantaneous forward velocity surge along the kart heading unit vector upon releasing a drift.",
      },
      {
        name: "Slipstream Drafting",
        formula: "d < d_{\\text{max}} \\land \\hat{v}_A \\cdot \\hat{r}_{AB} > \\cos\\theta_{\\text{draft}}",
        description: "Measures distance and relative heading behind rival karts to trigger aerodynamic acceleration surges.",
      },
    ],
  },
  createGame: async () => {
    const { PixelCircuitGame } = await import("../pixelCircuit/PixelCircuitGame");
    return new PixelCircuitGame();
  },
};
