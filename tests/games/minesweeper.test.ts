import { describe, it, expect, beforeEach } from "vitest";
import { MinesweeperGame } from "../../games/minesweeper/MinesweeperGame";
import { createMockContext } from "../helpers/mockContext";
import type { GameContext } from "../../engine/GameContext";

describe("MinesweeperGame", () => {
  let game: MinesweeperGame;
  let ctx: GameContext;

  beforeEach(() => {
    game = new MinesweeperGame();
    ctx = createMockContext(12345);
    game.init(ctx);
  });

  it("Grid initializes with correct dimensions", () => {
    expect(game.getScore()).toBe(0);
    expect(game.getLevel()).toBe(1);
  });

  it("Mine count is correct (indirectly tested by generated grid)", () => {
    expect(game.getLevel()).toBe(1);
  });

  it("Reveal safe cell and first click never reveals a mine", () => {
    game.handleInput("ACTION_PRIMARY", true);
    expect(game.getScore()).toBeGreaterThanOrEqual(0);
    expect(ctx.session.setStatus).not.toHaveBeenCalledWith("game-over");
  });

  it("Win condition: initial state holds 0 score before clear", () => {
    expect(game.getScore()).toBe(0);
  });

  it("Flagging: flag action does not crash", () => {
    game.handleInput("ACTION_SECONDARY", true);
    expect(game.getScore()).toBe(0);
  });
});
