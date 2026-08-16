/** ARCADE_ v1.2.2 */
import type { GameDefinition, GameInstance } from "./types";
import type { GamePlatform, GameGenre } from "../core/types/game";

// Tier 1 — Core Classics
import { tetrisDefinition } from "./definitions/tetris";
import { snakeDefinition } from "./definitions/snake";
import { breakoutDefinition } from "./definitions/breakout";
import { pongDefinition } from "./definitions/pong";
import { minesweeperDefinition } from "./definitions/minesweeper";
import { spaceDefenderDefinition } from "./definitions/spaceDefender";
import { asteroidFieldDefinition } from "./definitions/asteroidField";
import { alienSwarmDefinition } from "./definitions/alienSwarm";
import { brickStackDefinition } from "./definitions/brickStack";
import { laserGridDefinition } from "./definitions/laserGrid";

// Iconic Retro Arcade Additions
import { mazeChaserDefinition } from "./definitions/mazeChaserDefinition";
import { roadHopperDefinition } from "./definitions/roadHopperDefinition";
import { starFormationDefinition } from "./definitions/starFormationDefinition";
import { bombGridDefinition } from "./definitions/bombGridDefinition";
import { pegBlastDefinition } from "./definitions/pegBlastDefinition";
import { caveHunterDefinition } from "./definitions/caveHunterDefinition";
import { donkeyClimbDefinition } from "./definitions/donkeyClimbDefinition";
import { marbleRushDefinition } from "./definitions/marbleRushDefinition";
import { velocityRushDefinition } from "./definitions/velocityRushDefinition";
import { pixelQuestDefinition } from "./definitions/pixelQuestDefinition";
import { raySectorDefinition } from "./definitions/raySectorDefinition";
import { pixelBrawlDefinition } from "./definitions/pixelBrawlDefinition";
import { pixelCircuitDefinition } from "./definitions/pixelCircuitDefinition";
import { diamondRunDefinition } from "./definitions/diamondRun";
import { hotlapDefinition } from "./definitions/hotlap";

// Tier 2 — Puzzle Games
import { twentyFortyEightDefinition } from "./definitions/twentyFortyEight";
import { lightsOutDefinition } from "./definitions/lightsOut";
import { matchThreeDefinition } from "./definitions/matchThree";
import { slidingPuzzleDefinition } from "./definitions/slidingPuzzle";
import { mazeRunnerDefinition } from "./definitions/mazeRunner";
import { pipeConnectDefinition } from "./definitions/pipeConnect";
import { sudokuDefinition } from "./definitions/sudoku";

// Tier 3 — Physics & Reflex
import { gravityFlipDefinition } from "./definitions/gravityFlip";
import { ballDropDefinition } from "./definitions/ballDrop";
import { ropeSwingDefinition } from "./definitions/ropeSwing";
import { magnetRunDefinition } from "./definitions/magnetRun";
import { newtonsBoxDefinition } from "./definitions/newtonsBox";
import { ricochetDefinition } from "./definitions/ricochet";

// Tier 4 — Shooters & Action
import { twinStickArenaDefinition } from "./definitions/twinStickArena";
import { bulletGardenDefinition } from "./definitions/bulletGarden";
import { bossReactorDefinition } from "./definitions/bossReactor";
import { droneSwarmDefinition } from "./definitions/droneSwarm";
import { missileCommandDefinition } from "./definitions/missileCommand";

// Tier 5 — Platformers & Movement
import { pixelJumperDefinition } from "./definitions/pixelJumper";
import { wallRunnerDefinition } from "./definitions/wallRunner";
import { caveEscapeDefinition } from "./definitions/caveEscape";
import { ladderClimbDefinition } from "./definitions/ladderClimb";
import { shadowRunnerDefinition } from "./definitions/shadowRunner";

// Tier 6 — Strategy & Board Games
import { connectFourDefinition } from "./definitions/connectFour";
import { ticTacToePlusDefinition } from "./definitions/ticTacToePlus";
import { reversiDefinition } from "./definitions/reversi";
import { towerDefenseDefinition } from "./definitions/towerDefense";

// Tier 7 — Simulation & Labs
import { cellColonyDefinition } from "./definitions/cellColony";
import { poolSimulatorDefinition } from "./definitions/poolSimulator";
import { infiniteForestDefinition } from "./definitions/infiniteForest";
import { timeLoopDefinition } from "./definitions/timeLoop";
import { fireSpreadDefinition } from "./definitions/fireSpread";
import { liquidCellsDefinition } from "./definitions/liquidCells";
import { omegaRunDefinition } from "./definitions/omegaRun";
import { sokobanDefinition } from "./definitions/sokoban";
import { logicGatesDefinition } from "./definitions/logicGates";

