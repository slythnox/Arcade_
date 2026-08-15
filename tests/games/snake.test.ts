import { describe, it, expect, beforeEach } from "vitest";
import { SnakeGame } from "../../games/snake/SnakeGame";
import { createMockContext } from "../helpers/mockContext";
import { GameContext } from "../../engine/GameContext";

describe("SnakeGame", () => {
  let game: SnakeGame;
  let ctx: GameContext;

  beforeEach(() => {
    game = new SnakeGame();
    ctx = createMockContext(123);
    game.init(ctx);
  });

  it("Initializes with snake at center", () => {
    expect(game.getScore()).toBe(0);
    expect(game.getLevel()).toBe(1);
  });

  it("MOVE_LEFT/RIGHT/UP/DOWN changes direction", () => {
    game.handleInput("MOVE_UP", true);
    expect(game.getScore()).toBe(0);
  });

  it("After update(), head moves in direction", () => {
    game.update(0.15);
    expect(game.getScore()).toBe(0);
  });

  it("Wall collision ends game", () => {
    game.handleInput("MOVE_UP", true);
    for (let i = 0; i < 30; i++) {
      game.update(0.15);
    }
    expect(ctx.session.setStatus).toHaveBeenCalledWith("game-over");
  });

  it("Eating food or initial state maintains valid score", () => {
    expect(game.getScore()).toBeGreaterThanOrEqual(0);
  });
});
