"use client";

import React from "react";
import type { GameDefinition } from "@/games/types";

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
  "chess-mini": { primary: "#ffffff", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(255, 255, 255, 0.4)" },
  chessMini: { primary: "#ffffff", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(255, 255, 255, 0.4)" },
  "tower-defense": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  towerDefense: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  "kingdom-grid": { primary: "#ffd84d", secondary: "#63e66d", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  kingdomGrid: { primary: "#ffd84d", secondary: "#63e66d", accent: "#4da3ff", glow: "rgba(255, 216, 77, 0.4)" },
  "resource-miner": { primary: "#ff9f43", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(255, 159, 67, 0.4)" },
  resourceMiner: { primary: "#ff9f43", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(255, 159, 67, 0.4)" },

  // Tier 7 — Experimental & Math Simulation
  "fractal-garden": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  fractalGarden: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "cell-colony": { primary: "#63e66d", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  cellColony: { primary: "#63e66d", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  "gravity-well": { primary: "#a879ff", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  gravityWell: { primary: "#a879ff", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  "neon-circuit": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  neonCircuit: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },

  // Tier 8 — New Math Systems
  "sand-world": { primary: "#ffd84d", secondary: "#4da3ff", accent: "#8a8a8a", glow: "rgba(255, 216, 77, 0.4)" },
  sandWorld: { primary: "#ffd84d", secondary: "#4da3ff", accent: "#8a8a8a", glow: "rgba(255, 216, 77, 0.4)" },
  "mirror-maze": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffffff", glow: "rgba(77, 232, 232, 0.4)" },
  mirrorMaze: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffffff", glow: "rgba(77, 232, 232, 0.4)" },
  "fractal-explorer": { primary: "#a879ff", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  fractalExplorer: { primary: "#a879ff", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  "predator-prey": { primary: "#ff5c8a", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  predatorPrey: { primary: "#ff5c8a", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "evolution-lab": { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  evolutionLab: { primary: "#4de8e8", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  sokoban: { primary: "#ff9f43", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(255, 159, 67, 0.4)" },
  "algorithm-dungeon": { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  algorithmDungeon: { primary: "#4de8e8", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  "spring-mass": { primary: "#4da3ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  springMass: { primary: "#4da3ff", secondary: "#ffd84d", accent: "#ff5c8a", glow: "rgba(77, 163, 255, 0.4)" },
  "logic-gates": { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  logicGates: { primary: "#ffd84d", secondary: "#4de8e8", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  "diamond-run": { primary: "#4de8e8", secondary: "#ffd84d", accent: "#a879ff", glow: "rgba(77, 232, 232, 0.4)" },
  diamondRun: { primary: "#4de8e8", secondary: "#ffd84d", accent: "#a879ff", glow: "rgba(77, 232, 232, 0.4)" },
  "cave-generator": { primary: "#4de8e8", secondary: "#1e3060", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  caveGenerator: { primary: "#4de8e8", secondary: "#1e3060", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "voronoi-garden": { primary: "#a879ff", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  voronoiGarden: { primary: "#a879ff", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(168, 121, 255, 0.4)" },
  "dungeon-generator": { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  dungeonGenerator: { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },

  // Tier 9 — Advanced Systems Expansion
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

  // Phase 3 — Nostalgia Classics Expansion
  "maze-chaser": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  mazeChaser: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#4de8e8", glow: "rgba(255, 216, 77, 0.4)" },
  "road-hopper": { primary: "#63e66d", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  roadHopper: { primary: "#63e66d", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  "star-formation": { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  starFormation: { primary: "#ff5c8a", secondary: "#4de8e8", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "bomb-grid": { primary: "#ff9f43", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  bombGrid: { primary: "#ff9f43", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  "peg-blast": { primary: "#a879ff", secondary: "#ff9f43", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  pegBlast: { primary: "#a879ff", secondary: "#ff9f43", accent: "#4de8e8", glow: "rgba(168, 121, 255, 0.4)" },
  "cave-hunter": { primary: "#ff9f43", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  caveHunter: { primary: "#ff9f43", secondary: "#63e66d", accent: "#ffd84d", glow: "rgba(255, 159, 67, 0.4)" },
  "donkey-climb": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#ff9f43", glow: "rgba(255, 216, 77, 0.4)" },
  donkeyClimb: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#ff9f43", glow: "rgba(255, 216, 77, 0.4)" },
  "marble-rush": { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  marbleRush: { primary: "#4de8e8", secondary: "#a879ff", accent: "#ffd84d", glow: "rgba(77, 232, 232, 0.4)" },
  "velocity-rush": { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  velocityRush: { primary: "#4da3ff", secondary: "#ff5c8a", accent: "#ffd84d", glow: "rgba(77, 163, 255, 0.4)" },
  "line-rider-lab": { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffffff", glow: "rgba(168, 121, 255, 0.4)" },
  lineRiderLab: { primary: "#a879ff", secondary: "#4de8e8", accent: "#ffffff", glow: "rgba(168, 121, 255, 0.4)" },
  "garden-defense": { primary: "#63e66d", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  gardenDefense: { primary: "#63e66d", secondary: "#ff9f43", accent: "#ffd84d", glow: "rgba(99, 230, 109, 0.4)" },
  "coaster-lab": { primary: "#ffd84d", secondary: "#a879ff", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  coasterLab: { primary: "#ffd84d", secondary: "#a879ff", accent: "#ff5c8a", glow: "rgba(255, 216, 77, 0.4)" },
  "pixel-quest": { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#63e66d", glow: "rgba(255, 92, 138, 0.4)" },
  pixelQuest: { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#63e66d", glow: "rgba(255, 92, 138, 0.4)" },
  "ray-sector": { primary: "#4de8e8", secondary: "#ff9f43", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  raySector: { primary: "#4de8e8", secondary: "#ff9f43", accent: "#ff5c8a", glow: "rgba(77, 232, 232, 0.4)" },
  "pixel-brawl": { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#4da3ff", glow: "rgba(255, 92, 138, 0.4)" },
  pixelBrawl: { primary: "#ff5c8a", secondary: "#ffd84d", accent: "#4da3ff", glow: "rgba(255, 92, 138, 0.4)" },
  "monster-arena": { primary: "#ff5c8a", secondary: "#ffffff", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  monsterArena: { primary: "#ff5c8a", secondary: "#ffffff", accent: "#ffd84d", glow: "rgba(255, 92, 138, 0.4)" },
  "pixel-circuit": { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#63e66d", glow: "rgba(255, 216, 77, 0.4)" },
  pixelCircuit: { primary: "#ffd84d", secondary: "#ff5c8a", accent: "#63e66d", glow: "rgba(255, 216, 77, 0.4)" },
  hotlap: { primary: "#ff7a45", secondary: "#ffd84d", accent: "#4de8e8", glow: "rgba(255, 122, 69, 0.45)" },
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
      // === TIER 1: CORE CLASSICS ===
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

      // === TIER 2: PUZZLE GAMES ===
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
            {/* 16-Bit Tactile Amber & Slate Pixel Blocks */}
            <rect x="4" y="4" width="6" height="6" fill="#1e293b" stroke="#334155" strokeWidth="0.8" rx="1" />
            <rect x="12" y="4" width="6" height="6" fill="#d97706" stroke="#f59e0b" strokeWidth="0.8" rx="1" />
            <rect x="13.5" y="5.5" width="3" height="3" fill="#fde047" />
            <rect x="20" y="4" width="6" height="6" fill="#1e293b" stroke="#334155" strokeWidth="0.8" rx="1" />

            <rect x="4" y="12" width="6" height="6" fill="#d97706" stroke="#f59e0b" strokeWidth="0.8" rx="1" />
            <rect x="5.5" y="13.5" width="3" height="3" fill="#fde047" />
            <rect x="12" y="12" width="6" height="6" fill="#1e293b" stroke="#334155" strokeWidth="0.8" rx="1" />
            <rect x="20" y="12" width="6" height="6" fill="#d97706" stroke="#f59e0b" strokeWidth="0.8" rx="1" />
            <rect x="21.5" y="13.5" width="3" height="3" fill="#fde047" />

            <rect x="4" y="20" width="6" height="6" fill="#1e293b" stroke="#334155" strokeWidth="0.8" rx="1" />
            <rect x="12" y="20" width="6" height="6" fill="#d97706" stroke="#f59e0b" strokeWidth="0.8" rx="1" />
            <rect x="13.5" y="21.5" width="3" height="3" fill="#fde047" />
            <rect x="20" y="20" width="6" height="6" fill="#1e293b" stroke="#334155" strokeWidth="0.8" rx="1" />
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
            {/* Polished Hardwood Outer Frame */}
            <rect x="3" y="3" width="24" height="24" fill="#451a03" stroke="#78350f" strokeWidth="1" rx="2" />
            {/* Numbered Sliding Wooden Tiles [1] [2] / [3] [Empty] */}
            <rect x="5" y="5" width="9" height="9" fill="#b45309" stroke="#d97706" strokeWidth="0.8" rx="1" />
            <rect x="8" y="7" width="3" height="5" fill="#fef08a" />
            <rect x="16" y="5" width="9" height="9" fill="#b45309" stroke="#d97706" strokeWidth="0.8" rx="1" />
            <rect x="18" y="7" width="5" height="5" fill="#fef08a" rx="0.5" />
            <rect x="5" y="16" width="9" height="9" fill="#b45309" stroke="#d97706" strokeWidth="0.8" rx="1" />
            <circle cx="9.5" cy="20.5" r="2.5" fill="#fef08a" />
            {/* Empty Slot with Beveled Drop Shadow */}
            <rect x="16" y="16" width="9" height="9" fill="#1c1917" rx="1" />
          </>
        );

      case "maze-runner":
      case "mazeRunner":
        return (
          <>
            {/* Spacious Multi-Biome Labyrinth Walls */}
            <path d="M 3,3 L 27,3 L 27,27 L 3,27 Z" fill="#090d16" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M 3,11 L 18,11 L 18,19 L 10,19" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M 10,3 L 10,7" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            <path d="M 22,11 L 22,23" fill="none" stroke="#38bdf8" strokeWidth="1.5" />
            {/* Collectible Crystal */}
            <polygon points="7,7 9,5 7,3 5,5" fill="#f43f5e" />
            {/* Glowing Portal Vortex Exit */}
            <circle cx="23" cy="23" r="3.5" fill="#a855f7" />
            <circle cx="23" cy="23" r="2" fill="#38bdf8" />
            <circle cx="23" cy="23" r="0.8" fill="#ffffff" />
            {/* Runner Hero */}
            <circle cx="6" cy="15" r="2.2" fill="#fbbf24" />
          </>
        );

      case "pipe-connect":
      case "pipeConnect":
        return (
          <>
            {/* Industrial Plumbing Tile Grid */}
            <rect x="3" y="3" width="24" height="24" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="2" />
            {/* Interlocking Copper & Steel Elbows with Flowing Water */}
            <path d="M 4,15 L 15,15 L 15,26" fill="none" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <path d="M 4,15 L 15,15 L 15,26" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeLinecap="round" />
            {/* Upper Right Curved Pipe */}
            <path d="M 15,4 L 15,10 L 26,10" fill="none" stroke="#475569" strokeWidth="5" strokeLinecap="round" />
            <path d="M 15,4 L 15,10 L 26,10" fill="none" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            {/* Brass Flange Couplings */}
            <circle cx="15" cy="15" r="3.5" fill="#f59e0b" stroke="#b45309" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="1.5" fill="#fde047" />
            {/* Water Flow Sparkles */}
            <circle cx="8" cy="15" r="0.8" fill="#ffffff" />
            <circle cx="15" cy="22" r="0.8" fill="#ffffff" />
            <circle cx="22" cy="10" r="0.8" fill="#ffffff" />
          </>
        );
      case "sudoku":
        return (
          <>
            {/* Golden Slate Sudoku Grid */}
            <rect x="4" y="3" width="22" height="18" fill="#0f172a" stroke="#d97706" strokeWidth="1.5" rx="1.5" />
            <line x1="11.3" y1="3" x2="11.3" y2="21" stroke="#b45309" strokeWidth="0.8" />
            <line x1="18.6" y1="3" x2="18.6" y2="21" stroke="#b45309" strokeWidth="0.8" />
            <line x1="4" y1="9" x2="26" y2="9" stroke="#b45309" strokeWidth="0.8" />
            <line x1="4" y1="15" x2="26" y2="15" stroke="#b45309" strokeWidth="0.8" />
            {/* Filled Numbers */}
            <rect x="6" y="5" width="3" height="3" fill="#fbbf24" rx="0.5" />
            <rect x="21" y="5" width="3" height="3" fill="#38bdf8" rx="0.5" />
            <rect x="13" y="11" width="3" height="3" fill="#f43f5e" rx="0.5" />
            <rect x="6" y="17" width="3" height="3" fill="#34d399" rx="0.5" />
            {/* 3 Interactive Candidate Choice Chips [1] [2] [3] */}
            <rect x="5" y="23" width="5.5" height="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" rx="1" />
            <rect x="12.2" y="23" width="5.5" height="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" rx="1" />
            <rect x="19.5" y="23" width="5.5" height="4" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.8" rx="1" />
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

      // === TIER 3: PHYSICS & REFLEX ===
      case "orbital":
        return (
          <>
            <circle cx="15" cy="15" r="5" fill="#4de8e8" />
            <circle cx="15" cy="15" r="10" fill="none" stroke="#ffd84d" strokeWidth="1.5" strokeDasharray="3,3" />
            <circle cx="25" cy="15" r="3" fill="#ff5c8a" />
          </>
        );
      case "gravity-flip":
      case "gravityFlip":
        return (
          <>
            {/* Top & Bottom Hazard Spike Tracks */}
            <rect x="2" y="2" width="26" height="3" fill="#1e1b4b" />
            <polygon points="6,5 8,8 10,5" fill="#ef4444" />
            <polygon points="16,5 18,8 20,5" fill="#ef4444" />
            <rect x="2" y="25" width="26" height="3" fill="#1e1b4b" />
            <polygon points="11,25 13,22 15,25" fill="#ef4444" />
            <polygon points="21,25 23,22 25,25" fill="#ef4444" />
            {/* Gravity Flip Inversion Arrows */}
            <path d="M 8,11 L 8,19 M 6,14 L 8,11 L 10,14" fill="none" stroke="#a855f7" strokeWidth="1.2" />
            <path d="M 22,19 L 22,11 M 20,16 L 22,19 L 24,16" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            {/* Runner Flipping in Mid-Air */}
            <circle cx="15" cy="15" r="3.2" fill="#ffd84d" />
            <rect x="13.5" y="12" width="3" height="6" fill="#ec4899" rx="0.5" />
          </>
        );

      case "ball-drop":
      case "ballDrop":
        return (
          <>
            {/* Galton Board Funnel & Peg Lattice */}
            <polygon points="11,2 19,2 17,6 13,6" fill="#334155" />
            <circle cx="15" cy="9" r="1.2" fill="#38bdf8" />
            <circle cx="11" cy="13" r="1.2" fill="#38bdf8" />
            <circle cx="19" cy="13" r="1.2" fill="#38bdf8" />
            <circle cx="8" cy="17" r="1.2" fill="#38bdf8" />
            <circle cx="15" cy="17" r="1.2" fill="#38bdf8" />
            <circle cx="22" cy="17" r="1.2" fill="#38bdf8" />
            {/* Cascading Bouncing Balls */}
            <circle cx="13" cy="11" r="2" fill="#ffd84d" />
            <circle cx="17.5" cy="15" r="2" fill="#ef4444" />
            {/* Normal Distribution Bottom Bins */}
            <line x1="3" y1="28" x2="27" y2="28" stroke="#64748b" strokeWidth="1.5" />
            <line x1="9" y1="28" x2="9" y2="22" stroke="#64748b" strokeWidth="1" />
            <line x1="15" y1="28" x2="15" y2="20" stroke="#64748b" strokeWidth="1" />
            <line x1="21" y1="28" x2="21" y2="22" stroke="#64748b" strokeWidth="1" />
            <rect x="11" y="24" width="3" height="4" fill="#ffd84d" />
            <rect x="16" y="22" width="3" height="6" fill="#ef4444" />
          </>
        );

      case "rope-swing":
      case "ropeSwing":
        return (
          <>
            {/* Top Anchor Pivot */}
            <circle cx="15" cy="3" r="2.5" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            {/* Taut Swinging Rope Pendulum */}
            <line x1="15" y1="3" x2="23" y2="17" stroke="#d97706" strokeWidth="1.5" />
            {/* Acrobatic Hero at Peak of Swing */}
            <circle cx="23" cy="17" r="3" fill="#38bdf8" />
            <rect x="21" y="19" width="4" height="6" fill="#22c55e" rx="1" transform="rotate(-25 23 22)" />
            {/* Floating Golden Catch Ring */}
            <circle cx="7" cy="18" r="3.5" fill="none" stroke="#ffd84d" strokeWidth="1.5" />
            {/* Hazard Pit Below */}
            <polygon points="2,28 6,23 10,28 14,23 18,28 22,23 26,28" fill="#ef4444" />
          </>
        );

      case "particle-lab":
      case "particleLab":
        return (
          <>
            <circle cx="15" cy="15" r="3" fill="#ffd84d" />
            <circle cx="9" cy="10" r="2" fill="#4de8e8" />
            <circle cx="21" cy="10" r="2" fill="#ff5c8a" />
            <circle cx="8" cy="20" r="2" fill="#a879ff" />
            <circle cx="22" cy="20" r="2" fill="#63e66d" />
          </>
        );

      case "magnet-run":
      case "magnetRun":
        return (
          <>
            {/* Horseshoe Electromagnet */}
            <path d="M 7,4 L 7,16 A 8,8 0 0,0 23,16 L 23,4" fill="none" stroke="#dc2626" strokeWidth="4.5" />
            {/* North Pole (Red) & South Pole (Blue) */}
            <rect x="4.5" y="3" width="5" height="5" fill="#ef4444" rx="0.5" />
            <rect x="20.5" y="3" width="5" height="5" fill="#3b82f6" rx="0.5" />
            {/* Magnetic Flux Field Lines */}
            <path d="M 7,18 Q 15,25 23,18" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
            <path d="M 7,21 Q 15,28 23,21" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" />
            {/* Metallic Ball in Force Field */}
            <circle cx="15" cy="22" r="3" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
          </>
        );

      case "newtons-box":
      case "newtonsBox":
        return (
          <>
            {/* Top Suspension Frame */}
            <rect x="3" y="3" width="24" height="2.5" fill="#64748b" rx="1" />
            {/* 5 Suspension Wires */}
            <line x1="7" y1="4" x2="3" y2="17" stroke="#94a3b8" strokeWidth="1" />
            <line x1="11" y1="4" x2="11" y2="19" stroke="#94a3b8" strokeWidth="1" />
            <line x1="15" y1="4" x2="15" y2="19" stroke="#94a3b8" strokeWidth="1" />
            <line x1="19" y1="4" x2="19" y2="19" stroke="#94a3b8" strokeWidth="1" />
            <line x1="23" y1="4" x2="27" y2="17" stroke="#94a3b8" strokeWidth="1" />
            {/* Steel Spheres */}
            <circle cx="3" cy="17" r="2.8" fill="#f8fafc" stroke="#334155" strokeWidth="0.8" />
            <circle cx="11" cy="19" r="2.8" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
            <circle cx="15" cy="19" r="2.8" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
            <circle cx="19" cy="19" r="2.8" fill="#cbd5e1" stroke="#334155" strokeWidth="0.8" />
            <circle cx="27" cy="17" r="2.8" fill="#f8fafc" stroke="#334155" strokeWidth="0.8" />
            {/* Collision Spark */}
            <polygon points="7,17 9,16 8,18" fill="#ffd84d" />
          </>
        );

      case "ricochet":
        return (
          <>
            {/* Laser Diode Emitter */}
            <rect x="2" y="22" width="6" height="4" fill="#0284c7" rx="0.5" />
            {/* Angled Specular Prisms */}
            <polygon points="12,6 16,3 15,9" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
            <polygon points="24,14 27,10 26,17" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
            <polygon points="11,22 15,19 14,25" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
            {/* Reflected Laser Beam Pathway */}
            <polyline points="8,24 14,6 25,14 13,22 25,27" fill="none" stroke="#f43f5e" strokeWidth="1.5" />
            {/* Target Crystal Exploding */}
            <circle cx="25" cy="27" r="2.5" fill="#facc15" />
          </>
        );

      case "pendulum":
        return (
          <>
            <circle cx="15" cy="5" r="2" fill="#ffffff" />
            <line x1="15" y1="5" x2="22" y2="21" stroke="#4da3ff" strokeWidth="1.5" />
            <circle cx="22" cy="21" r="5" fill="#ffd84d" />
          </>
        );

      case "cannonball":
        return (
          <>
            <polygon points="4,24 16,14 19,17 7,27" fill="#78350f" />
            <rect x="12" y="10" width="10" height="6" transform="rotate(-35 17 13)" fill="#64748b" />
            <circle cx="24" cy="7" r="3" fill="#ff5c8a" />
          </>
        );

      // === TIER 4: SHOOTERS & BULLET HELL ===
      case "twin-stick-arena":
      case "twinStickArena":
        return (
          <>
            {/* Arena Grid Floor */}
            <rect x="3" y="3" width="24" height="24" fill="#0f172a" stroke="#334155" strokeWidth="1" rx="2" />
            {/* Armored Combat Turret Body */}
            <circle cx="15" cy="15" r="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.2" />
            <circle cx="15" cy="15" r="3" fill="#0f172a" />
            {/* Twin Aimed Laser Barrels */}
            <line x1="15" y1="13" x2="26" y2="7" stroke="#facc15" strokeWidth="2" />
            <line x1="15" y1="17" x2="26" y2="11" stroke="#facc15" strokeWidth="2" />
            {/* Surrounding Enemy Drones */}
            <circle cx="6" cy="8" r="2.2" fill="#ef4444" />
            <circle cx="7" cy="23" r="2.2" fill="#ef4444" />
            <circle cx="24" cy="23" r="2.2" fill="#ef4444" />
          </>
        );

      case "bullet-garden":
      case "bulletGarden":
        return (
          <>
            {/* Center Shrine Maiden / Player Core */}
            <circle cx="15" cy="15" r="3.5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1" />
            <circle cx="15" cy="15" r="1.2" fill="#ffffff" />
            {/* Dual Spiral Bullet Vortex */}
            <circle cx="15" cy="6" r="1.8" fill="#a855f7" />
            <circle cx="21" cy="9" r="1.8" fill="#a855f7" />
            <circle cx="24" cy="15" r="1.8" fill="#a855f7" />
            <circle cx="21" cy="21" r="1.8" fill="#a855f7" />
            <circle cx="15" cy="24" r="1.8" fill="#a855f7" />
            <circle cx="9" cy="21" r="1.8" fill="#a855f7" />
            <circle cx="6" cy="15" r="1.8" fill="#a855f7" />
            <circle cx="9" cy="9" r="1.8" fill="#a855f7" />
            {/* Inner Golden Radial Bullets */}
            <circle cx="15" cy="10" r="1.4" fill="#facc15" />
            <circle cx="20" cy="15" r="1.4" fill="#facc15" />
            <circle cx="15" cy="20" r="1.4" fill="#facc15" />
            <circle cx="10" cy="15" r="1.4" fill="#facc15" />
          </>
        );

      case "meteor-rush":
      case "meteorRush":
        return (
          <>
            <polygon points="15,26 12,20 18,20" fill="#4de8e8" />
            <circle cx="8" cy="6" r="4" fill="#ff9f43" />
            <circle cx="22" cy="10" r="3" fill="#ffd84d" />
            <circle cx="15" cy="4" r="2" fill="#ff5c8a" />
          </>
        );

      case "boss-reactor":
      case "bossReactor":
        return (
          <>
            {/* Void Vanguard Mechanical Boss Core */}
            <circle cx="15" cy="15" r="9" fill="#0f172a" stroke="#475569" strokeWidth="1" />
            {/* Rotating Segmented Red Armor Plates */}
            <path d="M 15,6 A 9,9 0 0,1 24,15" fill="none" stroke="#ef4444" strokeWidth="3" />
            <path d="M 15,24 A 9,9 0 0,1 6,15" fill="none" stroke="#ef4444" strokeWidth="3" />
            {/* Pulsating Glowing Core Plasma */}
            <circle cx="15" cy="15" r="4.5" fill="#f97316" stroke="#fde047" strokeWidth="1" />
            <circle cx="15" cy="15" r="2" fill="#ffffff" />
            {/* Twin Angular Laser Sweeps */}
            <line x1="6" y1="6" x2="1" y2="1" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="24" y1="24" x2="29" y2="29" stroke="#38bdf8" strokeWidth="1.5" />
          </>
        );
      case "rail-blaster":
      case "railBlaster":
        return (
          <>
            <line x1="6" y1="4" x2="6" y2="26" stroke="#475569" strokeWidth="2" />
            <line x1="24" y1="4" x2="24" y2="26" stroke="#475569" strokeWidth="2" />
            <rect x="4" y="18" width="22" height="4" fill="#4de8e8" />
            <line x1="15" y1="18" x2="15" y2="6" stroke="#ffd84d" strokeWidth="2" />
          </>
        );
      case "drone-swarm":
      case "droneSwarm":
        return (
          <>
            {/* Boid Radar & Communication Field Waves */}
            <circle cx="15" cy="15" r="10" fill="none" stroke="#38bdf8" strokeWidth="0.8" strokeDasharray="2,2" opacity="0.6" />
            {/* Golden Leader Drone */}
            <polygon points="15,10 12,16 18,16" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="15" cy="13" r="1.2" fill="#ffffff" />
            {/* Flocking Micro-Drones in Formation */}
            <polygon points="8,8 6,12 10,12" fill="#38bdf8" />
            <polygon points="22,8 20,12 24,12" fill="#38bdf8" />
            <polygon points="6,19 4,23 8,23" fill="#22c55e" />
            <polygon points="24,19 22,23 26,23" fill="#22c55e" />
            <polygon points="15,22 13,26 17,26" fill="#ec4899" />
          </>
        );

      case "target-range":
      case "targetRange":
        return (
          <>
            <circle cx="15" cy="15" r="10" fill="none" stroke="#ffd84d" strokeWidth="2" />
            <circle cx="15" cy="15" r="6" fill="none" stroke="#ff5c8a" strokeWidth="2" />
            <circle cx="15" cy="15" r="2" fill="#4da3ff" />
          </>
        );

      case "missile-command":
      case "missileCommand":
        return (
          <>
            {/* Incoming ICBM Warhead Trajectories */}
            <line x1="2" y1="2" x2="11" y2="15" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2,2" />
            <line x1="28" y1="2" x2="19" y2="14" stroke="#ef4444" strokeWidth="1.2" strokeDasharray="2,2" />
            {/* Interceptor Flak Explosions */}
            <circle cx="11" cy="15" r="4.5" fill="#f97316" opacity="0.85" />
            <circle cx="11" cy="15" r="2" fill="#fde047" />
            <circle cx="19" cy="14" r="4" fill="#f97316" opacity="0.85" />
            <circle cx="19" cy="14" r="1.8" fill="#fde047" />
            {/* Interceptor Missile Trails */}
            <line x1="6" y1="25" x2="11" y2="15" stroke="#38bdf8" strokeWidth="1.2" />
            <line x1="24" y1="25" x2="19" y2="14" stroke="#38bdf8" strokeWidth="1.2" />
            {/* City Base & ABM Batteries */}
            <rect x="2" y="25" width="26" height="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <rect x="5" y="22" width="4" height="4" fill="#22c55e" rx="1" />
            <rect x="13" y="21" width="4" height="5" fill="#64748b" rx="0.5" />
            <rect x="21" y="22" width="4" height="4" fill="#22c55e" rx="1" />
          </>
        );

      // === TIER 5: PLATFORMERS & MOVEMENT ===
      case "pixel-jumper":
      case "pixelJumper":
        return (
          <>
            {/* Floating Cloud */}
            <ellipse cx="22" cy="7" rx="5" ry="2.5" fill="#334155" />
            {/* Green Alien Jumper in Mid-Air Bounce */}
            <circle cx="15" cy="11" r="4" fill="#22c55e" stroke="#15803d" strokeWidth="0.8" />
            <circle cx="13" cy="10" r="1.2" fill="#ffffff" />
            <circle cx="17" cy="10" r="1.2" fill="#ffffff" />
            <circle cx="13" cy="10" r="0.6" fill="#000000" />
            <circle cx="17" cy="10" r="0.6" fill="#000000" />
            <rect x="13" y="14" width="4" height="3" fill="#15803d" rx="1" />
            {/* Wooden Spring Platform */}
            <rect x="6" y="22" width="18" height="4" fill="#92400e" stroke="#78350f" strokeWidth="0.8" rx="1" />
            {/* Coiled Golden Spring */}
            <path d="M 13,22 Q 17,20 13,18 Q 17,16 15,15" fill="none" stroke="#facc15" strokeWidth="1.8" />
            <circle cx="15" cy="15" r="1.2" fill="#ca8a04" />
          </>
        );

      case "wall-runner":
      case "wallRunner":
        return (
          <>
            {/* Left & Right Vertical Brick Walls */}
            <rect x="2" y="2" width="5" height="26" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <line x1="2" y1="10" x2="7" y2="10" stroke="#475569" strokeWidth="0.8" />
            <line x1="2" y1="18" x2="7" y2="18" stroke="#475569" strokeWidth="0.8" />
            <rect x="23" y="2" width="5" height="26" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <line x1="23" y1="14" x2="28" y2="14" stroke="#475569" strokeWidth="0.8" />
            <line x1="23" y1="22" x2="28" y2="22" stroke="#475569" strokeWidth="0.8" />
            {/* Zig-Zag Wall Jump Trajectory */}
            <polyline points="7,22 23,15 7,8" fill="none" stroke="#facc15" strokeWidth="1.2" strokeDasharray="2,2" />
            {/* Ninja Mid-Wall-Kick Pose */}
            <circle cx="20" cy="14" r="2.8" fill="#ef4444" />
            <rect x="18" y="15" width="4" height="5" fill="#0f172a" rx="0.5" transform="rotate(-30 20 17)" />
            {/* Kinetic Kick Sparks */}
            <polygon points="23,17 25,16 24,18" fill="#ffd84d" />
          </>
        );

      case "dash-runner":
      case "dashRunner":
        return (
          <>
            <rect x="14" y="10" width="10" height="10" fill="#ff9f43" />
            <line x1="4" y1="12" x2="12" y2="12" stroke="#ffd84d" strokeWidth="2" />
            <line x1="6" y1="16" x2="12" y2="16" stroke="#ffd84d" strokeWidth="2" />
            <line x1="4" y1="20" x2="12" y2="20" stroke="#ffd84d" strokeWidth="2" />
          </>
        );

      case "cave-escape":
      case "caveEscape":
        return (
          <>
            {/* Jagged Cavern Ceiling Stalactites */}
            <polygon points="2,2 6,9 11,3 16,8 21,2 25,7 28,2" fill="#1c1917" stroke="#44403c" strokeWidth="0.8" />
            {/* Jagged Floor Stalagmites */}
            <polygon points="2,28 7,22 12,28 17,21 21,28 28,28" fill="#1c1917" stroke="#44403c" strokeWidth="0.8" />
            {/* Sci-Fi Lunar Cavern Lander Pod */}
            <rect x="11" y="12" width="8" height="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="0.8" rx="1" />
            <ellipse cx="15" cy="12" rx="3" ry="2" fill="#e0f2fe" />
            {/* Dual Rocket Thruster Exhaust Plumes */}
            <polygon points="12,18 10,24 14,24" fill="#f97316" />
            <polygon points="12,18 11,22 13,22" fill="#fde047" />
            <polygon points="18,18 16,24 20,24" fill="#f97316" />
            <polygon points="18,18 17,22 19,22" fill="#fde047" />
            {/* Green Landing Beacon Platform */}
            <rect x="22" y="24" width="5" height="2" fill="#22c55e" />
          </>
        );

      case "one-button-jump":
      case "oneButtonJump":
        return (
          <>
            <circle cx="15" cy="15" r="10" fill="#ff5c8a" />
            <polygon points="12,10 20,15 12,20" fill="#ffffff" />
          </>
        );

      case "shadow-runner":
      case "shadowRunner":
        return (
          <>
            {/* Dark Stone Floor & Wall Background */}
            <rect x="2" y="2" width="26" height="26" fill="#090d18" stroke="#1e293b" strokeWidth="1" rx="2" />
            {/* Sweeping Brilliant Yellow Searchlight Cone */}
            <polygon points="26,4 4,20 18,26" fill="#facc15" opacity="0.35" />
            {/* Stone Pillar Casting Pitch-Black Shadow */}
            <rect x="9" y="8" width="5" height="12" fill="#334155" stroke="#475569" strokeWidth="0.8" />
            <polygon points="14,8 26,18 14,20" fill="#000000" opacity="0.9" />
            {/* Stealth Ninja Hiding in the Shadow */}
            <circle cx="17" cy="14" r="2.8" fill="#7c3aed" />
            <circle cx="16" cy="13.5" r="0.6" fill="#38bdf8" />
            <circle cx="18" cy="13.5" r="0.6" fill="#38bdf8" />
            <rect x="15" y="16" width="4" height="5" fill="#4c1d95" rx="0.5" />
          </>
        );
      case "gravity-maze":
      case "gravityMaze":
        return (
          <>
            <rect x="5" y="5" width="20" height="20" fill="none" stroke="#4da3ff" strokeWidth="2" />
            <circle cx="15" cy="15" r="4" fill="#ffd84d" />
            <polygon points="15,6 12,10 18,10" fill="#ff5c8a" />
          </>
        );

      // === TIER 6: STRATEGY & BOARD GAMES ===
      case "connect-four":
      case "connectFour":
        return (
          <>
            {/* 3D Modern Royal Blue Grid */}
            <rect x="3" y="4" width="24" height="22" fill="#1e3a8a" rx="3" stroke="#2563eb" strokeWidth="1" />
            {/* Radial Discs */}
            <circle cx="8" cy="9" r="2.8" fill="#eab308" stroke="#facc15" strokeWidth="0.8" />
            <circle cx="15" cy="9" r="2.8" fill="#dc2626" stroke="#ef4444" strokeWidth="0.8" />
            <circle cx="22" cy="9" r="2.8" fill="#eab308" stroke="#facc15" strokeWidth="0.8" />
            <circle cx="8" cy="15" r="2.8" fill="#dc2626" stroke="#ef4444" strokeWidth="0.8" />
            <circle cx="15" cy="15" r="2.8" fill="#eab308" stroke="#facc15" strokeWidth="0.8" />
            <circle cx="22" cy="15" r="2.8" fill="#dc2626" stroke="#ef4444" strokeWidth="0.8" />
            <circle cx="8" cy="21" r="2.8" fill="#eab308" stroke="#facc15" strokeWidth="0.8" />
            <circle cx="15" cy="21" r="2.8" fill="#eab308" stroke="#facc15" strokeWidth="0.8" />
            <circle cx="22" cy="21" r="2.8" fill="#eab308" stroke="#facc15" strokeWidth="0.8" />
            {/* Winning Laser Beam Across Bottom */}
            <line x1="6" y1="21" x2="24" y2="21" stroke="#fde047" strokeWidth="1.5" strokeLinecap="round" />
          </>
        );
      case "tic-tac-toe-plus":
      case "ticTacToePlus":
        return (
          <>
            <line x1="11" y1="4" x2="11" y2="26" stroke="#4de8e8" strokeWidth="1.5" />
            <line x1="19" y1="4" x2="19" y2="26" stroke="#4de8e8" strokeWidth="1.5" />
            <line x1="4" y1="11" x2="26" y2="11" stroke="#4de8e8" strokeWidth="1.5" />
            <line x1="4" y1="19" x2="26" y2="19" stroke="#4de8e8" strokeWidth="1.5" />
            <line x1="6" y1="6" x2="9" y2="9" stroke="#ffd84d" strokeWidth="2" />
            <line x1="9" y1="6" x2="6" y2="9" stroke="#ffd84d" strokeWidth="2" />
            <circle cx="15" cy="15" r="2" fill="none" stroke="#ff5c8a" strokeWidth="2" />
          </>
        );
      case "checkers":
        return (
          <>
            <rect x="4" y="4" width="11" height="11" fill="#1e293b" />
            <rect x="15" y="4" width="11" height="11" fill="#dc2626" />
            <rect x="4" y="15" width="11" height="11" fill="#dc2626" />
            <rect x="15" y="15" width="11" height="11" fill="#1e293b" />
            <circle cx="9.5" cy="9.5" r="3.5" fill="#ffffff" />
            <circle cx="20.5" cy="20.5" r="3.5" fill="#1e293b" />
          </>
        );
      case "reversi":
        return (
          <>
            <rect x="4" y="4" width="22" height="22" fill="#15803d" />
            <circle cx="11" cy="11" r="3.5" fill="#ffffff" />
            <circle cx="19" cy="11" r="3.5" fill="#0f172a" />
            <circle cx="11" cy="19" r="3.5" fill="#0f172a" />
            <circle cx="19" cy="19" r="3.5" fill="#ffffff" />
          </>
        );
      case "chess-mini":
      case "chessMini":
        return (
          <>
            {/* Chess King/Knight crown */}
            <rect x="10" y="18" width="10" height="6" fill="#ffffff" rx="1" />
            <rect x="12" y="10" width="6" height="8" fill="#ffffff" />
            <polygon points="8,10 12,14 15,8 18,14 22,10 20,18 10,18" fill="#ffd84d" />
            <circle cx="15" cy="6" r="1.5" fill="#ff5c8a" />
          </>
        );
      case "tower-defense":
      case "towerDefense":
        return (
          <>
            <rect x="10" y="12" width="10" height="12" fill="#64748b" />
            <polygon points="8,12 15,4 22,12" fill="#ffd84d" />
            <circle cx="15" cy="16" r="2" fill="#4de8e8" />
            <circle cx="25" cy="20" r="2" fill="#ff5c8a" />
          </>
        );
      case "kingdom-grid":
      case "kingdomGrid":
        return (
          <>
            <rect x="4" y="16" width="8" height="8" fill="#15803d" />
            <rect x="14" y="16" width="8" height="8" fill="#ffd84d" />
            <rect x="9" y="8" width="8" height="8" fill="#3b82f6" />
          </>
        );
      case "resource-miner":
      case "resourceMiner":
        return (
          <>
            <polygon points="15,4 24,18 6,18" fill="#ff9f43" />
            <circle cx="15" cy="12" r="3" fill="#ffd84d" />
            <line x1="8" y1="24" x2="22" y2="24" stroke="#64748b" strokeWidth="2" />
          </>
        );

      // === TIER 7: EXPERIMENTAL & MATH SIMULATION ===
      case "fractal-garden":
      case "fractalGarden":
        return (
          <>
            <line x1="15" y1="26" x2="15" y2="16" stroke="#63e66d" strokeWidth="2" />
            <line x1="15" y1="16" x2="9" y2="10" stroke="#4de8e8" strokeWidth="1.5" />
            <line x1="15" y1="16" x2="21" y2="10" stroke="#4de8e8" strokeWidth="1.5" />
            <circle cx="9" cy="10" r="2" fill="#ff5c8a" />
            <circle cx="21" cy="10" r="2" fill="#ffd84d" />
          </>
        );
      case "cell-colony":
      case "cellColony":
        return (
          <>
            {/* Living Blue Node */}
            <circle cx="9" cy="12" r="5.5" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <circle cx="9" cy="12" r="2.5" fill="#ffffff" />
            {/* Living Red Enemy Node */}
            <circle cx="21" cy="18" r="5" fill="#991b1b" stroke="#ef4444" strokeWidth="1.5" />
            <circle cx="21" cy="18" r="2" fill="#fca5a5" />
            {/* Neutral Node */}
            <circle cx="21" cy="8" r="3.5" fill="#334155" stroke="#94a3b8" strokeWidth="1" />
            {/* Spore Swarm Stream */}
            <circle cx="13" cy="14" r="1.2" fill="#38bdf8" />
            <circle cx="15" cy="15" r="1.5" fill="#38bdf8" />
            <circle cx="17" cy="16" r="1.2" fill="#38bdf8" />
            <circle cx="19" cy="17" r="1.8" fill="#38bdf8" />
          </>
        );
      case "gravity-well":
      case "gravityWell":
        return (
          <>
            <circle cx="15" cy="15" r="4" fill="#060e1c" stroke="#a879ff" strokeWidth="2" />
            <ellipse cx="15" cy="15" rx="11" ry="5" fill="none" stroke="#ffd84d" strokeWidth="1" transform="rotate(30 15 15)" />
            <ellipse cx="15" cy="15" rx="11" ry="5" fill="none" stroke="#4de8e8" strokeWidth="1" transform="rotate(-30 15 15)" />
          </>
        );
      case "neon-circuit":
      case "neonCircuit":
        return (
          <>
            <polyline points="4,8 12,8 12,22 26,22" fill="none" stroke="#4de8e8" strokeWidth="2" />
            <circle cx="12" cy="8" r="2.5" fill="#ffd84d" />
            <circle cx="12" cy="22" r="2.5" fill="#ff5c8a" />
          </>
        );

      // === TIER 8: NEW MATHEMATICAL SYSTEMS ===
      case "sand-world":
      case "sandWorld":
        return (
          <>
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
            <rect x="3" y="13" width="5" height="4" fill="#ffd84d" />
            <line x1="8" y1="15" x2="16" y2="15" stroke="#4de8e8" strokeWidth="2" />
            <polygon points="14,19 20,13 18,11 12,17" fill="#ffffff" />
            <line x1="16" y1="15" x2="16" y2="5" stroke="#ff5c8a" strokeWidth="2" />
            <circle cx="16" cy="4" r="3" fill="#63e66d" />
          </>
        );
      case "fractal-explorer":
      case "fractalExplorer":
        return (
          <>
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
            {/* Warehouse Floor */}
            <rect x="3" y="3" width="24" height="24" fill="#1c1917" stroke="#44403c" strokeWidth="1" rx="2" />
            {/* Target Goal Pad */}
            <circle cx="21" cy="9" r="4" fill="#065f46" stroke="#10b981" strokeWidth="1" />
            <circle cx="21" cy="9" r="1.5" fill="#34d399" />
            {/* Tactile Wooden Crate with Brass Corner Rivets */}
            <rect x="11" y="11" width="9" height="9" fill="#d97706" stroke="#78350f" strokeWidth="1" rx="1" />
            <line x1="11" y1="11" x2="20" y2="20" stroke="#92400e" strokeWidth="0.8" />
            <line x1="20" y1="11" x2="11" y2="20" stroke="#92400e" strokeWidth="0.8" />
            <circle cx="12" cy="12" r="0.6" fill="#fde047" />
            <circle cx="19" cy="19" r="0.6" fill="#fde047" />
            {/* Warehouse Keeper Hero */}
            <circle cx="7" cy="15" r="3" fill="#38bdf8" />
            <circle cx="7" cy="15" r="1.2" fill="#ffffff" />
            <rect x="8.5" y="13" width="2.5" height="4" fill="#0284c7" rx="0.5" />
          </>
        );
      case "algorithm-dungeon":
      case "algorithmDungeon":
        return (
          <>
            <rect x="4" y="4" width="22" height="22" fill="#0a1426" stroke="#1e3060" />
            <line x1="12" y1="4" x2="12" y2="18" stroke="#1e3060" strokeWidth="2" />
            <line x1="18" y1="10" x2="18" y2="26" stroke="#1e3060" strokeWidth="2" />
            <circle cx="7" cy="7" r="3" fill="#4de8e8" opacity="0.6" />
            <polyline points="7,7 7,22 22,22" fill="none" stroke="#ffd84d" strokeWidth="2" />
          </>
        );
      case "spring-mass":
      case "springMass":
        return (
          <>
            <rect x="12" y="3" width="6" height="3" fill="#ffffff" />
            <polyline points="15,6 18,9 12,12 18,15 12,18 15,21" fill="none" stroke="#4da3ff" strokeWidth="2" />
            <circle cx="15" cy="24" r="4" fill="#ffd84d" />
          </>
        );
      case "logic-gates":
      case "logicGates":
        return (
          <>
            {/* PCB Green Board with Copper Circuit Traces */}
            <rect x="3" y="3" width="24" height="24" fill="#064e3b" stroke="#047857" strokeWidth="1" rx="2" />
            {/* Input Switches */}
            <rect x="5" y="7" width="5" height="4" fill="#0284c7" rx="1" />
            <circle cx="9" cy="9" r="1.5" fill="#38bdf8" />
            <rect x="5" y="19" width="5" height="4" fill="#334155" rx="1" />
            <circle cx="6.5" cy="21" r="1.5" fill="#94a3b8" />
            {/* Copper PCB Traces */}
            <line x1="10" y1="9" x2="13" y2="9" stroke="#f59e0b" strokeWidth="1.2" />
            <line x1="10" y1="21" x2="13" y2="21" stroke="#64748b" strokeWidth="1.2" />
            {/* Logic Gate IC Body */}
            <path d="M 13,6 L 18,6 A 9,9 0 0,1 18,24 L 13,24 Z" fill="#0f172a" stroke="#f59e0b" strokeWidth="1" />
            {/* Output Trace & Glowing Status Bulb */}
            <line x1="22" y1="15" x2="24" y2="15" stroke="#f59e0b" strokeWidth="1.5" />
            <circle cx="25" cy="15" r="2" fill="#22c55e" />
            <circle cx="25" cy="15" r="1" fill="#ffffff" />
          </>
        );
      case "cave-generator":
      case "caveGenerator":
        return (
          <>
            <rect x="4" y="4" width="22" height="22" fill="#172548" />
            <polygon points="8,8 14,6 20,9 22,18 16,22 8,20 6,12" fill="#060e1c" />
            <circle cx="12" cy="14" r="2" fill="#4de8e8" />
          </>
        );
      case "voronoi-garden":
      case "voronoiGarden":
        return (
          <>
            <polygon points="4,4 16,4 14,14 4,12" fill="#ffd84d" opacity="0.85" />
            <polygon points="16,4 26,4 26,16 14,14" fill="#ff5c8a" opacity="0.85" />
            <polygon points="4,12 14,14 18,26 4,26" fill="#4de8e8" opacity="0.85" />
            <polygon points="14,14 26,16 26,26 18,26" fill="#a879ff" opacity="0.85" />
          </>
        );
      case "dungeon-generator":
      case "dungeonGenerator":
        return (
          <>
            <rect x="4" y="5" width="8" height="7" fill="#2a3d66" stroke="#4da3ff" />
            <rect x="18" y="5" width="8" height="9" fill="#2a3d66" stroke="#4da3ff" />
            <rect x="8" y="17" width="14" height="8" fill="#2a3d66" stroke="#4da3ff" />
            <line x1="12" y1="8" x2="18" y2="8" stroke="#ffd84d" strokeWidth="1.5" />
          </>
        );

      // === TIER 9: ADVANCED SYSTEMS EXPANSION ===
      case "ant-colony":
      case "antColony":
        return (
          <>
            <polygon points="15,4 22,12 8,12" fill="#ffd84d" />
            <circle cx="15" cy="10" r="2" fill="#060e1c" />
            <circle cx="11" cy="16" r="1" fill="#63e66d" />
            <circle cx="18" cy="20" r="1" fill="#63e66d" />
            <rect x="9" y="17" width="4" height="2" fill="#ffffff" />
            <rect x="17" y="21" width="4" height="2" fill="#ffffff" />
          </>
        );
      case "orbital-mechanics":
      case "orbitalMechanics":
        return (
          <>
            <circle cx="15" cy="15" r="5" fill="#ff9f43" />
            <ellipse cx="15" cy="15" rx="12" ry="6" fill="none" stroke="#4de8e8" strokeWidth="1" strokeDasharray="2,2" />
            <polygon points="26,12 28,15 25,16" fill="#ffd84d" />
          </>
        );
      case "pool-simulator":
      case "poolSimulator":
        return (
          <>
            {/* 3D Phenolic Resin Billiard Table */}
            <rect x="3" y="5" width="24" height="20" fill="#78350f" rx="3" stroke="#b45309" strokeWidth="1" />
            <rect x="5" y="7" width="20" height="16" fill="#047857" rx="1" />
            {/* Diamond Sights */}
            <circle cx="15" cy="6" r="0.75" fill="#f8fafc" />
            <circle cx="15" cy="24" r="0.75" fill="#f8fafc" />
            {/* 3D Billiard Balls */}
            <circle cx="10" cy="14" r="2.5" fill="#ffffff" />
            <circle cx="17" cy="12" r="2.5" fill="#eab308" />
            <circle cx="17" cy="17" r="2.5" fill="#0f172a" />
            <circle cx="17" cy="17" r="1" fill="#ffffff" />
            {/* Cue Stick */}
            <line x1="5" y1="21" x2="8" y2="17" stroke="#fbbf24" strokeWidth="1.5" strokeLinecap="round" />
            <line x1="7.5" y1="17.5" x2="8.5" y2="16.5" stroke="#38bdf8" strokeWidth="1.5" />
          </>
        );
      case "infinite-forest":
      case "infiniteForest":
        return (
          <>
            {/* Snowy Mountain & Christmas Tree */}
            <path d="M 2,24 Q 14,18 28,22 L 28,28 L 2,28 Z" fill="#f8fafc" />
            <polygon points="23,10 26,16 20,16" fill="#15803d" />
            <polygon points="23,14 27,21 19,21" fill="#16a34a" />
            <circle cx="23" cy="9" r="1.5" fill="#fbbf24" />
            <circle cx="21" cy="18" r="1" fill="#ef4444" />
            {/* Green & Yellow Tractor Body */}
            <rect x="5" y="14" width="10" height="7" fill="#15803d" rx="1" />
            <rect x="5" y="10" width="6" height="5" fill="#166534" />
            <rect x="6" y="11" width="4" height="3" fill="#a78bfa" />
            <rect x="8" y="8" width="1.5" height="3" fill="#64748b" />
            <rect x="9" y="16" width="6" height="1.5" fill="#facc15" />
            {/* Big Rear Tire & Yellow Rim */}
            <circle cx="7" cy="21" r="4.5" fill="#1e293b" />
            <circle cx="7" cy="21" r="2.5" fill="#eab308" />
            <circle cx="7" cy="21" r="1" fill="#facc15" />
            {/* Front Wheel */}
            <circle cx="15" cy="22" r="3" fill="#1e293b" />
            <circle cx="15" cy="22" r="1.5" fill="#eab308" />
            {/* High Speed Spinning Carbide Grinder Drum */}
            <circle cx="19" cy="18" r="3.5" fill="#64748b" />
            <circle cx="19" cy="18" r="1.2" fill="#facc15" />
            <polygon points="21,17 23,18 21,19" fill="#f8fafc" />
            <polygon points="17,19 19,21 18,19" fill="#f8fafc" />
            {/* Wood Splinters */}
            <circle cx="21" cy="14" r="0.8" fill="#fde047" />
            <circle cx="22" cy="12" r="0.8" fill="#854d0e" />
          </>
        );
      case "time-loop":
      case "timeLoop":
        return (
          <>
            {/* Breadboard Base */}
            <rect x="3" y="4" width="24" height="22" fill="#0f172a" rx="2" stroke="#334155" strokeWidth="1" />
            {/* 9V Battery */}
            <rect x="5" y="7" width="5" height="9" fill="#334155" rx="1" />
            <rect x="6" y="6" width="3" height="1" fill="#ef4444" />
            {/* Resistor */}
            <rect x="13" y="7" width="6" height="3" fill="#d97706" rx="0.5" />
            <line x1="14.5" y1="7" x2="14.5" y2="10" stroke="#ef4444" strokeWidth="0.6" />
            <line x1="16" y1="7" x2="16" y2="10" stroke="#000000" strokeWidth="0.6" />
            <line x1="17.5" y1="7" x2="17.5" y2="10" stroke="#fbbf24" strokeWidth="0.6" />
            {/* Glowing Red LED */}
            <circle cx="22" cy="11" r="3" fill="#ef4444" />
            <circle cx="22" cy="11" r="1.5" fill="#ffffff" />
            {/* NE555 Timer IC */}
            <rect x="11" y="15" width="8" height="8" fill="#1e293b" rx="1" stroke="#475569" strokeWidth="0.8" />
            <circle cx="15" cy="19" r="1.5" fill="#38bdf8" />
            {/* Insulated Wires */}
            <path d="M 8,7 Q 11,5 13,8" fill="none" stroke="#ef4444" strokeWidth="1.2" />
            <path d="M 19,8 Q 21,7 22,9" fill="none" stroke="#38bdf8" strokeWidth="1.2" />
            <path d="M 22,14 Q 16,25 7,15" fill="none" stroke="#22c55e" strokeWidth="1.2" />
          </>
        );
      case "hex-territory":
      case "hexTerritory":
        return (
          <>
            <polygon points="15,4 20,7 20,13 15,16 10,13 10,7" fill="#ffd84d" />
            <polygon points="22,12 27,15 27,21 22,24 17,21 17,15" fill="#ff5c8a" />
            <polygon points="8,12 13,15 13,21 8,24 3,21 3,15" fill="#4da3ff" />
          </>
        );
      case "quantum-tiles":
      case "quantumTiles":
        return (
          <>
            <rect x="5" y="5" width="8" height="8" fill="#4de8e8" rx="1" />
            <rect x="17" y="5" width="8" height="8" fill="#a879ff" rx="1" />
            <rect x="5" y="17" width="8" height="8" fill="#a879ff" rx="1" />
            <rect x="17" y="17" width="8" height="8" fill="#ffd84d" rx="1" />
            <circle cx="9" cy="9" r="2" fill="#ffffff" />
          </>
        );
      case "color-flood":
      case "colorFlood":
        return (
          <>
            <rect x="4" y="4" width="6" height="6" fill="#ff5c8a" />
            <rect x="12" y="4" width="6" height="6" fill="#ff5c8a" />
            <rect x="20" y="4" width="6" height="6" fill="#4de8e8" />
            <rect x="4" y="12" width="6" height="6" fill="#ff5c8a" />
            <rect x="12" y="12" width="6" height="6" fill="#ffd84d" />
            <rect x="20" y="12" width="6" height="6" fill="#63e66d" />
          </>
        );
      case "fire-spread":
      case "fireSpread":
        return (
          <>
            {/* Forest Mountain Valley */}
            <polygon points="6,16 10,24 2,24" fill="#15803d" />
            <polygon points="14,14 18,24 10,24" fill="#ef4444" />
            <polygon points="14,17 17,23 11,23" fill="#fde047" />
            <polygon points="22,15 26,24 18,24" fill="#991b1b" />
            {/* Air Tanker Firebomber */}
            <rect x="7" y="7" width="16" height="4" fill="#f8fafc" rx="2" />
            <rect x="11" y="7" width="6" height="4" fill="#ea580c" />
            <rect x="13" y="3" width="3" height="12" fill="#e2e8f0" rx="1" />
            <rect x="7" y="5" width="2" height="6" fill="#dc2626" />
            {/* Water / Chemical Retardant Salvo Cloud */}
            <circle cx="14" cy="18" r="4.5" fill="#38bdf8" opacity="0.8" />
            <circle cx="19" cy="19" r="4.5" fill="#ef4444" opacity="0.85" />
            <circle cx="16" cy="19" r="2.5" fill="#ffffff" opacity="0.9" />
          </>
        );
      case "liquid-cells":
      case "liquidCells":
        return (
          <>
            {/* Laboratory Beaker Vessel */}
            <rect x="4" y="5" width="22" height="22" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" rx="2" />
            {/* Dense Blue Liquid Base with Undulating Meniscus */}
            <path d="M 5,16 Q 10,13 15,16 T 25,16 L 25,26 L 5,26 Z" fill="#1e40af" />
            <path d="M 5,18 Q 10,15 15,18 T 25,18 L 25,26 L 5,26 Z" fill="#2563eb" />
            {/* Buoyant Cyan Cellular Droplets */}
            <circle cx="9" cy="20" r="2.5" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.6" />
            <circle cx="16" cy="22" r="2" fill="#67e8f9" />
            <circle cx="21" cy="19" r="1.8" fill="#38bdf8" />
            {/* Suspended Upper Fluid Droplets */}
            <circle cx="12" cy="11" r="2.8" fill="#ec4899" stroke="#fbcfe8" strokeWidth="0.6" />
            <circle cx="19" cy="10" r="2" fill="#f43f5e" />
            {/* Effervescent Rising Micro-Bubbles */}
            <circle cx="8" cy="10" r="0.8" fill="#ffffff" />
            <circle cx="15" cy="7" r="1" fill="#ffffff" />
            <circle cx="21" cy="6" r="0.8" fill="#ffffff" />
          </>
        );
      case "circle-packing-lab":
      case "circlePackingLab":
        return (
          <>
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
            {/* Cyber Highway 3D Perspective Road */}
            <polygon points="12,4 18,4 28,26 2,26" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
            <line x1="15" y1="4" x2="15" y2="26" stroke="#facc15" strokeWidth="1.5" strokeDasharray="3,3" />
            {/* Neon Speed Hurdle Spikes */}
            <polygon points="10,16 12,12 14,16" fill="#ef4444" stroke="#f43f5e" strokeWidth="0.8" />
            <polygon points="16,16 18,12 20,16" fill="#ef4444" stroke="#f43f5e" strokeWidth="0.8" />
            {/* Cyber Runner Sprinting Forward */}
            <circle cx="15" cy="20" r="3" fill="#38bdf8" />
            <rect x="13.5" y="21" width="3" height="4" fill="#a855f7" rx="0.5" />
            {/* Speed Streaks */}
            <line x1="6" y1="22" x2="11" y2="22" stroke="#00f0ff" strokeWidth="1.5" />
            <line x1="19" y1="22" x2="24" y2="22" stroke="#00f0ff" strokeWidth="1.5" />
          </>
        );

      // === PHASE 3: NOSTALGIA CLASSICS EXPANSION ===
      case "maze-chaser":
      case "mazeChaser":
        return (
          <>
            <path d="M 12 15 L 21 8 A 9 9 0 1 0 21 22 Z" fill="#ffd84d" />
            <circle cx="24" cy="15" r="2" fill="#ffffff" />
            <rect x="3" y="10" width="6" height="8" fill="#ff5c8a" rx="3" />
            <circle cx="5" cy="13" r="1" fill="#ffffff" />
            <circle cx="7" cy="13" r="1" fill="#ffffff" />
          </>
        );

      case "road-hopper":
      case "roadHopper":
        return (
          <>
            <rect x="2" y="14" width="26" height="2" fill="#ffd84d" strokeDasharray="4,4" />
            <rect x="10" y="8" width="10" height="10" fill="#63e66d" rx="3" />
            <circle cx="12" cy="7" r="2.5" fill="#ffffff" />
            <circle cx="18" cy="7" r="2.5" fill="#ffffff" />
            <circle cx="12" cy="7" r="1" fill="#000000" />
            <circle cx="18" cy="7" r="1" fill="#000000" />
            <rect x="6" y="12" width="3" height="4" fill="#63e66d" />
            <rect x="21" y="12" width="3" height="4" fill="#63e66d" />
          </>
        );

      case "star-formation":
      case "starFormation":
        return (
          <>
            {/* Curved Flight Path Trail */}
            <path d="M 4,26 Q 15,18 15,6" fill="none" stroke="#38bdf8" strokeWidth="1" strokeDasharray="2,2" opacity="0.6" />
            {/* Lead Flagship Starfighter */}
            <polygon points="15,3 11,13 19,13" fill="#ef4444" />
            <polygon points="15,6 13,12 17,12" fill="#ffffff" />
            <rect x="14" y="13" width="2" height="3" fill="#38bdf8" />
            {/* Wingman Left */}
            <polygon points="7,14 4,22 10,22" fill="#3b82f6" />
            <polygon points="7,16 5,21 9,21" fill="#93c5fd" />
            <rect x="6" y="22" width="2" height="2" fill="#ffd84d" />
            {/* Wingman Right */}
            <polygon points="23,14 20,22 26,22" fill="#3b82f6" />
            <polygon points="23,16 21,21 25,21" fill="#93c5fd" />
            <rect x="22" y="22" width="2" height="2" fill="#ffd84d" />
            {/* Twin Laser Blasts */}
            <line x1="13" y1="2" x2="13" y2="0" stroke="#fde047" strokeWidth="1.5" />
            <line x1="17" y1="2" x2="17" y2="0" stroke="#fde047" strokeWidth="1.5" />
          </>
        );

      case "bomb-grid":
      case "bombGrid":
        return (
          <>
            {/* 4-Way Cross Explosion Blast Waves */}
            <rect x="13" y="1" width="4" height="28" fill="#ef4444" opacity="0.75" />
            <rect x="1" y="13" width="28" height="4" fill="#ef4444" opacity="0.75" />
            <rect x="14" y="3" width="2" height="24" fill="#fde047" />
            <rect x="3" y="14" width="24" height="2" fill="#fde047" />
            {/* Round Black Bomb Body with Highlight */}
            <circle cx="15" cy="16" r="7.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
            <circle cx="12.5" cy="13.5" r="2" fill="#64748b" opacity="0.8" />
            <rect x="13" y="7" width="4" height="3" fill="#475569" rx="0.5" />
            {/* Burning Fuse with Spark Flare */}
            <path d="M 15,7 Q 18,3 21,5" fill="none" stroke="#d97706" strokeWidth="1.5" />
            <circle cx="21" cy="5" r="2.5" fill="#f97316" />
            <circle cx="21" cy="5" r="1.2" fill="#ffffff" />
          </>
        );

      case "peg-blast":
      case "pegBlast":
        return (
          <>
            {/* Ballistics Trajectory Arc */}
            <path d="M 5,6 Q 15,10 23,24" fill="none" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2,2" />
            {/* Glowing Peg Array */}
            <circle cx="8" cy="11" r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="22" cy="10" r="3.5" fill="#3b82f6" stroke="#ffffff" strokeWidth="0.8" />
            <circle cx="15" cy="18" r="4" fill="#ef4444" stroke="#fde047" strokeWidth="1.2" />
            <circle cx="8" cy="24" r="3" fill="#a855f7" />
            <circle cx="22" cy="24" r="3" fill="#10b981" />
            {/* Metallic Cannonball */}
            <circle cx="10" cy="8" r="2.5" fill="#f8fafc" stroke="#334155" strokeWidth="0.8" />
          </>
        );

      case "cave-hunter":
      case "caveHunter":
        return (
          <>
            {/* Cavern Rock Formations */}
            <polygon points="2,2 8,10 14,2 20,9 28,2 28,28 2,28" fill="#1c1917" stroke="#44403c" strokeWidth="1" />
            {/* Rope Pendulum */}
            <line x1="14" y1="2" x2="9" y2="16" stroke="#d97706" strokeWidth="1.5" />
            {/* Spelunker Explorer */}
            <circle cx="9" cy="16" r="3" fill="#f59e0b" />
            <rect x="7" y="18" width="4" height="6" fill="#3b82f6" rx="1" />
            {/* Blazing Torch with Flame Embers */}
            <line x1="11" y1="17" x2="16" y2="13" stroke="#78350f" strokeWidth="1.5" />
            <circle cx="16" cy="13" r="2.5" fill="#ef4444" />
            <circle cx="16" cy="13" r="1.2" fill="#fde047" />
            {/* Golden Treasure Idol */}
            <polygon points="23,24 21,20 25,20" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
          </>
        );

      case "donkey-climb":
      case "donkeyClimb":
        return (
          <>
            {/* Industrial Red Steel Girders */}
            <line x1="2" y1="24" x2="28" y2="21" stroke="#dc2626" strokeWidth="3" />
            <line x1="2" y1="13" x2="28" y2="10" stroke="#dc2626" strokeWidth="3" />
            {/* Climbing Ladder */}
            <line x1="8" y1="11" x2="8" y2="23" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="12" y1="11" x2="12" y2="23" stroke="#38bdf8" strokeWidth="1.5" />
            <line x1="8" y1="14" x2="12" y2="14" stroke="#38bdf8" strokeWidth="1" />
            <line x1="8" y1="17" x2="12" y2="17" stroke="#38bdf8" strokeWidth="1" />
            <line x1="8" y1="20" x2="12" y2="20" stroke="#38bdf8" strokeWidth="1" />
            {/* Rolling Wooden Barrel */}
            <circle cx="21" cy="8" r="4.5" fill="#92400e" stroke="#451a03" strokeWidth="1" />
            <circle cx="21" cy="8" r="2.5" fill="#d97706" />
            {/* Jumpman Hero Leaping */}
            <circle cx="15" cy="16" r="2.5" fill="#ef4444" />
            <rect x="13.5" y="18.5" width="3" height="4" fill="#2563eb" />
          </>
        );

      case "marble-rush":
      case "marbleRush":
        return (
          <>
            {/* Spiraling Rail Track */}
            <path d="M 3,24 Q 15,2 27,24" fill="none" stroke="#475569" strokeWidth="3" />
            {/* Colored Marble Chain */}
            <circle cx="7" cy="18" r="3.2" fill="#38bdf8" stroke="#0284c7" strokeWidth="0.8" />
            <circle cx="12" cy="12" r="3.2" fill="#a855f7" stroke="#7e22ce" strokeWidth="0.8" />
            <circle cx="18" cy="12" r="3.2" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
            <circle cx="23" cy="18" r="3.2" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
            {/* Center Golden Frog/Idol Launcher */}
            <circle cx="15" cy="22" r="4" fill="#22c55e" stroke="#15803d" strokeWidth="1" />
            <circle cx="15" cy="20" r="1.5" fill="#ffd84d" />
          </>
        );

      case "velocity-rush":
      case "velocityRush":
        return (
          <>
            {/* Speed Dash Motion Blur Streaks */}
            <line x1="2" y1="16" x2="10" y2="16" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
            <line x1="4" y1="12" x2="12" y2="12" stroke="#38bdf8" strokeWidth="1.5" opacity="0.8" />
            <line x1="2" y1="20" x2="10" y2="20" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6" />
            {/* Leaping Speedrunner Pose */}
            <circle cx="19" cy="10" r="3.5" fill="#3b82f6" />
            <rect x="15" y="13" width="7" height="6" fill="#ef4444" rx="1" />
            {/* Trailing Boost Foot */}
            <polygon points="12,18 16,16 14,21" fill="#facc15" />
            {/* Forward Kick Foot */}
            <polygon points="22,17 26,19 24,22" fill="#facc15" />
            {/* Golden Sonic Speed Ring */}
            <ellipse cx="10" cy="10" r="2.5" fill="none" stroke="#fde047" strokeWidth="1" />
          </>
        );

      case "line-rider-lab":
      case "lineRiderLab":
        return (
          <>
            <path d="M 4 8 Q 12 26 26 18" fill="none" stroke="#a879ff" strokeWidth="2.5" />
            <polygon points="12,14 16,11 18,17" fill="#4de8e8" />
            <circle cx="15" cy="11" r="2" fill="#ffffff" />
          </>
        );

      case "garden-defense":
      case "gardenDefense":
        return (
          <>
            <rect x="4" y="6" width="22" height="18" fill="#15803d" rx="2" />
            <circle cx="10" cy="15" r="4" fill="#63e66d" />
            <rect x="12" y="13" width="5" height="4" fill="#22c55e" rx="1" />
            <circle cx="21" cy="15" r="2" fill="#ffd84d" />
          </>
        );

      case "coaster-lab":
      case "coasterLab":
        return (
          <>
            <path d="M 4 24 Q 12 4 20 16 T 28 8" fill="none" stroke="#ffd84d" strokeWidth="2" />
            <rect x="10" y="8" width="6" height="4" fill="#ff5c8a" rx="1" transform="rotate(-30 13 10)" />
            <line x1="8" y1="24" x2="8" y2="16" stroke="#475569" strokeWidth="1" />
            <line x1="16" y1="24" x2="16" y2="12" stroke="#475569" strokeWidth="1" />
          </>
        );

      case "pixel-quest":
      case "pixelQuest":
        return (
          <>
            {/* Castle Brick Platform */}
            <rect x="2" y="20" width="26" height="8" fill="#475569" stroke="#334155" strokeWidth="1" rx="1" />
            <line x1="15" y1="20" x2="15" y2="28" stroke="#1e293b" strokeWidth="1" />
            {/* Knight Hero with Silver Helm */}
            <circle cx="11" cy="12" r="3.5" fill="#94a3b8" />
            <rect x="10" y="11" width="3" height="1.5" fill="#0f172a" />
            <rect x="9" y="15" width="5" height="6" fill="#3b82f6" rx="1" />
            {/* Golden Broadsword Raised High */}
            <line x1="15" y1="16" x2="20" y2="9" stroke="#facc15" strokeWidth="2" />
            <circle cx="15" cy="16" r="1.2" fill="#ca8a04" />
            {/* Glowing Blue Treasure Diamond */}
            <polygon points="22,6 25,10 22,14 19,10" fill="#38bdf8" stroke="#ffffff" strokeWidth="0.8" />
          </>
        );

      case "ray-sector":
      case "raySector":
        return (
          <>
            {/* 2.5D Raycaster Corridor Walls with Cyan Conduits */}
            <polygon points="2,2 10,7 10,23 2,28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            <polygon points="28,2 20,7 20,23 28,28" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" />
            <rect x="10" y="7" width="10" height="16" fill="#090d18" />
            {/* Distant Opponent Silhouette */}
            <rect x="13.5" y="12" width="3" height="6" fill="#ef4444" rx="0.5" />
            <circle cx="15" cy="10.5" r="1.5" fill="#fde047" />
            {/* Cyan HUD Reticle */}
            <circle cx="15" cy="13" r="2.5" fill="none" stroke="#00f0ff" strokeWidth="0.8" />
            {/* First-Person Hand & Firearm with Starburst Muzzle Flash */}
            <rect x="18" y="21" width="5" height="4" fill="#334155" />
            <polygon points="20,18 25,23 23,27 18,22" fill="#f59e0b" />
            <polygon points="17,16 21,18 19,20" fill="#fde047" />
            <circle cx="18" cy="17" r="1.8" fill="#ef4444" />
          </>
        );

      case "pixel-brawl":
      case "pixelBrawl":
        return (
          <>
            {/* Arena Mat / Dojo Canvas Floor */}
            <rect x="2" y="24" width="26" height="4" fill="#991b1b" rx="1" />
            {/* Fighter 1 (Red Headband Karateka) */}
            <circle cx="8" cy="11" r="3" fill="#ef4444" />
            <rect x="7" y="10" width="3" height="1" fill="#ffffff" />
            <rect x="6" y="14" width="5" height="7" fill="#f8fafc" rx="1" />
            <line x1="11" y1="15" x2="16" y2="13" stroke="#f8fafc" strokeWidth="2" />
            {/* Fighter 2 (Blue Boxer / Ninja) */}
            <circle cx="22" cy="11" r="3" fill="#3b82f6" />
            <rect x="19" y="14" width="5" height="7" fill="#1e293b" rx="1" />
            <line x1="19" y1="15" x2="16" y2="15" stroke="#3b82f6" strokeWidth="2" />
            {/* Dynamic Yellow Impact Starburst Hit-Spark */}
            <polygon points="15,11 17,14 15,17 13,14" fill="#fde047" stroke="#ffffff" strokeWidth="0.6" />
          </>
        );

      case "monster-arena":
      case "monsterArena":
        return (
          <>
            <circle cx="15" cy="15" r="10" fill="#ffffff" stroke="#1e293b" strokeWidth="2" />
            <path d="M 5 15 A 10 10 0 0 1 25 15 Z" fill="#ff5c8a" />
            <line x1="5" y1="15" x2="25" y2="15" stroke="#1e293b" strokeWidth="2" />
            <circle cx="15" cy="15" r="3" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
          </>
        );

      case "pixel-circuit":
      case "pixelCircuit":
        return (
          <>
            {/* Asphalt Track with Checkered Finish Line */}
            <path d="M 4,24 Q 15,4 26,24" fill="none" stroke="#334155" strokeWidth="4" />
            <line x1="12" y1="8" x2="18" y2="8" stroke="#ffffff" strokeWidth="1.5" strokeDasharray="1.5,1.5" />
            {/* Red & Yellow Go-Kart Racer */}
            <rect x="12" y="13" width="6" height="9" fill="#ef4444" rx="1" />
            <rect x="13.5" y="11" width="3" height="4" fill="#facc15" rx="1" />
            <circle cx="15" cy="12.5" r="1.5" fill="#f8fafc" />
            {/* 4 Rubber Tires */}
            <rect x="10" y="14" width="2" height="3" fill="#0f172a" rx="0.5" />
            <rect x="18" y="14" width="2" height="3" fill="#0f172a" rx="0.5" />
            <rect x="10" y="18" width="2" height="3" fill="#0f172a" rx="0.5" />
            <rect x="18" y="18" width="2" height="3" fill="#0f172a" rx="0.5" />
            {/* Drifting Tire Smoke & Sparks */}
            <circle cx="9" cy="22" r="1.5" fill="#94a3b8" opacity="0.8" />
            <circle cx="21" cy="22" r="1.5" fill="#fde047" opacity="0.9" />
          </>
        );

      case "diamond-run":
      case "diamondRun":
        return (
          <>
            <rect x="4" y="4" width="22" height="22" fill="#0d1b1e" stroke="#c8a46a" strokeWidth="1.5" />
            <polygon points="15,6 23,15 15,24 7,15" fill="#4de8e8" stroke="#ffffff" strokeWidth="1" />
            <polygon points="15,9 20,15 15,21 10,15" fill="#e0f2fe" />
            <circle cx="9" cy="8" r="1" fill="#ffd84d" />
            <circle cx="21" cy="22" r="1.5" fill="#a879ff" />
          </>
        );

      case "hotlap":
        return (
          <>
            {/* Speed trails & asphalt road markings */}
            <rect x="14" y="2" width="2" height="4" fill="rgba(255,255,255,0.3)" />
            <rect x="14" y="9" width="2" height="4" fill="rgba(255,255,255,0.3)" />
            <rect x="14" y="24" width="2" height="5" fill="rgba(255,255,255,0.3)" />
            {/* Kerb borders */}
            <rect x="1" y="2" width="3" height="5" fill="#ff3d5a" />
            <rect x="1" y="7" width="3" height="5" fill="#ffffff" />
            <rect x="1" y="12" width="3" height="5" fill="#ff3d5a" />
            <rect x="1" y="17" width="3" height="5" fill="#ffffff" />
            <rect x="1" y="22" width="3" height="5" fill="#ff3d5a" />
            <rect x="26" y="4" width="3" height="5" fill="#ffffff" />
            <rect x="26" y="9" width="3" height="5" fill="#ff3d5a" />
            <rect x="26" y="14" width="3" height="5" fill="#ffffff" />
            <rect x="26" y="19" width="3" height="5" fill="#ff3d5a" />
            <rect x="26" y="24" width="3" height="5" fill="#ffffff" />

            {/* Formula Car Shadow */}
            <ellipse cx="15" cy="16" rx="9" ry="11" fill="rgba(0,0,0,0.5)" />

            {/* 4 Tires */}
            <rect x="5" y="8" width="4" height="6" fill="#1b2028" />
            <rect x="6" y="9" width="2" height="4" fill="#384152" />
            <rect x="21" y="8" width="4" height="6" fill="#1b2028" />
            <rect x="22" y="9" width="2" height="4" fill="#384152" />
            <rect x="5" y="19" width="5" height="7" fill="#1b2028" />
            <rect x="6" y="20" width="3" height="5" fill="#384152" />
            <rect x="20" y="19" width="5" height="7" fill="#1b2028" />
            <rect x="21" y="20" width="3" height="5" fill="#384152" />

            {/* Carbon Wishbones */}
            <line x1="13" y1="11" x2="8" y2="11" stroke="#2a303c" strokeWidth="1.2" />
            <line x1="17" y1="11" x2="22" y2="11" stroke="#2a303c" strokeWidth="1.2" />
            <line x1="13" y1="22" x2="8" y2="22" stroke="#2a303c" strokeWidth="1.2" />
            <line x1="17" y1="22" x2="22" y2="22" stroke="#2a303c" strokeWidth="1.2" />

            {/* Rear Wing Assembly */}
            <rect x="8" y="26" width="14" height="2.5" fill="#d4380d" />
            <rect x="7" y="25" width="2" height="4" fill="#1f242e" />
            <rect x="21" y="25" width="2" height="4" fill="#1f242e" />
            <rect x="14" y="26.5" width="2" height="1.5" fill="#ff3838" />

            {/* Sidepods & Monocoque */}
            <rect x="10" y="15" width="10" height="9" rx="2" fill="#ff7a45" />
            <rect x="11" y="16" width="2" height="6" fill="#ffa940" />
            <rect x="17" y="16" width="2" height="6" fill="#ffa940" />
            <rect x="10" y="16" width="1.5" height="2" fill="#fffb8f" />
            <rect x="18.5" y="16" width="1.5" height="2" fill="#fffb8f" />

            {/* Cockpit & Helmet */}
            <rect x="13" y="13" width="4" height="5" rx="1" fill="#18202c" />
            <circle cx="15" cy="15" r="1.5" fill="#ffd666" />
            <rect x="14" y="14" width="2" height="1" fill="#0c1018" />

            {/* Tapered Nosecone */}
            <polygon points="15,4 12,14 18,14" fill="#ff7a45" />
            <polygon points="15,5 14,13 16,13" fill="#ffa940" />
            <rect x="14" y="8" width="2" height="2" fill="#fffb8f" />

            {/* Front Wing */}
            <polygon points="8,5 15,3 22,5 21,7 15,5 9,7" fill="#d4380d" />
            <rect x="7" y="4" width="2" height="3" fill="#fffb8f" />
            <rect x="21" y="4" width="2" height="3" fill="#fffb8f" />
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
