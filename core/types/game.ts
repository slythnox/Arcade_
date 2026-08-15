export type GamePlatform = "arcade" | "gameboy" | "nes" | "handheld";

export type GameGenre =
  | "puzzle"
  | "action"
  | "arcade"
  | "strategy"
  | "physics"
  | "shooter"
  | "platformer"
  | "experimental";

export type GameEra = "1970s" | "1980s" | "1990s" | "2000s";

export type Difficulty = "easy" | "medium" | "hard";

export type PlayerCount = "single" | "1-2 players";

export type GameStatus =
  | "idle"
  | "loading"
  | "ready"
  | "running"
  | "paused"
  | "game-over"
  | "destroyed";

export type GameAction =
  | "MOVE_LEFT"
  | "MOVE_RIGHT"
  | "MOVE_UP"
  | "MOVE_DOWN"
  | "ROTATE"
  | "ACTION_PRIMARY"
  | "ACTION_SECONDARY"
  | "PAUSE"
  | "RESTART"
  | "CONFIRM"
  | "BACK";

export interface GameAsset {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

export interface GameControls {
  keyboard: { key: string; description: string }[];
  touch?: string;
  gamepad?: string;
}

export interface GameSEO {
  title: string;
  description: string;
  keywords?: string[];
}

export interface MathSection {
  title: string;
  summary: string;
  concepts: {
    name: string;
    description: string;
    formula?: string;
  }[];
}
