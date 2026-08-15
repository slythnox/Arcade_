import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

// Tile states: 0 = Uncollapsed Superposition, 1 = Water, 2 = Sand/Land, 3 = Forest, 4 = Mountain
const UNCOLLAPSED = 0;
const WATER = 1;
const SAND = 2;
const FOREST = 3;
const MOUNTAIN = 4;

// Adjacency rules: Water can touch Water & Sand. Sand touches Water, Sand, Forest. Forest touches Sand, Forest, Mountain. Mountain touches Forest, Mountain.
const VALID_NEIGHBORS: Record<number, number[]> = {
  [WATER]: [WATER, SAND],
  [SAND]: [WATER, SAND, FOREST],
  [FOREST]: [SAND, FOREST, MOUNTAIN],
  [MOUNTAIN]: [FOREST, MOUNTAIN],
};

export class QuantumTilesGame implements GameInstance {
  private ctx!: GameContext;
  private readonly size = 8; // 8x8 Grid
  private grid: number[][] = [];
  private possibleStates: Set<number>[][] = [];
  private cursorX = 4;
  private cursorY = 4;
  private score = 0;
  private level = 1;
  private isPaused = false;
  private contradiction = false;
  private completed = false;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initSuperposition();
  }

  private initSuperposition(): void {
    this.contradiction = false;
    this.completed = false;
    this.grid = Array.from({ length: this.size }, () => Array(this.size).fill(UNCOLLAPSED));
    this.possibleStates = Array.from({ length: this.size }, () =>
      Array.from({ length: this.size }, () => new Set([WATER, SAND, FOREST, MOUNTAIN]))
    );

    // Collapse a random starting seed tile
    const sx = Math.floor(this.ctx.random.next() * this.size);
    const sy = Math.floor(this.ctx.random.next() * this.size);
    this.collapseTile(sx, sy, SAND);
  }

  private collapseTile(x: number, y: number, state?: number): boolean {
    const candidates = Array.from(this.possibleStates[y][x]);
    if (candidates.length === 0) {
      this.contradiction = true;
      this.ctx.audio?.playExplosion?.();
      return false;
    }

    const chosen = state !== undefined && candidates.includes(state)
      ? state
      : candidates[Math.floor(this.ctx.random.next() * candidates.length)];

    this.grid[y][x] = chosen;
    this.possibleStates[y][x] = new Set([chosen]);
    this.score += 100;
    this.ctx.audio?.playRotate?.();

    // Propagate constraint wave to neighbors
    this.propagateConstraints(x, y);

    // Check if entire grid is fully collapsed
    let uncollapsedCount = 0;
    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        if (this.grid[r][c] === UNCOLLAPSED) uncollapsedCount++;
      }
    }

    if (uncollapsedCount === 0 && !this.contradiction) {
      this.completed = true;
      this.score += 2500 * this.level;
      this.ctx.audio?.playVictory?.();
    }

    return true;
  }

  private propagateConstraints(startX: number, startY: number): void {
    const queue: [number, number][] = [[startX, startY]];

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;
      const currentPossibilities = Array.from(this.possibleStates[cy][cx]);

      // Union of valid neighbors for all current possibilities
      const allowedNeighbors = new Set<number>();
      for (const st of currentPossibilities) {
        for (const valid of VALID_NEIGHBORS[st] || []) {
          allowedNeighbors.add(valid);
        }
      }

      // Check 4 orthogonal neighbors
      const neighbors = [
        [cx + 1, cy],
        [cx - 1, cy],
        [cx, cy + 1],
        [cx, cy - 1],
      ];

      for (const [nx, ny] of neighbors) {
        if (nx >= 0 && nx < this.size && ny >= 0 && ny < this.size) {
          if (this.grid[ny][nx] === UNCOLLAPSED) {
            const neighborSet = this.possibleStates[ny][nx];
            let changed = false;

            for (const val of Array.from(neighborSet)) {
              if (!allowedNeighbors.has(val)) {
                neighborSet.delete(val);
                changed = true;
              }
            }

            if (neighborSet.size === 0) {
              this.contradiction = true;
            } else if (changed) {
              queue.push([nx, ny]);
            }
          }
        }
      }
    }
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.completed || this.contradiction) {
      if (action === "ACTION_PRIMARY" || action === "RESTART") {
        if (this.completed) this.level++;
        this.initSuperposition();
      }
      return;
    }

    if (action === "MOVE_LEFT") this.cursorX = Math.max(0, this.cursorX - 1);
    else if (action === "MOVE_RIGHT") this.cursorX = Math.min(this.size - 1, this.cursorX + 1);
    else if (action === "MOVE_UP") this.cursorY = Math.max(0, this.cursorY - 1);
    else if (action === "MOVE_DOWN") this.cursorY = Math.min(this.size - 1, this.cursorY + 1);
    else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      if (this.grid[this.cursorY][this.cursorX] === UNCOLLAPSED) {
        this.collapseTile(this.cursorX, this.cursorY);
      }
    } else if (action === "RESTART") {
      this.reset();
    }
  }

  public pause(): void { this.isPaused = true; }
  public resume(): void { this.isPaused = false; }
  public destroy(): void {}
  public getScore(): number { return this.score; }
  public getLevel(): number { return this.level; }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#050914");
    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const tileSize = 50;
    const offX = Math.floor((w - this.size * tileSize) / 2);
    const offY = 80;

    // Header HUD
    pr.drawText(`QUANTUM TILES (WFC)  •  STAGE ${this.level}`, w / 2, 30, {
      size: 13,
      color: "#4de8e8",
      align: "center",
    });
    pr.drawText(`[ARROWS] SELECT TILE    [SPACE/A] COLLAPSE SUPERPOSITION ENTROPY`, w / 2, 52, {
      size: 10,
      color: "#94a3b8",
      align: "center",
    });

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const x = offX + c * tileSize;
        const y = offY + r * tileSize;
        const state = this.grid[r][c];

        if (state === UNCOLLAPSED) {
          const entropy = this.possibleStates[r][c].size;
          pr.drawRect(x, y, tileSize - 2, tileSize - 2, "#0f172a", true);
          pr.drawRect(x, y, tileSize - 2, tileSize - 2, "#334155", false);
          pr.drawText(`Ψ ${entropy}`, x + tileSize / 2, y + tileSize / 2 + 5, {
            size: 11,
            color: "#a879ff",
            align: "center",
          });
        } else {
          let col = "#38bdf8";
          let label = "WATER";
          if (state === SAND) { col = "#f59e0b"; label = "SAND"; }
          else if (state === FOREST) { col = "#16a34a"; label = "FOREST"; }
          else if (state === MOUNTAIN) { col = "#64748b"; label = "PEAK"; }

          pr.drawRect(x, y, tileSize - 2, tileSize - 2, col, true);
          pr.drawText(label, x + tileSize / 2, y + tileSize / 2 + 4, {
            size: 9,
            color: "#ffffff",
            align: "center",
          });
        }
      }
    }

    // Cursor
    const cx = offX + this.cursorX * tileSize;
    const cy = offY + this.cursorY * tileSize;
    pr.drawRect(cx - 3, cy - 3, tileSize + 4, tileSize + 4, "#ffd84d", false);

    if (this.completed) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(6, 11, 24, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#4de8e8", false);
      pr.drawText("WAVE FUNCTION COLLAPSE COMPLETE!", w / 2, h / 2 - 10, { size: 16, color: "#4de8e8", align: "center" });
      pr.drawText("PRESS SPACE FOR NEXT QUANTUM MATRIX", w / 2, h / 2 + 18, { size: 11, color: "#e2e8f0", align: "center" });
    } else if (this.contradiction) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(6, 11, 24, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#ff5c8a", false);
      pr.drawText("QUANTUM CONTRADICTION / DECOHERENCE", w / 2, h / 2 - 10, { size: 16, color: "#ff5c8a", align: "center" });
      pr.drawText("PRESS SPACE TO REINITIALIZE", w / 2, h / 2 + 18, { size: 11, color: "#e2e8f0", align: "center" });
    }
  }
}
