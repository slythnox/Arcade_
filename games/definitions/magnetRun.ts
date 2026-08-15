import { GameDefinition } from "../types";
export const magnetRunDefinition: GameDefinition = {
  id: "magnet-run",
  slug: "magnet-run",
  name: "Magnet Run",
  platform: "arcade",
  genre: "physics",
  era: "1990s",
  year: 1996,
  tags: ["Magnetism", "Coulomb Force", "Physics", "Action"],
  tagline: "Switch positive and negative magnetic polarities to dodge and slingshot.",
  description:
    "Navigate an obstacle course of charged magnetic poles by switching your magnetic polarity to attract or repel.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "physics",
  estimatedPlayTime: "3-6 min",
  thumbnail: {
    src: "/assets/thumbnails/magnet-run.png",
    alt: "Magnet Run Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Steer Ship Horizontal" },
      { key: "SPACE", description: "Switch Magnetic Polarity (+ / -)" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap left/right to steer, tap polarity button to invert charge.",
  },
  seo: {
    title: "Magnet Run — Inverse-Square Electro-Magnetic Reflex Runner",
    description: "High-speed reflex runner powered by Coulomb electrostatic and magnetic forces.",
    keywords: ["magnet run", "coulomb physics", "magnetic arcade", "polarity game"],
  },
  math: {
    title: "Coulomb's Law & Lorentz Polarity Interactions",
    summary: "\\vec{F} = k_e \\frac{q_1 q_2}{r^2} \\hat{r}, \\text{Identical signs repel (-), opposite signs attract (+)}.",
    concepts: [
      { name: "Polarity Multiplication", description: "\\text{Interaction factor } I = -q_{\\text{ship}} \\cdot q_{\\text{pole}}." },
      { name: "Dynamic Vector Summation", description: "\\vec{a} = \\sum_{i} \\frac{k_e I_i}{|\\vec{r}_i|^3} \\vec{r}_i." },
    ],
  },
  createGame: async () => {
    const { MagnetRunGame } = await import("../magnetRun/MagnetRunGame");
    return new MagnetRunGame();
  },
};
