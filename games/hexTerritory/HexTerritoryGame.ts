import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";

const NONE = 0;
const PLAYER = 1; // Cyan
const AI = 2; // Pink

interface HexCell {
  q: number;
  r: number;
  owner: number;
  power: number;
}

export class HexTerritoryGame implements GameInstance {
  private ctx!: GameContext;
  private readonly radius = 3; // Hex radius (37 total cells)
  private cells: Map<string, HexCell> = new Map();
  private cursorQ = 0;
  private cursorR = 0;
  private turn: "player" | "ai" = "player";
  private score = 0;
  private level = 1;
  private isPaused = false;
  private winner: number | null = null;

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) this.ctx.random.reset(seed);
    this.score = 0;
    this.level = 1;
    this.initBoard();
  }

  private key(q: number, r: number): string {
    return `${q},${r}`;
  }

  private initBoard(): void {
    this.cells.clear();
    this.winner = null;
    this.turn = "player";
    this.cursorQ = 0;
    this.cursorR = 0;

    for (let q = -this.radius; q <= this.radius; q++) {
      const r1 = Math.max(-this.radius, -q - this.radius);
      const r2 = Math.min(this.radius, -q + this.radius);
      for (let r = r1; r <= r2; r++) {
        this.cells.set(this.key(q, r), {
          q,
          r,
          owner: NONE,
          power: 1 + Math.floor(this.ctx.random.next() * 3),
        });
      }
    }

    // Starting headquarters
    const pStart = this.cells.get(this.key(-this.radius, 0));
    if (pStart) { pStart.owner = PLAYER; pStart.power = 4; }

    const aiStart = this.cells.get(this.key(this.radius, 0));
    if (aiStart) { aiStart.owner = AI; aiStart.power = 4; }
  }

  private getNeighbors(q: number, r: number): HexCell[] {
    const directions = [
      [1, 0], [1, -1], [0, -1],
      [-1, 0], [-1, 1], [0, 1],
    ];
    const res: HexCell[] = [];
    for (const [dq, dr] of directions) {
      const cell = this.cells.get(this.key(q + dq, r + dr));
      if (cell) res.push(cell);
    }
    return res;
  }

  private playMove(target: HexCell, player: number): boolean {
    if (target.owner === player) {
      // Reinforce
      target.power += 2;
      this.ctx.audio?.playRotate?.();
      return true;
    }

    // Check if adjacent to player's territory
    const neighbors = this.getNeighbors(target.q, target.r);
    const friendlyNeighbor = neighbors.find((n) => n.owner === player && n.power > 1);

    if (!friendlyNeighbor) return false;

    if (friendlyNeighbor.power > target.power) {
      // Conquered!
      target.owner = player;
      target.power = friendlyNeighbor.power - target.power;
      friendlyNeighbor.power = 1;
      this.ctx.audio?.playHit?.();
      if (player === PLAYER) this.score += 150;
      this.checkWinCondition();
      return true;
    } else {
      // Weakened
      target.power -= (friendlyNeighbor.power - 1);
      friendlyNeighbor.power = 1;
      this.ctx.audio?.playHit?.();
      return true;
    }
  }

  private checkWinCondition(): void {
    let pCount = 0;
    let aiCount = 0;
    for (const c of this.cells.values()) {
      if (c.owner === PLAYER) pCount++;
      if (c.owner === AI) aiCount++;
    }

    if (aiCount === 0) {
      this.winner = PLAYER;
      this.score += 3000 * this.level;
      this.ctx.audio?.playVictory?.();
    } else if (pCount === 0) {
      this.winner = AI;
      this.ctx.audio?.playExplosion?.();
    }
  }

  private triggerAIMove(): void {
    if (this.winner !== null) return;

    // AI finds best attack or reinforce move
    const aiCells = Array.from(this.cells.values()).filter((c) => c.owner === AI && c.power > 1);
    let bestTarget: HexCell | null = null;
    let maxAdvantage = -Infinity;

    for (const source of aiCells) {
      const neighbors = this.getNeighbors(source.q, source.r);
      for (const n of neighbors) {
        if (n.owner !== AI) {
          const adv = source.power - n.power;
          if (adv > maxAdvantage) {
            maxAdvantage = adv;
            bestTarget = n;
          }
        }
      }
    }

    if (bestTarget) {
      this.playMove(bestTarget, AI);
    } else if (aiCells.length > 0) {
      aiCells[0].power += 2;
    }

    this.turn = "player";
  }

  public update(_dt: number): void {}

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.isPaused) return;

    if (this.winner !== null) {
      if (action === "ACTION_PRIMARY" || action === "RESTART") {
        if (this.winner === PLAYER) this.level++;
        this.initBoard();
      }
      return;
    }

    if (action === "MOVE_LEFT") this.cursorQ = Math.max(-this.radius, this.cursorQ - 1);
    else if (action === "MOVE_RIGHT") this.cursorQ = Math.min(this.radius, this.cursorQ + 1);
    else if (action === "MOVE_UP") this.cursorR = Math.max(-this.radius, this.cursorR - 1);
    else if (action === "MOVE_DOWN") this.cursorR = Math.min(this.radius, this.cursorR + 1);
    else if (action === "ACTION_PRIMARY" || action === "CONFIRM") {
      const target = this.cells.get(this.key(this.cursorQ, this.cursorR));
      if (target && this.turn === "player") {
        const success = this.playMove(target, PLAYER);
        if (success && this.winner === null) {
          this.turn = "ai";
          setTimeout(() => this.triggerAIMove(), 320);
        }
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

    const hexSize = 34;
    const centerX = w / 2;
    const centerY = 310;

    // Header Status
    pr.drawText(`HEX TERRITORY  •  STAGE ${this.level}  •  TURN: ${this.turn.toUpperCase()}`, w / 2, 30, {
      size: 12,
      color: this.turn === "player" ? "#4de8e8" : "#ff5c8a",
      align: "center",
    });
    pr.drawText(`[ARROWS] SELECT HEX    [SPACE/A] EXPAND / CONQUER ADJACENT TERRITORY`, w / 2, 52, {
      size: 10,
      color: "#94a3b8",
      align: "center",
    });

    // Render Hexagonal Cells
    for (const cell of this.cells.values()) {
      // Axial to Pixel coordinates
      const px = centerX + hexSize * (Math.sqrt(3) * cell.q + (Math.sqrt(3) / 2) * cell.r);
      const py = centerY + hexSize * ((3 / 2) * cell.r);

      let col = "#1e293b";
      if (cell.owner === PLAYER) col = "#0e7490";
      else if (cell.owner === AI) col = "#be185d";

      pr.drawCircle(px, py, hexSize * 0.85, col, true);
      pr.drawCircle(px, py, hexSize * 0.85, cell.owner === PLAYER ? "#4de8e8" : cell.owner === AI ? "#ff5c8a" : "#334155", false);

      pr.drawText(`${cell.power}`, px, py + 5, {
        size: 12,
        color: "#ffffff",
        align: "center",
      });

      // Cursor
      if (cell.q === this.cursorQ && cell.r === this.cursorR && this.winner === null) {
        pr.drawCircle(px, py, hexSize * 0.95, "#ffd84d", false);
      }
    }

    if (this.winner !== null) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(6, 11, 24, 0.95)", true);
      const winCol = this.winner === PLAYER ? "#4de8e8" : "#ff5c8a";
      pr.drawRect(0, h / 2 - 45, w, 90, winCol, false);
      pr.drawText(this.winner === PLAYER ? "HEX SECTOR CONQUERED!" : "DEFEAT — SECTOR LOST", w / 2, h / 2 - 10, {
        size: 16,
        color: winCol,
        align: "center",
      });
      pr.drawText("PRESS SPACE TO CONTINUE", w / 2, h / 2 + 18, { size: 11, color: "#e2e8f0", align: "center" });
    }
  }
}
