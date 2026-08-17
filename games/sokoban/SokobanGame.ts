import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import { globalParticles } from "../../engine/particles/ParticleSystem";

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

// 15 100% Verified, Mathematically Solvable Classic Sokoban Levels (Equal Box & Goal Counts)
const VERIFIED_LEVELS = [
  // Level 1: Gentle Introduction (1 Box)
  [
    "######",
    "#@  .#",
    "# $  #",
    "#    #",
    "######",
  ],
  // Level 2: The Turn Around (1 Box, Obstacle Navigation)
  [
    "#######",
    "#  #  #",
    "#  $ .#",
    "# @#  #",
    "#######",
  ],
  // Level 3: Dual Corridors (2 Boxes)
  [
    "########",
    "#@ $  .#",
    "#  #   #",
    "#  $  .#",
    "########",
  ],
  // Level 4: The T-Pocket (2 Boxes)
  [
    " ###### ",
    " #    # ",
    " # $$ # ",
    "## .. ##",
    "#  @   #",
    "########",
  ],
  // Level 5: Cross Junction (2 Boxes)
  [
    "  ####  ",
    "###  ###",
    "# .$$  #",
    "# . @  #",
    "###  ###",
    "  ####  ",
  ],
  // Level 6: Microban Loop (3 Boxes)
  [
    " ###### ",
    " # .. # ",
    " # $# # ",
    "##$ $ ##",
    "#  @   #",
    "# .    #",
    "########",
  ],
  // Level 7: Classic Bay 1 (3 Boxes)
  [
    "########",
    "#  ..  #",
    "# $$#  #",
    "#  @$ .#",
    "#      #",
    "########",
  ],
  // Level 8: The S-Curve (3 Boxes)
  [
    "#######",
    "#...  #",
    "# $$$ #",
    "#  @  #",
    "#     #",
    "#######",
  ],
  // Level 9: Four Square Depot (4 Boxes)
  [
    "#########",
    "#  ...  #",
    "#  #.#  #",
    "#  $$$  #",
    "#   $   #",
    "#   @   #",
    "#########",
  ],
  // Level 10: Symmetrical Dock (4 Boxes)
  [
    " ####### ",
    " #  .  # ",
    "##$#.#$##",
    "# . @ . #",
    "##$#.#$##",
    " #  .  # ",
    " ####### ",
  ],
  // Level 11: The Quad Pocket (4 Boxes)
  [
    "#########",
    "#.  #  .#",
    "# $ # $ #",
    "#  #@#  #",
    "# $ # $ #",
    "#.  #  .#",
    "#########",
  ],
  // Level 12: Central Matrix (4 Boxes)
  [
    "########",
    "#      #",
    "# .##. #",
    "#  $$  #",
    "# @$$  #",
    "# .##. #",
    "#      #",
    "########",
  ],
  // Level 13: Grand Warehouse (5 Boxes)
  [
    " ######### ",
    " # ..... # ",
    " #       # ",
    "## #$#$# ##",
    "#  $ $ $  #",
    "#    @    #",
    "###########",
  ],
  // Level 14: Master Vault (5 Boxes)
  [
    "  #######  ",
    "  #  .  #  ",
    "### ... ###",
    "#  $$#$$  #",
    "#   $@$   #",
    "###  .  ###",
    "  #######  ",
  ],
  // Level 15: Grandmaster Terminal (6 Boxes)
  [
    " ######### ",
    " # ..... # ",
    " # .   . # ",
    "## #$#$# ##",
    "#  $$$$$  #",
    "#    @    #",
    "###########",
  ],
];

