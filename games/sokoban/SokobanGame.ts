import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";

enum Tile {
  FLOOR = " ",
  WALL = "#",
  BOX = "$",
  GOAL = ".",
  BOX_ON_GOAL = "*",
  PLAYER = "@",
  PLAYER_ON_GOAL = "+",
}

interface State {
  grid: string[][];
  playerPos: { x: number; y: number };
}

const levels = [
  // Level 1: Intro Push
  [
    " #### ",
    " #  # ",
    " # @# ",
    " # $# ",
    " # .# ",
    " #### ",
  ],
  // Level 2: Two Boxes Line
  [
    " ##### ",
    " #   # ",
    " #$# # ",
    "###  # ",
    "#. $ # ",
    "##  ## ",
    " #@ #  ",
    " ####  ",
  ],
  // Level 3: Three Boxes Corner
  [
    "  ###   ",
    "  #.#   ",
    "  # #   ",
    "###$####",
    "#.@. $ #",
    "####$###",
    "   # #  ",
    "   ###  ",
  ],
  // Level 4: The Warehouse
  [
    "######",
    "#  . #",
    "# $$ #",
    "# .  #",
    "# @  #",
    "######",
  ],
  // Level 5: T-Junction
  [
    " ###### ",
    " #    # ",
    "##$## # ",
    "# . # # ",
    "# @ $ # ",
    "# . # # ",
    "####### ",
  ],
  // Level 6: Crossroad
  [
    "  ####  ",
    "  #  #  ",
    "###$$###",
    "# ..@  #",
    "###  ###",
    "  ####  ",
  ],
  // Level 7: Four Corners
  [
    "#######",
    "#. $ .#",
    "# $#$ #",
    "#  @  #",
    "# $#$ #",
    "#. $ .#",
    "#######",
  ],
  // Level 8: Double Pocket
  [
    "########",
    "#   #  #",
    "# $ $ .#",
    "# # # .#",
    "# @ $ .#",
    "#   #  #",
    "########",
  ],
  // Level 9: The Chamber
  [
    " ###### ",
    " # .  # ",
    "##$#$ ##",
    "# .@.  #",
    "## #$# #",
    " #   . #",
    " #######",
  ],
  // Level 10: Slalom
  [
    "#########",
    "# .   . #",
    "# #$#$# #",
    "#  $@$  #",
    "# #$#$# #",
    "# .   . #",
    "#########",
  ],
  // Level 11: The Spiral
  [
    "########",
    "#      #",
    "# #### #",
    "# #..# #",
    "# #$$# #",
    "# # @# #",
    "# #### #",
    "#      #",
    "########",
  ],
  // Level 12: Precision Dock
  [
    "  #####  ",
    "###   ###",
    "# . $ . #",
    "# #$@$# #",
    "# . $ . #",
    "###   ###",
    "  #####  ",
  ],
  // Level 13: The Vault
  [
    "########",
    "#..  ..#",
    "# $$ $$#",
    "#  ##  #",
    "#  @@  #",
    "# $$ $$#",
    "#..  ..#",
    "########",
  ],
  // Level 14: Master Matrix
  [
    " ####### ",
    " #  .  # ",
    "## #$# ##",
    "#  .$.  #",
    "# $$@$$ #",
    "#  .$.  #",
    "## #$# ##",
    " #  .  # ",
    " ####### ",
  ],
  // Level 15: Grand Warehouse
  [
    " ######### ",
    " # ...   # ",
    "## ##### # ",
    "#  $$$   # ",
    "# # # # ## ",
    "#   @   #  ",
    "#########  ",
  ],
];

