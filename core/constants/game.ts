import type { PlayerSettings } from "../types/player";

export const DEFAULT_PLAYER_SETTINGS: PlayerSettings = {
  soundEnabled: true,
  musicEnabled: true,
  volume: 0.7,
  crtEnabled: true,
  scanlinesEnabled: true,
  reducedMotion: false,
  theme: "arcade",
};

export const DEFAULT_GAME_SEEDS = {
  tetris: 1337,
  snake: 42,
  breakout: 777,
  minesweeper: 9999,
  pong: 2026,
} as const;

export const CANVAS_VIRTUAL_WIDTH = 480;
export const CANVAS_VIRTUAL_HEIGHT = 640;