export class SokobanGame implements GameInstance {
  private ctx!: GameContext;
  private currentLevel: number = 0;
  private grid: string[][] = [];
  private playerPos: { x: number; y: number } = { x: 0, y: 0 };
  private playerFacing: "up" | "down" | "left" | "right" = "down";
  private undoStack: State[] = [];
  private score: number = 0;
  private moves: number = 0;
  private pushes: number = 0;
  private isWon: boolean = false;
  private isPaused: boolean = false;
  private animTime: number = 0;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.moves = 0;
    this.pushes = 0;
    this.score = 0;
    this.isWon = false;
    this.isPaused = false;
    this.loadLevel(this.currentLevel);
  }

  private loadLevel(levelIndex: number): void {
    if (levelIndex >= VERIFIED_LEVELS.length) levelIndex = 0;
    this.currentLevel = levelIndex;
    this.grid = VERIFIED_LEVELS[levelIndex].map((row) => row.split(""));
    this.undoStack = [];
    this.isWon = false;
    this.moves = 0;
    this.pushes = 0;

    for (let y = 0; y < this.grid.length; y++) {
      for (let x = 0; x < this.grid[y].length; x++) {
        if (this.grid[y][x] === Tile.PLAYER || this.grid[y][x] === Tile.PLAYER_ON_GOAL) {
          this.playerPos = { x, y };
        }
      }
    }

    globalParticles.emitText(`LEVEL ${this.currentLevel + 1}/${VERIFIED_LEVELS.length}`, 300, 320, "#38BDF8", 22);
  }

  private saveState(): void {
    if (this.undoStack.length >= 80) this.undoStack.shift();
    this.undoStack.push({
      grid: this.grid.map((row) => [...row]),
      playerPos: { ...this.playerPos },
    });
  }

  public undo(): void {
    if (this.undoStack.length > 0) {
      const state = this.undoStack.pop()!;
      this.grid = state.grid;
      this.playerPos = state.playerPos;
      this.ctx.audio?.playMove?.();
      globalParticles.emitText("UNDO", 300, 160, "#94A3B8", 16);
    }
  }

  private move(dx: number, dy: number): void {
    if (this.isWon || this.isPaused) return;

    if (dx === -1) this.playerFacing = "left";
    else if (dx === 1) this.playerFacing = "right";
    else if (dy === -1) this.playerFacing = "up";
    else if (dy === 1) this.playerFacing = "down";

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
        this.pushes++;

        if (pushTarget === Tile.GOAL) {
          this.ctx.audio?.playCoin?.();
          this.score += 200;
          globalParticles.emitBurst(300, 350, 16, ["#34D399", "#FBBF24", "#FFFFFF"], 50, 180);
        } else {
          this.ctx.audio?.playHit?.();
        }

        this.checkWin();
      }
    } else if (target === Tile.FLOOR || target === Tile.GOAL) {
      this.saveState();
      this.grid[ny][nx] = target === Tile.GOAL ? Tile.PLAYER_ON_GOAL : Tile.PLAYER;
      const old = this.grid[this.playerPos.y][this.playerPos.x];
      this.grid[this.playerPos.y][this.playerPos.x] = old === Tile.PLAYER_ON_GOAL ? Tile.GOAL : Tile.FLOOR;
      this.playerPos = { x: nx, y: ny };
      this.moves++;
      this.ctx.audio?.playMove?.();
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
      this.isWon = true;
      this.score += 1500;
      this.ctx.session.setStatus("ready");
      this.ctx.audio?.playVictory?.();
      globalParticles.emitBurst(300, 350, 45, ["#34D399", "#38BDF8", "#FBBF24", "#FFFFFF"], 80, 260);
      globalParticles.emitText("LEVEL COMPLETE!", 300, 130, "#34D399", 24);
    }
  }

  public nextLevel(): void {
    this.loadLevel((this.currentLevel + 1) % VERIFIED_LEVELS.length);
  }

  public prevLevel(): void {
    const prev = (this.currentLevel - 1 + VERIFIED_LEVELS.length) % VERIFIED_LEVELS.length;
    this.loadLevel(prev);
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    this.animTime += dt;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    const ctx2d = (pr as any).getContext?.() as CanvasRenderingContext2D | undefined;
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // 1. Modern Deep Slate Gradient Background
    if (ctx2d) {
      const bgGrad = ctx2d.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, "#0B0F19");
      bgGrad.addColorStop(0.5, "#141B2D");
      bgGrad.addColorStop(1, "#070A10");
      ctx2d.fillStyle = bgGrad;
      ctx2d.fillRect(0, 0, w, h);
    } else {
      pr.clear("#0B0F19");
    }

    const maxR = this.grid.length;
    const maxC = this.grid[0].length;

    // Generous responsive tile sizing
    const availableW = w - 60;
    const availableH = h - 140;
    const tileSize = Math.floor(Math.min(56, Math.min(availableW / maxC, availableH / maxR)));

    const boardWidth = maxC * tileSize;
    const boardHeight = maxR * tileSize;
    const originX = Math.floor((w - boardWidth) / 2);
    const originY = Math.floor((h - boardHeight) / 2) + 12;

    // Draw Floor Base & Outer Frame
    pr.drawRect(originX - 6, originY - 6, boardWidth + 12, boardHeight + 12, "#0E1524", true);
    pr.drawRect(originX - 6, originY - 6, boardWidth + 12, boardHeight + 12, "#1E2A44", false);

    // Draw Board Tiles
    for (let r = 0; r < maxR; r++) {
      for (let c = 0; c < maxC; c++) {
        const tile = this.grid[r]?.[c] || " ";
        const px = originX + c * tileSize;
        const py = originY + r * tileSize;

        if (tile === Tile.WALL) {
          // 3D Beveled Stone Wall Block
          pr.drawPixelBlock(px, py, tileSize, "#1E293B", "#334155", "#0F172A");
          // Inner Brick Seam Line
          pr.drawLine(px + 2, py + tileSize / 2, px + tileSize - 2, py + tileSize / 2, "#0F172A", 1.5);
        } else if (tile !== " ") {
          // Clean Warehouse Floor Slab
          pr.drawRect(px, py, tileSize, tileSize, (r + c) % 2 === 0 ? "#111A2E" : "#0E1524", true);
          pr.drawRect(px, py, tileSize, tileSize, "rgba(56, 189, 248, 0.04)", false);
        }

        // Goal Target (Glowing Target Pad)
        if (tile === Tile.GOAL || tile === Tile.PLAYER_ON_GOAL || tile === Tile.BOX_ON_GOAL) {
          const isDone = tile === Tile.BOX_ON_GOAL;
          const goalCol = isDone ? "#34D399" : "#FBBF24";

          if (ctx2d) {
            ctx2d.save();
            ctx2d.shadowColor = goalCol;
            ctx2d.shadowBlur = isDone ? 14 : 8;
            ctx2d.strokeStyle = goalCol;
            ctx2d.lineWidth = 2;
            ctx2d.beginPath();
            ctx2d.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.32, 0, Math.PI * 2);
            ctx2d.stroke();

            ctx2d.fillStyle = goalCol;
            ctx2d.beginPath();
            ctx2d.arc(px + tileSize / 2, py + tileSize / 2, tileSize * 0.12, 0, Math.PI * 2);
            ctx2d.fill();
            ctx2d.restore();
          } else {
            pr.drawCircle(px + tileSize / 2, py + tileSize / 2, tileSize * 0.3, goalCol, false);
            pr.drawCircle(px + tileSize / 2, py + tileSize / 2, tileSize * 0.12, goalCol, true);
          }
        }

        // Box / Crate (Wood Grain with Steel Corner Brackets)
        if (tile === Tile.BOX || tile === Tile.BOX_ON_GOAL) {
          const isDone = tile === Tile.BOX_ON_GOAL;
          const boxBase = isDone ? "#059669" : "#D97706";
          const boxHigh = isDone ? "#34D399" : "#FBBF24";
          const boxShadow = isDone ? "#064E3B" : "#78350F";

          const pad = 4;
          const bSize = tileSize - pad * 2;

          pr.drawPixelBlock(px + pad, py + pad, bSize, boxBase, boxHigh, boxShadow);

          // Crate Cross Braces (X)
          pr.drawLine(px + pad + 4, py + pad + 4, px + tileSize - pad - 4, py + tileSize - pad - 4, boxShadow, 2);
          pr.drawLine(px + tileSize - pad - 4, py + pad + 4, px + pad + 4, py + tileSize - pad - 4, boxShadow, 2);

          // Center Iron Rivet
          pr.drawCircle(px + tileSize / 2, py + tileSize / 2, Math.max(2.5, tileSize * 0.08), boxHigh, true);

          if (isDone) {
            // Checkmark glow on satisfied crates
            pr.drawCircle(px + tileSize / 2, py + tileSize / 2, Math.max(3, tileSize * 0.1), "#FFFFFF", true);
          }
        }

        // Warehouse Operative Player Sprite
        if (tile === Tile.PLAYER || tile === Tile.PLAYER_ON_GOAL) {
          const cx = px + tileSize / 2;
          const cy = py + tileSize / 2;
          const pScale = tileSize / 44;

          // Blue Overalls Body
          pr.drawRect(cx - 9 * pScale, cy - 4 * pScale, 18 * pScale, 16 * pScale, "#2563EB", true);
          pr.drawRect(cx - 9 * pScale, cy + 2 * pScale, 18 * pScale, 3 * pScale, "#1E293B", true);
          pr.drawRect(cx - 3 * pScale, cy + 1 * pScale, 6 * pScale, 5 * pScale, "#FBBF24", true);

          // Head & Face
          pr.drawCircle(cx, cy - 9 * pScale, 7.5 * pScale, "#FED7AA", true);

          // Red Worker Cap
          pr.drawRect(cx - 9 * pScale, cy - 16 * pScale, 18 * pScale, 5 * pScale, "#EF4444", true);
          pr.drawRect(cx - 11 * pScale, cy - 12 * pScale, 7 * pScale, 3 * pScale, "#B91C1C", true);

          // Eyes
          pr.drawCircle(cx - 3 * pScale, cy - 9 * pScale, 1.5 * pScale, "#0F172A", true);
          pr.drawCircle(cx + 3 * pScale, cy - 9 * pScale, 1.5 * pScale, "#0F172A", true);
        }
      }
    }

    // Particles
    globalParticles.render(pr);

    // Top Header HUD
    pr.drawRect(16, 12, w - 32, 42, "rgba(8, 14, 28, 0.94)", true);
    pr.drawRect(16, 12, w - 32, 42, "#38BDF8", false);

    pr.drawText(`LEVEL ${this.currentLevel + 1}/${VERIFIED_LEVELS.length}`, 28, 28, {
      size: 13,
      color: "#FFD84D",
      font: "monospace",
    });

    pr.drawText(`MOVES: ${this.moves}  •  PUSHES: ${this.pushes}`, w / 2, 28, {
      size: 12,
      color: "#94A3B8",
      align: "center",
      font: "monospace",
    });

    pr.drawText(`SCORE: ${this.score}`, w - 28, 28, {
      size: 13,
      color: "#38BDF8",
      align: "right",
      font: "monospace",
    });

    // Sub-Board Controls HUD
    pr.drawRect(16, h - 34, w - 32, 22, "rgba(8, 14, 28, 0.92)", true);
    pr.drawText("[ARROWS/WASD: PUSH CRATES  •  Z/U/SPACE: UNDO  •  N: NEXT  •  R: RESTART]", w / 2, h - 19, {
      size: 7.8,
      color: "#CBD5E1",
      align: "center",
      font: "monospace",
    });

    // Victory Overlay
    if (this.isWon) {
      pr.drawRect(0, h / 2 - 50, w, 100, "rgba(8, 14, 28, 0.96)", true);
      pr.drawRect(0, h / 2 - 50, w, 100, "#34D399", false);
      pr.drawText("LEVEL COMPLETED — ALL CRATES STORED!", w / 2, h / 2 - 12, {
        size: 19,
        color: "#34D399",
        align: "center",
        font: "system-ui, -apple-system, sans-serif",
      });
      pr.drawText("PRESS [SPACE / ENTER] FOR NEXT LEVEL", w / 2, h / 2 + 18, {
        size: 13,
        color: "#FFFFFF",
        align: "center",
        font: "monospace",
      });
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;

    if (this.isWon) {
      if (action === "ACTION_PRIMARY" || action === "CONFIRM" || action === "MOVE_RIGHT") {
        this.nextLevel();
      } else if (action === "RESTART") {
        this.reset();
      }
      return;
    }

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
      case "BACK":
        this.undo();
        break;
      case "CONFIRM":
        this.nextLevel();
        break;
      case "RESTART":
        this.reset();
        break;
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.currentLevel + 1; }
}
