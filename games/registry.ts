import type { GameDefinition, GameInstance } from "./types";
import type { GamePlatform, GameGenre } from "../core/types/game";

// Tier 1 — Core Classics (10)
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

// Tier 2 — Puzzle Games (12)
import { twentyFortyEightDefinition } from "./definitions/twentyFortyEight";
import { lightsOutDefinition } from "./definitions/lightsOut";
import { floodFillDefinition } from "./definitions/floodFill";
import { colorCollapseDefinition } from "./definitions/colorCollapse";
import { matchThreeDefinition } from "./definitions/matchThree";
import { slidingPuzzleDefinition } from "./definitions/slidingPuzzle";
import { mazeRunnerDefinition } from "./definitions/mazeRunner";
import { pipeConnectDefinition } from "./definitions/pipeConnect";
import { sudokuDefinition } from "./definitions/sudoku";
import { nonogramDefinition } from "./definitions/nonogram";
import { twentyFortyEightHexDefinition } from "./definitions/twentyFortyEightHex";
import { numberMergeDefinition } from "./definitions/numberMerge";

// Tier 3 — Physics & Reflex (10)
import { orbitalDefinition } from "./definitions/orbital";
import { gravityFlipDefinition } from "./definitions/gravityFlip";
import { ballDropDefinition } from "./definitions/ballDrop";
import { ropeSwingDefinition } from "./definitions/ropeSwing";
import { particleLabDefinition } from "./definitions/particleLab";
import { magnetRunDefinition } from "./definitions/magnetRun";
import { newtonsBoxDefinition } from "./definitions/newtonsBox";
import { ricochetDefinition } from "./definitions/ricochet";
import { pendulumDefinition } from "./definitions/pendulum";
import { cannonballDefinition } from "./definitions/cannonball";

// Tier 4 — Shooters & Bullet Hell (8)
import { twinStickArenaDefinition } from "./definitions/twinStickArena";
import { bulletGardenDefinition } from "./definitions/bulletGarden";
import { meteorRushDefinition } from "./definitions/meteorRush";
import { bossReactorDefinition } from "./definitions/bossReactor";
import { railBlasterDefinition } from "./definitions/railBlaster";
import { droneSwarmDefinition } from "./definitions/droneSwarm";
import { targetRangeDefinition } from "./definitions/targetRange";
import { missileCommandDefinition } from "./definitions/missileCommand";

// Tier 5 — Platformers & Movement (8)
import { pixelJumperDefinition } from "./definitions/pixelJumper";
import { wallRunnerDefinition } from "./definitions/wallRunner";
import { dashRunnerDefinition } from "./definitions/dashRunner";
import { caveEscapeDefinition } from "./definitions/caveEscape";
import { ladderClimbDefinition } from "./definitions/ladderClimb";
import { oneButtonJumpDefinition } from "./definitions/oneButtonJump";
import { shadowRunnerDefinition } from "./definitions/shadowRunner";
import { gravityMazeDefinition } from "./definitions/gravityMaze";

// Tier 6 — Strategy & Board Games (8)
import { connectFourDefinition } from "./definitions/connectFour";
import { ticTacToePlusDefinition } from "./definitions/ticTacToePlus";
import { checkersDefinition } from "./definitions/checkers";
import { reversiDefinition } from "./definitions/reversi";
import { chessMiniDefinition } from "./definitions/chessMini";
import { towerDefenseDefinition } from "./definitions/towerDefense";
import { kingdomGridDefinition } from "./definitions/kingdomGrid";
import { resourceMinerDefinition } from "./definitions/resourceMiner";

// Tier 7 — Experimental & Math Simulation (4)
import { fractalGardenDefinition } from "./definitions/fractalGarden";
import { cellColonyDefinition } from "./definitions/cellColony";
import { gravityWellDefinition } from "./definitions/gravityWell";
import { neonCircuitDefinition } from "./definitions/neonCircuit";

// Tier 9 — Advanced Systems (73-84)
import { antColonyDefinition } from "./definitions/antColony";
import { orbitalMechanicsDefinition } from "./definitions/orbitalMechanics";
import { poolSimulatorDefinition } from "./definitions/poolSimulator";
import { infiniteForestDefinition } from "./definitions/infiniteForest";
import { timeLoopDefinition } from "./definitions/timeLoop";
import { hexTerritoryDefinition } from "./definitions/hexTerritory";
import { quantumTilesDefinition } from "./definitions/quantumTiles";
import { colorFloodDefinition } from "./definitions/colorFlood";
import { fireSpreadDefinition } from "./definitions/fireSpread";
import { liquidCellsDefinition } from "./definitions/liquidCells";
import { circlePackingLabDefinition } from "./definitions/circlePackingLab";
import { omegaRunDefinition } from "./definitions/omegaRun";

