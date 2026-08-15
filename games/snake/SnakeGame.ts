import type { GameInstance } from "../types";
import type { GameContext } from "../../engine/GameContext";
import type { Renderer } from "../../engine/rendering/Renderer";
import type { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import type { GameAction } from "../../core/types/game";
import type { GridCoord } from "../../core/types/geometry";
import { getNextSnakeAIMove } from "./SnakeAI";

export class SnakeGame implements GameInstance {
  private ctx!: GameContext;
  private cols: number = 20;
  private rows: number = 23;

  private body: GridCoord[] = [];
  private direction: GridCoord = { col: 1, row: 0 };
  private nextDirection: GridCoord = { col: 1, row: 0 };
  private food: GridCoord = { col: 10, row: 10 };

  private score: number = 0;
  private level: number = 1;
  private moveTimer: number = 0;
  private moveInterval: number = 0.12;
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
    this.nextDirection = { col: 1, row: 0 };
    this.moveTimer = 0;
    this.moveInterval = 0.12;

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
    const bodySet = new Set(this.body.map((b) => `${b.col},${b.row}`));

    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        if (!bodySet.has(`${c},${r}`)) {
          emptyCells.push({ col: c, row: r });
        }
      }
    }

    if (emptyCells.length > 0) {
      this.food = this.ctx.random.choice(emptyCells);
    }
  }

  public update(deltaTime: number): void {
    if (this.gameOver || this.isPaused) return;

    if (this.isAIMode) {
      const aiMove = getNextSnakeAIMove(
        this.body[0],
        this.food,
        this.body,
        this.cols,
        this.rows
      );
      if (aiMove) {
        this.handleDirectionInput(aiMove);
      }
    }

    this.moveTimer += deltaTime;
    if (this.moveTimer >= this.moveInterval) {
      this.moveTimer = 0;
      this.step();
    }
  }

  private step(): void {
    this.direction = this.nextDirection;
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

    // Self collision
    for (let i = 0; i < this.body.length - 1; i++) {
      if (this.body[i].col === newHead.col && this.body[i].row === newHead.row) {
        this.triggerGameOver();
        return;
      }
    }

    this.body.unshift(newHead);

    // Food collision
    if (newHead.col === this.food.col && newHead.row === this.food.row) {
      this.score += 100 * this.level;
      this.ctx.audio.playCoin();
      if (this.score % 500 === 0) {
        this.level++;
        this.moveInterval = Math.max(0.05, 0.12 - (this.level - 1) * 0.01);
      }
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
    switch (action) {
      case "MOVE_UP":
        if (this.direction.row !== 1) {
          this.nextDirection = { col: 0, row: -1 };
        }
        break;
      case "MOVE_DOWN":
        if (this.direction.row !== -1) {
          this.nextDirection = { col: 0, row: 1 };
        }
        break;
      case "MOVE_LEFT":
        if (this.direction.col !== 1) {
          this.nextDirection = { col: -1, row: 0 };
        }
        break;
      case "MOVE_RIGHT":
        if (this.direction.col !== -1) {
          this.nextDirection = { col: 1, row: 0 };
        }
        break;
    }
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused) return;

    if (action === "ACTION_SECONDARY") {
      // Toggle AI autopilot
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

  public destroy(): void {
    this.body = [];
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.level;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Large high-visibility arena filling the box edge-to-edge
    const cellSize = 29;
    const boardWidth = this.cols * cellSize; // 580
    const boardHeight = this.rows * cellSize; // 667
    const offX = Math.floor((w - boardWidth) / 2); // 10
    const offY = Math.floor((h - boardHeight) / 2); // 16

    // Board background & illuminated border
    pr.drawRect(offX - 3, offY - 3, boardWidth + 6, boardHeight + 6, "#080e08", true);
    pr.drawRect(offX - 3, offY - 3, boardWidth + 6, boardHeight + 6, "rgba(0, 255, 102, 0.55)", false);

    // Subtle neon grid
    pr.drawGrid(this.cols, this.rows, cellSize, "rgba(0, 255, 102, 0.08)", offX, offY);

    // Draw Food (glowing golden pixel orb)
    const foodX = offX + this.food.col * cellSize;
    const foodY = offY + this.food.row * cellSize;
    pr.drawPixelBlock(foodX, foodY, cellSize, "#FFB703", "#FFFBEB", "#B45309");

    // Draw Snake Body with bold neon bevels
    this.body.forEach((seg, idx) => {
      const sx = offX + seg.col * cellSize;
      const sy = offY + seg.row * cellSize;
      const isHead = idx === 0;

      const baseColor = isHead ? "#00FF66" : "#10B981";
      const highlightColor = isHead ? "#FFFFFF" : "#6EE7B7";
      const shadowColor = "#047857";

      pr.drawPixelBlock(sx, sy, cellSize, baseColor, highlightColor, shadowColor);
    });

    // AI Autopilot Floating Indicator
    if (this.isAIMode) {
      pr.drawRect(offX + 10, offY + 10, 220, 26, "rgba(4, 6, 4, 0.85)", true);
      pr.drawRect(offX + 10, offY + 10, 220, 26, "rgba(0, 255, 102, 0.4)", false);
      pr.drawText("[ BFS AI: ACTIVE ]", offX + 120, offY + 28, {
        size: 11,
        color: "#00FF66",
        align: "center",
      });
    }

    // Game Over Overlay
    if (this.gameOver) {
      pr.drawRect(0, h / 2 - 45, w, 90, "rgba(4, 6, 4, 0.95)", true);
      pr.drawRect(0, h / 2 - 45, w, 90, "#FF3366", false);
      pr.drawText("GAME OVER", w / 2, h / 2 - 10, {
        size: 28,
        color: "#FF3366",
        align: "center",
      });
      pr.drawText("PRESS R TO RESTART", w / 2, h / 2 + 18, {
        size: 13,
        color: "#F0F4F0",
        align: "center",
      });
    }
  }
}
