import { GameDefinition } from "../types";
export const asteroidFieldDefinition: GameDefinition = {
  id: "asteroid-field",
  slug: "asteroid-field",
  name: "Asteroid Field",
  platform: "arcade",
  genre: "physics",
  era: "1970s",
  year: 1979,
  tags: ["Asteroids", "Vector Physics", "Inertia", "Space"],
  tagline: "Navigate a spaceship through a drifting field of destructible asteroids.",
  description:
    "Rotate, thrust, and fire at split-geometry asteroids across a 2D toroidal wrapping space with Newtonian inertia.",
  difficulty: "hard",
  players: "single",
  category: "arcade",
  subcategory: "classics",
  estimatedPlayTime: "5-10 min",
  thumbnail: {
    src: "/assets/thumbnails/asteroid-field.png",
    alt: "Asteroid Field Arcade",
    width: 600,
    height: 700,
  },
  controls: {
    keyboard: [
      { key: "← → / A D", description: "Rotate Ship Heading" },
      { key: "↑ / W", description: "Engage Thruster" },
      { key: "SPACE", description: "Fire Photon Cannon" },
      { key: "P", description: "Pause / Resume" },
      { key: "R", description: "Restart" },
    ],
    touch: "Touch left/right to steer, UP to thrust, and FIRE to shoot.",
  },
  seo: {
    title: "Asteroid Field — Vector Space Physics Arcade",
    description: "Classic vector space shooter with momentum, rotational physics, and split collisions.",
    keywords: ["asteroids", "vector physics", "space arcade", "toroidal wrap"],
  },
  math: {
    title: "Toroidal Geometry & Angular Kinematics",
    summary: "2D Newton-Euler rigid body velocity, drag damping factors, and modular toroidal screen wrapping.",
    concepts: [
      { name: "Inertial Integration", description: "v_{t+1} = (v_t + a \\cdot \\Delta t) \\times \\gamma." },
      { name: "Toroidal Wrap", description: "x \\pmod W, y \\pmod H." },
    ],
  },
  createGame: async () => {
    const { AsteroidFieldGame } = await import("../asteroidField/AsteroidFieldGame");
    return new AsteroidFieldGame();
  },
};
