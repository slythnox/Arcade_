import type { GameDefinition } from "../types";

export const fireSpreadDefinition: GameDefinition = {
  id: "fireSpread",
  slug: "fire-spread",
  name: "Inferno Strike",
  platform: "arcade",
  genre: "action",
  era: "2000s",
  year: 2026,
  tags: ["Firefighting", "Flight Simulator", "Air Tanker", "Rescue", "Wildfire", "Action"],
  tagline: "Pilot an aerial firefighting tanker to drop water bombs and Phos-Chek retardant salvos on roaring wildfires.",
  description:
    "High-stakes aerial firefighting action! Pilot a heavy-duty air tanker across mountain valleys to douse raging wildfires, drop flame-resistant chemical retardant, scoop water from mountain lakes, and rescue trapped survivor camps.",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "shooter",
  estimatedPlayTime: "5-15 min",
  thumbnail: { src: "/games/fireSpread/thumb.png", alt: "Inferno Strike" },
  controls: {
    keyboard: [
      { key: "Mouse Aim / Touch", description: "Steer Air Tanker Towards Target" },
      { key: "A / D / Left / Right", description: "Steer Plane Left / Right" },
      { key: "SPACE / Click", description: "Deploy Firebomb Salvo (Water or Retardant)" },
      { key: "Z / SHIFT / E", description: "Switch Payload (Water / Red Retardant)" },
      { key: "R", description: "Restart Mission" },
    ],
    touch: "Drag finger to steer air tanker, tap fire button to drop water/retardant, fly over lake to refill.",
  },
  seo: {
    title: "Inferno Strike — Aerial Firefighting Wildfire Rescue Game",
    description: "Pilot firefighting air tankers to douse forest wildfires and rescue alpine lodges.",
    keywords: ["fire spread", "firefighting game", "air tanker", "water bomber", "wildfire rescue"],
  },
  math: {
    title: "Reaction-Diffusion Fire Modeling & Anisotropic Wind Advection",
    summary: "\\frac{\\partial T}{\\partial t} = D \\nabla^2 T + \\mathbf{w} \\cdot \\nabla T + R(T), \\quad P_{\\text{spread}} = f(\\mathbf{w} \\cdot \\hat{\\mathbf{r}}).",
    concepts: [
      { name: "Anisotropic Propagation", description: "\\text{Directional wildfire spread influenced by dynamic wind vectors}." },
      { name: "Chemical Retardant Surface Barrier", description: "\\text{Inhibition kinetics modeling flame extinguishing and boundary containment}." },
    ],
  },
  createGame: async () => {
    const { FireSpreadGame } = await import("../fireSpread/FireSpreadGame");
    return new FireSpreadGame();
  },
};
