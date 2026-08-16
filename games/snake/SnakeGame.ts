import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { getNextSnakeAIMove } from "./SnakeAI";
import { globalParticles } from "../../engine/particles/ParticleSystem";

interface PestMonster {
  col: number;
  row: number;
  timer: number;
}

export class SnakeGame implements GameInstance {
  private ctx!: GameContext;
  private cols: number = 20;
  private rows: number = 23;

  private body: GridCoord[] = [];
  private direction: GridCoord = { col: 1, row: 0 };
  private inputQueue: GridCoord[] = [];
  private food: GridCoord = { col: 10, row: 10 };
  private pests: PestMonster[] = [];

  private score: number = 0;
  private level: number = 1;
  private moveTimer: number = 0;
  private moveInterval: number = 0.11;
  private gameOver: boolean = false;
  private isPaused: boolean = false;
  public isAIMode: boolean = false;

  constructor() {}

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.score = 0;
    this.level = 1;
    this.gameOver = false;
    this.isPaused = false;
    this.direction = { col: 1, row: 0 };
    this.inputQueue = [];
    this.moveTimer = 0;
    this.moveInterval = 0.11;
    this.pests = [];

    const startCol = 6;
    const startRow = 11;
    this.body = [
      { col: startCol, row: startRow },
      { col: startCol - 1, row: startRow },
      { col: startCol - 2, row: startRow },
    ];

