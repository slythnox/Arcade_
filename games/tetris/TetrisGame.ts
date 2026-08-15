import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { PixelRenderer } from "../../engine/rendering/PixelRenderer";
import { GameAction } from "../../core/types/game";
import { TetrisBoard } from "./TetrisBoard";
import { TetrisPiece, TetrominoType, TETROMINO_SHAPES } from "./TetrisPiece";
import { tryRotateSRS } from "./TetrisRotation";
import { calculateLineScore, getGravityForLevel } from "./TetrisScoring";

export class TetrisGame implements GameInstance {
  private ctx!: GameContext;
  private board: TetrisBoard;
  private currentPiece: TetrisPiece | null = null;
  private nextPiece: TetrisPiece | null = null;
  private holdPieceType: TetrominoType | null = null;
  private canHold: boolean = true;

  private bag: TetrominoType[] = [];
  private score: number = 0;
  private level: number = 1;
  private lines: number = 0;

  private dropTimer: number = 0;
  private lockDelayTimer: number = 0;
  private isLocking: boolean = false;
  private gameOver: boolean = false;
  private isPaused: boolean = false;

  private cellSize: number = 24;
  private boardOffsetX: number = 120;
  private boardOffsetY: number = 40;

  constructor() {
    this.board = new TetrisBoard(10, 20);
  }

  public init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  public reset(seed?: number): void {
    if (seed !== undefined) {
      this.ctx.random.reset(seed);
    }
    this.board.reset();
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.gameOver = false;
    this.isPaused = false;
    this.canHold = true;
    this.holdPieceType = null;
    this.bag = [];

    this.spawnNextPiece();
    this.spawnNextPiece();
  }

  private getNextFromBag(): TetrominoType {
    if (this.bag.length === 0) {
      const allTypes: TetrominoType[] = ["I", "J", "L", "O", "S", "T", "Z"];
      this.bag = this.ctx.random.shuffle(allTypes);
    }
    return this.bag.pop()!;
  }

