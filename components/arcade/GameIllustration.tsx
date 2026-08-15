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
            <rect x="4" y="4" width="22" height="3" fill="#a879ff" />
            <rect x="4" y="23" width="22" height="3" fill="#a879ff" />
            <polygon points="15,8 10,16 20,16" fill="#ffd84d" />
            <polygon points="15,22 10,14 20,14" fill="#ff5c8a" opacity="0.5" />
          </>
        );
      case "ball-drop":
      case "ballDrop":
        return (
          <>
            <line x1="4" y1="10" x2="20" y2="14" stroke="#4de8e8" strokeWidth="2" />
            <line x1="26" y1="18" x2="10" y2="22" stroke="#4de8e8" strokeWidth="2" />
            <circle cx="12" cy="7" r="3" fill="#ffd84d" />
            <circle cx="18" cy="17" r="3" fill="#ff5c8a" />
          </>
        );
      case "rope-swing":
      case "ropeSwing":
        return (
          <>
            <rect x="13" y="3" width="4" height="4" fill="#ffd84d" />
            <line x1="15" y1="5" x2="23" y2="18" stroke="#ff9f43" strokeWidth="1.5" />
            <circle cx="23" cy="18" r="4" fill="#63e66d" />
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
            <path d="M 8,6 L 8,16 A 7,7 0 0,0 22,16 L 22,6" fill="none" stroke="#ff5c8a" strokeWidth="4" />
            <rect x="6" y="4" width="4" height="5" fill="#4da3ff" />
            <rect x="20" y="4" width="4" height="5" fill="#4da3ff" />
            <circle cx="15" cy="23" r="3" fill="#ffd84d" />
          </>
        );
      case "newtons-box":
      case "newtonsBox":
        return (
          <>
            <rect x="4" y="4" width="22" height="22" fill="none" stroke="#ffd84d" strokeWidth="2" />
            <circle cx="10" cy="10" r="3" fill="#ff5c8a" />
            <circle cx="19" cy="18" r="4" fill="#4de8e8" />
          </>
        );
      case "ricochet":
        return (
          <>
            <polyline points="4,24 12,6 20,24 26,10" fill="none" stroke="#ff9f43" strokeWidth="2" />
            <circle cx="12" cy="6" r="2.5" fill="#4de8e8" />
            <circle cx="20" cy="24" r="2.5" fill="#ffd84d" />
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
            <circle cx="15" cy="15" r="6" fill="#ff5c8a" />
            <line x1="15" y1="15" x2="25" y2="9" stroke="#ffd84d" strokeWidth="2" />
            <circle cx="8" cy="8" r="2" fill="#4de8e8" />
            <circle cx="22" cy="22" r="2" fill="#4de8e8" />
          </>
        );
      case "bullet-garden":
      case "bulletGarden":
        return (
          <>
            <circle cx="15" cy="15" r="4" fill="#a879ff" />
            <circle cx="15" cy="6" r="2" fill="#ff5c8a" />
            <circle cx="24" cy="15" r="2" fill="#ff5c8a" />
            <circle cx="15" cy="24" r="2" fill="#ff5c8a" />
            <circle cx="6" cy="15" r="2" fill="#ff5c8a" />
            <circle cx="21" cy="9" r="1.5" fill="#ffd84d" />
            <circle cx="9" cy="21" r="1.5" fill="#ffd84d" />
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
            <circle cx="15" cy="15" r="8" fill="#ff5c8a" />
            <circle cx="15" cy="15" r="4" fill="#ffd84d" />
            <rect x="13" y="2" width="4" height="4" fill="#4de8e8" />
            <rect x="13" y="24" width="4" height="4" fill="#4de8e8" />
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
            <rect x="7" y="7" width="4" height="4" fill="#ff5c8a" rx="1" />
            <rect x="19" y="7" width="4" height="4" fill="#ff5c8a" rx="1" />
            <rect x="13" y="14" width="4" height="4" fill="#ffd84d" rx="1" />
            <rect x="7" y="21" width="4" height="4" fill="#ff5c8a" rx="1" />
            <rect x="19" y="21" width="4" height="4" fill="#ff5c8a" rx="1" />
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
            <line x1="4" y1="4" x2="12" y2="18" stroke="#ff5c8a" strokeWidth="1.5" />
            <line x1="26" y1="4" x2="18" y2="18" stroke="#ff5c8a" strokeWidth="1.5" />
            <circle cx="12" cy="18" r="3" fill="#ffd84d" />
            <circle cx="18" cy="18" r="3" fill="#ffd84d" />
            <rect x="4" y="24" width="22" height="3" fill="#15803d" />
          </>
        );

      // === TIER 5: PLATFORMERS & MOVEMENT ===
      case "pixel-jumper":
      case "pixelJumper":
        return (
          <>
            <rect x="4" y="22" width="22" height="3" fill="#15803d" />
            <rect x="12" y="8" width="6" height="8" fill="#63e66d" />
            <rect x="14" y="4" width="2" height="4" fill="#ffd84d" />
          </>
        );
      case "wall-runner":
      case "wallRunner":
        return (
          <>
            <rect x="3" y="4" width="4" height="22" fill="#475569" />
            <rect x="23" y="4" width="4" height="22" fill="#475569" />
            <rect x="8" y="12" width="6" height="6" fill="#ff5c8a" />
            <polyline points="8,15 15,10 22,14" fill="none" stroke="#ffd84d" strokeWidth="1.5" strokeDasharray="2,2" />
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
            <path d="M 4,4 Q 15,10 26,4 L 26,26 Q 15,20 4,26 Z" fill="#1e293b" />
            <circle cx="15" cy="15" r="3" fill="#4de8e8" />
          </>
        );
      case "ladder-climb":
      case "ladderClimb":
        return (
          <>
            <line x1="11" y1="4" x2="11" y2="26" stroke="#ffd84d" strokeWidth="2" />
            <line x1="19" y1="4" x2="19" y2="26" stroke="#ffd84d" strokeWidth="2" />
            <line x1="11" y1="8" x2="19" y2="8" stroke="#ffd84d" strokeWidth="2" />
            <line x1="11" y1="14" x2="19" y2="14" stroke="#ffd84d" strokeWidth="2" />
            <line x1="11" y1="20" x2="19" y2="20" stroke="#ffd84d" strokeWidth="2" />
            <rect x="13" y="11" width="4" height="6" fill="#ff5c8a" />
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
            <rect x="8" y="8" width="8" height="12" fill="#a879ff" />
            <rect x="14" y="10" width="8" height="12" fill="rgba(168, 121, 255, 0.4)" />
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
            <rect x="4" y="5" width="22" height="20" fill="#1e3a8a" rx="2" />
            <circle cx="9" cy="10" r="2.5" fill="#ffd84d" />
            <circle cx="15" cy="10" r="2.5" fill="#ff5c8a" />
            <circle cx="21" cy="10" r="2.5" fill="#ffd84d" />
            <circle cx="9" cy="16" r="2.5" fill="#ff5c8a" />
            <circle cx="15" cy="16" r="2.5" fill="#ffd84d" />
            <circle cx="21" cy="16" r="2.5" fill="#ff5c8a" />
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
            <rect x="8" y="8" width="4" height="4" fill="#63e66d" />
            <rect x="14" y="8" width="4" height="4" fill="#63e66d" />
            <rect x="8" y="14" width="4" height="4" fill="#63e66d" />
            <rect x="20" y="14" width="4" height="4" fill="#4de8e8" />
            <rect x="14" y="20" width="4" height="4" fill="#ffd84d" />
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
            <line x1="4" y1="10" x2="10" y2="10" stroke="#4de8e8" strokeWidth="2" />
            <line x1="4" y1="20" x2="10" y2="20" stroke="#4de8e8" strokeWidth="2" />
            <path d="M 10,7 L 16,7 A 8,8 0 0,1 16,23 L 10,23 Z" fill="#ffd84d" />
            <line x1="22" y1="15" x2="27" y2="15" stroke="#ff5c8a" strokeWidth="2" />
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
            <rect x="4" y="6" width="22" height="18" fill="#14532d" rx="2" />
            <circle cx="11" cy="15" r="3" fill="#ffffff" />
            <circle cx="19" cy="15" r="3" fill="#0f172a" />
            <circle cx="19" cy="15" r="1" fill="#ffffff" />
          </>
        );
      case "infinite-forest":
      case "infiniteForest":
        return (
          <>
            <path d="M 4,22 Q 12,14 20,18 T 26,16 L 26,26 L 4,26 Z" fill="#166534" />
            <polygon points="9,10 12,16 6,16" fill="#22c55e" />
            <polygon points="18,8 22,16 14,16" fill="#22c55e" />
          </>
        );
      case "time-loop":
      case "timeLoop":
        return (
          <>
            <circle cx="15" cy="15" r="10" fill="none" stroke="#a879ff" strokeWidth="2" />
            <line x1="15" y1="15" x2="15" y2="8" stroke="#ffd84d" strokeWidth="2" />
            <line x1="15" y1="15" x2="20" y2="15" stroke="#ffd84d" strokeWidth="2" />
            <circle cx="15" cy="15" r="2" fill="#ff5c8a" />
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
            <polygon points="8,10 12,18 4,18" fill="#22c55e" />
            <polygon points="20,6 25,18 15,18" fill="#ff5c8a" />
            <polygon points="20,10 23,17 17,17" fill="#ffd84d" />
          </>
        );
      case "liquid-cells":
      case "liquidCells":
        return (
          <>
            <rect x="4" y="18" width="22" height="8" fill="#1e3a8a" />
            <rect x="8" y="12" width="14" height="6" fill="#3b82f6" />
            <rect x="12" y="6" width="6" height="6" fill="#60a5fa" />
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
            <line x1="8" y1="4" x2="3" y2="26" stroke="#4de8e8" strokeWidth="1.5" />
            <line x1="15" y1="4" x2="15" y2="26" stroke="#4de8e8" strokeWidth="1" strokeDasharray="2,2" />
            <line x1="22" y1="4" x2="27" y2="26" stroke="#4de8e8" strokeWidth="1.5" />
            <rect x="13" y="14" width="4" height="6" fill="#ffd84d" rx="1" />
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