/**
 * Single source of truth for all game cartridges in ARCADE_.
 */
export const gameRegistry: readonly GameDefinition[] = [
  // 🌟 Featured & Premier Arcade Hits
  hotlapDefinition,
  raySectorDefinition,
  velocityRushDefinition,
  pixelBrawlDefinition,
  pixelQuestDefinition,
  spaceDefenderDefinition,
  asteroidFieldDefinition,
  alienSwarmDefinition,
  twinStickArenaDefinition,
  bossReactorDefinition,
  omegaRunDefinition,
  diamondRunDefinition,
  starFormationDefinition,
  donkeyClimbDefinition,
  breakoutDefinition,
  tetrisDefinition,
  snakeDefinition,
  pongDefinition,
  minesweeperDefinition,
  roadHopperDefinition,
  mazeChaserDefinition,
  bombGridDefinition,
  caveHunterDefinition,
  pixelCircuitDefinition,
  towerDefenseDefinition,

  // Iconic Action & Reflex
  brickStackDefinition,
  laserGridDefinition,
  pegBlastDefinition,
  marbleRushDefinition,
  droneSwarmDefinition,
  missileCommandDefinition,
  bulletGardenDefinition,
  gravityFlipDefinition,
  ballDropDefinition,
  ropeSwingDefinition,
  magnetRunDefinition,
  newtonsBoxDefinition,
  ricochetDefinition,
  pixelJumperDefinition,
  wallRunnerDefinition,
  caveEscapeDefinition,
  ladderClimbDefinition,
  shadowRunnerDefinition,

  // Puzzle & Brain
  twentyFortyEightDefinition,
  lightsOutDefinition,
  matchThreeDefinition,
  slidingPuzzleDefinition,
  mazeRunnerDefinition,
  pipeConnectDefinition,
  sudokuDefinition,
  sokobanDefinition,
  logicGatesDefinition,

  // Strategy, Board & Simulation
  connectFourDefinition,
  ticTacToePlusDefinition,
  reversiDefinition,
  cellColonyDefinition,
  poolSimulatorDefinition,
  infiniteForestDefinition,
  timeLoopDefinition,
  fireSpreadDefinition,
  liquidCellsDefinition,
];

/** Games visible in the main ARCADE_ game library (62 cartridges). */
export const arcadeRegistry: readonly GameDefinition[] = gameRegistry;

/** Legacy labs registry fallback. */
export const labsRegistry: readonly GameDefinition[] = [];

export function getArcadeGames(): readonly GameDefinition[] {
  return arcadeRegistry;
}

export function getLabsGames(): readonly GameDefinition[] {
  return [];
}

export function getAllGames(): readonly GameDefinition[] {
  return gameRegistry;
}

export function getGameBySlug(slug: string): GameDefinition | undefined {
  if (!slug) return undefined;
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
  const target = norm(slug);
  return gameRegistry.find(
    (g) => g.slug === slug || g.id === slug || norm(g.slug) === target || norm(g.id) === target
  );
}

export async function createGameInstance(idOrSlug: string): Promise<GameInstance | null> {
  const def = getGameBySlug(idOrSlug);
  return def ? def.createGame() : null;
}

export function getGamesByPlatform(platform: GamePlatform): GameDefinition[] {
  return gameRegistry.filter((g) => g.platform === platform);
}

export function getGamesByGenre(genre: GameGenre): GameDefinition[] {
  return gameRegistry.filter((g) => g.genre === genre);
}

export function getRelatedGames(currentSlug: string, limit: number = 3): GameDefinition[] {
  const current = getGameBySlug(currentSlug);
  if (!current) return gameRegistry.slice(0, limit);

  return gameRegistry
    .filter((g) => g.slug !== currentSlug)
    .sort((a, b) => {
      let aScore = 0;
      let bScore = 0;
      if (a.platform === current.platform) aScore += 2;
      if (a.genre === current.genre) aScore += 2;
      if (b.platform === current.platform) bScore += 2;
      if (b.genre === current.genre) bScore += 2;
      return bScore - aScore;
    })
    .slice(0, limit);
}

export function getRandomGame(excludeSlug?: string): GameDefinition {
  const available = excludeSlug
    ? gameRegistry.filter((g) => g.slug !== excludeSlug)
    : gameRegistry;
  const index = Math.floor(Math.random() * available.length);
  return available[index] || gameRegistry[0];
}