  private spawnNextPiece(): void {
    if (this.nextPiece === null) {
      const type = this.getNextFromBag();
      this.nextPiece = new TetrisPiece(type, 3, 0);
    }

    this.currentPiece = this.nextPiece;
    this.currentPiece.x = Math.floor((10 - this.currentPiece.getWidth()) / 2);
    this.currentPiece.y = 0;

    const nextType = this.getNextFromBag();
    this.nextPiece = new TetrisPiece(nextType, 3, 0);
    this.canHold = true;
    this.dropTimer = 0;
    this.isLocking = false;
    this.lockDelayTimer = 0;

    // Check immediately if top-out / game over
    if (!this.board.isValidPosition(this.currentPiece)) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playGameOver();
    }
  }

  public update(deltaTime: number): void {
    if (this.gameOver || this.isPaused || !this.currentPiece) return;

    const gravity = getGravityForLevel(this.level);
    this.dropTimer += deltaTime;

    if (this.dropTimer >= gravity) {
      this.dropTimer = 0;
      this.moveDown();
    }

    // Lock delay check
    if (this.isLocking) {
      this.lockDelayTimer += deltaTime;
      if (this.lockDelayTimer >= 0.5) {
        this.lockCurrentPiece();
      }
    }
  }

  private moveDown(): boolean {
    if (!this.currentPiece) return false;

    this.currentPiece.y++;
    if (!this.board.isValidPosition(this.currentPiece)) {
      this.currentPiece.y--;
      this.isLocking = true;
      return false;
    } else {
      this.isLocking = false;
      this.lockDelayTimer = 0;
      return true;
    }
  }

  private lockCurrentPiece(): void {
    if (!this.currentPiece) return;

    const shape = TETROMINO_SHAPES[this.currentPiece.type];
    const topOut = this.board.lockPiece(this.currentPiece, shape.color);
    this.ctx.audio.playDrop();

    if (topOut) {
      this.gameOver = true;
      this.ctx.session.setStatus("game-over");
      this.ctx.audio.playGameOver();
      return;
    }

    const clearedRows = this.board.clearLines();
    if (clearedRows.length > 0) {
      this.lines += clearedRows.length;
      const pts = calculateLineScore(clearedRows.length, this.level);
      this.score += pts;
      this.level = Math.floor(this.lines / 10) + 1;
      this.ctx.audio.playLineClear();
    }

    this.spawnNextPiece();
  }

  private hardDrop(): void {
    if (!this.currentPiece || this.gameOver || this.isPaused) return;

    let dropDistance = 0;
    while (this.board.isValidPosition(this.currentPiece)) {
      this.currentPiece.y++;
      dropDistance++;
    }
    this.currentPiece.y--;
    dropDistance--;

    this.score += dropDistance * 2;
    this.lockCurrentPiece();
  }

  private hold(): void {
    if (!this.canHold || !this.currentPiece || this.gameOver || this.isPaused) return;

    const currentType = this.currentPiece.type;
    if (this.holdPieceType === null) {
      this.holdPieceType = currentType;
      this.spawnNextPiece();
    } else {
      const prevHold = this.holdPieceType;
      this.holdPieceType = currentType;
      this.currentPiece = new TetrisPiece(prevHold, 3, 0);
      this.currentPiece.x = Math.floor((10 - this.currentPiece.getWidth()) / 2);
      this.currentPiece.y = 0;
    }

    this.canHold = false;
    this.ctx.audio.playRotate();
  }

  public handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed || this.gameOver || this.isPaused || !this.currentPiece) return;

    switch (action) {
      case "MOVE_LEFT":
        this.currentPiece.x--;
        if (!this.board.isValidPosition(this.currentPiece)) {
          this.currentPiece.x++;
        } else {
          this.ctx.audio.playMove();
        }
        break;

      case "MOVE_RIGHT":
        this.currentPiece.x++;
        if (!this.board.isValidPosition(this.currentPiece)) {
          this.currentPiece.x--;
        } else {
          this.ctx.audio.playMove();
        }
        break;

      case "MOVE_DOWN":
        if (this.moveDown()) {
          this.score += 1;
          this.ctx.audio.playMove();
        }
        break;

      case "ROTATE":
      case "MOVE_UP":
        if (tryRotateSRS(this.currentPiece, this.board, true)) {
          this.ctx.audio.playRotate();
        }
        break;

      case "ACTION_PRIMARY": // Hard Drop
        this.hardDrop();
        break;

      case "ACTION_SECONDARY": // Hold
        this.hold();
        break;
    }
  }

  public pause(): void {
    this.isPaused = true;
  }

  public resume(): void {
    this.isPaused = false;
  }

  public destroy(): void {
    this.currentPiece = null;
    this.nextPiece = null;
  }

  public getScore(): number {
    return this.score;
  }

  public getLevel(): number {
    return this.level;
  }

  public getLines(): number {
    return this.lines;
  }

  private calculateGhostY(): number {
    if (!this.currentPiece) return 0;
    const ghost = this.currentPiece.clone();
    while (this.board.isValidPosition(ghost)) {
      ghost.y++;
    }
    return ghost.y - 1;
  }

  public render(renderer: Renderer): void {
    const pr = renderer as PixelRenderer;
    pr.clear("#040604");

    const w = renderer.getWidth();
    const h = renderer.getHeight();

    // Large high-visibility 10x20 matrix layout
    this.cellSize = 31;
    const boardWidth = this.board.cols * this.cellSize; // 310px
    const boardHeight = this.board.rows * this.cellSize; // 620px

    this.boardOffsetX = 32;
    this.boardOffsetY = Math.floor((h - boardHeight) / 2); // 40px

    // Draw board background with glowing boundary
    pr.drawRect(
      this.boardOffsetX - 4,
      this.boardOffsetY - 4,
      boardWidth + 8,
      boardHeight + 8,
      "#080e08",
      true
    );
    pr.drawRect(
      this.boardOffsetX - 4,
      this.boardOffsetY - 4,
      boardWidth + 8,
      boardHeight + 8,
      "rgba(0, 255, 102, 0.55)",
      false
    );

    // Draw subtle grid
    pr.drawGrid(
      this.board.cols,
      this.board.rows,
      this.cellSize,
      "rgba(0, 255, 102, 0.08)",
      this.boardOffsetX,
      this.boardOffsetY
    );

    // Draw locked cells with glowing bevels
    for (let r = 0; r < this.board.rows; r++) {
      for (let c = 0; c < this.board.cols; c++) {
        const cell = this.board.grid[r][c];
        if (cell && cell.filled) {
          const color = cell.color || "#00FF66";
          pr.drawPixelBlock(
            this.boardOffsetX + c * this.cellSize,
            this.boardOffsetY + r * this.cellSize,
            this.cellSize,
            color,
            "rgba(255, 255, 255, 0.4)",
            "rgba(0, 0, 0, 0.5)"
          );
        }
      }
    }

    // Draw Ghost Piece
    if (this.currentPiece && !this.gameOver) {
      const ghostY = this.calculateGhostY();
      for (let r = 0; r < this.currentPiece.matrix.length; r++) {
        for (let c = 0; c < this.currentPiece.matrix[r].length; c++) {
          if (this.currentPiece.matrix[r][c] !== 0) {
            const gx = this.boardOffsetX + (this.currentPiece.x + c) * this.cellSize;
            const gy = this.boardOffsetY + (ghostY + r) * this.cellSize;
            pr.drawRect(gx + 1, gy + 1, this.cellSize - 2, this.cellSize - 2, "rgba(0, 255, 102, 0.28)", false);
          }
        }
      }

      // Draw Active Piece with neon glow bevels
      const shape = TETROMINO_SHAPES[this.currentPiece.type];
      for (let r = 0; r < this.currentPiece.matrix.length; r++) {
        for (let c = 0; c < this.currentPiece.matrix[r].length; c++) {
          if (this.currentPiece.matrix[r][c] !== 0) {
            const px = this.boardOffsetX + (this.currentPiece.x + c) * this.cellSize;
            const py = this.boardOffsetY + (this.currentPiece.y + r) * this.cellSize;
            pr.drawPixelBlock(px, py, this.cellSize, shape.color, shape.glowColor, shape.shadowColor);
          }
        }
      }
    }

    // Right Preview Panel (NEXT & HOLD)
    const previewX = this.boardOffsetX + boardWidth + 24; // 366
    const previewY = this.boardOffsetY;
    const boxWidth = 200;
    const boxHeight = 120;

    // NEXT Box
    pr.drawText("NEXT PIECE", previewX + 10, previewY + 18, { size: 12, color: "#00FF66" });
    pr.drawRect(previewX, previewY, boxWidth, boxHeight, "#080e08", true);
    pr.drawRect(previewX, previewY, boxWidth, boxHeight, "rgba(0, 255, 102, 0.35)", false);

    if (this.nextPiece) {
      const shape = TETROMINO_SHAPES[this.nextPiece.type];
      const pSize = 22;
      const offX = previewX + (boxWidth - this.nextPiece.matrix[0].length * pSize) / 2;
      const offY = previewY + 24 + (boxHeight - 24 - this.nextPiece.matrix.length * pSize) / 2;

      for (let r = 0; r < this.nextPiece.matrix.length; r++) {
        for (let c = 0; c < this.nextPiece.matrix[r].length; c++) {
          if (this.nextPiece.matrix[r][c] !== 0) {
            pr.drawPixelBlock(offX + c * pSize, offY + r * pSize, pSize, shape.color, shape.glowColor, shape.shadowColor);
          }
        }
      }
    }

    // HOLD Box
    const holdY = previewY + 140;
    pr.drawText("HOLD [C / SHIFT]", previewX + 10, holdY + 18, { size: 12, color: "#00FF66" });
    pr.drawRect(previewX, holdY, boxWidth, boxHeight, "#080e08", true);
    pr.drawRect(previewX, holdY, boxWidth, boxHeight, "rgba(0, 255, 102, 0.35)", false);

    if (this.holdPieceType) {
      const shape = TETROMINO_SHAPES[this.holdPieceType];
      const pSize = 22;
      const matrix = shape.matrix;
      const offX = previewX + (boxWidth - matrix[0].length * pSize) / 2;
      const offY = holdY + 24 + (boxHeight - 24 - matrix.length * pSize) / 2;

      for (let r = 0; r < matrix.length; r++) {
        for (let c = 0; c < matrix[r].length; c++) {
          if (matrix[r][c] !== 0) {
            pr.drawPixelBlock(offX + c * pSize, offY + r * pSize, pSize, shape.color, shape.glowColor, shape.shadowColor);
          }
        }
      }
    }

    // Controls hints inside canvas
    const ctrlY = holdY + 140;
    pr.drawRect(previewX, ctrlY, boxWidth, 140, "#080e08", true);
    pr.drawRect(previewX, ctrlY, boxWidth, 140, "rgba(0, 255, 102, 0.2)", false);
    pr.drawText("CONTROLS", previewX + 12, ctrlY + 22, { size: 11, color: "#00FF66" });
    pr.drawText("← → : MOVE", previewX + 12, ctrlY + 48, { size: 11, color: "#A3B3A3" });
    pr.drawText("↑ / Z : ROTATE", previewX + 12, ctrlY + 70, { size: 11, color: "#A3B3A3" });
    pr.drawText("SPACE : HARD DROP", previewX + 12, ctrlY + 92, { size: 11, color: "#A3B3A3" });
    pr.drawText("C / SHIFT : HOLD", previewX + 12, ctrlY + 114, { size: 11, color: "#A3B3A3" });

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
