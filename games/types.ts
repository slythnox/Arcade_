import {
  GamePlatform,
  GameGenre,
  GameEra,
  Difficulty,
  PlayerCount,
  GameAsset,
  GameControls,
  GameSEO,
  MathSection,
  GameAction,
} from "../core/types/game";
import { GameContext } from "../engine/GameContext";
import { Renderer } from "../engine/rendering/Renderer";

/**
 * Standard Game Contract that every playable arcade cartridge implements.
 * Framework-independent pure TypeScript with no React dependencies.
 */
export interface GameInstance {
  init(ctx: GameContext): void;
  update(deltaTime: number): void;
  render(renderer: Renderer): void;
  handleInput(action: GameAction, isPressed: boolean): void;
  pause(): void;
  resume(): void;
  reset(seed?: number): void;
  destroy(): void;
  getScore(): number;
  getLevel(): number;
  getLines?(): number;
  getLives?(): number;
}

export type GameFactory = () => GameInstance;

/**
 * Game Definition Schema.
 * The central single source of truth for game metadata, SEO, controls, math breakdown, and factory.
 */
export interface GameDefinition {
  id: string;
  slug: string;
  name: string;
  platform: GamePlatform;
  genre: GameGenre;
  era: GameEra;
  year: number;
  tags: string[];
  description: string;
  tagline: string;
  difficulty: Difficulty;
  players: PlayerCount;
  estimatedPlayTime: string;
  thumbnail: GameAsset;
  controls: GameControls;
  seo: GameSEO;
  math: MathSection;
  createGame: GameFactory;
}
