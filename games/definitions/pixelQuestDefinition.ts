import type { GameDefinition } from "../types";

export const pixelQuestDefinition: GameDefinition = {
  id: "pixel-quest",
  slug: "pixel-quest",
  name: "Pixel Quest",
  platform: "nes",
  genre: "platformer",
  era: "1990s",
  year: 1990,
  tags: ["platformer", "retro", "precision", "mario-style"],
  description: "A precision platformer where you jump, stomp enemies, and collect coins in a pixelated world.",
  tagline: "Jump, stomp, and dash your way to the flag!",
  difficulty: "medium",
  players: "single",
  category: "arcade",
  subcategory: "platformer",
  estimatedPlayTime: "15-30 min",
  thumbnail: {
    src: "/games/pixel-quest/thumb.png",
    alt: "Pixel Quest Thumbnail"
  },
  controls: {
    keyboard: [
      { key: "← / →", description: "Move Left / Right" },
      { key: "SPACE / ↑", description: "Jump" },
      { key: "P", description: "Pause" },
      { key: "R", description: "Restart" }
    ]
  },
  seo: {
    title: "Play Pixel Quest Online - Retro Precision Platformer",
    description: "Experience classic 90s platforming action in Pixel Quest. Jump over spikes, stomp enemies, and collect coins."
  },
  math: {
    title: "Physics of Pixel Quest",
    summary: "Pixel Quest utilizes classic platformer physics with sub-pixel movement, AABB collision detection, and variable jump heights.",
    concepts: [
      {
        name: "AABB Collision Detection",
        description: "Axis-Aligned Bounding Box (AABB) checks for overlap between rectangular regions on the X and Y axes independently."
      },
      {
        name: "Euler Integration",
        description: "Velocity is updated by adding acceleration (gravity and input) multiplied by delta time, and position is updated by adding velocity multiplied by delta time."
      }
    ]
  },
  createGame: async () => {
    const { PixelQuestGame } = await import("../pixelQuest/PixelQuestGame");
    return new PixelQuestGame();
  }
};
