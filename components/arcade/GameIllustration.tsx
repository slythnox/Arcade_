"use client";

import React from "react";
import { GameDefinition } from "@/games/types";

export interface GameIllustrationProps {
  game: GameDefinition;
  size?: number;
}

export interface GameTheme {
  primary: string;
  secondary: string;
  accent: string;
  glow: string;
}

export const GAME_THEMES: Record<string, GameTheme> = {
  // Tier 1 — Core Arcade Classics
  tetris: { primary: "#4de8e8", secondary: "#ffd84d", accent: "#a879ff", glow: "rgba(77, 232, 232, 0.4)" },
  snake: { primary: "#63e66d", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(99, 230, 109, 0.4)" },
  breakout: { primary: "#ff5c8a", secondary: "#ff9f43", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  pong: { primary: "#4da3ff", secondary: "#ffffff", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  minesweeper: { primary: "#ff9f43", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  "space-defender": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffffff", glow: "rgba(77, 232, 232, 0.4)" },
  spaceDefender: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffffff", glow: "rgba(77, 232, 232, 0.4)" },
  "asteroid-field": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#a879ff", glow: "rgba(255, 216, 77, 0.4)" },
  asteroidField: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#a879ff", glow: "rgba(255, 216, 77, 0.4)" },
  "alien-swarm": { primary: "#ff5c8a", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  alienSwarm: { primary: "#ff5c8a", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "brick-stack": { primary: "#ff9f43", secondary: "#ffd84d", accent: "#63e66d", glow: "rgba(255, 159, 67, 0.4)" },
  brickStack: { primary: "#ff9f43", secondary: "#ffd84d", accent: "#63e66d", glow: "rgba(255, 159, 67, 0.4)" },
  "laser-grid": { primary: "#4de8e8", secondary: "#a879ff", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  laserGrid: { primary: "#4de8e8", secondary: "#a879ff", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },

  // Tier 2 — Puzzle Games
  "2048": { primary: "#ffd84d", secondary: "#ff9f43", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  twentyFortyEight: { primary: "#ffd84d", secondary: "#ff9f43", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  "lights-out": { primary: "#a879ff", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  lightsOut: { primary: "#a879ff", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  "flood-fill": { primary: "#4da3ff", secondary: "#63e66d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  floodFill: { primary: "#4da3ff", secondary: "#63e66d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  "color-collapse": { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  colorCollapse: { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  "match-3": { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  matchThree: { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "sliding-puzzle": { primary: "#ff9f43", secondary: "#4da3ff", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  slidingPuzzle: { primary: "#ff9f43", secondary: "#4da3ff", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  "maze-runner": { primary: "#63e66d", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(99, 230, 109, 0.4)" },
  mazeRunner: { primary: "#63e66d", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(99, 230, 109, 0.4)" },
  "pipe-connect": { primary: "#4da3ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  pipeConnect: { primary: "#4da3ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  sudoku: { primary: "#a879ff", secondary: "#ffffff", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  nonogram: { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  "2048-hex": { primary: "#ffd84d", secondary: "#a879ff", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  twentyFortyEightHex: { primary: "#ffd84d", secondary: "#a879ff", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  "number-merge": { primary: "#ff9f43", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  numberMerge: { primary: "#ff9f43", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },

  // Tier 3 — Physics & Reflex
  orbital: { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  "gravity-flip": { primary: "#a879ff", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  gravityFlip: { primary: "#a879ff", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  "ball-drop": { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#63e66d", glow: "rgba(255, 92, 138, 0.4)" },
  ballDrop: { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#63e66d", glow: "rgba(255, 92, 138, 0.4)" },
  "rope-swing": { primary: "#63e66d", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  ropeSwing: { primary: "#63e66d", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  "particle-lab": { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  particleLab: { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "magnet-run": { primary: "#ff5c8a", secondary: "#4da3ff", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  magnetRun: { primary: "#ff5c8a", secondary: "#4da3ff", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "newtons-box": { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  newtonsBox: { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  ricochet: { primary: "#ff9f43", secondary: "#4de8e8", accent: "#a879ff", glow: "rgba(255, 159, 67, 0.4)" },
  pendulum: { primary: "#4da3ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  cannonball: { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#63e66d", glow: "rgba(255, 92, 138, 0.4)" },

  // Tier 4 — Shooters & Bullet Hell
  "twin-stick-arena": { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  twinStickArena: { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "bullet-garden": { primary: "#a879ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  bulletGarden: { primary: "#a879ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  "meteor-rush": { primary: "#ff9f43", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(255, 159, 67, 0.4)" },
  meteorRush: { primary: "#ff9f43", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(255, 159, 67, 0.4)" },
  "boss-reactor": { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#a879ff", glow: "rgba(255, 92, 138, 0.4)" },
  bossReactor: { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#a879ff", glow: "rgba(255, 92, 138, 0.4)" },
  "rail-blaster": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  railBlaster: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "drone-swarm": { primary: "#ff5c8a", secondary: "#63e66d", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  droneSwarm: { primary: "#ff5c8a", secondary: "#63e66d", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  "target-range": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  targetRange: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  "missile-command": { primary: "#ff5c8a", secondary: "#ff9f43", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  missileCommand: { primary: "#ff5c8a", secondary: "#ff9f43", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },

  // Tier 5 — Platformers & Movement
  "pixel-jumper": { primary: "#63e66d", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(99, 230, 109, 0.4)" },
  pixelJumper: { primary: "#63e66d", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(99, 230, 109, 0.4)" },
  "wall-runner": { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  wallRunner: { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(255, 92, 138, 0.4)" },
  "dash-runner": { primary: "#ff9f43", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  dashRunner: { primary: "#ff9f43", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  "cave-escape": { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  caveEscape: { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "ladder-climb": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#63e66d", glow: "rgba(255, 216, 77, 0.4)" },
  ladderClimb: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#63e66d", glow: "rgba(255, 216, 77, 0.4)" },
  "one-button-jump": { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  oneButtonJump: { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "shadow-runner": { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  shadowRunner: { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  "gravity-maze": { primary: "#4da3ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  gravityMaze: { primary: "#4da3ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },

  // Tier 6 — Strategy & Board Games
  "connect-four": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  connectFour: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  "tic-tac-toe-plus": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  ticTacToePlus: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  checkers: { primary: "#ff5c8a", secondary: "#63e66d", accent: "#ffffff", glow: "rgba(255, 92, 138, 0.4)" },
  reversi: { primary: "#63e66d", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(99, 230, 109, 0.4)" },
  "chess-mini": { primary: "#ffd84d", secondary: "#ffffff", accent: "#a879ff", glow: "rgba(255, 216, 77, 0.4)" },
  chessMini: { primary: "#ffd84d", secondary: "#ffffff", accent: "#a879ff", glow: "rgba(255, 216, 77, 0.4)" },
  "tower-defense": { primary: "#ff9f43", secondary: "#4de8e8", accent: "#63e66d", glow: "rgba(255, 159, 67, 0.4)" },
  towerDefense: { primary: "#ff9f43", secondary: "#4de8e8", accent: "#63e66d", glow: "rgba(255, 159, 67, 0.4)" },
  "kingdom-grid": { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  kingdomGrid: { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  "resource-miner": { primary: "#ffd84d", secondary: "#ff9f43", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  resourceMiner: { primary: "#ffd84d", secondary: "#ff9f43", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },

  // Tier 7 — Experimental & Math Simulation
  "fractal-garden": { primary: "#63e66d", secondary: "#a879ff", accent: "#ff5c8a", glow: "rgba(99, 230, 109, 0.4)" },
  fractalGarden: { primary: "#63e66d", secondary: "#a879ff", accent: "#ff5c8a", glow: "rgba(99, 230, 109, 0.4)" },
  "cell-colony": { primary: "#4de8e8", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  cellColony: { primary: "#4de8e8", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "gravity-well": { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  gravityWell: { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  "neon-circuit": { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  neonCircuit: { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },

  // Tier 8 — Simulation & Geometry Expansion (61-72)
  "sand-world": { primary: "#ffd84d", secondary: "#4da3ff", accent: "#8a8a8a", glow: "rgba(255, 216, 77, 0.4)" },
  sandWorld: { primary: "#ffd84d", secondary: "#4da3ff", accent: "#8a8a8a", glow: "rgba(255, 216, 77, 0.4)" },
  "mirror-maze": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  mirrorMaze: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "fractal-explorer": { primary: "#a879ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(168, 121, 255, 0.4)" },
  fractalExplorer: { primary: "#a879ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(168, 121, 255, 0.4)" },
  "predator-prey": { primary: "#63e66d", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  predatorPrey: { primary: "#63e66d", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  "evolution-lab": { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  evolutionLab: { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  sokoban: { primary: "#ff9f43", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(255, 159, 67, 0.4)" },
  "algorithm-dungeon": { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  algorithmDungeon: { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  "spring-mass": { primary: "#4da3ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  springMass: { primary: "#4da3ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  "logic-gates": { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  logicGates: { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  "cave-generator": { primary: "#4de8e8", secondary: "#1e3060", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  caveGenerator: { primary: "#4de8e8", secondary: "#1e3060", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "voronoi-garden": { primary: "#a879ff", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  voronoiGarden: { primary: "#a879ff", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  "dungeon-generator": { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  dungeonGenerator: { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },

  // Tier 9 — Advanced Systems Expansion (73-84)
  "ant-colony": { primary: "#ffd84d", secondary: "#63e66d", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  antColony: { primary: "#ffd84d", secondary: "#63e66d", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  "orbital-mechanics": { primary: "#4de8e8", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  orbitalMechanics: { primary: "#4de8e8", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "pool-simulator": { primary: "#63e66d", secondary: "#ffffff", accent: "#ff5c8a", glow: "rgba(99, 230, 109, 0.4)" },
  poolSimulator: { primary: "#63e66d", secondary: "#ffffff", accent: "#ff5c8a", glow: "rgba(99, 230, 109, 0.4)" },
  "infinite-forest": { primary: "#63e66d", secondary: "#4da3ff", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  infiniteForest: { primary: "#63e66d", secondary: "#4da3ff", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  "time-loop": { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  timeLoop: { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  "hex-territory": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  hexTerritory: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  "quantum-tiles": { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  quantumTiles: { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "color-flood": { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  colorFlood: { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "fire-spread": { primary: "#ff5c8a", secondary: "#ff9f43", accent: "#63e66d", glow: "rgba(255, 92, 138, 0.4)" },
  fireSpread: { primary: "#ff5c8a", secondary: "#ff9f43", accent: "#63e66d", glow: "rgba(255, 92, 138, 0.4)" },
  "liquid-cells": { primary: "#4da3ff", secondary: "#4de8e8", accent: "#ffffff", glow: "rgba(77, 163, 255, 0.4)" },
  liquidCells: { primary: "#4da3ff", secondary: "#4de8e8", accent: "#ffffff", glow: "rgba(77, 163, 255, 0.4)" },
  "circle-packing-lab": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  circlePackingLab: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  "omega-run": { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  omegaRun: { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
};

export function getGameTheme(game: GameDefinition): GameTheme {
  return (
    GAME_THEMES[game.slug] ||
    GAME_THEMES[game.id] || {
      primary: "#4de8e8",
      secondary: "#ff5c8a",
      accent: "#ffd84d",
      glow: "rgba(77, 232, 232, 0.4)",
    }
  );
}

export const GameIllustration: React.FC<GameIllustrationProps> = ({ game, size = 120 }) => {
  const theme = getGameTheme(game);

  const renderPixelArt = () => {
    const key = game.slug || game.id;
    switch (key) {
      case "tetris":
        return (
          <>
            <rect x="14" y="6" width="6" height="6" fill="#4de8e8" />
            <rect x="8" y="12" width="18" height="6" fill="#4de8e8" />
            <rect x="2" y="18" width="12" height="12" fill="#ffd84d" />
            <rect x="16" y="20" width="6" height="12" fill="#a879ff" />
            <rect x="22" y="26" width="6" height="6" fill="#a879ff" />
          </>
        );
      case "snake":
        return (
          <>
            <rect x="4" y="16" width="6" height="6" fill="#63e66d" />
            <rect x="10" y="16" width="6" height="6" fill="#63e66d" />
            <rect x="16" y="16" width="6" height="6" fill="#63e66d" />
            <rect x="16" y="10" width="6" height="6" fill="#63e66d" />
            <rect x="16" y="4" width="8" height="8" fill="#a3e635" />
            <rect x="20" y="6" width="2" height="2" fill="#080b12" />
            <rect x="6" y="6" width="6" height="6" fill="#ff5c8a" />
            <rect x="8" y="4" width="2" height="2" fill="#63e66d" />
          </>
        );
      case "breakout":
        return (
          <>
            <rect x="2" y="4" width="7" height="4" fill="#ff5c8a" />
            <rect x="11" y="4" width="7" height="4" fill="#ff9f43" />
            <rect x="20" y="4" width="7" height="4" fill="#ffd84d" />
            <rect x="2" y="10" width="7" height="4" fill="#63e66d" />
            <rect x="11" y="10" width="7" height="4" fill="#4de8e8" />
            <rect x="20" y="10" width="7" height="4" fill="#a879ff" />
            <rect x="13" y="18" width="4" height="4" fill="#ffffff" />
            <rect x="7" y="26" width="16" height="4" fill="#4da3ff" />
          </>
        );
      case "pong":
        return (
          <>
            <rect x="3" y="8" width="3" height="14" fill="#4da3ff" />
            <rect x="24" y="12" width="3" height="14" fill="#ff5c8a" />
            <rect x="14" y="2" width="2" height="4" fill="rgba(255,255,255,0.3)" />
            <rect x="14" y="10" width="2" height="4" fill="rgba(255,255,255,0.3)" />
            <rect x="14" y="18" width="2" height="4" fill="rgba(255,255,255,0.3)" />
            <rect x="14" y="26" width="2" height="4" fill="rgba(255,255,255,0.3)" />
            <rect x="11" y="14" width="4" height="4" fill="#ffd84d" />
          </>
        );
      case "minesweeper":
        return (
          <>
            <circle cx="15" cy="16" r="7" fill="#1e293b" />
            <rect x="13" y="6" width="4" height="4" fill="#ff5c8a" />
            <rect x="13" y="22" width="4" height="4" fill="#ff5c8a" />
            <rect x="5" y="14" width="4" height="4" fill="#ff5c8a" />
            <rect x="21" y="14" width="4" height="4" fill="#ff5c8a" />
            <rect x="13" y="14" width="4" height="4" fill="#ffd84d" />
            <rect x="4" y="4" width="2" height="8" fill="#ffffff" />
            <polygon points="6,4 12,7 6,10" fill="#ff5c8a" />
          </>
        );
      case "space-defender":
      case "spaceDefender":
        return (
          <>
            <polygon points="15,4 7,24 23,24" fill="#4de8e8" />
            <polygon points="15,8 10,22 20,22" fill="#131a2c" />
            <rect x="14" y="10" width="2" height="6" fill="#ffd84d" />
            <rect x="8" y="2" width="2" height="6" fill="#ff5c8a" />
            <rect x="20" y="2" width="2" height="6" fill="#ff5c8a" />
          </>
        );
      case "asteroid-field":
      case "asteroidField":
        return (
          <>
            <polygon points="8,4 16,2 24,8 26,18 18,24 8,20 4,12" fill="#ffd84d" />
            <rect x="10" y="8" width="4" height="4" fill="#ff9f43" />
            <rect x="16" y="14" width="4" height="4" fill="#ff9f43" />
            <polygon points="22,22 26,28 20,27" fill="#ff5c8a" />
          </>
        );
      case "alien-swarm":
      case "alienSwarm":
        return (
          <>
            <rect x="8" y="8" width="14" height="12" fill="#ff5c8a" rx="2" />
            <rect x="5" y="12" width="3" height="6" fill="#ffd84d" />
            <rect x="22" y="12" width="3" height="6" fill="#ffd84d" />
            <rect x="10" y="11" width="3" height="4" fill="#ffffff" />
            <rect x="17" y="11" width="3" height="4" fill="#ffffff" />
            <rect x="11" y="12" width="1" height="2" fill="#080b12" />
            <rect x="18" y="12" width="1" height="2" fill="#080b12" />
          </>
        );
      case "brick-stack":
      case "brickStack":
        return (
          <>
            <rect x="6" y="22" width="18" height="5" fill="#ff9f43" />
            <rect x="8" y="16" width="14" height="5" fill="#ffd84d" />
            <rect x="11" y="10" width="10" height="5" fill="#63e66d" />
            <rect x="13" y="4" width="8" height="5" fill="#4de8e8" />
          </>
        );
      case "laser-grid":
      case "laserGrid":
        return (
          <>
            <line x1="4" y1="4" x2="26" y2="26" stroke="#4de8e8" strokeWidth="2" />
            <line x1="26" y1="4" x2="4" y2="26" stroke="#ff5c8a" strokeWidth="2" />
            <circle cx="15" cy="15" r="4" fill="#ffd84d" />
          </>
        );
      case "2048":
      case "twentyFortyEight":
        return (
          <>
            <rect x="3" y="3" width="11" height="11" fill="#ffd84d" rx="2" />
            <rect x="16" y="3" width="11" height="11" fill="#ff9f43" rx="2" />
            <rect x="3" y="16" width="11" height="11" fill="#ff5c8a" rx="2" />
            <rect x="16" y="16" width="11" height="11" fill="#4de8e8" rx="2" />
          </>
        );
      case "lights-out":
      case "lightsOut":
        return (
          <>
            <rect x="4" y="4" width="6" height="6" fill="#a879ff" />
            <rect x="12" y="4" width="6" height="6" fill="#ffd84d" />
            <rect x="20" y="4" width="6" height="6" fill="#a879ff" />
            <rect x="4" y="12" width="6" height="6" fill="#ffd84d" />
            <rect x="12" y="12" width="6" height="6" fill="#a879ff" />
            <rect x="20" y="12" width="6" height="6" fill="#ffd84d" />
            <rect x="4" y="20" width="6" height="6" fill="#a879ff" />
            <rect x="12" y="20" width="6" height="6" fill="#ffd84d" />
            <rect x="20" y="20" width="6" height="6" fill="#a879ff" />
          </>
        );
      case "flood-fill":
      case "floodFill":
        return (
          <>
            <rect x="4" y="4" width="10" height="10" fill="#4da3ff" />
            <rect x="16" y="4" width="10" height="10" fill="#63e66d" />
            <rect x="4" y="16" width="10" height="10" fill="#ff5c8a" />
            <rect x="16" y="16" width="10" height="10" fill="#ffd84d" />
          </>
        );
      case "color-collapse":
      case "colorCollapse":
        return (
          <>
            <rect x="4" y="4" width="6" height="6" fill="#ff5c8a" />
            <rect x="12" y="4" width="6" height="6" fill="#ff5c8a" />
            <rect x="20" y="4" width="6" height="6" fill="#ffd84d" />
            <rect x="4" y="12" width="6" height="6" fill="#ff5c8a" />
            <rect x="12" y="12" width="6" height="6" fill="#ff5c8a" />
            <rect x="20" y="12" width="6" height="6" fill="#4de8e8" />
          </>
        );
      case "match-3":
      case "matchThree":
        return (
          <>
            <circle cx="7" cy="8" r="4" fill="#ff5c8a" />
            <polygon points="15,4 19,12 11,12" fill="#4de8e8" />
            <rect x="19" y="4" width="8" height="8" fill="#ffd84d" rx="1" />
            <circle cx="7" cy="20" r="4" fill="#ff5c8a" />
            <circle cx="15" cy="20" r="4" fill="#ff5c8a" />
            <circle cx="23" cy="20" r="4" fill="#ff5c8a" />
          </>
        );
      case "sliding-puzzle":
      case "slidingPuzzle":
        return (
          <>
            <rect x="4" y="4" width="9" height="9" fill="#ff9f43" rx="1" />
            <rect x="17" y="4" width="9" height="9" fill="#4da3ff" rx="1" />
            <rect x="4" y="17" width="9" height="9" fill="#ffd84d" rx="1" />
            <rect x="17" y="17" width="9" height="9" fill="#131a2c" stroke="#232f4c" rx="1" />
          </>
        );
      case "maze-runner":
      case "mazeRunner":
        return (
          <>
            <rect x="4" y="4" width="22" height="3" fill="#63e66d" />
            <rect x="4" y="7" width="3" height="15" fill="#63e66d" />
            <rect x="11" y="11" width="15" height="3" fill="#63e66d" />
            <rect x="23" y="14" width="3" height="12" fill="#63e66d" />
            <circle cx="9" cy="18" r="3" fill="#ffd84d" />
          </>
        );
      case "pipe-connect":
      case "pipeConnect":
        return (
          <>
            <rect x="4" y="12" width="10" height="6" fill="#4da3ff" />
            <rect x="14" y="12" width="6" height="14" fill="#4da3ff" />
            <circle cx="9" cy="15" r="2" fill="#4de8e8" />
            <circle cx="17" cy="21" r="2" fill="#4de8e8" />
          </>
        );
      case "sudoku":
        return (
          <>
            <rect x="4" y="4" width="22" height="22" fill="#101524" stroke="#a879ff" strokeWidth="2" />
            <line x1="11" y1="4" x2="11" y2="26" stroke="#a879ff" />
            <line x1="19" y1="4" x2="19" y2="26" stroke="#a879ff" />
            <line x1="4" y1="11" x2="26" y2="11" stroke="#a879ff" />
            <line x1="4" y1="19" x2="26" y2="19" stroke="#a879ff" />
            <rect x="6" y="6" width="3" height="3" fill="#ffd84d" />
            <rect x="14" y="14" width="3" height="3" fill="#ff5c8a" />
          </>
        );
      case "nonogram":
        return (
          <>
            <rect x="4" y="4" width="6" height="6" fill="#4de8e8" />
            <rect x="12" y="4" width="6" height="6" fill="#4de8e8" />
            <rect x="20" y="4" width="6" height="6" fill="#131a2c" />
            <rect x="4" y="12" width="6" height="6" fill="#ffd84d" />
            <rect x="12" y="12" width="6" height="6" fill="#ffd84d" />
            <rect x="20" y="12" width="6" height="6" fill="#ffd84d" />
            <rect x="4" y="20" width="6" height="6" fill="#131a2c" />
            <rect x="12" y="20" width="6" height="6" fill="#ff5c8a" />
            <rect x="20" y="20" width="6" height="6" fill="#131a2c" />
          </>
        );
      case "2048-hex":
      case "twentyFortyEightHex":
        return (
          <>
            <polygon points="15,4 23,9 23,19 15,24 7,19 7,9" fill="#ffd84d" />
            <circle cx="15" cy="14" r="4" fill="#a879ff" />
          </>
        );
      case "number-merge":
      case "numberMerge":
        return (
          <>
            <circle cx="9" cy="9" r="6" fill="#ff9f43" />
            <circle cx="21" cy="9" r="6" fill="#ff9f43" />
            <circle cx="15" cy="21" r="8" fill="#ff5c8a" />
          </>
        );

      // --- 24 NEW GAMES ILLUSTRATIONS ---

      case "sand-world":
      case "sandWorld":
        return (
          <>
            {/* Hourglass funnel with falling golden sand particles and water */}
            <rect x="6" y="20" width="18" height="6" fill="#8a8a8a" />
            <rect x="9" y="17" width="12" height="4" fill="#ffd84d" />
            <rect x="12" y="12" width="6" height="5" fill="#ffd84d" />
            <rect x="14" y="8" width="2" height="4" fill="#ffd84d" />
            <rect x="14" y="4" width="4" height="4" fill="#ffd84d" />
            <rect x="4" y="22" width="4" height="4" fill="#4da3ff" />
            <rect x="22" y="22" width="4" height="4" fill="#4da3ff" />
          </>
        );

      case "mirror-maze":
      case "mirrorMaze":
        return (
          <>
            {/* Laser bouncing off 45-degree mirror surfaces */}
            <rect x="3" y="13" width="5" height="4" fill="#ffd84d" />
            <line x1="8" y1="15" x2="16" y2="15" stroke="#4de8e8" strokeWidth="2" />
            {/* Mirror / */}
            <polygon points="14,19 20,13 18,11 12,17" fill="#ffffff" />
            <line x1="16" y1="15" x2="16" y2="5" stroke="#ff5c8a" strokeWidth="2" />
            {/* Target sensor */}
            <circle cx="16" cy="4" r="3" fill="#63e66d" />
          </>
        );

      case "fractal-explorer":
      case "fractalExplorer":
        return (
          <>
            {/* Mandelbrot Bulb Geometry */}
            <circle cx="18" cy="15" r="7" fill="#a879ff" />
            <circle cx="9" cy="15" r="4" fill="#ffd84d" />
            <circle cx="4" cy="15" r="2" fill="#ff5c8a" />
            <circle cx="18" cy="7" r="2.5" fill="#4de8e8" />
            <circle cx="18" cy="23" r="2.5" fill="#4de8e8" />
          </>
        );

      case "predator-prey":
      case "predatorPrey":
        return (
          <>
            {/* Predator chasing flocking boid prey dots */}
            <polygon points="8,10 2,15 2,5" fill="#ff5c8a" />
            <circle cx="14" cy="9" r="2" fill="#63e66d" />
            <circle cx="18" cy="13" r="2" fill="#63e66d" />
            <circle cx="23" cy="8" r="2" fill="#63e66d" />
            <circle cx="25" cy="17" r="2" fill="#63e66d" />
            <circle cx="17" cy="21" r="2" fill="#63e66d" />
          </>
        );

      case "evolution-lab":
      case "evolutionLab":
        return (
          <>
            {/* DNA double helix genetic strand */}
            <rect x="6" y="5" width="4" height="4" fill="#4de8e8" rx="1" />
            <rect x="20" y="5" width="4" height="4" fill="#ff5c8a" rx="1" />
            <line x1="8" y1="7" x2="22" y2="7" stroke="#ffd84d" strokeWidth="1.5" />
            <rect x="10" y="13" width="4" height="4" fill="#ff5c8a" rx="1" />
            <rect x="16" y="13" width="4" height="4" fill="#4de8e8" rx="1" />
            <line x1="12" y1="15" x2="18" y2="15" stroke="#ffd84d" strokeWidth="1.5" />
            <rect x="6" y="21" width="4" height="4" fill="#4de8e8" rx="1" />
            <rect x="20" y="21" width="4" height="4" fill="#ff5c8a" rx="1" />
            <line x1="8" y1="23" x2="22" y2="23" stroke="#ffd84d" strokeWidth="1.5" />
          </>
        );

      case "sokoban":
        return (
          <>
            {/* Warehouse cargo crate and goal dock */}
            <rect x="6" y="10" width="10" height="10" fill="#ff9f43" rx="1" />
            <line x1="6" y1="10" x2="16" y2="20" stroke="#b86a1a" strokeWidth="1" />
            <line x1="16" y1="10" x2="6" y2="20" stroke="#b86a1a" strokeWidth="1" />
            <rect x="19" y="12" width="6" height="6" fill="#ffd84d" rx="1" />
            <circle cx="22" cy="15" r="1.5" fill="#060e1c" />
          </>
        );

      case "algorithm-dungeon":
      case "algorithmDungeon":
        return (
          <>
            {/* Maze exploration BFS cyan wave vs A* yellow path */}
            <rect x="4" y="4" width="22" height="22" fill="#0a1426" stroke="#1e3060" />
            <line x1="12" y1="4" x2="12" y2="18" stroke="#1e3060" strokeWidth="2" />
            <line x1="18" y1="10" x2="18" y2="26" stroke="#1e3060" strokeWidth="2" />
            {/* BFS wave */}
            <circle cx="7" cy="7" r="3" fill="#4de8e8" opacity="0.6" />
            <circle cx="7" cy="14" r="3" fill="#4de8e8" opacity="0.6" />
            {/* A* optimal path */}
            <polyline points="7,7 7,22 22,22" fill="none" stroke="#ffd84d" strokeWidth="2" />
          </>
        );

      case "spring-mass":
      case "springMass":
        return (
          <>
            {/* Hooke's law spring and oscillating mass node */}
            <rect x="12" y="3" width="6" height="3" fill="#ffffff" />
            <polyline points="15,6 18,9 12,12 18,15 12,18 15,21" fill="none" stroke="#4da3ff" strokeWidth="2" />
            <circle cx="15" cy="24" r="4" fill="#ffd84d" />
          </>
        );

      case "logic-gates":
      case "logicGates":
        return (
          <>
            {/* Digital AND gate symbol */}
            <line x1="4" y1="10" x2="10" y2="10" stroke="#4de8e8" strokeWidth="2" />
            <line x1="4" y1="20" x2="10" y2="20" stroke="#4de8e8" strokeWidth="2" />
            <path d="M 10,7 L 16,7 A 8,8 0 0,1 16,23 L 10,23 Z" fill="#ffd84d" />
            <line x1="22" y1="15" x2="27" y2="15" stroke="#ff5c8a" strokeWidth="2" />
            <circle cx="27" cy="15" r="2" fill="#ff5c8a" />
          </>
        );

      case "cave-generator":
      case "caveGenerator":
        return (
          <>
            {/* Cellular automata cavern contours */}
            <rect x="4" y="4" width="22" height="22" fill="#172548" />
            <polygon points="8,8 14,6 20,9 22,18 16,22 8,20 6,12" fill="#060e1c" />
            <circle cx="12" cy="14" r="2" fill="#4de8e8" />
          </>
        );

      case "voronoi-garden":
      case "voronoiGarden":
        return (
          <>
            {/* Voronoi partition facets with seeds */}
            <polygon points="4,4 16,4 14,14 4,12" fill="#ffd84d" opacity="0.85" />
            <polygon points="16,4 26,4 26,16 14,14" fill="#ff5c8a" opacity="0.85" />
            <polygon points="4,12 14,14 18,26 4,26" fill="#4de8e8" opacity="0.85" />
            <polygon points="14,14 26,16 26,26 18,26" fill="#a879ff" opacity="0.85" />
            <circle cx="10" cy="8" r="1.5" fill="#ffffff" />
            <circle cx="20" cy="10" r="1.5" fill="#ffffff" />
            <circle cx="10" cy="20" r="1.5" fill="#ffffff" />
            <circle cx="20" cy="20" r="1.5" fill="#ffffff" />
          </>
        );

      case "dungeon-generator":
      case "dungeonGenerator":
        return (
          <>
            {/* BSP partitioned dungeon rooms and corridors */}
            <rect x="4" y="5" width="8" height="7" fill="#2a3d66" stroke="#4da3ff" />
            <rect x="18" y="5" width="8" height="9" fill="#2a3d66" stroke="#4da3ff" />
            <rect x="8" y="17" width="14" height="8" fill="#2a3d66" stroke="#4da3ff" />
            {/* Corridors */}
            <line x1="12" y1="8" x2="18" y2="8" stroke="#ffd84d" strokeWidth="1.5" />
            <line x1="15" y1="8" x2="15" y2="17" stroke="#ffd84d" strokeWidth="1.5" />
          </>
        );

      case "ant-colony":
      case "antColony":
        return (
          <>
            {/* Ant hill nest and worker ants */}
            <polygon points="15,4 22,12 8,12" fill="#ffd84d" />
            <circle cx="15" cy="10" r="2" fill="#060e1c" />
            {/* Pheromone dots */}
            <circle cx="11" cy="16" r="1" fill="#63e66d" />
            <circle cx="18" cy="20" r="1" fill="#63e66d" />
            {/* Ants */}
            <rect x="9" y="17" width="4" height="2" fill="#ffffff" />
            <rect x="17" y="21" width="4" height="2" fill="#ffffff" />
            <circle cx="24" cy="24" r="3" fill="#ff5c8a" />
          </>
        );

      case "orbital-mechanics":
      case "orbitalMechanics":
        return (
          <>
            {/* Central planet and Keplerian orbit path */}
            <circle cx="15" cy="15" r="5" fill="#ff9f43" />
            <ellipse cx="15" cy="15" rx="12" ry="6" fill="none" stroke="#4de8e8" strokeWidth="1" strokeDasharray="2,2" />
            <polygon points="26,12 28,15 25,16" fill="#ffd84d" />
          </>
        );

      case "pool-simulator":
      case "poolSimulator":
        return (
          <>
            {/* Billiard cue ball and 8-ball on green table */}
            <rect x="4" y="6" width="22" height="18" fill="#14532d" rx="2" />
            <circle cx="5" cy="7" r="2" fill="#060e1c" />
            <circle cx="25" cy="7" r="2" fill="#060e1c" />
            <circle cx="11" cy="15" r="3" fill="#ffffff" />
            <circle cx="19" cy="15" r="3" fill="#0f172a" />
            <circle cx="19" cy="15" r="1" fill="#ffffff" />
          </>
        );

      case "infinite-forest":
      case "infiniteForest":
        return (
          <>
            {/* Rolling procedural hills and pine trees */}
            <path d="M 4,22 Q 12,14 20,18 T 26,16 L 26,26 L 4,26 Z" fill="#166534" />
            {/* Trees */}
            <polygon points="9,10 12,16 6,16" fill="#22c55e" />
            <polygon points="18,8 22,16 14,16" fill="#22c55e" />
            <circle cx="6" cy="6" r="1" fill="#ffd84d" />
            <circle cx="22" cy="5" r="1" fill="#ffd84d" />
          </>
        );

      case "time-loop":
      case "timeLoop":
        return (
          <>
            {/* Clock face and loop rewind arrow */}
            <circle cx="15" cy="15" r="10" fill="none" stroke="#a879ff" strokeWidth="2" />
            <line x1="15" y1="15" x2="15" y2="8" stroke="#ffd84d" strokeWidth="2" />
            <line x1="15" y1="15" x2="20" y2="15" stroke="#ffd84d" strokeWidth="2" />
            <circle cx="15" cy="15" r="2" fill="#ff5c8a" />
            <polygon points="12,4 15,2 15,6" fill="#4de8e8" />
          </>
        );

      case "hex-territory":
      case "hexTerritory":
        return (
          <>
            {/* Hexagonal grid honeycomb cells */}
            <polygon points="15,4 20,7 20,13 15,16 10,13 10,7" fill="#ffd84d" />
            <polygon points="22,12 27,15 27,21 22,24 17,21 17,15" fill="#ff5c8a" />
            <polygon points="8,12 13,15 13,21 8,24 3,21 3,15" fill="#4da3ff" />
          </>
        );

      case "quantum-tiles":
      case "quantumTiles":
        return (
          <>
            {/* Wave function superposition matrix */}
            <rect x="5" y="5" width="8" height="8" fill="#4de8e8" rx="1" />
            <rect x="17" y="5" width="8" height="8" fill="#a879ff" rx="1" />
            <rect x="5" y="17" width="8" height="8" fill="#a879ff" rx="1" />
            <rect x="17" y="17" width="8" height="8" fill="#ffd84d" rx="1" />
            <circle cx="9" cy="9" r="2" fill="#ffffff" />
            <circle cx="21" cy="21" r="2" fill="#060e1c" />
          </>
        );

      case "color-flood":
      case "colorFlood":
        return (
          <>
            {/* 3x3 cascading flood grid */}
            <rect x="4" y="4" width="6" height="6" fill="#ff5c8a" />
            <rect x="12" y="4" width="6" height="6" fill="#ff5c8a" />
            <rect x="20" y="4" width="6" height="6" fill="#4de8e8" />
            <rect x="4" y="12" width="6" height="6" fill="#ff5c8a" />
            <rect x="12" y="12" width="6" height="6" fill="#ffd84d" />
            <rect x="20" y="12" width="6" height="6" fill="#63e66d" />
            <rect x="4" y="20" width="6" height="6" fill="#a879ff" />
            <rect x="12" y="20" width="6" height="6" fill="#63e66d" />
            <rect x="20" y="20" width="6" height="6" fill="#ffd84d" />
          </>
        );

      case "fire-spread":
      case "fireSpread":
        return (
          <>
            {/* Forest tree and propagating fire flame */}
            <polygon points="8,10 12,18 4,18" fill="#22c55e" />
            <polygon points="20,6 25,18 15,18" fill="#ff5c8a" />
            <polygon points="20,10 23,17 17,17" fill="#ffd84d" />
            <line x1="6" y1="24" x2="24" y2="24" stroke="#ff9f43" strokeWidth="2" />
          </>
        );

      case "liquid-cells":
      case "liquidCells":
        return (
          <>
            {/* Stepped fluid reservoir container */}
            <rect x="4" y="18" width="22" height="8" fill="#1e3a8a" />
            <rect x="8" y="12" width="14" height="6" fill="#3b82f6" />
            <rect x="12" y="6" width="6" height="6" fill="#60a5fa" />
            <circle cx="15" cy="4" r="1.5" fill="#93c5fd" />
          </>
        );

      case "circle-packing-lab":
      case "circlePackingLab":
        return (
          <>
            {/* Tangent packed circles */}
            <circle cx="12" cy="12" r="7" fill="#ffd84d" />
            <circle cx="21" cy="10" r="4" fill="#ff5c8a" />
            <circle cx="20" cy="20" r="5" fill="#4de8e8" />
            <circle cx="9" cy="22" r="3.5" fill="#a879ff" />
          </>
        );

      case "omega-run":
      case "omegaRun":
        return (
          <>
            {/* 3-lane speed track and runner sprite */}
            <line x1="8" y1="4" x2="3" y2="26" stroke="#4de8e8" strokeWidth="1.5" />
            <line x1="15" y1="4" x2="15" y2="26" stroke="#4de8e8" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="22" y1="4" x2="27" y2="26" stroke="#4de8e8" strokeWidth="1.5" />
            <rect x="13" y="14" width="4" height="6" fill="#ffd84d" rx="1" />
            <rect x="6" y="8" width="6" height="3" fill="#ff5c8a" />
          </>
        );

      default:
        return (
          <>
            <rect x="5" y="4" width="20" height="22" fill="#1a2238" stroke={theme.primary} strokeWidth="2" />
            <rect x="8" y="7" width="14" height="10" fill={theme.secondary} />
            <circle cx="15" cy="21" r="2" fill={theme.accent} />
          </>
        );
    }
  };

  return (
    <div
      style={{
        width: `${size}px`,
        height: `${size * 0.75}px`,
        position: "relative",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0d1322",
        borderRadius: "4px",
        overflow: "hidden",
        border: `1px solid rgba(255, 255, 255, 0.08)`,
      }}
    >
      {/* Background radial glow */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 50% 50%, ${theme.glow} 0%, rgba(13, 19, 34, 0) 70%)`,
        }}
      />

      <svg
        width={size * 0.7}
        height={size * 0.7}
        viewBox="0 0 30 30"
        style={{
          position: "relative",
          zIndex: 1,
          imageRendering: "pixelated",
          filter: `drop-shadow(0 4px 12px ${theme.glow})`,
        }}
      >
        {renderPixelArt()}
      </svg>
    </div>
  );
};
