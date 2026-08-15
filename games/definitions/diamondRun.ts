import type { GameDefinition } from "../types";

export const diamondRunDefinition: GameDefinition = {
  id: "diamond-run",
  slug: "diamond-run",
  name: "Diamond Run",
  platform: "handheld",
  genre: "platformer",
  era: "2000s",
  year: 2008,
  tags: ["platformer", "puzzle", "mobile-classics", "diamonds", "temple"],
  tagline: "Explore 25 ancient temple levels, collect gems, unlock key gates, and conquer the Guardian's Vault.",
  description:
    "An original 2000s Java/feature-phone era inspired action-platformer and exploration puzzle. Explore 25 handcrafted temple levels, collect gems, unlock key gates, avoid deadly lava and spike traps, and conquer the Guardian's Vault.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "15–30 min",
  thumbnail: {
    src: "/games/diamond-run/thumb.png",
    alt: "Diamond Run Cartridge",
  },
  controls: {
    keyboard: [
      { key: "← / → / A / D", description: "Move Left / Right" },
      { key: "SPACE / Z / ↑ / W", description: "Jump / Climb Ladder" },
      { key: "ENTER / Z", description: "Confirm / Menu Select" },
      { key: "R", description: "Restart Level" },
      { key: "M", description: "Toggle Mute" },
    ],
    touch: "On-screen D-Pad + Jump / Action buttons",
    gamepad: "D-Pad Left/Right, A to Jump",
  },
  seo: {
    title: "Diamond Run — 2000s Java Retro Mobile Exploration Platformer",
    description:
      "Play Diamond Run free in browser. Explore 25 handcrafted ancient temple levels, collect diamonds, solve key/switch puzzles, and survive traps.",
    keywords: ["diamond run", "java mobile game", "retro platformer", "temple exploration puzzle"],
  },
  math: {
    title: "Platformer Motion Physics & Camera Lerp",
    summary:
      "Diamond Run implements deterministic kinematic motion with acceleration, damping, gravity, and smoothed camera tracking.",
    concepts: [
      {
        name: "Kinematic Jump & Fall Physics",
        description:
          "Vertical displacement is integrated using fixed-timestep gravity acceleration with coyote time and jump buffering windows.",
        formula: "y(t) = y_0 + v_0 t + \\frac{1}{2}gt^2",
      },
      {
        name: "Camera Smoothing Lerp",
        description:
          "Camera position smoothly interpolates towards target player position while clamping to tilemap level boundaries.",
        formula: "C_{t+1} = C_t + \\alpha(T - C_t)",
      },
    ],
  },
  createGame: async () => {
    const { DiamondRunGame } = await import("../diamondRun");
    return new DiamondRunGame();
  },
};
