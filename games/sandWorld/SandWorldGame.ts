import { GameInstance } from "../types";
import { GameContext } from "../../engine/GameContext";
import { Renderer } from "../../engine/rendering/Renderer";
import { GameAction } from "../../core/types/game";

const WIDTH = 80;
const HEIGHT = 60;

const EMPTY = 0;
const SAND = 1;
const WATER = 2;
const STONE = 3;

export class SandWorldGame implements GameInstance {
  private ctx!: GameContext;
  private grid: Uint8Array;
  private nextGrid: Uint8Array;
  private cursorX: number = WIDTH / 2;
  private cursorY: number = HEIGHT / 2;
  private currentMaterial: number = SAND;
  private score: number = 0;
  private accumulator: number = 0;
  private tickRate: number = 1 / 60;

  constructor() {
    this.grid = new Uint8Array(WIDTH * HEIGHT);
    this.nextGrid = new Uint8Array(WIDTH * HEIGHT);
  }

  init(ctx: GameContext): void {
    this.ctx = ctx;
    this.reset();
  }

  reset(): void {
    this.grid.fill(EMPTY);
    this.score = 0;
    this.cursorX = Math.floor(WIDTH / 2);
    this.cursorY = Math.floor(HEIGHT / 2);
  }

  update(deltaTime: number): void {
    this.accumulator += deltaTime;
    while (this.accumulator >= this.tickRate) {
      this.accumulator -= this.tickRate;
      this.tick();
    }
  }

  private getIdx(x: number, y: number): number {
    return y * WIDTH + x;
  }

  private tick(): void {
    this.nextGrid.set(this.grid);
    // Process bottom to top
    for (let y = HEIGHT - 2; y >= 0; y--) {
      // Process left to right (or random order ideally, but this works)
      for (let x = 0; x < WIDTH; x++) {
        let idx = this.getIdx(x, y);
        let val = this.grid[idx];
        if (val === EMPTY || val === STONE) continue;

        let belowIdx = this.getIdx(x, y + 1);
        
        if (val === SAND) {
          if (this.nextGrid[belowIdx] === EMPTY || this.nextGrid[belowIdx] === WATER) {
            // Fall down, displace water
            if (this.nextGrid[belowIdx] === WATER) {
              this.nextGrid[idx] = WATER;
            } else {
              this.nextGrid[idx] = EMPTY;
            }
            this.nextGrid[belowIdx] = SAND;
          } else {
            let leftEmpty = x > 0 && this.nextGrid[belowIdx - 1] === EMPTY;
            let rightEmpty = x < WIDTH - 1 && this.nextGrid[belowIdx + 1] === EMPTY;
            
            if (leftEmpty && rightEmpty) {
              if (Math.random() < 0.5) {
                this.nextGrid[idx] = EMPTY;
                this.nextGrid[belowIdx - 1] = SAND;
              } else {
                this.nextGrid[idx] = EMPTY;
                this.nextGrid[belowIdx + 1] = SAND;
              }
            } else if (leftEmpty) {
              this.nextGrid[idx] = EMPTY;
              this.nextGrid[belowIdx - 1] = SAND;
            } else if (rightEmpty) {
              this.nextGrid[idx] = EMPTY;
              this.nextGrid[belowIdx + 1] = SAND;
            }
          }
        } else if (val === WATER) {
          if (this.nextGrid[belowIdx] === EMPTY) {
            this.nextGrid[idx] = EMPTY;
            this.nextGrid[belowIdx] = WATER;
          } else {
            let leftEmpty = x > 0 && this.nextGrid[idx - 1] === EMPTY;
            let rightEmpty = x < WIDTH - 1 && this.nextGrid[idx + 1] === EMPTY;
            
            if (leftEmpty && rightEmpty) {
              if (Math.random() < 0.5) {
                this.nextGrid[idx] = EMPTY;
                this.nextGrid[idx - 1] = WATER;
              } else {
                this.nextGrid[idx] = EMPTY;
                this.nextGrid[idx + 1] = WATER;
              }
            } else if (leftEmpty) {
              this.nextGrid[idx] = EMPTY;
              this.nextGrid[idx - 1] = WATER;
            } else if (rightEmpty) {
              this.nextGrid[idx] = EMPTY;
              this.nextGrid[idx + 1] = WATER;
            }
          }
        }
      }
    }
    this.grid.set(this.nextGrid);
  }

  handleInput(action: GameAction, isPressed: boolean): void {
    if (!isPressed) return;
    switch (action) {
      case "MOVE_UP":
        if (this.cursorY > 0) this.cursorY--;
        break;
      case "MOVE_DOWN":
        if (this.cursorY < HEIGHT - 1) this.cursorY++;
        break;
      case "MOVE_LEFT":
        if (this.cursorX > 0) this.cursorX--;
        break;
      case "MOVE_RIGHT":
        if (this.cursorX < WIDTH - 1) this.cursorX++;
        break;
      case "ACTION_PRIMARY":
        let idx = this.getIdx(this.cursorX, this.cursorY);
        if (this.grid[idx] === EMPTY && this.currentMaterial !== EMPTY) {
          this.score++;
        }
        this.grid[idx] = this.currentMaterial;
        break;
      case "ACTION_SECONDARY":
        this.currentMaterial = (this.currentMaterial + 1) % 4;
        break;
    }
  }

  render(renderer: Renderer): void {
    renderer.clear("#000000");
    const cellW = renderer.getWidth() / WIDTH;
    const cellH = renderer.getHeight() / HEIGHT;

    for (let y = 0; y < HEIGHT; y++) {
      for (let x = 0; x < WIDTH; x++) {
        let val = this.grid[this.getIdx(x, y)];
        if (val !== EMPTY) {
          let color = val === SAND ? "#C8A46A" : val === WATER ? "#4DA8DA" : "#8A8A8A";
          renderer.drawRect(x * cellW, y * cellH, cellW, cellH, color, true);
        }
      }
    }

    renderer.drawRect(this.cursorX * cellW, this.cursorY * cellH, cellW, cellH, "#FFFFFF", false);
    
    const matName = ["ERASE", "SAND", "WATER", "STONE"][this.currentMaterial];
    renderer.drawText(`Material: ${matName}`, 10, 20, { color: "#FFF", size: 16 });
  }

  pause(): void {}
  resume(): void {}
  destroy(): void {}
  getScore(): number { return this.score; }
  getLevel(): number { return 1; }
}
