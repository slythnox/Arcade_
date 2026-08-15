import { describe, it, expect } from "vitest";
import { MinesweeperBoard } from "../../games/minesweeper/MinesweeperBoard";
import { toggleFlag } from "../../games/minesweeper/MinesweeperLogic";
import { calculatePaddleReflection, testBallBrickCollision } from "../../games/breakout/BreakoutPhysics";
import { calculatePongPaddleReflection } from "../../games/pong/PongPhysics";
import { getNextSnakeAIMove } from "../../games/snake/SnakeAI";
import { Vector2 } from "../../core/math/vector";
import { RandomSource } from "../../core/math/random";

describe("All Classic Games Domain Logic", () => {
  it("Snake AI generates safe moves towards food", () => {
    const head = { col: 5, row: 5 };
    const food = { col: 7, row: 5 };
    const body = [head, { col: 4, row: 5 }, { col: 3, row: 5 }];

    const move = getNextSnakeAIMove(head, food, body, 20, 20);
    expect(move).toBe("MOVE_RIGHT");
  });

  it("Breakout paddle reflection calculates deflection based on offset", () => {
    const paddle = { x: 100, y: 300, width: 100, height: 10 };
    const ballPosCenter = new Vector2(150, 298); // exactly in center of paddle
    const velCenter = calculatePaddleReflection(ballPosCenter, 300, paddle);
    expect(velCenter.x).toBeCloseTo(0);
    expect(velCenter.y).toBeLessThan(0); // upward

    const ballPosRight = new Vector2(190, 298); // right side of paddle
    const velRight = calculatePaddleReflection(ballPosRight, 300, paddle);
    expect(velRight.x).toBeGreaterThan(0); // deflected to right
    expect(velRight.y).toBeLessThan(0);
  });

  it("Breakout brick collision detection", () => {
    const brick = { x: 50, y: 50, width: 40, height: 20 };
    const hitTest = testBallBrickCollision({ x: 70, y: 72, radius: 5 }, brick);
    expect(hitTest.hit).toBe(true);
    expect(hitTest.normal.y).toBe(1); // hit bottom of brick
  });

  it("Minesweeper board generation with first-click safety", () => {
    const board = new MinesweeperBoard(10, 10, 15);
    const rng = new RandomSource(1337);
    const firstClick = { col: 5, row: 5 };

    board.generate(firstClick, rng);
    expect(board.isGenerated).toBe(true);
    expect(board.grid[5][5].isMine).toBe(false);

    // Neighbors around firstClick should also be safe
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        expect(board.grid[5 + dr][5 + dc].isMine).toBe(false);
      }
    }

    // Flagging toggle
    const isFlagged = toggleFlag(board, { col: 0, row: 0 });
    expect(isFlagged).toBe(true);
    expect(board.grid[0][0].isFlagged).toBe(true);

    const isUnflagged = toggleFlag(board, { col: 0, row: 0 });
    expect(isUnflagged).toBe(false);
  });

  it("Pong paddle deflection", () => {
    const paddle = { x: 30, y: 100, width: 10, height: 60 };
    const reflected = calculatePongPaddleReflection(110, paddle, 200, true);
    expect(reflected.x).toBeGreaterThan(0); // moves right towards opponent
  });
});
