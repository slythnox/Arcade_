import { GameDefinition } from "../types";
import { MissileCommandGame } from "../missileCommand/MissileCommandGame";

export const missileCommandDefinition: GameDefinition = {
  id: "missile-command",
  slug: "missile-command",
  name: "Missile Command",
  platform: "arcade",
  genre: "shooter",
  era: "1980s",
  year: 1980,
  tags: ["Missile Command", "Defense", "Anti-Air", "Flak", "Action"],
  tagline: "Defend coastal cities by detonating timed anti-air flak clouds in the sky.",
  description:
    "Intercept descending ballistic ICBM nuclear warheads by strategically detonating expanding anti-air flak explosions.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "3-8 min",
  thumbnail: {
    src: "/assets/thumbnails/missile-command.png",
    alt: "Missile Command Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "Arrow Keys / WASD", description: "Position Flak Reticle" },
      { key: "SPACE", description: "Launch Anti-Air Flak Explosion" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere in the sky to launch flak cloud.",
  },
  seo: {
    title: "Missile Command — Classic Anti-Air Ballistic Missile Interceptor",
    description: "Defend cities from descending ICBM warheads with timed anti-air flak explosions.",
    keywords: ["missile command", "anti air", "ballistic missile", "retro arcade"],
  },
  math: {
    title: "Expanding Radius Intersection & Vector Interception",
    summary: "\\|\\vec{p}_{\\text{missile}}(t) - \\vec{p}_{\\text{flak}}\\| \\le R_{\\text{blast}}(t), \\quad R_{\\text{blast}}(t) = v_{\\text{expand}} t.",
    concepts: [
      { name: "Blast Envelope", description: "\\text{Kinetic destruction volume defined by expanding sphere/disc}." },
    ],
  },
  createGame: () => new MissileCommandGame(),
};
