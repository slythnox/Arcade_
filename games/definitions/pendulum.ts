import { GameDefinition } from "../types";
import { PendulumGame } from "../pendulum/PendulumGame";

export const pendulumDefinition: GameDefinition = {
  id: "pendulum",
  slug: "pendulum",
  name: "Pendulum",
  platform: "arcade",
  genre: "physics",
  era: "1990s",
  year: 1997,
  tags: ["Pendulum", "Harmonic Oscillator", "Rhythm", "Physics"],
  tagline: "Strike precision timing windows at the peak kinetic equilibrium of a swinging pendulum.",
  description:
    "Test your reflex and rhythm against a non-linear simple harmonic oscillator swinging through target intervals.",
  difficulty: "medium",
  players: "single",
  estimatedPlayTime: "3-5 min",
  thumbnail: {
    src: "/assets/thumbnails/pendulum.png",
    alt: "Pendulum Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "SPACE", description: "Trigger Timing Strike" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Tap anywhere on screen when pendulum enters green zone.",
  },
  seo: {
    title: "Pendulum — Simple Harmonic Oscillator Rhythm Arcade",
    description: "Harmonic pendulum oscillator timing challenge with non-linear angular acceleration.",
    keywords: ["pendulum physics", "harmonic oscillator", "rhythm game", "precision timing"],
  },
  math: {
    title: "Simple Harmonic Oscillator Dynamics",
    summary: "\\frac{d^2 \\theta}{dt^2} + \\frac{g}{L} \\sin(\\theta) = 0, \\text{Non-linear angular differential kinematics}.",
    concepts: [
      { name: "Harmonic Period", description: "T \\approx 2\\pi \\sqrt{\\frac{L}{g}}." },
      { name: "Equilibrium Maximum Velocity", description: "v_{\\text{max}} = \\sqrt{2 g L (1 - \\cos(\\theta_0))}." },
    ],
  },
  createGame: () => new PendulumGame(),
};
