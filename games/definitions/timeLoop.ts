import { GameDefinition } from "../types";
import { TimeLoopGame } from "../timeLoop/TimeLoopGame";

export const timeLoopDefinition: GameDefinition = {
  id: "timeLoop",
  slug: "time-loop",
  name: "Time Loop",
  platform: "arcade",
  genre: "experimental",
  era: "2000s",
  year: 2021,
  tags: ["puzzle", "time", "record"],
  tagline: "Each run, your previous actions replay as a ghost.",
  description: "Coordinate with your past self to solve puzzles.",
  difficulty: "hard",
  players: "single",
  estimatedPlayTime: "15-30 min",
  thumbnail: { src: "/games/timeLoop/thumb.png", alt: "Time Loop" },
  controls: {
    keyboard: [
      { key: "Arrows", description: "Move" }
    ]
  },
  seo: {
    title: "Time Loop Puzzle",
    description: "Time travel puzzle where you cooperate with past versions of yourself.",
    keywords: ["time loop", "puzzle", "ghost replay"]
  },
  math: {
    title: "State Recording",
    summary: "Deterministic replay, temporal mechanics.",
    concepts: [
      { name: "Temporal Mechanics", description: "Recording and playback of states" }
    ]
  },
  createGame: () => new TimeLoopGame(),
};
