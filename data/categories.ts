/** ARCADE_ v1.2.2 */
import type { GamePlatform, GameGenre } from "../core/types/game";

export interface CategoryItem<T = string> {
  id: T;
  label: string;
  badge?: string;
  icon?: string;
}

export const PLATFORM_CATEGORIES: CategoryItem<GamePlatform | "all">[] = [
  { id: "all", label: "ALL" },
  { id: "arcade", label: "ARCADE" },
  { id: "gameboy", label: "GAME BOY" },
  { id: "nes", label: "NES" },
  { id: "handheld", label: "HANDHELD" },
];

export const GENRE_CATEGORIES: CategoryItem<GameGenre | "all">[] = [
  { id: "all", label: "ALL GENRES" },
  { id: "puzzle", label: "PUZZLE" },
  { id: "action", label: "ACTION" },
  { id: "physics", label: "PHYSICS" },
  { id: "strategy", label: "STRATEGY" },
  { id: "arcade", label: "ARCADE" },
];