    this.spawnFood();
  }

  private spawnFood(): void {
    const emptyCells: GridCoord[] = [];
    const occupied = new Set(this.body.map((b) => `${b.col},${b.row}`));
    for (const p of this.pests) {
      occupied.add(`${p.col},${p.row}`);
    }

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!occupied.has(`${c},${r}`)) {
          emptyCells.push({ col: c, row: r });
        }
      }
    }

    if (emptyCells.length > 0) {
      this.food = this.ctx.random.choice(emptyCells);
    }
  }

  public update(dt: number): void {
    globalParticles.update(dt);
    if (this.gameOver || this.isPaused) return;

    this.moveTimer += dt;

    // Check pest monster spawns when body length >= 5
    if (this.body.length >= 5 && this.pests.length === 0) {
      this.pests.push({ col: this.cols - 2, row: 2, timer: 0 });
    }
    if (this.body.length >= 10 && this.pests.length === 1) {
      this.pests.push({ col: 2, row: this.rows - 3, timer: 0 });
    }

    // Update Pest AI (hunt food)
    for (const pest of this.pests) {
      pest.timer += dt;
      if (pest.timer >= 0.28) {
        pest.timer = 0;
        const dx = this.food.col - pest.col;
        const dy = this.food.row - pest.row;
        if (Math.abs(dx) > Math.abs(dy)) {
          pest.col += dx > 0 ? 1 : -1;
        } else if (dy !== 0) {
          pest.row += dy > 0 ? 1 : -1;
        } else if (dx !== 0) {
          pest.col += dx > 0 ? 1 : -1;
        }

        // Clamp
        pest.col = Math.max(0, Math.min(this.cols - 1, pest.col));
        pest.row = Math.max(0, Math.min(this.rows - 1, pest.row));

        // Pest steals food!
        if (pest.col === this.food.col && pest.row === this.food.row) {
          this.ctx.audio.playExplosion();
          globalParticles.emitBurst(
            (this.food.col + 0.5) * 29 + 10,
            (this.food.row + 0.5) * 29 + 16,
            12,
            ["#EF4444", "#991B1B", "#F59E0B"],
            50,
            180
          );
          globalParticles.emitText(
            "STOLEN!",
            (this.food.col + 0.5) * 29 + 10,
            this.food.row * 29 + 10,
            "#EF4444",
            14
          );
          this.spawnFood();
        }
      }
    }

    if (this.isAIMode) {
      const aiMove = getNextSnakeAIMove(this.body[0], this.food, this.body, this.cols, this.rows);
      if (aiMove) this.handleDirectionInput(aiMove);
    }

    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      if (this.inputQueue.length > 0) {
        this.direction = this.inputQueue.shift()!;
      }
      this.step();
    }
  }

  private step(): void {
    const head = this.body[0];
    const newHead: GridCoord = {
      col: head.col + this.direction.col,
      row: head.row + this.direction.row,
    };

    // Wall collision
    if (
      newHead.col < 0 ||
      newHead.col >= this.cols ||
      newHead.row < 0 ||
      newHead.row >= this.rows
    ) {
      this.triggerGameOver();
      return;
    }

    // Self collision (ignore tail end since it will vacate unless eating food)
    for (let i = 0; i < this.body.length - 1; i++) {
      if (this.body[i].col === newHead.col && this.body[i].row === newHead.row) {
        this.triggerGameOver();
        return;
      }
    }

    // Pest collision: Snake squashes the pest for big bonus!
    const pestIdx = this.pests.findIndex((p) => p.col === newHead.col && p.row === newHead.row);
    if (pestIdx !== -1) {
      this.score += 300;
      this.ctx.audio.playPowerUp();
      globalParticles.emitBurst(
        (newHead.col + 0.5) * 29 + 10,
        (newHead.row + 0.5) * 29 + 16,
        20,
        ["#F59E0B", "#FBBF24", "#FFFFFF"],
        80,
        260
      );
      globalParticles.emitText("+300 PEST CRUSH", (newHead.col + 0.5) * 29 + 10, newHead.row * 29 + 10, "#F59E0B", 16);
      this.pests.splice(pestIdx, 1);
    }

    this.body.unshift(newHead);

    // Food collision
    if (newHead.col === this.food.col && newHead.row === this.food.row) {
      const inc = 100 * this.level;
      this.score += inc;
      this.ctx.audio.playCoin();
      if (this.score % 500 === 0) {
        this.level++;
        this.moveInterval = Math.max(0.06, 0.11 - (this.level - 1) * 0.008);
      }
      globalParticles.emitBurst(
        (this.food.col + 0.5) * 29 + 10,
        (this.food.row + 0.5) * 29 + 16,
        18,
        ["#ffd84d", "#10b981", "#ffffff"],
        60,
        220
      );
      globalParticles.emitText(
        `+${inc}`,
        (this.food.col + 0.5) * 29 + 10,
        this.food.row * 29 + 10,
        "#ffd84d",
        16
      );
      this.spawnFood();
    } else {
      this.body.pop();
    }
  }

  private triggerGameOver(): void {
    this.gameOver = true;
    this.ctx.session.setStatus("game-over");
    this.ctx.audio.playGameOver();
  }

  private handleDirectionInput(action: GameAction): void {
    const lastDir = this.inputQueue.length > 0 ? this.inputQueue[this.inputQueue.length - 1] : this.direction;
    let next: GridCoord | null = null;

    switch (action) {
      case "MOVE_UP":
        if (lastDir.row !== 1 && lastDir.row !== -1) next = { col: 0, row: -1 };
        break;
      case "MOVE_DOWN":
        if (lastDir.row !== -1 && lastDir.row !== 1) next = { col: 0, row: 1 };
        break;
      case "MOVE_LEFT":
        if (lastDir.col !== 1 && lastDir.col !== -1) next = { col: -1, row: 0 };
        break;
      case "MOVE_RIGHT":
        if (lastDir.col !== -1 && lastDir.col !== 1) next = { col: 1, row: 0 };
        break;
    }

    if (next && this.inputQueue.length < 3) {
      this.inputQueue.push(next);
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    if (action === "ACTION_SECONDARY") {
      this.isAIMode = !this.isAIMode;
      return;
    }

    this.handleDirectionInput(action);
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
    return this.level;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#050a16");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    const cellSize = 29;
    const boardWidth = this.cols * cellSize;
    const boardHeight = this.rows * cellSize;
    const offX = Math.floor((w - boardWidth) / 2);
    const offY = Math.floor((h - boardHeight) / 2);

    // Outer cyber arena frame
    pr.drawRect(offX - 4, offY - 4, boardWidth + 8, boardHeight + 8, "#1e293b", true);
    pr.drawRect(offX - 2, offY - 2, boardWidth + 4, boardHeight + 4, "#0f172a", true);
    pr.drawRect(offX - 2, offY - 2, boardWidth + 4, boardHeight + 4, "#00F0FF", false);

    // Subtle neon grid
    pr.drawGrid(this.cols, this.rows, cellSize, "rgba(0, 240, 255, 0.05)", offX, offY);

    // Draw Apple Food (Ruby Red Apple with Emerald Leaf)
    const foodX = offX + this.food.col * cellSize;
    const foodY = offY + this.food.row * cellSize;
    pr.drawPixelBlock(foodX + 2, foodY + 4, cellSize - 4, "#EF4444", "#FCA5A5", "#991B1B");
    pr.drawRect(foodX + cellSize / 2 - 1, foodY + 1, 3, 4, "#10B981", true); // Leaf

    // Draw Pest Monsters (Purple-Red Roaming Bugs with Glowing Yellow Eyes)
    for (const pest of this.pests) {
      const px = offX + pest.col * cellSize;
      const py = offY + pest.row * cellSize;
      pr.drawPixelBlock(px + 2, py + 2, cellSize - 4, "#A855F7", "#E9D5FF", "#581C87");
      // Devil horns & eyes
      pr.drawRect(px + 6, py + 7, 4, 4, "#FACC15", true);
      pr.drawRect(px + cellSize - 10, py + 7, 4, 4, "#FACC15", true);
      pr.drawRect(px + 7, py + 8, 2, 2, "#000000", true);
      pr.drawRect(px + cellSize - 9, py + 8, 2, 2, "#000000", true);
    }

    // Draw Snake Body with Emerald/Cyan Scales & Animated Eyes
    this.body.forEach((seg, idx) => {
      const sx = offX + seg.col * cellSize;
      const sy = offY + seg.row * cellSize;
      const isHead = idx === 0;

      const baseColor = isHead ? "#10B981" : "#059669";
      const highlightColor = isHead ? "#6EE7B7" : "#34D399";
      const shadowColor = "#064E3B";

      pr.drawPixelBlock(sx + 1, sy + 1, cellSize - 2, baseColor, highlightColor, shadowColor);

      if (isHead) {
        const e1X = sx + (this.direction.row !== 0 ? 6 : (this.direction.col > 0 ? 18 : 6));
        const e1Y = sy + (this.direction.col !== 0 ? 6 : (this.direction.row > 0 ? 18 : 6));
        const e2X = sx + (this.direction.row !== 0 ? 18 : (this.direction.col > 0 ? 18 : 6));
        const e2Y = sy + (this.direction.col !== 0 ? 18 : (this.direction.row > 0 ? 18 : 6));

        pr.drawRect(e1X, e1Y, 5, 5, "#000000", true);
        pr.drawRect(e2X, e2Y, 5, 5, "#000000", true);
        pr.drawRect(e1X + 1, e1Y + 1, 2, 2, "#ffd84d", true);
        pr.drawRect(e2X + 1, e2Y + 1, 2, 2, "#ffd84d", true);
      }
    });

    // Render Global Particles & Score Popups
    globalParticles.render(pr);

    // AI Autopilot Floating Indicator
    if (this.isAIMode) {
      pr.drawRect(offX + 10, offY + 10, 220, 26, "rgba(8, 14, 28, 0.9)", true);
      pr.drawRect(offX + 10, offY + 10, 220, 26, "#00F0FF", false);
      pr.drawText("[ BFS AUTOPILOT: ACTIVE ]", offX + 120, offY + 28, {
        size: 11,
        color: "#00F0FF",
        align: "center",
        font: "monospace",
      });
    }

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(8, 14, 28, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("GAME OVER", w / 2, h / 2 - 10, {
        size: 28,
        color: "#FF3366",
        align: "center",
        font: "monospace",
      });
      pr.drawText("PRESS [R] TO RESTART", w / 2, h / 2 + 18, {
        size: 13,
        color: "#cbd5e1",
        align: "center",
        font: "monospace",
      });
    }
  }
}
