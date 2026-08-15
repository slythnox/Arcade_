import type { GameDefinition } from "../types";
export const fractalExplorerDefinition: GameDefinition = {
  id: "fractalExplorer",
  slug: "fractal-explorer",
  name: "Fractal Explorer",
  platform: "arcade",
  genre: "experimental",
  era: "1980s",
  year: 1985,
  tags: ["math", "fractal", "exploration"],
  description: "Interactive Mandelbrot set renderer. Explore infinite complexity.",
  tagline: "Dive into infinity.",
  difficulty: "easy",
  players: "single",
  category: "arcade",
  subcategory: "experimental",
  estimatedPlayTime: "Infinite",
  thumbnail: { src: "/assets/games/fractalexplorer/thumbnail.png", alt: "Fractal Explorer" },
  controls: {
    keyboard: [
      { key: "Arrows", description: "Pan View" },
      { key: "Z", description: "Zoom In" },
      { key: "X", description: "Zoom Out" },
      { key: "R", description: "Reset View" }
    ]
  },
  seo: {
    title: "Fractal Explorer - Interactive Mandelbrot Viewer",
    description: "Explore the infinite complexity of the Mandelbrot set in real-time."
  },
  math: {
    title: "Complex Dynamics",
    summary: "Visualizing the iteration of a complex quadratic polynomial.",
    concepts: [
      { name: "Mandelbrot set", description: "Set of complex numbers c for which z_{n+1} = z_n^2 + c does not diverge." },
      { name: "Complex arithmetic", description: "Squaring complex numbers." }
    ]
  },
  createGame: async () => {
    const { FractalExplorerGame } = await import("../fractalExplorer/FractalExplorerGame");
    return new FractalExplorerGame();
  }
};
