import { GameDefinition } from "../types";
import { BossReactorGame } from "../bossReactor/BossReactorGame";

export const bossReactorDefinition: GameDefinition = {
  id: "boss-reactor",
  slug: "boss-reactor",
  name: "Boss Reactor",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1987,
  tags: ["Boss Fight", "Shooter", "Multi-Phase", "Action"],
  tagline: "Engage a massive mothership boss with multi-phase attacks and laser sweeps.",
  description:
    "Battle an escalating multi-phase dreadnought boss core with oscillating attack spreads and enrage transitions.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/boss-reactor.png",
    alt: "Boss Reactor Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Strafe Fighter" },
      { key: "SPACE", description: "Fire Photon Lasers" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch left/right to strafe, tap FIRE to shoot.",
  },
  seo: {
    title: "Boss Reactor — Multi-Phase Boss Battle Shooter",
    description: "Intense multi-phase boss fight arcade game with bullet spreads and health state machines.",
    keywords: ["boss fight", "boss reactor", "arcade shooter", "shmup boss"],
  },
  math: {
    title: "Multi-Phase State Machines & Angular Spreads",
    summary: "\\vec{v}_k = v \\begin{bmatrix} \\sin(\\theta_k) \\\\ \\cos(\\theta_k) \\end{bmatrix}, \\quad \\theta_k = \\left(k - \\frac{N-1}{2}\\right) \\Delta \\theta.",
    concepts: [
      { name: "Phase State Machine", description: "H \\le 50\\% \\implies \\text{Transition to Enraged Phase 2}." },
    ],
  },
  createGame: () => new BossReactorGame(),
};