// Nostalgia Classics — Pure Retro Arcade Additions
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
import { dungeonQuestDefinition } from "./definitions/dungeonQuestDefinition";
import { sokobanDefinition } from "./definitions/sokoban";
import { algorithmDungeonDefinition } from "./definitions/algorithmDungeon";
import { logicGatesDefinition } from "./definitions/logicGates";
import { caveGeneratorDefinition } from "./definitions/caveGenerator";
import { voronoiGardenDefinition } from "./definitions/voronoiGarden";
import { dungeonGeneratorDefinition } from "./definitions/dungeonGenerator";

/**
 * Single source of truth for all game cartridges in ARCADE_.
 */
export const gameRegistry: readonly GameDefinition[] = [
  // Tier 1 — Core Arcade Classics (1-10)
  tetrisDefinition,
  snakeDefinition,
  breakoutDefinition,
  pongDefinition,
  minesweeperDefinition,
  spaceDefenderDefinition,
  asteroidFieldDefinition,
  alienSwarmDefinition,
  brickStackDefinition,
  laserGridDefinition,

  // Iconic Retro Additions
  mazeChaserDefinition,
  roadHopperDefinition,
  starFormationDefinition,
  bombGridDefinition,
  pegBlastDefinition,
  caveHunterDefinition,
  donkeyClimbDefinition,
  marbleRushDefinition,
  velocityRushDefinition,
  pixelQuestDefinition,
  raySectorDefinition,
  pixelBrawlDefinition,
  pixelCircuitDefinition,
  dungeonQuestDefinition,

  // Tier 2 — Puzzle Games
  twentyFortyEightDefinition,
  lightsOutDefinition,
  floodFillDefinition,
  colorCollapseDefinition,
  matchThreeDefinition,
  slidingPuzzleDefinition,
  mazeRunnerDefinition,
  pipeConnectDefinition,
  sudokuDefinition,
  nonogramDefinition,
  twentyFortyEightHexDefinition,
  numberMergeDefinition,

  // Tier 3 — Physics & Reflex
  orbitalDefinition,
  gravityFlipDefinition,
  ballDropDefinition,
  ropeSwingDefinition,
  particleLabDefinition,
  magnetRunDefinition,
  newtonsBoxDefinition,
  ricochetDefinition,
  pendulumDefinition,
  cannonballDefinition,

  // Tier 4 — Shooters & Bullet Hell
  twinStickArenaDefinition,
  bulletGardenDefinition,
  meteorRushDefinition,
  bossReactorDefinition,
  railBlasterDefinition,
  droneSwarmDefinition,
  targetRangeDefinition,
  missileCommandDefinition,

  // Tier 5 — Platformers & Movement
  pixelJumperDefinition,
  wallRunnerDefinition,
  dashRunnerDefinition,
  caveEscapeDefinition,
  ladderClimbDefinition,
  oneButtonJumpDefinition,
  shadowRunnerDefinition,
  gravityMazeDefinition,

  // Tier 6 — Strategy & Board Games
  connectFourDefinition,
  ticTacToePlusDefinition,
  checkersDefinition,
  reversiDefinition,
  chessMiniDefinition,
  towerDefenseDefinition,
  kingdomGridDefinition,
  resourceMinerDefinition,

  // Tier 7 — Experimental & Math Simulation
  fractalGardenDefinition,
  cellColonyDefinition,
  gravityWellDefinition,
  neonCircuitDefinition,

  // Advanced Systems
  antColonyDefinition,
  orbitalMechanicsDefinition,
  poolSimulatorDefinition,
  infiniteForestDefinition,
  timeLoopDefinition,
  hexTerritoryDefinition,
  quantumTilesDefinition,
  colorFloodDefinition,
  fireSpreadDefinition,
  liquidCellsDefinition,
  circlePackingLabDefinition,
  omegaRunDefinition,
  sokobanDefinition,
  algorithmDungeonDefinition,
  logicGatesDefinition,
  caveGeneratorDefinition,
  voronoiGardenDefinition,
  dungeonGeneratorDefinition,
];

/** Games visible in the main ARCADE_ game library. */
export const arcadeRegistry: readonly GameDefinition[] = gameRegistry.filter(
  (g) => g.category === "arcade"
);

/** Mathematical experiments and simulations in the Labs section. */
export const labsRegistry: readonly GameDefinition[] = gameRegistry.filter(
  (g) => g.category === "labs"
);

export function getArcadeGames(): readonly GameDefinition[] {
  return arcadeRegistry;
}

export function getLabsGames(): readonly GameDefinition[] {
  return labsRegistry;
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