export class SokobanGame implements GameInstance {
  private ctx!: GameContext;
  private currentLevel: number = 0;
  private grid: string[][] = [];
  private playerPos: { x: number; y: number } = { x: 0, y: 0 };
  private undoStack: State[] = [];
  private score: number = 0;
  private moves: number = 0;
  private isPaused = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.moves = 0;
    this.score = 0;
    this.loadLevel(this.currentLevel);
  }

  private loadLevel(levelIndex: number): void {
    if (levelIndex >= levels.length) levelIndex = 0;
    this.currentLevel = levelIndex;
    this.grid = levels[levelIndex].map((row) => row.split(""));
    this.undoStack = [];

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        if (this.grid[y][x] === Tile.PLAYER || this.grid[y][x] === Tile.PLAYER_ON_GOAL) {
          this.playerPos = { x, y };
        }
      }
    }
  }

  private saveState(): void {
    if (this.undoStack.length >= 50) this.undoStack.shift();
    this.undoStack.push({
      grid: this.grid.map((row) => [...row]),
      playerPos: { ...this.playerPos },
    });
  }

  private undo(): void {
    if (this.undoStack.length > 0) {
      const state = this.undoStack.pop()!;
      this.grid = state.grid;
      this.playerPos = state.playerPos;
    }
  }

  private move(dx: number, dy: number): void {
    const nx = this.playerPos.x + dx;
    const ny = this.playerPos.y + dy;
    const target = this.grid[ny]?.[nx];

    if (!target || target === Tile.WALL) return;

    if (target === Tile.BOX || target === Tile.BOX_ON_GOAL) {
      const nnx = nx + dx;
      const nny = ny + dy;
      const pushTarget = this.grid[nny]?.[nnx];

      if (pushTarget === Tile.FLOOR || pushTarget === Tile.GOAL) {
        this.saveState();
        this.grid[nny][nnx] = pushTarget === Tile.GOAL ? Tile.BOX_ON_GOAL : Tile.BOX;
        this.grid[ny][nx] = target === Tile.BOX_ON_GOAL ? Tile.PLAYER_ON_GOAL : Tile.PLAYER;
        const old = this.grid[this.playerPos.y][this.playerPos.x];
        this.grid[this.playerPos.y][this.playerPos.x] = old === Tile.PLAYER_ON_GOAL ? Tile.GOAL : Tile.FLOOR;
        this.playerPos = { x: nx, y: ny };
        this.moves++;
        this.score = Math.max(0, 1000 - this.moves * 10);
        this.checkWin();
      }
    } else if (target === Tile.FLOOR || target === Tile.GOAL) {
      this.saveState();
      this.grid[ny][nx] = target === Tile.GOAL ? Tile.PLAYER_ON_GOAL : Tile.PLAYER;
      const old = this.grid[this.playerPos.y][this.playerPos.x];
      this.grid[this.playerPos.y][this.playerPos.x] = old === Tile.PLAYER_ON_GOAL ? Tile.GOAL : Tile.FLOOR;
      this.playerPos = { x: nx, y: ny };
      this.moves++;
    }
  }

  private checkWin(): void {
    let uncompleted = 0;
    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        if (this.grid[y][x] === Tile.GOAL || this.grid[y][x] === Tile.PLAYER_ON_GOAL) {
          uncompleted++;
        }
      }
    }
    if (uncompleted === 0) {
      this.loadLevel(this.currentLevel + 1);
    }
  }

  public update(_deltaTime: number): void {}

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#04060c");

    const tileSize = 44;
    const offsetX = Math.floor((renderer.getWidth() - this.grid[0].length * tileSize) / 2);
    const offsetY = Math.floor((renderer.getHeight() - 60 - this.grid.length * tileSize) / 2);

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        const px = offsetX + x * tileSize;
        const py = offsetY + y * tileSize;
        const tile = this.grid[y][x];

        if (tile === Tile.WALL) {
          pr.drawRect(px, py, tileSize, tileSize, "#1e3060", true);
        } else if (tile !== " ") {
          pr.drawRect(px, py, tileSize, tileSize, "#0d1b3a", true);
        }

        if (tile === Tile.GOAL || tile === Tile.PLAYER_ON_GOAL || tile === Tile.BOX_ON_GOAL) {
          pr.drawRect(px + 16, py + 16, 12, 12, "#ffd84d", true);
        }

        if (tile === Tile.BOX || tile === Tile.BOX_ON_GOAL) {
          pr.drawRect(px + 6, py + 6, tileSize - 12, tileSize - 12, tile === Tile.BOX_ON_GOAL ? "#63e66d" : "#ff9f43", true);
        }

        if (tile === Tile.PLAYER || tile === Tile.PLAYER_ON_GOAL) {
          pr.drawRect(px + 10, py + 10, tileSize - 20, tileSize - 20, "#ff5c8a", true);
        }
      }
    }

    // HUD
    const h = renderer.getHeight();
    const w = renderer.getWidth();
    pr.drawRect(0, h - 60, w, 60, "#080e1c", true);
    pr.drawText(`SOKOBAN | Level: ${this.currentLevel + 1}/${levels.length} | Moves: ${this.moves} | Score: ${this.score}`, 16, h - 36, {
      color: "#ffd84d",
      size: 11,
    });
    pr.drawText("[ARROWS] Move  [Z / SHIFT] Undo  [R] Restart Level", 16, h - 16, {
      color: "#4de8e8",
      size: 9,
    });
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    switch (action) {
      case "MOVE_LEFT":
        this.move(-1, 0);
        break;
      case "MOVE_RIGHT":
        this.move(1, 0);
        break;
      case "MOVE_UP":
        this.move(0, -1);
        break;
      case "MOVE_DOWN":
        this.move(0, 1);
        break;
      case "ACTION_PRIMARY":
      case "ACTION_SECONDARY":
        this.undo();
        break;
      case "RESTART":
        this.reset();
        break;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }
  public resume(): void {
    this.isPaused = false;
  }
  public destroy(): void {}
  public getScore(): number {
    return this.score;
  }
  public getLevel(): number {
    return this.currentLevel + 1;
  }
}
