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
    const maxR = this.grid.length;
    const maxC = this.grid[0].length;
    const originX = Math.floor((renderer.getWidth() - maxC * tileSize) / 2);
    const originY = Math.floor((renderer.getHeight() - 60 - maxR * tileSize) / 2);
    const grid = this.grid;

    // Draw Board Tiles
    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        const tile = grid[r]?.[c] || " ";
        const px = originX + c * tileSize;
        const py = originY + r * tileSize;

        if (tile === Tile.WALL) {
          // 3D Stone Wall Block with brick lines
          pr.drawPixelBlock(px, py, tileSize, "#1e293b", "#334155", "#0f172a");
          // Inner brick seam lines
          pr.drawLine(px, py + tileSize / 2, px + tileSize, py + tileSize / 2, "#0f172a", 1);
          pr.drawLine(px + tileSize / 2, py, px + tileSize / 2, py + tileSize / 2, "#0f172a", 1);
        } else if (tile !== " ") {
          // Warehouse Floor Tile
          pr.drawRect(px, py, tileSize, tileSize, (r + c) % 2 === 0 ? "#0c1527" : "#09101e", true);
          pr.drawRect(px, py, tileSize, tileSize, "rgba(255,255,255,0.03)", false);
        }

        // Goal Target (Glowing Star / Ring)
        if (tile === Tile.GOAL || tile === Tile.PLAYER_ON_GOAL || tile === Tile.BOX_ON_GOAL) {
          const isSatisfied = tile === Tile.BOX_ON_GOAL;
          const goalCol = isSatisfied ? "#63e66d" : "#ffd84d";
          pr.drawCircle(px + tileSize / 2, py + tileSize / 2, 10, goalCol, false);
          pr.drawCircle(px + tileSize / 2, py + tileSize / 2, 4, goalCol, true);
        }

        // Box / Crate (Wood texture with corner iron rivets)
        if (tile === Tile.BOX || tile === Tile.BOX_ON_GOAL) {
          const isDone = tile === Tile.BOX_ON_GOAL;
          const boxBase = isDone ? "#22c55e" : "#d97706";
          const boxHigh = isDone ? "#86efac" : "#fbbf24";
          const boxShadow = isDone ? "#15803d" : "#92400e";

          pr.drawPixelBlock(px + 4, py + 4, tileSize - 8, boxBase, boxHigh, boxShadow);
          // Crate cross brace (X)
          pr.drawLine(px + 8, py + 8, px + tileSize - 8, py + tileSize - 8, boxShadow, 2);
          pr.drawLine(px + tileSize - 8, py + 8, px + 8, py + tileSize - 8, boxShadow, 2);
          // Center rivet
          pr.drawCircle(px + tileSize / 2, py + tileSize / 2, 3, boxHigh, true);
        }

        // Player (Warehouse Keeper Sprite)
        if (tile === Tile.PLAYER || tile === Tile.PLAYER_ON_GOAL) {
          const cx = px + tileSize / 2;
          const cy = py + tileSize / 2;
          // Body (Blue overalls)
          pr.drawRect(cx - 10, cy - 4, 20, 16, "#3b82f6", true);
          // Belt & Buckle
          pr.drawRect(cx - 10, cy + 2, 20, 3, "#1e293b", true);
          pr.drawRect(cx - 3, cy + 1, 6, 5, "#ffd84d", true);
          // Head (Skin tone)
          pr.drawCircle(cx, cy - 10, 8, "#fed7aa", true);
          // Red Worker Cap
          pr.drawRect(cx - 10, cy - 18, 20, 6, "#ef4444", true);
          pr.drawRect(cx - 13, cy - 13, 8, 3, "#b91c1c", true); // Cap visor
          // Eyes
          pr.drawCircle(cx - 3, cy - 10, 1.5, "#0f172a", true);
          pr.drawCircle(cx + 3, cy - 10, 1.5, "#0f172a", true);
        }
      }
    }

    // HUD Bar
    const h = renderer.getHeight();
    const w = renderer.getWidth();
    pr.drawRect(0, h - 56, w, 56, "#080e1c", true);
    pr.drawLine(0, h - 56, w, h - 56, "#1e293b", 1);
    pr.drawText(`SOKOBAN | LEVEL ${this.currentLevel + 1}/${levels.length} | MOVES: ${this.moves} | SCORE: ${this.score}`, 20, h - 32, {
      color: "#ffd84d",
      size: 13,
      font: "monospace",
    });
    pr.drawText("[ARROWS] Move  [Z / SHIFT] Undo Move  [R] Restart Puzzle", 20, h - 14, {
      color: "#94a3b8",
      size: 10,
      font: "monospace",
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
